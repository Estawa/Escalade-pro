// Compresse une image sélectionnée par le professeur avant de la stocker (en base64) dans
// Firestore : redimensionnée à une largeur maximale et réencodée en JPEG à qualité réduite,
// pour rester largement sous la limite de taille d'un document Firestore (1 Mo).
export function fichierVersImageCompressee(fichier, largeurMax = 1000, qualite = 0.72) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error("Lecture du fichier impossible"));
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        const ratio = Math.min(1, largeurMax / img.width);
        const largeur = Math.round(img.width * ratio);
        const hauteur = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = largeur;
        canvas.height = hauteur;
        canvas.getContext("2d").drawImage(img, 0, 0, largeur, hauteur);
        resolve(canvas.toDataURL("image/jpeg", qualite));
      };
      img.src = lecteur.result;
    };
    lecteur.readAsDataURL(fichier);
  });
}
