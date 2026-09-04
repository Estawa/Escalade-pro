# Escalade Pro — By C. Guilhem

Sécurité, nœuds, assurage à 5 points, lovage de corde — référentiel + évaluation élève/prof.

## Démarrage local

```
npm install
npm run dev
```

## Avant le premier déploiement

Complète tes identifiants Firebase dans `src/firebase.js`. Tu peux réutiliser le
même projet Firebase que Gym Pro (deux collections dédiées sont utilisées :
escalade_videos et escalade_evaluations), ou créer un projet Firebase séparé.

Voir le guide complet : `GUIDE_DEPLOIEMENT_ESCALADE_PRO.docx` (GitHub, Firebase, Vercel) —
les étapes sont identiques à celles de Gym Pro.

⚠️ Le contenu pédagogique (src/data.js) est une base à vérifier et compléter avant
utilisation avec les élèves, notamment le nœud du pendu.

## Build de production

```
npm run build
```
