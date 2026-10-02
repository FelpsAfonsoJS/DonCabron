const API = "http://localhost:3000";

const listas = {
    RECEBIDO: document.querySelector("#listaRecebidos"),
    EM_PREPARO: document.querySelector("#listaPreparo"),
    PRONTO: document.querySelector("#listaProntos")
};

const contadores = {
    RECEBIDO: document.querySelector("#contadorRecebidos"),
    EM_PREPARO: document.querySelector("#contadorPreparo"),
    PRONTO: document.querySelector("#contadorProntos")
};

const mensagem = document.querySelector("#mensagemCozinha");
const btnAtualizar = document.querySelector("#btnAtualizar");
const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");

if (usuario?.nome) {
    document.querySelector("#usuarioCozinha").textContent =
        `Cozinha • ${usuario.nome}`;
}

function headersAutenticados() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        throw new Error("Sessão expirada.");
    }

    return {
        Authorization: `Bearer ${token}`
    };
}

async function lerJson(resposta) {
    const texto = await resposta.text();

    if (!texto) return {};

    try {
        return JSON.parse(texto);
    } catch {
        throw new Error(`Resposta inválida do servidor (HTTP ${resposta.status}).`);
    }
}

function formatarData(data) {
    if (!data) return "";
    const dataObj = new Date(data);
    if (Number.isNaN(dataObj.getTime())) return "";
    return dataObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function criarPedidoCard(pedido) {
    const card = document.createElement("article");
    card.className = "pedido-card";

    const topo = document.createElement("div");
    topo.classList.add("pedido-topo");
    const mesa = document.createElement("strong");
    mesa.textContent = `Mesa ${pedido.mesa}`;
    const detalhes = document.createElement("small");
    detalhes.textContent = `Pedido #${pedido.pedido_id} - ${formatarData(pedido.data_pedido)}`;
    topo.append(mesa, detalhes);

    const listaItens = document.createElement("ul");
    listaItens.classList.add("pedido-itens");
    pedido.itens.forEach((item) => {
        const linha = document.createElement("li");
        const nome = document.createElement("span");
        nome.textContent = String(item.produto ?? "Produto");
        const quantidade = document.createElement("span");
        quantidade.classList.add("quantidade");
        quantidade.textContent = `${item.quantidade}x`;
        linha.append(nome, quantidade);
        listaItens.appendChild(linha);
    });

    card.append(topo, listaItens);
    let botaoStatus;
    if (pedido.status === "RECEBIDO" || pedido.status === "EM_PREPARO") {
        botaoStatus = document.createElement("button");
        botaoStatus.classList.add("btn-status");
        botaoStatus.dataset.acao = pedido.status === "RECEBIDO" ? "preparo" : "pronto";
        botaoStatus.dataset.id = String(pedido.pedido_id);
        botaoStatus.textContent = pedido.status === "RECEBIDO"
            ? "Iniciar preparo"
            : "Marcar como pronto";
        card.appendChild(botaoStatus);
    }

    if (botaoStatus) {
        botaoStatus.addEventListener("click", () => {
            alterarStatusPedido(
                Number(botaoStatus.dataset.id),
                botaoStatus.dataset.acao,
                botaoStatus
            );
        });
    }

    return card;
}

function renderizar(pedidos) {
    Object.values(listas).forEach(lista => {
        lista.innerHTML = "";
    });

    Object.values(contadores).forEach(contador => {
        contador.textContent = "0";
    });

    pedidos.forEach(pedido => {
        const lista = listas[pedido.status];

        if (!lista) return;

        lista.appendChild(criarPedidoCard(pedido));

        const contador = contadores[pedido.status];
        contador.textContent =
            String(Number(contador.textContent) + 1);
    });

    Object.entries(listas).forEach(([status, lista]) => {
        if (lista.children.length === 0) {
            const vazio = document.createElement("p");
            vazio.className = "vazio";
            vazio.textContent =
                status === "RECEBIDO"
                    ? "Nenhum pedido aguardando."
                    : status === "EM_PREPARO"
                        ? "Nenhum pedido em preparo."
                        : "Nenhum pedido pronto.";
            lista.appendChild(vazio);
        }
    });
}

async function carregarPedidos() {
    try {
        mensagem.textContent = "Atualizando pedidos...";

        const resposta = await fetch(
            `${API}/comandas/cozinha/pedidos`,
            { headers: headersAutenticados() }
        );

        const dados = await lerJson(resposta);

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.mensagem || "Não foi possível buscar os pedidos."
            );
        }

        renderizar(dados);
        mensagem.textContent =
            `Última atualização: ${new Date().toLocaleTimeString("pt-BR")}`;

    } catch (erro) {
        console.error("Erro ao carregar cozinha:", erro);
        mensagem.textContent = erro.message;

        if (erro.message.includes("Sessão")) {
            sessionStorage.clear();
            window.location.href = "/DonCabron/index/login.html";
        }
    }
}

async function alterarStatusPedido(pedidoId, acao, botao) {
    const confirmou = await confirmarAcao(
        acao === "preparo"
            ? "Iniciar o preparo deste pedido?"
            : "Marcar este pedido como pronto?",
        "Atualizar pedido"
    );

    if (!confirmou) return;

    botao.disabled = true;
    botao.textContent = "Atualizando...";

    const rota =
        acao === "preparo"
            ? "preparo"
            : "pronto";

    try {
        const resposta = await fetch(
            `${API}/comandas/cozinha/pedido/${pedidoId}/${rota}`,
            {
                method: "PUT",
                headers: headersAutenticados()
            }
        );

        const dados = await lerJson(resposta);

        if (!resposta.ok) {
            throw new Error(
                dados.erro || dados.mensagem || "Não foi possível atualizar o pedido."
            );
        }

        await carregarPedidos();

    } catch (erro) {
        console.error("Erro ao alterar status:", erro);
        await mostrarAlerta(erro.message || "Não foi possível atualizar o pedido.", "Erro no pedido");
        botao.disabled = false;
        botao.textContent =
            acao === "preparo"
                ? "👨‍🍳 Iniciar preparo"
                : "✓ Marcar como pronto";
    }
}

btnAtualizar.addEventListener("click", carregarPedidos);

// Atualiza automaticamente para a cozinha não precisar dar F5.
carregarPedidos();
setInterval(carregarPedidos, 5000);
