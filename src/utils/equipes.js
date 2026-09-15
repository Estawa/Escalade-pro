// Rôles possibles pour un élève au sein d'une équipe (binôme ou trinôme) :
// - trinôme : 'assureur' + 'grimpeur' + 'conseiller' (3 rôles distincts)
// - binôme  : 'assureur_conseiller' (les 2 rôles fusionnés) + 'grimpeur'
// Un élève sans équipe a role = null.

export const ROLE_LABELS = {
  assureur_conseiller: 'Assureur / Conseiller',
  assureur: 'Assureur',
  grimpeur: 'Grimpeur',
  conseiller: 'Conseiller'
}

export const ROLE_LABELS_COURTS = {
  assureur_conseiller: 'Ass./Cons.',
  assureur: 'Assureur',
  grimpeur: 'Grimpeur',
  conseiller: 'Conseiller'
}

export function libelleRole(role) {
  return ROLE_LABELS[role] || ''
}

export function libelleRoleCourt(role) {
  return ROLE_LABELS_COURTS[role] || ''
}
