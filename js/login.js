// ============================================================
// STUDIO ALAN GARCIA
// LOGIN + PAINEL ADMINISTRATIVO + FIREBASE
// ============================================================

import {
  FIREBASE_ENABLED
} from "./firebase-config.js";

import {
  initFirebase
} from "./firebase-app.js";


import {
  loadAgenda,
  handleAppointmentSubmit,
  clearLocalAgenda
} from "./agenda.js";


// ============================================================
// VARIÁVEIS
// ============================================================

let db = null;
let auth = null;
let firebaseFns = null;




// ============================================================
// ELEMENTOS
// ============================================================

const $ = (selector) => document.querySelector(selector);

const loginView = $("#loginView");
const adminView = $("#adminView");

const loginForm = $("#loginForm");
const loginEmail = $("#loginEmail");
const loginPassword = $("#loginPassword");
const loginMessage = $("#loginMessage");

const logoutBtn = $("#logoutBtn");

const firebaseStatus = $("#firebaseStatus");


// ============================================================
// ESTADO DE AUTENTICAÇÃO
// ============================================================

async function handleAuthState(user) {

  if (!user) {

    showLogin();

    return;
  }


  try {

    const userRef =
      firebaseFns.ref(
        db,
        `usuarios/${user.uid}`
      );

    const snapshot =
      await firebaseFns.get(userRef);


    if (!snapshot.exists()) {

      console.warn(
        "Usuário autenticado, mas não encontrado em /usuarios."
      );

      await firebaseFns.signOut(auth);

      showLogin(
        "Usuário sem cadastro no sistema."
      );

      return;
    }


    const userData =
      snapshot.val();


    // -----------------------------------------
    // VERIFICA USUÁRIO ATIVO
    // -----------------------------------------

    if (userData.ativo !== true) {

      console.warn(
        "Usuário inativo."
      );

      await firebaseFns.signOut(auth);

      showLogin(
        "Este usuário está inativo."
      );

      return;
    }


    // -----------------------------------------
    // ADMINISTRADOR
    // -----------------------------------------

    if (userData.tipo === "admin") {

      updateAdminUser(
        userData,
        user
      );

      showAdmin();

      return;
    }


    // -----------------------------------------
    // ALUNO
    // -----------------------------------------

    if (userData.tipo === "aluno") {

      console.log(
        "Usuário identificado como aluno."
      );

      /*
       * A área do aluno ainda será criada.
       * Por enquanto, não liberamos o painel administrativo.
       */

      await firebaseFns.signOut(auth);

      showLogin(
        "Área do aluno ainda está em desenvolvimento."
      );

      return;
    }


    // -----------------------------------------
    // OUTROS PERFIS
    // -----------------------------------------

    console.warn(
      "Tipo de usuário não reconhecido:",
      userData.tipo
    );

    await firebaseFns.signOut(auth);

    showLogin(
      "Este tipo de usuário não possui acesso."
    );

  } catch (error) {

    console.error(
      "Erro ao verificar usuário:",
      error
    );

    showLogin(
      "Não foi possível verificar seu acesso."
    );

  }

}


// ============================================================
// MOSTRAR LOGIN
// ============================================================

function showLogin(message = "") {

  if (loginView) {
    loginView.hidden = false;
  }

  if (adminView) {
    adminView.hidden = true;
  }


  closeMobileMenu();


  if (loginMessage) {

    loginMessage.textContent = message;

  }
}


// ============================================================
// MOSTRAR PAINEL
// ============================================================

function showAdmin() {

  if (loginView) {
    loginView.hidden = true;
  }

  if (adminView) {
    adminView.hidden = false;
  }


  showSection("dashboard");

  loadAgenda();

  updateDashboard();

}


// ============================================================
// DADOS DO ADMIN
// ============================================================

function updateAdminUser(userData, firebaseUser) {

  const nameElement =
    $("#adminUserName");


  if (!nameElement) {
    return;
  }


  nameElement.textContent =
    userData.nome ||
    firebaseUser.displayName ||
    "Administrador";

}


// ============================================================
// LOGIN
// ============================================================

async function handleLogin(event) {

  event.preventDefault();


  if (!firebaseFns || !auth) {

    if (loginMessage) {

      loginMessage.textContent =
        "Firebase ainda não foi inicializado.";

    }

    return;
  }


  const email =
    loginEmail?.value.trim();

  const password =
    loginPassword?.value;


  if (!email || !password) {
    return;
  }


  if (loginMessage) {

    loginMessage.textContent =
      "Entrando...";

  }


  try {

    await firebaseFns.signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    if (loginMessage) {
      loginMessage.textContent = "";
    }


  } catch (error) {

    console.error(
      "Erro no login:",
      error
    );


    let message =
      "Não foi possível entrar.";


    switch (error.code) {

      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":

        message =
          "E-mail ou senha incorretos.";

        break;


      case "auth/too-many-requests":

        message =
          "Muitas tentativas. Aguarde alguns minutos.";

        break;


      case "auth/invalid-email":

        message =
          "Digite um e-mail válido.";

        break;


      default:

        message =
          "Erro ao entrar. Verifique sua conexão.";

        break;

    }


    if (loginMessage) {

      loginMessage.textContent =
        message;

    }

  }

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  if (!auth || !firebaseFns) {
    return;
  }


  try {

    await firebaseFns.signOut(auth);

    showLogin();

    if (loginForm) {
      loginForm.reset();
    }

  } catch (error) {

    console.error(
      "Erro ao sair:",
      error
    );

  }

}


// ============================================================
// NAVEGAÇÃO DO PAINEL
// ============================================================

function showSection(sectionName) {

  const sections =
    document.querySelectorAll(
      ".admin-section"
    );


  const navItems =
    document.querySelectorAll(
      ".admin-nav-item"
    );


  sections.forEach(section => {

    const isActive =
      section.id ===
      `section-${sectionName}`;


    section.classList.toggle(
      "active",
      isActive
    );

    section.hidden =
      !isActive;

  });


  navItems.forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.section === sectionName
    );

  });


  updateSectionHeader(
    sectionName
  );


  closeMobileMenu();


  if (sectionName === "agenda") {

    loadAgenda();

  }


  if (sectionName === "dashboard") {

    updateDashboard();

  }

}


// ============================================================
// HEADER DA SEÇÃO
// ============================================================

function updateSectionHeader(sectionName) {

  const eyebrow =
    $("#adminSectionEyebrow");

  const title =
    $("#adminSectionTitle");


  const sections = {

    dashboard: {
      eyebrow: "PAINEL",
      title: "Dashboard"
    },

    alunos: {
      eyebrow: "GESTÃO",
      title: "Alunos"
    },

    agenda: {
      eyebrow: "ORGANIZAÇÃO",
      title: "Agenda"
    },

    treinos: {
      eyebrow: "TREINAMENTO",
      title: "Treinos"
    },

    financeiro: {
      eyebrow: "CONTROLE",
      title: "Financeiro"
    },

    configuracoes: {
      eyebrow: "SISTEMA",
      title: "Configurações"
    }

  };


  const data =
    sections[sectionName] ||
    sections.dashboard;


  if (eyebrow) {
    eyebrow.textContent =
      data.eyebrow;
  }


  if (title) {
    title.textContent =
      data.title;
  }

}


// ============================================================
// DASHBOARD
// ============================================================

async function updateDashboard() {

  let studentsCount = 0;


  // -----------------------------------------
  // ALUNOS
  // -----------------------------------------

  if (
    FIREBASE_ENABLED &&
    db &&
    firebaseFns &&
    auth?.currentUser
  ) {

    try {

      const studentsRef =
        firebaseFns.ref(
          db,
          "alunos"
        );


      const snapshot =
        await firebaseFns.get(
          studentsRef
        );


      if (snapshot.exists()) {

        const students =
          snapshot.val();


        studentsCount =
          Object.values(students)
            .filter(
              student =>
                student &&
                student.status !== "inativo"
            )
            .length;

      }

    } catch (error) {

      console.error(
        "Erro ao carregar alunos:",
        error
      );

    }

  }


  const studentsElement =
    $("#dashboardStudents");


  if (studentsElement) {

    studentsElement.textContent =
      studentsCount;

  }


}

// ============================================================
// MENU MOBILE
// ============================================================

function openMobileMenu() {

  const sidebar =
    $(".admin-sidebar");

  const overlay =
    $("#adminOverlay");


  if (sidebar) {

    sidebar.classList.add(
      "mobile-open"
    );

  }


  if (overlay) {

    overlay.classList.add(
      "active"
    );

  }

}


function closeMobileMenu() {

  const sidebar =
    $(".admin-sidebar");

  const overlay =
    $("#adminOverlay");


  if (sidebar) {

    sidebar.classList.remove(
      "mobile-open"
    );

  }


  if (overlay) {

    overlay.classList.remove(
      "active"
    );

  }

}


function toggleMobileMenu() {

  const sidebar =
    $(".admin-sidebar");


  if (
    sidebar &&
    sidebar.classList.contains(
      "mobile-open"
    )
  ) {

    closeMobileMenu();

  } else {

    openMobileMenu();

  }

}


// ============================================================
// UTILITÁRIOS
// ============================================================

function formatDate(dateString) {

  if (!dateString) {
    return "";
  }


  const parts =
    dateString.split("-");


  if (parts.length !== 3) {
    return dateString;
  }


  return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ============================================================
// EVENTOS
// ============================================================

function initEvents() {


  // -----------------------------------------
  // LOGIN
  // -----------------------------------------

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      handleLogin
    );

  }


  // -----------------------------------------
  // LOGOUT
  // -----------------------------------------

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      logout
    );

  }


  // -----------------------------------------
  // MENU LATERAL
  // -----------------------------------------

  document
    .querySelectorAll(
      ".admin-nav-item"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showSection(
            button.dataset.section
          );

        }
      );

    });


  // -----------------------------------------
  // ACESSO RÁPIDO
  // -----------------------------------------

  document
    .querySelectorAll(
      ".admin-quick-action"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const section =
            button.dataset.section;


          showSection(section);

        }
      );

    });





  // -----------------------------------------
  // AGENDA
  // -----------------------------------------

  const appointmentForm =
    $("#appointmentForm");


  if (appointmentForm) {

    appointmentForm.addEventListener(
      "submit",
      handleAppointmentSubmit
    );

  }


  // -----------------------------------------
  // LIMPAR AGENDA
  // -----------------------------------------

  const clearDemoBtn =
    $("#clearDemoBtn");


  if (clearDemoBtn) {

    clearDemoBtn.addEventListener(
      "click",
      clearLocalAgenda
    );

  }


  // -----------------------------------------
  // MENU MOBILE
  // -----------------------------------------

  const menuToggle =
    $("#adminMenuToggle");


  const overlay =
    $("#adminOverlay");


  if (menuToggle) {

    menuToggle.addEventListener(
      "click",
      toggleMobileMenu
    );

  }


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeMobileMenu
    );

  }


  // Fecha o menu quando clicar em
  // qualquer item da sidebar

  document
    .querySelectorAll(
      ".admin-nav-item"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        closeMobileMenu
      );

    });

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

initEvents();

initFirebase()
  .then(firebase => {

    if (!firebase) {
      return;
    }

    auth = firebase.auth;
    db = firebase.db;
    firebaseFns = firebase.firebaseFns;

    if (firebaseStatus) {
      firebaseStatus.textContent =
        "Firebase conectado.";
    }

    firebaseFns.onAuthStateChanged(
      auth,
      handleAuthState
    );

  })
  .catch(error => {

    console.error(
      "Firebase não pôde ser inicializado:",
      error
    );

    if (firebaseStatus) {
      firebaseStatus.textContent =
        "Erro ao conectar ao Firebase.";
    }

  });