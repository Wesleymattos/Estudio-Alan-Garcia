import {
  firebaseConfig,
  FIREBASE_ENABLED
} from "./firebase-config.js";

let app = null;
let auth = null;
let db = null;
let firebaseFns = null;
let storage = null;


export async function initFirebase() {

  if (!FIREBASE_ENABLED) {
    console.warn("Firebase não está configurado.");
    return null;
  }

  if (app && auth && db && storage && firebaseFns) {
  return {
    app,
    auth,
    db,
    storage,
    firebaseFns
  };
}

  const [
    firebaseApp,
    firebaseAuth,
    firebaseDatabase,
    firebaseStorage
  ] = await Promise.all([

    import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
    ),

    import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
    ),

    import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js"
    ),
    import(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js"
    )

  ]);

  app = firebaseApp.initializeApp(firebaseConfig);

  auth = firebaseAuth.getAuth(app);

  db = firebaseDatabase.getDatabase(app);

  storage = firebaseStorage.getStorage(app);

 firebaseFns = {
  signInWithEmailAndPassword: firebaseAuth.signInWithEmailAndPassword,
  signOut: firebaseAuth.signOut,
  onAuthStateChanged: firebaseAuth.onAuthStateChanged,

    EmailAuthProvider: firebaseAuth.EmailAuthProvider,
  reauthenticateWithCredential: firebaseAuth.reauthenticateWithCredential,
  updatePassword: firebaseAuth.updatePassword,


ref: firebaseDatabase.ref,
get: firebaseDatabase.get,
set: firebaseDatabase.set,
push: firebaseDatabase.push,
remove: firebaseDatabase.remove,
update: firebaseDatabase.update,
getStorage: firebaseStorage.getStorage,
storageRef: firebaseStorage.ref,
uploadBytes: firebaseStorage.uploadBytes,
getDownloadURL: firebaseStorage.getDownloadURL,
deleteObject: firebaseStorage.deleteObject

};
  return {
  app,
  auth,
  db,
  storage,
  firebaseFns
};
}