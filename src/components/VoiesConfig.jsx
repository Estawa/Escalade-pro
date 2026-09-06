import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import DifficulteSelect from './DifficulteSelect.jsx'
import { formatDifficulte, parseDifficulte } from '../utils/difficulte.js'
import { loadVoies, saveVoies, voiesParDefaut } from '../firebase.js'

const SOUS_COLONNES = [3, 2, 1] // ordre d'affichage : 3 couleurs, puis 2, puis 1

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

  function setCouleur(numero, nbCouleurs, patch) {
    setVoies((liste) =>
      liste.map((v) => {
        if (v.numero !== numero) return v
        const courante = v.couleurs[nbCouleurs] || { nom: '', difficulte: '' }
        return { ...v, couleurs: { ...v.couleurs, [nbCouleurs]: { ...courante, ...patch } } }
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
        Pour chaque voie du mur (1 à 17), indique le nom de la couleur de prise et la difficulté correspondante
        pour 3, 2 puis 1 couleur(s) utilisée(s). Laisse vide si une combinaison n'existe pas sur cette voie.
        Cette configuration sert d'en-tête au tableau de suivi de cycle et pré-remplit la difficulté saisie par
        les élèves.
      </p>
      <div className="overflow-x-auto">
        <table className="text-sm w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-2 py-1.5 text-roche-500 text-xs uppercase">Voie</th>
              {SOUS_COLONNES.map((n) => (
                <th key={n} className="text-left px-2 py-1.5 text-roche-500 text-xs uppercase">{n} couleur{n > 1 ? 's' : ''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {voies.map((v) => (
              <tr key={v.numero} className="border-t border-roche-100">
                <td className="px-2 py-2 font-medium text-roche-900">Voie {v.numero}</td>
                {SOUS_COLONNES.map((n) => {
                  const c = v.couleurs[n] || { nom: '', difficulte: '' }
                  const d = parseDifficulte(c.difficulte)
                  return (
                    <td key={n} className="px-2 py-2">
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={c.nom}
                          onChange={(e) => setCouleur(v.numero, n, { nom: e.target.value })}
                          placeholder="Couleur (ex. Rouge)"
                          className="w-full rounded-lg border border-roche-200 px-2 py-1.5 text-sm bg-white"
                        />
                        <DifficulteSelect
                          chiffre={d.chiffre}
                          lettre={d.lettre}
                          plus={d.plus}
                          onChange={(patch) => setCouleur(v.numero, n, { difficulte: formatDifficulte({ ...d, ...patch }) })}
                        />
                      </div>
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
