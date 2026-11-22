export const locales = { de: 'de-CH', en: 'en-GB' }
export const languageKey = 'rheinblicke.language'

export function initialLanguage(storage, languages = []) {
  try {
    const saved = storage?.getItem(languageKey)
    if (Object.hasOwn(locales, saved)) return saved
  } catch { /* Private browsing can deny access to storage. */ }
  return languages.map((language) => language.split('-')[0]).find((language) => Object.hasOwn(locales, language)) ?? 'de'
}

export const messages = {
  de: {
    subtitle: 'Schaffhausen und die Rheinregion', description: 'Schaffhausen und die Rheinregion als interaktive 3D-Karte mit amtlichen Geodaten und historischen Einschlagorten.',
    language: 'Sprache / Language', viewpoints: 'Orte erkunden', map: 'Interaktive 3D-Karte',
    layers: 'Karteninhalt', buildings: '3D-Gebäude', photo: 'Luftbild', history: 'Bombardierung 1944',
    showImpacts: 'Einschlagorte zeigen', context: 'Historischer Hintergrund',
    modelError: 'Das 3D-Modell konnte nicht vollständig geladen werden. Bitte lade die Seite neu und prüfe, ob dein Browser WebGL unterstützt.',
    photoError: 'Das Luftbild konnte nicht geladen werden.', historyError: 'Die historischen Geodaten konnten nicht geladen werden.', loading: 'Stadt und Landschaft werden geladen …',
    buildingInfo: 'Gebäudeinformationen', selectedBuilding: 'Ausgewähltes Gebäude', egid: 'Gebäude-ID (EGID)', type: 'Objektart', use: 'Nutzung', height: 'Gebäudehöhe', roof: 'Höchster Dachpunkt', year: 'Erfassungsjahr', elevationUnit: 'm ü. M.',
    controls: 'Kartensteuerung', north: 'Nach Norden ausrichten', zoomIn: 'Vergrössern', zoomOut: 'Verkleinern',
    help: 'Ziehen: verschieben · Rechts ziehen: drehen und neigen · Mausrad: zoomen', touchHelp: 'Ein Finger: verschieben · Zwei Finger: zoomen, drehen und neigen', keyboardHelp: 'Tastatur: Pfeile verschieben · + / − zoomen · N richtet nach Norden aus', close: 'Schliessen',
    source: 'Kanton Schaffhausen · Geodatensatz', canton: 'Kanton SH',
    historyHeading: 'Bombardierung am 1. April 1944',
    historyText: [
      'Am Vormittag des 1. April 1944 bombardierten US-amerikanische Flugzeuge Schaffhausen irrtümlich. Die Stadt lag in der neutralen Schweiz.',
      '40 Menschen kamen ums Leben, zahlreiche weitere wurden verletzt. Die Bombardierung beschädigte oder zerstörte viele Gebäude, darunter auch Teile des Museums zu Allerheiligen.',
      'Die Karte zeigt die in historischen Quellen dokumentierten Einschlagorte. Der kantonale Datensatz erfasst einen Teil aller Einschläge.',
    ],
    federalSource: 'Gedenkanlass des Bundes (DE)', museumSource: 'Museum zu Allerheiligen (PDF, DE)', archiveSource: 'Bildbestand des Stadtarchivs (DE)',
    impact: 'Einschlagort', impacts: 'Einschlagorte', impactInfo: 'Einschlaginformationen', allLocations: 'Alle Orte dieser Gruppe', sourceType: 'Typ gemäss Quelle', date: 'Datum', position: 'Position (WGS 84)', sourceId: 'Quell-ID', location: 'Ort',
    unknownValue: 'Quellwert',
  },
  en: {
    subtitle: 'Schaffhausen & the Rhine', description: 'Explore Schaffhausen and the Rhine region in an interactive 3D map with official geodata and historical bomb impact locations.',
    language: 'Language / Sprache', viewpoints: 'Explore places', map: 'Interactive 3D map',
    layers: 'Map content', buildings: '3D buildings', photo: 'Aerial imagery', history: 'Bombing of 1944',
    showImpacts: 'Show impact locations', context: 'Historical background',
    modelError: 'The 3D model could not be loaded completely. Please reload the page and check that your browser supports WebGL.',
    photoError: 'The aerial imagery could not be loaded.', historyError: 'The historical geodata could not be loaded.', loading: 'Loading town and landscape …',
    buildingInfo: 'Building information', selectedBuilding: 'Selected building', egid: 'Building ID (EGID)', type: 'Object type', use: 'Use', height: 'Building height', roof: 'Highest roof point', year: 'Survey year', elevationUnit: 'm above sea level',
    controls: 'Map controls', north: 'Orient north', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    help: 'Drag: pan · Right-drag: rotate and tilt · Scroll: zoom', touchHelp: 'One finger: pan · Two fingers: zoom, rotate and tilt', keyboardHelp: 'Keyboard: arrows to pan · + / − to zoom · N to orient north', close: 'Close',
    source: 'Canton of Schaffhausen · Geodata', canton: 'Canton SH',
    historyHeading: 'Bombing on 1 April 1944',
    historyText: [
      'On the morning of 1 April 1944, US aircraft mistakenly bombed Schaffhausen, a town in neutral Switzerland.',
      'Forty people were killed and many others were injured. The bombing damaged or destroyed numerous buildings, including parts of the Museum zu Allerheiligen.',
      'The map shows impact locations documented in historical sources. The cantonal dataset records a subset of all impacts.',
    ],
    federalSource: 'Federal commemoration (German)', museumSource: 'Museum zu Allerheiligen (PDF, German)', archiveSource: 'Town archive photographs (German)',
    impact: 'Impact location', impacts: 'Impact locations', impactInfo: 'Impact information', allLocations: 'All locations in this group', sourceType: 'Type recorded in source', date: 'Date', position: 'Position (WGS 84)', sourceId: 'Source ID', location: 'Location',
    unknownValue: 'Source value',
  },
}

// Source classifications retain their original identity in the data files.
export const sourceValues = {
  'Gebaeude Einzelhaus': ['Gebäude / Einzelhaus', 'Building / detached house'],
  'Im Bau': ['Im Bau', 'Under construction'], Lagertank: ['Lagertank', 'Storage tank'],
  Turm: ['Turm', 'Tower'], Treibhaus: ['Treibhaus', 'Greenhouse'], Hochhaus: ['Hochhaus', 'High-rise building'],
  'Sakrales Gebaeude': ['Sakrales Gebäude', 'Religious building'], Lueftungsschacht: ['Lüftungsschacht', 'Ventilation shaft'],
  'Unterirdisches Gebaeude': ['Unterirdisches Gebäude', 'Underground building'],
  'Gebaeude unsichtbar': ['Gebäude unsichtbar', 'Building not visible'], 'Mauer gross': ['Grosse Mauer', 'Large wall'],
  Hochkamin: ['Hochkamin', 'Industrial chimney'], 'Mauer gross gedeckt': ['Grosse gedeckte Mauer', 'Large covered wall'],
  Kapelle: ['Kapelle', 'Chapel'], 'Bruecke gedeckt': ['Gedeckte Brücke', 'Covered bridge'],
  Schiessstand: ['Schiessstand', 'Shooting range'], 'Gasthof abgelegen': ['Abgelegener Gasthof', 'Remote inn'],
  Observatorium: ['Observatorium', 'Observatory'], Aussichtsturm: ['Aussichtsturm', 'Observation tower'],
  Reservoir: ['Reservoir', 'Reservoir'], Stadion: ['Stadion', 'Stadium'],
  Sprengbombe: ['Sprengbombe', 'High-explosive bomb'], Brandbombe: ['Brandbombe', 'Incendiary bomb'],
}

export function sourceValue(value, language) {
  if (!value) return null
  return sourceValues[value]?.[language === 'en' ? 1 : 0] ?? `${messages[language].unknownValue}: ${value}`
}
