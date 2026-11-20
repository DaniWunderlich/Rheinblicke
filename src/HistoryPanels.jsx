const catalog = 'https://opendata.swiss/de/dataset/bombardierung-schaffhausen-kanton-schaffhausen'
const coordinates = new Intl.NumberFormat('de-CH', { minimumFractionDigits: 5, maximumFractionDigits: 5 })

export function HistorySource({ children = 'Kanton Schaffhausen · Geodatensatz' }) {
  return <a href={catalog} target="_blank" rel="noreferrer">{children}</a>
}

function HistoryPanel({ heading, label, onClose, children }) {
  return (
    <section className="panel history-panel" aria-label={label}>
      <div className="info-title">
        <h2>{heading}</h2>
        <button className="icon close" type="button" aria-label={`${label} schliessen`} onClick={onClose}>×</button>
      </div>
      {children}
    </section>
  )
}

export function HistoryContext({ onClose }) {
  return (
    <HistoryPanel heading="Bombardierung vom 1. April 1944" label="Historische Einordnung" onClose={onClose}>
      <p>Am Vormittag des 1. April 1944 bombardierten US-amerikanische Flugzeuge Schaffhausen irrtümlich. Die Stadt lag in der neutralen Schweiz.</p>
      <p>40 Menschen kamen ums Leben, zahlreiche weitere wurden verletzt. Die Bombardierung beschädigte oder zerstörte viele Gebäude, darunter auch Teile des Museums zu Allerheiligen.</p>
      <p>Die Karte zeigt die in historischen Quellen dokumentierten Einschlagorte. Der kantonale Datensatz erfasst einen Teil aller Einschläge.</p>
      <ul className="history-links">
        <li><a href="https://www.admin.ch/de/nsb?id=90865" target="_blank" rel="noreferrer">Gedenkanlass des Bundes</a></li>
        <li><a href="https://allerheiligen.ch/wp-content/uploads/2019/05/Booklet-Kunst-aus-Truemmern.pdf" target="_blank" rel="noreferrer">Museum zu Allerheiligen (PDF)</a></li>
        <li><a href="https://www.stadtarchiv-schaffhausen.ch/online_archivp/daten/sharch3_d5.php?level1_ID=9&level2_ID=19&level3_ID=384&level4_ID=2449&startSequence=1" target="_blank" rel="noreferrer">Bildbestand des Stadtarchivs</a></li>
        <li><HistorySource /></li>
      </ul>
    </HistoryPanel>
  )
}

export function HistoryLocation({ locations, selected, onSelect, onClose }) {
  const location = selected ?? (locations.length === 1 ? locations[0] : null)
  const [lon, lat] = location?.geometry.coordinates ?? []
  return (
    <HistoryPanel heading={location ? `Einschlagort ${location.id}` : `${locations.length} Einschlagorte`}
      label="Einschlaginformationen" onClose={onClose}>
      {location ? (
        <>
          {locations.length > 1 && <button type="button" className="history-button" onClick={() => onSelect(null)}>Alle Orte dieser Gruppe</button>}
          <dl>
            {location.properties.typ && <div><dt>Typ gemäss Quelle</dt><dd>{location.properties.typ}</dd></div>}
            <div><dt>Datum</dt><dd>1. April 1944</dd></div>
            <div><dt>Position (WGS 84)</dt><dd>{coordinates.format(lat)}° N<br />{coordinates.format(lon)}° E</dd></div>
            {location.properties.uuid && <div><dt>Quell-ID</dt><dd>{location.properties.uuid}</dd></div>}
          </dl>
        </>
      ) : (
        <ul className="history-locations">
          {locations.map((item) => (
            <li key={item.id}>
              <button type="button" className="history-button" onClick={() => onSelect(item)}>
                {item.properties.typ ? `${item.properties.typ} · Ort ${item.id}` : `Einschlagort ${item.id}`}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="source"><HistorySource /></p>
    </HistoryPanel>
  )
}
