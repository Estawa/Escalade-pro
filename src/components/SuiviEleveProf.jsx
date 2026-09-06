import { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import DifficulteSelect from './DifficulteSelect.jsx'
import { formatDifficulte, parseDifficulte } from '../utils/difficulte.js'
import { statsPassages } from '../utils/passages.js'
import { saveEvaluation } from '../firebase.js'

const REUSSITES = ['Non', 'Partiel', 'Oui']
const QUALITES_ASSURAGE = ['Insuffisant', 'Correct', 'Maîtrisé']

export default function SuiviEleveProf({ eleve, passages, observations = [], evaluationExistante, onEnregistre }) {
  const [voieGrimpeur, setVoieGrimpeur] = useState(evaluationExistante?.finalGrimpeur?.voie || '')
  const [diffGrimpeur, setDiffGrimpeur] = useState(parseDifficulte(evaluationExistante?.finalGrimpeur?.difficulte))
  const [reussiteGrimpeur, setReussiteGrimpeur] = useState(evaluationExistante?.finalGrimpeur?.reussite || 'Oui')

  const [voieAssureur, setVoieAssureur] = useState(evaluationExistante?.finalAssureur?.voie || '')
  const [qualiteAssureur, setQualiteAssureur] = useState(evaluationExistante?.finalAssureur?.qualite || 'Correct')

  const [noteCycle, setNoteCycle] = useState(evaluationExistante?.noteCycle ?? '')
  const [notePerformance, setNotePerformance] = useState(evaluationExistante?.notePerformance ?? '')
  const [message, setMessage] = useState('')

  const stats = useMemo(() => statsPassages(passages), [passages])
  const statsObs = useMemo(() => statsPassages(observations), [observations])

  async function enregistrer() {
    const patch = {
      finalGrimpeur: { voie: voieGrimpeur || null, difficulte: formatDifficulte(diffGrimpeur), reussite: reussiteGrimpeur },
      finalAssureur: { voie: voieAssureur || null, qualite: qualiteAssureur },
      noteCycle: noteCycle === '' ? null : Number(noteCycle),
      notePerformance: notePerformance === '' ? null : Number(notePerformance),
      dateCycle: new Date().toISOString()
    }
    try {
      await saveEvaluation(eleve, patch)
      setMessage('Suivi de cycle enregistré.')
      onEnregistre && onEnregistre(patch)
    } catch (e) {
      setMessage("Échec de l'enregistrement : " + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide mb-1.5">Bilan des passages du cycle (déclaratif élève)</p>
        <p className="text-sm text-roche-800">
          {stats.total} passage{stats.total > 1 ? 's' : ''} enregistré{stats.total > 1 ? 's' : ''} · {stats.reussis} au sommet ·{' '}
          {stats.voiesDistinctes} voie{stats.voiesDistinctes > 1 ? 's' : ''} différente{stats.voiesDistinctes > 1 ? 's' : ''} ·{' '}
          {stats.enGrimpeur} en grimpeur / {stats.enAssureur} en assureur
        </p>
        {stats.meilleureVoie && (
          <p className="text-xs text-roche-500 mt-1">
            Meilleure réussite déclarée : voie {stats.meilleureVoie.voie} en {stats.meilleureVoie.difficulte}
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide mb-1.5">Bilan des observations du prof (performance)</p>
        <p className="text-sm text-roche-800">
          {statsObs.total} observation{statsObs.total > 1 ? 's' : ''} · {statsObs.reussis} au sommet ·{' '}
          {statsObs.voiesDistinctes} voie{statsObs.voiesDistinctes > 1 ? 's' : ''} différente{statsObs.voiesDistinctes > 1 ? 's' : ''} ·{' '}
          {statsObs.enGrimpeur} en grimpeur / {statsObs.enAssureur} en assureur
        </p>
        {statsObs.meilleureVoie && (
          <p className="text-xs text-roche-500 mt-1">
            Meilleure réussite observée : voie {statsObs.meilleureVoie.voie} en {statsObs.meilleureVoie.difficulte}
          </p>
        )}
        {statsObs.total === 0 && (
          <p className="text-xs text-roche-500 mt-1">Aucune observation enregistrée pour l'instant (onglet "Performance (observée)").</p>
        )}
      </div>

      <div className="bg-roche-50 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide mb-2">Épreuve finale — Grimpeur</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <select value={voieGrimpeur} onChange={(e) => setVoieGrimpeur(e.target.value)} className="rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm bg-white">
            <option value="">Voie —</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Voie {n}</option>
            ))}
          </select>
          <DifficulteSelect chiffre={diffGrimpeur.chiffre} lettre={diffGrimpeur.lettre} plus={diffGrimpeur.plus} onChange={setDiffGrimpeur} />
          <select value={reussiteGrimpeur} onChange={(e) => setReussiteGrimpeur(e.target.value)} className="rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm bg-white">
            {REUSSITES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-roche-50 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide mb-2">Épreuve finale — Assureur</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <select value={voieAssureur} onChange={(e) => setVoieAssureur(e.target.value)} className="rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm bg-white">
            <option value="">Voie —</option>
            {Array.from({ length: 17 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Voie {n}</option>
            ))}
          </select>
          <select value={qualiteAssureur} onChange={(e) => setQualiteAssureur(e.target.value)} className="rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm bg-white">
            {QUALITES_ASSURAGE.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <label className="text-sm text-roche-800">Note de suivi de cycle</label>
        <input
          type="number"
          min={0}
          max={20}
          step={0.5}
          value={noteCycle}
          onChange={(e) => setNoteCycle(e.target.value)}
          className="w-20 rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm"
        />
        <span className="text-sm text-roche-500">/ 20 (déclaratif élève)</span>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <label className="text-sm text-roche-800">Note de performance de cycle</label>
        <input
          type="number"
          min={0}
          max={20}
          step={0.5}
          value={notePerformance}
          onChange={(e) => setNotePerformance(e.target.value)}
          className="w-20 rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm"
        />
        <span className="text-sm text-roche-500">/ 20 (observé par toi)</span>
      </div>

      <button onClick={enregistrer} className="flex items-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
        <Save size={15} /> Enregistrer le suivi de cycle
      </button>
      {message && <p className="text-xs text-roche-600">{message}</p>}
    </div>
  )
}
