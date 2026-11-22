import { Cartesian3, Color, CustomDataSource, HorizontalOrigin } from 'cesium'

const markerColor = Color.fromCssColorString('#93d6e8')
const markerOutline = Color.fromCssColorString('#173440')

export async function loadHistory(url, signal, requestRender = () => {}) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Bombardierung 1944: HTTP ${response.status}`)
  const { features } = await response.json()
  const layer = new CustomDataSource('Bombardierung 1944')
  const locations = new Map()
  layer.clustering.enabled = true
  layer.clustering.pixelRange = 12
  layer.clustering.minimumClusterSize = 2
  layer.clustering.clusterEvent.addEventListener((entities, cluster) => {
    const { label } = cluster
    label.show = true
    label.text = String(entities.length)
    label.font = '600 14px sans-serif'
    label.fillColor = markerOutline
    label.showBackground = true
    label.backgroundColor = markerColor
    label.horizontalOrigin = HorizontalOrigin.CENTER
    label.disableDepthTestDistance = Infinity
    requestRender()
  })

  for (const feature of features) {
    const { id, geometry, properties } = feature
    const entity = layer.entities.add({
      id: String(id),
      position: Cartesian3.fromDegrees(...geometry.coordinates, properties.groundHeightWgs84 + 2),
      point: {
        pixelSize: 11, color: markerColor, outlineColor: markerOutline, outlineWidth: 2,
        disableDepthTestDistance: Infinity,
      },
    })
    locations.set(entity, feature)
  }
  return { layer, locations }
}
