// ============================================================
// STUDIO ALAN GARCIA
// ÁREA DO ALUNO
// ============================================================

import { FIREBASE_ENABLED } from "./firebase-config.js";
import { initFirebase } from "./firebase-app.js";


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
// MENSAGEM DE ACESSO
// ============================================================

function showAccessMessage(message) {

  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#090a0c;
      color:#fff;
      font-family:Arial,sans-serif;
      padding:20px;
      box-sizing:border-box;
      text-align:center;
    ">

      <div>

        <div style="
          font-size:42px;
          color:#ff6a00;
          margin-bottom:20px;
        ">
          <i class="fa-solid fa-lock"></i>
        </div>

        <h2 style="margin-bottom:10px;">
          Acesso não autorizado
        </h2>

        <p style="
          color:rgba(255,255,255,.6);
          margin-bottom:25px;
        ">
          ${message}
        </p>

        <a
          href="login.html"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#ff6a00;
            color:#fff;
            text-decoration:none;
            border-radius:8px;
            font-weight:600;
          "
        >
          Voltar para o login
        </a>

      </div>

    </div>
  `;

}


// ============================================================
// FORMATAR DATA
// ============================================================

function formatBirthDate(dateString) {

  if (!dateString) {
    return "—";
  }

  const parts =
    String(dateString).split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// ============================================================
// FORMATAR PESO
// ============================================================

function formatWeight(weight) {

  if (
    weight === null ||
    weight === undefined ||
    weight === "" ||
    Number(weight) <= 0
  ) {
    return "—";
  }

  return `${Number(weight).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }
  )} kg`;

}


// ============================================================
// PREENCHER DADOS DO ALUNO
// ============================================================

function renderStudent(studentData) {

  const name =
    studentData.nomeCompleto || "Aluno";

  const email =
    studentData.email || "—";

  const whatsapp =
    studentData.whatsapp || "—";

  const birthDate =
    formatBirthDate(
      studentData.dataNascimento
    );

  const goal =
    studentData.objetivo || "—";

  const initialWeight =
    formatWeight(
      studentData.peso?.pesoInicial
    );

  const currentWeight =
    formatWeight(
      studentData.peso?.pesoAtual
    );

  const status =
    studentData.status === "ativo"
      ? "Ativo"
      : studentData.status || "—";


  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  const headerName =
    $("#studentHeaderName");

  if (headerName) {
    headerName.textContent = name;
  }


  // ----------------------------------------------------------
  // BOAS-VINDAS
  // ----------------------------------------------------------

  const studentName =
    $("#studentName");

  if (studentName) {
    studentName.textContent = name;
  }


  // ----------------------------------------------------------
  // RESUMO
  // ----------------------------------------------------------

  const summaryWeight =
    $("#summaryCurrentWeight");

  if (summaryWeight) {
    summaryWeight.textContent =
      currentWeight;
  }


  const summaryGoal =
    $("#summaryGoal");

  if (summaryGoal) {
    summaryGoal.textContent =
      goal;
  }


  // ----------------------------------------------------------
  // DADOS PESSOAIS
  // ----------------------------------------------------------

  const dataName =
    $("#dataStudentName");

  if (dataName) {
    dataName.textContent =
      name;
  }


  const dataEmail =
    $("#dataStudentEmail");

  if (dataEmail) {
    dataEmail.textContent =
      email;
  }


  const dataWhatsapp =
    $("#dataStudentWhatsapp");

  if (dataWhatsapp) {
    dataWhatsapp.textContent =
      whatsapp;
  }


  const dataBirthDate =
    $("#dataStudentBirthDate");

  if (dataBirthDate) {
    dataBirthDate.textContent =
      birthDate;
  }


  // ----------------------------------------------------------
  // OBJETIVO / EVOLUÇÃO
  // ----------------------------------------------------------

  const dataGoal =
    $("#dataStudentGoal");

  if (dataGoal) {
    dataGoal.textContent =
      goal;
  }


  const dataInitialWeight =
    $("#dataStudentInitialWeight");

  if (dataInitialWeight) {
    dataInitialWeight.textContent =
      initialWeight;
  }


  const dataCurrentWeight =
    $("#dataStudentCurrentWeight");

  if (dataCurrentWeight) {
    dataCurrentWeight.textContent =
      currentWeight;
  }


  const dataStatus =
    $("#dataStudentStatus");

  if (dataStatus) {
    dataStatus.textContent =
      status;
  }

}


// ============================================================
// CARREGAR AGENDA DO ALUNO
// ============================================================

async function loadStudentAgenda(uid) {

  const list = $("#studentAgendaList");

  if (!list) return;

  try {

    const agendaRef =
      firebaseFns.ref(
        db,
        `agendaAluno/${uid}`
      );

    const snapshot =
      await firebaseFns.get(
        agendaRef
      );

    if (!snapshot.exists()) {

      list.innerHTML = `
        <div class="student-empty-state">

          <i class="fa-solid fa-calendar-xmark"></i>

          <h3>
            Nenhum treino agendado
          </h3>

          <p>
            Seus próximos horários aparecerão aqui.
          </p>

        </div>
      `;

      updateAgendaSummary([]);

      return;
    }

    const data = snapshot.val();

    const appointments =
      Object.entries(data)
        .map(([id, item]) => ({
          id,
          ...item
        }))
        .sort((a, b) =>
          `${a.date} ${a.time}`.localeCompare(
            `${b.date} ${b.time}`
          )
        );


    renderStudentAgenda(
      appointments
    );

    updateAgendaSummary(
      appointments
    );

  } catch (error) {

    console.error(
      "Erro ao carregar agenda do aluno:",
      error
    );

    list.innerHTML = `
      <div class="student-empty-state">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <h3>
          Não foi possível carregar a agenda
        </h3>

        <p>
          Tente atualizar a página.
        </p>

      </div>
    `;

  }

}

// ============================================================
// RENDERIZAR AGENDA DO ALUNO
// ============================================================

function renderStudentAgenda(appointments) {

  const list =
    $("#studentAgendaList");

  if (!list) return;

  list.innerHTML =
    appointments.map(item => `

      <article class="student-agenda-item">

        <div class="student-agenda-date">

          <strong>
            ${formatStudentDate(item.date)}
          </strong>

          <span>
            ${escapeHtml(item.time || "")}
          </span>

        </div>

        <div class="student-agenda-info">

          <strong>
            ${escapeHtml(
              item.service || "Treino"
            )}
          </strong>

          ${
            item.notes
              ? `
                <span>
                  ${escapeHtml(item.notes)}
                </span>
              `
              : ""
          }

        </div>

      </article>

    `).join("");

}


// ============================================================
// RESUMO DA AGENDA
// ============================================================

function updateAgendaSummary(appointments) {

  const count =
    $("#summaryTrainingCount");

  if (count) {

    count.textContent =
      appointments.length;

  }


  const next =
    appointments[0];

  const title =
    $("#nextTrainingTitle");

  const description =
    $("#nextTrainingDescription");

  const date =
    $("#nextTrainingDate");

  const time =
    $("#nextTrainingTime");

  const summaryNext =
    $("#summaryNextTraining");


  if (!next) {

    if (title)
      title.textContent =
        "Nenhum treino agendado";

    if (description)
      description.textContent =
        "Quando um novo horário for marcado, ele aparecerá aqui.";

    if (date)
      date.textContent = "—";

    if (time)
      time.textContent = "—";

    if (summaryNext)
      summaryNext.textContent = "—";

    return;

  }


  if (title)
    title.textContent =
      next.service || "Treino personalizado";


  if (description)
    description.textContent =
      next.notes ||
      "Seu próximo horário está confirmado.";


  if (date)
    date.textContent =
      formatStudentDate(next.date);


  if (time)
    time.textContent =
      next.time || "—";


  if (summaryNext)
    summaryNext.textContent =
      formatStudentDate(next.date);

}


// ============================================================
// LOGOUT
// ============================================================

async function logoutStudent() {

  if (!auth || !firebaseFns) {
    return;
  }

  try {

    await firebaseFns.signOut(auth);

    window.location.href =
      "login.html";

  } catch (error) {

    console.error(
      "Erro ao sair:",
      error
    );

    alert(
      "Não foi possível sair. Tente novamente."
    );

  }

}


// ============================================================
// VERIFICAR USUÁRIO
// ============================================================

async function handleStudentAuth(user) {

  // ----------------------------------------------------------
  // NÃO ESTÁ LOGADO
  // ----------------------------------------------------------

  if (!user) {

    window.location.href =
      "login.html";

    return;

  }


  try {

    // --------------------------------------------------------
    // BUSCAR USUÁRIO DO SISTEMA
    // --------------------------------------------------------

    const userRef =
      firebaseFns.ref(
        db,
        `usuarios/${user.uid}`
      );

    const userSnapshot =
      await firebaseFns.get(
        userRef
      );


    if (!userSnapshot.exists()) {

      await firebaseFns.signOut(
        auth
      );

      showAccessMessage(
        "Seu usuário não está cadastrado no sistema."
      );

      return;

    }


    const userData =
      userSnapshot.val();


    // --------------------------------------------------------
    // VERIFICAR ATIVO
    // --------------------------------------------------------

    if (userData.ativo !== true) {

      await firebaseFns.signOut(
        auth
      );

      showAccessMessage(
        "Seu acesso está desativado."
      );

      return;

    }


    // --------------------------------------------------------
    // VERIFICAR TIPO
    // --------------------------------------------------------

    if (userData.tipo !== "aluno") {

      console.warn(
        "Usuário tentou acessar a área do aluno:",
        userData.tipo
      );

      await firebaseFns.signOut(
        auth
      );

      showAccessMessage(
        "Esta área é exclusiva para alunos."
      );

      return;

    }


    // --------------------------------------------------------
    // BUSCAR DADOS DO ALUNO
    // --------------------------------------------------------

    const studentRef =
      firebaseFns.ref(
        db,
        `alunos/${user.uid}`
      );

    const studentSnapshot =
      await firebaseFns.get(
        studentRef
      );


    if (!studentSnapshot.exists()) {

      showAccessMessage(
        "Os dados do seu cadastro ainda não foram encontrados."
      );

      return;

    }


   const studentData =
  studentSnapshot.val();


// --------------------------------------------------------
// RENDERIZAR
// --------------------------------------------------------

renderStudent(
  studentData
);


// --------------------------------------------------------
// CARREGAR AGENDA
// --------------------------------------------------------

await loadStudentAgenda(
  user.uid
);


console.log(
  "Área do aluno carregada:",
  studentData.nomeCompleto
);

  } catch (error) {

    console.error(
      "Erro ao carregar área do aluno:",
      error
    );

    showAccessMessage(
      "Não foi possível carregar seus dados."
    );

  }

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function initStudentArea() {

  if (!FIREBASE_ENABLED) {

    showAccessMessage(
      "O Firebase não está configurado."
    );

    return;

  }


  try {

    const firebase =
      await initFirebase();


    if (!firebase) {

      showAccessMessage(
        "Não foi possível conectar ao Firebase."
      );

      return;

    }


    auth =
      firebase.auth;

    db =
      firebase.db;

    firebaseFns =
      firebase.firebaseFns;


    // --------------------------------------------------------
    // BOTÃO SAIR
    // --------------------------------------------------------

    const logoutButton =
      $("#studentLogoutBtn");

    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        logoutStudent
      );

    }


    // --------------------------------------------------------
    // OBSERVAR LOGIN
    // --------------------------------------------------------

    firebaseFns.onAuthStateChanged(
      auth,
      handleStudentAuth
    );


  } catch (error) {

    console.error(
      "Erro ao inicializar área do aluno:",
      error
    );

    showAccessMessage(
      "Erro ao inicializar o sistema."
    );

  }

}


// ============================================================
// UTILITÁRIOS DA AGENDA
// ============================================================

function formatStudentDate(dateString) {

  if (!dateString) return "—";

  const parts =
    String(dateString).split("-");

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
// START
// ============================================================

initStudentArea();