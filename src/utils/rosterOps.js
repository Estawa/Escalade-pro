// Fonctions pures de manipulation d'un roster { classe: [eleves] }. Un roster appartient
// toujours à un seul enseignant (teacherId) : chargé/sauvegardé via loadRosterTeacher /
// saveRosterTeacher (firebase.js), jamais lu directement depuis le stockage local.
// Chaque fonction reçoit le roster courant et renvoie le nouveau roster (ou une valeur
// dérivée), sans jamais modifier l'objet reçu en argument.

function idEleve() {
  return crypto.randomUUID ? crypto.randomUUID() : `e_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export const rosterOps = {
  getClasses: (roster) => Object.keys(roster || {}).sort(),
  getElevesClasse: (roster, classe) => ((roster || {})[classe] || []).slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),

  // Applique une liste plate d'élèves importés {nom, prenom, classe, sexe?} au roster.
  // mode "ajouter" : met à jour les élèves déjà présents (recherchés par nom/prénom dans TOUTES
  // les classes, pas seulement celle du fichier — pour ne jamais dupliquer un élève déjà placé
  // dans un groupe classe alors que le fichier l'indique sous sa classe d'origine) et ajoute les
  // nouveaux. mode "remplacer" : pour chaque classe présente dans l'import, la liste est
  // remplacée par le contenu du fichier (les élèves reconnus gardent leur id/pin, les absents
  // sont retirés).
  // Renvoie { roster, conflits } : conflits liste les élèves retrouvés sous une classe différente
  // de celle du fichier (ils restent dans leur classe actuelle, jamais déplacés automatiquement —
  // seulement sexe complété si absent), à corriger manuellement si besoin (rosterOps.deplacerEleve).
  appliquerImportRoster: (roster, listeEleves, mode = 'ajouter') => {
    const next = { ...(roster || {}) }
    const listeValide = listeEleves.filter((e) => e.classe)
    const conflits = []

    if (mode === 'remplacer') {
      const classesConcernees = Array.from(new Set(listeValide.map((e) => e.classe)))
      classesConcernees.forEach((classe) => {
        const importesClasse = listeValide.filter((e) => e.classe === classe)
        const existants = next[classe] || []
        next[classe] = importesClasse.map((imp) => {
          const trouve = existants.find(
            (e) => e.nom.toLowerCase() === imp.nom.toLowerCase() && e.prenom.toLowerCase() === imp.prenom.toLowerCase()
          )
          if (trouve) return { ...trouve, sexe: imp.sexe || trouve.sexe || null }
          return { id: idEleve(), nom: imp.nom, prenom: imp.prenom, pin: null, sexe: imp.sexe || null }
        })
      })
    } else {
      listeValide.forEach(({ nom, prenom, classe, sexe }) => {
        const trouve = rosterOps.trouverEleveParNomPartout(next, nom, prenom)
        if (trouve) {
          let maj = trouve.eleve
          if (sexe && !maj.sexe) maj = { ...maj, sexe }
          next[trouve.classe] = next[trouve.classe].slice()
          next[trouve.classe][trouve.index] = maj
          if (trouve.classe !== classe) {
            conflits.push({ nom, prenom, classeExistante: trouve.classe, classeFichier: classe })
          }
        } else {
          if (!next[classe]) next[classe] = []
          else next[classe] = next[classe].slice()
          next[classe].push({ id: idEleve(), nom, prenom, pin: null, sexe: sexe || null })
        }
      })
    }
    return { roster: next, conflits }
  },

  ajouterEleveManuel: (roster, classe, nom, prenom, sexe = null, equipe = null) => {
    const eleve = { id: idEleve(), nom: nom.trim(), prenom: prenom.trim(), pin: null, sexe: sexe || null, equipe: equipe || null }
    const next = { ...(roster || {}) }
    next[classe] = [...(next[classe] || []), eleve]
    return { roster: next, eleve }
  },

  ajouterClasse: (roster, classe) => {
    const nom = classe.trim().toUpperCase()
    const next = { ...(roster || {}) }
    if (!next[nom]) next[nom] = []
    return { roster: next, nom }
  },

  modifierEleve: (roster, classe, eleveId, { nom, prenom, sexe, equipe }) => {
    const next = { ...(roster || {}) }
    next[classe] = (next[classe] || []).map((e) => {
      if (e.id !== eleveId) return e
      return {
        ...e,
        nom: nom.trim(),
        prenom: prenom.trim(),
        sexe: sexe !== undefined ? sexe || null : e.sexe,
        equipe: equipe !== undefined ? (equipe ? equipe.trim() : null) : e.equipe
      }
    })
    return next
  },

  supprimerEleve: (roster, classe, eleveId) => {
    const next = { ...(roster || {}) }
    if (!next[classe]) return next
    next[classe] = next[classe].filter((e) => e.id !== eleveId)
    if (next[classe].length === 0) delete next[classe]
    return next
  },

  supprimerClasse: (roster, classe) => {
    const next = { ...(roster || {}) }
    delete next[classe]
    return next
  },

  reinitialiserPin: (roster, classe, eleveId) => {
    const next = { ...(roster || {}) }
    next[classe] = (next[classe] || []).map((e) => (e.id === eleveId ? { ...e, pin: null } : e))
    return next
  },

  // Cherche un élève par nom+prénom dans TOUTES les classes du roster (pas seulement une classe
  // précise) — sert à ne jamais créer de doublon quand le même élève est repéré sous un nom de
  // classe différent d'un import à l'autre (ex. classe d'origine vs groupe classe).
  // Renvoie { classe, index, eleve } ou null.
  trouverEleveParNomPartout: (roster, nom, prenom) => {
    const n = nom.trim().toLowerCase()
    const p = prenom.trim().toLowerCase()
    for (const classe of Object.keys(roster || {})) {
      const index = (roster[classe] || []).findIndex((e) => e.nom.toLowerCase() === n && e.prenom.toLowerCase() === p)
      if (index !== -1) return { classe, index, eleve: roster[classe][index] }
    }
    return null
  },

  // Déplace un élève d'une classe vers une autre en conservant son identifiant (donc son PIN et
  // tout son suivi, indexés par id, pas par classe) — seul moyen sûr de corriger un élève placé
  // au mauvais endroit ; le supprimer puis le recréer casserait le lien avec son historique.
  deplacerEleve: (roster, classeActuelle, eleveId, nouvelleClasse) => {
    const next = { ...(roster || {}) }
    const eleve = (next[classeActuelle] || []).find((e) => e.id === eleveId)
    if (!eleve) return next
    next[classeActuelle] = next[classeActuelle].filter((e) => e.id !== eleveId)
    if (next[classeActuelle].length === 0) delete next[classeActuelle]
    const nom = nouvelleClasse.trim().toUpperCase()
    next[nom] = [...(next[nom] || []), eleve]
    return next
  },

  trouverEleve: (roster, classe, eleveId) => ((roster || {})[classe] || []).find((e) => e.id === eleveId) || null,

  // Cherche un élève par son id dans tout le roster (toutes classes), sans connaître sa classe
  // à l'avance — utilisé pour retrouver la fiche d'un élève déjà connecté sur l'appareil.
  trouverEleveParId: (roster, eleveId) => {
    for (const classe of Object.keys(roster || {})) {
      const trouve = (roster[classe] || []).find((e) => e.id === eleveId)
      if (trouve) return { ...trouve, classe }
    }
    return null
  },

  definirPin: (roster, classe, eleveId, pin) => {
    const next = { ...(roster || {}) }
    next[classe] = (next[classe] || []).map((e) => (e.id === eleveId ? { ...e, pin } : e))
    return next
  },

  verifierPin: (roster, classe, eleveId, pin) => {
    const eleve = rosterOps.trouverEleve(roster, classe, eleveId)
    return !!eleve && eleve.pin === pin
  },

  // ---------- Gestion des équipes (binômes/trinômes de travail) ----------
  // Chaque élève porte un champ equipe (nom du groupe, ex "Équipe 3"), null tant qu'il n'est
  // rattaché à aucune équipe. La composition de l'équipe reste fixe sur le cycle (sauf
  // réorganisation ponctuelle en cas d'absence) ; en revanche les rôles (Grimpeur, Assureur,
  // Conseiller) ne sont PAS figés par équipe — ce sont les élèves eux-mêmes qui déclarent leur
  // rôle à chaque passage (fiche de suivi de cycle), ou le prof lors d'une observation.

  // Regroupe les élèves d'une classe par équipe (triés par nom d'équipe puis par nom d'élève),
  // et renvoie à part les élèves sans équipe.
  equipesDeLaClasse: (roster, classe) => {
    const eleves = rosterOps.getElevesClasse(roster, classe)
    const groupes = {}
    const sansEquipe = []
    eleves.forEach((e) => {
      if (e.equipe) {
        if (!groupes[e.equipe]) groupes[e.equipe] = []
        groupes[e.equipe].push(e)
      } else {
        sansEquipe.push(e)
      }
    })
    const equipes = Object.keys(groupes)
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map((nom) => ({ nom, membres: groupes[nom] }))
    return { equipes, sansEquipe }
  },

  // Prochain nom d'équipe libre ("Équipe 1", "Équipe 2"...) pour une classe donnée.
  prochainNomEquipe: (roster, classe) => {
    const { equipes } = rosterOps.equipesDeLaClasse(roster, classe)
    const utilises = new Set(equipes.map((eq) => eq.nom))
    let n = 1
    while (utilises.has(`Équipe ${n}`)) n++
    return `Équipe ${n}`
  },

  // Constitue (ou reconstitue) une équipe : affecte equipe=nom aux élèves listés (2 pour un
  // binôme, 3 pour un trinôme). N'affecte aucun autre élève de la classe.
  formerEquipe: (roster, classe, nom, eleveIds) => {
    const nomFinal = (nom || '').trim() || rosterOps.prochainNomEquipe(roster, classe)
    const ids = new Set(eleveIds)
    const next = { ...(roster || {}) }
    next[classe] = (next[classe] || []).map((e) => (ids.has(e.id) ? { ...e, equipe: nomFinal } : e))
    return next
  },

  // Renvoie tous les membres d'une équipe dans le pool "sans équipe" (equipe=null).
  dissoudreEquipe: (roster, classe, nomEquipe) => {
    const next = { ...(roster || {}) }
    next[classe] = (next[classe] || []).map((e) => (e.equipe === nomEquipe ? { ...e, equipe: null } : e))
    return next
  },

  // Retire un seul élève de son équipe (ex. absence ponctuelle) sans toucher au reste de
  // l'équipe ; celle-ci peut ensuite être recomposée via formerEquipe si besoin.
  retirerDeEquipe: (roster, classe, eleveId) => {
    const next = { ...(roster || {}) }
    next[classe] = (next[classe] || []).map((e) => (e.id === eleveId ? { ...e, equipe: null } : e))
    return next
  },

  // Renomme une équipe existante (tous ses membres actuels) sans toucher à sa composition.
  renommerEquipe: (roster, classe, ancienNom, nouveauNom) => {
    const nom = (nouveauNom || '').trim()
    if (!nom || nom === ancienNom) return roster
    const next = { ...(roster || {}) }
    next[classe] = (next[classe] || []).map((e) => (e.equipe === ancienNom ? { ...e, equipe: nom } : e))
    return next
  }
}
