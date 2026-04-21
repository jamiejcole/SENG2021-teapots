import { useEffect } from 'react'
import { teapotLogoUrl } from '@/brand/teapotLogo'

const TITLE =
  'Teapots Invoicing — UBL XML Invoicing, Orders & Despatch Platform | AI-Powered Invoice Studio'
const DESCRIPTION =
  'Run UBL XML invoicing, orders, and despatch in one place. Teapots Invoicing combines structured XML workflows, validation, a modern dashboard and invoice studio, and AI assistance for faster, cleaner business documents.'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export function LandingSEO() {
  useEffect(() => {
    const origin = window.location.origin
    const url = `${origin}/`
    const image = new URL(teapotLogoUrl, origin).href

    document.title = TITLE
    upsertMeta('name', 'description', DESCRIPTION)
    upsertLink('canonical', url)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', 'Teapots Invoicing')
    upsertMeta('property', 'og:title', TITLE)
    upsertMeta('property', 'og:description', DESCRIPTION)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', image)
    upsertMeta('property', 'og:image:alt', 'Teapots Invoicing — UBL XML business document platform')

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', TITLE)
    upsertMeta('name', 'twitter:description', DESCRIPTION)
    upsertMeta('name', 'twitter:image', image)

    return () => {
      document.title = 'Teapots Invoicing'
    }
  }, [])

  return null
}
