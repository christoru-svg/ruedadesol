# Rueda de Sol · Suivi des élèves

Application web installable (PWA) pour suivre les élèves du groupe Capoeira Rueda de Sol : élèves et statuts, cordes, présences, séances (1h30 de cours et 30 min de musique), référentiel de compétences par corde, contribution au groupe.

- Aucune dépendance, aucune étape de build : HTML, CSS et JavaScript simples.
- Fonctionne hors ligne une fois ouverte (service worker).
- Les données sont enregistrées sur le téléphone (IndexedDB). Une copie en ligne facultative (Firebase) permet de les retrouver après avoir vidé le cache.

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

## Copie en ligne (Firebase, facultatif)

À l'ouverture, un écran de connexion s'affiche tant que personne n'est connecté (il ne s'affiche pas si la copie en ligne n'est pas configurée, ni hors ligne si Firebase n'a pas encore pu se charger). Une fois connecté·e, l'appli envoie une copie de toutes les données (photos comprises) dans Firestore, quelques secondes après chaque modification. Après avoir vidé le cache ou sur un nouveau téléphone, il suffit de se reconnecter pour tout récupérer. En cas de doute (données des deux côtés), l'appli demande laquelle garder.

Connexion : **Continuer avec Google** (conseillé sur Android), ou bien un e-mail et un mot de passe (« Créer un compte » la première fois). La déconnexion se fait dans **Réglages › Compte en ligne**.

Configuration, une seule fois, dans la console Firebase :
1. **Authentication** › Sign-in method : activer **Google** et/ou **E-mail/Mot de passe**.
2. Se connecter une première fois dans l'appli (Google ou « Créer un compte »). Cela crée le compte.
3. Ensuite, facultatif : **Authentication** › Settings › User actions : décocher « Enable create (sign-up) », pour que personne d'autre ne puisse créer de compte. Le compte déjà créé continue de fonctionner.
4. **Authentication** › Settings › Authorized domains : ajouter `christoru-svg.github.io`.
5. **Firestore Database** › Create database, région en Europe (par exemple `europe-west9`, Paris), puis onglet **Rules** :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

6. **Paramètres du projet** › Vos applications › ajouter une application **Web**, puis copier l'objet `firebaseConfig` dans `js/firebase-config.js` (à la place de `null`).

Ces valeurs de configuration ne sont pas secrètes : seul le compte connecté peut lire ou écrire ses données, grâce aux règles ci-dessus.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique, en-tête, barre d'onglets |
| `css/app.css` | Styles, thèmes clair et sombre, tailles de texte en rem |
| `js/store.js` | Lecture et écriture dans IndexedDB |
| `js/firebase-config.js` | Configuration Firebase (`null` = pas de copie en ligne) |
| `js/sync.js` | Connexion et copie en ligne (Firebase), chargé seulement si configuré |
| `js/app.js` | Référentiels (cordes, compétences), écrans, actions, sauvegarde, données d'exemple |
| `sw.js` | Cache hors ligne |
| `manifest.webmanifest`, `icons/` | Installation sur l'écran d'accueil |
