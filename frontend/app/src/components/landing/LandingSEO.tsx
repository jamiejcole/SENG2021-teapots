import { useEffect } from 'react'

const TITLE =
  'Teapots Invoicing — UBL XML Invoicing, Orders & Despatch Platform | AI-Powered Invoice Studio'
const DESCRIPTION =
  'Run UBL XML invoicing, orders, and despatch in one place. Teapots Invoicing combines structured XML workflows, validation, a modern dashboard and invoice studio, and AI assistance for faster, cleaner business documents.'
const SITE_URL = 'https://teapotinvoicing.app/'
const OG_IMAGE_URL = 'https://teapotinvoicing.app/OpenGraphCard.png'

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

function upsertJsonLd(id: string, payload: Record<string, unknown>) {
  let el = document.querySelector(`script[type="application/ld+json"]#${id}`) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }

  el.textContent = JSON.stringify(payload)
}

export function LandingSEO() {
  useEffect(() => {
    const url = SITE_URL
    const image = OG_IMAGE_URL

    document.title = TITLE
    upsertMeta('name', 'description', DESCRIPTION)
    upsertMeta('name', 'robots', 'index, follow, max-image-preview:large')
    upsertMeta('name', 'googlebot', 'index, follow, max-image-preview:large')
    upsertLink('canonical', url)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:locale', 'en_AU')
    upsertMeta('property', 'og:site_name', 'Teapots Invoicing')
    upsertMeta('property', 'og:title', TITLE)
    upsertMeta('property', 'og:description', DESCRIPTION)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', image)
    upsertMeta('property', 'og:image:type', 'image/png')
    upsertMeta('property', 'og:image:width', '1200')
    upsertMeta('property', 'og:image:height', '630')
    upsertMeta('property', 'og:image:alt', 'Teapots Invoicing — UBL XML business document platform')

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', TITLE)
    upsertMeta('name', 'twitter:description', DESCRIPTION)
    upsertMeta('name', 'twitter:image', image)
    upsertMeta('name', 'twitter:image:alt', 'Teapots Invoicing social preview card')

    upsertJsonLd('landing-page-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: TITLE,
      description: DESCRIPTION,
      url,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Teapots Invoicing',
        url: SITE_URL,
      },
      about: {
        '@type': 'SoftwareApplication',
        name: 'Teapots Invoicing',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
      },
    })

    return () => {
      document.title = 'Teapots Invoicing'
    }
  }, [])

  return null
}
