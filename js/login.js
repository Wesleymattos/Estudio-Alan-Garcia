import { firebaseConfig, FIREBASE_ENABLED } from "./firebase-config.js";

let db = null;
let auth = null;
let firebaseFns = null;

let appointments = [];

const LOCAL_KEY = "alanGarciaAgendaV1";

const $ = selector => document.querySelector(selector);

const status = $("#firebaseStatus");


// ============================================================
// FIREBASE
// ============================================================

async function initFirebase() {

  if (!FIREBASE_ENABLED) {
    if (status) {
      status.textContent =
        "Firebase não configurado.";
    }

    throw new Error("Firebase não configurado.");
  }

  try {

    const [
      { initializeApp },
      {
        getAuth,
        signInWithEmailAndPassword,
        signOut,
        onAuthStateChanged
      },
      {
        getDatabase,
        ref,
        push,
        set,
        onValue,
        remove,
        get
      }
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


    const app = initializeApp(firebaseConfig);

    auth = getAuth(app);

    db = getDatabase(app);

    firebaseFns = {
      signInWithEmailAndPassword,
      signOut,
      onAuthStateChanged,
      ref,
      push,
      set,
      onValue,
      remove,
      get
    };


    if (status) {
      status.textContent =
        "Firebase conectado.";
    }


    firebaseFns.onAuthStateChanged(
      auth,
      handleAuthStateChanged
    );


  } catch (error) {

    console.error(
      "Erro ao inicializar Firebase:",
      error
    );

    if (status) {
      status.textContent =
        "Erro ao conectar ao Firebase.";
    }

    throw error;
  }
}


// ============================================================
// VERIFICAR USUÁRIO LOGADO
// ============================================================

async function handleAuthStateChanged(user) {

  if (!user) {

    $("#loginView").hidden = false;
    $("#agendaView").hidden = true;

    return;
  }


  try {

    const userRef = firebaseFns.ref(
      db,
      `usuarios/${user.uid}`
    );

    const snapshot = await firebaseFns.get(userRef);

    if (!snapshot.exists()) {

      await firebaseFns.signOut(auth);

      showLoginMessage(
        "Usuário autenticado, mas não cadastrado no sistema."
      );

      return;
    }


    const userData = snapshot.val();


    if (userData.ativo !== true) {

      await firebaseFns.signOut(auth);

      showLoginMessage(
        "Este usuário está desativado."
      );

      return;
    }


    if (userData.tipo !== "admin") {

      await firebaseFns.signOut(auth);

      showLoginMessage(
        "Este usuário não possui acesso administrativo."
      );

      return;
    }


    console.log(
      "Usuário autenticado:",
      user.email
    );

    console.log(
      "UID:",
      user.uid
    );

    console.log(
      "Dados do usuário:",
      userData
    );


    showAgenda();


  } catch (error) {

    console.error(
      "Erro ao verificar usuário:",
      error
    );

    showLoginMessage(
      "Não foi possível verificar seu acesso."
    );
  }
}


// ============================================================
// LOGIN
// ============================================================

async function login() {

  const email =
    $("#loginEmail").value.trim();

  const password =
    $("#loginPassword").value;

  const msg =
    $("#loginMessage");

  const button =
    $("#loginForm button[type='submit']");


  msg.textContent = "";


  if (!email || !password) {

    msg.textContent =
      "Informe o e-mail e a senha.";

    return;
  }


  if (!auth) {

    msg.textContent =
      "Firebase ainda não foi inicializado.";

    return;
  }


  try {

    button.disabled = true;

    button.textContent =
      "Entrando...";


    await firebaseFns.signInWithEmailAndPassword(
      auth,
      email,
      password
    );


  } catch (error) {

    console.error(
      "Erro no login:",
      error
    );


    switch (error.code) {

      case "auth/invalid-credential":

        msg.textContent =
          "E-mail ou senha incorretos.";

        break;


      case "auth/user-not-found":

        msg.textContent =
          "Usuário não encontrado.";

        break;


      case "auth/wrong-password":

        msg.textContent =
          "Senha incorreta.";

        break;


      case "auth/invalid-email":

        msg.textContent =
          "E-mail inválido.";

        break;


      case "auth/too-many-requests":

        msg.textContent =
          "Muitas tentativas. Aguarde alguns minutos.";

        break;


      default:

        msg.textContent =
          "Não foi possível realizar o login.";

        break;
    }


    button.disabled = false;

    button.textContent =
      "Entrar na agenda";
  }
}


// ============================================================
// MOSTRAR AGENDA
// ============================================================

function showAgenda() {

  $("#loginView").hidden = true;

  $("#agendaView").hidden = false;

  loadAgenda();
}


// ============================================================
// CARREGAR AGENDA
// ============================================================

function loadAgenda() {

  if (!db) {

    loadLocal();

    return;
  }


  firebaseFns.onValue(

    firebaseFns.ref(
      db,
      "agenda"
    ),

    snapshot => {

      const data =
        snapshot.val() || {};


      appointments =
        Object.entries(data).map(
          ([id, value]) => ({
            id,
            ...value
          })
        );


      renderAppointments();
    }

  );
}


// ============================================================
// MODO LOCAL
// ============================================================

function loadLocal() {

  appointments =
    JSON.parse(
      localStorage.getItem(
        LOCAL_KEY
      ) || "[]"
    );


  renderAppointments();
}


function saveLocal() {

  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(appointments)
  );
}


// ============================================================
// FORMATAR DATA
// ============================================================

function formatDate(date) {

  if (!date) {
    return "";
  }


  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short"
    }
  ).format(
    new Date(
      date + "T12:00:00"
    )
  );
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


  const sorted =
    [...appointments].sort(
      (a, b) =>
        `${a.date}${a.time}`.localeCompare(
          `${b.date}${b.time}`
        )
    );


  if (!sorted.length) {

    list.innerHTML = `
      <div class="empty-state">
        Nenhum horário cadastrado ainda.
      </div>
    `;

    return;
  }


  list.innerHTML =
    sorted.map(item => `

      <article class="appointment-card">

        <div class="appointment-date">
          <b>${formatDate(item.date)}</b>
          <span>${item.time}</span>
        </div>

        <div class="appointment-info">

          <h4>
            ${escapeHtml(item.name)}
          </h4>

          <p>
            ${escapeHtml(item.service)}
          </p>

          ${
            item.notes
              ? `<small>${escapeHtml(item.notes)}</small>`
              : ""
          }

        </div>

        <button
          class="delete-appointment"
          data-id="${item.id}"
          aria-label="Excluir"
        >
          ×
        </button>

      </article>

    `).join("");


  list
    .querySelectorAll(
      ".delete-appointment"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.id;


          if (db) {

            await firebaseFns.remove(
              firebaseFns.ref(
                db,
                `agenda/${id}`
              )
            );

          } else {

            appointments =
              appointments.filter(
                item =>
                  item.id !== id
              );

            saveLocal();

            renderAppointments();
          }

        }
      );

    });
}


// ============================================================
// SEGURANÇA HTML
// ============================================================

function escapeHtml(value = "") {

  return String(value).replace(
    /[&<>"']/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
  );
}


// ============================================================
// MENSAGEM DE LOGIN
// ============================================================

function showLoginMessage(message) {

  const msg =
    $("#loginMessage");

  if (msg) {
    msg.textContent = message;
  }
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  try {

    if (auth) {

      await firebaseFns.signOut(
        auth
      );

    }

  } catch (error) {

    console.error(
      "Erro ao sair:",
      error
    );

  }

  $("#agendaView").hidden = true;

  $("#loginView").hidden = false;

  $("#loginForm").reset();

  $("#loginMessage").textContent = "";
}


// ============================================================
// ADICIONAR AGENDAMENTO
// ============================================================

async function addAppointment(event) {

  event.preventDefault();


  const item = {

    name:
      $("#clientName")
        .value
        .trim(),

    date:
      $("#appointmentDate")
        .value,

    time:
      $("#appointmentTime")
        .value,

    service:
      $("#appointmentService")
        .value,

    notes:
      $("#appointmentNotes")
        .value
        .trim(),

    createdAt:
      new Date().toISOString()
  };


  try {

    if (db) {

      const newRef =
        firebaseFns.push(
          firebaseFns.ref(
            db,
            "agenda"
          )
        );


      await firebaseFns.set(
        newRef,
        item
      );

    } else {

      item.id =
        crypto.randomUUID();

      appointments.push(item);

      saveLocal();

      renderAppointments();
    }


    event.target.reset();


  } catch (error) {

    console.error(
      "Erro ao salvar agendamento:",
      error
    );

    alert(
      "Não foi possível salvar o agendamento."
    );
  }
}


// ============================================================
// LIMPAR AGENDA LOCAL
// ============================================================

function clearDemoAgenda() {

  if (db) {

    alert(
      "Para segurança, a limpeza em massa não está habilitada no Firebase."
    );

    return;
  }


  if (
    confirm(
      "Limpar todos os horários locais?"
    )
  ) {

    appointments = [];

    saveLocal();

    renderAppointments();
  }
}


// ============================================================
// EVENTOS
// ============================================================

$("#loginForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();

      login();
    }
  );


$("#logoutBtn")
  .addEventListener(
    "click",
    logout
  );


$("#appointmentForm")
  .addEventListener(
    "submit",
    addAppointment
  );


$("#clearDemoBtn")
  .addEventListener(
    "click",
    clearDemoAgenda
  );


// ============================================================
// INICIALIZAÇÃO
// ============================================================

initFirebase()
  .catch(error => {

    console.error(
      "Firebase não pôde ser inicializado:",
      error
    );

  });