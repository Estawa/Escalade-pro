import { X, Trash2 } from 'lucide-react'
import { codeCourtPassage } from '../utils/passages.js'

// detail: { titre, sousTitre?, passages: [] } | null
export default function DetailCellule({ detail, onFermer, onSupprimer }) {
  if (!detail) return null
  const { titre, sousTitre, passages } = detail
  const passagesTries = [...passages].sort((a, b) => a.date - b.date)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onFermer}>
      <div
        className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3 gap-2">
          <div>
            <h4 className="font-display text-lg text-roche-900 leading-tight">{titre}</h4>
            {sousTitre && <p className="text-xs text-roche-500 mt-0.5">{sousTitre}</p>}
          </div>
          <button onClick={onFermer} className="p-1 rounded-full hover:bg-roche-50 text-roche-500 shrink-0">
            <X size={16} />
          </button>
        </div>

        {passagesTries.length === 0 && (
          <p className="text-sm text-roche-500">Aucun passage enregistré pour cette case.</p>
        )}

        <div className="space-y-2">
          {passagesTries.map((p) => (
            <div key={p.id} className="bg-roche-50 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-roche-900 font-mono">{codeCourtPassage(p)}</p>
                {onSupprimer && (
                  <button onClick={() => onSupprimer(p)} className="p-1 rounded-full hover:bg-[#fbeeea] text-alerte shrink-0">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <p className="text-xs text-roche-600 mt-0.5">
                {p.role} · {p.mode} · {p.difficulte}
              </p>
              <p className="text-xs text-roche-500 mt-0.5">
                {new Date(p.date).toLocaleDateString('fr-FR')} ·{' '}
                {p.sommetAtteint ? 'Voie réalisée entièrement' : `Arrêt à la dégaine n°${p.mousqueton}`}
                {p.role === 'Assureur' && p.partenaireNom ? ` · Camarade assuré : ${p.partenaireNom}` : ''}
                {p.role === 'Grimpeur' && p.partenaireNom ? ` · Assuré par : ${p.partenaireNom}` : ''}
                {p.qualite ? ` · Assurage ${p.qualite.toLowerCase()}` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
