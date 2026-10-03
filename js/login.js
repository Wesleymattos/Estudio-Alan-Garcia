// ============================================================
// STUDIO ALAN GARCIA
// LOGIN + PAINEL ADMINISTRATIVO + FIREBASE
// ============================================================

import {
  firebaseConfig,
  FIREBASE_ENABLED
} from "./firebase-config.js";


// ============================================================
// VARIÁVEIS
// ============================================================

let db = null;
let auth = null;
let firebaseFns = null;

let appointments = [];

const LOCAL_KEY = "alanGarciaAgendaV1";


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
// FIREBASE
// ============================================================

async function initFirebase() {

  if (!FIREBASE_ENABLED) {

    console.warn("Firebase não está configurado.");

    if (firebaseStatus) {
      firebaseStatus.textContent =
        "Firebase não configurado.";
    }

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


    const app = firebaseApp.initializeApp(firebaseConfig);

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


    if (firebaseStatus) {

      firebaseStatus.textContent =
        "Firebase conectado.";

    }


    firebaseFns.onAuthStateChanged(
      auth,
      handleAuthState
    );


    console.log(
      "Firebase inicializado com sucesso."
    );

  } catch (error) {

    console.error(
      "Erro ao inicializar Firebase:",
      error
    );

    if (firebaseStatus) {

      firebaseStatus.textContent =
        "Erro ao conectar ao Firebase.";

    }

  }
}


// ============================================================
// ESTADO DE AUTENTICAÇÃO
// ============================================================

async function handleAuthState(user) {

  if (!user) {

    showLogin();

    return;
  }


  try {

    const userRef = firebaseFns.ref(
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
        "Usuário sem cadastro administrativo."
      );

      return;
    }


    const userData = snapshot.val();


    if (
      userData.ativo !== true ||
      userData.tipo !== "admin"
    ) {

      console.warn(
        "Usuário sem permissão de administrador."
      );

      await firebaseFns.signOut(auth);

      showLogin(
        "Este usuário não possui permissão de administrador."
      );

      return;
    }


    updateAdminUser(
      userData,
      user
    );


    showAdmin();


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
// AGENDA
// ============================================================

async function loadAgenda() {

  if (
    FIREBASE_ENABLED &&
    db &&
    firebaseFns &&
    auth?.currentUser
  ) {

    try {

      const agendaRef =
        firebaseFns.ref(
          db,
          "agenda"
        );


      const snapshot =
        await firebaseFns.get(
          agendaRef
        );


      if (snapshot.exists()) {

        const data =
          snapshot.val();


        appointments =
          Object.entries(data)
            .map(([id, item]) => ({
              id,
              ...item
            }));

      } else {

        appointments = [];

      }


      renderAppointments();

      return;

    } catch (error) {

      console.error(
        "Erro ao carregar agenda:",
        error
      );

    }

  }


  // Fallback local

  try {

    appointments =
      JSON.parse(
        localStorage.getItem(
          LOCAL_KEY
        ) || "[]"
      );

  } catch {

    appointments = [];

  }


  renderAppointments();

}


// ============================================================
// SALVAR AGENDAMENTO
// ============================================================

async function addAppointment(appointment) {

  if (
    FIREBASE_ENABLED &&
    db &&
    firebaseFns &&
    auth?.currentUser
  ) {

    try {

      const agendaRef =
        firebaseFns.ref(
          db,
          "agenda"
        );


      const newRef =
        firebaseFns.push(
          agendaRef
        );


      await firebaseFns.set(
        newRef,
        appointment
      );


      appointment.id =
        newRef.key;


      appointments.push(
        appointment
      );


      renderAppointments();

      return;

    } catch (error) {

      console.error(
        "Erro ao salvar agendamento:",
        error
      );

    }

  }


  // Fallback local

  appointment.id =
    Date.now().toString();


  appointments.push(
    appointment
  );


  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(appointments)
  );


  renderAppointments();

}


// ============================================================
// EXCLUIR AGENDAMENTO
// ============================================================

async function deleteAppointment(id) {

  if (
    FIREBASE_ENABLED &&
    db &&
    firebaseFns &&
    auth?.currentUser
  ) {

    try {

      await firebaseFns.remove(
        firebaseFns.ref(
          db,
          `agenda/${id}`
        )
      );

    } catch (error) {

      console.error(
        "Erro ao excluir agendamento:",
        error
      );

    }

  }


  appointments =
    appointments.filter(
      item => item.id !== id
    );


  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(appointments)
  );


  renderAppointments();

  updateDashboard();

}


// ============================================================
// RENDER AGENDA
// ============================================================

function renderAppointments() {

  const list =
    $("#appointmentList");


  if (!list) {
    return;
  }


  if (!appointments.length) {

    list.innerHTML = `
      <div class="admin-empty-state">
        <i class="fa-solid fa-calendar-xmark"></i>

        <h3>
          Nenhum horário encontrado
        </h3>

        <p>
          Os próximos agendamentos aparecerão aqui.
        </p>
      </div>
    `;

    return;
  }


  const sorted =
    [...appointments].sort(
      (a, b) =>
        `${a.date} ${a.time}`.localeCompare(
          `${b.date} ${b.time}`
        )
    );


  list.innerHTML =
    sorted.map(item => `

      <article class="appointment-item">

        <div class="appointment-main">

          <strong>
            ${escapeHtml(item.clientName)}
          </strong>

          <span>
            ${formatDate(item.date)}
            às
            ${escapeHtml(item.time)}
          </span>

          <small>
            ${escapeHtml(item.service || "")}
          </small>

          ${
            item.notes
              ? `<small>${escapeHtml(item.notes)}</small>`
              : ""
          }

        </div>

        <button
          class="appointment-delete"
          type="button"
          data-delete-appointment="${item.id}"
          aria-label="Excluir agendamento"
        >
          <i class="fa-solid fa-trash"></i>
        </button>

      </article>

    `).join("");


  list
    .querySelectorAll(
      "[data-delete-appointment]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.deleteAppointment;

          deleteAppointment(id);

        }
      );

    });

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


  // -----------------------------------------
  // AGENDA
  // -----------------------------------------

  const today =
    new Date();


  const todayString =
    today.toISOString()
      .split("T")[0];


  const todayAppointments =
    appointments.filter(
      item =>
        item.date === todayString
    );


  const todayElement =
    $("#dashboardToday");


  if (todayElement) {

    todayElement.textContent =
      todayAppointments.length;

  }


  // -----------------------------------------
  // PRÓXIMO HORÁRIO
  // -----------------------------------------

  const now =
    new Date();


  const futureAppointments =
    appointments
      .filter(item => {

        const dateTime =
          new Date(
            `${item.date}T${item.time}`
          );

        return dateTime >= now;

      })
      .sort((a, b) => {

        const dateA =
          new Date(
            `${a.date}T${a.time}`
          );

        const dateB =
          new Date(
            `${b.date}T${b.time}`
          );

        return dateA - dateB;

      });


  const nextElement =
    $("#dashboardNext");


  if (nextElement) {

    if (futureAppointments.length) {

      nextElement.textContent =
        futureAppointments[0].time;

    } else {

      nextElement.textContent =
        "—";

    }

  }

}


// ============================================================
// NOVO ALUNO
// ============================================================

function handleNewStudent() {

  alert(
    "O cadastro de alunos será implementado na próxima etapa."
  );

}


// ============================================================
// FORMULÁRIO DE AGENDAMENTO
// ============================================================

async function handleAppointmentSubmit(event) {

  event.preventDefault();


  const clientName =
    $("#clientName")?.value.trim();

  const date =
    $("#appointmentDate")?.value;

  const time =
    $("#appointmentTime")?.value;

  const service =
    $("#appointmentService")?.value;

  const notes =
    $("#appointmentNotes")?.value.trim();


  if (!clientName || !date || !time) {

    return;

  }


  const appointment = {

    clientName,
    date,
    time,
    service,
    notes,

    createdAt:
      new Date().toISOString()

  };


  await addAppointment(
    appointment
  );


  event.target.reset();


  updateDashboard();

}


// ============================================================
// LIMPAR AGENDA LOCAL
// ============================================================

function clearLocalAgenda() {

  localStorage.removeItem(
    LOCAL_KEY
  );


  if (
    !FIREBASE_ENABLED ||
    !auth?.currentUser
  ) {

    appointments = [];

    renderAppointments();

    updateDashboard();

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
  // NOVO ALUNO
  // -----------------------------------------

  const newStudentBtn =
    $("#newStudentBtn");


  if (newStudentBtn) {

    newStudentBtn.addEventListener(
      "click",
      handleNewStudent
    );

  }


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
  .catch(error => {

    console.error(
      "Firebase não pôde ser inicializado:",
      error
    );

  });