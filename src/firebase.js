import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, getDocs } from "firebase/firestore";

// ⚠️ À COMPLÉTER : remplace ces valeurs par celles de ton projet Firebase
// (Console Firebase > Paramètres du projet > Vos applications > Config SDK)
// Tu peux réutiliser le même projet Firebase que Gym Pro, ou en créer un dédié.
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

export async function saveEvaluation(id, data) {
  await setDoc(doc(db, EVALS_COLLECTION, id), data);
}
