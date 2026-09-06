import { rangDifficulte } from './difficulte.js'

// Génère les codes compacts affichés dans les cases du tableau de suivi de cycle,
// à partir des passages structurés enregistrés par chaque élève (voir SuiviCycle.jsx).
//
// Convention (validée avec C. Guilhem) :
//  - Lettre de technique : Tête -> "T", Moulinette -> "M", Moulitête -> "MT"
//  - Préfixe "A" si le passage a été réalisé en tant qu'Assureur (sinon aucun préfixe = Grimpeur)
//  - Si la voie n'a pas été terminée : numéro de la dernière dégaine passée, accolé sans séparateur
//  - Si la voie a été terminée entièrement : aucun numéro
//  - Plusieurs passages dans une même case (même voie, même nombre de couleurs) sont
//    concaténés avec "/", par exemple "T3/AMT4"

export const MODE_CODES = { Moulinette: 'M', Moulitête: 'MT', Tête: 'T' }

export function codeCourtPassage(p) {
  const base = MODE_CODES[p.mode] || '?'
  const prefixe = p.role === 'Assureur' ? 'A' : ''
  const suffixe = p.sommetAtteint ? '' : String(p.mousqueton ?? '')
  return `${prefixe}${base}${suffixe}`
}

// Renvoie, triés par date, tous les passages d'une liste correspondant à une voie
// et un nombre de couleurs de prise donnés (= une case du tableau de suivi).
export function passagesCellule(passages, numeroVoie, nbCouleurs) {
  return (passages || [])
    .filter((p) => p.voie === numeroVoie && p.nbCouleurs === nbCouleurs)
    .sort((a, b) => a.date - b.date)
}

// Le texte compact affiché dans la case, ex. "T3/AMT4". Chaîne vide si aucun passage.
export function codeCourtCellule(passages, numeroVoie, nbCouleurs) {
  const liste = passagesCellule(passages, numeroVoie, nbCouleurs)
  if (liste.length === 0) return ''
  return liste.map(codeCourtPassage).join('/')
}

// true si au moins un passage de la case a été réalisé entièrement (utile pour la mise en forme :
// en gras si au moins une réussite, en normal sinon, sans dépendre de la couleur).
export function celluleAuMoinsUneReussite(passages, numeroVoie, nbCouleurs) {
  return passagesCellule(passages, numeroVoie, nbCouleurs).some((p) => p.sommetAtteint)
}

// Statistiques résumées d'une liste de passages (utilisé pour "Bilan des passages du cycle"
// côté déclaratif élève, et pour "Bilan des observations du prof" côté performance observée).
export function statsPassages(passages) {
  const liste = passages || []
  const total = liste.length
  const reussis = liste.filter((p) => p.sommetAtteint).length
  const voiesDistinctes = new Set(liste.map((p) => p.voie)).size
  const enGrimpeur = liste.filter((p) => p.role === 'Grimpeur').length
  const enAssureur = liste.filter((p) => p.role === 'Assureur').length
  const difficulteMax = liste
    .filter((p) => p.sommetAtteint)
    .reduce((max, p) => Math.max(max, rangDifficulte(p.difficulte)), 0)
  const meilleureVoie = liste.find((p) => p.sommetAtteint && rangDifficulte(p.difficulte) === difficulteMax)
  return { total, reussis, voiesDistinctes, enGrimpeur, enAssureur, meilleureVoie }
}
