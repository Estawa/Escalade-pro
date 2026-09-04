import { useEffect, useMemo, useState } from 'react'
import { MODULES } from '../data.js'
import { styles } from '../styles.js'
import { itemKey } from './Referentiel.jsx'
import { saveEvaluation } from '../firebase.js'

export const NIVEAUX = [
  { code: 'non', label: 'Non acquis', points: 0 },
  { code: 'cours', label: 'En cours', points: 1 },
  { code: 'acquis', label: 'Acquis', points: 2 }
]

export default function EvaluationProf({ eleve, evaluationExistante, onEnregistre }) {
  const [niveaux, setNiveaux] = useState(evaluationExistante?.niveauxProf || {})
  const [sauvegarde, setSauvegarde] = useState('')

  useEffect(() => {
    setNiveaux(evaluationExistante?.niveauxProf || {})
  }, [evaluationExistante])

  const totalItems = useMemo(() => MODULES.reduce((s, m) => s + m.items.length, 0), [])
  const scoreProf = useMemo(() => {
    let points = 0
    MODULES.forEach((m) =>
      m.items.forEach((it) => {
        const code = niveaux[itemKey(m.id, it.id)]
        const n = NIVEAUX.find((x) => x.code === code)
        if (n) points += n.points
      })
    )
    return Math.round((points / (totalItems * 2)) * 2000) / 100
  }, [niveaux, totalItems])

  async function enregistrer() {
    try {
      await saveEvaluation(eleve, { niveauxProf: niveaux, scoreProf, dateProf: new Date().toISOString() })
      setSauvegarde('Évaluation enregistrée.')
      onEnregistre && onEnregistre({ niveauxProf: niveaux, scoreProf })
    } catch (e) {
      setSauvegarde("Échec de l'enregistrement : " + e.message)
    }
  }

  return (
    <div>
      {MODULES.map((m) => (
        <div key={m.id} style={styles.moduleBlock}>
          <h2 style={styles.moduleTitle}>{m.label}</h2>
          {m.items.map((it) => {
            const key = itemKey(m.id, it.id)
            return (
              <div key={key} style={styles.evalRow}>
                <span style={styles.evalLabel}>{it.titre}</span>
                <div style={styles.evalChoices}>
                  {NIVEAUX.map((n) => (
                    <button
                      key={n.code}
                      style={niveaux[key] === n.code ? styles.evalChoiceBtnActive : styles.evalChoiceBtn}
                      onClick={() => setNiveaux((s) => ({ ...s, [key]: n.code }))}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <div style={styles.scoreBox}>
        <div style={styles.scoreTotal}>
          <span>Note globale</span>
          <span>{scoreProf.toFixed(2)} / 20</span>
        </div>
        <button style={styles.saveBtn} onClick={enregistrer}>Enregistrer l'évaluation</button>
        {sauvegarde && <p style={{ fontSize: 12, marginTop: 8, color: '#6B7A5E' }}>{sauvegarde}</p>}
      </div>
    </div>
  )
}
