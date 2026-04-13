import type { AppLocale } from '@/lib/seo-metadata'

/** Contenu long d’un article guide (hors métadonnées SEO dans locales). */
export type GuideArticleBody = {
  heroTitle: string
  heroLead: string
  imgSrc: string
  imgAlt: string
  figureCaption?: string
  sections: { title: string; paragraphs: string[] }[]
  checklistTitle: string
  checklist: string[]
  closing: string
}

export type GuideArticleBundle = { fr: GuideArticleBody; en: GuideArticleBody }

export function pickArticle(bundle: GuideArticleBundle, locale: AppLocale): GuideArticleBody {
  return locale === 'en' ? bundle.en : bundle.fr
}
