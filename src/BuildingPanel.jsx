import { useLanguage } from './Language'
import { sourceValue } from './i18n.js'

export function Building({ feature, onClose }) {
  const { language, locale, t } = useLanguage()
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const measured = (value, unit) => Number.isFinite(value) && value > 0 ? `${number.format(value)} ${unit}` : null
  const properties = [
    [t.egid, feature.egid > 0 ? String(feature.egid) : null],
    [t.type, sourceValue(feature.type, language)],
    [t.use, sourceValue(feature.use, language)],
    [t.height, measured(feature.height, 'm')],
    [t.roof, measured(feature.roofHeight, t.elevationUnit)],
    [t.year, feature.year > 0 ? String(feature.year) : null],
  ].filter(([, value]) => value)
  return (
    <section className="panel building-info" aria-label={t.buildingInfo}>
      <div className="info-title">
        <h2>{feature.name || t.selectedBuilding}</h2>
        <button className="icon close" type="button" aria-label={`${t.close}: ${t.buildingInfo}`} onClick={onClose}>×</button>
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
