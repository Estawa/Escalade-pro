import { useEffect, useState } from 'react'
import { styles } from '../styles.js'
import Referentiel from './Referentiel.jsx'
import EvaluationEleve from './EvaluationEleve.jsx'
import SuiviCycle from './SuiviCycle.jsx'
import { loadAllEvaluations, cleEvaluation } from '../firebase.js'

export default function EspaceEleve({ eleve, videos, onDeconnexion }) {
  const [ongletPrincipal, setOngletPrincipal] = useState('connaissance') // connaissance | suivi
  const [sousOnglet, setSousOnglet] = useState('referentiel') // referentiel | evaluation
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
        <button style={ongletPrincipal === 'connaissance' ? styles.ongletBtnActive : styles.ongletBtn} onClick={() => setOngletPrincipal('connaissance')}>Connaissance</button>
        <button style={ongletPrincipal === 'suivi' ? styles.ongletBtnActive : styles.ongletBtn} onClick={() => setOngletPrincipal('suivi')}>Suivi de Cycle</button>
      </div>

      {ongletPrincipal === 'connaissance' && (
        <div>
          <div style={styles.ongletSwitch}>
            <button style={sousOnglet === 'referentiel' ? styles.ongletBtnActive : styles.ongletBtn} onClick={() => setSousOnglet('referentiel')}>Référentiel</button>
            <button style={sousOnglet === 'evaluation' ? styles.ongletBtnActive : styles.ongletBtn} onClick={() => setSousOnglet('evaluation')}>Ma auto-évaluation</button>
          </div>
          {sousOnglet === 'referentiel' && <Referentiel videos={videos} modeProf={false} />}
          {sousOnglet === 'evaluation' && <EvaluationEleve eleve={eleve} evaluationExistante={evaluationExistante} />}
        </div>
      )}

      {ongletPrincipal === 'suivi' && <SuiviCycle eleve={eleve} />}
    </div>
  )
}
