import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import EleveLogin from './components/EleveLogin.jsx'
import EspaceEleve from './components/EspaceEleve.jsx'
import EnseignantPin from './components/EnseignantPin.jsx'
import EnseignantDashboard from './components/EnseignantDashboard.jsx'
import { loadAllVideos, saveVideoForItem } from './firebase.js'
import { storage } from './utils/storage.js'

export default function App() {
  const [eleve, setEleve] = useState(() => storage.getEleveActif())
  const [ecran, setEcran] = useState(() => (storage.getEleveActif() ? 'espace' : 'accueil'))

  const [videos, setVideos] = useState({})
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    loadAllVideos()
      .then(setVideos)
      .catch((e) => setErreur('Connexion à la sauvegarde impossible : ' + e.message))
      .finally(() => setChargement(false))
  }, [])

  function saveVideo(key, field, value, idx) {
    const cur = videos[key] || { demo: '', phases: [] }
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
    const cur = videos[key] || { demo: '', phases: [] }
    const next = { ...cur, phases: cur.phases.filter((_, i) => i !== idx) }
    setVideos((v) => ({ ...v, [key]: next }))
    saveVideoForItem(key, next).catch((e) => setErreur('Échec de la sauvegarde : ' + e.message))
  }

  function handleConnecte(e) {
    setEleve(e)
    setEcran('espace')
  }

  function handleDeconnexion() {
    storage.clearEleveActif()
    setEleve(null)
    setEcran('accueil')
  }

  function handleAccesEnseignant() {
    setEcran(storage.getPinOk() ? 'enseignant' : 'enseignantPin')
  }

  function handlePinValide() {
    storage.setPinOk(true)
    setEcran('enseignant')
  }

  function handleRetour() {
    setEcran(eleve ? 'espace' : 'accueil')
  }

  const titres = {
    accueil: 'Identification',
    espace: 'Escalade Pro',
    enseignantPin: 'Espace enseignant',
    enseignant: 'Espace enseignant'
  }

  const peutRevenir = ['enseignantPin', 'enseignant'].includes(ecran)

  return (
    <div className="min-h-screen bg-white font-body">
      <Header
        title={titres[ecran]}
        onBack={peutRevenir ? handleRetour : null}
        onEnseignant={handleAccesEnseignant}
        showEnseignant={ecran !== 'enseignant' && ecran !== 'enseignantPin'}
      />

      {erreur && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <p className="text-sm text-alerte bg-[#fbeeea] rounded-lg px-3 py-2">{erreur}</p>
        </div>
      )}
      {chargement && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <p className="text-sm text-roche-500">Chargement des données...</p>
        </div>
      )}

      {ecran === 'accueil' && <EleveLogin onConnecte={handleConnecte} />}

      {ecran === 'espace' && eleve && (
        <EspaceEleve eleve={eleve} videos={videos} onDeconnexion={handleDeconnexion} />
      )}

      {ecran === 'enseignantPin' && <EnseignantPin onValide={handlePinValide} />}

      {ecran === 'enseignant' && (
        <EnseignantDashboard videos={videos} onSaveVideo={saveVideo} onRemovePhase={removePhase} />
      )}
    </div>
  )
}
