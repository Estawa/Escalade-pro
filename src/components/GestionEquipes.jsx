import { useState } from 'react'
import { Users, UserMinus, Check, X, Pencil, Trash2 } from 'lucide-react'
import { rosterOps } from '../utils/rosterOps.js'

// Gestion des équipes de travail (binômes/trinômes) d'une classe : qui travaille avec qui.
// La composition reste fixe sur tout le cycle, sauf réorganisation ponctuelle (absence,
// indisponibilité...). Les rôles (Grimpeur, Assureur, Conseiller) ne sont pas figés ici : chaque
// élève de l'équipe les tient tous à tour de rôle et déclare le sien à chaque passage, dans sa
// fiche de suivi de cycle (ou lors d'une observation du prof).
export default function GestionEquipes({ roster, classe, elevesDeLaClasse, onPersisterRoster }) {
  const { equipes, sansEquipe } = rosterOps.equipesDeLaClasse(roster, classe)

  const [selection, setSelection] = useState([]) // eleveIds choisis dans le pool "sans équipe"
  const [nomEnCours, setNomEnCours] = useState('')
  const [equipeEnRenommage, setEquipeEnRenommage] = useState(null)
  const [nomRenommage, setNomRenommage] = useState('')

  function reinitialiserFormation() {
    setSelection([])
    setNomEnCours('')
  }

  function toggleSelection(id) {
    setSelection((sel) => {
      if (sel.includes(id)) return sel.filter((x) => x !== id)
      if (sel.length >= 3) return sel
      return [...sel, id]
    })
  }

  const peutValider = selection.length === 2 || selection.length === 3

  function valider() {
    if (!peutValider) return
    onPersisterRoster(rosterOps.formerEquipe(roster, classe, nomEnCours, selection))
    reinitialiserFormation()
  }

  function retirer(eleveId) {
    onPersisterRoster(rosterOps.retirerDeEquipe(roster, classe, eleveId))
  }

  function dissoudre(nom) {
    if (!confirm(`Dissoudre ${nom} ? Ses membres repasseront dans la liste "sans équipe".`)) return
    onPersisterRoster(rosterOps.dissoudreEquipe(roster, classe, nom))
  }

  // Renvoie l'équipe dans le pool pour en revoir la composition avant de la reconstituer avec
  // formerEquipe — sert aussi bien à corriger une équipe qu'à en casser une partiellement (il
  // suffit de ne pas re-sélectionner tout le monde).
  function modifier(equipe) {
    onPersisterRoster(rosterOps.dissoudreEquipe(roster, classe, equipe.nom))
    setSelection(equipe.membres.map((m) => m.id))
    setNomEnCours(equipe.nom)
  }

  return (
    <div>
      <p className="text-xs text-roche-500 mb-4">
        Compose les binômes ou trinômes de travail : qui pratique ensemble sur le cycle. Au sein de l'équipe, les élèves
        se répartissent eux-mêmes les rôles (Grimpeur, Assureur, Conseiller) à chaque passage, qu'ils déclarent dans leur
        fiche de suivi de cycle. En cas d'absence, retire l'élève concerné de son équipe, puis recompose au besoin les
        équipes impactées.
      </p>

      {equipes.length === 0 && sansEquipe.length === 0 && <p className="text-sm text-roche-500">Aucun élève dans cette classe.</p>}

      {equipes.length > 0 && (
        <div className="space-y-3 mb-5">
          {equipes.map((eq) => (
            <div key={eq.nom} className="bg-white border border-roche-100 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                {equipeEnRenommage === eq.nom ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      onPersisterRoster(rosterOps.renommerEquipe(roster, classe, eq.nom, nomRenommage))
                      setEquipeEnRenommage(null)
                    }}
                    className="flex items-center gap-1.5 flex-1 min-w-[160px]"
                  >
                    <input
                      autoFocus
                      value={nomRenommage}
                      onChange={(e) => setNomRenommage(e.target.value)}
                      className="flex-1 rounded-lg border border-roche-200 px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                    />
                    <button type="submit" className="p-1 rounded-full bg-roche-800 text-white hover:bg-roche-700">
                      <Check size={13} />
                    </button>
                    <button type="button" onClick={() => setEquipeEnRenommage(null)} className="p-1 rounded-full border border-roche-200 text-roche-600 hover:bg-roche-50">
                      <X size={13} />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setEquipeEnRenommage(eq.nom)
                      setNomRenommage(eq.nom)
                    }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-roche-900"
                  >
                    <Users size={14} className="text-roche-400" /> {eq.nom} <Pencil size={11} className="text-roche-400" />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={() => modifier(eq)} className="text-[11px] font-medium text-roche-700 border border-roche-200 rounded-full px-2.5 py-1 hover:bg-roche-50">
                    Modifier la composition
                  </button>
                  <button
                    onClick={() => dissoudre(eq.nom)}
                    className="flex items-center gap-1 text-[11px] font-medium text-alerte border border-[#f0d3ca] rounded-full px-2.5 py-1 hover:bg-white"
                  >
                    <Trash2 size={11} /> Dissoudre
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {eq.membres.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-roche-800">{m.prenom} {m.nom}</span>
                    <button onClick={() => retirer(m.id)} title="Retirer de l'équipe (absence, indisponibilité...)" className="text-roche-400 hover:text-alerte">
                      <UserMinus size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-roche-50 rounded-xl p-3.5">
        <p className="text-xs font-semibold tracking-wide text-roche-500 uppercase mb-2">
          Élèves sans équipe {sansEquipe.length > 0 && `(${sansEquipe.length})`}
        </p>
        {sansEquipe.length === 0 ? (
          <p className="text-sm text-roche-500">Tous les élèves de la classe font partie d'une équipe.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {sansEquipe.map((e) => (
              <button
                key={e.id}
                onClick={() => toggleSelection(e.id)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition ${
                  selection.includes(e.id) ? 'bg-roche-800 text-white border-roche-800' : 'bg-white border-roche-200 text-roche-700'
                }`}
              >
                {e.prenom} {e.nom}
              </button>
            ))}
          </div>
        )}

        {selection.length > 0 && (
          <div className="bg-white rounded-lg p-3 space-y-2.5">
            <p className="text-xs text-roche-600">
              {selection.length === 1 && "Sélectionne un 2ᵉ élève pour former un binôme (ou un 3ᵉ pour un trinôme)."}
              {selection.length === 2 && 'Binôme prêt à être créé.'}
              {selection.length === 3 && 'Trinôme prêt à être créé.'}
            </p>

            <div>
              <label className="block text-[11px] text-roche-500 mb-1">Nom de l'équipe</label>
              <input
                value={nomEnCours}
                onChange={(e) => setNomEnCours(e.target.value)}
                placeholder={rosterOps.prochainNomEquipe(roster, classe)}
                className="w-full rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!peutValider}
                onClick={valider}
                className="flex items-center gap-1.5 bg-roche-800 disabled:opacity-40 hover:bg-roche-700 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg transition"
              >
                <Check size={13} /> {selection.length === 2 ? 'Créer le binôme' : selection.length === 3 ? 'Créer le trinôme' : 'Valider'}
              </button>
              <button type="button" onClick={reinitialiserFormation} className="text-xs text-roche-500 hover:text-roche-800">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
