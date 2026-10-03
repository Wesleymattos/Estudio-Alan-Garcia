// ============================================================
// STUDIO ALAN GARCIA
// LISTAGEM DE ALUNOS
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

let firebaseRef = null;
let firebaseGet = null;
let firebaseOnAuthStateChanged = null;


// ============================================================
// ESTADO
// ============================================================

let students = [];


// ============================================================
// ELEMENTOS
// ============================================================

const studentList =
  document.querySelector("#studentList");

const studentListMessage =
  document.querySelector("#studentListMessage");

const studentSearch =
  document.querySelector("#studentSearch");

const studentTableWrapper =
  document.querySelector("#studentTableWrapper");


// ============================================================
// INICIALIZAR FIREBASE
// ============================================================

async function initStudentListFirebase() {

  if (!FIREBASE_ENABLED) {

    showMessage(
      "Firebase não está configurado."
    );

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
        : firebaseApp.initializeApp(
            firebaseConfig
          );


    auth =
      firebaseAuth.getAuth(app);

    db =
      firebaseDatabase.getDatabase(app);


    firebaseRef =
      firebaseDatabase.ref;

    firebaseGet =
      firebaseDatabase.get;

    firebaseOnAuthStateChanged =
      firebaseAuth.onAuthStateChanged;


    firebaseOnAuthStateChanged(
      auth,
      handleAuthState
    );


    console.log(
      "Módulo de listagem de alunos conectado ao Firebase."
    );


  } catch (error) {

    console.error(
      "Erro ao inicializar lista de alunos:",
      error
    );

    showMessage(
      "Erro ao conectar ao Firebase."
    );

  }

}


// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function handleAuthState(user) {

  if (!user) {

    return;
  }


  await loadStudents();

}


// ============================================================
// CARREGAR ALUNOS
// ============================================================

async function loadStudents() {

  try {

    showMessage(
      "Carregando alunos..."
    );


    const studentsRef =
      firebaseRef(
        db,
        "alunos"
      );


    const snapshot =
      await firebaseGet(
        studentsRef
      );


    if (!snapshot.exists()) {

      students = [];

      renderStudents();

      return;
    }


    const data =
      snapshot.val();


    students =
      Object.entries(data).map(
        ([uid, student]) => ({

          uid,

          ...student

        })
      );


    // Ordenar por nome
    students.sort(
      (a, b) =>
        (a.nomeCompleto || "")
          .localeCompare(
            b.nomeCompleto || "",
            "pt-BR"
          )
    );


    renderStudents();


    console.log(
      `${students.length} aluno(s) carregado(s).`
    );


  } catch (error) {

    console.error(
      "Erro ao carregar alunos:",
      error
    );


    showMessage(
      "Não foi possível carregar os alunos."
    );

  }

}


// ============================================================
// RENDERIZAR
// ============================================================

function renderStudents() {

  if (!studentList) {
    return;
  }


  const search =
    (
      studentSearch?.value || ""
    )
      .trim()
      .toLowerCase();


  const filteredStudents =
    students.filter(
      student => {

        const name =
          student.nomeCompleto ||
          "";

        const email =
          student.email ||
          "";

        const whatsapp =
          student.whatsapp ||
          "";

        const goal =
          student.objetivo ||
          "";


        const text = `
          ${name}
          ${email}
          ${whatsapp}
          ${goal}
        `
          .toLowerCase();


        return text.includes(search);

      }
    );


  studentList.innerHTML = "";


  if (
    filteredStudents.length === 0
  ) {

    if (students.length === 0) {

      showMessage(
        "Nenhum aluno cadastrado ainda."
      );

    } else {

      showMessage(
        "Nenhum aluno encontrado."
      );

    }

    if (studentTableWrapper) {
      studentTableWrapper.style.display =
        "none";
    }

    return;
  }


  if (studentTableWrapper) {
    studentTableWrapper.style.display =
      "block";
  }


  if (studentListMessage) {
    studentListMessage.textContent = "";
    studentListMessage.style.display =
      "none";
  }


  filteredStudents.forEach(
    student => {

      const row =
        document.createElement("tr");


      const initials =
        getInitials(
          student.nomeCompleto
        );


      const status =
        student.status ||
        "ativo";


      const statusText =
        status === "ativo"
          ? "Ativo"
          : "Inativo";


      const statusClass =
        status === "ativo"
          ? "active"
          : "inactive";


      const weight =
        student.peso?.pesoAtual;


      row.innerHTML = `

        <td>

          <div class="student-name-cell">

            <div class="student-avatar">
              ${escapeHtml(initials)}
            </div>

            <div>

              <strong>
                ${escapeHtml(
                  student.nomeCompleto ||
                  "Sem nome"
                )}
              </strong>

              <span>
                ${escapeHtml(
                  student.email ||
                  "Sem e-mail"
                )}
              </span>

            </div>

          </div>

        </td>


        <td>
          ${escapeHtml(
            student.whatsapp ||
            "—"
          )}
        </td>


        <td>
          ${escapeHtml(
            student.objetivo ||
            "—"
          )}
        </td>


        <td>
          ${
            weight
              ? `${escapeHtml(String(weight))} kg`
              : "—"
          }
        </td>


        <td>

          <span class="student-status ${statusClass}">
            ${statusText}
          </span>

        </td>


        <td>

          <div class="student-actions">

            <button
              type="button"
              class="student-action-btn"
              title="Ver aluno"
              data-student-action="view"
              data-student-id="${student.uid}"
            >
              <i class="fa-solid fa-eye"></i>
            </button>


            <button
              type="button"
              class="student-action-btn"
              title="Editar aluno"
              data-student-action="edit"
              data-student-id="${student.uid}"
            >
              <i class="fa-solid fa-pen"></i>
            </button>

          </div>

        </td>

      `;


      studentList.appendChild(
        row
      );

    }
  );


  bindStudentActions();

}


// ============================================================
// AÇÕES
// ============================================================

function bindStudentActions() {

  const buttons =
    document.querySelectorAll(
      "[data-student-action]"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const action =
            button.dataset.studentAction;

          const uid =
            button.dataset.studentId;


          const student =
            students.find(
              item =>
                item.uid === uid
            );


          if (!student) {
            return;
          }


          if (action === "view") {

            viewStudent(student);

          }


          if (action === "edit") {

            editStudent(student);

          }

        }
      );

    }
  );

}


// ============================================================
// VISUALIZAR
// ============================================================

function viewStudent(student) {

  alert(
    `Aluno: ${student.nomeCompleto || "—"}\n\n` +
    `E-mail: ${student.email || "—"}\n` +
    `WhatsApp: ${student.whatsapp || "—"}\n` +
    `Objetivo: ${student.objetivo || "—"}\n` +
    `Peso atual: ${
      student.peso?.pesoAtual
        ? student.peso.pesoAtual + " kg"
        : "—"
    }`
  );

}


// ============================================================
// EDITAR
// ============================================================

function editStudent(student) {

  alert(
    `A edição de ${student.nomeCompleto || "aluno"} será implementada na próxima etapa.`
  );

}


// ============================================================
// BUSCA
// ============================================================

if (studentSearch) {

  studentSearch.addEventListener(
    "input",
    renderStudents
  );

}


// ============================================================
// EVENTO DE NOVO ALUNO
// ============================================================

window.addEventListener(
  "studentCreated",
  () => {

    loadStudents();

  }
);


// ============================================================
// MENSAGEM
// ============================================================

function showMessage(message) {

  if (!studentListMessage) {
    return;
  }


  studentListMessage.textContent =
    message;


  studentListMessage.style.display =
    "block";


  if (studentTableWrapper) {

    studentTableWrapper.style.display =
      "none";

  }

}


// ============================================================
// INICIAIS
// ============================================================

function getInitials(name = "") {

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);


  if (parts.length === 0) {
    return "AL";
  }


  if (parts.length === 1) {

    return parts[0]
      .substring(0, 2)
      .toUpperCase();

  }


  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();

}


// ============================================================
// SEGURANÇA HTML
// ============================================================

function escapeHtml(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ============================================================
// INICIAR
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initStudentListFirebase();

  }
);