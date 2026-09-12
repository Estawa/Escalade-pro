import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

// Identifiants du projet Firebase de Christophe (escalade-pro-3cd6d).
const firebaseConfig = {
  apiKey: "AIzaSyA26EYZxBR19deHR9XOazq-jZuJbFUr8-0",
  authDomain: "escalade-pro-3cd6d.firebaseapp.com",
  projectId: "escalade-pro-3cd6d",
  storageBucket: "escalade-pro-3cd6d.firebasestorage.app",
  messagingSenderId: "142024831600",
  appId: "1:142024831600:web:c74fac40225679fb35fab5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const VIDEOS_COLLECTION = "escalade_videos";
const EVALS_COLLECTION = "escalade_evaluations";

export async function loadAllVideos() {
  const snap = await getDocs(collection(db, VIDEOS_COLLECTION));
  const result = {};
  snap.forEach((d) => (result[d.id] = d.data()));
  return result;
}

export async function saveVideoForItem(key, data) {
  await setDoc(doc(db, VIDEOS_COLLECTION, key), data);
}

// Clé stable par élève identifié (indépendante d'un renommage de classe/élève après coup),
// préfixée par l'enseignant (teacherId) auquel appartient l'élève : chaque enseignant a sa
// propre base d'élèves et de suivi, isolée de celle des autres. "admin" = Christophe.
export function cleEvaluation(eleve) {
  const base = eleve.id ? eleve.id : `${eleve.nom}__${eleve.prenom}__${eleve.classe}`.toLowerCase();
  return `${eleve.teacherId || "admin"}__${base}`;
}

export async function saveEvaluation(eleve, data) {
  await setDoc(doc(db, EVALS_COLLECTION, cleEvaluation(eleve)), { eleve, ...data }, { merge: true });
}

export async function loadAllEvaluations() {
  const snap = await getDocs(collection(db, EVALS_COLLECTION));
  const result = {};
  snap.forEach((d) => (result[d.id] = d.data()));
  return result;
}

// --- Configuration des 17 voies du mur (numéro + difficulté selon le nombre de couleurs utilisées) ---
const CONFIG_COLLECTION = "escalade_config";
const VOIES_DOC_ID = "voies";

// Une "couleur" de voie associe un nom de couleur de prise (texte libre, ex. "Rouge")
// à la difficulté correspondante (ex. "5b+"). Ancien format (avant v3.1.0) : une simple
// chaîne de difficulté sans nom de couleur — normalisée automatiquement au chargement.
function normaliserCouleur(valeur) {
  if (valeur && typeof valeur === "object") {
    return { nom: valeur.nom || "", difficulte: valeur.difficulte || "" };
  }
  return { nom: "", difficulte: valeur || "" };
}

export function voiesParDefaut() {
  return Array.from({ length: 17 }, (_, i) => ({
    numero: i + 1,
    couleurs: { 1: { nom: "", difficulte: "" }, 2: { nom: "", difficulte: "" }, 3: { nom: "", difficulte: "" }, 4: { nom: "", difficulte: "" } }
  }));
}

export async function loadVoies() {
  const snap = await getDoc(doc(db, CONFIG_COLLECTION, VOIES_DOC_ID));
  if (snap.exists() && Array.isArray(snap.data().liste) && snap.data().liste.length > 0) {
    return snap.data().liste.map((v) => ({
      numero: v.numero,
      couleurs: {
        1: normaliserCouleur(v.couleurs?.[1]),
        2: normaliserCouleur(v.couleurs?.[2]),
        3: normaliserCouleur(v.couleurs?.[3]),
        4: normaliserCouleur(v.couleurs?.[4])
      }
    }));
  }
  return voiesParDefaut();
}

export async function saveVoies(liste) {
  await setDoc(doc(db, CONFIG_COLLECTION, VOIES_DOC_ID), { liste });
}

// --- Passages (grimpes) enregistrés par chaque élève pendant le cycle ---
const PASSAGES_COLLECTION = "escalade_passages";

export async function loadPassagesEleve(eleve) {
  const snap = await getDoc(doc(db, PASSAGES_COLLECTION, cleEvaluation(eleve)));
  return snap.exists() && Array.isArray(snap.data().liste) ? snap.data().liste : [];
}

export async function ajouterPassage(eleve, passage) {
  const ref = doc(db, PASSAGES_COLLECTION, cleEvaluation(eleve));
  const snap = await getDoc(ref);
  const liste = snap.exists() && Array.isArray(snap.data().liste) ? snap.data().liste : [];
  const nouvelleListe = [...liste, passage];
  await setDoc(ref, { eleve, liste: nouvelleListe });
  return nouvelleListe;
}

// Met à jour un passage existant en place (une seule lecture + une seule écriture),
// utilisé par exemple pour cocher/décocher "corde rangée" sans recréer l'entrée.
export async function modifierPassage(eleve, passageId, patch) {
  const ref = doc(db, PASSAGES_COLLECTION, cleEvaluation(eleve));
  const snap = await getDoc(ref);
  const liste = snap.exists() && Array.isArray(snap.data().liste) ? snap.data().liste : [];
  const nouvelleListe = liste.map((p) => (p.id === passageId ? { ...p, ...patch } : p));
  await setDoc(ref, { eleve, liste: nouvelleListe });
  return nouvelleListe;
}

export async function supprimerPassage(eleve, passageId) {
  const ref = doc(db, PASSAGES_COLLECTION, cleEvaluation(eleve));
  const snap = await getDoc(ref);
  const liste = snap.exists() && Array.isArray(snap.data().liste) ? snap.data().liste : [];
  const nouvelleListe = liste.filter((p) => p.id !== passageId);
  await setDoc(ref, { eleve, liste: nouvelleListe });
  return nouvelleListe;
}

export async function loadAllPassages() {
  const snap = await getDocs(collection(db, PASSAGES_COLLECTION));
  const result = {};
  snap.forEach((d) => (result[d.id] = d.data().liste || []));
  return result;
}

// --- Configuration éditable du contenu du Référentiel : titres/textes modifiés par rapport
// au contenu de base (data.js), encarts ajoutés par le professeur, et encarts masqués/supprimés.
// Un seul document car modifié occasionnellement et de taille modeste (texte uniquement, les
// photos et vidéos restent dans escalade_videos, déjà par item). ---
const REFERENTIEL_COLLECTION = "escalade_referentiel";
const REFERENTIEL_DOC_ID = "config";

export function configReferentielParDefaut() {
  return { overrides: {}, extra: {}, supprimes: [] };
}

export async function loadReferentielConfig() {
  const snap = await getDoc(doc(db, REFERENTIEL_COLLECTION, REFERENTIEL_DOC_ID));
  if (snap.exists()) {
    const d = snap.data();
    return {
      overrides: d.overrides || {},
      extra: d.extra || {},
      supprimes: d.supprimes || [],
    };
  }
  return configReferentielParDefaut();
}

export async function saveReferentielConfig(config) {
  await setDoc(doc(db, REFERENTIEL_COLLECTION, REFERENTIEL_DOC_ID), config);
}

// --- Accès à l'espace enseignant : code de l'administrateur (Christophe, seul à pouvoir
// modifier le Référentiel) et liste des collègues autorisés à utiliser l'appli, chacun avec
// son propre code PIN attribué par l'administrateur. Stocké sur Firebase (et non en local)
// pour que le même code fonctionne quel que soit le téléphone/l'ordinateur utilisé. ---
const ACCES_COLLECTION = "escalade_acces";
const ACCES_DOC_ID = "config";

// pinAdminParDefaut : reprend, à la toute première utilisation (avant création du document
// Firebase), le code déjà en vigueur localement sur l'appareil de l'administrateur, pour ne
// pas le bloquer hors de son propre code d'accès actuel.
export function accesParDefaut(pinAdminParDefaut) {
  return { pinAdmin: pinAdminParDefaut || "4242", nomAdmin: "Mr Guilhem", collegues: [] };
}

export async function loadAccesConfig(pinAdminParDefaut) {
  const snap = await getDoc(doc(db, ACCES_COLLECTION, ACCES_DOC_ID));
  if (snap.exists()) {
    const d = snap.data();
    return {
      pinAdmin: d.pinAdmin || pinAdminParDefaut || "4242",
      nomAdmin: d.nomAdmin || "Mr Guilhem",
      collegues: Array.isArray(d.collegues) ? d.collegues : [],
    };
  }
  return accesParDefaut(pinAdminParDefaut);
}

export async function saveAccesConfig(config) {
  await setDoc(doc(db, ACCES_COLLECTION, ACCES_DOC_ID), config);
}

// --- Roster (classes + élèves) de chaque enseignant : { classe: [eleves] }. Un document par
// enseignant (id = teacherId, "admin" pour Christophe, sinon l'id du collègue dans escalade_acces),
// pour que chaque enseignant ait sa propre base d'élèves, isolée de celle des autres, synchronisée
// sur tous ses appareils. Christophe (admin) peut aussi charger/modifier le roster de n'importe
// quel collègue depuis l'onglet "Vue globale". ---
const ROSTER_COLLECTION = "escalade_roster";

export async function loadRosterTeacher(teacherId) {
  const snap = await getDoc(doc(db, ROSTER_COLLECTION, teacherId));
  return snap.exists() && snap.data().classes ? snap.data().classes : {};
}

export async function saveRosterTeacher(teacherId, roster) {
  await setDoc(doc(db, ROSTER_COLLECTION, teacherId), { classes: roster });
}

// --- Observations du prof : ce que l'enseignant a vu et jugé lui-même (grimpeur ET/OU assureur),
// à la demande de l'élève quand il est prêt à être évalué sur une voie. Distinctes des "passages"
// déclarés par l'élève : seules ces observations donnent lieu à la note de performance de cycle. ---
const OBSERVATIONS_COLLECTION = "escalade_observations";

export async function loadAllObservations() {
  const snap = await getDocs(collection(db, OBSERVATIONS_COLLECTION));
  const result = {};
  snap.forEach((d) => (result[d.id] = d.data().liste || []));
  return result;
}

async function ajouterObservationUnitaire(eleve, observation) {
  const ref = doc(db, OBSERVATIONS_COLLECTION, cleEvaluation(eleve));
  const snap = await getDoc(ref);
  const liste = snap.exists() && Array.isArray(snap.data().liste) ? snap.data().liste : [];
  const nouvelleListe = [...liste, observation];
  await setDoc(ref, { eleve, liste: nouvelleListe });
  return nouvelleListe;
}

// Enregistre une observation de grimpe pour le grimpeur observé et/ou pour l'assureur observé
// (les deux partagent le même evenementId pour rester identifiables comme une seule grimpe vue).
// Renvoie { grimpeur: nouvelleListe|null, assureur: nouvelleListe|null }.
export async function ajouterObservationEvenement({ grimpeurEleve, grimpeurObs, assureurEleve, assureurObs }) {
  const resultat = { grimpeur: null, assureur: null };
  if (grimpeurEleve && grimpeurObs) {
    resultat.grimpeur = await ajouterObservationUnitaire(grimpeurEleve, grimpeurObs);
  }
  if (assureurEleve && assureurObs) {
    resultat.assureur = await ajouterObservationUnitaire(assureurEleve, assureurObs);
  }
  return resultat;
}

export async function supprimerObservation(eleve, observationId) {
  const ref = doc(db, OBSERVATIONS_COLLECTION, cleEvaluation(eleve));
  const snap = await getDoc(ref);
  const liste = snap.exists() && Array.isArray(snap.data().liste) ? snap.data().liste : [];
  const nouvelleListe = liste.filter((o) => o.id !== observationId);
  await setDoc(ref, { eleve, liste: nouvelleListe });
  return nouvelleListe;
}
