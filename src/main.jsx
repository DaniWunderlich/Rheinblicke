import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { createScene, viewpoints } from './scene'
import { HistoryContext, HistoryLocation, HistorySource } from './HistoryPanels'
import { LanguageProvider, useLanguage } from './Language'
import { Building } from './BuildingPanel'
import { links } from './links.js'
import './style.css'

function Layers({ buildings, photo, history, disabled, onBuildings, onPhoto, onHistory, children }) {
  const { t } = useLanguage()
  return (
    <section className="panel layers" aria-labelledby="layer-heading">
      <h2 id="layer-heading">{t.layers}</h2>
      <label className="layer">
        <span className="swatch building-swatch" aria-hidden="true" />
        <span>{t.buildings}</span>
        <input type="checkbox" role="switch" disabled={disabled} checked={buildings} onChange={(event) => onBuildings(event.target.checked)} />
      </label>
      <label className="layer">
        <span className="swatch photo-swatch" aria-hidden="true" />
        <span>{t.photo}</span>
        <input type="checkbox" role="switch" disabled={disabled} checked={photo} onChange={(event) => onPhoto(event.target.checked)} />
      </label>
      <label className="layer">
        <span className="swatch history-swatch" aria-hidden="true" />
        <span>{t.history}</span>
        <input type="checkbox" role="switch" disabled={disabled} checked={history} onChange={(event) => onHistory(event.target.checked)} />
      </label>
      {children}
    </section>
  )
}


function App() {
  const { language, setLanguage, t } = useLanguage()
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
  const [activePlace, setActivePlace] = useState('overview')

  useEffect(() => {
    let active = true
    let scene
    const showError = (cause) => {
      if (!active) return
      console.error(cause)
      setError('modelError')
    }
    try {
      scene = createScene(map.current, credits.current, {
        onSelect: setFeature,
        onFocus: setActivePlace,
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
          setHistoryError('historyError')
        },
        onHeading: (heading) => {
          if (compass.current) compass.current.style.transform = `rotate(${-heading}rad)`
        },
        onError: showError,
        onPhotoError: (cause) => {
          if (!active) return
          console.error(cause)
          setPhoto(false)
          setPhotoError('photoError')
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

  useEffect(() => { viewer.current?.setLanguage(language) }, [language])

  return (
    <main className="app">
      <header className="topbar">
        <div className="title">
          <h1>Rheinblicke</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="language" role="group" aria-label={t.language}>
          {['de', 'en'].map((code) => <button key={code} type="button" lang={code} aria-pressed={language === code}
            onClick={() => setLanguage(code)}>{code === 'de' ? 'Deutsch' : 'English'}</button>)}
        </div>
      </header>
      <nav className="viewpoints" aria-label={t.viewpoints}>
        <span className="nav-label">{t.viewpoints}</span>
        {Object.entries(viewpoints).map(([key, view]) => (
          <button type="button" key={key} disabled={!area} aria-pressed={activePlace === key}
            onClick={() => { setActivePlace(key); viewer.current?.focus(key) }}>{view.labels[language]}</button>
        ))}
      </nav>
      <div className="workspace">
        <div className="map" ref={map} role="region" aria-label={t.map} tabIndex={0} aria-describedby="keyboard-help"
          onKeyDown={(event) => {
            if (!area || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '=', '-', 'n', 'N'].includes(event.key)) return
            event.preventDefault()
            viewer.current?.keyboard(event.key)
          }} />
        {error ? <p className="status" role="alert">{t[error]}</p>
          : !area && <p className="status" role="status">{t.loading}</p>}
        {photoError && !error && <p className="status" role="status">{t[photoError]}</p>}
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
                <button type="button" className="history-button" onClick={() => viewer.current?.focus('history')}>{t.showImpacts}</button>
                <button type="button" className="history-button" aria-expanded={context} onClick={() => setContext(!context)}>{t.context}</button>
              </div>
            )}
            {historyError && <p className="history-error" role="alert">{t[historyError]}</p>}
          </Layers>
          {history && context && <HistoryContext onClose={() => setContext(false)} />}
          {history && locations && <HistoryLocation locations={locations} selected={selectedLocation}
            onSelect={setSelectedLocation} onClose={() => viewer.current?.clearSelection()} />}
          {feature && <Building feature={feature} onClose={() => viewer.current?.clearSelection()} />}
        </div>
        <div className="map-controls" aria-label={t.controls}>
          <button className="icon north" type="button" aria-label={t.north} title={t.north} disabled={!area}
            onClick={() => viewer.current?.north()}><span ref={compass} aria-hidden="true">N</span></button>
          <div className="zoom">
            <button className="icon" type="button" aria-label={t.zoomIn} title={t.zoomIn} disabled={!area} onClick={() => viewer.current?.zoom(true)}>+</button>
            <button className="icon" type="button" aria-label={t.zoomOut} title={t.zoomOut} disabled={!area} onClick={() => viewer.current?.zoom(false)}>−</button>
          </div>
        </div>
        <footer className="map-footer">
          <p className="help"><span className="mouse-help">{t.help}</span><span className="touch-help">{t.touchHelp}</span></p>
          <p id="keyboard-help" className="sr-only">{t.keyboardHelp}</p>
          <div className="attribution">
            <a href={links.swisstopo} target="_blank" rel="noreferrer">© swisstopo</a>
            {history && <HistorySource>{t.canton}</HistorySource>}
            <div ref={credits} className="cesium-credits" />
          </div>
        </footer>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<LanguageProvider><App /></LanguageProvider>)
