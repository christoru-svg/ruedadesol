# Rueda de Sol · Suivi des élèves

Application web installable (PWA) pour suivre les élèves du groupe Capoeira Rueda de Sol : élèves et statuts, cordes, présences, séances (1h30 de cours et 30 min de musique), référentiel de compétences par corde, contribution au groupe.

- Aucune dépendance, aucune étape de build : HTML, CSS et JavaScript simples.
- Fonctionne hors ligne une fois ouverte (service worker).
- Toutes les données restent sur le téléphone (IndexedDB). Rien n'est envoyé sur internet.

## Lancer en local

```bash
cd ~/Documents/rueda-de-sol
python3 -m http.server 8765
```

Puis ouvrir http://localhost:8765.

## Mettre en ligne (pour l'installer sur le téléphone)

Un téléphone n'installe une PWA que si elle est servie en HTTPS. Il suffit de publier le dossier tel quel sur un hébergeur de sites statiques, par exemple GitHub Pages ou Netlify.

Ensuite, sur le téléphone :
- **iPhone (Safari)** : bouton Partager, puis « Sur l'écran d'accueil ».
- **Android (Chrome)** : menu ⋮, puis « Installer l'application ».

**À chaque mise à jour du code**, changer la valeur de `CACHE` dans `sw.js` (par exemple `rds-v1.0.1`), sinon les téléphones gardent l'ancienne version.

## Sauvegardes

Les données vivent uniquement dans le navigateur du téléphone. Si le téléphone est perdu, ou si les données du site sont effacées, elles disparaissent.

Dans **Réglages** (roue dentée), « Exporter une sauvegarde » produit un fichier `.json` à garder ailleurs (mail, drive…). « Importer » le recharge, par exemple sur un nouveau téléphone.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique, en-tête, barre d'onglets |
| `css/app.css` | Styles, thèmes clair et sombre, tailles de texte en rem |
| `js/store.js` | Lecture et écriture dans IndexedDB |
| `js/app.js` | Référentiels (cordes, compétences), écrans, actions, sauvegarde, données d'exemple |
| `sw.js` | Cache hors ligne |
| `manifest.webmanifest`, `icons/` | Installation sur l'écran d'accueil |
