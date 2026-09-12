import { useState } from 'react'
import { UserPlus, UserX, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import ChangerPin from './ChangerPin.jsx'

// accesConfig: { pinAdmin, collegues: [{ id, nom, pin }] }
// onChangerPinAdmin(nouveauPin), onAjouterCollegue(nom, pin), onSupprimerCollegue(id)
export default function EspaceAcces({ accesConfig, onChangerPinAdmin, onAjouterCollegue, onSupprimerCollegue }) {
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
    if (!confirm(`Retirer l'accès de ${c.nom} ? Son code (${c.pin}) ne fonctionnera plus.`)) return
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
          Seul ton code donne accès à la modification du Référentiel (textes, photos, vidéos).
        </p>
        <ChangerPin pinActuel={accesConfig.pinAdmin} onChanger={onChangerPinAdmin} />
      </div>

      <h3 className="text-xs font-semibold tracking-wide text-roche-500 uppercase mb-3">Collègues autorisés</h3>
      <p className="text-xs text-roche-500 mb-3">
        Attribue un code personnel à chaque collègue pour qu'il utilise l'appli avec ses propres classes.
        Ils peuvent tout faire sauf modifier le Référentiel.
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
            <div key={c.id} className="flex items-center justify-between bg-roche-50 rounded-xl px-3.5 py-2.5">
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
              <button
                onClick={() => supprimer(c)}
                className="flex items-center gap-1 text-[11px] font-medium text-alerte border border-[#f0d3ca] rounded-full px-2.5 py-1 hover:bg-white"
              >
                <UserX size={12} /> Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
