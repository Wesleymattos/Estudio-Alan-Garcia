import {
  firebaseConfig,
  FIREBASE_ENABLED
} from "./firebase-config.js";

let app = null;
let auth = null;
let db = null;
let firebaseFns = null;

export async function initFirebase() {

  if (!FIREBASE_ENABLED) {
    console.warn("Firebase não está configurado.");
    return null;
  }

  if (app && auth && db && firebaseFns) {
    return {
      app,
      auth,
      db,
      firebaseFns
    };
  }

  const [
    firebaseApp,
    firebaseAuth,
    firebaseDatabase
  ] = await Promise.all([

    import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
    ),

    import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
    ),

    import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"
    )

  ]);

  app = firebaseApp.initializeApp(firebaseConfig);

  auth = firebaseAuth.getAuth(app);

  db = firebaseDatabase.getDatabase(app);

  firebaseFns = {
    signInWithEmailAndPassword:
      firebaseAuth.signInWithEmailAndPassword,

    signOut:
      firebaseAuth.signOut,

    onAuthStateChanged:
      firebaseAuth.onAuthStateChanged,

    ref:
      firebaseDatabase.ref,

    get:
      firebaseDatabase.get,

    set:
      firebaseDatabase.set,

    push:
      firebaseDatabase.push,

    remove:
      firebaseDatabase.remove
  };

  return {
    app,
    auth,
    db,
    firebaseFns
  };
}