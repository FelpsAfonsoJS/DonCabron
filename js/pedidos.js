// ========================================
// IDENTIFICAR MESA PELA URL
// ========================================

const parametros =
    new URLSearchParams(window.location.search);

const mesaId =
    parametros.get("mesa");

// O frontend pode ser aberto pelo Live Server; a API continua no backend.
const API = "http://localhost:3000";

function obterCabecalhosAutenticados(incluirJson = false) {

    const token = sessionStorage.getItem("token");

    if (!token) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
    }

    const cabecalhos = {
        Authorization: `Bearer ${token}`
    };

    if (incluirJson) {
        cabecalhos["Content-Type"] = "application/json";
    }

    return cabecalhos;
}

function mensagemDaResposta(dados, mensagemPadrao) {
    return dados.erro || dados.mensagem || mensagemPadrao;
}

async function lerRespostaJson(resposta) {

    const texto = await resposta.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch {
        throw new Error(
            `O servidor retornou uma resposta inválida (HTTP ${resposta.status}).`
        );
    }
}


if (!mesaId) {

    mostrarAlerta("Nenhuma mesa foi informada.", "Mesa não informada");

    window.location.href =
        "/DonCabron/index/mesas.html";

}


// ========================================
// ELEMENTOS DA TELA
// ========================================

const numeroMesa =
    document.querySelector("#numeroMesa");

const numeroComanda =
    document.querySelector("#numeroComanda");

const listaProdutos =
    document.querySelector("#listaProdutos");

const listaItensEnviados =
    document.querySelector("#listaItensEnviados");

const listaPedidoAtual =
    document.querySelector("#listaPedidoAtual");

const totalPedido =
    document.querySelector("#totalPedido");

const btnConfirmarPedido =
    document.querySelector("#btnConfirmarPedido");

const btnLiberarMesa =
    document.querySelector("#btnLiberarMesa");


// ========================================
// VARIÁVEIS
// ========================================

let comandaId = null;

// Itens que já foram enviados para a cozinha
let itensEnviados = [];

// Pedido que ainda está sendo montado
let pedidoAtual = [];


function atualizarOpcaoLiberarMesa(podeLiberar) {

    btnLiberarMesa.hidden = !podeLiberar;

}


async function liberarMesaSemPedidos() {

    const confirmou = await confirmarAcao(
        "Liberar esta mesa? A comanda vazia será fechada e não poderá receber pedidos.",
        "Liberar mesa"
    );

    if (!confirmou) {
        return;
    }

    btnLiberarMesa.disabled = true;

    try {

        const resposta = await fetch(
            `${API}/mesas/${mesaId}/liberar-sem-pedidos`,
            {
                method: "POST",
                headers: obterCabecalhosAutenticados()
            }
        );

        const dados = await lerRespostaJson(resposta);

        if (!resposta.ok) {
            throw new Error(
                mensagemDaResposta(
                    dados,
                    "Não foi possível liberar a mesa."
                )
            );
        }

        await mostrarAlerta("Mesa liberada com sucesso.", "Mesa liberada");
        window.location.href = "/DonCabron/index/mesas.html";

    } catch (erro) {

        console.error("Erro ao liberar mesa:", erro);
        await mostrarAlerta(erro.message || "Não foi possível liberar a mesa.", "Erro ao liberar mesa");
        btnLiberarMesa.disabled = false;

    }

}


btnLiberarMesa.addEventListener(
    "click",
    liberarMesaSemPedidos
);


// ========================================
// CARREGAR / RECUPERAR COMANDA
// ========================================

async function abrirComanda() {

    try {

        const resposta =
    await fetch(
        `${API}/mesas/${mesaId}/abrir`,
        {
            method: "POST",
            headers: {
                ...obterCabecalhosAutenticados()
            }
        }
    );


        const dados =
            await lerRespostaJson(resposta);


        if (!resposta.ok) {

            throw new Error(
                mensagemDaResposta(
                    dados,
                    "Erro ao abrir a mesa."
                )
            );

        }


        // ========================================
        // PEGAR ID DA COMANDA
        // ========================================

        if (dados.comanda_id) {

            comandaId =
                dados.comanda_id;

        }

        else if (dados.comanda) {

            comandaId =
                dados.comanda.id;

        }


        if (!comandaId) {

            throw new Error(
                "O backend não retornou o ID da comanda."
            );

        }


        // ========================================
        // MOSTRAR NÚMERO DA MESA
        // ========================================

        if (dados.mesa) {

            numeroMesa.textContent =
                dados.mesa.numero;

        }


        // ========================================
        // MOSTRAR NÚMERO DA COMANDA
        // ========================================

        numeroComanda.textContent =
            `#${comandaId}`;

        atualizarOpcaoLiberarMesa(
            dados.pode_liberar === true
        );


        console.log(
            "Mesa atual:",
            dados.mesa
        );


        console.log(
            "Comanda atual:",
            comandaId
        );


    } catch (erro) {

        console.error(
            "Erro ao abrir/recuperar comanda:",
            erro
        );


        await mostrarAlerta(
            erro.message ||
            "Não foi possível abrir a comanda.",
            "Erro ao abrir comanda"
        );


        window.location.href =
            "/DonCabron/index/mesas.html";

    }

}


// ========================================
// CARREGAR ITENS JÁ ENVIADOS
// ========================================

async function carregarItensEnviados() {

    try {

        const resposta =
            await fetch(
                `${API}/mesas/${mesaId}/comanda/itens`,
                {
                    headers: obterCabecalhosAutenticados()
                }
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar itens da mesa."
            );

        }


        itensEnviados =
            await lerRespostaJson(resposta);


        renderizarItensEnviados();


    } catch (erro) {

        console.error(
            "Erro ao carregar itens:",
            erro
        );


        listaItensEnviados.innerHTML = `

            <p class="pedido-vazio">
                Não foi possível carregar
                os itens da comanda.
            </p>

        `;

    }

}

// ========================================
// MOSTRAR ITENS JÁ ENVIADOS
// ========================================

// ========================================
// MOSTRAR ITENS JÁ ENVIADOS
// AGRUPANDO PRODUTOS IGUAIS
// ========================================

// ========================================
// MOSTRAR ITENS JÁ ENVIADOS
// AGRUPANDO PRODUTOS IGUAIS
// ========================================

function renderizarItensEnviados() {

    listaItensEnviados.innerHTML = "";

    if (itensEnviados.length === 0) {

        listaItensEnviados.innerHTML = `
            <p class="pedido-vazio">
                Nenhum item enviado.
            </p>
        `;

        return;
    }


    // ========================================
    // AGRUPAR PRODUTOS IGUAIS
    // ========================================

    const itensAgrupados = {};

    itensEnviados.forEach(item => {

        const produtoId =
            Number(item.produto_id);

        const nomeProduto =
            item.nome ||
            item.produto ||
            "Produto";

        const preco =
            Number(
                item.preco_unitario ||
                item.preco ||
                0
            );

        const quantidade =
            Number(item.quantidade);


        if (!itensAgrupados[produtoId]) {

            itensAgrupados[produtoId] = {

                produto_id:
                    produtoId,

                nome:
                    nomeProduto,

                quantidade:
                    quantidade,

                preco_unitario:
                    preco

            };

        } else {

            itensAgrupados[produtoId].quantidade +=
                quantidade;

        }

    });


    // ========================================
    // MOSTRAR PRODUTOS AGRUPADOS
    // ========================================

    Object.values(itensAgrupados).forEach(item => {

        const div =
            document.createElement("div");


        div.classList.add(
            "item-pedido",
            "item-bloqueado"
        );


        div.innerHTML = `

            <div class="item-info">

                <strong>
                    ${item.nome}
                </strong>

                <span>
                    ${item.quantidade}x
                    R$ ${item.preco_unitario
                        .toFixed(2)
                        .replace(".", ",")}
                </span>

            </div>

            <span class="item-lock"></span>

        `;


        listaItensEnviados.appendChild(div);

    });

}

// ========================================
// CARREGAR PRODUTOS
// ========================================

async function carregarProdutos() {

    try {

        const resposta =
            await fetch(
                `${API}/produtos`
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar produtos."
            );

        }


        const produtos =
            await lerRespostaJson(resposta);


        listaProdutos.innerHTML = "";


        produtos.forEach(produto => {

            const card =
                document.createElement("div");


            card.classList.add(
                "produto-pedido"
            );


            card.innerHTML = `

                <img
                    src="/DonCabron/img/Produtos/${produto.imagem}"
                    alt="${produto.nome}"
                >

                <h3>
                    ${produto.nome}
                </h3>

                <p>
                    ${produto.descricao || ""}
                </p>

                <span class="preco-produto">

                    R$
                    ${Number(produto.preco)
                        .toFixed(2)
                        .replace(".", ",")}

                </span>


                <button
                    class="btn-adicionar"
                    type="button"
                >
                    Adicionar
                </button>

            `;


            const botao =
                card.querySelector(
                    ".btn-adicionar"
                );


            botao.addEventListener(
                "click",
                () => {

                    adicionarProduto(
                        produto
                    );

                }
            );


            listaProdutos.appendChild(
                card
            );

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar produtos:",
            erro
        );


        listaProdutos.innerHTML = `

            <p>
                Não foi possível carregar
                os produtos.
            </p>

        `;

    }

}


// ========================================
// ADICIONAR PRODUTO AO PEDIDO ATUAL
// ========================================

function adicionarProduto(produto) {

    const itemExistente =
        pedidoAtual.find(
            item =>
                item.produto_id ===
                produto.id
        );


    if (itemExistente) {

        itemExistente.quantidade++;

    }

    else {

        pedidoAtual.push({

            produto_id:
                produto.id,

            nome:
                produto.nome,

            preco:
                Number(produto.preco),

            quantidade: 1

        });

    }


    renderizarPedidoAtual();

}


// ========================================
// RENDERIZAR PEDIDO ATUAL
// ========================================

function renderizarPedidoAtual() {

    listaPedidoAtual.innerHTML = "";


    if (pedidoAtual.length === 0) {

        listaPedidoAtual.innerHTML = `

            <p class="pedido-vazio">
                Nenhum produto adicionado.
            </p>

        `;

        totalPedido.textContent =
            "R$ 0,00";

        btnConfirmarPedido.disabled =
            true;

        return;

    }


    let total = 0;


    pedidoAtual.forEach(
        (item, index) => {

            total +=
                item.preco *
                item.quantidade;


            const div =
                document.createElement("div");


            div.classList.add(
                "item-pedido",
                "item-editavel"
            );


            div.innerHTML = `

                <div class="item-info">

                    <strong>
                        ${item.nome}
                    </strong>

                    <span>
                        R$
                        ${item.preco
                            .toFixed(2)
                            .replace(".", ",")}
                        cada
                    </span>

                </div>


                <div class="controles-quantidade">

                    <button
                        type="button"
                        class="btn-quantidade"
                        data-acao="diminuir"
                    >
                        −
                    </button>


                    <span class="quantidade">
                        ${item.quantidade}
                    </span>


                    <button
                        type="button"
                        class="btn-quantidade"
                        data-acao="aumentar"
                    >
                        +
                    </button>

                </div>

            `;


            const botaoDiminuir =
                div.querySelector(
                    '[data-acao="diminuir"]'
                );


            const botaoAumentar =
                div.querySelector(
                    '[data-acao="aumentar"]'
                );


            botaoDiminuir.addEventListener(
                "click",
                () => {

                    diminuirProduto(index);

                }
            );


            botaoAumentar.addEventListener(
                "click",
                () => {

                    aumentarProduto(index);

                }
            );


            listaPedidoAtual.appendChild(
                div
            );

        }
    );


    totalPedido.textContent =
        `R$ ${total
            .toFixed(2)
            .replace(".", ",")}`;


    btnConfirmarPedido.disabled =
        false;

}


// ========================================
// AUMENTAR PRODUTO
// ========================================

function aumentarProduto(index) {

    pedidoAtual[index].quantidade++;

    renderizarPedidoAtual();

}


// ========================================
// DIMINUIR PRODUTO
// ========================================

function diminuirProduto(index) {

    const item =
        pedidoAtual[index];


    if (item.quantidade <= 1) {

        pedidoAtual.splice(
            index,
            1
        );

    }

    else {

        item.quantidade--;

    }


    renderizarPedidoAtual();

}


// ========================================
// CONFIRMAR PEDIDO
// ========================================

btnConfirmarPedido.addEventListener(
    "click",
    confirmarPedido
);


// ========================================
// CONFIRMAR PEDIDO
// ========================================

async function confirmarPedido() {

    if (pedidoAtual.length === 0) {
        return;
    }


    // ========================================
    // MONTAR RESUMO
    // ========================================

    const resumo =
        pedidoAtual
            .map(
                item =>
                    `${item.quantidade}x ${item.nome}`
            )
            .join("\n");


    // ========================================
    // CONFIRMAR
    // ========================================

    const confirmou =
        await confirmarAcao(
            `CONFIRME O PEDIDO:\n\n` +
            `${resumo}\n\n` +
            `O cliente confirmou o pedido?`,
            "Confirmar pedido"
        );


    if (!confirmou) {
        return;
    }


    btnConfirmarPedido.disabled =
        true;


    btnConfirmarPedido.textContent =
        "Enviando...";


    try {

        // ========================================
        // 1. ADICIONAR ITENS AO PEDIDO PENDENTE
        // ========================================

        for (const item of pedidoAtual) {

            const resposta =
                await fetch(
                    `${API}/comandas/${comandaId}/itens`,
                    {

                        method: "POST",

                        headers: {
                            ...obterCabecalhosAutenticados(true)
                        },

                        body: JSON.stringify({

                            produto_id:
                                item.produto_id,

                            quantidade:
                                item.quantidade

                        })

                    }
                );


            const dados =
                await lerRespostaJson(resposta);


            if (!resposta.ok) {

                throw new Error(
                    mensagemDaResposta(
                        dados,
                        "Erro ao adicionar produto ao pedido."
                    )
                );

            }

        }


        // ========================================
        // 2. BUSCAR PEDIDO PENDENTE
        // ========================================

        const respostaPedidos =
            await fetch(
                `${API}/comandas/${comandaId}/pedido-pendente`,
                {
                    headers: obterCabecalhosAutenticados()
                }
            );


        const dadosPedido =
            await lerRespostaJson(respostaPedidos);


        if (!respostaPedidos.ok) {

            throw new Error(
                mensagemDaResposta(
                    dadosPedido,
                    "Não foi possível localizar o pedido."
                )
            );

        }


        const pedidoId =
            dadosPedido.pedido_id;


        // ========================================
        // 3. CONFIRMAR PEDIDO
        // ========================================

        const respostaConfirmacao =
            await fetch(
                `${API}/comandas/${comandaId}/pedido/${pedidoId}/confirmar`,
                {

                    method: "PUT",

                    headers: {
                        ...obterCabecalhosAutenticados(true)
                    }

                }
            );


        const dadosConfirmacao =
            await lerRespostaJson(respostaConfirmacao);


        if (!respostaConfirmacao.ok) {

            throw new Error(
                mensagemDaResposta(
                    dadosConfirmacao,
                    "Erro ao confirmar pedido."
                )
            );

        }


        // ========================================
        // 4. PEDIDO CONFIRMADO
        // ========================================

        await mostrarAlerta(
            "Pedido confirmado e enviado para a cozinha!",
            "Pedido confirmado"
        );


        // ========================================
        // 5. LIMPAR PEDIDO ATUAL
        // ========================================

        pedidoAtual = [];


        renderizarPedidoAtual();

        // Após o primeiro envio, a comanda não pode mais ser liberada.
        atualizarOpcaoLiberarMesa(false);


        // ========================================
        // 6. RECARREGAR ITENS ENVIADOS
        // ========================================

        await carregarItensEnviados();


    } catch (erro) {

        console.error(
            "Erro ao confirmar pedido:",
            erro
        );


        await mostrarAlerta(
            erro.message ||
            "Não foi possível confirmar o pedido.",
            "Erro ao confirmar pedido"
        );

    }


    btnConfirmarPedido.disabled =
        false;


    btnConfirmarPedido.textContent =
        "Confirmar pedido";

}


// ========================================
// INICIAR PEDIDO
// ========================================

async function iniciarPedido() {

    await abrirComanda();


    if (!comandaId) {
        return;
    }


    await carregarItensEnviados();

    await carregarProdutos();

    renderizarPedidoAtual();

}


iniciarPedido();
