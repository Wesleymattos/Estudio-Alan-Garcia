
import { initFirebase } from "./firebase-app.js";

let calendar = null;
let firebase = null;

export async function initStudioCalendar() {
  const status = document.getElementById("calendarStatus");
  const container = document.getElementById("studioCalendar");

  if (!container) return;

  const fixedButton = document.getElementById("btnAgendaFixa");

if (fixedButton) {
  fixedButton.onclick = createFixedSchedule;
}

  if (typeof FullCalendar === "undefined") {
    if (status) {
      status.textContent = "Erro ao carregar a biblioteca do calendário.";
    }
    return;
  }

  try {
    firebase = await initFirebase();

    if (!firebase) {
      if (status) {
        status.textContent = "Firebase não está configurado.";
      }
      return;
    }

    const { db, firebaseFns } = firebase;

    const events = await loadCalendarEvents(db, firebaseFns);

const fixedEvents = await loadFixedScheduleEvents(
  db,
  firebaseFns
);

events.push(...fixedEvents);

    if (calendar) {
      calendar.destroy();
    }

    calendar = new FullCalendar.Calendar(container, {
      initialView: "timeGridWeek",


      slotMinTime: "06:00:00",
slotMaxTime: "22:00:00",
slotLabelFormat: {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
},
      locale: "pt-br",
      firstDay: 1,
      weekends: false,
      editable: true,
        selectable: true,

        
      dateClick: async (info) => {
        await showSlotModal(info.date);
      },

      eventClick: async (info) => {
        await showSlotModal(info.event.start);
      },

        selectMirror: true,
        selectOverlap: true,
        eventOverlap: true,
        slotEventOverlap: true,


      height: "auto",
      allDaySlot: false,
      slotDuration: "01:00:00",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek,dayGridMonth"
      },
      
      buttonText: {
        today: "Hoje",
        week: "Semana",
        month: "Mês"
      },

      eventContent: (info) => {
        const wrapper = document.createElement("div");
        wrapper.style.cssText =
          "display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;";

        const title = document.createElement("span");
        title.textContent = info.event.title;
        title.style.cssText =
          "overflow:hidden;text-overflow:ellipsis;";

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.textContent = "+";
        addButton.title = "Adicionar outro aluno neste horário";
        addButton.style.cssText = `
          flex-shrink: 0;
          width: 23px;
          height: 23px;
          border: 0;
          border-radius: 50%;
          background: #ff7a18;
          color: #17191e;
          font-size: 18px;
          font-weight: bold;
          line-height: 20px;
          cursor: pointer;
        `;

        addButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();

          showSlotModal(info.event.start);
        });

        wrapper.append(title, addButton);

        return { domNodes: [wrapper] };
      },


      
eventContent: (info) => {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    min-width: 0;
    overflow: hidden;
  `;

  const title = document.createElement("span");
  title.textContent = info.event.title;
  title.title = info.event.title;
  title.style.cssText = `
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
  `;

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "+";
  addButton.title = "Adicionar aluno neste horário";
  addButton.style.cssText = `
    flex: 0 0 22px;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: #ff7a18;
    color: #17191e;
    font-size: 17px;
    font-weight: bold;
    line-height: 22px;
    cursor: pointer;
  `;

addButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (info.event.extendedProps.tipo === "fixo") {
    alert(
      "Este é um treino recorrente. Para alterar a programação semanal, use a agenda fixa."
    );
    return;
  }

  createCalendarEvent({
    start: info.event.start,
    end: info.event.end
  });
});

  wrapper.append(title, addButton);

  return { domNodes: [wrapper] };
},


      events,


      eventDrop: async (info) => {
        await moveCalendarEvent(info);
      },

      
      select: async (info) => {
        await createCalendarEvent(info);
        calendar.unselect();
      },


      dateClick: async (info) => {
        const end = new Date(info.date);
        end.setHours(end.getHours() + 1);

        await createCalendarEvent({
          start: info.date,
          end
        });
      }
    });

    calendar.render();


    if (status) {
      status.textContent = "Calendário carregado.";
    }
  } catch (error) {
    console.error("Erro ao iniciar calendário:", error);

    if (status) {
      status.textContent = "Não foi possível carregar o calendário.";
    }
  }
}

async function loadCalendarEvents(db, fns) {
  const snapshot = await fns.get(fns.ref(db, "agenda"));

  if (!snapshot.exists()) return [];

  const data = snapshot.val();

  return Object.entries(data).map(([id, item]) => ({
    id,
    backgroundColor: "#ff7a18",
borderColor: "#e5650a",
textColor: "#17191e",
    title: item.clientName || item.nomeAluno || "Aluno",
    start: `${item.date}T${item.time}`,
    extendedProps: {
      clientId: item.clientId || item.studentUid || "",
      service: item.service || "",
      notes: item.notes || ""
    }
  }));
}



async function loadFixedScheduleEvents(db, fns) {
  const snapshot = await fns.get(
    fns.ref(db, "agendaFixa")
  );

  if (!snapshot.exists()) return [];

  const schedules = snapshot.val();
  const events = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 56);

  for (const [id, schedule] of Object.entries(schedules)) {
    if (schedule.ativo !== true) continue;

    const startDate = schedule.dataInicio || "0000-01-01";
    const finishDate = schedule.dataFim || "9999-12-31";

    // Cada dia contém seu próprio horário.
    const days = schedule.dias || {};

    for (
      let date = new Date(today);
      date < endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dateString = formatLocalDate(date);

      if (dateString < startDate || dateString > finishDate) {
        continue;
      }

      const dayKeys = [
        "domingo",
        "segunda",
        "terca",
        "quarta",
        "quinta",
        "sexta",
        "sabado"
      ];

      const dayKey = dayKeys[date.getDay()];
      const time = days[dayKey];

      // Sem horário cadastrado para este dia, não gera treino.
      if (!time) continue;

      events.push({
        id: `fixo_${id}_${dateString}`,
        title: `${schedule.clientName || "Aluno"} · Fixo`,
        start: `${dateString}T${time}:00`,
        backgroundColor: "#dc2626",
borderColor: "#991b1b",
textColor: "#ffffff",
        editable: false,
        extendedProps: {
          clientId: schedule.clientId || "",
          service: schedule.service || "Treino fixo",
          tipo: "fixo",
          agendaFixaId: id
        }
      });
    }
  }

  return events;
}



async function createCalendarEvent(info) {
  if (!hasAvailableSlot(info.start)) {
    alert("Este horário já possui 5 alunos agendados.");
    return;
  }

  const { db, firebaseFns: fns } = firebase;

  try {
    const snapshot = await fns.get(fns.ref(db, "alunos"));

    if (!snapshot.exists()) {
      alert("Não há alunos cadastrados no Firebase.");
      return;
    }

    const students = Object.entries(snapshot.val())
      .map(([uid, student]) => ({
        uid,
        name:
          student.nome ||
          student.nomeCompleto ||
          student.name ||
          student.fullName ||
          student.email ||
          "Aluno sem nome"
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const overlay = document.createElement("div");

    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0,0,0,.75);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    overlay.innerHTML = `
      <form style="
        background: #181818;
        color: white;
        width: 100%;
        max-width: 420px;
        padding: 25px;
        border-radius: 14px;
        border: 1px solid #f58220;
      ">
        <h2 style="margin-top:0">Novo agendamento</h2>

        <label for="calendarStudent">Selecione o aluno</label>
        <select id="calendarStudent" required style="
          display:block;
          width:100%;
          padding:12px;
          margin:10px 0 18px;
          border-radius:8px;
        ">
          <option value="">Escolha um aluno</option>
          ${students.map(student => `
            <option value="${student.uid}">
              ${student.name.replace(/[&<>"']/g, char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
              })[char])}
            </option>
          `).join("")}
        </select>

        <label for="calendarService">Tipo de treino</label>
        <select id="calendarService" style="
          display:block;
          width:100%;
          padding:12px;
          margin:10px 0 20px;
          border-radius:8px;
        ">
          <option>Treino personalizado</option>
          <option>Avaliação física</option>
          <option>Consultoria</option>
        </select>

        <div style="display:flex;gap:10px">
          <button type="submit" style="
            flex:1;padding:12px;background:#f58220;
            border:0;border-radius:8px;font-weight:bold;
          ">Confirmar</button>

          <button type="button" id="cancelCalendar" style="
            flex:1;padding:12px;background:#333;color:white;
            border:0;border-radius:8px;
          ">Cancelar</button>
        </div>
      </form>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();

    overlay.querySelector("#cancelCalendar")
      .addEventListener("click", closeModal);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeModal();
    });

    overlay.querySelector("form").addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const clientId =
          overlay.querySelector("#calendarStudent").value;

        if (!clientId) {
          alert("Selecione um aluno.");
          return;
        }

        const student = students.find(s => s.uid === clientId);
        const service =
          overlay.querySelector("#calendarService").value;

        const date = formatLocalDate(info.start);
        const time = info.start.toTimeString().slice(0, 5);

        const appointment = {
          clientName: student.name,
          clientId: student.uid,
          service,
          date,
          time,
          createdAt: new Date().toISOString()
        };

        try {
          const newRef = fns.push(fns.ref(db, "agenda"));

          const updates = {};
          updates[`agenda/${newRef.key}`] = appointment;
          updates[`agendaAluno/${clientId}/${newRef.key}`] =
            appointment;

          await fns.update(fns.ref(db), updates);

          calendar.addEvent({
            id: newRef.key,
            title: student.name,
            start: info.start,
            extendedProps: {
              clientId,
              service,
              notes: ""
            }
          });

          closeModal();
        } catch (error) {
          console.error("Erro ao salvar agendamento:", error);
          alert("Não foi possível salvar o agendamento.");
        }
      }
    );
  } catch (error) {
    console.error("Erro ao carregar alunos:", error);
    alert("Não foi possível carregar a lista de alunos.");
  }
}




async function createFixedSchedule() {
  const { db, firebaseFns: fns } = firebase;

  try {
    const snapshot = await fns.get(fns.ref(db, "alunos"));

    if (!snapshot.exists()) {
      alert("Não há alunos cadastrados.");
      return;
    }

    const students = Object.entries(snapshot.val())
      .map(([uid, student]) => ({
        uid,
        name:
          student.nome ||
          student.nomeCompleto ||
          student.name ||
          student.fullName ||
          student.email ||
          "Aluno sem nome"
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const days = [
      ["segunda", "Segunda-feira"],
      ["terca", "Terça-feira"],
      ["quarta", "Quarta-feira"],
      ["quinta", "Quinta-feira"],
      ["sexta", "Sexta-feira"],
      ["sabado", "Sábado"],
      ["domingo", "Domingo"]
    ];

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:100001;
      background:rgba(0,0,0,.8);display:flex;
      align-items:center;justify-content:center;padding:16px;
    `;

    overlay.innerHTML = `
      <form style="
        background:#18191e;color:white;width:100%;max-width:460px;
        padding:24px;border:1px solid #ff7a18;border-radius:14px;
        max-height:90vh;overflow:auto;box-sizing:border-box;
      ">
        <h2 style="margin-top:0">Agenda fixa semanal</h2>

        <label>Aluno</label>
        <select id="fixedStudent" required style="display:block;width:100%;padding:11px;margin:8px 0 16px;box-sizing:border-box">
          <option value="">Selecione o aluno</option>
          ${students.map(s => `
            <option value="${s.uid}">${s.name.replace(/[&<>"']/g, c => ({
              "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
            })[c])}</option>
          `).join("")}
        </select>

        <label>Tipo de treino</label>
        <select id="fixedService" style="display:block;width:100%;padding:11px;margin:8px 0 16px;box-sizing:border-box">
          <option>Treino personalizado</option>
          <option>Treino funcional</option>
        </select>

        <label style="display:block;margin-bottom:10px">Dias e horários</label>

        ${days.map(([key, label]) => `
          <div style="
            display:grid;grid-template-columns:1fr 120px;
            align-items:center;gap:12px;margin:12px 0;
          ">
            <label>
              <input type="checkbox" name="fixedDay" value="${key}">
              ${label}
            </label>
            <input
              type="time"
              data-day="${key}"
              value="16:00"
              disabled
              style="width:100%;padding:9px;box-sizing:border-box"
              aria-label="Horário de ${label}"
            >
          </div>
        `).join("")}

        <label>Início da programação</label>
        <input id="fixedStart" type="date" required
          style="display:block;width:100%;padding:11px;margin:8px 0 18px;box-sizing:border-box">

        <div style="display:flex;gap:10px">
          <button type="submit" style="flex:1;padding:12px;background:#ff7a18;border:0;border-radius:8px;font-weight:bold">
            Salvar programação
          </button>
          <button type="button" id="fixedCancel" style="flex:1;padding:12px;background:#333;color:white;border:0;border-radius:8px">
            Cancelar
          </button>
        </div>
      </form>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();

    overlay.querySelector("#fixedCancel").addEventListener("click", close);

    overlay.querySelector("#fixedStart").value = formatLocalDate(new Date());

    overlay.querySelectorAll('input[name="fixedDay"]').forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        const timeInput = overlay.querySelector(
          `input[data-day="${checkbox.value}"]`
        );

        timeInput.disabled = !checkbox.checked;
        timeInput.required = checkbox.checked;
      });
    });

    overlay.querySelector("form").addEventListener("submit", async event => {
      event.preventDefault();

      const clientId = overlay.querySelector("#fixedStudent").value;
      const student = students.find(s => s.uid === clientId);

      const dias = {};

      overlay.querySelectorAll('input[name="fixedDay"]:checked').forEach(checkbox => {
        const time = overlay.querySelector(
          `input[data-day="${checkbox.value}"]`
        ).value;

        if (time) dias[checkbox.value] = time;
      });

      if (!student || Object.keys(dias).length === 0) {
        alert("Selecione o aluno e pelo menos um dia com horário.");
        return;
      }

      const schedule = {
        clientId,
        clientName: student.name,
        service: overlay.querySelector("#fixedService").value,
        dias,
        dataInicio: overlay.querySelector("#fixedStart").value,
        ativo: true,
        createdAt: new Date().toISOString()
      };

      try {
  // Verifica agendas fixas já cadastradas
  const fixedSnapshot = await fns.get(fns.ref(db, "agendaFixa"));
  const fixedSchedules = fixedSnapshot.exists()
    ? Object.values(fixedSnapshot.val())
    : [];

  // Verifica os próximos 56 dias (8 semanas)
  const startDate = new Date(`${schedule.dataInicio}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(startDate.getTime())) {
    alert("Data de início inválida.");
    return;
  }

  if (startDate < today) {
    alert("A data de início não pode estar no passado.");
    return;
  }

  const dayNames = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado"
  ];

  const conflicts = [];

  for (let i = 0; i < 56; i++) {
    const occurrence = new Date(startDate);
    occurrence.setDate(startDate.getDate() + i);

    const dayName = dayNames[occurrence.getDay()];
    const time = schedule.dias[dayName];

    if (!time) continue;

    const dateString = formatLocalDate(occurrence);

    // Conta as agendas fixas ativas nesse dia e horário
    const fixedCount = fixedSchedules.filter(existing => {
      return (
        existing.ativo !== false &&
        existing.dias &&
        existing.dias[dayName] === time &&
        existing.dataInicio &&
        existing.dataInicio <= dateString
      );
    }).length;

    // Conta agendamentos pontuais, sem contar novamente os fixos
    const oneOffCount = calendar.getEvents().filter(event => {
      if (!event.start || event.extendedProps.tipo === "fixo") {
        return false;
      }

      return (
        formatLocalDate(event.start) === dateString &&
        event.start.getHours() === Number(time.split(":")[0]) &&
        event.start.getMinutes() === Number(time.split(":")[1])
      );
    }).length;

    if (fixedCount + oneOffCount >= 5) {
      conflicts.push(
        `${dayName}, ${dateString}, às ${time}`
      );
      break;
    }
  }

  if (conflicts.length > 0) {
    alert(
      "Não foi possível cadastrar a agenda fixa. " +
      "O limite de 5 alunos já foi atingido em:\n\n" +
      conflicts.join("\n") +
      "\n\nEscolha outro horário."
    );
    return;
  }

  // Salva somente se houver vaga
  const newRef = fns.push(fns.ref(db, "agendaFixa"));
  await fns.set(newRef, schedule);

        close();
        await initStudioCalendar();
        alert("Agenda fixa semanal salva!");
      } catch (error) {
        console.error("Erro ao salvar agenda fixa:", error);
        alert("Não foi possível salvar a programação.");
      }
    });
  } catch (error) {
    console.error("Erro ao abrir agenda fixa:", error);
    alert("Não foi possível carregar os alunos.");
  }
}




async function moveCalendarEvent(info) {
  const { db, firebaseFns: fns } = firebase;
  const event = info.event;
  const clientId = event.extendedProps.clientId;

  
if (!hasAvailableSlot(event.start, event.id)) {
  info.revert();
  alert("Este horário já possui 5 alunos. Escolha outro horário.");
  return;
}


  if (!clientId) {
    info.revert();
    alert("Este agendamento não possui o UID do aluno.");
    return;
  }

  const start = event.start;
  const date = start.toLocaleDateString("en-CA");
  const time = start.toTimeString().slice(0, 5);

  const updates = {};
  updates[`agenda/${event.id}/date`] = date;
  updates[`agenda/${event.id}/time`] = time;
  updates[`agendaAluno/${clientId}/${event.id}/date`] = date;
  updates[`agendaAluno/${clientId}/${event.id}/time`] = time;

  try {
    await fns.update(fns.ref(db), updates);
  } catch (error) {
    console.error("Erro ao mover agendamento:", error);
    info.revert();
    alert("Não foi possível salvar o novo horário.");
  }
}



function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}





function countStudentsInSlot(date, excludeId = null) {
  if (!calendar || !date) return 0;

  const targetDate = formatLocalDate(date);
  const targetHour = date.getHours();
  const targetMinute = date.getMinutes();

  return calendar.getEvents().filter(event => {
    if (!event.start || event.id === excludeId) {
      return false;
    }

    // Só conta eventos que ocupam exatamente este horário.
    return (
      formatLocalDate(event.start) === targetDate &&
      event.start.getHours() === targetHour &&
      event.start.getMinutes() === targetMinute
    );
  }).length;
}


function hasAvailableSlot(date, excludeId = null) {
  return countStudentsInSlot(date, excludeId) < 5;
}



async function showSlotModal(date) {
  const slotDate = formatLocalDate(date);
  const slotHour = date.getHours();

  const getSlotEvents = () =>
    calendar.getEvents().filter((event) => {
      return (
        event.start &&
        formatLocalDate(event.start) === slotDate &&
        event.start.getHours() === slotHour
      );
    });

  const overlay = document.createElement("div");

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 100000;
    background: rgba(0,0,0,.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  `;

  overlay.innerHTML = `
    <div style="
      width:100%;
      max-width:520px;
      max-height:85vh;
      overflow:auto;
      background:#18191e;
      color:#fff;
      border:1px solid #ff7a18;
      border-radius:16px;
      padding:24px;
      box-sizing:border-box;
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
      ">
        <div>
          <p style="color:#ff7a18;margin:0 0 6px">
            GERENCIAR HORÁRIO
          </p>
          <h2 style="margin:0" id="slotModalTitle"></h2>
          <p id="slotModalCount" style="color:#bbb"></p>
        </div>
        <button id="closeSlotModal" type="button"
          aria-label="Fechar"
          style="font-size:24px;background:none;border:0;color:white;cursor:pointer">
          &times;
        </button>
      </div>

      <div id="slotStudentList"></div>

      <button id="addSlotStudent" type="button" style="
        width:100%;
        margin-top:18px;
        padding:13px;
        background:#ff7a18;
        color:#17191e;
        border:0;
        border-radius:9px;
        font-weight:bold;
        cursor:pointer;
      ">+ Adicionar aluno</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();

  overlay.querySelector("#closeSlotModal")
    .addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  overlay.querySelector("#slotModalTitle").textContent =
    `${String(slotHour).padStart(2, "0")}:00 — ${slotDate}`;

  const renderStudents = () => {
    const events = getSlotEvents();
    const list = overlay.querySelector("#slotStudentList");

    overlay.querySelector("#slotModalCount").textContent =
      `${events.length} de 5 vagas ocupadas`;

    list.replaceChildren();

    if (events.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Nenhum aluno neste horário.";
      empty.style.color = "#bbb";
      list.appendChild(empty);
    }

    events.forEach((event) => {
      const isFixed = event.extendedProps.tipo === "fixo";

      const row = document.createElement("div");

      row.style.cssText = `
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:13px;
        margin-top:10px;
        background:#252830;
        border:1px solid #383c45;
        border-radius:10px;
      `;

      const details = document.createElement("div");
      details.style.cssText = "min-width:0;overflow-wrap:anywhere";

      const name = document.createElement("strong");
      name.textContent = event.title;

      const time = document.createElement("p");
      time.textContent =
        event.start.toTimeString().slice(0, 5) +
        (event.extendedProps.service
          ? ` · ${event.extendedProps.service}`
          : "");

      time.style.cssText =
        "margin:5px 0 0;color:#bbb;font-size:12px";

      details.append(name, time);

      const actionButton = document.createElement("button");
      actionButton.type = "button";
      actionButton.textContent = isFixed
        ? "Encerrar treino fixo"
        : "Remover";

      actionButton.style.cssText = `
        flex-shrink:0;
        padding:8px 10px;
        color:white;
        background:${isFixed ? "#805000" : "#a52a2a"};
        border:0;
        border-radius:7px;
        cursor:pointer;
      `;

      actionButton.addEventListener("click", async () => {
        const { db, firebaseFns: fns } = firebase;

        if (isFixed) {
          const scheduleId = event.extendedProps.agendaFixaId;

          if (!scheduleId) {
            alert("Não foi possível identificar a agenda fixa.");
            return;
          }

          if (!confirm(
            `Encerrar a programação semanal de ${event.title}?`
          )) {
            return;
          }

          actionButton.disabled = true;

          try {
            await fns.update(
              fns.ref(db, `agendaFixa/${scheduleId}`),
              { ativo: false }
            );

            calendar.getEvents().forEach((calendarEvent) => {
              if (
                calendarEvent.extendedProps.agendaFixaId === scheduleId
              ) {
                calendarEvent.remove();
              }
            });

            alert("Programação semanal encerrada.");
            closeModal();
            await initStudioCalendar();
          } catch (error) {
            console.error("Erro ao encerrar agenda fixa:", error);
            alert("Não foi possível encerrar a programação.");
            actionButton.disabled = false;
          }

          return;
        }

        if (!confirm(`Remover o agendamento de ${event.title}?`)) {
          return;
        }

        const clientId = event.extendedProps.clientId;

        if (!clientId) {
          alert("Não foi possível identificar o aluno deste agendamento.");
          return;
        }

        actionButton.disabled = true;

        try {
          const updates = {};
          updates[`agenda/${event.id}`] = null;
          updates[`agendaAluno/${clientId}/${event.id}`] = null;

          await fns.update(fns.ref(db), updates);

          calendar.getEventById(event.id)?.remove();
          renderStudents();
        } catch (error) {
          console.error("Erro ao remover agendamento:", error);
          alert("Não foi possível remover o agendamento.");
          actionButton.disabled = false;
        }
      });

      row.append(details, actionButton);
      list.appendChild(row);
    });

    const addButton = overlay.querySelector("#addSlotStudent");
    addButton.disabled = events.length >= 5;
    addButton.textContent = events.length >= 5
      ? "Horário lotado (5/5)"
      : "+ Adicionar aluno";

    addButton.style.opacity = addButton.disabled ? "0.5" : "1";
  };

  overlay.querySelector("#addSlotStudent")
    .addEventListener("click", async () => {
      if (getSlotEvents().length >= 5) {
        alert("Este horário já possui 5 alunos.");
        return;
      }

      closeModal();

      const start = new Date(date);
      start.setMinutes(0, 0, 0);

      await createCalendarEvent({ start });
    });

  renderStudents();
}










