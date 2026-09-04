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

Code d'accès enseignant par défaut : **4242** (modifiable dans `src/utils/storage.js`,
constante `PIN_ENSEIGNANT`).

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

## Build de production

```
npm run build
```
