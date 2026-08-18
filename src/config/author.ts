// Autoren-Stammdaten an einer Stelle: Blog-Autorenbox und der Gründer-Abschnitt
// auf /trust greifen auf dasselbe Bild und denselben Namen zu.
// Die Bio-Texte liegen bewusst NICHT hier, sondern als i18n-Keys im Namespace
// `author` (messages/de.json + en.json) — sie sind zweisprachig, das hier nicht.
export const AUTHOR_NAME = 'Daniel Ostner'

// 512×512, quadratisch zugeschnitten. Wird als Kreis dargestellt (48px im Blog,
// 44px auf /trust) — die Auflösung ist Reserve für Retina-Displays.
export const AUTHOR_PHOTO = '/brand/author/daniel-ostner.jpg'
