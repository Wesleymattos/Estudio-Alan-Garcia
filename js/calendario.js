
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
      locale: "pt-br",
      firstDay: 1,
      weekends: false,
      editable: true,
      selectable: true,
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
      events,

      eventDrop: async (info) => {
        await moveCalendarEvent(info);
      },

      select: async (info) => {
        await createCalendarEvent(info);
        calendar.unselect();
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
  const clientName = prompt("Nome do aluno:");
  if (!clientName) return;

  const clientId = prompt("UID do aluno no Firebase:");
  if (!clientId) return;

  const service = prompt("Tipo de treino:", "Treino personalizado") ||
    "Treino personalizado";

  const { db, firebaseFns: fns } = firebase;

  const date = info.start.toLocaleDateString("en-CA");
  const time = info.start.toTimeString().slice(0, 5);

  const event = {
    clientName,
    clientId,
    service,
    date,
    time,
    createdAt: new Date().toISOString()
  };

  const newRef = fns.push(fns.ref(db, "agenda"));

  const updates = {};
  updates[`agenda/${newRef.key}`] = event;
  updates[`agendaAluno/${clientId}/${newRef.key}`] = event;

  await fns.update(fns.ref(db), updates);

  calendar.addEvent({
    id: newRef.key,
    title: clientName,
    start: info.start,
    extendedProps: { clientId, service, notes: "" }
  });
}

async function moveCalendarEvent(info) {
  const { db, firebaseFns: fns } = firebase;
  const event = info.event;
  const clientId = event.extendedProps.clientId;

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
