const KEYS = {
  ELEVE_ACTIF_ID: 'esc_eleve_actif_id',
  ROSTER: 'esc_roster_v1',
  PIN_OK: 'esc_pin_ok',
  PIN_ENSEIGNANT: 'esc_pin_enseignant'
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

function idEleve() {
  return crypto.randomUUID ? crypto.randomUUID() : `e_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function getRosterBrut() {
  return read(KEYS.ROSTER, {})
}

export const storage = {
  // --- Roster (classes + élèves) ---
  getRoster: () => getRosterBrut(),
  getClasses: () => Object.keys(getRosterBrut()).sort(),
  getElevesClasse: (classe) => (getRosterBrut()[classe] || []).slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),

  // Applique une liste plate d'élèves importés {nom, prenom, classe, sexe?} au roster.
  // mode "ajouter" : met à jour les élèves déjà présents (par nom/prénom) et ajoute les nouveaux, sans rien supprimer.
  // mode "remplacer" : pour chaque classe présente dans l'import, la liste de la classe est remplacée par
  // le contenu du fichier (les élèves reconnus gardent leur id/pin, ceux absents du fichier sont retirés).
  appliquerImportRoster: (listeEleves, mode = 'ajouter') => {
    const roster = getRosterBrut()
    const listeValide = listeEleves.filter((e) => e.classe)

    if (mode === 'remplacer') {
      const classesConcernees = Array.from(new Set(listeValide.map((e) => e.classe)))
      classesConcernees.forEach((classe) => {
        const importesClasse = listeValide.filter((e) => e.classe === classe)
        const existants = roster[classe] || []
        roster[classe] = importesClasse.map((imp) => {
          const trouve = existants.find(
            (e) => e.nom.toLowerCase() === imp.nom.toLowerCase() && e.prenom.toLowerCase() === imp.prenom.toLowerCase()
          )
          if (trouve) return { ...trouve, sexe: imp.sexe || trouve.sexe || null }
          return { id: idEleve(), nom: imp.nom, prenom: imp.prenom, pin: null, sexe: imp.sexe || null }
        })
      })
    } else {
      listeValide.forEach(({ nom, prenom, classe, sexe }) => {
        if (!roster[classe]) roster[classe] = []
        const existant = roster[classe].find(
          (e) => e.nom.toLowerCase() === nom.toLowerCase() && e.prenom.toLowerCase() === prenom.toLowerCase()
        )
        if (existant) {
          if (sexe && !existant.sexe) existant.sexe = sexe
        } else {
          roster[classe].push({ id: idEleve(), nom, prenom, pin: null, sexe: sexe || null })
        }
      })
    }
    write(KEYS.ROSTER, roster)
  },

  ajouterEleveManuel: (classe, nom, prenom, sexe = null) => {
    const roster = getRosterBrut()
    if (!roster[classe]) roster[classe] = []
    const eleve = { id: idEleve(), nom: nom.trim(), prenom: prenom.trim(), pin: null, sexe: sexe || null }
    roster[classe].push(eleve)
    write(KEYS.ROSTER, roster)
    return eleve
  },

  ajouterClasse: (classe) => {
    const roster = getRosterBrut()
    const nom = classe.trim().toUpperCase()
    if (!roster[nom]) {
      roster[nom] = []
      write(KEYS.ROSTER, roster)
    }
    return nom
  },

  modifierEleve: (classe, eleveId, { nom, prenom, sexe }) => {
    const roster = getRosterBrut()
    const eleve = (roster[classe] || []).find((e) => e.id === eleveId)
    if (eleve) {
      eleve.nom = nom.trim()
      eleve.prenom = prenom.trim()
      if (sexe !== undefined) eleve.sexe = sexe || null
      write(KEYS.ROSTER, roster)
      return true
    }
    return false
  },

  supprimerEleve: (classe, eleveId) => {
    const roster = getRosterBrut()
    if (!roster[classe]) return
    roster[classe] = roster[classe].filter((e) => e.id !== eleveId)
    if (roster[classe].length === 0) delete roster[classe]
    write(KEYS.ROSTER, roster)
  },

  supprimerClasse: (classe) => {
    const roster = getRosterBrut()
    delete roster[classe]
    write(KEYS.ROSTER, roster)
  },

  reinitialiserPin: (classe, eleveId) => {
    const roster = getRosterBrut()
    const eleve = (roster[classe] || []).find((e) => e.id === eleveId)
    if (eleve) {
      eleve.pin = null
      write(KEYS.ROSTER, roster)
    }
  },

  trouverEleve: (classe, eleveId) => {
    const roster = getRosterBrut()
    return (roster[classe] || []).find((e) => e.id === eleveId) || null
  },

  definirPin: (classe, eleveId, pin) => {
    const roster = getRosterBrut()
    const eleve = (roster[classe] || []).find((e) => e.id === eleveId)
    if (eleve) {
      eleve.pin = pin
      write(KEYS.ROSTER, roster)
      return true
    }
    return false
  },

  verifierPin: (classe, eleveId, pin) => {
    const eleve = storage.trouverEleve(classe, eleveId)
    return !!eleve && eleve.pin === pin
  },

  // --- Session élève active ---
  getEleveActifId: () => read(KEYS.ELEVE_ACTIF_ID, null),
  setEleveActifId: (id) => write(KEYS.ELEVE_ACTIF_ID, id),
  clearEleveActif: () => localStorage.removeItem(KEYS.ELEVE_ACTIF_ID),

  getEleveActif: () => {
    const id = read(KEYS.ELEVE_ACTIF_ID, null)
    if (!id) return null
    const roster = getRosterBrut()
    for (const classe of Object.keys(roster)) {
      const trouve = roster[classe].find((e) => e.id === id)
      if (trouve) return { id: trouve.id, nom: trouve.nom, prenom: trouve.prenom, classe }
    }
    return null
  },

  getPinOk: () => read(KEYS.PIN_OK, false),
  setPinOk: (val) => write(KEYS.PIN_OK, val),

  // --- Code d'accès enseignant (modifiable, sinon valeur par défaut) ---
  getPinEnseignant: () => read(KEYS.PIN_ENSEIGNANT, PIN_ENSEIGNANT_DEFAUT),
  setPinEnseignant: (pin) => write(KEYS.PIN_ENSEIGNANT, pin)
}

// Conservé pour compatibilité : valeur par défaut avant toute modification par l'enseignant.
export const PIN_ENSEIGNANT = PIN_ENSEIGNANT_DEFAUT
