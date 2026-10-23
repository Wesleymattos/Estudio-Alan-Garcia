
import { initFirebase } from "./firebase-app.js";

const CAMINHO_FINANCEIRO = "financeiro/lancamentos";

let db;
let auth;
let firebaseFns;
let lancamentos = {};
let usuarioAutorizado = false;
let carregando = false;

const porId = (id) => document.getElementById(id);

const dinheiro = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

function mostrarMensagem(texto, erro = false) {
  const elemento = porId("financeiroMensagem");

  if (!elemento) return;

  elemento.textContent = texto;
  elemento.style.color = erro ? "#c62828" : "#287d46";
}

function obterMesAtual() {
  const agora = new Date();

  return [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0")
  ].join("-");
}

function definirDatasIniciais() {
  const campoMes = porId("financeiroMes");
  const campoData = porId("lancamentoData");

  if (campoMes && !campoMes.value) {
    campoMes.value = obterMesAtual();
  }

  if (campoData && !campoData.value) {
    campoData.value = new Date().toLocaleDateString("en-CA");
  }
}

async function verificarAdministrador() {
  const usuario = auth?.currentUser;

  if (!usuario) {
    usuarioAutorizado = false;
    return false;
  }

  const referencia = firebaseFns.ref(db, `usuarios/${usuario.uid}`);
  const resultado = await firebaseFns.get(referencia);
  const dados = resultado.exists() ? resultado.val() : null;

  usuarioAutorizado =
    dados?.ativo === true && dados?.tipo === "admin";

  return usuarioAutorizado;
}

function lancamentosDoMes() {
  const mes = porId("financeiroMes")?.value || obterMesAtual();

  return Object.entries(lancamentos)
    .filter(([, item]) => item.data?.startsWith(mes))
    .sort((a, b) => (b[1].data || "").localeCompare(a[1].data || ""));
}

function atualizarResumo(lista) {
  let receitas = 0;
  let despesas = 0;
  let pendentes = 0;

  for (const [, item] of lista) {
    const valor = Number(item.valor) || 0;

    if (item.tipo === "receita") {
      if (item.status === "pendente") {
        pendentes += valor;
      } else {
        receitas += valor;
      }
    } else if (item.tipo === "despesa" && item.status === "pago") {
      despesas += valor;
    }
  }

  porId("totalReceitas").textContent = dinheiro(receitas);
  porId("totalDespesas").textContent = dinheiro(despesas);
  porId("saldoFinanceiro").textContent = dinheiro(receitas - despesas);
  porId("totalPendentes").textContent = dinheiro(pendentes);
}

function renderizarLancamentos() {
  const container = porId("listaLancamentos");
  if (!container) return;

  const busca = (porId("financeiroBusca")?.value || "")
    .trim()
    .toLocaleLowerCase("pt-BR");

  const lista = lancamentosDoMes().filter(([, item]) => {
    const descricao = String(item.descricao || "").toLocaleLowerCase("pt-BR");
    const categoria = String(item.categoria || "").toLocaleLowerCase("pt-BR");

    return descricao.includes(busca) || categoria.includes(busca);
  });

  atualizarResumo(lancamentosDoMes());

  if (!lista.length) {
    container.replaceChildren();

    const mensagem = document.createElement("p");
    mensagem.textContent = "Nenhum lançamento encontrado neste período.";
    container.appendChild(mensagem);
    return;
  }

  const tabela = document.createElement("table");
  tabela.className = "student-table";

  const cabecalho = document.createElement("thead");
  const linhaCabecalho = document.createElement("tr");

  for (const texto of ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Situação", "Ações"]) {
    const th = document.createElement("th");
    th.textContent = texto;
    linhaCabecalho.appendChild(th);
  }

  cabecalho.appendChild(linhaCabecalho);
  tabela.appendChild(cabecalho);

  const corpo = document.createElement("tbody");

  for (const [id, item] of lista) {
    const linha = document.createElement("tr");

    const valores = [
      item.data || "—",
      item.descricao || "—",
      item.categoria || "—",
      item.tipo === "receita" ? "Receita" : "Despesa",
      dinheiro(item.valor),
      item.status === "pendente" ? "Pendente" : "Pago"
    ];

    for (const valor of valores) {
      const td = document.createElement("td");
      td.textContent = valor;
      linha.appendChild(td);
    }

    const tdAcoes = document.createElement("td");
    const botaoExcluir = document.createElement("button");

    botaoExcluir.type = "button";
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.setAttribute("aria-label", `Excluir ${item.descricao || "lançamento"}`);

    botaoExcluir.addEventListener("click", () => excluirLancamento(id));

    tdAcoes.appendChild(botaoExcluir);
    linha.appendChild(tdAcoes);
    corpo.appendChild(linha);
  }

  tabela.appendChild(corpo);
  container.replaceChildren(tabela);
}

async function carregarLancamentos() {
  if (carregando) return;
  carregando = true;

  try {
    if (!(await verificarAdministrador())) {
      porId("listaLancamentos").textContent =
        "Entre com uma conta de administrador para acessar o financeiro.";
      return;
    }

    const referencia = firebaseFns.ref(db, CAMINHO_FINANCEIRO);
    const resultado = await firebaseFns.get(referencia);

    lancamentos = resultado.exists() ? resultado.val() : {};
    renderizarLancamentos();
  } catch (erro) {
    console.error("Erro ao carregar financeiro:", erro);
    porId("listaLancamentos").textContent =
      "Não foi possível carregar os lançamentos. Verifique a conexão e as regras do Firebase.";
  } finally {
    carregando = false;
  }
}

async function salvarLancamento(evento) {
  evento.preventDefault();

  try {
    if (!(await verificarAdministrador())) {
      mostrarMensagem("Apenas o administrador pode salvar lançamentos.", true);
      return;
    }

    const tipo = porId("lancamentoTipo").value;
    const descricao = porId("lancamentoDescricao").value.trim();
    const valor = Number(porId("lancamentoValor").value);
    const data = porId("lancamentoData").value;
    const categoria = porId("lancamentoCategoria").value.trim();
    const status = porId("lancamentoStatus").value;

    if (!descricao || !Number.isFinite(valor) || valor <= 0 || !data) {
      mostrarMensagem("Preencha a descrição, o valor e a data corretamente.", true);
      return;
    }

    const novoLancamento = {
      tipo,
      descricao,
      valor,
      data,
      categoria,
      status,
      criadoEm: new Date().toISOString(),
      criadoPor: auth.currentUser.uid
    };

    const referencia = firebaseFns.push(
      firebaseFns.ref(db, CAMINHO_FINANCEIRO)
    );

    await firebaseFns.set(referencia, novoLancamento);

    porId("formLancamento").reset();
    definirDatasIniciais();

    mostrarMensagem("Lançamento salvo com sucesso.");
    await carregarLancamentos();
  } catch (erro) {
    console.error("Erro ao salvar lançamento:", erro);
    mostrarMensagem("Não foi possível salvar. Verifique as regras do Firebase.", true);
  }
}

async function excluirLancamento(id) {
  if (!confirm("Deseja realmente excluir este lançamento?")) return;

  try {
    if (!(await verificarAdministrador())) {
      mostrarMensagem("Apenas o administrador pode excluir lançamentos.", true);
      return;
    }

    await firebaseFns.remove(
      firebaseFns.ref(db, `${CAMINHO_FINANCEIRO}/${id}`)
    );

    mostrarMensagem("Lançamento excluído.");
    await carregarLancamentos();
  } catch (erro) {
    console.error("Erro ao excluir lançamento:", erro);
    mostrarMensagem("Não foi possível excluir o lançamento.", true);
  }
}

async function iniciarFinanceiro() {
  try {
    const firebase = await initFirebase();

    if (!firebase) {
      porId("listaLancamentos").textContent =
        "Firebase não está configurado.";
      return;
    }

    ({ db, auth, firebaseFns } = firebase);

    definirDatasIniciais();

    porId("formLancamento")?.addEventListener("submit", salvarLancamento);
    porId("financeiroAtualizar")?.addEventListener("click", carregarLancamentos);
    porId("financeiroMes")?.addEventListener("change", renderizarLancamentos);
    porId("financeiroBusca")?.addEventListener("input", renderizarLancamentos);

    firebaseFns.onAuthStateChanged(auth, (usuario) => {
      if (!usuario) {
        usuarioAutorizado = false;
        lancamentos = {};
        atualizarResumo([]);
        porId("listaLancamentos").textContent =
          "Faça login como administrador para acessar o financeiro.";
        return;
      }

      carregarLancamentos();
    });
  } catch (erro) {
    console.error("Erro ao iniciar financeiro:", erro);
    porId("listaLancamentos").textContent =
      "Erro ao iniciar o financeiro. Consulte o console do navegador.";
  }
}

iniciarFinanceiro();
