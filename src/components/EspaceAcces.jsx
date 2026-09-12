import { useState } from 'react'
import { UserPlus, UserX, Eye, EyeOff, ShieldCheck, KeyRound, Pencil, Check, X } from 'lucide-react'
import ChangerPin from './ChangerPin.jsx'

// Réinitialise le PIN d'un collègue existant (l'id/teacherId ne change pas, donc ses élèves
// et son suivi déjà enregistrés restent intacts) vers un nouveau code choisi par l'admin.
function ReinitialiserPinCollegue({ collegue, autresPins, onReinitialiser }) {
  const [ouvert, setOuvert] = useState(false)
  const [pin, setPin] = useState('')
  const [erreur, setErreur] = useState('')

  function valider(e) {
    e.preventDefault()
    if (!/^\d{4,6}$/.test(pin)) {
      setErreur('Le code doit contenir de 4 à 6 chiffres.')
      return
    }
    if (autresPins.includes(pin)) {
      setErreur('Ce code est déjà utilisé, choisis-en un autre.')
      return
    }
    onReinitialiser(collegue.id, pin)
    setOuvert(false)
    setPin('')
    setErreur('')
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="flex items-center gap-1 text-[11px] font-medium text-roche-700 border border-roche-200 rounded-full px-2.5 py-1 hover:bg-white"
      >
        <KeyRound size={12} /> Réinitialiser le PIN
      </button>
    )
  }

  return (
    <form onSubmit={valider} className="flex items-center gap-1.5 flex-wrap">
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        inputMode="numeric"
        maxLength={6}
        autoFocus
        placeholder="Nouveau code"
        className="w-28 rounded-lg border border-roche-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-roche-500"
      />
      <button type="submit" className="p-1.5 rounded-full bg-roche-800 text-white hover:bg-roche-700">
        <Check size={12} />
      </button>
      <button type="button" onClick={() => { setOuvert(false); setPin(''); setErreur('') }} className="p-1.5 rounded-full border border-roche-200 text-roche-600 hover:bg-roche-50">
        <X size={12} />
      </button>
      {erreur && <p className="text-alerte text-[11px] w-full">{erreur}</p>}
    </form>
  )
}

// Nom affiché de l'administrateur (Christophe), modifiable : c'est ce nom que les élèves
// voient dans la liste des professeurs à la connexion.
function NomAdmin({ nomAdmin, onChanger }) {
  const [edition, setEdition] = useState(false)
  const [valeur, setValeur] = useState(nomAdmin || '')

  function valider(e) {
    e.preventDefault()
    if (!valeur.trim()) return
    onChanger(valeur.trim())
    setEdition(false)
  }

  if (!edition) {
    return (
      <button onClick={() => { setValeur(nomAdmin || ''); setEdition(true) }} className="flex items-center gap-1.5 text-xs text-roche-600 hover:text-roche-900 mb-2.5">
        <Pencil size={12} /> Nom affiché aux élèves : <span className="font-medium text-roche-900">{nomAdmin}</span>
      </button>
    )
  }

  return (
    <form onSubmit={valider} className="flex items-center gap-2 mb-2.5">
      <input
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        autoFocus
        className="flex-1 rounded-lg border border-roche-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
      />
      <button type="submit" className="p-1.5 rounded-full bg-roche-800 text-white hover:bg-roche-700"><Check size={13} /></button>
      <button type="button" onClick={() => setEdition(false)} className="p-1.5 rounded-full border border-roche-200 text-roche-600"><X size={13} /></button>
    </form>
  )
}

// accesConfig: { pinAdmin, nomAdmin, collegues: [{ id, nom, pin }] }
// onChangerPinAdmin(nouveauPin), onChangerNomAdmin(nom), onAjouterCollegue(nom, pin),
// onSupprimerCollegue(id), onReinitialiserPinCollegue(id, nouveauPin)
export default function EspaceAcces({ accesConfig, onChangerPinAdmin, onChangerNomAdmin, onAjouterCollegue, onSupprimerCollegue, onReinitialiserPinCollegue }) {
  const [nom, setNom] = useState('')
  const [pin, setPin] = useState('')
  const [erreur, setErreur] = useState('')
  const [pinVisible, setPinVisible] = useState(null) // id du collègue dont le PIN est affiché en clair

  const collegues = accesConfig.collegues || []

  function ajouter(e) {
    e.preventDefault()
    setErreur('')
    if (!nom.trim()) {
      setErreur('Indique le nom du collègue.')
      return
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setErreur('Le code doit contenir de 4 à 6 chiffres.')
      return
    }
    const dejaPris = pin === accesConfig.pinAdmin || collegues.some((c) => c.pin === pin)
    if (dejaPris) {
      setErreur('Ce code est déjà utilisé, choisis-en un autre.')
      return
    }
    onAjouterCollegue(nom.trim(), pin)
    setNom('')
    setPin('')
  }

  function supprimer(c) {
    if (!confirm(`Retirer l'accès de ${c.nom} ? Son code (${c.pin}) ne fonctionnera plus. Ses élèves et son suivi déjà enregistrés seront conservés mais ne seront plus accessibles que depuis "Vue globale".`)) return
    onSupprimerCollegue(c.id)
  }

  return (
    <section>
      <div className="bg-white border border-roche-200 rounded-xl p-3.5 mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <ShieldCheck size={15} className="text-roche-500" />
          <p className="text-sm font-medium text-roche-800">Mon accès (administrateur)</p>
        </div>
        <p className="text-xs text-roche-500 mb-2.5">
          Seul ton code donne accès à la modification du Référentiel (textes, photos, vidéos) et à la Vue globale.
        </p>
        <NomAdmin nomAdmin={accesConfig.nomAdmin} onChanger={onChangerNomAdmin} />
        <ChangerPin pinActuel={accesConfig.pinAdmin} onChanger={onChangerPinAdmin} />
      </div>

      <h3 className="text-xs font-semibold tracking-wide text-roche-500 uppercase mb-3">Collègues autorisés</h3>
      <p className="text-xs text-roche-500 mb-3">
        Attribue un code personnel à chaque collègue pour qu'il utilise l'appli avec ses propres classes.
        Chacun a sa propre base d'élèves et de suivi, séparée de celle des autres et de la tienne : ils ne
        peuvent pas modifier le Référentiel, ni voir les élèves d'un autre collègue.
      </p>

      <form onSubmit={ajouter} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom du collègue"
          className="flex-1 rounded-lg border border-roche-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
        />
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          maxLength={6}
          placeholder="Code PIN (4 à 6 chiffres)"
          className="sm:w-52 rounded-lg border border-roche-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
        />
        <button type="submit" className="flex items-center justify-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition">
          <UserPlus size={14} /> Ajouter
        </button>
      </form>
      {erreur && <p className="text-alerte text-xs mb-3 -mt-2">{erreur}</p>}

      {collegues.length === 0 ? (
        <p className="text-sm text-roche-500">Aucun collègue ajouté pour l'instant.</p>
      ) : (
        <div className="space-y-2">
          {collegues.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-roche-50 rounded-xl px-3.5 py-2.5 gap-2 flex-wrap">
              <div>
                <p className="text-sm font-medium text-roche-900">{c.nom}</p>
                <button
                  onClick={() => setPinVisible(pinVisible === c.id ? null : c.id)}
                  className="flex items-center gap-1 text-xs text-roche-500 hover:text-roche-700 mt-0.5"
                >
                  {pinVisible === c.id ? <EyeOff size={12} /> : <Eye size={12} />}
                  Code : {pinVisible === c.id ? c.pin : '••••'}
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <ReinitialiserPinCollegue
                  collegue={c}
                  autresPins={[accesConfig.pinAdmin, ...collegues.filter((x) => x.id !== c.id).map((x) => x.pin)]}
                  onReinitialiser={onReinitialiserPinCollegue}
                />
                <button
                  onClick={() => supprimer(c)}
                  className="flex items-center gap-1 text-[11px] font-medium text-alerte border border-[#f0d3ca] rounded-full px-2.5 py-1 hover:bg-white"
                >
                  <UserX size={12} /> Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
