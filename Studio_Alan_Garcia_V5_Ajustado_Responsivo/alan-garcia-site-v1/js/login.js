import { firebaseConfig, FIREBASE_ENABLED } from "./firebase-config.js";

let db = null;
let firebaseFns = null;
let appointments = [];
const LOCAL_KEY = "alanGarciaAgendaV1";

const $ = s => document.querySelector(s);
const status = $("#firebaseStatus");

async function initFirebase() {
  if (!FIREBASE_ENABLED) {
    status.textContent = "Modo local ativo · configure js/firebase-config.js para usar Firebase Realtime Database.";
    return;
  }
  try {
    const [{ initializeApp }, { getDatabase, ref, push, set, onValue, remove }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js")
    ]);
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    firebaseFns = { ref, push, set, onValue, remove };
    status.textContent = "Firebase Realtime Database conectado · agenda online.";
    firebaseFns.onValue(firebaseFns.ref(db, "agenda"), snapshot => {
      const data = snapshot.val() || {};
      appointments = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      renderAppointments();
    });
  } catch (error) {
    console.error(error);
    status.textContent = "Não foi possível conectar ao Firebase. Usando agenda local.";
    loadLocal();
  }
}

function loadLocal() {
  appointments = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  renderAppointments();
}
function saveLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(appointments));
}
function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(date + "T12:00:00"));
}
function renderAppointments() {
  const list = $("#appointmentList");
  const sorted = [...appointments].sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  if (!sorted.length) {
    list.innerHTML = `<div class="empty-state">Nenhum horário cadastrado ainda.</div>`;
    return;
  }
  list.innerHTML = sorted.map(item => `
    <article class="appointment-card">
      <div class="appointment-date"><b>${formatDate(item.date)}</b><span>${item.time}</span></div>
      <div class="appointment-info"><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml(item.service)}</p>${item.notes ? `<small>${escapeHtml(item.notes)}</small>` : ""}</div>
      <button class="delete-appointment" data-id="${item.id}" aria-label="Excluir">×</button>
    </article>
  `).join("");

  list.querySelectorAll(".delete-appointment").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (db) {
        await firebaseFns.remove(firebaseFns.ref(db, `agenda/${id}`));
      } else {
        appointments = appointments.filter(item => item.id !== id);
        saveLocal();
        renderAppointments();
      }
    });
  });
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

$("#loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const user = $("#loginUser").value.trim();
  const pass = $("#loginPassword").value;
  const msg = $("#loginMessage");
  if (user === "admin" && pass === "admin123") {
    sessionStorage.setItem("alanGarciaLogged", "1");
    showAgenda();
  } else {
    msg.textContent = "Usuário ou senha inválidos.";
  }
});

function showAgenda() {
  $("#loginView").hidden = true;
  $("#agendaView").hidden = false;
  if (!db) initFirebase().then(() => { if (!db) loadLocal(); });
}

$("#logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("alanGarciaLogged");
  $("#agendaView").hidden = true;
  $("#loginView").hidden = false;
  $("#loginForm").reset();
});

$("#appointmentForm").addEventListener("submit", async e => {
  e.preventDefault();
  const item = {
    name: $("#clientName").value.trim(),
    date: $("#appointmentDate").value,
    time: $("#appointmentTime").value,
    service: $("#appointmentService").value,
    notes: $("#appointmentNotes").value.trim(),
    createdAt: new Date().toISOString()
  };
  if (db) {
    const newRef = firebaseFns.push(firebaseFns.ref(db, "agenda"));
    await firebaseFns.set(newRef, item);
  } else {
    item.id = crypto.randomUUID();
    appointments.push(item);
    saveLocal();
    renderAppointments();
  }
  e.target.reset();
});

$("#clearDemoBtn").addEventListener("click", () => {
  if (db) {
    alert("Para segurança, a limpeza em massa não está habilitada no Firebase nesta primeira versão.");
    return;
  }
  if (confirm("Limpar todos os horários locais?")) {
    appointments = [];
    saveLocal();
    renderAppointments();
  }
});

if (sessionStorage.getItem("alanGarciaLogged") === "1") showAgenda();
