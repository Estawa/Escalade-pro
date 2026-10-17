import { useMemo, useState } from 'react'
import { Save, Timer } from 'lucide-react'
import DifficulteSelect from './DifficulteSelect.jsx'
import { formatDifficulte, parseDifficulte } from '../utils/difficulte.js'
import { saveEvaluation } from '../firebase.js'
import { libelleTypeBac } from './TypeBac.jsx'
import {
  MODES_GRIMPE,
  REPARTITIONS,
  pointsRepartition,
  positionCotation,
  degreEffectif,
  pointsAvecCotation,
  pointsFixes,
  plage,
  valeursPlage,
  PLAGES_PRO_AFLP2,
  ROLES_AFL3_GT,
  DEGRES_AFL2_GT,
  DEGRES_GT_E1,
  DEGRES_GT_E2,
  DEGRES_PRO_AFLP4,
  DEGRES_PRO_AFLP5,
  calculerNoteBac,
  formatDuree,
} from '../utils/bacEscalade.js'

const DEGRES_PRO_AFLP1 = DEGRES_GT_E1
const DEGRES_PRO_AFLP2 = DEGRES_GT_E2

function fmt(v) {
  return v == null ? '—' : String(Math.round(v * 100) / 100).replace('.', ',')
}

function Degres({ valeur, onChange, descriptions, max = 4, libellePoints }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {[1, 2, 3, 4].map((d) => (
          <button
            key={d}
            type="button"
            disabled={d > max}
            title={descriptions?.[d - 1]}
            onClick={() => onChange(valeur === d ? null : d)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition disabled:opacity-30 ${
              valeur === d ? 'bg-roche-800 text-white border-roche-800' : 'border-roche-200 text-roche-600'
            }`}
          >
            Degré {d}{libellePoints ? ` · ${libellePoints(d)}` : ''}
          </button>
        ))}
      </div>
      {valeur && descriptions && <p className="text-[11px] text-roche-500 mt-1">{descriptions[valeur - 1]}</p>}
    </div>
  )
}

function ChoixValeur({ valeur, valeurs, onChange }) {
  return (
    <select
      value={valeur ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className="rounded-lg border border-roche-200 px-2 py-1 text-sm bg-white mt-1.5"
    >
      <option value="">—</option>
      {valeurs.map((v) => (
        <option key={v} value={v}>{fmt(v)}</option>
      ))}
    </select>
  )
}

function Bloc({ titre, note, sur, children }) {
  return (
    <div className="bg-roche-50 rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide">{titre}</p>
        <span className="text-sm font-semibold text-roche-900 tabular-nums">{fmt(note)} / {sur}</span>
      </div>
      {children}
    </div>
  )
}

// Fiche « Note du bac » d'un élève (v3.14.0). typeBac = type de la classe ("gt" | "pro").
// Les saisies GT et Pro sont rangées dans deux champs distincts (bacGT / bacPro) : changer le
// type de bac de la classe n'efface rien. Les notes /20 déjà saisies restent affichées à côté.
export default function NoteBacEscalade({ eleve, sexe, typeBac, evaluationExistante, onEnregistre }) {
  const gt = typeBac === 'gt'
  const champ = gt ? 'bacGT' : 'bacPro'
  const epreuve = evaluationExistante?.epreuve || null
  const [s, setS] = useState(() => {
    const existant = evaluationExistante?.[champ] || {}
    const base = { repartition: '4-4', mode: epreuve?.mode || 'tete', cotation: epreuve?.difficulte || '', ...existant }
    // Une épreuve enregistrée après la dernière saisie de la note du bac impose sa voie et son mode.
    if (epreuve && (!existant.date || epreuve.date > existant.date)) {
      if (epreuve.difficulte) base.cotation = epreuve.difficulte
      if (epreuve.mode) base.mode = epreuve.mode
    }
    return base
  })
  const [message, setMessage] = useState('')
  const maj = (patch) => setS((x) => ({ ...x, ...patch }))

  const note = useMemo(() => calculerNoteBac(typeBac, s, sexe), [typeBac, s, sexe])
  const pos = positionCotation(s.cotation, sexe)
  const maxDegre = s.mode === 'moulitete' ? 3 : 4
  const [pa, pb] = pointsRepartition(s.repartition)
  const [diff, setDiff] = useState(() => parseDifficulte(s.cotation))

  async function enregistrer() {
    const patch = { [champ]: { ...s, noteCalculee: note.total, fin12: note.fin, fil8: note.fil, date: new Date().toISOString() } }
    try {
      await saveEvaluation(eleve, patch)
      setMessage('Note du bac enregistrée.')
      onEnregistre && onEnregistre(patch)
    } catch (e) {
      setMessage("Échec de l'enregistrement : " + e.message)
    }
  }

  if (!typeBac) {
    return <p className="text-sm text-alerte">Choisis d'abord le type de bac de la classe (Bac GT ou Bac Pro), au-dessus de la liste des élèves.</p>
  }

  const ev = evaluationExistante || {}
  const autres = [
    ev.notePerformance != null && `Performance ${fmt(ev.notePerformance)}/20`,
    ev.noteCycle != null && `Suivi ${fmt(ev.noteCycle)}/20`,
    ev.scoreProf != null && `Référentiel ${fmt(ev.scoreProf)}/20`,
  ].filter(Boolean)

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide">Note du bac — {libelleTypeBac(typeBac, true)}</p>
          <p className="text-[11px] text-roche-500 mt-0.5">
            Protocole du lycée. {autres.length > 0 ? `Notes déjà saisies, conservées : ${autres.join(' · ')}.` : 'Aucune autre note saisie pour l’instant.'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-roche-900 tabular-nums leading-none">{fmt(note.total)} / 20</p>
          <p className="text-[11px] text-roche-500 tabular-nums">{fmt(note.fin)}/12 + {fmt(note.fil)}/8</p>
        </div>
      </div>

      {!sexe && (
        <p className="text-xs text-alerte bg-[#fbeeea] rounded-lg px-3 py-2">
          Sexe de l'élève non renseigné : la grille de cotation (filles / garçons) ne peut pas s'appliquer. Renseigne-le avec « Modifier nom/prénom ».
        </p>
      )}

      <div className="bg-roche-50 rounded-xl p-3.5 space-y-2">
        <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide">Voie de l'épreuve</p>
        {epreuve && (
          <p className="text-[11px] text-roche-600 flex items-center gap-1">
            <Timer size={12} /> Épreuve enregistrée : voie {epreuve.voie ?? '—'} en {epreuve.difficulte || '—'} ({epreuve.mode === 'moulitete' ? 'moulitête' : 'tête'}) ·{' '}
            {epreuve.sortie ? `sortie en ${formatDuree(epreuve.tempsMs)}` : `non sortie (${epreuve.motifArret || 'arrêt'})`} · {epreuve.chutes || 0} chute{(epreuve.chutes || 0) > 1 ? 's' : ''}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <DifficulteSelect chiffre={diff.chiffre} lettre={diff.lettre} plus={diff.plus} onChange={(d) => { setDiff(d); maj({ cotation: formatDifficulte(d) }) }} />
          <select value={s.mode} onChange={(e) => maj({ mode: e.target.value })} className="rounded-lg border border-roche-200 px-2.5 py-1.5 text-sm bg-white">
            {MODES_GRIMPE.map((m) => <option key={m.valeur} value={m.valeur}>{m.libelle}</option>)}
          </select>
        </div>
        {pos && (
          <p className="text-[11px] text-roche-500">
            Colonne de la grille {sexe === 'F' ? 'filles' : sexe === 'M' ? 'garçons' : ''} : {pos.libelle}
            {pos.horsGrille === 'bas' && ' (voie plus facile que la grille 4a-6a : 1re colonne)'}
            {pos.horsGrille === 'haut' && ' (voie au-dessus de la grille : dernière colonne)'}
          </p>
        )}
        {s.mode === 'moulitete' && <p className="text-[11px] text-roche-600">Moulitête : degré 3 maximum ({gt ? '9/12' : '5/7 à l’AFLP 1'}).</p>}
      </div>

      {gt ? (
        <>
          <Bloc titre="AFL 1 · Élément 1 — Lecture et analyse de la voie" note={note.e1} sur={6}>
            <Degres valeur={s.e1Degre} onChange={(d) => maj({ e1Degre: d })} descriptions={DEGRES_GT_E1} max={maxDegre}
              libellePoints={(d) => fmt(pointsAvecCotation('gt', d, s.cotation, sexe, 'tete'))} />
          </Bloc>
          <Bloc titre="AFL 1 · Élément 2 — Efficience du déplacement et mousquetonnage" note={note.e2} sur={6}>
            <Degres valeur={s.e2Degre} onChange={(d) => maj({ e2Degre: d })} descriptions={DEGRES_GT_E2} max={maxDegre}
              libellePoints={(d) => fmt(pointsAvecCotation('gt', d, s.cotation, sexe, 'tete'))} />
          </Bloc>
        </>
      ) : (
        <>
          <Bloc titre="AFLP 1 — Anticiper et planifier son itinéraire" note={note.aflp1} sur={7}>
            <Degres valeur={s.aflp1Degre} onChange={(d) => maj({ aflp1Degre: d })} descriptions={DEGRES_PRO_AFLP1} max={maxDegre}
              libellePoints={(d) => fmt(pointsAvecCotation('pro', d, s.cotation, sexe, 'tete'))} />
          </Bloc>
          <Bloc titre="AFLP 2 — Techniques efficaces pour adapter son déplacement" note={note.aflp2} sur={5}>
            <Degres valeur={s.aflp2Degre} descriptions={DEGRES_PRO_AFLP2}
              onChange={(d) => maj({ aflp2Degre: d, aflp2Note: d ? PLAGES_PRO_AFLP2[d][1] : null })}
              libellePoints={(d) => PLAGES_PRO_AFLP2[d].map(fmt).join(' à ')} />
            {s.aflp2Degre && (
              <ChoixValeur valeur={s.aflp2Note} valeurs={valeursPlage(PLAGES_PRO_AFLP2[s.aflp2Degre], 0.5)} onChange={(v) => maj({ aflp2Note: v })} />
            )}
          </Bloc>
        </>
      )}

      <div className="bg-roche-50 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-semibold text-roche-700 uppercase tracking-wide">
            Fil de séquence — {gt ? 'AFL 2 + AFL 3' : 'AFLP 4 + AFLP 5'}
          </p>
          <span className="text-sm font-semibold text-roche-900 tabular-nums">{fmt(note.fil)} / 8</span>
        </div>
        <label className="flex items-center gap-2 text-xs text-roche-700">
          Répartition choisie par l'élève
          <select
            value={s.repartition}
            onChange={(e) => {
              const r = e.target.value
              const [na, nb] = pointsRepartition(r)
              if (gt) maj({ repartition: r })
              else
                maj({
                  repartition: r,
                  aflp4Note: s.aflp4Degre ? plage(na, s.aflp4Degre)[1] : s.aflp4Note ?? null,
                  aflp5Note: s.aflp5Degre ? plage(nb, s.aflp5Degre)[1] : s.aflp5Note ?? null,
                })
            }}
            className="rounded-lg border border-roche-200 px-2 py-1 text-sm bg-white"
          >
            {REPARTITIONS.map((r) => {
              const [a, b] = pointsRepartition(r)
              return <option key={r} value={r}>{gt ? `AFL 2 : ${a} — AFL 3 : ${b}` : `AFLP 4 : ${a} — AFLP 5 : ${b}`}</option>
            })}
          </select>
        </label>

        {gt ? (
          <>
            <div>
              <p className="text-xs text-roche-700 mb-1">AFL 2 — S'entraîner (carnet de suivi) · /{pa} · {fmt(note.afl2)}</p>
              <Degres valeur={s.afl2Degre} onChange={(d) => maj({ afl2Degre: d })} descriptions={DEGRES_AFL2_GT} libellePoints={(d) => fmt(pointsFixes(pa, d))} />
            </div>
            <div>
              <p className="text-xs text-roche-700 mb-1">AFL 3 — Un rôle choisi par l'élève · /{pb} · {fmt(note.afl3)}</p>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {ROLES_AFL3_GT.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => maj({ afl3Role: s.afl3Role === r.id ? null : r.id })}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${s.afl3Role === r.id ? 'bg-roche-700 text-white border-roche-700' : 'border-roche-200 text-roche-600'}`}
                  >
                    {r.libelle}
                  </button>
                ))}
              </div>
              {s.afl3Role && (
                <Degres valeur={s.afl3Degre} onChange={(d) => maj({ afl3Degre: d })}
                  descriptions={ROLES_AFL3_GT.find((r) => r.id === s.afl3Role)?.degres} libellePoints={(d) => fmt(pointsFixes(pb, d))} />
              )}
            </div>
          </>
        ) : (
          <>
            {[
              { cle: 'aflp4', titre: 'AFLP 4 — Rôles sociaux (assurage, contre-assurage)', pts: pa, desc: DEGRES_PRO_AFLP4 },
              { cle: 'aflp5', titre: 'AFLP 5 — Se préparer, rester lucide', pts: pb, desc: DEGRES_PRO_AFLP5 },
            ].map(({ cle, titre, pts, desc }) => (
              <div key={cle}>
                <p className="text-xs text-roche-700 mb-1">{titre} · /{pts} · {fmt(s[`${cle}Note`])}</p>
                <Degres
                  valeur={s[`${cle}Degre`]}
                  descriptions={desc}
                  onChange={(d) => maj({ [`${cle}Degre`]: d, [`${cle}Note`]: d ? plage(pts, d)[1] : null })}
                  libellePoints={(d) => plage(pts, d).map(fmt).join(' à ')}
                />
                {s[`${cle}Degre`] && (
                  <ChoixValeur valeur={s[`${cle}Note`]} valeurs={valeursPlage(plage(pts, s[`${cle}Degre`]))} onChange={(v) => maj({ [`${cle}Note`]: v })} />
                )}
              </div>
            ))}
            <p className="text-[11px] text-roche-500">Meilleur degré atteint au cours de la séquence, puis valeur dans la plage.</p>
          </>
        )}
      </div>

      {degreEffectif(4, s.mode) === 3 && ((gt && (s.e1Degre === 4 || s.e2Degre === 4)) || (!gt && s.aflp1Degre === 4)) && (
        <p className="text-[11px] text-roche-600">Le degré 4 saisi est ramené au degré 3 (moulitête).</p>
      )}

      <button onClick={enregistrer} className="flex items-center gap-1.5 bg-roche-800 hover:bg-roche-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition">
        <Save size={15} /> Enregistrer la note du bac
      </button>
      {message && <p className="text-xs text-roche-600">{message}</p>}
    </div>
  )
}
