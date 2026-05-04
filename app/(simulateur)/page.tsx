import { redirect } from 'next/navigation'

/** `/` ne doit jamais afficher un hub : uniquement redirection vers la saisie. */
export default function RacineRedirect() {
  redirect('/donnees')
}
