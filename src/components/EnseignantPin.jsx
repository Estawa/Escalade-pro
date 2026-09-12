import { useMemo, useState } from 'react'
import { Lock, Share2, Copy, Check, ChevronRight } from 'lucide-react'

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
    <div className="max-w-xs mx-auto mb-6 bg-white border border-roche-200 rounded-xl p-3.5">
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
        </div>
      )}
    </div>
  )
}

// onValide({ role: 'admin' | 'collegue', nomCollegue?, teacherId })
// teacherId = 'admin' pour Christophe, ou l'id du collègue (= sa base élèves/suivi isolée).
export default function EnseignantPin({ accesConfig, onValide, onRetourEleve }) {
  const noms = useMemo(() => {
    const liste = [{ id: 'admin', nom: accesConfig?.nomAdmin || 'Christophe Guilhem' }]
    ;(accesConfig?.collegues || []).forEach((c) => liste.push({ id: c.id, nom: c.nom }))
    return liste
  }, [accesConfig])

  const [nomId, setNomId] = useState('')
  const [pin, setPin] = useState('')
  const [erreur, setErreur] = useState(false)

  function valider(e) {
    e.preventDefault()
    if (!nomId) {
      setErreur(true)
      return
    }
    if (nomId === 'admin' && pin === accesConfig.pinAdmin) {
      onValide({ role: 'admin', teacherId: 'admin' })
      return
    }
    const collegue = (accesConfig.collegues || []).find((c) => c.id === nomId)
    if (collegue && collegue.pin === pin) {
      onValide({ role: 'collegue', nomCollegue: collegue.nom, teacherId: collegue.id })
      return
    }
    setErreur(true)
    setPin('')
  }

  return (
    <div className="max-w-xs mx-auto px-6 py-16 text-center">
      <PartagerApp />
      <div className="w-14 h-14 rounded-2xl bg-roche-800 flex items-center justify-center mx-auto mb-5">
        <Lock className="text-roche-200" size={24} />
      </div>
      <h2 className="font-display text-xl text-roche-900 mb-1">Connexion professeur</h2>
      <p className="text-sm text-roche-600 mb-6">Ton nom et ton code d'accès personnel.</p>
      <form onSubmit={valider} className="space-y-3 text-left">
        <div>
          <label className="block text-xs font-medium text-roche-700 mb-1">Ton nom</label>
          <select
            value={nomId}
            onChange={(e) => { setNomId(e.target.value); setErreur(false) }}
            className={`w-full bg-white border-2 rounded-xl px-4 py-3 font-medium text-roche-900 focus:outline-none ${erreur && !nomId ? 'border-alerte' : 'border-roche-200 focus:border-roche-500'}`}
          >
            <option value="" disabled>Sélectionne ton nom...</option>
            {noms.map((n) => (
              <option key={n.id} value={n.id}>{n.nom}</option>
            ))}
          </select>
        </div>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Code d'accès"
          className={`w-full text-center text-2xl tracking-[0.5em] rounded-xl border-2 px-4 py-3 focus:outline-none ${erreur ? 'border-alerte' : 'border-roche-200 focus:border-roche-500'}`}
          maxLength={6}
        />
        {erreur && <p className="text-alerte text-xs">Nom ou code incorrect.</p>}
        <button
          type="submit"
          className="w-full bg-roche-800 hover:bg-roche-700 text-white font-medium py-3 rounded-xl transition active:scale-[0.98]"
        >
          Se connecter
        </button>
      </form>
      {onRetourEleve && (
        <button onClick={onRetourEleve} className="mt-6 text-sm text-roche-500 hover:text-roche-700 transition">
          ← Je suis élève
        </button>
      )}
    </div>
  )
}
