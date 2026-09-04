import { useEffect, useMemo, useState } from 'react'
import {
  Upload, ChevronDown, ChevronUp, KeyRound, UserX, Pencil, UserPlus,
  FolderPlus, FolderX, Check, X, ClipboardList
} from 'lucide-react'
import Referentiel from './Referentiel.jsx'
import ImportEleves from './ImportEleves.jsx'
import EvaluationProf from './EvaluationProf.jsx'
import { storage } from '../utils/storage.js'
import { loadAllEvaluations, cleEvaluation } from '../firebase.js'

export default function EnseignantDashboard({ videos, onSaveVideo, onRemovePhase }) {
  const [onglet, setOnglet] = useState('referentiel') // referentiel | suivi
  const [importOuvert, setImportOuvert] = useState(false)
  const [rosterVersion, setRosterVersion] = useState(0)
  const [classeSelectionnee, setClasseSelectionnee] = useState(null)
  const [eleveOuvert, setEleveOuvert] = useState(null)
  const [eleveEnEdition, setEleveEnEdition] = useState(null)
  const [editNom, setEditNom] = useState('')
  const [editPrenom, setEditPrenom] = useState('')
  const [editSexe, setEditSexe] = useState('')
  const [ajoutEleveOuvert, setAjoutEleveOuvert] = useState(false)
  const [nouvelEleveNom, setNouvelEleveNom] = useState('')
  const [nouvelElevePrenom, setNouvelElevePrenom] = useState('')
  const [nouvelEleveSexe, setNouvelEleveSexe] = useState('')
  const [nouvelleClasseOuverte, setNouvelleClasseOuverte] = useState(false)
  const [nouvelleClasseNom, setNouvelleClasseNom] = useState('')
  const [evaluations, setEvaluations] = useState({})
  const [evalEnCoursPour, setEvalEnCoursPour] = useState(null)

  useEffect(() => {
    loadAllEvaluations().then(setEvaluations).catch(() => {})
  }, [])

  const classes = useMemo(() => storage.getClasses(), [rosterVersion])
  const classeActive = classeSelectionnee !== null ? classeSelectionnee : classes.length > 0 ? classes[0] : null

  const elevesDeLaClasse = useMemo(() => {
    if (classeActive === null) return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return storage.getElevesClasse(classeActive)
  }, [classeActive, rosterVersion])

  function supprimerEleve(eleveId) {
    if (!eleveId || classeActive === null) return
    if (!confirm('Supprimer cet élève de la classe ? Ses évaluations enregistrées sont conservées.')) return
    storage.supprimerEleve(classeActive, eleveId)
    setRosterVersion((v) => v + 1)
  }

  function supprimerClasseActive() {
    if (classeActive === null) return
    if (!confirm(`Supprimer entièrement la classe ${classeActive} et tous ses élèves ? Leurs évaluations enregistrées sont conservées.`)) return
    storage.supprimerClasse(classeActive)
    setClasseSelectionnee(null)
    setEleveOuvert(null)
    setRosterVersion((v) => v + 1)
  }

  function reinitialiserPin(eleveId) {
    if (!eleveId || classeActive === null) return
    storage.reinitialiserPin(classeActive, eleveId)
    setRosterVersion((v) => v + 1)
  }

  function ouvrirEdition(eleve) {
    setEleveEnEdition(eleve.id)
    setEditNom(eleve.nom)
    setEditPrenom(eleve.prenom)
    setEditSexe(eleve.sexe || '')
  }

  function enregistrerEdition(eleveId) {
    if (!editNom.trim() || !editPrenom.trim() || classeActive === null) return
    storage.modifierEleve(classeActive, eleveId, { nom: editNom, prenom: editPrenom, sexe: editSexe })
    setEleveEnEdition(null)
    setRosterVersion((v) => v + 1)
  }

  function ajouterEleve(e) {
    e.preventDefault()
    if (!nouvelEleveNom.trim() || !nouvelElevePrenom.trim() || classeActive === null) return
    storage.ajouterEleveManuel(classeActive, nouvelEleveNom, nouvelElevePrenom, nouvelEleveSexe || null)
    setNouvelEleveNom('')
    setNouvelElevePrenom('')
    setNouvelEleveSexe('')
    setAjoutEleveOuvert(false)
    setRosterVersion((v) => v + 1)
  }

  function creerClasse(e) {
    e.preventDefault()
    if (!nouvelleClasseNom.trim()) return
    const nom = storage.ajouterClasse(nouvelleClasseNom)
    setNouvelleClasseNom('')
    setNouvelleClasseOuverte(false)
    setClasseSelectionnee(nom)
    setRosterVersion((v) => v + 1)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-roche-900">Espace enseignant</h2>
      </div>

      <div className="flex gap-1.5 mb-6 bg-roche-50 rounded-full p-1 w-fit">
        {[
          { id: 'referentiel', label: 'Référentiel' },
          { id: 'suivi', label: 'Élèves & suivi' }
        ].map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full transition ${onglet === o.id ? 'bg-roche-800 text-white' : 'text-roche-600'}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === 'referentiel' && (
        <Referentiel videos={videos} modeProf onSaveVideo={onSaveVideo} onRemovePhase={onRemovePhase} />
      )}

      {onglet === 'suivi' && (
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-roche-500 uppercase">Classes</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setNouvelleClasseOuverte((v) => !v)} className="flex items-center gap-1.5 text-xs font-medium text-roche-700 hover:text-roche-900">
                <FolderPlus size={14} /> Nouvelle classe
              </button>
              <button onClick={() => setImportOuvert(true)} className="flex items-center gap-1.5 text-xs font-medium text-roche-700 hover:text-roche-900">
                <Upload size={14} /> Importer des élèves
              </button>
              {classeActive !== null && (
                <button onClick={supprimerClasseActive} className="flex items-center gap-1.5 text-xs font-medium text-alerte hover:text-alerte/80">
                  <FolderX size={14} /> Supprimer la classe
                </button>
              )}
            </div>
          </div>

          {nouvelleClasseOuverte && (
            <form onSubmit={creerClasse} className="flex items-center gap-2 mb-4">
              <input
                value={nouvelleClasseNom}
                onChange={(e) => setNouvelleClasseNom(e.target.value)}
                placeholder="Ex : 2NDE7"
                autoFocus
                className="flex-1 rounded-xl border border-roche-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
              />
              <button type="submit" className="bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition">
                Créer
              </button>
            </form>
          )}

          {classes.length === 0 ? (
            <p className="text-sm text-roche-500">Aucune classe pour l'instant. Importe une liste d'élèves ou crée une classe pour commencer.</p>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
                {classes.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setClasseSelectionnee(c)
                      setEleveOuvert(null)
                      setEleveEnEdition(null)
                      setAjoutEleveOuvert(false)
                      setEvalEnCoursPour(null)
                    }}
                    className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${classeActive === c ? 'bg-roche-800 text-white border-roche-800' : 'border-roche-200 text-roche-600'}`}
                  >
                    {c || '(sans nom)'}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-roche-500">{elevesDeLaClasse.length} élève{elevesDeLaClasse.length > 1 ? 's' : ''}</p>
                <button
                  onClick={() => setAjoutEleveOuvert((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-roche-700 hover:text-roche-900"
                >
                  <UserPlus size={14} /> Ajouter un élève
                </button>
              </div>

              {ajoutEleveOuvert && (
                <form onSubmit={ajouterEleve} className="flex flex-col sm:flex-row gap-2 mb-4 bg-roche-50 rounded-xl p-3">
                  <input
                    value={nouvelElevePrenom}
                    onChange={(e) => setNouvelElevePrenom(e.target.value)}
                    placeholder="Prénom"
                    autoFocus
                    className="flex-1 rounded-xl border border-roche-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                  />
                  <input
                    value={nouvelEleveNom}
                    onChange={(e) => setNouvelEleveNom(e.target.value)}
                    placeholder="Nom"
                    className="flex-1 rounded-xl border border-roche-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                  />
                  <select
                    value={nouvelEleveSexe}
                    onChange={(e) => setNouvelEleveSexe(e.target.value)}
                    className="rounded-xl border border-roche-200 px-2.5 py-2 text-sm bg-white"
                  >
                    <option value="">Sexe</option>
                    <option value="F">F</option>
                    <option value="M">M</option>
                  </select>
                  <button type="submit" className="bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition">
                    Ajouter
                  </button>
                </form>
              )}

              {elevesDeLaClasse.length === 0 && <p className="text-sm text-roche-500">Aucun élève dans cette classe.</p>}

              <div className="space-y-2">
                {elevesDeLaClasse.map((eleve) => {
                  const eleveComplet = { id: eleve.id, nom: eleve.nom, prenom: eleve.prenom, classe: classeActive }
                  const evalExistante = evaluations[cleEvaluation(eleveComplet)]
                  const ouvert = eleveOuvert === eleve.id
                  return (
                    <div key={eleve.id} className="bg-roche-50 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          setEleveOuvert(ouvert ? null : eleve.id)
                          setEvalEnCoursPour(null)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-roche-900">
                            {eleve.prenom} {eleve.nom}
                            {eleve.sexe && <span className="text-roche-400 font-normal"> ({eleve.sexe})</span>}
                          </p>
                          <p className="text-xs text-roche-500">
                            {evalExistante?.scoreEleve !== undefined && `Auto-éval ${evalExistante.scoreEleve}%`}
                            {evalExistante?.scoreEleve !== undefined && evalExistante?.scoreProf !== undefined && ' · '}
                            {evalExistante?.scoreProf !== undefined && `Note prof ${evalExistante.scoreProf}/20`}
                            {evalExistante?.scoreEleve === undefined && evalExistante?.scoreProf === undefined && 'Pas encore évalué'}
                            {!eleve.pin && ' · PIN non défini'}
                          </p>
                        </div>
                        {ouvert ? <ChevronUp size={18} className="text-roche-500" /> : <ChevronDown size={18} className="text-roche-500" />}
                      </button>

                      {ouvert && (
                        <div className="px-4 pb-4 space-y-2">
                          {eleveEnEdition === eleve.id && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                enregistrerEdition(eleve.id)
                              }}
                              className="flex flex-col sm:flex-row gap-2 mb-2"
                            >
                              <input
                                value={editPrenom}
                                onChange={(e) => setEditPrenom(e.target.value)}
                                autoFocus
                                className="flex-1 rounded-lg border border-roche-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                              />
                              <input
                                value={editNom}
                                onChange={(e) => setEditNom(e.target.value)}
                                className="flex-1 rounded-lg border border-roche-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                              />
                              <select
                                value={editSexe}
                                onChange={(e) => setEditSexe(e.target.value)}
                                className="rounded-lg border border-roche-200 px-2 py-1.5 text-sm bg-white"
                              >
                                <option value="">Sexe</option>
                                <option value="F">F</option>
                                <option value="M">M</option>
                              </select>
                              <div className="flex gap-1.5">
                                <button type="submit" className="p-1.5 rounded-full bg-roche-800 text-white hover:bg-roche-700">
                                  <Check size={14} />
                                </button>
                                <button type="button" onClick={() => setEleveEnEdition(null)} className="p-1.5 rounded-full border border-roche-200 text-roche-600 hover:bg-roche-50">
                                  <X size={14} />
                                </button>
                              </div>
                            </form>
                          )}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <button
                              onClick={() => ouvrirEdition(eleve)}
                              className="flex items-center gap-1 text-[11px] font-medium text-roche-700 border border-roche-200 rounded-full px-2.5 py-1 hover:bg-white"
                            >
                              <Pencil size={12} /> Modifier nom/prénom
                            </button>
                            <button
                              onClick={() => reinitialiserPin(eleve.id)}
                              className="flex items-center gap-1 text-[11px] font-medium text-roche-700 border border-roche-200 rounded-full px-2.5 py-1 hover:bg-white"
                            >
                              <KeyRound size={12} /> Réinitialiser le PIN
                            </button>
                            <button
                              onClick={() => setEvalEnCoursPour(evalEnCoursPour === eleve.id ? null : eleve.id)}
                              className="flex items-center gap-1 text-[11px] font-medium text-roche-700 border border-roche-200 rounded-full px-2.5 py-1 hover:bg-white"
                            >
                              <ClipboardList size={12} /> {evalEnCoursPour === eleve.id ? 'Fermer' : 'Évaluer'}
                            </button>
                            <button
                              onClick={() => supprimerEleve(eleve.id)}
                              className="flex items-center gap-1 text-[11px] font-medium text-alerte border border-[#f0d3ca] rounded-full px-2.5 py-1 hover:bg-white"
                            >
                              <UserX size={12} /> Retirer de la classe
                            </button>
                          </div>

                          {evalEnCoursPour === eleve.id && (
                            <div className="bg-white rounded-xl p-3">
                              <EvaluationProf
                                eleve={eleveComplet}
                                evaluationExistante={evalExistante}
                                onEnregistre={(patch) =>
                                  setEvaluations((ev) => ({ ...ev, [cleEvaluation(eleveComplet)]: { ...ev[cleEvaluation(eleveComplet)], ...patch } }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      )}

      {importOuvert && (
        <ImportEleves
          onImporte={() => {
            setImportOuvert(false)
            setRosterVersion((v) => v + 1)
          }}
          onFermer={() => setImportOuvert(false)}
        />
      )}
    </div>
  )
}
