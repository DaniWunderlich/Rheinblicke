import {
  Cartesian2, Cartesian3, Color, CustomDataSource, DistanceDisplayCondition,
  LabelStyle, VerticalOrigin,
} from 'cesium'
import { viewpoints } from './viewpoints.js'

export function createPlaces() {
  const layer = new CustomDataSource('Aussichtspunkte')
  const destinations = new Map()
  for (const [key, view] of Object.entries(viewpoints)) {
    if (!view.position) continue
    const entity = layer.entities.add({
      id: `place-${key}`,
      position: Cartesian3.fromDegrees(...view.position),
      point: {
        pixelSize: 10, color: Color.fromCssColorString('#d7eea6'),
        outlineColor: Color.fromCssColorString('#152126'), outlineWidth: 2,
        disableDepthTestDistance: Infinity,
      },
      label: {
        text: view.label, font: '16px sans-serif', style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.fromCssColorString('#eff2ec'), outlineColor: Color.fromCssColorString('#152126'),
        outlineWidth: 3, verticalOrigin: VerticalOrigin.BOTTOM, pixelOffset: new Cartesian2(0, -12),
        disableDepthTestDistance: Infinity,
        distanceDisplayCondition: new DistanceDisplayCondition(1100, 60000),
      },
    })
    destinations.set(entity, key)
  }
  return { layer, destinations }
}
