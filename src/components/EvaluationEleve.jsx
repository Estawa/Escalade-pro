import { useEffect, useMemo, useState } from 'react'
import { MODULES } from '../data.js'
import { styles } from '../styles.js'
import { itemKey } from './Referentiel.jsx'
import { saveEvaluation } from '../firebase.js'

export default function EvaluationEleve({ eleve, evaluationExistante }) {
  const [autoEval, setAutoEval] = useState(evaluationExistante?.autoEval || {})
  const [sauvegarde, setSauvegarde] = useState('')

  useEffect(() => {
    setAutoEval(evaluationExistante?.autoEval || {})
  }, [evaluationExistante])

  const totalItems = useMemo(() => MODULES.reduce((s, m) => s + m.items.length, 0), [])
  const scoreEleve = useMemo(() => {
    const acquis = Object.values(autoEval).filter(Boolean).length
    return { acquis, total: totalItems, pct: Math.round((acquis / totalItems) * 100) }
  }, [autoEval, totalItems])

  function toggle(key) {
    setAutoEval((s) => ({ ...s, [key]: !s[key] }))
  }

  async function enregistrer() {
    try {
      await saveEvaluation(eleve, { autoEval, scoreEleve: scoreEleve.pct, dateEleve: new Date().toISOString() })
      setSauvegarde('Auto-évaluation enregistrée.')
    } catch (e) {
      setSauvegarde("Échec de l'enregistrement : " + e.message)
    }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#6B7A5E', marginBottom: 16 }}>
        {eleve.prenom} {eleve.nom} — {eleve.classe}
      </p>
      {MODULES.map((m) => (
        <div key={m.id} style={styles.moduleBlock}>
          <h2 style={styles.moduleTitle}>{m.label}</h2>
          {m.items.map((it) => {
            const key = itemKey(m.id, it.id)
            return (
              <label key={key} style={styles.evalRow}>
                <span style={styles.evalLabel}>{it.titre}</span>
                <input
                  type="checkbox"
                  style={styles.evalCheck}
                  checked={!!autoEval[key]}
                  onChange={() => toggle(key)}
                />
              </label>
            )
          })}
        </div>
      ))}

      <div style={styles.scoreBox}>
        <div style={styles.scoreTotal}>
          <span>Compétences maîtrisées</span>
          <span>{scoreEleve.acquis} / {scoreEleve.total} ({scoreEleve.pct}%)</span>
        </div>
        <button style={styles.saveBtn} onClick={enregistrer}>Enregistrer mon auto-évaluation</button>
        {sauvegarde && <p style={{ fontSize: 12, marginTop: 8, color: '#6B7A5E' }}>{sauvegarde}</p>}
      </div>
    </div>
  )
}
