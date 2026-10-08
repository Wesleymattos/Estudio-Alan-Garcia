// ============================================================
// STUDIO ALAN GARCIA
// AGENDA
// ============================================================

import {
  FIREBASE_ENABLED
} from "./firebase-config.js";

import {
  initFirebase
} from "./firebase-app.js";


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


// ============================================================
// FIREBASE
// ============================================================

async function getFirebase() {

  if (!FIREBASE_ENABLED) {
    return false;
  }

  try {

    const firebase = await initFirebase();

    if (!firebase) {
      return false;
    }

    db = firebase.db;
    auth = firebase.auth;
    firebaseFns = firebase.firebaseFns;

    return true;

  } catch (error) {

    console.error(
      "Erro ao inicializar Firebase da agenda:",
      error
    );

    return false;
  }
}




async function loadStudentsForAgenda() {

  const select = $("#clientId");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Carregando alunos...
    </option>
  `;

  await getFirebase();

  if (
    !FIREBASE_ENABLED ||
    !db ||
    !firebaseFns ||
    !auth?.currentUser
  ) {
    select.innerHTML = `
      <option value="">
        Firebase indisponível
      </option>
    `;
    return;
  }

  try {

    const studentsRef =
      firebaseFns.ref(db, "alunos");

    const snapshot =
      await firebaseFns.get(studentsRef);

    select.innerHTML = `
      <option value="">
        Selecione o aluno
      </option>
    `;

    if (!snapshot.exists()) {
      return;
    }

    const students = snapshot.val();

    Object.entries(students)
      .filter(([uid, student]) =>
        student &&
        student.status !== "inativo"
      )
      .sort(([, a], [, b]) =>
        String(a.nomeCompleto || "")
          .localeCompare(
            String(b.nomeCompleto || ""),
            "pt-BR"
          )
      )
      .forEach(([uid, student]) => {

        const option =
          document.createElement("option");

        option.value = uid;
        option.textContent =
          student.nomeCompleto || "Aluno sem nome";

        select.appendChild(option);

      });

  } catch (error) {

    console.error(
      "Erro ao carregar alunos para a agenda:",
      error
    );

    select.innerHTML = `
      <option value="">
        Erro ao carregar alunos
      </option>
    `;

  }
}

// ============================================================
// CARREGAR AGENDA
// ============================================================

export async function loadAgenda() {

  await loadStudentsForAgenda();

  await getFirebase();

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


  // ==========================================================
  // FALLBACK LOCAL
  // ==========================================================

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

export async function addAppointment(appointment) {

  await getFirebase();

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


  // ==========================================================
  // FALLBACK LOCAL
  // ==========================================================

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

export async function deleteAppointment(id) {

  await getFirebase();

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
}


// ============================================================
// RENDERIZAR AGENDA
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
// FORMULÁRIO
// ============================================================

export async function handleAppointmentSubmit(event) {

  event.preventDefault();

  const clientId =
    $("#clientId")?.value;

  const date =
    $("#appointmentDate")?.value;

  const time =
    $("#appointmentTime")?.value;

  const service =
    $("#appointmentService")?.value;

  const notes =
    $("#appointmentNotes")?.value.trim();


  if (!clientId || !date || !time) {
    return;
  }


  const clientSelect =
    $("#clientId");

  const selectedOption =
    clientSelect?.options[
      clientSelect.selectedIndex
    ];

  const clientName =
    selectedOption?.textContent.trim() || "";


  const appointment = {

    clientId,

    clientName,

    date,

    time,

    service,

    notes,

    createdAt:
      new Date().toISOString()

  };


  await addAppointment(appointment);

  event.target.reset();

}

// ============================================================
// LIMPAR AGENDA LOCAL
// ============================================================

export function clearLocalAgenda() {

  localStorage.removeItem(
    LOCAL_KEY
  );


  if (
    !FIREBASE_ENABLED ||
    !auth?.currentUser
  ) {

    appointments = [];

    renderAppointments();

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