import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { readFile } from 'node:fs/promises'

test('building and history panels render complete German and English information', async () => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' })
  const previousWindow = globalThis.window
  try {
    const { LanguageProvider } = await server.ssrLoadModule('/src/Language.jsx')
    const { Building } = await server.ssrLoadModule('/src/BuildingPanel.jsx')
    const { HistoryContext, HistoryLocation } = await server.ssrLoadModule('/src/HistoryPanels.jsx')
    const { features } = JSON.parse(await readFile(new URL('../public/geodata/bombardierung-1944.geojson', import.meta.url), 'utf8'))
    const render = (language, Component, props) => {
      globalThis.window = { localStorage: { getItem: () => language } }
      return renderToStaticMarkup(createElement(LanguageProvider, null, createElement(Component, props)))
    }
    const feature = { type: 'Sakrales Gebaeude', use: 'Aussichtsturm', height: 21.7, roofHeight: 477.3, year: 2025, egid: 1234 }
    const de = render('de', Building, { feature })
    const en = render('en', Building, { feature })
    assert.match(de, /Gebäudeinformationen/)
    assert.match(de, /Sakrales Gebäude/)
    assert.match(de, /477\.3 m ü\. M\./)
    assert.match(en, /Building information/)
    assert.match(en, /Religious building/)
    assert.match(en, /Observation tower/)
    assert.match(en, /477\.3 m above sea level/)
    assert.doesNotMatch(en, /Gebäude|Aussichtsturm|schliessen/)
    for (const [language, expected] of [['de', 'Historischer Hintergrund'], ['en', 'Historical background']]) {
      const html = render(language, HistoryContext, { onClose() {} })
      assert.ok(html.includes(expected))
      assert.ok(html.includes(`locale=${language}`))
      assert.equal((html.match(/<li>/g) ?? []).length, 4)
    }
    const selected = render('en', HistoryLocation, { locations: features.slice(0, 3), selected: features[0] })
    assert.match(selected, /1 April 1944/)
    assert.match(selected, /Source ID/)
    assert.match(selected, /All locations in this group/)
    assert.doesNotMatch(selected, /Sprengbombe|Brandbombe|Einschlag/)
    const group = render('en', HistoryLocation, { locations: features.slice(0, 3) })
    assert.match(group, /Impact locations \(3\)/)
    assert.equal((group.match(/<li>/g) ?? []).length, 3)
    assert.doesNotMatch(group, /Sprengbombe|Brandbombe|Einschlag/)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
    await server.close()
  }
})
