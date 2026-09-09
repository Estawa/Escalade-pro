import { useMemo, useState } from 'react'
import { Mountain, ChevronLeft, Lock, Share2, Copy, Check, ChevronRight } from 'lucide-react'
import { storage } from '../utils/storage'

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
    <div className="max-w-md mx-auto mb-6 bg-white border border-roche-200 rounded-xl p-3.5">
      <button onClick={() => setOuvert((o) => !o)} className="w-full flex items-center justify-between">
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
          <button onClick={partager} className="w-full bg-roche-800 text-white text-xs font-medium rounded-lg py-2.5 flex items-center justify-center gap-1.5">
            <Share2 size={13} /> Partager le lien
          </button>
          <button onClick={copier} className="w-full bg-roche-50 text-roche-700 text-xs font-medium rounded-lg py-2.5 flex items-center justify-center gap-1.5">
            {copie ? <><Check size={13} /> Lien copié</> : <><Copy size={13} /> Copier le lien</>}
          </button>
          <p className="text-[10px] text-roche-400 text-center">Fais scanner ce code, partage le lien via ta messagerie préférée, ou transmets-le pour que chaque élève installe l'appli sur son téléphone.</p>
        </div>
      )}
    </div>
  )
}

export default function EleveLogin({ onConnecte }) {
  const classes = useMemo(() => storage.getClasses(), [])
  const [etape, setEtape] = useState(classes.length > 0 ? 'classe' : 'saisieLibre')
  const [classe, setClasse] = useState('')
  const [eleveId, setEleveId] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [erreur, setErreur] = useState('')

  const eleves = classe ? storage.getElevesClasse(classe) : []
  const eleveSelectionne = eleveId ? storage.trouverEleve(classe, eleveId) : null
  const premierePinEnCours = eleveSelectionne && !eleveSelectionne.pin

  function choisirClasse(c) {
    setClasse(c)
    setErreur('')
    setEtape('nom')
  }

  function choisirEleve(id) {
    setEleveId(id)
    setPin('')
    setPinConfirm('')
    setErreur('')
    setEtape('pin')
  }

  function connecterAvec(id) {
    const eleve = storage.trouverEleve(classe, id)
    storage.setEleveActifId(id)
    onConnecte({ id: eleve.id, nom: eleve.nom, prenom: eleve.prenom, classe })
  }

  function validerPin(e) {
    e.preventDefault()
    if (premierePinEnCours) {
      if (!/^\d{4,6}$/.test(pin)) {
        setErreur('Choisis un code à 4 chiffres minimum.')
        return
      }
      if (pin !== pinConfirm) {
        setErreur('Les deux codes ne correspondent pas.')
        setPinConfirm('')
        return
      }
      storage.definirPin(classe, eleveId, pin)
      connecterAvec(eleveId)
    } else {
      if (storage.verifierPin(classe, eleveId, pin)) {
        connecterAvec(eleveId)
      } else {
        setErreur('Code incorrect.')
        setPin('')
      }
    }
  }

  // --- Repli : saisie libre si aucune classe importée ---
  function validerSaisieLibre(e) {
    e.preventDefault()
    const form = e.target
    const nom = form.nom.value.trim()
    const prenom = form.prenom.value.trim()
    const classeSaisie = form.classe.value.trim().toUpperCase()
    if (!nom || !prenom || !classeSaisie) {
      setErreur('Renseigne ton nom, ton prénom et ta classe pour continuer.')
      return
    }
    const eleve = storage.ajouterEleveManuel(classeSaisie, nom, prenom)
    setClasse(classeSaisie)
    setEleveId(eleve.id)
    setPin('')
    setPinConfirm('')
    setErreur('')
    setEtape('pin')
  }

  if (etape === 'saisieLibre') {
    return (
      <div className="max-w-md mx-auto px-6 py-14">
        <PartagerApp />
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-roche-800 flex items-center justify-center mb-4">
            <Mountain className="text-roche-200" size={30} />
          </div>
          <h2 className="font-display text-2xl text-roche-900">Bienvenue</h2>
          <p className="text-roche-600 text-sm mt-1">
            Aucune classe importée pour l'instant : identifie-toi pour créer ta fiche.
          </p>
        </div>
        <form onSubmit={validerSaisieLibre} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-roche-800 mb-1">Prénom</label>
            <input name="prenom" className="w-full rounded-xl border border-roche-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-roche-500" placeholder="Ex : Léo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-roche-800 mb-1">Nom</label>
            <input name="nom" className="w-full rounded-xl border border-roche-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-roche-500" placeholder="Ex : Martin" />
          </div>
          <div>
            <label className="block text-sm font-medium text-roche-800 mb-1">Classe</label>
            <input name="classe" className="w-full rounded-xl border border-roche-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-roche-500" placeholder="Ex : 2NDE4" />
          </div>
          {erreur && <p className="text-alerte text-sm">{erreur}</p>}
          <button type="submit" className="w-full bg-roche-800 hover:bg-roche-700 text-white font-medium py-3.5 rounded-xl transition active:scale-[0.98]">
            Continuer
          </button>
        </form>
      </div>
    )
  }

  if (etape === 'classe') {
    return (
      <div className="max-w-md mx-auto px-6 py-14">
        <PartagerApp />
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-roche-800 flex items-center justify-center mb-4">
            <Mountain className="text-roche-200" size={30} />
          </div>
          <h2 className="font-display text-2xl text-roche-900">Bienvenue</h2>
          <p className="text-roche-600 text-sm mt-1">Choisis ta classe pour commencer.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {classes.map((c) => (
            <button
              key={c}
              onClick={() => choisirClasse(c)}
              className="bg-white border-2 border-roche-100 hover:border-roche-500 rounded-xl py-4 text-center font-medium text-roche-900 transition active:scale-[0.98]"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (etape === 'nom') {
    return (
      <div className="max-w-md mx-auto px-6 py-14">
        <button onClick={() => setEtape('classe')} className="flex items-center gap-1 text-sm text-roche-600 mb-6">
          <ChevronLeft size={16} /> Changer de classe
        </button>
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl text-roche-900">Classe {classe}</h2>
          <p className="text-roche-600 text-sm mt-1">Trouve ton nom dans la liste.</p>
        </div>
        {eleves.length === 0 ? (
          <p className="text-sm text-roche-500 text-center">Aucun élève enregistré dans cette classe pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {eleves.map((e) => (
              <button
                key={e.id}
                onClick={() => choisirEleve(e.id)}
                className="w-full text-left bg-white border border-roche-100 hover:border-roche-400 rounded-xl px-4 py-3 font-medium text-roche-900 transition active:scale-[0.99]"
              >
                {e.prenom} {e.nom}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // etape === 'pin'
  return (
    <div className="max-w-xs mx-auto px-6 py-20 text-center">
      <button onClick={() => setEtape('nom')} className="flex items-center gap-1 text-sm text-roche-600 mb-8 mx-auto">
        <ChevronLeft size={16} /> Retour
      </button>
      <div className="w-14 h-14 rounded-2xl bg-roche-800 flex items-center justify-center mx-auto mb-5">
        <Lock className="text-roche-200" size={24} />
      </div>
      <h2 className="font-display text-xl text-roche-900 mb-1">
        {eleveSelectionne ? `${eleveSelectionne.prenom} ${eleveSelectionne.nom}` : ''}
      </h2>
      <p className="text-sm text-roche-600 mb-6">
        {premierePinEnCours
          ? 'Choisis ton code PIN personnel (4 à 6 chiffres) pour protéger tes séances.'
          : 'Entre ton code PIN personnel.'}
      </p>
      <form onSubmit={validerPin} className="space-y-3">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className={`w-full text-center text-2xl tracking-[0.5em] rounded-xl border-2 px-4 py-3 focus:outline-none ${erreur ? 'border-alerte' : 'border-roche-200 focus:border-roche-500'}`}
          maxLength={6}
          autoFocus
          placeholder="••••"
        />
        {premierePinEnCours && (
          <input
            type="password"
            inputMode="numeric"
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl tracking-[0.5em] rounded-xl border-2 border-roche-200 focus:border-roche-500 px-4 py-3 focus:outline-none"
            maxLength={6}
            placeholder="Confirme"
          />
        )}
        {erreur && <p className="text-alerte text-xs">{erreur}</p>}
        <button type="submit" className="w-full bg-roche-800 hover:bg-roche-700 text-white font-medium py-3 rounded-xl transition active:scale-[0.98]">
          Valider
        </button>
      </form>
    </div>
  )
}
