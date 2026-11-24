/* Synchronisation en ligne (Firebase) : chargé à la demande par app.js, seulement si FIREBASE_CONFIG est rempli.
   Données dans Firestore, accessibles uniquement par le compte connecté (voir les règles dans le README) :
     users/{uid}/data/main        → tout l'état de l'appli sauf les photos (texte JSON)
     users/{uid}/photos/{élève}   → une photo par élève (les photos dépasseraient la taille maximale d'un document) */
const V = '10.14.1';
const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
const authMod = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
const fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);

let auth, db;

export function start(config, onUser) {
  const app = initializeApp(config);
  auth = authMod.getAuth(app);
  db = fs.getFirestore(app);
  authMod.onAuthStateChanged(auth, (user) => onUser(user ? { uid: user.uid, email: user.email } : null));
}

export async function signIn(email, password) {
  await authMod.signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email, password) {
  await authMod.createUserWithEmailAndPassword(auth, email, password);
}

/* Connexion Google : fenêtre par-dessus l'appli (fonctionne dans l'appli installée sur Android).
   Si le navigateur bloque la fenêtre, on bascule sur une redirection de page. */
export async function signInGoogle() {
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await authMod.signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      await authMod.signInWithRedirect(auth, provider);
    } else throw e;
  }
}

/* Après une redirection : renvoie l'erreur éventuelle (le succès passe par onAuthStateChanged). */
export async function redirectError() {
  try { await authMod.getRedirectResult(auth); return null; } catch (e) { return e; }
}

export async function signOut() {
  await authMod.signOut(auth);
}

export async function resetPassword(email) {
  await authMod.sendPasswordResetEmail(auth, email);
}

/* Lit la copie en ligne. Renvoie null s'il n'y en a pas encore. */
export async function pull(uid) {
  const snap = await fs.getDoc(fs.doc(db, 'users', uid, 'data', 'main'));
  if (!snap.exists()) return null;
  const meta = snap.data();
  const state = JSON.parse(meta.json);
  const photos = await fs.getDocs(fs.collection(db, 'users', uid, 'photos'));
  const byId = {};
  photos.forEach((d) => { byId[d.id] = d.data().data; });
  [...(state.students || []), ...(state.archived || [])].forEach((s) => { if (byId[s.id]) s.photo = byId[s.id]; });
  return state;
}

/* Lit seulement la date de la copie en ligne (pour savoir s'il faut la récupérer). */
export async function remoteStamp(uid) {
  const snap = await fs.getDoc(fs.doc(db, 'users', uid, 'data', 'main'));
  return snap.exists() ? snap.data() : null;
}

/* Envoie l'état. `sentPhotos` garde l'empreinte des photos déjà envoyées pour ne renvoyer que les changements. */
export async function push(uid, state, sentPhotos) {
  const all = [...(state.students || []), ...(state.archived || [])];
  const light = JSON.parse(JSON.stringify(state));
  [...(light.students || []), ...(light.archived || [])].forEach((s) => { delete s.photo; });
  const json = JSON.stringify(light);
  if (json.length > 950000) throw new Error('trop-gros');

  const batch = fs.writeBatch(db);
  batch.set(fs.doc(db, 'users', uid, 'data', 'main'), {
    json, localSavedAt: state.localSavedAt || Date.now(), savedAt: fs.serverTimestamp(),
    students: (state.students || []).length + (state.archived || []).length, sessions: (state.sessions || []).length,
  });
  const seen = new Set();
  for (const s of all) {
    if (!s.photo) continue;
    seen.add(s.id);
    const print = s.photo.length + ':' + s.photo.slice(-40);
    if (sentPhotos[s.id] === print) continue;
    batch.set(fs.doc(db, 'users', uid, 'photos', s.id), { data: s.photo, updatedAt: fs.serverTimestamp() });
    sentPhotos[s.id] = print;
  }
  for (const id of Object.keys(sentPhotos)) {
    if (!seen.has(id)) { batch.delete(fs.doc(db, 'users', uid, 'photos', id)); delete sentPhotos[id]; }
  }
  await batch.commit();
}
