import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Cartesian3, Cartographic, JulianDate, Math as CesiumMath } from 'cesium'
import { loadHistory } from '../src/historyScene.js'
import { createPlaces } from '../src/placesScene.js'
import { viewpoints } from '../src/viewpoints.js'

const root = new URL('../public/geodata/', import.meta.url)
const historyData = await readFile(new URL('bombardierung-1944.geojson', root), 'utf8')

test('all 354 impact locations retain their source identity and valid display positions', async () => {
  const url = `data:application/json,${encodeURIComponent(historyData)}`
  let renders = 0
  const { layer, locations } = await loadHistory(url, undefined, () => { renders++ })
  assert.equal(layer.entities.values.length, 354)
  assert.equal(locations.size, 354)
  assert.equal(new Set([...locations.values()].map(({ properties }) => properties.uuid)).size, 354)
  const time = JulianDate.now()
  for (const [entity, feature] of locations) {
    assert.equal(entity.id, String(feature.id))
    const position = Cartographic.fromCartesian(entity.position.getValue(time))
    assert.ok(Math.abs(CesiumMath.toDegrees(position.longitude) - feature.geometry.coordinates[0]) < 1e-7)
    assert.ok(Math.abs(CesiumMath.toDegrees(position.latitude) - feature.geometry.coordinates[1]) < 1e-7)
    assert.ok(Math.abs(position.height - feature.properties.groundHeightWgs84 - 2) < 1e-5)
    assert.equal(entity.point.disableDepthTestDistance.getValue(time), Infinity)
  }
  const entities = layer.entities.values.slice(0, 3)
  const cluster = { label: {} }
  layer.clustering.clusterEvent.raiseEvent(entities, cluster)
  assert.equal(cluster.label.text, '3')
  assert.equal(cluster.label.show, true)
  assert.equal(cluster.label.disableDepthTestDistance, Infinity)
  assert.equal(renders, 1, 'new cluster glyphs must request another frame in requestRenderMode')
  assert.deepEqual(entities.map((entity) => locations.get(entity).id), [1, 2, 3])
})

test('all named destinations have distinct, clickable map markers inside the expanded area', async () => {
  const area = JSON.parse(await readFile(new URL('gebiet.json', root), 'utf8'))
  assert.deepEqual(area.boundsLv95, [2685000, 1276000, 2691000, 1285000])
  const { layer, destinations } = createPlaces()
  assert.equal(layer.entities.values.length, 8)
  const time = JulianDate.now()
  for (const key of ['oldTown', 'munot', 'rhine', 'neuhausen', 'rhineFalls', 'rheinau', 'doubleBend', 'celticRampart']) {
    const entity = layer.entities.getById(`place-${key}`)
    assert.equal(destinations.get(entity), key)
    assert.equal(entity.label.text.getValue(time), viewpoints[key].label)
    const [lon, lat, height] = viewpoints[key].position
    assert.ok(Cartesian3.equalsEpsilon(entity.position.getValue(time), Cartesian3.fromDegrees(lon, lat, height), 1e-9))
    assert.ok(lon > 8.58 && lon < 8.649 && lat > 47.63 && lat < 47.71)
  }
})
