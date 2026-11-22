import { createContext, useContext, useEffect, useState } from 'react'
import { initialLanguage, languageKey, locales, messages } from './i18n.js'

const Language = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    let storage
    try { storage = window.localStorage } catch { /* Storage is optional. */ }
    return initialLanguage(storage, navigator.languages)
  })
  useEffect(() => {
    document.documentElement.lang = locales[language]
    document.title = `Rheinblicke · ${messages[language].subtitle}`
    document.querySelector('meta[name="description"]')?.setAttribute('content', messages[language].description)
    try { localStorage.setItem(languageKey, language) } catch { /* Storage is optional. */ }
  }, [language])
  return <Language.Provider value={{ language, setLanguage, t: messages[language], locale: locales[language] }}>{children}</Language.Provider>
}

export const useLanguage = () => useContext(Language)
