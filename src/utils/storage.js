// Stockage local (par appareil) : ne contient plus le roster élèves (déplacé vers Firebase,
// voir loadRosterTeacher/saveRosterTeacher dans firebase.js et rosterOps.js pour les
// manipulations), seulement la session en cours sur cet appareil : élève connecté et session
// enseignant (rôle + identifiant de l'espace consulté).
const KEYS = {
  ELEVE_ACTIF: 'esc_eleve_actif_v2', // { teacherId, id }
  PIN_OK: 'esc_pin_ok',
  PIN_ENSEIGNANT: 'esc_pin_enseignant',
  ROLE_ENSEIGNANT: 'esc_role_enseignant',
  COLLEGUE_NOM: 'esc_collegue_nom',
  TEACHER_ID_ENSEIGNANT: 'esc_teacher_id_enseignant' // 'admin' ou id du collègue connecté
}

const PIN_ENSEIGNANT_DEFAUT = '4242'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  // --- Session élève active sur cet appareil : { teacherId, id } ---
  getEleveActifPointeur: () => read(KEYS.ELEVE_ACTIF, null),
  setEleveActifPointeur: (teacherId, id) => write(KEYS.ELEVE_ACTIF, { teacherId, id }),
  clearEleveActif: () => localStorage.removeItem(KEYS.ELEVE_ACTIF),

  getPinOk: () => read(KEYS.PIN_OK, false),
  setPinOk: (val) => write(KEYS.PIN_OK, val),

  // --- Ancien code d'accès enseignant local, conservé uniquement comme valeur de départ lors
  // de la toute première migration vers le code d'accès administrateur partagé (Firebase). ---
  getPinEnseignant: () => read(KEYS.PIN_ENSEIGNANT, PIN_ENSEIGNANT_DEFAUT),
  setPinEnseignant: (pin) => write(KEYS.PIN_ENSEIGNANT, pin),

  // --- Session enseignant en cours sur cet appareil : rôle ('admin' | 'collegue'), nom affiché
  // si collègue, et teacherId (= 'admin' pour Christophe, = l'id du collègue sinon) qui détermine
  // quel espace d'élèves et de suivi est chargé par défaut. ---
  getRoleEnseignant: () => read(KEYS.ROLE_ENSEIGNANT, null),
  setRoleEnseignant: (role) => write(KEYS.ROLE_ENSEIGNANT, role),
  getCollegueNom: () => read(KEYS.COLLEGUE_NOM, null),
  setCollegueNom: (nom) => write(KEYS.COLLEGUE_NOM, nom),
  getTeacherIdEnseignant: () => read(KEYS.TEACHER_ID_ENSEIGNANT, null),
  setTeacherIdEnseignant: (id) => write(KEYS.TEACHER_ID_ENSEIGNANT, id),
  clearSessionEnseignant: () => {
    localStorage.removeItem(KEYS.PIN_OK)
    localStorage.removeItem(KEYS.ROLE_ENSEIGNANT)
    localStorage.removeItem(KEYS.COLLEGUE_NOM)
    localStorage.removeItem(KEYS.TEACHER_ID_ENSEIGNANT)
  }
}

// Conservé pour compatibilité : valeur par défaut avant toute modification par l'enseignant.
export const PIN_ENSEIGNANT = PIN_ENSEIGNANT_DEFAUT
