import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import DifficulteSelect from './DifficulteSelect.jsx'
import { formatDifficulte, parseDifficulte } from '../utils/difficulte.js'
import { loadVoies, saveVoies, voiesParDefaut } from '../firebase.js'

export default function VoiesConfig() {
  const [voies, setVoies] = useState(voiesParDefaut())
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadVoies()
      .then(setVoies)
      .catch(() => {})
      .finally(() => setChargement(false))
  }, [])

  function setDifficulteCouleur(numero, nbCouleurs, patch) {
    setVoies((liste) =>
      liste.map((v) => {
        if (v.numero !== numero) return v
        const courante = parseDifficulte(v.couleurs[nbCouleurs])
        const nouvelle = { ...courante, ...patch }
        return { ...v, couleurs: { ...v.couleurs, [nbCouleurs]: formatDifficulte(nouvelle) } }
      })
    )
  }

  async function enregistrer() {
    try {
      await saveVoies(voies)
      setMessage('Configuration des voies enregistrée.')
    } catch (e) {
      setMessage("Échec de l'enregistrement : " + e.message)
    }
  }

  if (chargement) return <p className="text-sm text-roche-500">Chargement des voies...</p>

  return (
    <div>
      <p className="text-sm text-roche-600 mb-4">
        Pour chaque voie du mur (1 à 17), indique la difficulté correspondant à 1, 2 ou 3 couleurs de prise
        utilisées. Laisse vide si une combinaison n'existe pas sur cette voie. Cette configuration sert à
        pré-remplir la difficulté saisie par les élèves dans leur suivi de cycle.
      </p>
      <div className="overflow-x-auto">
        <table className="text-sm w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-2 py-1.5 text-roche-500 text-xs uppercase">Voie</th>
              <th className="text-left px-2 py-1.5 text-roche-500 text-xs uppercase">1 couleur</th>
              <th className="text-left px-2 py-1.5 text-roche-500 text-xs uppercase">2 couleurs</th>
              <th className="text-left px-2 py-1.5 text-roche-500 text-xs uppercase">3 couleurs</th>
            </tr>
          </thead>
          <tbody>
            {voies.map((v) => (
              <tr key={v.numero} className="border-t border-roche-100">
                <td className="px-2 py-2 font-medium text-roche-900">Voie {v.numero}</td>
                {[1, 2, 3].map((n) => {
                  const d = parseDifficulte(v.couleurs[n])
                  return (
                    <td key={n} className="px-2 py-2">
                      <DifficulteSelect
                        chiffre={d.chiffre}
                        lettre={d.lettre}
                        plus={d.plus}
                        onChange={(patch) => setDifficulteCouleur(v.numero, n, patch)}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={enregistrer}
        className="mt-4 flex items-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
      >
        <Save size={15} /> Enregistrer la configuration des voies
      </button>
      {message && <p className="text-xs text-roche-600 mt-2">{message}</p>}
    </div>
  )
}
