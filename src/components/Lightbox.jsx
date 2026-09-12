import { X, ExternalLink } from 'lucide-react'
import { detecterMedia } from '../utils/media.js'

// media: { kind: 'photo' | 'video', src, titre } | null
export default function Lightbox({ media, onFermer }) {
  if (!media) return null
  const { kind, src, titre } = media

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-3"
      onClick={onFermer}
    >
      <button
        onClick={onFermer}
        aria-label="Fermer"
        className="absolute top-3 right-3 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
      >
        <X size={20} />
      </button>

      <div className="max-w-full max-h-full w-full flex flex-col items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
        {kind === 'photo' && (
          <img src={src} alt={titre || ''} className="max-w-full max-h-[88vh] rounded-lg object-contain" />
        )}
        {kind === 'video' && <LectureVideo url={src} />}
        {titre && <p className="text-white/80 text-xs text-center px-4">{titre}</p>}
      </div>
    </div>
  )
}

function LectureVideo({ url }) {
  const info = detecterMedia(url)

  if (info.type === 'iframe') {
    return (
      <iframe
        src={info.embedUrl}
        className="w-full max-w-3xl aspect-video max-h-[80vh] rounded-lg border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vidéo"
      />
    )
  }
  if (info.type === 'video') {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={info.embedUrl} controls autoPlay playsInline className="max-w-full max-h-[85vh] rounded-lg" />
    )
  }
  return (
    <a
      href={info.embedUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 bg-white text-roche-900 rounded-lg px-4 py-3 text-sm font-medium"
    >
      <ExternalLink size={16} /> Ouvrir la vidéo dans un nouvel onglet
    </a>
  )
}
