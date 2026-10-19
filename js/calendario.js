
import { initFirebase } from "./firebase-app.js";

let calendar = null;
let firebase = null;

export async function initStudioCalendar() {
  const status = document.getElementById("calendarStatus");
  const container = document.getElementById("studioCalendar");

  if (!container) return;

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
  const end = new Date(info.date);
  end.setHours(end.getHours() + 1);

  await createCalendarEvent({
    start: info.date,
    end
  });
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

          createCalendarEvent({
            start: info.event.start,
            end: info.event.end
          });
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
    title: item.clientName || item.nomeAluno || "Aluno",
    start: `${item.date}T${item.time}`,
    extendedProps: {
      clientId: item.clientId || item.studentUid || "",
      service: item.service || "",
      notes: item.notes || ""
    }
  }));
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

  return calendar.getEvents().filter((event) => {
    if (!event.start || event.id === excludeId) {
      return false;
    }

    return (
      formatLocalDate(event.start) === targetDate &&
      event.start.getHours() === targetHour
    );
  }).length;
}

function hasAvailableSlot(date, excludeId = null) {
  return countStudentsInSlot(date, excludeId) < 5;
}








