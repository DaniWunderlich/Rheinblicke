import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JulianDate } from 'cesium'
import { initialLanguage, languageKey, messages, sourceValues, sourceValue } from '../src/i18n.js'
import { createPlaces } from '../src/placesScene.js'
import { viewpoints } from '../src/viewpoints.js'

test('saved language wins; unsupported and blocked storage fall back to a supported browser language', () => {
  const stored = (value) => ({ getItem(key) { assert.equal(key, languageKey); return value } })
  assert.equal(initialLanguage(stored('en'), ['de-CH']), 'en')
  assert.equal(initialLanguage(stored('de'), ['en-GB']), 'de')
  assert.equal(initialLanguage(stored('fr'), ['fr-CH', 'en-US']), 'en')
  assert.equal(initialLanguage(stored('toString'), ['de-CH']), 'de')
  assert.equal(initialLanguage({ getItem() { throw new Error('blocked') } }, ['en-GB']), 'en')
  assert.equal(initialLanguage(null, ['fr', 'it']), 'de')
})

test('both languages contain all interface messages and historical paragraphs', () => {
  assert.deepEqual(Object.keys(messages.de).sort(), Object.keys(messages.en).sort())
  for (const language of ['de', 'en']) {
    for (const value of Object.values(messages[language])) {
      if (Array.isArray(value)) assert.equal(value.length, 3)
      else assert.equal(typeof value, 'string')
      assert.ok(value.length > 0)
    }
    for (const view of Object.values(viewpoints)) assert.ok(view.labels[language])
  }
})

test('every classification in the shipped building and historical data has German and English display values', async () => {
  const binary = await readFile(new URL('../public/geodata/gebaeude.b3dm', import.meta.url))
  const offset = 28 + binary.readUInt32LE(12) + binary.readUInt32LE(16)
  const attributes = JSON.parse(binary.subarray(offset, offset + binary.readUInt32LE(20)).toString().trim())
  const history = JSON.parse(await readFile(new URL('../public/geodata/bombardierung-1944.geojson', import.meta.url), 'utf8'))
  const values = new Set([...attributes.type, ...attributes.use, ...history.features.map(({ properties }) => properties.typ)])
  for (const value of values) {
    if (!value) continue
    assert.ok(sourceValues[value], `missing classification: ${value}`)
    for (const language of ['de', 'en']) assert.ok(sourceValue(value, language))
  }
  assert.equal(sourceValue(null, 'en'), null)
  assert.equal(sourceValue('new type', 'en'), 'Source value: new type')
})

test('switching map labels preserves entities, destinations and positions', () => {
  const { layer, destinations, setLanguage } = createPlaces('en')
  const time = JulianDate.now()
  const entities = layer.entities.values.slice()
  const positions = entities.map((entity) => entity.position.getValue(time))
  for (const language of ['en', 'de', 'en']) {
    setLanguage(language)
    assert.deepEqual(layer.entities.values, entities)
    for (const [index, entity] of entities.entries()) {
      assert.equal(entity.label.text.getValue(time), viewpoints[destinations.get(entity)].labels[language])
      assert.deepEqual(entity.position.getValue(time), positions[index])
    }
  }
})
