// Détecte le type d'une URL vidéo (collée par le prof dans le Référentiel) pour savoir
// comment l'afficher en plein écran dans la Lightbox : intégrée (iframe), lecteur natif
// (fichier vidéo direct), ou simple lien externe si le format n'est pas reconnu.

function extraireIdYoutube(url) {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}

function extraireIdVimeo(url) {
  const m = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/)
  return m ? m[1] : null
}

function extraireIdDrive(url) {
  const m = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/)
  return m ? m[1] : null
}

export function detecterMedia(url) {
  const u = (url || '').trim()
  if (!u) return { type: 'lien', embedUrl: '' }

  if (/youtube\.com|youtu\.be/i.test(u)) {
    const id = extraireIdYoutube(u)
    if (id) return { type: 'iframe', embedUrl: `https://www.youtube.com/embed/${id}` }
  }
  if (/vimeo\.com/i.test(u)) {
    const id = extraireIdVimeo(u)
    if (id) return { type: 'iframe', embedUrl: `https://player.vimeo.com/video/${id}` }
  }
  if (/drive\.google\.com/i.test(u)) {
    const id = extraireIdDrive(u)
    if (id) return { type: 'iframe', embedUrl: `https://drive.google.com/file/d/${id}/preview` }
  }
  if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(u)) {
    return { type: 'video', embedUrl: u }
  }
  return { type: 'lien', embedUrl: u }
}
