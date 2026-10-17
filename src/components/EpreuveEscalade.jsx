import { useEffect, useRef, useState } from 'react'
import { Dices, Play, Flag, AlertTriangle, RotateCcw, Save, Timer } from 'lucide-react'
import { cleEvaluation, saveEvaluation } from '../firebase.js'
import { formatDuree } from '../utils/bacEscalade.js'

// Outil « Épreuve » du bac (v3.14.0), protocoles GT et Pro du lycée :
// - le candidat désigne 2 voies d'un même niveau de cotation, l'une est tirée au sort ;
// - grimpe en tête ou en moulitête ;
// - 6 minutes, le chrono démarre quand le 2e pied quitte le sol ;
// - 1 chute autorisée (le grimpeur repart d'où il a chuté), la 2e arrête l'épreuve ;
// - une erreur de mousquetonnage non corrigée (yoyo, corde à l'envers, point sauté) arrête l'épreuve.
// Le résultat est enregistré dans l'évaluation de l'élève (champ "epreuve", ajouté sans rien
// effacer) et repris automatiquement dans sa « Note du bac ».

const DUREE_MS = 6 * 60 * 1000

function libelleVoie(voies, choix) {
  if (!choix?.numero) return '—'
  const v = voies.find((x) => x.numero === Number(choix.numero))
  const c = v?.couleurs?.[choix.couleur]
  const nom = c?.nom ? ` ${c.nom}` : ''
  return `Voie ${choix.numero}${nom}${c?.difficulte ? ` (${c.difficulte})` : ''}`
}

function difficulteVoie(voies, choix) {
  const v = voies.find((x) => x.numero === Number(choix?.numero))
  return v?.couleurs?.[choix?.couleur]?.difficulte || ''
}

function ChoixVoie({ voies, valeur, onChange, titre }) {
  const v = voies.find((x) => x.numero === Number(valeur.numero))
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-roche-600 w-14">{titre}</span>
      <select
        value={valeur.numero || ''}
        onChange={(e) => onChange({ ...valeur, numero: e.target.value ? Number(e.target.value) : '' })}
        className="rounded-lg border border-roche-200 px-2 py-1.5 text-sm bg-white"
      >
        <option value="">Voie</option>
        {voies.map((x) => (
          <option key={x.numero} value={x.numero}>Voie {x.numero}</option>
        ))}
      </select>
      <select
        value={valeur.couleur || ''}
        onChange={(e) => onChange({ ...valeur, couleur: e.target.value ? Number(e.target.value) : '' })}
        className="rounded-lg border border-roche-200 px-2 py-1.5 text-sm bg-white"
      >
        <option value="">Prises</option>
        {[1, 2, 3, 4].map((n) => {
          const c = v?.couleurs?.[n]
          return (
            <option key={n} value={n}>
              {c?.nom || `${n} couleur${n > 1 ? 's' : ''}`}{c?.difficulte ? ` — ${c.difficulte}` : ''}
            </option>
          )
        })}
      </select>
    </div>
  )
}

export default function EpreuveEscalade({ elevesDeLaClasse, classeActive, teacherId, voies, evaluations, onEnregistre }) {
  const [eleveId, setEleveId] = useState('')
  const [voieA, setVoieA] = useState({ numero: '', couleur: '' })
  const [voieB, setVoieB] = useState({ numero: '', couleur: '' })
  const [tiree, setTiree] = useState(null) // 'A' | 'B'
  const [mode, setMode] = useState('tete')
  const [debut, setDebut] = useState(null) // timestamp du départ
  const [fin, setFin] = useState(null) // { tempsMs, sortie, motifArret }
  const [chutes, setChutes] = useState(0)
  const [maintenant, setMaintenant] = useState(Date.now())
  const [message, setMessage] = useState('')
  const intervalle = useRef(null)

  useEffect(() => {
    if (debut && !fin) {
      intervalle.current = setInterval(() => setMaintenant(Date.now()), 250)
      return () => clearInterval(intervalle.current)
    }
    return undefined
  }, [debut, fin])

  const ecoule = debut ? (fin ? fin.tempsMs : Math.min(maintenant - debut, DUREE_MS)) : 0
  const restant = DUREE_MS - ecoule

  // Fin automatique à 6 minutes
  useEffect(() => {
    if (debut && !fin && maintenant - debut >= DUREE_MS) {
      setFin({ tempsMs: DUREE_MS, sortie: false, motifArret: 'temps écoulé (6 min)' })
    }
  }, [maintenant, debut, fin])

  const eleve = elevesDeLaClasse.find((e) => e.id === eleveId)
  const eleveComplet = eleve ? { id: eleve.id, nom: eleve.nom, prenom: eleve.prenom, classe: classeActive, teacherId } : null
  const epreuveExistante = eleveComplet ? evaluations?.[cleEvaluation(eleveComplet)]?.epreuve : null
  const voieTiree = tiree === 'A' ? voieA : tiree === 'B' ? voieB : null
  const deuxVoies = voieA.numero && voieA.couleur && voieB.numero && voieB.couleur
  const memeCotation = deuxVoies && difficulteVoie(voies, voieA) === difficulteVoie(voies, voieB)

  function reinitialiser() {
    setTiree(null)
    setDebut(null)
    setFin(null)
    setChutes(0)
    setMessage('')
  }

  function tirer() {
    reinitialiser()
    setTiree(Math.random() < 0.5 ? 'A' : 'B')
  }

  function arreter(sortie, motifArret) {
    if (!debut || fin) return
    setFin({ tempsMs: Math.min(Date.now() - debut, DUREE_MS), sortie, motifArret })
  }

  function chute() {
    if (!debut || fin) return
    const n = chutes + 1
    setChutes(n)
    if (n >= 2) arreter(false, '2e chute')
  }

  async function enregistrer() {
    if (!eleveComplet || !fin || !voieTiree) return
    const epreuve = {
      date: new Date().toISOString(),
      voie: voieTiree.numero,
      couleur: voieTiree.couleur,
      libelleVoie: libelleVoie(voies, voieTiree),
      difficulte: difficulteVoie(voies, voieTiree),
      mode,
      voiesDesignees: [libelleVoie(voies, voieA), libelleVoie(voies, voieB)],
      sortie: fin.sortie,
      tempsMs: fin.tempsMs,
      motifArret: fin.motifArret || null,
      chutes,
    }
    try {
      await saveEvaluation(eleveComplet, { epreuve })
      onEnregistre && onEnregistre(eleveComplet, { epreuve })
      setMessage(`Épreuve enregistrée pour ${eleve.prenom} ${eleve.nom}. Elle est reprise dans sa « Note du bac ».`)
    } catch (e) {
      setMessage("Échec de l'enregistrement : " + e.message)
    }
  }

  const minutes = Math.floor(Math.max(restant, 0) / 60000)
  const secondes = Math.floor((Math.max(restant, 0) % 60000) / 1000)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-roche-900 flex items-center gap-1.5"><Timer size={15} /> Épreuve du bac</p>
        <p className="text-xs text-roche-500 mt-0.5">
          Le candidat désigne 2 voies de même cotation, l'une est tirée au sort. 6 minutes à partir du moment où le
          2e pied quitte le sol ; 1 chute autorisée, la 2e arrête l'épreuve, tout comme une erreur de
          mousquetonnage non corrigée.
        </p>
      </div>

      <div className="bg-roche-50 rounded-xl p-3 space-y-2">
        <select
          value={eleveId}
          onChange={(e) => { setEleveId(e.target.value); reinitialiser() }}
          className="w-full rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm bg-white"
        >
          <option value="">Choisir le candidat</option>
          {elevesDeLaClasse.map((e) => (
            <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
          ))}
        </select>
        {epreuveExistante && (
          <p className="text-[11px] text-roche-600">
            Déjà enregistrée : {epreuveExistante.libelleVoie || `voie ${epreuveExistante.voie}`} en {epreuveExistante.mode === 'moulitete' ? 'moulitête' : 'tête'} ·{' '}
            {epreuveExistante.sortie ? `sortie en ${formatDuree(epreuveExistante.tempsMs)}` : `non sortie (${epreuveExistante.motifArret || 'arrêt'})`} · {epreuveExistante.chutes || 0} chute(s). Une nouvelle épreuve la remplacera.
          </p>
        )}
        <ChoixVoie voies={voies} valeur={voieA} onChange={(v) => { setVoieA(v); reinitialiser() }} titre="Voie 1" />
        <ChoixVoie voies={voies} valeur={voieB} onChange={(v) => { setVoieB(v); reinitialiser() }} titre="Voie 2" />
        {deuxVoies && !memeCotation && (
          <p className="text-[11px] text-alerte">Les 2 voies n'ont pas la même cotation : le protocole demande un même niveau.</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <select value={mode} onChange={(e) => setMode(e.target.value)} disabled={!!debut} className="rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm bg-white">
            <option value="tete">En tête</option>
            <option value="moulitete">En moulitête (degré 3 max)</option>
          </select>
          <button
            onClick={tirer}
            disabled={!eleveId || !deuxVoies || (debut && !fin)}
            className="flex items-center gap-1.5 bg-roche-800 hover:bg-roche-700 disabled:opacity-40 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg"
          >
            <Dices size={15} /> Tirer au sort
          </button>
        </div>
        {voieTiree && (
          <p className="text-sm font-semibold text-roche-900">Voie tirée : {libelleVoie(voies, voieTiree)}</p>
        )}
      </div>

      {voieTiree && (
        <div className="bg-white border border-roche-100 rounded-xl p-3 space-y-3">
          <div className="text-center">
            <p className={`text-5xl font-semibold tabular-nums ${restant <= 60000 && debut && !fin ? 'text-alerte' : 'text-roche-900'}`}>
              {minutes}'{String(secondes).padStart(2, '0')}
            </p>
            <p className="text-xs text-roche-500 mt-1">
              {!debut && 'Temps restant — démarrer quand le 2e pied quitte le sol'}
              {debut && !fin && `Temps écoulé : ${formatDuree(ecoule)} · ${chutes} chute${chutes > 1 ? 's' : ''}`}
              {fin && (fin.sortie ? `Voie sortie en ${formatDuree(fin.tempsMs)}` : `Arrêt : ${fin.motifArret} à ${formatDuree(fin.tempsMs)}`)}
              {fin && ` · ${chutes} chute${chutes > 1 ? 's' : ''}`}
            </p>
          </div>

          {!debut && (
            <button onClick={() => setDebut(Date.now())} className="w-full flex items-center justify-center gap-2 bg-roche-800 hover:bg-roche-700 text-white font-medium py-3 rounded-xl">
              <Play size={18} /> Départ
            </button>
          )}

          {debut && !fin && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => arreter(true, null)} className="flex items-center justify-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white font-medium py-3 rounded-xl">
                <Flag size={16} /> Sortie
              </button>
              <button onClick={chute} className="flex items-center justify-center gap-1.5 border border-roche-300 text-roche-800 font-medium py-3 rounded-xl">
                Chute ({chutes}/1)
              </button>
              <button
                onClick={() => arreter(false, 'erreur de mousquetonnage non corrigée')}
                className="col-span-2 flex items-center justify-center gap-1.5 border border-[#f0d3ca] text-alerte text-sm font-medium py-2 rounded-xl"
              >
                <AlertTriangle size={14} /> Erreur de mousquetonnage non corrigée
              </button>
              <button onClick={() => arreter(false, 'abandon')} className="col-span-2 text-xs text-roche-500 py-1">
                Abandon
              </button>
            </div>
          )}

          {fin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={enregistrer} className="flex items-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-4 py-2 rounded-xl">
                <Save size={15} /> Enregistrer l'épreuve
              </button>
              <button onClick={() => { setDebut(null); setFin(null); setChutes(0); setMessage('') }} className="flex items-center gap-1.5 text-sm text-roche-600 px-3 py-2">
                <RotateCcw size={14} /> Recommencer
              </button>
            </div>
          )}
          {message && <p className="text-xs text-roche-600">{message}</p>}
        </div>
      )}
    </div>
  )
}
