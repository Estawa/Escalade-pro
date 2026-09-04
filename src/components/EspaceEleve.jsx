import { useEffect, useState } from 'react'
import { styles } from '../styles.js'
import Referentiel from './Referentiel.jsx'
import EvaluationEleve from './EvaluationEleve.jsx'
import { loadAllEvaluations, cleEvaluation } from '../firebase.js'

export default function EspaceEleve({ eleve, videos, onDeconnexion }) {
  const [onglet, setOnglet] = useState('referentiel')
  const [evaluationExistante, setEvaluationExistante] = useState(null)

  useEffect(() => {
    loadAllEvaluations()
      .then((all) => setEvaluationExistante(all[cleEvaluation(eleve)] || null))
      .catch(() => {})
  }, [eleve])

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#6B7A5E' }}>
          Connecté(e) : <strong>{eleve.prenom} {eleve.nom}</strong> · {eleve.classe}
        </p>
        <button style={styles.editBtn} onClick={onDeconnexion}>Changer d'élève</button>
      </div>

      <div style={styles.ongletSwitch}>
        <button style={onglet === 'referentiel' ? styles.ongletBtnActive : styles.ongletBtn} onClick={() => setOnglet('referentiel')}>Référentiel</button>
        <button style={onglet === 'evaluation' ? styles.ongletBtnActive : styles.ongletBtn} onClick={() => setOnglet('evaluation')}>Ma auto-évaluation</button>
      </div>

      {onglet === 'referentiel' && <Referentiel videos={videos} modeProf={false} />}
      {onglet === 'evaluation' && <EvaluationEleve eleve={eleve} evaluationExistante={evaluationExistante} />}
    </div>
  )
}
