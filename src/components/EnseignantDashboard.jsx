import { useEffect, useMemo, useState } from 'react'
import {
  Upload, ChevronDown, ChevronUp, KeyRound, UserX, Pencil, UserPlus,
  FolderPlus, FolderX, Check, X, ClipboardList, Mountain, Table, List, Eye,
  Share2, Copy, ChevronRight, Lock, Unlock, LogOut, Users
} from 'lucide-react'
import Referentiel from './Referentiel.jsx'
import ImportEleves from './ImportEleves.jsx'
import EvaluationProf from './EvaluationProf.jsx'
import SuiviEleveProf from './SuiviEleveProf.jsx'
import VoiesConfig from './VoiesConfig.jsx'
import EspaceAcces from './EspaceAcces.jsx'
import GrilleSuiviVoies from './GrilleSuiviVoies.jsx'
import DetailCellule from './DetailCellule.jsx'
import TableauPerformanceProf from './TableauPerformanceProf.jsx'
import { rosterOps } from '../utils/rosterOps.js'
import {
  loadAllEvaluations, cleEvaluation, loadAllPassages, loadAllObservations, loadVoies, voiesParDefaut, supprimerPassage,
  loadRosterTeacher, saveRosterTeacher
} from '../firebase.js'

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
      try { await navigator.share({ title: 'Escalade Pro', text: 'Application de sécurité et d\'assurage en escalade', url }) } catch (e) { /* annulé */ }
    } else {
      copier()
    }
  }

  return (
    <div className="bg-white border border-roche-200 rounded-xl p-3.5 mb-4">
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
          <p className="text-xs text-roche-500 text-center break-all px-2">{url || 'Adresse disponible une fois l\'appli déployée'}</p>
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

// Verrou d'édition du Référentiel : redemande le code admin avant d'autoriser toute
// modification (textes, photos, vidéos), pour éviter un effacement ou une modification par
// erreur. Se reverrouille automatiquement en quittant l'onglet ou l'espace enseignant.
function VerrouReferentiel({ pinAdmin, deverrouille, onDeverrouiller, onVerrouiller }) {
  const [pin, setPin] = useState('')
  const [erreur, setErreur] = useState(false)

  if (deverrouille) {
    return (
      <div className="flex items-center justify-between bg-[#eef6ee] border border-[#cfe6cf] rounded-xl px-3.5 py-2.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-[#3a6b3a]">
          <Unlock size={15} /> Édition déverrouillée
        </div>
        <button
          onClick={onVerrouiller}
          className="flex items-center gap-1.5 text-xs font-medium text-[#3a6b3a] border border-[#cfe6cf] rounded-full px-2.5 py-1 hover:bg-white"
        >
          <Lock size={12} /> Verrouiller
        </button>
      </div>
    )
  }

  function valider(e) {
    e.preventDefault()
    if (pin === pinAdmin) {
      setPin('')
      setErreur(false)
      onDeverrouiller()
    } else {
      setErreur(true)
      setPin('')
    }
  }

  return (
    <form onSubmit={valider} className="flex items-center gap-2 bg-roche-50 border border-roche-200 rounded-xl px-3.5 py-2.5 mb-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-roche-700 mr-1">
        <Lock size={15} /> Édition verrouillée
      </div>
      <input
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        placeholder="Code pour déverrouiller"
        maxLength={6}
        className={`rounded-lg border px-3 py-1.5 text-sm focus:outline-none w-44 ${erreur ? 'border-alerte' : 'border-roche-200 focus:ring-2 focus:ring-roche-500'}`}
      />
      <button type="submit" className="flex items-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition">
        <Unlock size={12} /> Déverrouiller
      </button>
      {erreur && <p className="text-alerte text-xs w-full">Code incorrect.</p>}
    </form>
  )
}

// Sélecteur d'espace pour la Vue globale (admin uniquement) : dropdown pour choisir quel
// collègue consulter (élèves + suivi), accès complet en lecture/écriture comme le sien.
function SelecteurEspace({ collegues, collegueConsulteId, onChoisir }) {
  if (collegues.length === 0) {
    return <p className="text-sm text-roche-500 mb-4">Aucun collègue ajouté pour l'instant (onglet "Accès").</p>
  }
  return (
    <div className="flex items-center gap-2.5 mb-5 flex-wrap">
      <label className="text-xs font-semibold tracking-wide text-roche-500 uppercase">Espace consulté</label>
      <select
        value={collegueConsulteId || ''}
        onChange={(e) => onChoisir(e.target.value)}
        className="rounded-lg border border-roche-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-roche-500"
      >
        {collegues.map((c) => (
          <option key={c.id} value={c.id}>{c.nom}</option>
        ))}
      </select>
    </div>
  )
}

export default function EnseignantDashboard({
  role, nomCollegue, teacherIdEnseignant, onDeconnexionEnseignant,
  videos, onSaveVideo, onRemovePhase, onAddPhoto, onRemovePhoto,
  referentielConfig, onEditItem, onAddItem, onRemoveItem,
  accesConfig, onChangerPinAdmin, onChangerNomAdmin, onAjouterCollegue, onSupprimerCollegue, onReinitialiserPinCollegue
}) {
  const estAdmin = role === 'admin'
  const [onglet, setOnglet] = useState('referentiel') // referentiel | voies | suivi | global | acces
  const [editionReferentielDeverrouillee, setEditionReferentielDeverrouillee] = useState(false)
  const [importOuvert, setImportOuvert] = useState(false)
  const [classeSelectionnee, setClasseSelectionnee] = useState(null)
  const [vueSuivi, setVueSuivi] = useState('liste') // liste | tableau | performance
  const [eleveOuvert, setEleveOuvert] = useState(null)
  const [eleveEnEdition, setEleveEnEdition] = useState(null)
  const [editNom, setEditNom] = useState('')
  const [editPrenom, setEditPrenom] = useState('')
  const [editSexe, setEditSexe] = useState('')
  const [editEquipe, setEditEquipe] = useState('')
  const [ajoutEleveOuvert, setAjoutEleveOuvert] = useState(false)
  const [nouvelEleveNom, setNouvelEleveNom] = useState('')
  const [nouvelElevePrenom, setNouvelElevePrenom] = useState('')
  const [nouvelEleveSexe, setNouvelEleveSexe] = useState('')
  const [nouvelEleveEquipe, setNouvelEleveEquipe] = useState('')
  const [nouvelleClasseOuverte, setNouvelleClasseOuverte] = useState(false)
  const [nouvelleClasseNom, setNouvelleClasseNom] = useState('')
  const [evaluations, setEvaluations] = useState({})
  const [passagesParEleve, setPassagesParEleve] = useState({})
  const [observationsParEleve, setObservationsParEleve] = useState({})
  const [voies, setVoies] = useState(voiesParDefaut())
  const [panneauOuvertPour, setPanneauOuvertPour] = useState(null) // { id: eleveId, type: 'eval' | 'cycle' }
  const [detailCellule, setDetailCellule] = useState(null)

  // --- Vue globale (admin) : quel collègue consulter. "Élèves & suivi" reste toujours mon
  // propre espace (teacherIdEnseignant) ; "Vue globale" bascule sur l'espace choisi ici. ---
  const [collegueConsulteId, setCollegueConsulteId] = useState(null)
  const collegues = accesConfig.collegues || []
  useEffect(() => {
    if (estAdmin && !collegueConsulteId && collegues.length > 0) setCollegueConsulteId(collegues[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegues.length])

  const teacherIdCourant = onglet === 'global' ? collegueConsulteId : teacherIdEnseignant

  // --- Roster (classes + élèves) de l'espace actuellement affiché, chargé/sauvegardé sur
  // Firebase, isolé par enseignant (teacherId). ---
  const [roster, setRoster] = useState({})
  const [chargementRoster, setChargementRoster] = useState(true)
  const [erreurRoster, setErreurRoster] = useState('')

  useEffect(() => {
    if (!teacherIdCourant) {
      setRoster({})
      setChargementRoster(false)
      return
    }
    let annule = false
    setChargementRoster(true)
    loadRosterTeacher(teacherIdCourant)
      .then((r) => { if (!annule) setRoster(r) })
      .catch((e) => { if (!annule) setErreurRoster('Chargement des classes impossible : ' + e.message) })
      .finally(() => { if (!annule) setChargementRoster(false) })
    setClasseSelectionnee(null)
    setEleveOuvert(null)
    return () => { annule = true }
  }, [teacherIdCourant])

  function persisterRoster(next) {
    setRoster(next)
    if (!teacherIdCourant) return
    saveRosterTeacher(teacherIdCourant, next).catch((e) => setErreurRoster('Échec de la sauvegarde : ' + e.message))
  }

  useEffect(() => {
    loadAllEvaluations().then(setEvaluations).catch(() => {})
    loadAllPassages().then(setPassagesParEleve).catch(() => {})
    loadAllObservations().then(setObservationsParEleve).catch(() => {})
    loadVoies().then(setVoies).catch(() => {})
  }, [])

  // Reverrouille automatiquement l'édition du Référentiel dès qu'on quitte cet onglet.
  useEffect(() => {
    if (onglet !== 'referentiel') setEditionReferentielDeverrouillee(false)
  }, [onglet])

  const classes = useMemo(() => rosterOps.getClasses(roster), [roster])
  const classeActive = classeSelectionnee !== null ? classeSelectionnee : classes.length > 0 ? classes[0] : null

  const elevesDeLaClasse = useMemo(() => {
    if (classeActive === null) return []
    return rosterOps.getElevesClasse(roster, classeActive)
  }, [roster, classeActive])

  // Construit un objet élève complet, avec le teacherId de l'espace actuellement affiché,
  // pour que les clés de suivi (cleEvaluation) restent isolées entre enseignants.
  function eleveAvecTeacher(eleve, classe = classeActive) {
    return { id: eleve.id, nom: eleve.nom, prenom: eleve.prenom, classe, teacherId: teacherIdCourant }
  }

  // Lignes du tableau récapitulatif de suivi de cycle pour la classe active,
  // regroupées visuellement par équipe (binôme/trinôme) dans GrilleSuiviVoies.
  const lignesTableauClasse = useMemo(
    () =>
      elevesDeLaClasse.map((eleve) => {
        const eleveComplet = eleveAvecTeacher(eleve)
        return {
          key: eleve.id,
          titre: `${eleve.prenom} ${eleve.nom}`,
          equipe: eleve.equipe || '',
          eleveComplet,
          passages: passagesParEleve[cleEvaluation(eleveComplet)] || []
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elevesDeLaClasse, classeActive, teacherIdCourant, passagesParEleve]
  )

  function ouvrirDetailCelluleClasse(ligne, numeroVoie, nbCouleurs, passagesCellule) {
    const v = voies.find((x) => x.numero === numeroVoie)
    const c = v?.couleurs?.[nbCouleurs]
    setDetailCellule({
      titre: `${ligne.titre} — Voie ${numeroVoie}`,
      sousTitre: [
        `${nbCouleurs} couleur${nbCouleurs > 1 ? 's' : ''}`,
        c?.nom,
        c?.difficulte
      ].filter(Boolean).join(' · '),
      eleveComplet: ligne.eleveComplet,
      passages: passagesCellule
    })
  }

  async function supprimerPassageDepuisDetail(passage) {
    if (!detailCellule?.eleveComplet) return
    const { eleveComplet } = detailCellule
    const cle = cleEvaluation(eleveComplet)
    const avant = passagesParEleve[cle] || []
    const apres = avant.filter((p) => p.id !== passage.id)
    setPassagesParEleve((m) => ({ ...m, [cle]: apres }))
    setDetailCellule((d) => (d ? { ...d, passages: d.passages.filter((p) => p.id !== passage.id) } : d))
    try {
      await supprimerPassage(eleveComplet, passage.id)
    } catch (e) {
      setPassagesParEleve((m) => ({ ...m, [cle]: avant }))
    }
  }

  function supprimerEleve(eleveId) {
    if (!eleveId || classeActive === null) return
    if (!confirm('Supprimer cet élève de la classe ? Ses évaluations enregistrées sont conservées.')) return
    persisterRoster(rosterOps.supprimerEleve(roster, classeActive, eleveId))
  }

  function supprimerClasseActive() {
    if (classeActive === null) return
    if (!confirm(`Supprimer entièrement la classe ${classeActive} et tous ses élèves ? Leurs évaluations enregistrées sont conservées.`)) return
    persisterRoster(rosterOps.supprimerClasse(roster, classeActive))
    setClasseSelectionnee(null)
    setEleveOuvert(null)
  }

  function reinitialiserPin(eleveId) {
    if (!eleveId || classeActive === null) return
    persisterRoster(rosterOps.reinitialiserPin(roster, classeActive, eleveId))
  }

  function ouvrirEdition(eleve) {
    setEleveEnEdition(eleve.id)
    setEditNom(eleve.nom)
    setEditPrenom(eleve.prenom)
    setEditSexe(eleve.sexe || '')
    setEditEquipe(eleve.equipe || '')
  }

  function enregistrerEdition(eleveId) {
    if (!editNom.trim() || !editPrenom.trim() || classeActive === null) return
    persisterRoster(rosterOps.modifierEleve(roster, classeActive, eleveId, { nom: editNom, prenom: editPrenom, sexe: editSexe, equipe: editEquipe }))
    setEleveEnEdition(null)
  }

  function ajouterEleve(e) {
    e.preventDefault()
    if (!nouvelEleveNom.trim() || !nouvelElevePrenom.trim() || classeActive === null) return
    const { roster: next } = rosterOps.ajouterEleveManuel(roster, classeActive, nouvelEleveNom, nouvelElevePrenom, nouvelEleveSexe || null, nouvelEleveEquipe || null)
    persisterRoster(next)
    setNouvelEleveNom('')
    setNouvelElevePrenom('')
    setNouvelEleveSexe('')
    setNouvelEleveEquipe('')
    setAjoutEleveOuvert(false)
  }

  function creerClasse(e) {
    e.preventDefault()
    if (!nouvelleClasseNom.trim()) return
    const { roster: next, nom } = rosterOps.ajouterClasse(roster, nouvelleClasseNom)
    persisterRoster(next)
    setNouvelleClasseNom('')
    setNouvelleClasseOuverte(false)
    setClasseSelectionnee(nom)
  }

  const titreEspace = onglet === 'global' ? (collegues.find((c) => c.id === collegueConsulteId)?.nom || '') : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl text-roche-900">Espace enseignant</h2>
          {!estAdmin && nomCollegue && <p className="text-xs text-roche-500 mt-0.5">Connecté en tant que {nomCollegue}</p>}
        </div>
        <button
          onClick={onDeconnexionEnseignant}
          className="flex items-center gap-1.5 text-xs font-medium text-roche-600 hover:text-roche-900"
        >
          <LogOut size={13} /> Se déconnecter
        </button>
      </div>

      <PartagerApp />

      <div className="flex gap-1.5 mb-6 bg-roche-50 rounded-full p-1 w-fit flex-wrap">
        {[
          { id: 'referentiel', label: 'Référentiel' },
          { id: 'voies', label: 'Voies' },
          { id: 'suivi', label: 'Mes classes' },
          ...(estAdmin ? [{ id: 'global', label: 'Vue globale' }] : []),
          ...(estAdmin ? [{ id: 'acces', label: 'Accès' }] : [])
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
        <>
          {estAdmin ? (
            <VerrouReferentiel
              pinAdmin={accesConfig.pinAdmin}
              deverrouille={editionReferentielDeverrouillee}
              onDeverrouiller={() => setEditionReferentielDeverrouillee(true)}
              onVerrouiller={() => setEditionReferentielDeverrouillee(false)}
            />
          ) : (
            <p className="text-xs text-roche-500 mb-4">Consultation seule — seul l'administrateur peut modifier le Référentiel.</p>
          )}
          <Referentiel
            videos={videos}
            modeProf={estAdmin && editionReferentielDeverrouillee}
            onSaveVideo={onSaveVideo}
            onRemovePhase={onRemovePhase}
            onAddPhoto={onAddPhoto}
            onRemovePhoto={onRemovePhoto}
            referentielConfig={referentielConfig}
            onEditItem={onEditItem}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
          />
        </>
      )}

      {onglet === 'acces' && estAdmin && (
        <EspaceAcces
          accesConfig={accesConfig}
          onChangerPinAdmin={onChangerPinAdmin}
          onChangerNomAdmin={onChangerNomAdmin}
          onAjouterCollegue={onAjouterCollegue}
          onSupprimerCollegue={onSupprimerCollegue}
          onReinitialiserPinCollegue={onReinitialiserPinCollegue}
        />
      )}

      {onglet === 'voies' && <VoiesConfig />}

      {onglet === 'global' && estAdmin && (
        <SelecteurEspace collegues={collegues} collegueConsulteId={collegueConsulteId} onChoisir={setCollegueConsulteId} />
      )}

      {(onglet === 'suivi' || (onglet === 'global' && collegueConsulteId)) && (
        <section>
          {onglet === 'global' && titreEspace && (
            <p className="flex items-center gap-1.5 text-xs text-roche-500 mb-3">
              <Users size={13} /> Élèves et suivi de <strong className="text-roche-700">{titreEspace}</strong>
            </p>
          )}
          {erreurRoster && <p className="text-sm text-alerte bg-[#fbeeea] rounded-lg px-3 py-2 mb-3">{erreurRoster}</p>}
          {chargementRoster ? (
            <p className="text-sm text-roche-500">Chargement des classes...</p>
          ) : (
            <>
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
                          setPanneauOuvertPour(null)
                        }}
                        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${classeActive === c ? 'bg-roche-800 text-white border-roche-800' : 'border-roche-200 text-roche-600'}`}
                      >
                        {c || '(sans nom)'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <p className="text-xs text-roche-500">{elevesDeLaClasse.length} élève{elevesDeLaClasse.length > 1 ? 's' : ''}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex gap-1 bg-roche-50 rounded-full p-1">
                        <button
                          onClick={() => setVueSuivi('liste')}
                          className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition ${vueSuivi === 'liste' ? 'bg-roche-800 text-white' : 'text-roche-600'}`}
                        >
                          <List size={12} /> Liste
                        </button>
                        <button
                          onClick={() => setVueSuivi('tableau')}
                          className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition ${vueSuivi === 'tableau' ? 'bg-roche-800 text-white' : 'text-roche-600'}`}
                        >
                          <Table size={12} /> Tableau de suivi
                        </button>
                        <button
                          onClick={() => setVueSuivi('performance')}
                          className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition ${vueSuivi === 'performance' ? 'bg-roche-800 text-white' : 'text-roche-600'}`}
                        >
                          <Eye size={12} /> Performance (observée)
                        </button>
                      </div>
                      {vueSuivi === 'liste' && (
                        <button
                          onClick={() => setAjoutEleveOuvert((v) => !v)}
                          className="flex items-center gap-1.5 text-xs font-medium text-roche-700 hover:text-roche-900"
                        >
                          <UserPlus size={14} /> Ajouter un élève
                        </button>
                      )}
                    </div>
                  </div>

                  {vueSuivi === 'tableau' && (
                    <div>
                      <p className="text-xs text-roche-500 mb-2">
                        Vue d'ensemble de la classe, groupée par équipe (binôme/trinôme). Déclaratif : ce que chaque élève
                        a lui-même enregistré. Clique sur une case pour voir le détail des passages. Renseigne l'équipe de
                        chaque élève depuis la vue "Liste" (bouton "Modifier").
                      </p>
                      <GrilleSuiviVoies
                        voies={voies}
                        lignes={lignesTableauClasse}
                        onCellClick={ouvrirDetailCelluleClasse}
                        grouperParEquipe
                      />
                    </div>
                  )}

                  {vueSuivi === 'performance' && (
                    <TableauPerformanceProf
                      elevesDeLaClasse={elevesDeLaClasse}
                      classeActive={classeActive}
                      teacherId={teacherIdCourant}
                      voies={voies}
                      observationsParEleve={observationsParEleve}
                      setObservationsParEleve={setObservationsParEleve}
                    />
                  )}

                  {vueSuivi === 'liste' && (
                    <>
                      {ajoutEleveOuvert && (
                        <form onSubmit={ajouterEleve} className="flex flex-col sm:flex-row gap-2 mb-4 bg-roche-50 rounded-xl p-3">
                          <input
                            value={nouvelElevePrenom}
                            onChange={(e) => setNouvelElevePrenom(e.target.value)}
                            placeholder="Prénom"
                            autoFocus
                            className="flex-1 rounded-lg border border-roche-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                          />
                          <input
                            value={nouvelEleveNom}
                            onChange={(e) => setNouvelEleveNom(e.target.value)}
                            placeholder="Nom"
                            className="flex-1 rounded-lg border border-roche-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                          />
                          <select
                            value={nouvelEleveSexe}
                            onChange={(e) => setNouvelEleveSexe(e.target.value)}
                            className="rounded-lg border border-roche-200 px-2 py-1.5 text-sm bg-white"
                          >
                            <option value="">Sexe</option>
                            <option value="F">F</option>
                            <option value="M">M</option>
                          </select>
                          <input
                            value={nouvelEleveEquipe}
                            onChange={(e) => setNouvelEleveEquipe(e.target.value)}
                            placeholder="Équipe"
                            className="flex-1 rounded-lg border border-roche-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                          />
                          <button type="submit" className="bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition">
                            Ajouter
                          </button>
                        </form>
                      )}

                      {elevesDeLaClasse.length === 0 ? (
                        <p className="text-sm text-roche-500">Aucun élève dans cette classe pour l'instant.</p>
                      ) : (
                        <div className="divide-y divide-roche-100 border border-roche-100 rounded-xl overflow-hidden">
                          {elevesDeLaClasse.map((eleve) => {
                            const ouvert = eleveOuvert === eleve.id
                            const eleveComplet = eleveAvecTeacher(eleve)
                            const evalExistante = evaluations[cleEvaluation(eleveComplet)]
                            return (
                              <div key={eleve.id} className="bg-white">
                                <button
                                  onClick={() => setEleveOuvert(ouvert ? null : eleve.id)}
                                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-roche-50"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-roche-900">{eleve.prenom} {eleve.nom}</p>
                                    <p className="text-xs text-roche-500 mt-0.5">
                                      {evalExistante?.scoreEleve !== undefined && `Auto-éval ${evalExistante.scoreEleve}/20`}
                                      {evalExistante?.scoreEleve !== undefined && evalExistante?.scoreProf !== undefined && ' · '}
                                      {evalExistante?.scoreProf !== undefined && `Note prof ${evalExistante.scoreProf}/20`}
                                      {evalExistante?.noteCycle != null && ` · Suivi ${evalExistante.noteCycle}/20`}
                                      {evalExistante?.notePerformance != null && ` · Performance ${evalExistante.notePerformance}/20`}
                                      {evalExistante?.scoreEleve === undefined && evalExistante?.scoreProf === undefined && evalExistante?.noteCycle == null && evalExistante?.notePerformance == null && 'Pas encore évalué'}
                                      {' · '}{(passagesParEleve[cleEvaluation(eleveComplet)] || []).length} passage{(passagesParEleve[cleEvaluation(eleveComplet)] || []).length > 1 ? 's' : ''}
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
                                        <input
                                          value={editEquipe}
                                          onChange={(e) => setEditEquipe(e.target.value)}
                                          placeholder="Équipe"
                                          className="flex-1 rounded-lg border border-roche-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-roche-500"
                                        />
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
                                        <Pencil size={12} /> Modifier nom/prénom/équipe
                                      </button>
                                      <button
                                        onClick={() => reinitialiserPin(eleve.id)}
                                        className="flex items-center gap-1 text-[11px] font-medium text-roche-700 border border-roche-200 rounded-full px-2.5 py-1 hover:bg-white"
                                      >
                                        <KeyRound size={12} /> Réinitialiser le PIN
                                      </button>
                                      <button
                                        onClick={() => setPanneauOuvertPour(panneauOuvertPour?.id === eleve.id && panneauOuvertPour?.type === 'eval' ? null : { id: eleve.id, type: 'eval' })}
                                        className="flex items-center gap-1 text-[11px] font-medium text-roche-700 border border-roche-200 rounded-full px-2.5 py-1 hover:bg-white"
                                      >
                                        <ClipboardList size={12} /> {panneauOuvertPour?.id === eleve.id && panneauOuvertPour?.type === 'eval' ? 'Fermer' : 'Évaluer (référentiel)'}
                                      </button>
                                      <button
                                        onClick={() => setPanneauOuvertPour(panneauOuvertPour?.id === eleve.id && panneauOuvertPour?.type === 'cycle' ? null : { id: eleve.id, type: 'cycle' })}
                                        className="flex items-center gap-1 text-[11px] font-medium text-roche-700 border border-roche-200 rounded-full px-2.5 py-1 hover:bg-white"
                                      >
                                        <Mountain size={12} /> {panneauOuvertPour?.id === eleve.id && panneauOuvertPour?.type === 'cycle' ? 'Fermer' : 'Suivi de cycle'}
                                      </button>
                                      <button
                                        onClick={() => supprimerEleve(eleve.id)}
                                        className="flex items-center gap-1 text-[11px] font-medium text-alerte border border-[#f0d3ca] rounded-full px-2.5 py-1 hover:bg-white"
                                      >
                                        <UserX size={12} /> Retirer de la classe
                                      </button>
                                    </div>

                                    {panneauOuvertPour?.id === eleve.id && panneauOuvertPour?.type === 'eval' && (
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

                                    {panneauOuvertPour?.id === eleve.id && panneauOuvertPour?.type === 'cycle' && (
                                      <div className="bg-white rounded-xl p-3">
                                        <SuiviEleveProf
                                          eleve={eleveComplet}
                                          passages={passagesParEleve[cleEvaluation(eleveComplet)] || []}
                                          observations={observationsParEleve[cleEvaluation(eleveComplet)] || []}
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
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}

      {importOuvert && (
        <ImportEleves
          roster={roster}
          onImporte={(next) => {
            persisterRoster(next)
            setImportOuvert(false)
          }}
          onFermer={() => setImportOuvert(false)}
        />
      )}

      <DetailCellule detail={detailCellule} onFermer={() => setDetailCellule(null)} onSupprimer={supprimerPassageDepuisDetail} />
    </div>
  )
}
