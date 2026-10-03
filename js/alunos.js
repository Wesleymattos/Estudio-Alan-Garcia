// ============================================================
// STUDIO ALAN GARCIA
// GESTÃO DE ALUNOS
// ============================================================

import {
  firebaseConfig,
  FIREBASE_ENABLED
} from "./firebase-config.js";


// ============================================================
// FIREBASE
// ============================================================

let db = null;
let auth = null;
let firebaseFns = null;


// ============================================================
// UTILITÁRIO
// ============================================================

const $ = (selector) =>
  document.querySelector(selector);


// ============================================================
// INICIALIZAR FIREBASE
// ============================================================

async function initFirebase() {

  if (!FIREBASE_ENABLED) {
    console.warn("Firebase não está configurado.");
    return;
  }

  try {

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


    const app =
      firebaseApp.getApps().length
        ? firebaseApp.getApp()
        : firebaseApp.initializeApp(firebaseConfig);


    auth =
      firebaseAuth.getAuth(app);

    db =
      firebaseDatabase.getDatabase(app);


    firebaseFns = {
      ref: firebaseDatabase.ref,
      set: firebaseDatabase.set
    };


    console.log(
      "Módulo de alunos conectado ao Firebase."
    );


  } catch (error) {

    console.error(
      "Erro ao inicializar Firebase no módulo de alunos:",
      error
    );

  }

}


// ============================================================
// MODAL
// ============================================================

function openStudentModal() {

  const modal =
    $("#studentModal");

  if (!modal) {
    return;
  }


  modal.hidden = false;

  document.body.style.overflow = "hidden";


  clearStudentMessage();

}


function closeStudentModal() {

  const modal =
    $("#studentModal");

  if (!modal) {
    return;
  }


  modal.hidden = true;

  document.body.style.overflow = "";

}


// ============================================================
// MENSAGENS
// ============================================================

function clearStudentMessage() {

  const element =
    $("#studentFormMessage");

  if (!element) {
    return;
  }


  element.textContent = "";

  element.className =
    "form-message";

}


function setStudentMessage(
  message,
  type = ""
) {

  const element =
    $("#studentFormMessage");

  if (!element) {
    return;
  }


  element.textContent =
    message;

  element.className =
    `form-message ${type}`;

}


// ============================================================
// CALCULAR IDADE
// ============================================================

function calculateStudentAge() {

  const birthDate =
    $("#studentBirthDate")?.value;

  const ageInput =
    $("#studentAge");


  if (!birthDate || !ageInput) {
    return;
  }


  const birth =
    new Date(
      `${birthDate}T00:00:00`
    );

  const today =
    new Date();


  let age =
    today.getFullYear() -
    birth.getFullYear();


  const monthDifference =
    today.getMonth() -
    birth.getMonth();


  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birth.getDate()
    )
  ) {

    age--;

  }


  ageInput.value =
    age >= 0 ? age : "";

}


// ============================================================
// CADASTRAR ALUNO
// ============================================================

async function createStudent(event) {

  event.preventDefault();


  if (!firebaseFns || !db || !auth) {

    setStudentMessage(
      "Firebase ainda não está disponível.",
      "error"
    );

    return;
  }


  /*
   * O usuário atual precisa ser o administrador.
   */

  if (!auth.currentUser) {

    setStudentMessage(
      "Sua sessão expirou. Faça login novamente.",
      "error"
    );

    return;
  }


  const name =
    $("#studentName")?.value.trim();

  const email =
    $("#studentEmail")?.value.trim();

  const whatsapp =
    $("#studentWhatsapp")?.value.trim();

  const cpf =
    $("#studentCpf")?.value.trim();

  const birthDate =
    $("#studentBirthDate")?.value;

  const age =
    Number(
      $("#studentAge")?.value || 0
    );

  const street =
    $("#studentStreet")?.value.trim();

  const number =
    $("#studentNumber")?.value.trim();

  const neighborhood =
    $("#studentNeighborhood")?.value.trim();

  const city =
    $("#studentCity")?.value.trim();

  const state =
    $("#studentState")?.value.trim().toUpperCase();

  const initialWeight =
    Number(
      $("#studentInitialWeight")?.value || 0
    );

  const goal =
    $("#studentGoal")?.value;

  const observation =
    $("#studentObservation")?.value.trim();

  const password =
    $("#studentPassword")?.value;

  const passwordConfirm =
    $("#studentPasswordConfirm")?.value;


  // -----------------------------------------
  // VALIDAÇÕES
  // -----------------------------------------

  if (
    !name ||
    !email ||
    !birthDate
  ) {

    setStudentMessage(
      "Preencha os campos obrigatórios.",
      "error"
    );

    return;
  }


  if (password.length < 6) {

    setStudentMessage(
      "A senha precisa ter pelo menos 6 caracteres.",
      "error"
    );

    return;
  }


  if (password !== passwordConfirm) {

    setStudentMessage(
      "As senhas não são iguais.",
      "error"
    );

    return;
  }


  const saveButton =
    $("#saveStudentBtn");


  if (saveButton) {

    saveButton.disabled = true;

    saveButton.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin"></i>
      Cadastrando...
    `;

  }


  let secondaryApp = null;
  let secondaryAuth = null;
  let createdUser = null;


  try {

    /*
     * --------------------------------------------------------
     * IMPORTANTE
     *
     * Usamos uma segunda instância do Firebase.
     *
     * Assim criamos o aluno sem deslogar o administrador.
     * --------------------------------------------------------
     */

    const firebaseApp =
      await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
      );

    const firebaseAuth =
      await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
      );


    secondaryApp =
      firebaseApp.initializeApp(
        firebaseConfig,
        `student-${Date.now()}`
      );


    secondaryAuth =
      firebaseAuth.getAuth(
        secondaryApp
      );


    setStudentMessage(
      "Criando acesso do aluno..."
    );


    const credential =
      await firebaseAuth.createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );


    createdUser =
      credential.user;


    const uid =
      createdUser.uid;


    const now =
      new Date().toISOString();


    // -----------------------------------------
    // DADOS DO ALUNO
    // -----------------------------------------

    const studentData = {

      nomeCompleto: name,

      email,

      whatsapp,

      cpf,

      endereco: {

        rua: street,

        numero: number,

        bairro: neighborhood,

        cidade: city,

        estado: state

      },

      idade: age,

      dataNascimento: birthDate,

      objetivo: goal,

      peso: {

        pesoInicial: initialWeight,

        dataPesoInicial:
          initialWeight > 0
            ? now
            : "",

        pesoAtual: initialWeight,

        dataPesoAtual:
          initialWeight > 0
            ? now
            : ""

      },

      observacao: observation,

      status: "ativo",

      dataCadastro: now

    };


    // -----------------------------------------
    // USUÁRIO DO SISTEMA
    // -----------------------------------------

    const userData = {

      nome: name,

      email,

      tipo: "aluno",

      ativo: true,

      dataCadastro: now

    };


    setStudentMessage(
      "Salvando dados do aluno..."
    );


    /*
     * --------------------------------------------------------
     * IMPORTANTE
     *
     * Aqui usamos o AUTH PRINCIPAL.
     *
     * Portanto o administrador continua logado.
     * --------------------------------------------------------
     */

    await firebaseFns.set(
      firebaseFns.ref(
        db,
        `alunos/${uid}`
      ),
      studentData
    );


    await firebaseFns.set(
      firebaseFns.ref(
        db,
        `usuarios/${uid}`
      ),
      userData
    );


    setStudentMessage(
      "Aluno cadastrado com sucesso!",
      "success"
    );

    window.dispatchEvent(
  new CustomEvent("studentCreated")
);


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1000
        )
    );


    $("#studentForm")?.reset();

    closeStudentModal();


    alert(
      `Aluno ${name} cadastrado com sucesso!`
    );


  } catch (error) {

    console.error(
      "Erro ao cadastrar aluno:",
      error
    );


    /*
     * Se criou o usuário no Authentication,
     * mas falhou no banco, tentamos desfazer.
     */

    if (createdUser) {

      try {

        await firebaseAuth.deleteUser(
          createdUser
        );

      } catch (rollbackError) {

        console.error(
          "Erro ao desfazer usuário:",
          rollbackError
        );

      }

    }


    let message =
      "Não foi possível cadastrar o aluno.";


    switch (error.code) {

      case "auth/email-already-in-use":

        message =
          "Este e-mail já está cadastrado.";

        break;


      case "auth/invalid-email":

        message =
          "O e-mail informado é inválido.";

        break;


      case "auth/weak-password":

        message =
          "A senha informada é muito fraca.";

        break;


      case "PERMISSION_DENIED":

        message =
          "O Firebase recusou a gravação.";

        break;

    }


    setStudentMessage(
      message,
      "error"
    );


  } finally {

    if (secondaryAuth) {

      try {

        await firebaseAuth.signOut(
          secondaryAuth
        );

      } catch {}

    }


    if (secondaryApp) {

      try {

        await firebaseApp.deleteApp(
          secondaryApp
        );

      } catch {}

    }


    if (saveButton) {

      saveButton.disabled = false;

      saveButton.innerHTML = `
        <i class="fa-solid fa-user-plus"></i>
        Cadastrar aluno
      `;

    }

  }

}


// ============================================================
// EVENTOS
// ============================================================

function initStudentEvents() {

  const newStudentBtn =
    $("#newStudentBtn");

  const studentForm =
    $("#studentForm");

  const closeButton =
    $("#closeStudentModal");

  const cancelButton =
    $("#cancelStudentBtn");

  const overlay =
    $(".student-modal-overlay");

  const birthDate =
    $("#studentBirthDate");


  // -----------------------------------------
  // NOVO ALUNO
  // -----------------------------------------

  if (newStudentBtn) {

    newStudentBtn.addEventListener(
      "click",
      openStudentModal
    );

  }


  // -----------------------------------------
  // FORMULÁRIO
  // -----------------------------------------

  if (studentForm) {

    studentForm.addEventListener(
      "submit",
      createStudent
    );

  }


  // -----------------------------------------
  // FECHAR
  // -----------------------------------------

  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeStudentModal
    );

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      "click",
      closeStudentModal
    );

  }


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeStudentModal
    );

  }


  // -----------------------------------------
  // IDADE
  // -----------------------------------------

  if (birthDate) {

    birthDate.addEventListener(
      "change",
      calculateStudentAge
    );

  }

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  initStudentEvents();

  initFirebase();

});