import { CHIFFRES, LETTRES } from '../utils/difficulte'

export default function DifficulteSelect({ chiffre, lettre, plus, onChange, compact = false }) {
  function set(patch) {
    onChange({ chiffre, lettre, plus, ...patch })
  }
  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : ''}`}>
      <select
        value={chiffre || ''}
        onChange={(e) => set({ chiffre: e.target.value })}
        className="rounded-lg border border-roche-200 px-2 py-1.5 text-sm bg-white"
      >
        <option value="">—</option>
        {CHIFFRES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        value={lettre || ''}
        onChange={(e) => set({ lettre: e.target.value })}
        className="rounded-lg border border-roche-200 px-2 py-1.5 text-sm bg-white"
      >
        <option value="">—</option>
        {LETTRES.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-sm text-roche-700 select-none">
        <input type="checkbox" checked={!!plus} onChange={(e) => set({ plus: e.target.checked })} />
        +
      </label>
    </div>
  )
}
