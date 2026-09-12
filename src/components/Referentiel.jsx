import { useState } from 'react'
import { MODULES } from '../data.js'
import { styles } from '../styles.js'

export function itemKey(moduleId, itemId) {
  return `${moduleId}-${itemId}`
}

// Fusionne le contenu de base (data.js) avec la configuration éditable enregistrée par le
// professeur : textes modifiés (overrides), encarts ajoutés (extra) et encarts masqués
// (supprimes, uniquement pour les encarts de base — les encarts ajoutés sont retirés pour de
// bon quand on les supprime).
function itemsEffectifs(module, config) {
  const base = module.items
    .map((it) => {
      const key = itemKey(module.id, it.id)
      if (config.supprimes.includes(key)) return null
      const ov = config.overrides[key]
      return { id: it.id, titre: ov?.titre ?? it.titre, texte: ov?.texte ?? it.texte, custom: false }
    })
    .filter(Boolean)
  const extra = (config.extra[module.id] || []).map((it) => ({ ...it, custom: true }))
  return [...base, ...extra]
}

export default function Referentiel({
  videos,
  referentielConfig,
  modeProf = false,
  onSaveVideo,
  onRemovePhase,
  onAddPhoto,
  onRemovePhoto,
  onEditItem,
  onAddItem,
  onRemoveItem
}) {
  const [editingVideo, setEditingVideo] = useState(null)
  const [editingTexte, setEditingTexte] = useState(null) // itemKey de l'encart dont le titre/texte est en édition
  const [brouillon, setBrouillon] = useState({ titre: '', texte: '' })
  const [ajoutOuvert, setAjoutOuvert] = useState(null) // id du module où le formulaire d'ajout est ouvert
  const [nouvel, setNouvel] = useState({ titre: '', texte: '' })

  const config = referentielConfig || { overrides: {}, extra: {}, supprimes: [] }

  function ouvrirEditionTexte(key, it) {
    setBrouillon({ titre: it.titre, texte: it.texte })
    setEditingTexte(key)
  }

  function validerEditionTexte(moduleId, it) {
    onEditItem(moduleId, it.id, { titre: brouillon.titre.trim() || it.titre, texte: brouillon.texte.trim() }, it.custom)
    setEditingTexte(null)
  }

  function validerAjout(moduleId) {
    if (!nouvel.titre.trim()) return
    onAddItem(moduleId, { titre: nouvel.titre.trim(), texte: nouvel.texte.trim() })
    setNouvel({ titre: '', texte: '' })
    setAjoutOuvert(null)
  }

  function supprimerEncart(moduleId, it) {
    if (!confirm(`Supprimer l'encart "${it.titre}" ?`)) return
    onRemoveItem(moduleId, it.id, it.custom)
  }

  function choisirPhoto(e, key) {
    const fichier = e.target.files?.[0]
    if (fichier) onAddPhoto(key, fichier)
    e.target.value = ''
  }

  return (
    <div>
      {modeProf && (
        <div style={styles.warnBanner}>
          Contenu de base à vérifier et compléter avant utilisation avec les élèves (voir en particulier "Nœud du pendu").
        </div>
      )}
      {MODULES.map((m) => {
        const items = itemsEffectifs(m, config)
        return (
          <div key={m.id} style={styles.moduleBlock}>
            <h2 style={styles.moduleTitle}>{m.label}</h2>
            <div style={styles.grid}>
              {items.map((it) => {
                const key = itemKey(m.id, it.id)
                const v = videos[key] || { demo: '', phases: [], photos: [] }
                const enEditionTexte = editingTexte === key
                return (
                  <div key={key} style={styles.card}>
                    <div style={styles.cardHeaderRow}>
                      {enEditionTexte ? (
                        <div style={{ ...styles.editPanel, flex: 1 }}>
                          <label style={styles.editLabel}>Titre</label>
                          <input
                            style={styles.editInput}
                            value={brouillon.titre}
                            onChange={(e) => setBrouillon((b) => ({ ...b, titre: e.target.value }))}
                          />
                          <label style={styles.editLabel}>Texte</label>
                          <textarea
                            style={styles.editTexteTextarea}
                            value={brouillon.texte}
                            onChange={(e) => setBrouillon((b) => ({ ...b, texte: e.target.value }))}
                          />
                          <button style={styles.doneBtn} onClick={() => validerEditionTexte(m.id, it)}>Enregistrer</button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div style={styles.cardTitre}>{it.titre}</div>
                            <p style={styles.cardTexte}>{it.texte}</p>
                          </div>
                          {modeProf && (
                            <button style={styles.cardDeleteBtn} title="Supprimer cet encart" onClick={() => supprimerEncart(m.id, it)}>✕</button>
                          )}
                        </>
                      )}
                    </div>

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
                    {v.photos && v.photos.length > 0 && (
                      <div style={styles.photosGrid}>
                        {v.photos.map((src, i) => (
                          <div key={i} style={styles.photoThumbWrap}>
                            <a href={src} target="_blank" rel="noreferrer">
                              <img src={src} alt="" style={styles.photoThumb} />
                            </a>
                            {modeProf && (
                              <button style={styles.photoRemoveBtn} title="Retirer cette image" onClick={() => onRemovePhoto(key, i)}>✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {modeProf && !enEditionTexte && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button style={styles.editBtn} onClick={() => setEditingVideo(editingVideo === key ? null : key)}>
                          {v.demo || (v.phases && v.phases.length) ? 'Gérer les vidéos' : '+ Ajouter une vidéo'}
                        </button>
                        <button style={styles.editBtn} onClick={() => ouvrirEditionTexte(key, it)}>
                          Modifier le texte
                        </button>
                        <label style={styles.addPhotoLabel}>
                          + Ajouter une image
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => choisirPhoto(e, key)} />
                        </label>
                      </div>
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

              {modeProf && (
                <div style={styles.addItemCard}>
                  {ajoutOuvert === m.id ? (
                    <>
                      <label style={styles.editLabel}>Titre</label>
                      <input
                        style={styles.editInput}
                        autoFocus
                        value={nouvel.titre}
                        onChange={(e) => setNouvel((n) => ({ ...n, titre: e.target.value }))}
                        placeholder="Titre de l'encart"
                      />
                      <label style={styles.editLabel}>Texte</label>
                      <textarea
                        style={styles.editTexteTextarea}
                        value={nouvel.texte}
                        onChange={(e) => setNouvel((n) => ({ ...n, texte: e.target.value }))}
                        placeholder="Texte de l'encart"
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={styles.doneBtn} onClick={() => validerAjout(m.id)}>Ajouter</button>
                        <button style={styles.editBtn} onClick={() => { setAjoutOuvert(null); setNouvel({ titre: '', texte: '' }) }}>Annuler</button>
                      </div>
                    </>
                  ) : (
                    <button style={styles.addItemBtn} onClick={() => setAjoutOuvert(m.id)}>+ Ajouter un encart</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
