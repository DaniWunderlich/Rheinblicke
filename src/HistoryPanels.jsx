import { useLanguage } from './Language'
import { sourceValue } from './i18n.js'
import { links } from './links.js'

export function HistorySource({ children }) {
  const { language, t } = useLanguage()
  return <a href={language === 'de' ? links.catalogDe : links.catalogEn} target="_blank" rel="noreferrer">{children ?? t.source}</a>
}

function HistoryPanel({ heading, label, onClose, children }) {
  const { t } = useLanguage()
  return (
    <section className="panel history-panel" aria-label={label}>
      <div className="info-title">
        <h2>{heading}</h2>
        <button className="icon close" type="button" aria-label={`${t.close}: ${label}`} onClick={onClose}>×</button>
      </div>
      {children}
    </section>
  )
}

export function HistoryContext({ onClose }) {
  const { t } = useLanguage()
  return (
    <HistoryPanel heading={t.historyHeading} label={t.context} onClose={onClose}>
      {t.historyText.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <ul className="history-links">
        <li><a href={links.federal} target="_blank" rel="noreferrer">{t.federalSource}</a></li>
        <li><a href={links.museum} target="_blank" rel="noreferrer">{t.museumSource}</a></li>
        <li><a href={links.archive} target="_blank" rel="noreferrer">{t.archiveSource}</a></li>
        <li><HistorySource /></li>
      </ul>
    </HistoryPanel>
  )
}

export function HistoryLocation({ locations, selected, onSelect, onClose }) {
  const { language, locale, t } = useLanguage()
  const coordinates = new Intl.NumberFormat(locale, { minimumFractionDigits: 5, maximumFractionDigits: 5 })
  const location = selected ?? (locations.length === 1 ? locations[0] : null)
  const [lon, lat] = location?.geometry.coordinates ?? []
  return (
    <HistoryPanel heading={location ? `${t.impact} ${location.id}` : `${t.impacts} (${locations.length})`}
      label={t.impactInfo} onClose={onClose}>
      {location ? (
        <>
          {locations.length > 1 && <button type="button" className="history-button" onClick={() => onSelect(null)}>{t.allLocations}</button>}
          <dl>
            {location.properties.typ && <div><dt>{t.sourceType}</dt><dd>{sourceValue(location.properties.typ, language)}</dd></div>}
            <div><dt>{t.date}</dt><dd>{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date('1944-04-01T00:00:00Z'))}</dd></div>
            <div><dt>{t.position}</dt><dd>{coordinates.format(lat)}° N<br />{coordinates.format(lon)}° E</dd></div>
            {location.properties.uuid && <div><dt>{t.sourceId}</dt><dd>{location.properties.uuid}</dd></div>}
          </dl>
        </>
      ) : (
        <ul className="history-locations">
          {locations.map((item) => (
            <li key={item.id}>
              <button type="button" className="history-button" onClick={() => onSelect(item)}>
                {item.properties.typ ? `${sourceValue(item.properties.typ, language)} · ${t.location} ${item.id}` : `${t.impact} ${item.id}`}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="source"><HistorySource /></p>
    </HistoryPanel>
  )
}
