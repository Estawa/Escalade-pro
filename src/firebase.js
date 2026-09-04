import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";

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
