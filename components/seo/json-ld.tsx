import 'server-only'

type JsonLdProps = {
  data: unknown
}

/**
 * JSON-LD réservé au rendu serveur (évite les balises &lt;script&gt; dans un arbre client React 19).
 * @see https://nextjs.org/docs/app/guides/json-ld
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
