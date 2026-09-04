// Contenu de base pour Escalade Pro.
// ⚠️ À vérifier et compléter par C. Guilhem avant utilisation avec les élèves,
// en particulier les points signalés "à compléter".

export const MODULES = [
  {
    id: "securite",
    label: "Sécurité & vérification visuelle",
    items: [
      { id: 1, titre: "Vérification de la corde", texte: "Rechercher sur toute la longueur : entailles, zones molles ou anormalement rigides, gaine usée ou effilochée." },
      { id: 2, titre: "Vérification du baudrier", texte: "Sangles non effilochées, boucles de réglage bien resserrées et repassées, coutures intactes." },
      { id: 3, titre: "Vérification des mousquetons", texte: "Système de verrouillage fonctionnel, absence de jeu, pas de fissure ni de trace de choc." },
      { id: 4, titre: "Vérification du casque", texte: "Coque sans fissure ni déformation, sangles et réglages en bon état." },
      { id: 5, titre: "Matériel douteux", texte: "Tout matériel douteux ou endommagé est signalé immédiatement au professeur et n'est pas utilisé." },
    ],
  },
  {
    id: "baudrier",
    label: "Installation dans le baudrier",
    items: [
      { id: 1, titre: "Enfiler les jambières", texte: "Enfiler les jambières du baudrier avant de fermer la ceinture." },
      { id: 2, titre: "Positionner la ceinture", texte: "Positionner la ceinture au-dessus des hanches, sur les os iliaques, jamais sur le ventre." },
      { id: 3, titre: "Serrer et repasser", texte: "Serrer la sangle de ceinture puis la repasser intégralement dans la boucle (double passage si la boucle n'est pas automatique)." },
      { id: 4, titre: "Ajuster les tours de cuisses", texte: "Ajuster les tours de cuisses de façon symétrique, sans excès de mou." },
      { id: 5, titre: "Contrôle croisé", texte: "Faire vérifier l'installation par le partenaire ou le professeur avant de s'encorder." },
    ],
  },
  {
    id: "noeuds",
    label: "Nœuds",
    items: [
      { id: 1, titre: "Nœud de huit (encordement)", texte: "Nœud principal reliant le grimpeur à la corde via le pontet du baudrier. Toujours terminé par un repassage complet et serré." },
      { id: 2, titre: "Nœud de vache (tête d'alouette)", texte: "Nœud rapide pour fixer une sangle ou une dégaine. Ne s'utilise jamais seul comme nœud d'encordement principal." },
      { id: 3, titre: "Nœud du pendu", texte: "À compléter et vérifier par le professeur avant utilisation avec les élèves." },
      { id: 4, titre: "Nœud d'arrêt en bout de corde", texte: "Empêche la corde de sortir complètement du système d'assurage." },
    ],
  },
  {
    id: "assurage",
    label: "Assurage à 5 points",
    items: [
      { id: 1, titre: "Point 1", texte: "Le nœud d'encordement du grimpeur est correct et serré." },
      { id: 2, titre: "Point 2", texte: "Le baudrier du grimpeur est fermé et les sangles rentrées." },
      { id: 3, titre: "Point 3", texte: "Le baudrier de l'assureur est fermé et les sangles rentrées." },
      { id: 4, titre: "Point 4", texte: "Le système d'assurage est correctement installé, mousqueton verrouillé." },
      { id: 5, titre: "Point 5", texte: "La longueur de corde côté assureur est suffisante et le nœud d'arrêt est présent." },
    ],
  },
  {
    id: "lovage",
    label: "Lovage et rangement de la corde",
    items: [
      { id: 1, titre: "Contrôle pendant le lovage", texte: "Faire glisser la corde dans les mains pendant le lovage pour contrôler son état sur toute la longueur." },
      { id: 2, titre: "Technique de lovage", texte: "Réaliser un lovage en anneaux réguliers ou en papillon, sans vrille ni nœud." },
      { id: 3, titre: "Fixation", texte: "Fixer les extrémités pour que la corde reste lovée pendant le transport." },
      { id: 4, titre: "Rangement", texte: "Ranger la corde à l'abri de la lumière, de l'humidité et des produits chimiques." },
    ],
  },
];
