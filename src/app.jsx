import React, { useState, useMemo, useEffect } from "react";
import { loadAllVideos, saveVideoForItem, saveEvaluation } from "./firebase.js";
import { MODULES } from "./data.js";
import { styles } from "./styles.js";

const APP_VERSION = "1.0.0";

function itemKey(moduleId, itemId) {
  return `${moduleId}-${itemId}`;
}

const NIVEAUX = [
  { code: "non", label: "Non acquis", points: 0 },
  { code: "cours", label: "En cours", points: 1 },
  { code: "acquis", label: "Acquis", points: 2 },
];

export default function App() {
  const [mode, setMode] = useState("eleve");
  const [onglet, setOnglet] = useState("referentiel");
  const [videos, setVideos] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);

  // évaluation
  const [nom, setNom] = useState("");
  const [niveaux, setNiveaux] = useState({}); // prof : itemKey -> code
  const [autoEval, setAutoEval] = useState({}); // élève : itemKey -> bool
  const [sauvegarde, setSauvegarde] = useState("");

  useEffect(() => {
    loadAllVideos()
      .then((v) => setVideos(v))
      .catch((e) => setErreur("Connexion à la sauvegarde impossible : " + e.message))
      .finally(() => setChargement(false));
  }, []);

  function saveVideo(key, field, value, idx) {
    const cur = videos[key] || { demo: "", phases: [] };
    let next;
    if (field === "demo") next = { ...cur, demo: value };
    else {
      const phases = [...cur.phases];
      if (idx === undefined) phases.push(value);
      else phases[idx] = value;
      next = { ...cur, phases };
    }
    setVideos((v) => ({ ...v, [key]: next }));
    saveVideoForItem(key, next).catch((e) => setErreur("Échec de la sauvegarde : " + e.message));
  }
  function removePhase(key, idx) {
    const cur = videos[key] || { demo: "", phases: [] };
    const next = { ...cur, phases: cur.phases.filter((_, i) => i !== idx) };
    setVideos((v) => ({ ...v, [key]: next }));
    saveVideoForItem(key, next).catch((e) => setErreur("Échec de la sauvegarde : " + e.message));
  }

  const totalItems = useMemo(() => MODULES.reduce((s, m) => s + m.items.length, 0), []);

  const scoreProf = useMemo(() => {
    let points = 0;
    MODULES.forEach((m) =>
      m.items.forEach((it) => {
        const code = niveaux[itemKey(m.id, it.id)];
        const n = NIVEAUX.find((x) => x.code === code);
        if (n) points += n.points;
      })
    );
    return Math.round((points / (totalItems * 2)) * 2000) / 100;
  }, [niveaux, totalItems]);

  const scoreEleve = useMemo(() => {
    const acquis = Object.values(autoEval).filter(Boolean).length;
    return { acquis, total: totalItems, pct: Math.round((acquis / totalItems) * 100) };
  }, [autoEval, totalItems]);

  async function enregistrerEvaluation() {
    if (!nom.trim()) {
      setSauvegarde("Indique le nom de l'élève avant d'enregistrer.");
      return;
    }
    try {
      if (mode === "prof") {
        await saveEvaluation(nom.trim(), { type: "prof", niveaux, score: scoreProf, date: new Date().toISOString() });
      } else {
        await saveEvaluation(nom.trim() + "_auto", { type: "eleve", autoEval, score: scoreEleve.pct, date: new Date().toISOString() });
      }
      setSauvegarde("Évaluation enregistrée pour " + nom.trim() + ".");
    } catch (e) {
      setSauvegarde("Échec de l'enregistrement : " + e.message);
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Sécurité · Nœuds · Assurage</div>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>Escalade Pro</h1>
            <span style={styles.byline}>By C. Guilhem</span>
            <span style={styles.version}>v{APP_VERSION}</span>
          </div>
        </div>
        <div style={styles.modeSwitch}>
          <button style={mode === "eleve" ? styles.modeBtnActive : styles.modeBtn} onClick={() => setMode("eleve")}>Élève</button>
          <button style={mode === "prof" ? styles.modeBtnActive : styles.modeBtn} onClick={() => setMode("prof")}>Prof</button>
        </div>
      </header>

      {erreur && <div style={styles.errorBanner}>{erreur}</div>}
      {chargement && <div style={styles.loading}>Chargement des données...</div>}
      <div style={styles.warnBanner}>
        Contenu de base à vérifier et compléter par C. Guilhem avant utilisation avec les élèves (voir en particulier "Nœud du pendu").
      </div>

      <div style={styles.ongletSwitch}>
        <button style={onglet === "referentiel" ? styles.ongletBtnActive : styles.ongletBtn} onClick={() => setOnglet("referentiel")}>Référentiel</button>
        <button style={onglet === "evaluation" ? styles.ongletBtnActive : styles.ongletBtn} onClick={() => setOnglet("evaluation")}>Évaluation</button>
      </div>

      {onglet === "referentiel" &&
        MODULES.map((m) => (
          <div key={m.id} style={styles.moduleBlock}>
            <h2 style={styles.moduleTitle}>{m.label}</h2>
            <div style={styles.grid}>
              {m.items.map((it) => {
                const key = itemKey(m.id, it.id);
                const v = videos[key] || { demo: "", phases: [] };
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

                    {mode === "prof" && (
                      <button style={styles.editBtn} onClick={() => setEditingVideo(key)}>
                        {v.demo || (v.phases && v.phases.length) ? "Gérer les vidéos" : "+ Ajouter une vidéo"}
                      </button>
                    )}

                    {editingVideo === key && (
                      <div style={styles.editPanel}>
                        <label style={styles.editLabel}>Vidéo de démonstration (URL)</label>
                        <input style={styles.editInput} defaultValue={v.demo} placeholder="https://..." onBlur={(e) => saveVideo(key, "demo", e.target.value)} />
                        <label style={styles.editLabel}>Vidéos d'apprentissage par phases</label>
                        {(v.phases || []).map((p, i) => (
                          <div key={i} style={styles.phaseRow}>
                            <input style={styles.editInput} defaultValue={p} placeholder="https://..." onBlur={(e) => saveVideo(key, "phases", e.target.value, i)} />
                            <button style={styles.removeBtn} onClick={() => removePhase(key, i)}>✕</button>
                          </div>
                        ))}
                        <button style={styles.addPhaseBtn} onClick={() => saveVideo(key, "phases", "")}>+ Ajouter une phase</button>
                        <button style={styles.doneBtn} onClick={() => setEditingVideo(null)}>Terminé</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {onglet === "evaluation" && (
        <div>
          <input style={styles.nameInput} placeholder="Nom de l'élève" value={nom} onChange={(e) => setNom(e.target.value)} />

          {MODULES.map((m) => (
            <div key={m.id} style={styles.moduleBlock}>
              <h2 style={styles.moduleTitle}>{m.label}</h2>
              {m.items.map((it) => {
                const key = itemKey(m.id, it.id);
                if (mode === "prof") {
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
                  );
                }
                return (
                  <label key={key} style={styles.evalRow}>
                    <span style={styles.evalLabel}>{it.titre}</span>
                    <input
                      type="checkbox"
                      style={styles.evalCheck}
                      checked={!!autoEval[key]}
                      onChange={() => setAutoEval((s) => ({ ...s, [key]: !s[key] }))}
                    />
                  </label>
                );
              })}
            </div>
          ))}

          <div style={styles.scoreBox}>
            {mode === "prof" ? (
              <div style={styles.scoreTotal}>
                <span>Note globale</span>
                <span>{scoreProf.toFixed(2)} / 20</span>
              </div>
            ) : (
              <div style={styles.scoreTotal}>
                <span>Compétences maîtrisées</span>
                <span>{scoreEleve.acquis} / {scoreEleve.total} ({scoreEleve.pct}%)</span>
              </div>
            )}
            <button style={styles.saveBtn} onClick={enregistrerEvaluation}>Enregistrer l'évaluation</button>
            {sauvegarde && <p style={{ fontSize: 12, marginTop: 8, color: "#6B7A5E" }}>{sauvegarde}</p>}
          </div>
        </div>
      )}

      <footer style={styles.footer}>Escalade Pro — By C. Guilhem — v{APP_VERSION}</footer>
    </div>
  );
}
