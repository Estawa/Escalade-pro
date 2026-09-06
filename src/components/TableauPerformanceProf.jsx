import { useMemo, useState } from 'react'
import { Check, Eye } from 'lucide-react'
import DifficulteSelect from './DifficulteSelect.jsx'
import GrilleSuiviVoies from './GrilleSuiviVoies.jsx'
import DetailCellule from './DetailCellule.jsx'
import { formatDifficulte, parseDifficulte } from '../utils/difficulte.js'
import { cleEvaluation, ajouterObservationEvenement, supprimerObservation } from '../firebase.js'

const MODES = ['Moulinette', 'Moulitête', 'Tête']
const QUALITES_ASSURAGE = ['Insuffisant', 'Correct', 'Maîtrisé']

function idObservation() {
  return crypto.randomUUID ? crypto.randomUUID() : `o_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// elevesDeLaClasse: roster brut (id, nom, prenom, sexe, equipe)
// classeActive: nom de la classe
// voies: config des 17 voies
// observationsParEleve / setObservationsParEleve: état partagé, clé = cleEvaluation(eleveComplet)
export default function TableauPerformanceProf({ elevesDeLaClasse, classeActive, voies, observationsParEleve, setObservationsParEleve }) {
  const [numeroVoie, setNumeroVoie] = useState(1)
  const [nbCouleurs, setNbCouleurs] = useState(3)
  const [mode, setMode] = useState('Moulinette')
  const [difficulte, setDifficulte] = useState({ chiffre: '', lettre: '', plus: false })
  const [sommetAtteint, setSommetAtteint] = useState(true)
  const [mousqueton, setMousqueton] = useState('')
  const [grimpeurId, setGrimpeurId] = useState('')
  const [assureurId, setAssureurId] = useState('')
  const [qualiteAssurage, setQualiteAssurage] = useState('Correct')
  const [erreur, setErreur] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [detail, setDetail] = useState(null)

  const voieActive = useMemo(() => voies.find((v) => v.numero === Number(numeroVoie)), [voies, numeroVoie])
  const couleurActive = voieActive ? voieActive.couleurs[nbCouleurs] : null
  const suggestion = couleurActive ? couleurActive.difficulte : ''

  function appliquerSuggestion() {
    if (suggestion) setDifficulte(parseDifficulte(suggestion))
  }

  const eleveComplet = (id) => {
    const e = elevesDeLaClasse.find((x) => x.id === id)
    return e ? { id: e.id, nom: e.nom, prenom: e.prenom, classe: classeActive } : null
  }

  const lignesTableau = useMemo(
    () =>
      elevesDeLaClasse.map((eleve) => {
        const ec = { id: eleve.id, nom: eleve.nom, prenom: eleve.prenom, classe: classeActive }
        return {
          key: eleve.id,
          titre: `${eleve.prenom} ${eleve.nom}`,
          equipe: eleve.equipe || '',
          eleveComplet: ec,
          passages: observationsParEleve[cleEvaluation(ec)] || []
        }
      }),
    [elevesDeLaClasse, classeActive, observationsParEleve]
  )

  async function enregistrerObservation(e) {
    e.preventDefault()
    setErreur('')
    setConfirmation('')
    const diffStr = formatDifficulte(difficulte)
    if (!diffStr) {
      setErreur('Indique la difficulté de la voie avant d\'enregistrer.')
      return
    }
    if (!sommetAtteint && !mousqueton) {
      setErreur('Indique le numéro du dernier mousqueton passé avant d\'enregistrer.')
      return
    }
    if (!grimpeurId && !assureurId) {
      setErreur('Choisis au moins un grimpeur observé ou un assureur observé.')
      return
    }

    const grimpeurEleve = grimpeurId ? eleveComplet(grimpeurId) : null
    const assureurEleve = assureurId ? eleveComplet(assureurId) : null
    const evenementId = idObservation()
    const base = {
      date: Date.now(),
      voie: Number(numeroVoie),
      nbCouleurs: Number(nbCouleurs),
      difficulte: diffStr,
      mode,
      sommetAtteint,
      mousqueton: sommetAtteint ? null : Number(mousqueton),
      evenementId
    }
    const grimpeurObs = grimpeurEleve
      ? { ...base, id: idObservation(), role: 'Grimpeur', partenaireId: assureurEleve?.id || null, partenaireNom: assureurEleve ? `${assureurEleve.prenom} ${assureurEleve.nom}` : null }
      : null
    const assureurObs = assureurEleve
      ? { ...base, id: idObservation(), role: 'Assureur', qualite: qualiteAssurage, partenaireId: grimpeurEleve?.id || null, partenaireNom: grimpeurEleve ? `${grimpeurEleve.prenom} ${grimpeurEleve.nom}` : null }
      : null

    setEnregistrement(true)
    try {
      const resultat = await ajouterObservationEvenement({ grimpeurEleve, grimpeurObs, assureurEleve, assureurObs })
      setObservationsParEleve((m) => {
        const copie = { ...m }
        if (grimpeurEleve && resultat.grimpeur) copie[cleEvaluation(grimpeurEleve)] = resultat.grimpeur
        if (assureurEleve && resultat.assureur) copie[cleEvaluation(assureurEleve)] = resultat.assureur
        return copie
      })
      setMousqueton('')
      setConfirmation('Observation enregistrée.')
    } catch (e2) {
      setErreur("Échec de l'enregistrement : " + e2.message)
    } finally {
      setEnregistrement(false)
    }
  }

  function ouvrirDetailCellule(ligne, numeroVoie2, nbCouleurs2, passagesCellule) {
    const v = voies.find((x) => x.numero === numeroVoie2)
    const c = v?.couleurs?.[nbCouleurs2]
    setDetail({
      titre: `${ligne.titre} — Voie ${numeroVoie2}`,
      sousTitre: [`${nbCouleurs2} couleur${nbCouleurs2 > 1 ? 's' : ''}`, c?.nom, c?.difficulte].filter(Boolean).join(' · '),
      eleveComplet: ligne.eleveComplet,
      passages: passagesCellule
    })
  }

  async function supprimerDepuisDetail(observation) {
    if (!detail?.eleveComplet) return
    const { eleveComplet: ec } = detail
    const cle = cleEvaluation(ec)
    const avant = observationsParEleve[cle] || []
    const apres = avant.filter((o) => o.id !== observation.id)
    setObservationsParEleve((m) => ({ ...m, [cle]: apres }))
    setDetail((d) => (d ? { ...d, passages: d.passages.filter((o) => o.id !== observation.id) } : d))
    try {
      await supprimerObservation(ec, observation.id)
    } catch (e) {
      setObservationsParEleve((m) => ({ ...m, [cle]: avant }))
    }
  }

  return (
    <div>
      <p className="text-xs text-roche-500 mb-3">
        Réservé au prof : à utiliser quand un élève t'appelle pour être évalué sur une voie. Ce que tu indiques ici —
        et uniquement cela — donne lieu à la note de performance de cycle (distincte du tableau de suivi déclaratif
        des élèves, qui alimente la note de suivi de cycle).
      </p>

      <form onSubmit={enregistrerObservation} className="bg-roche-50 rounded-xl p-4 mb-5 space-y-3">
        <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide flex items-center gap-1.5">
          <Eye size={13} /> Nouvelle observation
        </p>

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
            <label className="block text-xs text-roche-600 mb-1">Couleurs de prise utilisées</label>
            <select value={nbCouleurs} onChange={(e) => setNbCouleurs(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white">
              <option value={3}>3 couleurs</option>
              <option value={2}>2 couleurs</option>
              <option value={1}>1 couleur</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-roche-600 mb-1">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white">
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-roche-600 mb-1">Hauteur atteinte (grimpeur)</label>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1 text-xs text-roche-800">
                <input type="radio" checked={sommetAtteint} onChange={() => setSommetAtteint(true)} /> Entièrement
              </label>
              <label className="flex items-center gap-1 text-xs text-roche-800">
                <input type="radio" checked={!sommetAtteint} onChange={() => setSommetAtteint(false)} /> Partielle
              </label>
              {!sommetAtteint && (
                <input
                  type="number"
                  min={1}
                  value={mousqueton}
                  onChange={(e) => setMousqueton(e.target.value)}
                  placeholder="N° dégaine"
                  className="rounded-lg border border-roche-200 px-2 py-1 text-xs w-24"
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-roche-600 mb-1">
            Difficulté
            {suggestion && (
              <button type="button" onClick={appliquerSuggestion} className="ml-2 text-roche-700 underline">
                (suggestion{couleurActive?.nom ? ` · ${couleurActive.nom}` : ''} : {suggestion})
              </button>
            )}
          </label>
          <DifficulteSelect chiffre={difficulte.chiffre} lettre={difficulte.lettre} plus={difficulte.plus} onChange={setDifficulte} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-roche-200/60">
          <div>
            <label className="block text-xs text-roche-600 mb-1">Grimpeur observé</label>
            <select value={grimpeurId} onChange={(e) => setGrimpeurId(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white">
              <option value="">— Non observé —</option>
              {elevesDeLaClasse.map((el) => (
                <option key={el.id} value={el.id} disabled={el.id === assureurId}>{el.prenom} {el.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-roche-600 mb-1">Assureur observé</label>
            <select value={assureurId} onChange={(e) => setAssureurId(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white">
              <option value="">— Non observé —</option>
              {elevesDeLaClasse.map((el) => (
                <option key={el.id} value={el.id} disabled={el.id === grimpeurId}>{el.prenom} {el.nom}</option>
              ))}
            </select>
            {assureurId && (
              <select value={qualiteAssurage} onChange={(e) => setQualiteAssurage(e.target.value)} className="w-full rounded-lg border border-roche-200 px-2.5 py-2 text-sm bg-white mt-1.5">
                {QUALITES_ASSURAGE.map((q) => <option key={q} value={q}>Assurage {q.toLowerCase()}</option>)}
              </select>
            )}
          </div>
        </div>

        {erreur && <p className="text-sm text-alerte bg-[#fbeeea] rounded-lg px-3 py-2 font-medium">{erreur}</p>}
        {confirmation && !erreur && <p className="text-sm text-roche-700 bg-roche-100 rounded-lg px-3 py-2 font-medium">✓ {confirmation}</p>}

        <button type="submit" disabled={enregistrement} className="flex items-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-60">
          <Check size={15} /> {enregistrement ? 'Enregistrement...' : 'Enregistrer cette observation'}
        </button>
      </form>

      <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide mb-2">Tableau de performance de cycle (observé par le prof)</p>
      <GrilleSuiviVoies voies={voies} lignes={lignesTableau} onCellClick={ouvrirDetailCellule} grouperParEquipe />

      <DetailCellule detail={detail} onFermer={() => setDetail(null)} onSupprimer={supprimerDepuisDetail} />
    </div>
  )
}
