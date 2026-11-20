import {
  Axis, CameraEventType, Cartesian3, Cesium3DTileFeature, Cesium3DTileset,
  Color, Credit, CreditDisplay, HeadingPitchRange, KeyboardEventModifier, Math as CesiumMath, Matrix4, Model,
  ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer,
} from 'cesium'
import { loadHistory } from './historyScene'

const staticRoot = new URL(import.meta.env.BASE_URL, document.baseURI)
globalThis.CESIUM_BASE_URL = new URL('cesium/', staticRoot).href
CreditDisplay.cesiumCredit = new Credit('<a href="https://cesium.com/platform/cesiumjs/" target="_blank" rel="noreferrer">CesiumJS</a>', true)
const dataUrl = (name) => new URL(`geodata/${name}`, staticRoot).href

export const viewpoints = {
  overview: { label: 'Übersicht', heading: 328, pitch: -55, range: 1940 },
  oldTown: { label: 'Altstadt', position: [8.6339, 47.69645, 455], heading: 340, pitch: -52, range: 760 },
  munot: { label: 'Munot', position: [8.64024, 47.69687, 497], heading: 321, pitch: -39, range: 460 },
  rhine: { label: 'Rheinufer', position: [8.6355, 47.69375, 444], heading: 307, pitch: -38, range: 760 },
}

const historyView = { position: [8.6282, 47.6957, 455], heading: 345, pitch: -58, range: 1830 }

const fields = ['uuid', 'name', 'type', 'use', 'egid', 'height', 'roofHeight', 'year']
const selectedColor = Color.fromCssColorString('#ffcf57')

export function createScene(container, credits, callbacks) {
  const viewer = new Viewer(container, {
    animation: false, timeline: false, baseLayerPicker: false, baseLayer: false,
    geocoder: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false,
    selectionIndicator: false, infoBox: false, fullscreenButton: false,
    globe: false, skyBox: false, skyAtmosphere: false, scene3DOnly: true,
    requestRenderMode: true, maximumRenderTimeChange: Infinity,
    creditContainer: credits,
  })
  const { scene, camera } = viewer
  scene.backgroundColor = Color.fromCssColorString('#23333a')
  scene.highDynamicRange = false
  scene.fog.enabled = false
  scene.screenSpaceCameraController.minimumZoomDistance = 45
  scene.screenSpaceCameraController.maximumZoomDistance = 5500
  scene.screenSpaceCameraController.tiltEventTypes = [
    CameraEventType.MIDDLE_DRAG, CameraEventType.RIGHT_DRAG, CameraEventType.PINCH,
    { eventType: CameraEventType.LEFT_DRAG, modifier: KeyboardEventModifier.CTRL },
  ]
  scene.screenSpaceCameraController.zoomEventTypes = [CameraEventType.WHEEL, CameraEventType.PINCH]

  const input = new ScreenSpaceEventHandler(scene.canvas)
  let area
  let buildings
  let terrain
  let photo
  let photoRequest
  let history
  let historyRequest
  let showHistory = false
  let historySelection
  let selection
  let previousColor
  let showBuildings = true
  let showPhoto = false
  let disposed = false

  function focus(key, animate = true) {
    if (!area) return
    const view = key === 'history' ? historyView : viewpoints[key]
    const target = Cartesian3.fromDegrees(...(view.position ?? area.center))
    const offset = new HeadingPitchRange(CesiumMath.toRadians(view.heading),
      CesiumMath.toRadians(view.pitch), view.range * Math.max(1, 1 / camera.frustum.aspectRatio))
    if (animate) {
      camera.flyToBoundingSphere({ center: target, radius: 1 }, {
        offset, duration: 0.85, endTransform: Matrix4.IDENTITY,
      })
    } else {
      camera.lookAt(target, offset)
      camera.lookAtTransform(Matrix4.IDENTITY)
    }
    scene.requestRender()
  }

  function clearSelection() {
    if (selection) {
      selection.color = previousColor
      selection = undefined
      callbacks.onSelect(null)
    }
    if (historySelection) {
      historySelection = undefined
      callbacks.onHistorySelect(null)
    }
    scene.requestRender()
  }

  input.setInputAction(({ position }) => {
    const feature = scene.pick(position)
    clearSelection()
    if (showHistory && history) {
      const ids = Array.isArray(feature?.id) ? feature.id : [feature?.id]
      const locations = ids.map((entity) => history.locations.get(entity)).filter(Boolean)
      if (locations.length) {
        historySelection = locations.sort((a, b) => a.id - b.id)
        callbacks.onHistorySelect(historySelection)
        return
      }
    }
    if (!(feature instanceof Cesium3DTileFeature) || feature.primitive !== buildings) return
    selection = feature
    previousColor = Color.clone(feature.color)
    feature.color = selectedColor
    callbacks.onSelect(Object.fromEntries(fields.map((field) => [field, feature.getProperty(field)])))
    scene.requestRender()
  }, ScreenSpaceEventType.LEFT_CLICK)

  scene.postRender.addEventListener(() => callbacks.onHeading(camera.heading))
  scene.renderError.addEventListener((_, error) => callbacks.onError(error))

  async function addTerrain(name) {
    const model = await Model.fromGltfAsync({
      url: dataUrl(`${name}.glb`), modelMatrix: Matrix4.fromArray(area.transform),
      allowPicking: false, forwardAxis: Axis.X, enableVerticalExaggeration: false,
    })
    if (disposed) {
      model.destroy()
      return undefined
    }
    model.show = name === 'basiskarte' ? !showPhoto || !photo : showPhoto
    model.errorEvent.addEventListener((error) => callbacks.onError(error))
    scene.primitives.add(model)
    scene.requestRender()
    return model
  }

  async function setPhoto(visible) {
    showPhoto = visible
    if (visible && !photo && area) {
      photoRequest ??= addTerrain('luftbild').finally(() => { photoRequest = undefined })
      try {
        photo = await photoRequest
      } catch (error) {
        if (!disposed) callbacks.onPhotoError(error)
        showPhoto = false
      }
    }
    if (disposed) return
    if (photo) photo.show = showPhoto
    if (terrain) terrain.show = !showPhoto || !photo
    scene.requestRender()
  }

  const pendingHistory = new AbortController()

  async function setHistory(visible) {
    showHistory = visible
    if (!visible && historySelection) clearSelection()
    if (history) history.layer.show = visible
    scene.requestRender()
    if (!visible || history) return

    historyRequest ??= (async () => {
      const result = await loadHistory(dataUrl('bombardierung-1944.geojson'), pendingHistory.signal)
      if (disposed) return
      result.layer.show = showHistory
      await viewer.dataSources.add(result.layer)
      if (disposed) return
      history = result
      history.layer.show = showHistory
      scene.requestRender()
    })().catch((error) => {
      if (disposed || !showHistory) return
      showHistory = false
      callbacks.onHistoryError(error)
    }).finally(() => { historyRequest = undefined })
    return historyRequest
  }

  const pendingArea = new AbortController()
  const ready = (async () => {
    const response = await fetch(dataUrl('gebiet.json'), { signal: pendingArea.signal })
    if (!response.ok) throw new Error(`Gebietsdaten: HTTP ${response.status}`)
    area = await response.json()
    if (disposed) return
    focus('overview', false)
    await Promise.all([
      addTerrain('basiskarte').then((model) => { terrain = model }),
      Cesium3DTileset.fromUrl(dataUrl('tileset.json')).then((tileset) => {
        if (disposed) {
          tileset.destroy()
          return
        }
        buildings = scene.primitives.add(tileset)
        buildings.show = showBuildings
        buildings.tileFailed.addEventListener(({ url, message }) => {
          callbacks.onError(new Error(`${url}: ${message}`))
        })
        scene.requestRender()
      }),
    ])
    return area
  })()

  return {
    ready,
    focus,
    setPhoto,
    setHistory,
    clearSelection,
    setBuildings(visible) {
      showBuildings = visible
      if (buildings) buildings.show = visible
      if (!visible && selection) clearSelection()
      scene.requestRender()
    },
    zoom(closer) {
      if (!area) return
      const steps = Math.min(260, Math.max(20, (camera.positionCartographic.height - area.center[2]) * 0.21))
      const height = camera.positionCartographic.height - area.center[2]
      if (closer && height > 85) camera.zoomIn(steps)
      if (!closer && height < 3300) camera.zoomOut(steps)
      scene.requestRender()
    },
    north() {
      if (!area) return
      camera.setView({ orientation: { heading: 0, pitch: camera.pitch, roll: 0 } })
      scene.requestRender()
    },
    destroy() {
      disposed = true
      pendingArea.abort()
      pendingHistory.abort()
      input.destroy()
      viewer.destroy()
    },
  }
}
