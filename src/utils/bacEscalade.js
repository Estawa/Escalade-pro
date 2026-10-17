// Note du bac en escalade (v3.14.0), selon les protocoles du lycée Georges-Brassens
// (référentiels établissement, session 2021). Calcul à part : les notes /20 déjà saisies
// (suivi de cycle, performance, référentiel) ne sont ni modifiées ni remplacées.
//
// BAC GT — AFL 1 /12 = élément 1 « lecture et analyse de la voie » /6 + élément 2
//   « efficience du déplacement et mousquetonnage » /6 (décision P4 : 6 + 6, comme les
//   tableaux). Pour chaque élément : degré atteint, puis ajustement par la cotation de la voie.
//   Fil de séquence /8 : AFL 2 (carnet d'entraînement) + AFL 3 (UN rôle parmi assureur en tête,
//   assureur en moulitête, coach-contre-assureur), points fixes par degré.
// BAC PRO — AFLP 1 /7 (degré + cotation) + AFLP 2 /5 (degré, puis valeur dans la plage).
//   Fil de séquence /8 : AFLP 4 + AFLP 5, plages de points (décision P9).
// Moulitête : impossible de dépasser le degré 3 (GT : 9/12 max ; Pro : 5/7 max à l'AFLP 1).

import { parseDifficulte } from './difficulte.js'

// Cotations de la grille, de la plus facile à la plus dure (6 colonnes par degré).
export const COTATIONS_FILLES = ['4a', '4b', '4c', '5a', '5b', '5c']
export const COTATIONS_GARCONS = ['4a/4b', '4c', '5a', '5b', '5c', '6a']

// Position de la voie dans la grille (0 à 5). Le « + » ne change pas de colonne.
// horsGrille : 'bas' si la voie est plus facile que la 1re colonne, 'haut' si plus dure que la
// dernière (la note est alors bornée à la colonne la plus proche).
export function positionCotation(difficulte, sexe) {
  const { chiffre, lettre } = parseDifficulte(difficulte)
  if (!chiffre) return null
  const rang = (Number(chiffre) - 4) * 3 + { a: 0, b: 1, c: 2 }[lettre] // 4a = 0, 4b = 1 ... 6a = 6
  const garcon = sexe === 'M'
  let index = garcon ? rang - 1 : rang // garçons : 4a et 4b partagent la 1re colonne
  if (garcon && rang === 0) index = 0
  let horsGrille = null
  if (index < 0 || rang < 0) {
    index = 0
    horsGrille = 'bas'
  } else if (index > 5) {
    index = 5
    horsGrille = 'haut'
  }
  return { index, horsGrille, libelle: (garcon ? COTATIONS_GARCONS : COTATIONS_FILLES)[index] }
}

// GT : degré d -> de base[d] + 0,25 à base[d] + 1,5 (D1 0,25-1,5 ; D2 1,75-3 ; D3 3,25-4,5 ; D4 4,75-6)
const BASE_GT = [0, 1.5, 3, 4.5]
export function tableGT(degre) {
  return Array.from({ length: 6 }, (_, i) => BASE_GT[degre - 1] + 0.25 * (i + 1))
}

// Pro, AFLP 1 /7 : valeurs du protocole, identiques filles/garçons (colonnes décalées).
export const TABLE_PRO_AFLP1 = {
  1: [0, 0.2, 0.4, 0.6, 0.8, 1],
  2: [1.5, 1.75, 2, 2.5, 2.75, 3],
  3: [3.5, 3.75, 4, 4.25, 4.5, 5],
  4: [5.5, 5.75, 6, 6.25, 6.5, 7],
}

// Pro, AFLP 2 /5 : plage par degré, l'enseignant choisit la valeur.
export const PLAGES_PRO_AFLP2 = { 1: [0, 0.5], 2: [1, 2], 3: [2.5, 4], 4: [4.5, 5] }

export const MODES_GRIMPE = [
  { valeur: 'tete', libelle: 'En tête' },
  { valeur: 'moulitete', libelle: 'En moulitête (degré 3 max)' },
]

export function degreEffectif(degre, mode) {
  if (!degre) return null
  return mode === 'moulitete' ? Math.min(degre, 3) : degre
}

// Points d'un élément ajusté par la cotation. typeBac 'gt' (/6) ou 'pro' (AFLP 1 /7).
export function pointsAvecCotation(typeBac, degre, difficulte, sexe, mode) {
  const d = degreEffectif(degre, mode)
  const pos = positionCotation(difficulte, sexe)
  if (!d || !pos) return null
  const ligne = typeBac === 'gt' ? tableGT(d) : TABLE_PRO_AFLP1[d]
  return ligne[pos.index]
}

// ---------- Fil de séquence ----------
export const REPARTITIONS = ['6-2', '4-4', '2-6']

export function pointsRepartition(repartition) {
  const [a, b] = (REPARTITIONS.includes(repartition) ? repartition : '4-4').split('-').map(Number)
  return [a, b]
}

// GT : points fixes (sur 2 : 0,5/1/1,5/2 ; sur 4 : 1/2/3/4 ; sur 6 : 1,5/3/4,5/6)
export function pointsFixes(pointsAlloues, degre) {
  if (!degre) return null
  return (pointsAlloues * degre) / 4
}

// Pro : plages (sur 2 : 0-0,4 / 0,5-0,9 / 1-1,4 / 1,5-2 ; sur 4 : 0-0,9 / 1-1,9 / 2-2,9 / 3-4 ;
// sur 6 : 0-1,4 / 1,5-2,9 / 3-4,4 / 4,5-6)
const PLAGES = {
  2: [[0, 0.4], [0.5, 0.9], [1, 1.4], [1.5, 2]],
  4: [[0, 0.9], [1, 1.9], [2, 2.9], [3, 4]],
  6: [[0, 1.4], [1.5, 2.9], [3, 4.4], [4.5, 6]],
}
export function plage(pointsAlloues, degre) {
  return degre ? PLAGES[pointsAlloues]?.[degre - 1] || null : null
}

// Valeurs proposées dans une plage (pas de 0,1 ou 0,5)
export function valeursPlage([min, max], pas = 0.1) {
  const res = []
  for (let v = min; v <= max + 1e-9; v += pas) res.push(Math.round(v * 100) / 100)
  return res
}

export const ROLES_AFL3_GT = [
  {
    id: 'tete',
    libelle: 'Assureur en tête',
    degres: [
      'Assure sans risque mais donne le mou en retard ; gêne la progression ; corde non préparée.',
      'Sans risque mais donne le mou lentement ; le partenaire doit parfois tirer sur la corde ; corde préparée.',
      'Sans risque, contrôle la tension sans décalage avec la progression ; corde préparée.',
      'Sans risque, anticipe les déplacements et besoins ; se déplace au pied de la paroi pour observer.',
    ],
  },
  {
    id: 'moulitete',
    libelle: 'Assureur en moulitête',
    degres: [
      'Lâche le brin de vie, donne beaucoup trop de mou.',
      'Sécuritaire mais gêne : corde trop tendue, pas assez de mou, manœuvres lentes.',
      'Sans risque, quelques anticipations ; ne remarque pas un mauvais mousquetonnage.',
      'Sans risque, parade au départ, placement le long de la paroi, gestion efficace de la tension.',
    ],
  },
  {
    id: 'coach',
    libelle: 'Coach-contre-assureur',
    degres: [
      'Approximations dans la sécurisation, incapable de vérifier le matériel ; aucun conseil.',
      'Applique les consignes mais manque de réactivité ; corrige en retard ; conseils génériques.',
      'Aucun problème de sécurité, corrige de suite un mauvais mousquetonnage ; conseils fiables sur les appuis.',
      'Anticipe les erreurs de mousquetonnage ; conseils fiables sur appuis et choix de cotation ; aide les autres.',
    ],
  },
]

export const DEGRES_AFL2_GT = [
  'Entraînement inadapté : peu ou pas de grimpe, choix aléatoires ; carnet irrégulier ou superficiel.',
  'Partiellement adapté : peu de grimpe, beaucoup d’échecs sans régulation ; carnet régulier mais approximatif.',
  'Adapté : grimpe et efforts constants, « sans prise de risque » ; carnet régulier avec des axes de travail pertinents.',
  'Optimisé : s’engage lucidement dans des voies de plus en plus dures ; carnet méthodique, axes, exercices et régulations.',
]

export const DEGRES_GT_E1 = [
  'Voie au-dessus de ses capacités, profil non pris en compte ; chute ou ne termine pas dans le temps.',
  'Voie en deçà ou trop élevée ; chute au 3e point ou nombreux arrêts pour lire la voie.',
  'Voie la plus dure réussie dans la séquence ; quelques pauses ; sort dans le temps avec difficulté.',
  'Niveau et profil adaptés ; sort la voie en utilisant la moitié du temps imparti.',
]

export const DEGRES_GT_E2 = [
  'Déplacement en réaction ; traction des bras ; pieds en canard ; yoyo ou corde à l’envers.',
  'Déplacement séquentiel ; pointe de pied fréquente ; parfois en PME pour clipper ; plusieurs essais pour mousquetonner.',
  'Continu en moyenne difficulté ; pieds précis ; accepte de se déséquilibrer ; PME très souvent ; 2 mains.',
  'Fluide sur tout le parcours ; charge ses appuis ; prise lointaine ; PME tout le temps ; mousquetonnage ambidextre.',
]

export const DEGRES_PRO_AFLP4 = [
  'N’assure pas en tête ; trop de mou en moulitête ; vérification du matériel approximative ; contre-assureur privilégié.',
  'Assurage sans risque mais lent ; gêne en moulitête ; contre-assureur peu réactif, corrige en retard.',
  'Assurage sans risque, tension contrôlée ; contre-assureur vigilant, corrige de suite.',
  'Anticipe les besoins ; parade, placement, tension efficace ; anticipe les erreurs de mousquetonnage.',
]

export const DEGRES_PRO_AFLP5 = [
  'Échauffement inexistant ; entraînement inadapté ; aucune lucidité pour réévaluer son itinéraire.',
  'Échauffement inconsistant ; peu de grimpe, échecs sans régulation ; peu de lucidité.',
  'Échauffement structuré ; entraînement adapté, « sans prise de risque » ; efforts appropriés.',
  'Échauffement complet et personnalisé ; s’engage lucidement dans des voies de plus en plus dures.',
]

const r2 = (v) => Math.round(v * 100) / 100

// Calcul complet de la note du bac à partir des saisies (bacGT ou bacPro de l'évaluation).
export function calculerNoteBac(typeBac, saisie, sexe) {
  const s = saisie || {}
  if (typeBac === 'gt') {
    const e1 = pointsAvecCotation('gt', s.e1Degre, s.cotation, sexe, s.mode)
    const e2 = pointsAvecCotation('gt', s.e2Degre, s.cotation, sexe, s.mode)
    const [p2, p3] = pointsRepartition(s.repartition)
    const afl2 = pointsFixes(p2, s.afl2Degre)
    const afl3 = s.afl3Role ? pointsFixes(p3, s.afl3Degre) : null
    const fin = e1 == null && e2 == null ? null : r2((e1 ?? 0) + (e2 ?? 0))
    const fil = afl2 == null && afl3 == null ? null : r2((afl2 ?? 0) + (afl3 ?? 0))
    return { e1, e2, afl2, afl3, fin, fil, total: fin == null && fil == null ? null : r2((fin ?? 0) + (fil ?? 0)), p2, p3 }
  }
  const aflp1 = pointsAvecCotation('pro', s.aflp1Degre, s.cotation, sexe, s.mode)
  const aflp2 = typeof s.aflp2Note === 'number' ? s.aflp2Note : null
  const [p4, p5] = pointsRepartition(s.repartition)
  const aflp4 = typeof s.aflp4Note === 'number' ? s.aflp4Note : null
  const aflp5 = typeof s.aflp5Note === 'number' ? s.aflp5Note : null
  const fin = aflp1 == null && aflp2 == null ? null : r2((aflp1 ?? 0) + (aflp2 ?? 0))
  const fil = aflp4 == null && aflp5 == null ? null : r2((aflp4 ?? 0) + (aflp5 ?? 0))
  return { aflp1, aflp2, aflp4, aflp5, fin, fil, total: fin == null && fil == null ? null : r2((fin ?? 0) + (fil ?? 0)), p4, p5 }
}

export function formatDuree(ms) {
  if (typeof ms !== 'number') return '—'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}'${String(s % 60).padStart(2, '0')}`
}
