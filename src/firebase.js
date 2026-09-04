import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";

// ⚠️ À COMPLÉTER : remplace ces valeurs par celles de ton projet Firebase
// (Console Firebase > Paramètres du projet > Vos applications > Config SDK)
// Tu peux réutiliser le même projet Firebase que Gym Pro / la version précédente
// d'Escalade Pro, ou en créer un dédié.
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  projectId: "VOTRE_PROJET",
  storageBucket: "VOTRE_PROJET.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID",
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
