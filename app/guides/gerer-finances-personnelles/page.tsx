import { permanentRedirect } from 'next/navigation'

/** Ancienne URL : le contenu « gérer ses finances personnelles » est sur la page d’accueil. */
export default function GererFinancesPersonnellesRedirectPage() {
  permanentRedirect('/')
}
