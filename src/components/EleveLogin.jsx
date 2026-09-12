import { useEffect, useMemo, useState } from 'react'
import { Mountain, Lock, Share2, Copy, Check, ChevronRight } from 'lucide-react'
import { rosterOps } from '../utils/rosterOps.js'
import { loadRosterTeacher, saveRosterTeacher } from '../firebase.js'

function PartagerApp() {
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.origin : ''
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(url)}`

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch (e) {}
  }

  const partager = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Escalade Pro', text: "Application de sécurité et d'assurage en escalade", url }) } catch (e) { /* annulé */ }
    } else {
      copier()
    }
  }

  return (
    <div className="max-w-md mx-auto mb-4 bg-white border border-roche-200 rounded-xl p-3.5">
      <button type="button" onClick={() => setOuvert((o) => !o)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-roche-50 flex items-center justify-center">
            <Share2 size={14} className="text-roche-500" />
          </div>
          <p className="text-sm font-medium text-roche-800">Partager l'appli</p>
        </div>
        <ChevronRight size={16} className={`text-roche-400 transition ${ouvert ? 'rotate-90' : ''}`} />
      </button>

      {ouvert && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="bg-white p-2.5 rounded-xl border border-roche-100">
            <img src={qrSrc} alt="QR code de l'appli" width={160} height={160} />
          </div>
          <p className="text-xs text-roche-500 text-center break-all px-2">{url || "Adresse disponible une fois l'appli déployée"}</p>
          <button type="button" onClick={partager} className="w-full bg-roche-800 text-white text-xs font-medium rounded-lg py-2.5 flex items-center justify-center gap-1.5">
            <Share2 size={13} /> Partager le lien
          </button>
          <button type="button" onClick={copier} className="w-full bg-roche-50 text-roche-700 text-xs font-medium rounded-lg py-2.5 flex items-center justify-center gap-1.5">
            {copie ? <><Check size={13} /> Lien copié</> : <><Copy size={13} /> Copier le lien</>}
          </button>
          <p className="text-[10px] text-roche-400 text-center">Fais scanner ce code, partage le lien via ta messagerie préférée, ou transmets-le pour que chaque élève installe l'appli sur son téléphone.</p>
        </div>
      )}
    </div>
  )
}

function LienEnseignant({ onAccesEnseignant }) {
  if (!onAccesEnseignant) return null
  return (
    <button
      type="button"
      onClick={onAccesEnseignant}
      className="w-full max-w-md mx-auto mb-8 block text-center border border-roche-200 rounded-xl py-3 text-sm text-roche-700"
    >
      Tu es professeur ? <span className="font-medium">Connexion ici →</span>
    </button>
  )
}

// accesConfig: { pinAdmin, nomAdmin, collegues: [{id, nom, pin}] } — sert à construire la liste
// des professeurs parmi lesquels l'élève choisit le sien (aucun code n'est demandé ici : ce
// n'est pas une connexion enseignant).
//
// Tout se passe sur UNE SEULE page (comme Muscu Pro) : professeur → classe → nom → code PIN
// s'enchaînent verticalement sans changement d'écran, la sélection du professeur ne fait que
// révéler les champs suivants au fur et à mesure.
export default function EleveLogin({ accesConfig, onConnecte, onAccesEnseignant }) {
  const professeurs = useMemo(() => {
    const liste = [{ id: 'admin', nom: accesConfig?.nomAdmin || 'Christophe Guilhem' }]
    ;(accesConfig?.collegues || []).forEach((c) => liste.push({ id: c.id, nom: c.nom }))
    return liste
  }, [accesConfig])

  const [teacherId, setTeacherId] = useState('')
  const [roster, setRoster] = useState(null)
  const [chargementRoster, setChargementRoster] = useState(false)
  const [classe, setClasse] = useState('')
  const [eleveId, setEleveId] = useState('')
  const [prenomManuel, setPrenomManuel] = useState('')
  const [nomManuel, setNomManuel] = useState('')
  const [classeManuelle, setClasseManuelle] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [erreur, setErreur] = useState('')

  // Charge le roster du professeur dès qu'il est choisi dans le menu déroulant.
  useEffect(() => {
    if (!teacherId) { setRoster(null); return }
    let annule = false
    setChargementRoster(true)
    setRoster(null)
    setClasse('')
    setEleveId('')
    loadRosterTeacher(teacherId)
      .then((r) => { if (!annule) setRoster(r) })
      .catch(() => { if (!annule) setErreur('Chargement des classes impossible. Vérifie ta connexion et réessaie.') })
      .finally(() => { if (!annule) setChargementRoster(false) })
    return () => { annule = true }
  }, [teacherId])

  const classes = roster ? rosterOps.getClasses(roster) : []
  const aDesClasses = classes.length > 0
  const eleves = roster && classe ? rosterOps.getElevesClasse(roster, classe) : []
  const eleveSelectionne = roster && eleveId ? rosterOps.trouverEleve(roster, classe, eleveId) : null
  const premierePinEnCours = !!eleveSelectionne && !eleveSelectionne.pin

  // Identité complète = on peut afficher le bloc code PIN et le bouton final.
  const identitePrete = !!teacherId && !!roster && !chargementRoster && (
    (aDesClasses && !!eleveId) ||
    (!aDesClasses && prenomManuel.trim() && nomManuel.trim() && classeManuelle.trim())
  )

  function choisirProfesseur(id) {
    setTeacherId(id)
    setErreur('')
  }

  function choisirClasse(c) {
    setClasse(c)
    setEleveId('')
    setErreur('')
  }

  function choisirEleve(id) {
    setEleveId(id)
    setPin('')
    setPinConfirm('')
    setErreur('')
  }

  function connecterAvec(id, classeConnexion) {
    const eleveTrouve = rosterOps.trouverEleve(roster, classeConnexion, id)
    onConnecte({ id: eleveTrouve.id, nom: eleveTrouve.nom, prenom: eleveTrouve.prenom, classe: classeConnexion, teacherId })
  }

  async function valider(e) {
    e.preventDefault()
    if (!/^\d{4,6}$/.test(pin)) {
      setErreur('Choisis un code à 4 chiffres minimum.')
      return
    }

    if (aDesClasses) {
      // Élève choisi dans le roster importé.
      if (premierePinEnCours) {
        if (pin !== pinConfirm) {
          setErreur('Les deux codes ne correspondent pas.')
          setPinConfirm('')
          return
        }
        const next = rosterOps.definirPin(roster, classe, eleveId, pin)
        setRoster(next)
        try {
          await saveRosterTeacher(teacherId, next)
        } catch (e2) {
          setErreur("Échec de l'enregistrement du code : " + e2.message)
          return
        }
        connecterAvec(eleveId, classe)
      } else if (rosterOps.verifierPin(roster, classe, eleveId, pin)) {
        connecterAvec(eleveId, classe)
      } else {
        setErreur('Code incorrect.')
        setPin('')
      }
    } else {
      // Aucune classe importée pour ce professeur : création de la fiche à la volée.
      if (pin !== pinConfirm) {
        setErreur('Les deux codes ne correspondent pas.')
        setPinConfirm('')
        return
      }
      const classeSaisie = classeManuelle.trim().toUpperCase()
      const { roster: next, eleve } = rosterOps.ajouterEleveManuel(roster || {}, classeSaisie, nomManuel.trim(), prenomManuel.trim())
      const withPin = rosterOps.definirPin(next, classeSaisie, eleve.id, pin)
      setRoster(withPin)
      try {
        await saveRosterTeacher(teacherId, withPin)
      } catch (e2) {
        setErreur("Échec de l'enregistrement : " + e2.message)
        return
      }
      connecterAvec(eleve.id, classeSaisie)
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <PartagerApp />
      <LienEnseignant onAccesEnseignant={onAccesEnseignant} />

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-roche-800 flex items-center justify-center mb-4">
          <Mountain className="text-roche-200" size={30} />
        </div>
        <h2 className="font-display text-2xl text-roche-900">Qui es-tu ?</h2>
        <p className="text-roche-600 text-sm mt-1">Pour que ton professeur puisse suivre ta progression.</p>
      </div>

      {erreur && <p className="text-alerte text-sm text-center mb-4">{erreur}</p>}

      <form onSubmit={valider} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-roche-800 mb-1">Ton professeur d'EPS</label>
          <select
            value={teacherId}
            onChange={(e) => choisirProfesseur(e.target.value)}
            className="w-full bg-white border-2 border-roche-100 focus:border-roche-500 rounded-xl px-4 py-3.5 font-medium text-roche-900 transition focus:outline-none"
          >
            <option value="" disabled>Sélectionne ton professeur...</option>
            {professeurs.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>

        {teacherId && chargementRoster && (
          <p className="text-sm text-roche-500">Chargement des classes...</p>
        )}

        {teacherId && !chargementRoster && aDesClasses && (
          <div>
            <label className="block text-sm font-medium text-roche-800 mb-1">Ta classe</label>
            <select
              value={classe}
              onChange={(e) => choisirClasse(e.target.value)}
              className="w-full bg-white border-2 border-roche-100 focus:border-roche-500 rounded-xl px-4 py-3.5 font-medium text-roche-900 transition focus:outline-none"
            >
              <option value="" disabled>Sélectionne ta classe...</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {teacherId && !chargementRoster && aDesClasses && classe && (
          <div>
            <label className="block text-sm font-medium text-roche-800 mb-1">Ton nom</label>
            <select
              value={eleveId}
              onChange={(e) => choisirEleve(e.target.value)}
              className="w-full bg-white border-2 border-roche-100 focus:border-roche-500 rounded-xl px-4 py-3.5 font-medium text-roche-900 transition focus:outline-none"
            >
              <option value="" disabled>Sélectionne ton nom...</option>
              {eleves.map((el) => (
                <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
              ))}
            </select>
            {eleves.length === 0 && (
              <p className="text-xs text-roche-400 mt-1">Aucun élève enregistré dans cette classe pour l'instant.</p>
            )}
          </div>
        )}

        {teacherId && !chargementRoster && !aDesClasses && (
          <>
            <div>
              <label className="block text-sm font-medium text-roche-800 mb-1">Prénom</label>
              <input
                value={prenomManuel}
                onChange={(e) => setPrenomManuel(e.target.value)}
                className="w-full rounded-xl border border-roche-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-roche-500"
                placeholder="Ex : Léo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-roche-800 mb-1">Nom</label>
              <input
                value={nomManuel}
                onChange={(e) => setNomManuel(e.target.value)}
                className="w-full rounded-xl border border-roche-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-roche-500"
                placeholder="Ex : Martin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-roche-800 mb-1">Classe</label>
              <input
                value={classeManuelle}
                onChange={(e) => setClasseManuelle(e.target.value)}
                className="w-full rounded-xl border border-roche-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-roche-500"
                placeholder="Ex : 2NDE4"
              />
            </div>
          </>
        )}

        {identitePrete && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-roche-500" />
              <p className="text-sm font-medium text-roche-800">
                {aDesClasses && !premierePinEnCours ? 'Ton code PIN personnel' : 'Choisis ton code PIN personnel'}
              </p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className={`w-full text-center text-2xl tracking-[0.5em] rounded-xl border-2 px-4 py-3 focus:outline-none ${erreur ? 'border-alerte' : 'border-roche-200 focus:border-roche-500'}`}
              maxLength={6}
              placeholder="••••"
            />
            {(!aDesClasses || premierePinEnCours) && (
              <input
                type="password"
                inputMode="numeric"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl tracking-[0.5em] rounded-xl border-2 border-roche-200 focus:border-roche-500 px-4 py-3 focus:outline-none"
                maxLength={6}
                placeholder="Confirme le code"
              />
            )}
          </div>
        )}

        <p className="text-[11px] text-roche-400 text-center px-2 pt-2">
          Tes réalisations sont enregistrées de façon anonyme (par numéro) pour ton suivi et ta notation de cycle — ton nom n'est jamais visible des autres élèves.
        </p>

        {identitePrete && (
          <button
            type="submit"
            className="w-full bg-roche-800 hover:bg-roche-700 text-white font-medium py-3.5 rounded-xl transition active:scale-[0.98]"
          >
            Commencer
          </button>
        )}
      </form>
    </div>
  )
}
