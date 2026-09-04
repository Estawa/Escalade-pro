import { useEffect, useMemo, useState } from 'react'
import { Check, Trash2, Package } from 'lucide-react'
import DifficulteSelect from './DifficulteSelect.jsx'
import { formatDifficulte, parseDifficulte } from '../utils/difficulte.js'
import { loadVoies, voiesParDefaut, loadPassagesEleve, ajouterPassage, supprimerPassage } from '../firebase.js'

const MODES = ['Moulinette', 'Moulitête', 'Tête']
const ROLES = ['Grimpeur', 'Assureur']

function idPassage() {
  return crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export default function SuiviCycle({ eleve }) {
  const [voies, setVoies] = useState(voiesParDefaut())
  const [passages, setPassages] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const [numeroVoie, setNumeroVoie] = useState(1)
  const [role, setRole] = useState('Grimpeur')
  const [mode, setMode] = useState('Moulinette')
  const [nbCouleurs, setNbCouleurs] = useState(1)
  const [difficulte, setDifficulte] = useState({ chiffre: '', lettre: '', plus: false })
  const [sommetAtteint, setSommetAtteint] = useState(true)
  const [mousqueton, setMousqueton] = useState('')
  const [cordeLovee, setCordeLovee] = useState(false)

  useEffect(() => {
    Promise.all([loadVoies(), loadPassagesEleve(eleve)])
      .then(([v, p]) => {
        setVoies(v)
        setPassages(p)
      })
      .catch((e) => setErreur('Chargement impossible : ' + e.message))
      .finally(() => setChargement(false))
  }, [eleve])

  const voieActive = useMemo(() => voies.find((v) => v.numero === Number(numeroVoie)), [voies, numeroVoie])
  const suggestion = voieActive ? voieActive.couleurs[nbCouleurs] : ''

  function appliquerSuggestion() {
    if (suggestion) setDifficulte(parseDifficulte(suggestion))
  }

  async function enregistrerPassage(e) {
    e.preventDefault()
    setErreur('')
    const diffStr = formatDifficulte(difficulte)
    if (!diffStr) {
      setErreur('Indique la difficulté de la voie (chiffre + lettre).')
      return
    }
    if (!sommetAtteint && !mousqueton) {
      setErreur('Indique le numéro du dernier mousqueton passé.')
      return
    }
    const passage = {
      id: idPassage(),
      date: Date.now(),
      voie: Number(numeroVoie),
      role,
      mode,
      nbCouleurs: Number(nbCouleurs),
      difficulte: diffStr,
      sommetAtteint,
      mousqueton: sommetAtteint ? null : Number(mousqueton),
      cordeLovee
    }
    try {
      const nouvelleListe = await ajouterPassage(eleve, passage)
      setPassages(nouvelleListe)
      setMousqueton('')
      setCordeLovee(false)
    } catch (e2) {
      setErreur("Échec de l'enregistrement : " + e2.message)
    }
  }

  async function toggleCordeLovee(p) {
    const maj = { ...p, cordeLovee: !p.cordeLovee }
    try {
      await supprimerPassage(eleve, p.id)
      const nouvelleListe = await ajouterPassage(eleve, maj)
      setPassages(nouvelleListe)
    } catch (e) {
      setErreur("Échec de la mise à jour : " + e.message)
    }
  }

  async function supprimer(id) {
    if (!confirm('Supprimer ce passage de ton historique ?')) return
    try {
      const nouvelleListe = await supprimerPassage(eleve, id)
      setPassages(nouvelleListe)
    } catch (e) {
      setErreur('Échec de la suppression : ' + e.message)
    }
  }

  const passagesTries = [...passages].sort((a, b) => b.date - a.date)

  if (chargement) return <p className="text-sm text-roche-500 px-1">Chargement du suivi de cycle...</p>

  return (
    <div>
      <form onSubmit={enregistrerPassage} className="bg-roche-50 rounded-xl p-4 mb-6 space-y-3">
        <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide">Nouveau passage</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-roche-600 mb-1">Voie</label>
            <select value={numeroVoie} onChange={(e) => setNumeroVoie(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white">
              {voies.map((v) => (
                <option key={v.numero} value={v.numero}>Voie {v.numero}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-roche-600 mb-1">Rôle</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-roche-600 mb-1">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white">
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-roche-600 mb-1">Couleurs de prise utilisées</label>
            <select value={nbCouleurs} onChange={(e) => setNbCouleurs(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white">
              <option value={1}>1 couleur</option>
              <option value={2}>2 couleurs</option>
              <option value={3}>3 couleurs</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-roche-600 mb-1">
            Difficulté
            {suggestion && (
              <button type="button" onClick={appliquerSuggestion} className="ml-2 text-roche-700 underline">
                (suggestion pour cette voie : {suggestion})
              </button>
            )}
          </label>
          <DifficulteSelect
            chiffre={difficulte.chiffre}
            lettre={difficulte.lettre}
            plus={difficulte.plus}
            onChange={setDifficulte}
          />
        </div>

        <div>
          <label className="block text-xs text-roche-600 mb-1">Hauteur atteinte</label>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 text-sm text-roche-800">
              <input type="radio" checked={sommetAtteint} onChange={() => setSommetAtteint(true)} /> Entièrement (chaîne haute)
            </label>
            <label className="flex items-center gap-1.5 text-sm text-roche-800">
              <input type="radio" checked={!sommetAtteint} onChange={() => setSommetAtteint(false)} /> Pas entièrement
            </label>
            {!sommetAtteint && (
              <input
                type="number"
                min={1}
                value={mousqueton}
                onChange={(e) => setMousqueton(e.target.value)}
                placeholder="N° du dernier mousqueton passé"
                className="rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm w-52"
              />
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-roche-800">
          <input type="checkbox" checked={cordeLovee} onChange={(e) => setCordeLovee(e.target.checked)} />
          <Package size={14} /> Corde rangée en lovant après ce passage
        </label>

        {erreur && <p className="text-alerte text-sm">{erreur}</p>}

        <button type="submit" className="flex items-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
          <Check size={15} /> Enregistrer ce passage
        </button>
      </form>

      <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide mb-2">Mon historique de cycle</p>
      {passagesTries.length === 0 && <p className="text-sm text-roche-500">Aucun passage enregistré pour l'instant.</p>}
      <div className="space-y-2">
        {passagesTries.map((p) => (
          <div key={p.id} className="bg-white border border-roche-100 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-roche-900">
                Voie {p.voie} · {p.difficulte} · {p.role} · {p.mode}
              </p>
              <button onClick={() => supprimer(p.id)} className="p-1 rounded-full hover:bg-[#fbeeea] text-alerte">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-xs text-roche-500 mt-0.5">
              {new Date(p.date).toLocaleDateString('fr-FR')} · {p.nbCouleurs} couleur{p.nbCouleurs > 1 ? 's' : ''} ·{' '}
              {p.sommetAtteint ? 'Sommet atteint' : `Jusqu'au mousqueton n°${p.mousqueton}`}
            </p>
            <label className="flex items-center gap-1.5 text-xs text-roche-600 mt-1.5">
              <input type="checkbox" checked={!!p.cordeLovee} onChange={() => toggleCordeLovee(p)} />
              <Package size={12} /> Corde rangée en lovant
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
