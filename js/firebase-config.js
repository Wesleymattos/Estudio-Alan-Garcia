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
  apiKey: "AIzaSyDi8qIzRnCBji3riAxJL4fkl55A3cCVRK4",
  authDomain: "studio-alan-garcia.firebaseapp.com",
  databaseURL: "https://studio-alan-garcia-default-rtdb.firebaseio.com",
  projectId: "studio-alan-garcia",
  storageBucket: "studio-alan-garcia.firebasestorage.app",
  messagingSenderId: "653401583603",
  appId: "1:653401583603:web:5ab11837b6b4cf11c42c86",
  measurementId: "G-29R4Z1N8D5"
};

export const FIREBASE_ENABLED = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId
);
