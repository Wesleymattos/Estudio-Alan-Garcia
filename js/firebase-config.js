// ============================================================
// STUDIO ALAN GARCIA - CONFIGURAÇÃO FIREBASE
// ============================================================
// 1. Crie um projeto no Firebase.
// 2. Ative Realtime Database.
// 3. Copie as credenciais do projeto.
// 4. Preencha abaixo.
// 5. Enquanto os campos estiverem vazios, a agenda funciona
//    em modo local (localStorage) para testes.
//
// IMPORTANTE: este arquivo é o único que você deverá editar
// para conectar o projeto ao Firebase.

export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export const FIREBASE_ENABLED = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId
);
