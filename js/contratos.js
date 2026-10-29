
import { initFirebase } from "./firebase-app.js";
import {
  obterTokenGoogle,
  conectarGoogleDrive
} from "./google_drive_auth.js";

const PASTA_CONTRATOS_ID = "1eyzmdpvolbcMKsYYSTNmws56DFJ-P0_K";
const CAMINHO_CONTRATOS = "financeiro/contratos";
const CAMINHO_ALUNOS = "alunos";
const CAMINHO_USUARIOS = "usuarios";

const MIME_PASTA = "application/vnd.google-apps.folder";

const MIME_POR_EXTENSAO = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

const TAMANHO_MAXIMO = 15 * 1024 * 1024;

let db;
let auth;
let firebaseFns;
let inicializacao;

function elemento(id) {
  return document.getElementById(id);
}

function mostrarMensagem(texto, erro = false) {
  const mensagem = elemento("contratoMensagem");
  if (!mensagem) return;

  mensagem.textContent = texto;
  mensagem.style.color = erro ? "#b42318" : "#16803c";
}

async function iniciar() {
  if (db && auth && firebaseFns) return;
  if (inicializacao) return inicializacao;

  inicializacao = (async () => {
    const firebase = await initFirebase();

    if (!firebase) {
      throw new Error("Firebase não está configurado.");
    }

    ({ db, auth, firebaseFns } = firebase);
  })();

  try {
    await inicializacao;
  } catch (erro) {
    inicializacao = null;
    throw erro;
  }
}

async function aguardarAutenticacao() {
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve, reject) => {
    let cancelar = () => {};

    cancelar = firebaseFns.onAuthStateChanged(
      auth,
      (usuario) => {
        cancelar();
        resolve(usuario);
      },
      (erro) => {
        cancelar();
        reject(erro);
      }
    );
  });
}

async function verificarAdministrador() {
  const usuario = auth.currentUser;
  if (!usuario) return false;

  const referencia = firebaseFns.ref(
    db,
    `${CAMINHO_USUARIOS}/${usuario.uid}`
  );

  const resultado = await firebaseFns.get(referencia);
  const dados = resultado.exists() ? resultado.val() : null;

  return dados?.ativo === true && dados?.tipo === "admin";
}

async function obterTokenValido() {
  let token = obterTokenGoogle();

  if (!token) {
    const emailFirebase = auth.currentUser?.email;

    token = await conectarGoogleDrive(emailFirebase);
  }

  if (!token) {
    throw new Error("Não foi possível autorizar o Google Drive.");
  }

  return token;
}

async function requisicaoDrive(url, opcoes = {}) {
  const token = await obterTokenValido();

  const resposta = await fetch(url, {
    ...opcoes,
    headers: {
      ...opcoes.headers,
      Authorization: `Bearer ${token}`
    }
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();

    if (resposta.status === 401) {
      throw new Error(
        "A autorização do Google Drive expirou. " +
        "Reconecte sua conta Google e tente novamente."
      );
    }

    if (resposta.status === 403 || resposta.status === 404) {
      throw new Error(
        "O Google Drive não permitiu acessar a pasta de contratos. " +
        "Verifique a autorização da pasta e o escopo OAuth drive.file. " +
        "Detalhes: " + detalhe
      );
    }

    throw new Error(
      `Erro no Google Drive (${resposta.status}): ${detalhe}`
    );
  }

  return resposta.json();
}

async function carregarAlunos() {
  const seletor = elemento("contratoAluno");
  if (!seletor) return;

  seletor.replaceChildren(
    new Option("Carregando alunos...", "")
  );

  const resultado = await firebaseFns.get(
    firebaseFns.ref(db, CAMINHO_ALUNOS)
  );

  seletor.replaceChildren(
    new Option("Selecione um aluno", "")
  );

  if (!resultado.exists()) {
    seletor.replaceChildren(
      new Option("Nenhum aluno cadastrado", "")
    );
    return;
  }

  const alunos = Object.entries(resultado.val())
    .map(([uid, dados]) => ({
      uid,
      nome: String(dados?.nomeCompleto || "").trim()
    }))
    .filter((aluno) => aluno.nome)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  for (const aluno of alunos) {
    const opcao = new Option(aluno.nome, aluno.uid);
    seletor.add(opcao);
  }

  if (alunos.length === 0) {
    seletor.replaceChildren(
      new Option("Nenhum aluno com nome válido", "")
    );
  }
}

async function buscarAluno(alunoId) {
  const resultado = await firebaseFns.get(
    firebaseFns.ref(db, `${CAMINHO_ALUNOS}/${alunoId}`)
  );

  if (!resultado.exists()) {
    throw new Error("O aluno selecionado não foi encontrado.");
  }

  const dados = resultado.val();
  const nome = String(dados?.nomeCompleto || "").trim();

  if (!nome) {
    throw new Error("O cadastro do aluno não possui nome completo.");
  }

  return { id: alunoId, nome };
}

function nomeSeguro(nome) {
  return nome
    .replace(/[<>:"\/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100) || "Aluno";
}

async function encontrarOuCriarPastaAluno(aluno) {
  const referenciaFirebase = firebaseFns.ref(
    db,
    `${CAMINHO_CONTRATOS}/${aluno.id}/pastaDriveId`
  );

  const pastaSalva = await firebaseFns.get(referenciaFirebase);

  if (pastaSalva.exists()) {
    return pastaSalva.val();
  }

  const nomePasta = `${nomeSeguro(aluno.nome)} - ${aluno.id}`;

  const consulta = [
    `'${PASTA_CONTRATOS_ID}' in parents`,
    `name = '${nomePasta.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`,
    `mimeType = '${MIME_PASTA}'`,
    "trashed = false"
  ].join(" and ");

  const parametros = new URLSearchParams({
    q: consulta,
    fields: "files(id,name,mimeType)",
    pageSize: "100"
  });

  const resultado = await requisicaoDrive(
    `https://www.googleapis.com/drive/v3/files?${parametros}`
  );

  let pasta = resultado.files?.[0];

  if (!pasta) {
    pasta = await requisicaoDrive(
      "https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nomePasta,
          mimeType: MIME_PASTA,
          parents: [PASTA_CONTRATOS_ID],
          appProperties: { alunoId: String(aluno.id) }
        })
      }
    );
  }

  await firebaseFns.set(referenciaFirebase, pasta.id);

  return pasta.id;
}

async function enviarArquivoDrive(arquivo, pastaId) {
  const extensao = arquivo.name.split(".").pop().toLowerCase();
  const mimeType = MIME_POR_EXTENSAO[extensao];

  if (!mimeType) {
    throw new Error("Selecione um arquivo PDF, DOC ou DOCX.");
  }

  const metadados = {
    name: arquivo.name,
    mimeType,
    parents: [pastaId]
  };

  const corpo = new FormData();

  corpo.append(
    "metadata",
    new Blob([JSON.stringify(metadados)], {
      type: "application/json"
    })
  );

  corpo.append("file", arquivo);

  return requisicaoDrive(
    "https://www.googleapis.com/upload/drive/v3/files" +
      "?uploadType=multipart&fields=id,name,mimeType,webViewLink,parents",
    {
      method: "POST",
      body: corpo
    }
  );
}

export async function anexarContrato(
  alunoId,
  arquivo,
  dadosContrato = {}
) {
  await iniciar();

  if (!(await verificarAdministrador())) {
    throw new Error("Apenas um administrador pode anexar contratos.");
  }

  if (!alunoId || !arquivo) {
    throw new Error("Selecione o aluno e o arquivo do contrato.");
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("O arquivo deve ter no máximo 15 MB.");
  }

  const extensao = arquivo.name.split(".").pop().toLowerCase();

  if (!MIME_POR_EXTENSAO[extensao]) {
    throw new Error("Selecione um arquivo PDF, DOC ou DOCX.");
  }

  const aluno = await buscarAluno(alunoId);
  const pastaId = await encontrarOuCriarPastaAluno(aluno);
  const documento = await enviarArquivoDrive(arquivo, pastaId);

  try {
    const referencia = firebaseFns.push(
      firebaseFns.ref(
        db,
        `${CAMINHO_CONTRATOS}/${aluno.id}/documentos`
      )
    );

    await firebaseFns.set(referencia, {
      alunoId: aluno.id,
      nomeAluno: aluno.nome,
      pastaDriveId: pastaId,
      arquivoId: documento.id,
      nomeArquivo: documento.name,
      mimeType: documento.mimeType,
      webViewLink: documento.webViewLink || null,
      dadosContrato,
      enviadoEm: new Date().toISOString(),
      enviadoPor: auth.currentUser.uid
    });
  } catch (erro) {
    console.error("Falha ao registrar o contrato no Firebase:", erro);

    throw new Error(
      "O arquivo foi enviado ao Drive, mas não foi registrado no Firebase. " +
      `ID do arquivo: ${documento.id}. Confira antes de tentar novamente.`
    );
  }

  return documento;
}

async function configurarFormulario() {
  const formulario = elemento("formAnexarContrato");
  const botao = elemento("btnAnexarContrato");

  if (!formulario || !botao) return;

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const alunoId = elemento("contratoAluno")?.value;
    const arquivo = elemento("contratoArquivo")?.files?.[0];

    if (!alunoId || !arquivo) {
      mostrarMensagem("Selecione o aluno e o arquivo.", true);
      return;
    }

    botao.disabled = true;
    mostrarMensagem("Preparando o envio do contrato...");

    try {
      const documento = await anexarContrato(alunoId, arquivo);

      mostrarMensagem(
        `Contrato enviado com sucesso: ${documento.name}`
      );

      formulario.reset();
    } catch (erro) {
      console.error("Erro ao anexar contrato:", erro);
      mostrarMensagem(
        erro.message || "Não foi possível anexar o contrato.",
        true
      );
    } finally {
      botao.disabled = false;
    }
  });
}

async function inicializarInterface() {
  try {
    await iniciar();
    await aguardarAutenticacao();

    if (!(await verificarAdministrador())) {
      mostrarMensagem(
        "Entre com uma conta de administrador para gerenciar contratos.",
        true
      );
      return;
    }

    await carregarAlunos();
  } catch (erro) {
    console.error("Erro ao inicializar contratos:", erro);
    mostrarMensagem(
      erro.message || "Não foi possível carregar os contratos.",
      true
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
    inicializarInterface();
  }, { once: true });
} else {
  configurarFormulario();
  inicializarInterface();
}
