import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Demarrage from './components/Demarrage.jsx'
import EleveLogin from './components/EleveLogin.jsx'
import EspaceEleve from './components/EspaceEleve.jsx'
import EnseignantPin from './components/EnseignantPin.jsx'
import EnseignantDashboard from './components/EnseignantDashboard.jsx'
import {
  loadAllVideos, saveVideoForItem,
  loadReferentielConfig, saveReferentielConfig, configReferentielParDefaut,
  loadAccesConfig, saveAccesConfig, accesParDefaut,
  loadRosterTeacher
} from './firebase.js'
import { rosterOps } from './utils/rosterOps.js'
import { fichierVersImageCompressee } from './utils/images.js'
import { storage } from './utils/storage.js'

export default function App() {
  // La fiche complète de l'élève connecté (avec teacherId) n'est connue qu'après avoir
  // rechargé le roster de son enseignant depuis Firebase : au démarrage, on ne connaît que le
  // pointeur { teacherId, id } stocké sur l'appareil, tant que ce chargement n'est pas terminé.
  const pointeurEleve = storage.getEleveActifPointeur()
  const [eleve, setEleve] = useState(null)
  const [chargementEleve, setChargementEleve] = useState(!!pointeurEleve)
  const [ecran, setEcran] = useState(pointeurEleve ? 'espace' : 'demarrage')
  const [role, setRole] = useState(() => storage.getRoleEnseignant())
  const [nomCollegue, setNomCollegue] = useState(() => storage.getCollegueNom())
  const [teacherIdEnseignant, setTeacherIdEnseignant] = useState(() => storage.getTeacherIdEnseignant())

  const [videos, setVideos] = useState({})
  const [referentielConfig, setReferentielConfig] = useState(configReferentielParDefaut())
  const [accesConfig, setAccesConfig] = useState(() => accesParDefaut(storage.getPinEnseignant()))
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    Promise.all([loadAllVideos(), loadReferentielConfig(), loadAccesConfig(storage.getPinEnseignant())])
      .then(([v, rc, ac]) => {
        setVideos(v)
        setReferentielConfig(rc)
        setAccesConfig(ac)
      })
      .catch((e) => setErreur('Connexion à la sauvegarde impossible : ' + e.message))
      .finally(() => setChargement(false))
  }, [])

  // Restaure la session élève de cet appareil : recharge le roster de son enseignant pour
  // retrouver sa fiche à jour (nom/prénom/PIN). Si son enseignant a été retiré ou sa fiche
  // supprimée entre-temps, la session est effacée et l'écran d'accueil s'affiche.
  useEffect(() => {
    if (!pointeurEleve) return
    loadRosterTeacher(pointeurEleve.teacherId)
      .then((roster) => {
        const trouve = rosterOps.trouverEleveParId(roster, pointeurEleve.id)
        if (trouve) {
          setEleve({ id: trouve.id, nom: trouve.nom, prenom: trouve.prenom, classe: trouve.classe, teacherId: pointeurEleve.teacherId })
          setEcran('espace')
        } else {
          storage.clearEleveActif()
          setEcran('accueil')
        }
      })
      .catch(() => {
        storage.clearEleveActif()
        setEcran('accueil')
      })
      .finally(() => setChargementEleve(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function saveVideo(key, field, value, idx) {
    const cur = videos[key] || { demo: '', phases: [], photos: [] }
    let next
    if (field === 'demo') next = { ...cur, demo: value }
    else {
      const phases = [...cur.phases]
      if (idx === undefined) phases.push(value)
      else phases[idx] = value
      next = { ...cur, phases }
    }
    setVideos((v) => ({ ...v, [key]: next }))
    saveVideoForItem(key, next).catch((e) => setErreur('Échec de la sauvegarde : ' + e.message))
  }

  function removePhase(key, idx) {
    const cur = videos[key] || { demo: '', phases: [], photos: [] }
    const next = { ...cur, phases: cur.phases.filter((_, i) => i !== idx) }
    setVideos((v) => ({ ...v, [key]: next }))
    saveVideoForItem(key, next).catch((e) => setErreur('Échec de la sauvegarde : ' + e.message))
  }

  async function addPhoto(key, fichier) {
    const cur = videos[key] || { demo: '', phases: [], photos: [] }
    try {
      const dataUrl = await fichierVersImageCompressee(fichier)
      const next = { ...cur, photos: [...(cur.photos || []), dataUrl] }
      setVideos((v) => ({ ...v, [key]: next }))
      await saveVideoForItem(key, next)
    } catch (e) {
      setErreur("Échec de l'ajout de l'image : " + e.message)
    }
  }

  function removePhoto(key, idx) {
    const cur = videos[key] || { demo: '', phases: [], photos: [] }
    const next = { ...cur, photos: (cur.photos || []).filter((_, i) => i !== idx) }
    setVideos((v) => ({ ...v, [key]: next }))
    saveVideoForItem(key, next).catch((e) => setErreur('Échec de la sauvegarde : ' + e.message))
  }

  // --- Édition du contenu du Référentiel (titres/textes, ajout/suppression d'encarts) ---
  function persisterReferentiel(next) {
    setReferentielConfig(next)
    saveReferentielConfig(next).catch((e) => setErreur('Échec de la sauvegarde : ' + e.message))
  }

  function editItem(moduleId, itemId, patch, estPersonnalise) {
    if (estPersonnalise) {
      const liste = (referentielConfig.extra[moduleId] || []).map((it) => (it.id === itemId ? { ...it, ...patch } : it))
      persisterReferentiel({ ...referentielConfig, extra: { ...referentielConfig.extra, [moduleId]: liste } })
    } else {
      const key = `${moduleId}-${itemId}`
      persisterReferentiel({ ...referentielConfig, overrides: { ...referentielConfig.overrides, [key]: { ...referentielConfig.overrides[key], ...patch } } })
    }
  }

  function addItem(moduleId, { titre, texte }) {
    const id = `perso_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const liste = [...(referentielConfig.extra[moduleId] || []), { id, titre, texte }]
    persisterReferentiel({ ...referentielConfig, extra: { ...referentielConfig.extra, [moduleId]: liste } })
  }

  function removeItem(moduleId, itemId, estPersonnalise) {
    if (estPersonnalise) {
      const liste = (referentielConfig.extra[moduleId] || []).filter((it) => it.id !== itemId)
      persisterReferentiel({ ...referentielConfig, extra: { ...referentielConfig.extra, [moduleId]: liste } })
    } else {
      const key = `${moduleId}-${itemId}`
      persisterReferentiel({ ...referentielConfig, supprimes: [...referentielConfig.supprimes, key] })
    }
  }

  // --- Accès enseignant : code admin + nom admin + collègues (Firebase, partagé entre appareils) ---
  function persisterAcces(next) {
    setAccesConfig(next)
    saveAccesConfig(next).catch((e) => setErreur('Échec de la sauvegarde : ' + e.message))
  }

  function changerPinAdmin(nouveauPin) {
    persisterAcces({ ...accesConfig, pinAdmin: nouveauPin })
  }

  function changerNomAdmin(nom) {
    persisterAcces({ ...accesConfig, nomAdmin: nom })
  }

  function ajouterCollegue(nom, pin) {
    const id = crypto.randomUUID ? crypto.randomUUID() : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`
    persisterAcces({ ...accesConfig, collegues: [...(accesConfig.collegues || []), { id, nom, pin }] })
  }

  function supprimerCollegue(id) {
    persisterAcces({ ...accesConfig, collegues: (accesConfig.collegues || []).filter((c) => c.id !== id) })
  }

  // Réinitialise le PIN d'un collègue existant sans changer son id (= son teacherId), donc
  // sans perte de ses élèves ni de son suivi déjà enregistrés.
  function reinitialiserPinCollegue(id, nouveauPin) {
    persisterAcces({ ...accesConfig, collegues: (accesConfig.collegues || []).map((c) => (c.id === id ? { ...c, pin: nouveauPin } : c)) })
  }

  function handleConnecte(e) {
    storage.setEleveActifPointeur(e.teacherId, e.id)
    setEleve(e)
    setEcran('espace')
  }

  function handleDeconnexion() {
    storage.clearEleveActif()
    setEleve(null)
    setEcran('accueil')
  }

  function handleAccesEnseignant() {
    // storage.getRoleEnseignant() est requis en plus de getPinOk() pour forcer une nouvelle
    // saisie du code après cette mise à jour (anciennes sessions sans rôle enregistré).
    const dejaConnecte = storage.getPinOk() && storage.getRoleEnseignant() && storage.getTeacherIdEnseignant()
    setEcran(dejaConnecte ? 'enseignant' : 'enseignantPin')
  }

  function handlePinValide({ role: roleValide, nomCollegue: nom, teacherId }) {
    storage.setPinOk(true)
    storage.setRoleEnseignant(roleValide)
    storage.setCollegueNom(roleValide === 'collegue' ? nom : null)
    storage.setTeacherIdEnseignant(teacherId)
    setRole(roleValide)
    setNomCollegue(roleValide === 'collegue' ? nom : null)
    setTeacherIdEnseignant(teacherId)
    setEcran('enseignant')
  }

  function handleDeconnexionEnseignant() {
    storage.clearSessionEnseignant()
    setRole(null)
    setNomCollegue(null)
    setTeacherIdEnseignant(null)
    setEcran(eleve ? 'espace' : 'accueil')
  }

  function handleRetour() {
    setEcran(eleve ? 'espace' : 'demarrage')
  }

  function handleRetourEleve() {
    setEcran('accueil')
  }

  const titres = {
    demarrage: '',
    accueil: 'Identification',
    espace: 'Escalade Pro',
    enseignantPin: 'Espace enseignant',
    enseignant: 'Espace enseignant'
  }

  const peutRevenir = ['accueil', 'enseignantPin', 'enseignant'].includes(ecran)
  const afficherHeader = ecran !== 'demarrage'

  return (
    <div className="min-h-screen bg-white font-body">
      {afficherHeader && (
        <Header
          title={titres[ecran]}
          onBack={peutRevenir ? handleRetour : null}
          onEnseignant={handleAccesEnseignant}
          showEnseignant={ecran !== 'enseignant' && ecran !== 'enseignantPin'}
        />
      )}

      {erreur && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <p className="text-sm text-alerte bg-[#fbeeea] rounded-lg px-3 py-2">{erreur}</p>
        </div>
      )}
      {(chargement || chargementEleve) && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <p className="text-sm text-roche-500">Chargement des données...</p>
        </div>
      )}

      {ecran === 'demarrage' && !chargementEleve && (
        <Demarrage onCommencer={() => setEcran('accueil')} onAccesEnseignant={handleAccesEnseignant} />
      )}

      {ecran === 'accueil' && !chargementEleve && <EleveLogin accesConfig={accesConfig} onConnecte={handleConnecte} />}

      {ecran === 'espace' && eleve && (
        <EspaceEleve eleve={eleve} videos={videos} referentielConfig={referentielConfig} onDeconnexion={handleDeconnexion} />
      )}

      {ecran === 'enseignantPin' && (
        <EnseignantPin accesConfig={accesConfig} onValide={handlePinValide} onRetourEleve={handleRetourEleve} />
      )}

      {ecran === 'enseignant' && (
        <EnseignantDashboard
          role={role}
          nomCollegue={nomCollegue}
          teacherIdEnseignant={teacherIdEnseignant}
          onDeconnexionEnseignant={handleDeconnexionEnseignant}
          videos={videos}
          onSaveVideo={saveVideo}
          onRemovePhase={removePhase}
          onAddPhoto={addPhoto}
          onRemovePhoto={removePhoto}
          referentielConfig={referentielConfig}
          onEditItem={editItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          accesConfig={accesConfig}
          onChangerPinAdmin={changerPinAdmin}
          onChangerNomAdmin={changerNomAdmin}
          onAjouterCollegue={ajouterCollegue}
          onSupprimerCollegue={supprimerCollegue}
          onReinitialiserPinCollegue={reinitialiserPinCollegue}
        />
      )}
    </div>
  )
}
