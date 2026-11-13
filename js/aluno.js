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
// CONTROLE DO CARREGAMENTO INICIAL
// ============================================================

const studentLoading = $("#studentLoading");
const MIN_LOADING_TIME = 900;

let loadingStartedAt = Date.now();

function hideStudentLoading() {
  const elapsed = Date.now() - loadingStartedAt;
  const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

  setTimeout(() => {
    if (studentLoading) {
      studentLoading.classList.add("hidden");
    }
  }, remaining);
}


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
    const now = new Date();

    const [agendaSnapshot, fixedSnapshot] =
      await Promise.all([
        firebaseFns.get(
          firebaseFns.ref(db, `agendaAluno/${uid}`)
        ),
        firebaseFns.get(
          firebaseFns.ref(db, "agendaFixa")
        )
      ]);

    const appointments = [];

    // Compromissos avulsos
    if (agendaSnapshot.exists()) {
      Object.entries(agendaSnapshot.val()).forEach(
        ([id, item]) => {
          if (!item.date || !item.time) return;

          const dateTime = new Date(
            `${item.date}T${item.time}:00`
          );

          if (dateTime < now) return;

          appointments.push({
            id,
            ...item,
            tipo: "avulso"
          });
        }
      );
    }

    // Treinos fixos
    if (fixedSnapshot.exists()) {
      const schedules = fixedSnapshot.val();

      const dayNames = [
        "domingo",
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado"
      ];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const horizon = new Date(today);
      horizon.setDate(horizon.getDate() + 56);

      for (const [scheduleId, schedule] of Object.entries(schedules)) {
        if (
          schedule.ativo !== true ||
          schedule.clientId !== uid ||
          !schedule.dataInicio
        ) {
          continue;
        }

        const startDate = new Date(
          `${schedule.dataInicio}T00:00:00`
        );

        const endDate = schedule.dataFim
          ? new Date(`${schedule.dataFim}T23:59:59`)
          : null;

        for (
          let date = new Date(today);
          date <= horizon;
          date.setDate(date.getDate() + 1)
        ) {
          if (date < startDate) continue;
          if (endDate && date > endDate) continue;

          const dayName = dayNames[date.getDay()];

          // Aceita os dois formatos de dias:
          // ["segunda", "quinta"] com time separado
          // {"segunda":"16:00", "quinta":"16:00"}
          const days = schedule.dias || {};

          const time = Array.isArray(days)
            ? (days.includes(dayName) ? schedule.time : null)
            : days[dayName];

          if (!time) continue;

          const dateString = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
          ].join("-");

          const dateTime = new Date(
            `${dateString}T${time}:00`
          );

          if (dateTime < now) continue;

          appointments.push({
            id: `fixo_${scheduleId}_${dateString}`,
            date: dateString,
            time,
            service: schedule.service || "Treino fixo",
            notes: "Treino recorrente",
            tipo: "fixo"
          });
        }
      }
    }

    appointments.sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(
        `${b.date} ${b.time}`
      )
    );

    renderStudentAgenda(appointments);
    updateAgendaSummary(appointments);

    if (appointments.length === 0) {
      list.innerHTML = `
        <div class="student-empty-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <h3>Nenhum treino agendado</h3>
          <p>Seus próximos horários aparecerão aqui.</p>
        </div>
      `;
    }

  } catch (error) {
    console.error(
      "Erro ao carregar agenda do aluno:",
      error
    );

    list.innerHTML = `
      <div class="student-empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>Não foi possível carregar a agenda</h3>
        <p>Tente atualizar a página.</p>
      </div>
    `;
  }
}


// ============================================================
// RENDERIZAR AGENDA DO ALUNO
// ============================================================


let studentCalendarMonth = new Date().getMonth();
let studentCalendarYear = new Date().getFullYear();
let studentCalendarSelectedDate = new Date().toISOString().slice(0, 10);
let studentCalendarAppointments = [];

function renderStudentAgenda(appointments) {
  const list = $("#studentAgendaList");
  if (!list) return;

  studentCalendarAppointments = appointments || [];

  const monthDate = new Date(
    studentCalendarYear,
    studentCalendarMonth,
    1
  );

  const monthName = monthDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(
    studentCalendarYear,
    studentCalendarMonth,
    1
  );

  // Segunda-feira como primeiro dia da semana
  const startOffset = (firstDay.getDay() + 6) % 7;

  const daysInMonth = new Date(
    studentCalendarYear,
    studentCalendarMonth + 1,
    0
  ).getDate();

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  let calendarDays = "";

  for (let i = 0; i < 42; i++) {
    const dayNumber = i - startOffset + 1;

    const date = new Date(
      studentCalendarYear,
      studentCalendarMonth,
      dayNumber
    );

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${day}`;

    const isCurrentMonth =
      date.getMonth() === studentCalendarMonth;

    const hasTraining =
      studentCalendarAppointments.some(
        item => item.date === dateString
      );

    const classes = [
      "student-calendar-day",
      dateString === todayString ? "today" : "",
      dateString === studentCalendarSelectedDate ? "selected" : "",
      !isCurrentMonth ? "other-month" : "",
      hasTraining ? "has-training" : ""
    ].filter(Boolean).join(" ");

    calendarDays += `
      <button
        type="button"
        class="${classes}"
        data-calendar-date="${dateString}"
        ${!isCurrentMonth ? "disabled" : ""}
        aria-label="${day}/${month}/${year}"
      >
<span class="student-calendar-day-number">
  ${date.getDate()}
</span>

${
  studentCalendarAppointments
    .filter(item => item.date === dateString)
.map(item => `
  <span class="student-calendar-day-event">
    <strong>${escapeHtml(item.service || "Treino")}</strong>
    <small>${escapeHtml(item.time || "")}</small>
  </span>
`)
    .join("")
}
      </button>
    `;
  }

  list.innerHTML = `
    <div class="student-calendar">

      <div class="student-calendar-header">

        <div class="student-calendar-month">
          ${monthName}
        </div>

        <div class="student-calendar-navigation">

          <button
            type="button"
            data-calendar-nav="-1"
            aria-label="Mês anterior"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>

          <button
            type="button"
            data-calendar-nav="1"
            aria-label="Próximo mês"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>

        </div>

      </div>

      <div class="student-calendar-grid">

        ${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
          .map(day => `
            <div class="student-calendar-weekday">${day}</div>
          `).join("")}

        ${calendarDays}

      </div>

      <div id="studentCalendarEvents" class="student-calendar-events">
      </div>

    </div>
  `;

renderStudentCalendarEvents();
setupStudentCalendarPopover();
}


function renderStudentCalendarEvents() {
  const container = $("#studentCalendarEvents");
  if (!container) return;

  const selectedDate = studentCalendarSelectedDate;

  const events = studentCalendarAppointments.filter(
    item => item.date === selectedDate
  );

  const dateLabel = formatStudentDate(selectedDate);

  container.innerHTML = `
    <h3>${dateLabel}</h3>

    ${
      events.length
        ? events.map(item => {
            const appointment =
              `${item.service || "Treino"} - ${formatStudentDate(item.date)} às ${item.time || "horário não informado"}`;

const studentName =
  $("#studentName")?.textContent.trim() || "Aluno";

const cancelMessage =
  `${studentName} (mensagem automática): Olá Alan, preciso cancelar o compromisso ${appointment}.`;

const rescheduleMessage =
  `${studentName} (mensagem automática): Olá Alan, podemos remarcar o horário ${appointment}?`;

            const whatsapp = "https://wa.me/5551980135744";

            return `
              <article class="student-calendar-event">

                <div class="student-calendar-event-info">
                  <strong>
                    ${escapeHtml(item.service || "Treino")}
                  </strong>

                  <span>
                    ${escapeHtml(item.time || "")}
                  </span>
                </div>

                <div class="student-calendar-event-actions">

                  <a
                    href="${whatsapp}?text=${encodeURIComponent(cancelMessage)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="student-calendar-cancel"
                  >
                    Solicitar Cancelamento
                  </a>

                  <a
                    href="${whatsapp}?text=${encodeURIComponent(rescheduleMessage)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="student-calendar-reschedule"
                  >
                    Pedir para Remarcar
                  </a>

                </div>

              </article>
            `;
          }).join("")
        : `
          <div class="student-calendar-empty">
            Nenhum treino agendado para este dia.
          </div>
        `
    }
  `;
}



document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-calendar-nav]");

  if (navButton) {
    const direction = Number(
      navButton.dataset.calendarNav
    );

    studentCalendarMonth += direction;

    if (studentCalendarMonth > 11) {
      studentCalendarMonth = 0;
      studentCalendarYear++;
    } else if (studentCalendarMonth < 0) {
      studentCalendarMonth = 11;
      studentCalendarYear--;
    }

    renderStudentAgenda(studentCalendarAppointments);
    return;
  }

  const dayButton = event.target.closest("[data-calendar-date]");

  if (dayButton) {
    studentCalendarSelectedDate =
      dayButton.dataset.calendarDate;

    renderStudentAgenda(studentCalendarAppointments);
  }
});

// ============================================================
// RESUMO DA AGENDA
// ============================================================



function setupStudentCalendarPopover() {
  const calendar = $("#studentAgendaList");
  if (!calendar) return;

  // Evita registrar os mesmos eventos várias vezes
  if (calendar.dataset.popoverReady === "true") return;
  calendar.dataset.popoverReady = "true";

  document.addEventListener("click", (event) => {
    const dayButton = event.target.closest("[data-calendar-date]");
    const existingPopover = document.querySelector(
      ".student-calendar-popover"
    );

    if (dayButton) {
      const date = dayButton.dataset.calendarDate;

      const events = studentCalendarAppointments.filter(
        item => item.date === date
      );

      if (!events.length) {
        existingPopover?.remove();
        return;
      }

      existingPopover?.remove();

      const popover = document.createElement("div");
      popover.className = "student-calendar-popover";

      const studentName =
        $("#studentName")?.textContent.trim() || "Aluno";

      popover.innerHTML = `
        <button
          type="button"
          class="student-calendar-popover-close"
          aria-label="Fechar"
        >
          &times;
        </button>

        <h3>${formatStudentDate(date)}</h3>

        ${events.map(item => {
          const appointment =
            `${item.service || "Treino"} - ${formatStudentDate(item.date)} às ${item.time || "horário não informado"}`;

          const cancelMessage =
            `${studentName} (mensagem automática): Olá Alan, preciso cancelar o compromisso ${appointment}.`;

          const rescheduleMessage =
            `${studentName} (mensagem automática): Olá Alan, podemos remarcar o horário ${appointment}?`;

          const whatsapp = "https://wa.me/5551980135744";

          return `
            <div class="student-calendar-popover-event">
              <strong>${escapeHtml(item.service || "Treino")}</strong>
              <span>${escapeHtml(item.time || "")}</span>

              <div class="student-calendar-event-actions">
                <a
                  class="student-calendar-cancel"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="${whatsapp}?text=${encodeURIComponent(cancelMessage)}"
                >
                  Cancelar
                </a>

                <a
                  class="student-calendar-reschedule"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="${whatsapp}?text=${encodeURIComponent(rescheduleMessage)}"
                >
                  Remarcar
                </a>
              </div>
            </div>
          `;
        }).join("")}
      `;

      const calendarElement = calendar.querySelector(".student-calendar");

if (calendarElement) {
  calendarElement.appendChild(popover);
}

      const closeButton = popover.querySelector(
        ".student-calendar-popover-close"
      );

      closeButton.addEventListener("click", () => {
        popover.remove();
      });

      return;
    }

    if (
      existingPopover &&
      !event.target.closest(".student-calendar-popover")
    ) {
      existingPopover.remove();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelector(
        ".student-calendar-popover"
      )?.remove();
    }
  });
}


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
 // ALTERAR SENHA DO ALUNO
 // ============================================================

function setupPasswordChange() {
  const toggleButton = $("#togglePasswordForm");
  const form = $("#changePasswordForm");
  const message = $("#passwordChangeMessage");
  const submitButton = $("#submitPasswordChange");

  if (!toggleButton || !form) return;

  toggleButton.addEventListener("click", () => {
    form.hidden = !form.hidden;
    toggleButton.setAttribute(
      "aria-expanded",
      String(!form.hidden)
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentPassword = $("#currentPassword").value;
    const newPassword = $("#newPassword").value;
    const confirmNewPassword = $("#confirmNewPassword").value;

    message.textContent = "";
    message.style.color = "";

    if (newPassword.length < 6) {
      message.textContent = "A nova senha precisa ter pelo menos 6 caracteres.";
      return;
    }

    if (newPassword !== confirmNewPassword) {
      message.textContent = "A confirmação da nova senha não corresponde.";
      return;
    }

    const user = firebaseFns.getAuth
      ? firebaseFns.getAuth()
      : auth.currentUser;

    if (!user || !user.email) {
      message.textContent = "Não foi possível identificar sua conta. Entre novamente.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Salvando...";

    try {
      const credential = await firebaseFns.EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await firebaseFns.reauthenticateWithCredential(user, credential);
      await firebaseFns.updatePassword(user, newPassword);

      message.style.color = "#22c55e";
      message.textContent = "Senha alterada com sucesso!";
      form.reset();
    } catch (error) {
      console.error("Erro ao alterar senha:", error);

      message.style.color = "#ef4444";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-login-credentials"
      ) {
        message.textContent = "A senha atual está incorreta.";
      } else if (error.code === "auth/weak-password") {
        message.textContent = "Escolha uma senha mais forte.";
      } else if (error.code === "auth/requires-recent-login") {
        message.textContent = "Sua sessão expirou. Entre novamente e tente outra vez.";
      } else {
        message.textContent = "Não foi possível alterar a senha. Tente novamente.";
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Salvar nova senha";
    }
  });
}


// ============================================================
// VERIFICAR USUÁRIO
// ============================================================

async function handleStudentAuth(user) {

  // ----------------------------------------------------------
  // NÃO ESTÁ LOGADO
  // ----------------------------------------------------------

if (!user) {

  if (studentLoading) {
    studentLoading.classList.add("hidden");
  }

  window.location.href = "login.html";

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

hideStudentLoading();

} catch (error) {

  console.error(
    "Erro ao inicializar área do aluno:",
    error
  );

  if (studentLoading) {
    studentLoading.classList.add("hidden");
  }

  showAccessMessage(
    "Erro ao inicializar o sistema."
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

      setupPasswordChange();


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