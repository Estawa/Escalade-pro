// Type d'évaluation d'une classe (v3.13.0) : Bac général et technologique ou Bac professionnel.
export const TYPES_BAC = [
  { valeur: 'gt', court: 'Bac GT', long: 'Bac général et technologique' },
  { valeur: 'pro', court: 'Bac Pro', long: 'Bac professionnel' },
]

export function libelleTypeBac(valeur, long = false) {
  const t = TYPES_BAC.find((x) => x.valeur === valeur)
  if (!t) return 'Type de bac à préciser'
  return long ? t.long : t.court
}

export function ChoixTypeBac({ valeur, onChange }) {
  return (
    <div className="inline-flex gap-1 bg-roche-50 rounded-full p-1" role="group" aria-label="Type d'évaluation">
      {TYPES_BAC.map((t) => (
        <button
          key={t.valeur}
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(t.valeur) }}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition ${valeur === t.valeur ? 'bg-roche-800 text-white' : 'text-roche-600'}`}
        >
          {t.court}
        </button>
      ))}
    </div>
  )
}
