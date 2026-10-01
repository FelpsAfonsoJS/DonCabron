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

    const itens = pedido.itens.map(item => `
        <li>
            <span>${item.produto}</span>
            <span class="quantidade">${item.quantidade}x</span>
        </li>
    `).join("");

    let botao = "";

    if (pedido.status === "RECEBIDO") {
        botao = `
            <button class="btn-status" data-acao="preparo" data-id="${pedido.pedido_id}">
                👨‍🍳 Iniciar preparo
            </button>
        `;
    } else if (pedido.status === "EM_PREPARO") {
        botao = `
            <button class="btn-status" data-acao="pronto" data-id="${pedido.pedido_id}">
                ✓ Marcar como pronto
            </button>
        `;
    }

    card.innerHTML = `
        <div class="pedido-topo">
            <strong>Mesa ${pedido.mesa}</strong>
            <small>Pedido #${pedido.pedido_id} • ${formatarData(pedido.data_pedido)}</small>
        </div>

        <ul class="pedido-itens">
            ${itens}
        </ul>

        ${botao}
    `;

    const botaoStatus = card.querySelector(".btn-status");

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
