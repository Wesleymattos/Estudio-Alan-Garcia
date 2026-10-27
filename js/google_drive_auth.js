
const GOOGLE_CLIENT_ID = "653401583603-968g4crb4p2pf5n08ciha54tpq1akvpf.apps.googleusercontent.com";
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient = null;
let accessToken = null;
let carregandoGoogle = null;

function carregarGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (carregandoGoogle) return carregandoGoogle;

  carregandoGoogle = new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
      } else {
        reject(new Error("Não foi possível carregar o Google Identity Services."));
      }
    };

    script.onerror = () => {
      carregandoGoogle = null;
      reject(new Error("Falha ao carregar a biblioteca de autenticação do Google."));
    };

    document.head.appendChild(script);
  });

  return carregandoGoogle;
}

export async function conectarGoogleDrive() {
  if (GOOGLE_CLIENT_ID.startsWith("COLE_AQUI")) {
    throw new Error("Configure o ID do cliente OAuth em google_drive_auth.js.");
  }

  await carregarGoogleIdentityServices();

  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES,

      callback: (resposta) => {
        if (resposta.error) {
          reject(new Error(resposta.error));
          return;
        }

        accessToken = resposta.access_token;
        resolve(accessToken);
      },

      error_callback: (erro) => {
        reject(new Error(erro.message || "Falha na autorização Google."));
      }
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

export function obterTokenGoogle() {
  return accessToken;
}

export function desconectarGoogleDrive() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }

  accessToken = null;
  tokenClient = null;
}

export function estaConectadoGoogleDrive() {
  return Boolean(accessToken);
}
