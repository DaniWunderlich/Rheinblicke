import {
  Cartesian2, Cartesian3, Color, CustomDataSource, DistanceDisplayCondition,
  LabelStyle, VerticalOrigin,
} from 'cesium'
import { viewpoints } from './viewpoints.js'

export function createPlaces(language = 'de') {
  const layer = new CustomDataSource('places')
  const destinations = new Map()
  for (const [key, view] of Object.entries(viewpoints)) {
    if (!view.position) continue
    const entity = layer.entities.add({
      id: `place-${key}`,
      position: Cartesian3.fromDegrees(...view.position),
      point: {
        pixelSize: 9, color: Color.fromCssColorString('#f8faf9'),
        outlineColor: Color.fromCssColorString('#155b70'), outlineWidth: 2,
        disableDepthTestDistance: Infinity,
      },
      label: {
        text: view.labels[language], font: '16px sans-serif', style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.fromCssColorString('#ffffff'), outlineColor: Color.fromCssColorString('#243e49'),
        outlineWidth: 3, verticalOrigin: VerticalOrigin.BOTTOM, pixelOffset: new Cartesian2(0, -12),
        disableDepthTestDistance: Infinity,
        distanceDisplayCondition: new DistanceDisplayCondition(1100, 60000),
      },
    })
    destinations.set(entity, key)
  }
  return { layer, destinations, setLanguage(next) {
    for (const [entity, key] of destinations) entity.label.text = viewpoints[key].labels[next]
  } }
}
