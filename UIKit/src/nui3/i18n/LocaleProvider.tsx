import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { en, zh, type Messages } from './messages'

export interface NuiLocale {
  /** BCP-47 tag used for Intl formatting. */
  locale: string
  m: Messages
  /** Format a number with the provider locale. */
  number(n: number, opts?: Intl.NumberFormatOptions): string
  /** Pick content by language: t('English', '中文'). */
  t(enText: string, zhText: string): string
  isZh: boolean
}

function build(locale: string, base?: Messages, messages?: Partial<Messages>): NuiLocale {
  const isZh = /^zh(-|$)/i.test(locale)
  const m = { ...(base ?? (isZh ? zh : en)), ...messages }
  const intlLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : locale
  return {
    locale: intlLocale,
    m,
    isZh,
    number: (n, opts) => new Intl.NumberFormat(intlLocale, opts).format(n),
    t: (a, b) => (isZh ? b : a),
  }
}

const DEFAULT = build('en-US')
const Ctx = createContext<NuiLocale>(DEFAULT)

export interface LocaleProviderProps {
  locale?: string
  /** Replace the whole base catalogue. */
  base?: Messages
  /** Partial overrides on top of the base. */
  messages?: Partial<Messages>
  /** Sync document.documentElement.lang (default true). */
  syncDocumentLang?: boolean
  children?: ReactNode
}

export function LocaleProvider({ locale = 'en', base, messages, syncDocumentLang = true, children }: LocaleProviderProps) {
  const value = useMemo(() => build(locale, base, messages), [locale, base, messages])
  useEffect(() => {
    if (syncDocumentLang) document.documentElement.lang = locale
  }, [locale, syncDocumentLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** { locale, m, number, t }. Without a provider: English + en-US. */
export function useNuiLocale(): NuiLocale {
  return useContext(Ctx)
}
