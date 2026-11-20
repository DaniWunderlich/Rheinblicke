import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { createScene, viewpoints } from './scene'
import { HistoryContext, HistoryLocation, HistorySource } from './HistoryPanels'
import './style.css'

const number = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 1 })
const describe = (value) => value?.replace('Gebaeude', 'Gebäude').replaceAll('_', ' ')
const measured = (value, unit) => Number.isFinite(value) && value > 0 ? `${number.format(value)} ${unit}` : null

function Layers({ buildings, photo, history, disabled, onBuildings, onPhoto, onHistory, children }) {
  return (
    <section className="panel layers" aria-labelledby="layer-heading">
      <h2 id="layer-heading">Kartenlayer</h2>
      <label className="layer">
        <span className="swatch building-swatch" aria-hidden="true" />
        <span>3D-Gebäude</span>
        <input type="checkbox" role="switch" disabled={disabled} checked={buildings} onChange={(event) => onBuildings(event.target.checked)} />
      </label>
      <label className="layer">
        <span className="swatch photo-swatch" aria-hidden="true" />
        <span>Luftbild</span>
        <input type="checkbox" role="switch" disabled={disabled} checked={photo} onChange={(event) => onPhoto(event.target.checked)} />
      </label>
      <label className="layer">
        <span className="swatch history-swatch" aria-hidden="true" />
        <span>Bombardierung 1944</span>
        <input type="checkbox" role="switch" disabled={disabled} checked={history} onChange={(event) => onHistory(event.target.checked)} />
      </label>
      {children}
    </section>
  )
}

function Building({ feature, onClose }) {
  const properties = [
    ['Gebäude-ID (EGID)', feature.egid > 0 ? String(feature.egid) : null],
    ['Objektart', describe(feature.type)],
    ['Nutzung', describe(feature.use)],
    ['Gebäudehöhe', measured(feature.height, 'm')],
    ['Höchster Dachpunkt', measured(feature.roofHeight, 'm ü. M.')],
    ['Erfassungsjahr', feature.year > 0 ? String(feature.year) : null],
  ].filter(([, value]) => value)
  return (
    <section className="panel building-info" aria-label="Gebäudeinformationen">
      <div className="info-title">
        <h2>{feature.name || 'Ausgewähltes Gebäude'}</h2>
        <button className="icon close" type="button" aria-label="Gebäudeinformationen schliessen" onClick={onClose}>×</button>
      </div>
      <dl>
        {properties.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
      <p className="source">© swisstopo · swissBUILDINGS3D 3.0</p>
    </section>
  )
}

function App() {
  const map = useRef(null)
  const credits = useRef(null)
  const compass = useRef(null)
  const viewer = useRef(null)
  const [area, setArea] = useState(null)
  const [feature, setFeature] = useState(null)
  const [buildings, setBuildings] = useState(true)
  const [photo, setPhoto] = useState(false)
  const [history, setHistory] = useState(false)
  const [context, setContext] = useState(false)
  const [locations, setLocations] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [historyError, setHistoryError] = useState('')
  const [error, setError] = useState('')
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    let active = true
    let scene
    const showError = (cause) => {
      if (!active) return
      console.error(cause)
      setError('Das 3D-Modell konnte nicht vollständig geladen werden. Bitte lade die Seite neu und prüfe, ob dein Browser WebGL unterstützt.')
    }
    try {
      scene = createScene(map.current, credits.current, {
        onSelect: setFeature,
        onHistorySelect: (places) => {
          setLocations(places)
          setSelectedLocation(null)
          if (places) setContext(false)
        },
        onHistoryError: (cause) => {
          if (!active) return
          console.error(cause)
          setHistory(false)
          setContext(false)
          setHistoryError('Die historischen Geodaten konnten nicht geladen werden.')
        },
        onHeading: (heading) => {
          if (compass.current) compass.current.style.transform = `rotate(${-heading}rad)`
        },
        onError: showError,
        onPhotoError: (cause) => {
          if (!active) return
          console.error(cause)
          setPhoto(false)
          setPhotoError('Das Luftbild konnte nicht geladen werden.')
        },
      })
      viewer.current = scene
      scene.ready.then((result) => { if (active) setArea(result) }).catch(showError)
    } catch (cause) {
      showError(cause)
    }
    return () => {
      active = false
      viewer.current = null
      scene?.destroy()
    }
  }, [])

  return (
    <main className="app">
      <header className="topbar">
        <div className="title">
          <span className="title-icon" aria-hidden="true"><i /><i /><i /></span>
          <h1>Schaffhausen <span>3D</span></h1>
        </div>
        <nav className="viewpoints" aria-label="Aussichtspunkte">
          {Object.entries(viewpoints).map(([key, { label }]) => (
            <button type="button" key={key} disabled={!area} onClick={() => viewer.current?.focus(key)}>{label}</button>
          ))}
        </nav>
      </header>
      <div className="workspace">
        <div className="map" ref={map} role="region" aria-label="Interaktives 3D-Stadtmodell" />
        {error ? <p className="status" role="alert">{error}</p>
          : !area && <p className="status" role="status">3D-Stadtmodell wird geladen …</p>}
        {photoError && !error && <p className="status" role="status">{photoError}</p>}
        <div className="sidebar">
          <Layers buildings={buildings} photo={photo} history={history} disabled={!area}
            onBuildings={(value) => { setBuildings(value); viewer.current?.setBuildings(value) }}
            onPhoto={(value) => { setPhotoError(''); setPhoto(value); viewer.current?.setPhoto(value) }}
            onHistory={(value) => {
              setHistoryError('')
              setHistory(value)
              if (!value) setContext(false)
              viewer.current?.setHistory(value)
            }}>
            {history && (
              <div className="history-actions">
                <button type="button" className="history-button" onClick={() => viewer.current?.focus('history')}>Einschlagorte zeigen</button>
                <button type="button" className="history-button" aria-expanded={context} onClick={() => setContext(!context)}>Historische Einordnung</button>
              </div>
            )}
            {historyError && <p className="history-error" role="alert">{historyError}</p>}
          </Layers>
          {history && context && <HistoryContext onClose={() => setContext(false)} />}
          {history && locations && <HistoryLocation locations={locations} selected={selectedLocation}
            onSelect={setSelectedLocation} onClose={() => viewer.current?.clearSelection()} />}
          {feature && <Building feature={feature} onClose={() => viewer.current?.clearSelection()} />}
        </div>
        <div className="map-controls" aria-label="Kartensteuerung">
          <button className="icon north" type="button" aria-label="Nach Norden ausrichten" title="Nach Norden ausrichten" disabled={!area}
            onClick={() => viewer.current?.north()}><span ref={compass} aria-hidden="true">N</span></button>
          <div className="zoom">
            <button className="icon" type="button" aria-label="Vergrössern" title="Vergrössern" disabled={!area} onClick={() => viewer.current?.zoom(true)}>+</button>
            <button className="icon" type="button" aria-label="Verkleinern" title="Verkleinern" disabled={!area} onClick={() => viewer.current?.zoom(false)}>−</button>
          </div>
        </div>
        <footer className="map-footer">
          <p className="help">Ziehen zum Verschieben · Rechts ziehen zum Neigen und Drehen · Scrollen zum Zoomen</p>
          <div className="attribution">
            <a href="https://www.swisstopo.admin.ch/" target="_blank" rel="noreferrer">© swisstopo</a>
            {history && <HistorySource>Kanton SH</HistorySource>}
            <div ref={credits} className="cesium-credits" />
          </div>
        </footer>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
