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

// Clé stable par élève identifié (indépendante d'un renommage de classe/élève après coup).
export function cleEvaluation(eleve) {
  return eleve.id ? eleve.id : `${eleve.nom}__${eleve.prenom}__${eleve.classe}`.toLowerCase();
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

export function voiesParDefaut() {
  return Array.from({ length: 17 }, (_, i) => ({
    numero: i + 1,
    couleurs: { 1: "", 2: "", 3: "" }
  }));
}

export async function loadVoies() {
  const snap = await getDoc(doc(db, CONFIG_COLLECTION, VOIES_DOC_ID));
  if (snap.exists() && Array.isArray(snap.data().liste) && snap.data().liste.length > 0) {
    return snap.data().liste;
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
