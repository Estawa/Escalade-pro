import { useState } from 'react'
import { MODULES } from '../data.js'
import { styles } from '../styles.js'

export function itemKey(moduleId, itemId) {
  return `${moduleId}-${itemId}`
}

export default function Referentiel({ videos, modeProf = false, onSaveVideo, onRemovePhase }) {
  const [editingVideo, setEditingVideo] = useState(null)

  return (
    <div>
      {modeProf && (
        <div style={styles.warnBanner}>
          Contenu de base à vérifier et compléter avant utilisation avec les élèves (voir en particulier "Nœud du pendu").
        </div>
      )}
      {MODULES.map((m) => (
        <div key={m.id} style={styles.moduleBlock}>
          <h2 style={styles.moduleTitle}>{m.label}</h2>
          <div style={styles.grid}>
            {m.items.map((it) => {
              const key = itemKey(m.id, it.id)
              const v = videos[key] || { demo: '', phases: [] }
              return (
                <div key={key} style={styles.card}>
                  <div style={styles.cardTitre}>{it.titre}</div>
                  <p style={styles.cardTexte}>{it.texte}</p>

                  {v.demo && (
                    <a href={v.demo} target="_blank" rel="noreferrer" style={styles.videoLink}>▶ Voir la vidéo de démonstration</a>
                  )}
                  {v.phases && v.phases.length > 0 && (
                    <div style={styles.phasesList}>
                      {v.phases.map((p, i) => (
                        <a key={i} href={p} target="_blank" rel="noreferrer" style={styles.videoLinkSmall}>▶ Phase d'apprentissage {i + 1}</a>
                      ))}
                    </div>
                  )}

                  {modeProf && (
                    <button style={styles.editBtn} onClick={() => setEditingVideo(editingVideo === key ? null : key)}>
                      {v.demo || (v.phases && v.phases.length) ? 'Gérer les vidéos' : '+ Ajouter une vidéo'}
                    </button>
                  )}

                  {modeProf && editingVideo === key && (
                    <div style={styles.editPanel}>
                      <label style={styles.editLabel}>Vidéo de démonstration (URL)</label>
                      <input style={styles.editInput} defaultValue={v.demo} placeholder="https://..." onBlur={(e) => onSaveVideo(key, 'demo', e.target.value)} />
                      <label style={styles.editLabel}>Vidéos d'apprentissage par phases</label>
                      {(v.phases || []).map((p, i) => (
                        <div key={i} style={styles.phaseRow}>
                          <input style={styles.editInput} defaultValue={p} placeholder="https://..." onBlur={(e) => onSaveVideo(key, 'phases', e.target.value, i)} />
                          <button style={styles.removeBtn} onClick={() => onRemovePhase(key, i)}>✕</button>
                        </div>
                      ))}
                      <button style={styles.addPhaseBtn} onClick={() => onSaveVideo(key, 'phases', '')}>+ Ajouter une phase</button>
                      <button style={styles.doneBtn} onClick={() => setEditingVideo(null)}>Terminé</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
