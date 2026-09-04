# Escalade Pro — By C. Guilhem

Sécurité, nœuds, assurage à 5 points, lovage de corde — référentiel + évaluation élève/prof,
avec connexion élève par classe/nom/PIN et import de classes CSV/Excel/ODS.

## Démarrage local

```
npm install
npm run dev
```

## Avant le premier déploiement

Complète tes identifiants Firebase dans `src/firebase.js`. Tu peux réutiliser le
même projet Firebase que Gym Pro (deux collections dédiées sont utilisées :
`escalade_videos` et `escalade_evaluations`), ou créer un projet Firebase séparé.
Le référentiel (vidéos) et les évaluations restent sur Firebase ; les classes,
élèves et codes PIN sont stockés localement sur l'appareil (comme dans Course de
Durée Pro).

Code d'accès enseignant par défaut : **4242**. Modifiable directement depuis
l'application (bouton "Modifier le code d'accès" en haut de l'espace enseignant).

⚠️ Le contenu pédagogique (`src/data.js`) est une base à vérifier et compléter avant
utilisation avec les élèves, notamment le nœud du pendu.

## Connexion élève

L'élève choisit sa classe, trouve son nom dans la liste, puis définit son propre
code PIN (4 à 6 chiffres) lors de sa première connexion. Les connexions suivantes
demandent ce même code.

## Import des classes

Depuis l'espace enseignant (onglet "Élèves & suivi" → "Importer des élèves") :
formats CSV, Excel (.xlsx) et ODS acceptés, y compris les exports Pronote. Un
aperçu brut du fichier permet d'associer manuellement les colonnes (Nom, Prénom,
Nom+Prénom combiné, Classe, Sexe) avant validation.

## Suivi de Cycle (17 voies)

Côté élève, l'onglet "Suivi de Cycle" permet d'enregistrer chaque passage sur
les 17 voies du mur (voie, rôle grimpeur/assureur, mode Moulinette/Moulitête/
Tête, difficulté, nombre de couleurs, hauteur atteinte, corde lovée).

Côté enseignant, l'onglet "Voies" permet de configurer, pour chacune des 17
voies, la difficulté correspondant à 1, 2 ou 3 couleurs de prise (sert de
suggestion pré-remplie côté élève). Dans "Élèves & suivi", le panneau
"Suivi de cycle" de chaque élève affiche le bilan de ses passages et permet
de saisir l'épreuve finale (passage Grimpeur et passage Assureur) ainsi
qu'une note de suivi de cycle sur 20.

## Build de production

```
npm run build
```
