const API_PAINEL = "http://localhost:3000/relatorios/painel";
const CHAVE_PRONTOS_DISPENSADOS = "adminDashboardPedidosProntosDispensados";
const campoDataPainel = document.querySelector("#dataPainel");
const mensagemPainel = document.querySelector("#mensagemPainel");
const listaMesasPainel = document.querySelector("#listaMesas");
const listaPedidosPainel = document.querySelector("#listaPedidosCozinha");
const listaMaisVendidosPainel = document.querySelector("#listaMaisVendidos");
const totalMesasPainel = document.querySelector("#totalMesas");
const totalPedidosPainel = document.querySelector("#totalPedidos");
let dadosPainel = null;

function dataLocalAtual() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarMoedaPainel(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterProntosDispensados() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(CHAVE_PRONTOS_DISPENSADOS) || "{}",
    );
    return dados && typeof dados === "object" ? dados : {};
  } catch {
    return {};
  }
}

function marcarProntoDispensado(pedidoId) {
  const dispensados = obterProntosDispensados();
  const data = campoDataPainel.value;
  const idsDaData = new Set(dispensados[data] || []);
  idsDaData.add(String(pedidoId));
  dispensados[data] = [...idsDaData];
  localStorage.setItem(CHAVE_PRONTOS_DISPENSADOS, JSON.stringify(dispensados));
  renderizarPedidosPainel();
}

function renderizarMesasPainel(mesas) {
  listaMesasPainel.replaceChildren();
  totalMesasPainel.textContent = String(mesas.length);

  if (mesas.length === 0) {
    const vazio = document.createElement("p");
    vazio.classList.add("painel-vazio");
    vazio.textContent = "Nenhuma mesa ocupada neste momento.";
    listaMesasPainel.appendChild(vazio);
    return;
  }

  for (const mesa of mesas) {
    const link = document.createElement("a");
    link.classList.add("mesa-painel-linha");
    link.href = `/DonCabron/index/pedidos.html?mesa=${encodeURIComponent(mesa.id)}`;
    link.setAttribute("aria-label", `Abrir pedido da mesa ${mesa.numero}`);

    const identificacao = document.createElement("span");
    identificacao.classList.add("mesa-painel-identificacao");
    const nome = document.createElement("strong");
    nome.textContent = `Mesa ${mesa.numero}`;
    const subtitulo = document.createElement("small");
    subtitulo.textContent = `Comanda #${mesa.comanda_id}`;
    identificacao.append(nome, subtitulo);

    const total = document.createElement("span");
    total.classList.add("mesa-painel-total");
    const legendaTotal = document.createElement("small");
    legendaTotal.textContent = "Total até agora";
    const valorTotal = document.createElement("strong");
    valorTotal.textContent = formatarMoedaPainel(mesa.valor_total);
    total.append(legendaTotal, valorTotal);

    const abrir = document.createElement("span");
    abrir.classList.add("mesa-painel-abrir");
    abrir.setAttribute("aria-hidden", "true");
    abrir.textContent = "›";

    link.append(identificacao, total, abrir);
    listaMesasPainel.appendChild(link);
  }
}

function criarPedidoPainel(pedido) {
  const artigo = document.createElement("article");
  artigo.classList.add("pedido-painel", `pedido-painel-${pedido.status.toLowerCase()}`);

  const topo = document.createElement("div");
  topo.classList.add("pedido-painel-topo");
  const mesa = document.createElement("strong");
  mesa.textContent = `Mesa ${pedido.mesa}`;
  const situacao = document.createElement("span");
  situacao.classList.add("pedido-painel-status");
  const statusLegivel = {
    RECEBIDO: "Recebido",
    EM_PREPARO: "Em preparo",
    PRONTO: "Pronto",
  };
  situacao.textContent = statusLegivel[pedido.status] || pedido.status;
  topo.append(mesa, situacao);

  const itens = document.createElement("ul");
  itens.classList.add("pedido-painel-itens");
  for (const item of pedido.itens) {
    const linha = document.createElement("li");
    const produto = document.createElement("span");
    produto.textContent = String(item.produto ?? "Produto");
    const quantidade = document.createElement("strong");
    quantidade.textContent = `${item.quantidade}x`;
    linha.append(produto, quantidade);
    itens.appendChild(linha);
  }

  artigo.append(topo, itens);

  if (pedido.status === "PRONTO") {
    const ok = document.createElement("button");
    ok.type = "button";
    ok.classList.add("pedido-painel-ok");
    ok.textContent = "OK";
    ok.setAttribute("aria-label", `Dispensar pedido pronto da mesa ${pedido.mesa}`);
    ok.addEventListener("click", () => marcarProntoDispensado(pedido.pedido_id));
    artigo.appendChild(ok);
  }

  return artigo;
}

function renderizarPedidosPainel() {
  const dispensados = new Set(
    obterProntosDispensados()[campoDataPainel.value] || [],
  );
  const pedidosVisiveis = (dadosPainel?.pedidos || []).filter(
    (pedido) => pedido.status !== "PRONTO" || !dispensados.has(String(pedido.pedido_id)),
  );

  listaPedidosPainel.replaceChildren();
  totalPedidosPainel.textContent = String(pedidosVisiveis.length);

  if (pedidosVisiveis.length === 0) {
    const vazio = document.createElement("p");
    vazio.classList.add("painel-vazio");
    vazio.textContent = "Nenhum pedido na cozinha para esta data.";
    listaPedidosPainel.appendChild(vazio);
    return;
  }

  for (const pedido of pedidosVisiveis) {
    listaPedidosPainel.appendChild(criarPedidoPainel(pedido));
  }
}

function renderizarMaisVendidosPainel(itens) {
  listaMaisVendidosPainel.replaceChildren();

  if (itens.length === 0) {
    const vazio = document.createElement("li");
    vazio.classList.add("painel-vazio");
    vazio.textContent = "Nenhuma venda registrada nesta data.";
    listaMaisVendidosPainel.appendChild(vazio);
    return;
  }

  itens.forEach((item, indice) => {
    const linha = document.createElement("li");
    const posicao = document.createElement("span");
    posicao.classList.add("mais-vendidos-posicao");
    posicao.textContent = String(indice + 1).padStart(2, "0");
    const nome = document.createElement("strong");
    nome.textContent = String(item.nome ?? "Produto");
    const quantidade = document.createElement("span");
    quantidade.classList.add("mais-vendidos-quantidade");
    quantidade.textContent = `${item.quantidade_vendida} un.`;
    linha.append(posicao, nome, quantidade);
    listaMaisVendidosPainel.appendChild(linha);
  });
}

async function carregarPainelAdmin() {
  if (!campoDataPainel.value) return;

  mensagemPainel.textContent = "Atualizando painel...";
  try {
    const token = sessionStorage.getItem("token");
    if (!token) throw new Error("Sessão expirada. Entre novamente.");

    const resposta = await fetch(
      `${API_PAINEL}?data=${encodeURIComponent(campoDataPainel.value)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const dados = await resposta.json();
    if (!resposta.ok) {
      throw new Error(dados.mensagem || "Não foi possível atualizar o painel.");
    }

    dadosPainel = dados;
    renderizarMesasPainel(dados.mesas || []);
    renderizarPedidosPainel();
    renderizarMaisVendidosPainel(dados.mais_vendidos || []);
    mensagemPainel.textContent = `Atualizado às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (erro) {
    mensagemPainel.textContent = erro.message;
    if (erro.message.includes("Sessão expirada")) {
      sessionStorage.clear();
      window.location.href = "/DonCabron/index/login.html";
    }
  }
}

campoDataPainel.value = dataLocalAtual();
document.querySelector("#atualizarPainel").addEventListener("click", carregarPainelAdmin);
campoDataPainel.addEventListener("change", carregarPainelAdmin);
carregarPainelAdmin();
window.setInterval(carregarPainelAdmin, 30000);