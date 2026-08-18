// // ========================================
// // IDENTIFICAR MESA PELA URL
// // ========================================

// const parametros =
//     new URLSearchParams(window.location.search);

// const mesaId =
//     parametros.get("mesa");


// if (!mesaId) {

//     alert("Nenhuma mesa foi informada.");

//     window.location.href =
//         "/DonCabron/index/mesas.html";

// }


// // ========================================
// // ELEMENTOS DA TELA
// // ========================================

// const numeroMesa =
//     document.querySelector("#numeroMesa");

// const numeroComanda =
//     document.querySelector("#numeroComanda");

// const listaProdutos =
//     document.querySelector("#listaProdutos");

// const listaItensEnviados =
//     document.querySelector("#listaItensEnviados");

// const listaPedidoAtual =
//     document.querySelector("#listaPedidoAtual");

// const totalPedido =
//     document.querySelector("#totalPedido");

// const btnConfirmarPedido =
//     document.querySelector("#btnConfirmarPedido");


// // ========================================
// // VARIÁVEIS
// // ========================================

// let comandaId = null;


// // Itens que JÁ foram enviados para a cozinha
// let itensEnviados = [];


// // Pedido que ainda está sendo montado
// let pedidoAtual = [];


// // ========================================
// // CARREGAR MESA
// // ========================================

// async function carregarMesa() {

//     try {

//         const resposta =
//             await fetch(
//                 "http://localhost:3000/mesas"
//             );


//         if (!resposta.ok) {

//             throw new Error(
//                 "Erro ao buscar mesas."
//             );

//         }


//         const mesas =
//             await resposta.json();


//         const mesa =
//             mesas.find(
//                 mesa =>
//                     mesa.id === Number(mesaId)
//             );


//         if (!mesa) {

//             throw new Error(
//                 "Mesa não encontrada."
//             );

//         }


//         numeroMesa.textContent =
//             mesa.numero;


//         console.log(
//             "Mesa selecionada:",
//             mesa
//         );


//     } catch (erro) {

//         console.error(
//             "Erro ao carregar mesa:",
//             erro
//         );

//         alert(
//             erro.message
//         );

//     }

// }


// // ========================================
// // ABRIR / RECUPERAR COMANDA
// // ========================================

// async function abrirComanda() {

//     try {

//         const resposta =
//             await fetch(
//                 "http://localhost:3000/comandas",
//                 {

//                     method: "POST",

//                     headers: {
//                         "Content-Type":
//                             "application/json"
//                     },

//                     body: JSON.stringify({

//                         mesa_id:
//                             Number(mesaId)

//                     })

//                 }
//             );


//         const dados =
//             await resposta.json();


//         if (!resposta.ok) {

//             throw new Error(
//                 dados.erro ||
//                 "Erro ao abrir comanda"
//             );

//         }


//         if (dados.comanda_id) {

//             comandaId =
//                 dados.comanda_id;

//         }

//         else if (dados.comanda) {

//             comandaId =
//                 dados.comanda.id;

//         }


//         if (!comandaId) {

//             throw new Error(
//                 "O backend não retornou o ID da comanda."
//             );

//         }


//         numeroComanda.textContent =
//             `#${comandaId}`;


//         console.log(
//             "Comanda atual:",
//             comandaId
//         );


//     } catch (erro) {

//         console.error(
//             "Erro ao abrir comanda:",
//             erro
//         );

//         alert(
//             erro.message
//         );

//     }

// }


// // ========================================
// // CARREGAR ITENS JÁ ENVIADOS
// // ========================================

// async function carregarItensEnviados() {

//     try {

//         const resposta =
//             await fetch(
//                 `http://localhost:3000/comandas/${comandaId}/itens`
//             );


//         if (!resposta.ok) {

//             throw new Error(
//                 "Erro ao buscar itens da comanda."
//             );

//         }


//         itensEnviados =
//             await resposta.json();


//         renderizarItensEnviados();


//     } catch (erro) {

//         console.error(
//             "Erro ao carregar itens:",
//             erro
//         );

//         listaItensEnviados.innerHTML = `

//             <p class="pedido-vazio">
//                 Não foi possível carregar
//                 os itens da comanda.
//             </p>

//         `;

//     }

// }


// // ========================================
// // MOSTRAR ITENS JÁ ENVIADOS
// // ========================================

// function renderizarItensEnviados() {

//     listaItensEnviados.innerHTML = "";


//     if (itensEnviados.length === 0) {

//         listaItensEnviados.innerHTML = `

//             <p class="pedido-vazio">
//                 Nenhum item enviado.
//             </p>

//         `;

//         return;

//     }


//     itensEnviados.forEach(item => {

//         const div =
//             document.createElement("div");


//         div.classList.add(
//             "item-pedido",
//             "item-bloqueado"
//         );


//         div.innerHTML = `

//             <div class="item-info">

//                 <strong>
//                     ${item.nome}
//                 </strong>

//                 <span>
//                     ${item.quantidade}x
//                     R$ ${Number(item.preco_unitario)
//                         .toFixed(2)
//                         .replace(".", ",")}
//                 </span>

//             </div>


//             <span class="item-lock">
                
//             </span>

//         `;


//         listaItensEnviados.appendChild(
//             div
//         );

//     });

// }


// // ========================================
// // CARREGAR PRODUTOS
// // ========================================

// async function carregarProdutos() {

//     try {

//         const resposta =
//             await fetch(
//                 "http://localhost:3000/produtos"
//             );


//         if (!resposta.ok) {

//             throw new Error(
//                 "Erro ao buscar produtos."
//             );

//         }


//         const produtos =
//             await resposta.json();


//         listaProdutos.innerHTML = "";


//         produtos.forEach(produto => {

//             const card =
//                 document.createElement("div");


//             card.classList.add(
//                 "produto-pedido"
//             );


//             card.innerHTML = `

//                 <img
//                     src="/DonCabron/img/Produtos/${produto.imagem}"
//                     alt="${produto.nome}"
//                 >

//                 <h3>
//                     ${produto.nome}
//                 </h3>

//                 <p>
//                     ${produto.descricao || ""}
//                 </p>

//                 <span class="preco-produto">

//                     R$
//                     ${Number(produto.preco)
//                         .toFixed(2)
//                         .replace(".", ",")}

//                 </span>


//                 <button
//                     class="btn-adicionar"
//                     type="button"
//                 >
//                     Adicionar
//                 </button>

//             `;


//             const botao =
//                 card.querySelector(
//                     ".btn-adicionar"
//                 );


//             botao.addEventListener(
//                 "click",
//                 () => {

//                     adicionarProduto(
//                         produto
//                     );

//                 }
//             );


//             listaProdutos.appendChild(
//                 card
//             );

//         });


//     } catch (erro) {

//         console.error(
//             "Erro ao carregar produtos:",
//             erro
//         );


//         listaProdutos.innerHTML = `

//             <p>
//                 Não foi possível carregar
//                 os produtos.
//             </p>

//         `;

//     }

// }


// // ========================================
// // ADICIONAR AO PEDIDO ATUAL
// // ========================================

// function adicionarProduto(produto) {

//     const itemExistente =
//         pedidoAtual.find(
//             item =>
//                 item.produto_id ===
//                 produto.id
//         );


//     if (itemExistente) {

//         itemExistente.quantidade++;

//     }

//     else {

//         pedidoAtual.push({

//             produto_id:
//                 produto.id,

//             nome:
//                 produto.nome,

//             preco:
//                 Number(produto.preco),

//             quantidade: 1

//         });

//     }


//     renderizarPedidoAtual();

// }


// // ========================================
// // RENDERIZAR PEDIDO ATUAL
// // ========================================

// function renderizarPedidoAtual() {

//     listaPedidoAtual.innerHTML = "";


//     if (pedidoAtual.length === 0) {

//         listaPedidoAtual.innerHTML = `

//             <p class="pedido-vazio">
//                 Nenhum produto adicionado.
//             </p>

//         `;

//         totalPedido.textContent =
//             "R$ 0,00";

//         btnConfirmarPedido.disabled =
//             true;

//         return;

//     }


//     let total = 0;


//     pedidoAtual.forEach(
//         (item, index) => {

//             total +=
//                 item.preco *
//                 item.quantidade;


//             const div =
//                 document.createElement("div");


//             div.classList.add(
//                 "item-pedido",
//                 "item-editavel"
//             );


//             div.innerHTML = `

//                 <div class="item-info">

//                     <strong>
//                         ${item.nome}
//                     </strong>

//                     <span>
//                         R$
//                         ${item.preco
//                             .toFixed(2)
//                             .replace(".", ",")}
//                         cada
//                     </span>

//                 </div>


//                 <div class="controles-quantidade">

//                     <button
//                         type="button"
//                         class="btn-quantidade"
//                         data-acao="diminuir"
//                     >
//                         −
//                     </button>


//                     <span class="quantidade">
//                         ${item.quantidade}
//                     </span>


//                     <button
//                         type="button"
//                         class="btn-quantidade"
//                         data-acao="aumentar"
//                     >
//                         +
//                     </button>

//                 </div>

//             `;


//             const botaoDiminuir =
//                 div.querySelector(
//                     '[data-acao="diminuir"]'
//                 );


//             const botaoAumentar =
//                 div.querySelector(
//                     '[data-acao="aumentar"]'
//                 );


//             botaoDiminuir.addEventListener(
//                 "click",
//                 () => {

//                     diminuirProduto(index);

//                 }
//             );


//             botaoAumentar.addEventListener(
//                 "click",
//                 () => {

//                     aumentarProduto(index);

//                 }
//             );


//             listaPedidoAtual.appendChild(
//                 div
//             );

//         }
//     );


//     totalPedido.textContent =
//         `R$ ${total
//             .toFixed(2)
//             .replace(".", ",")}`;


//     btnConfirmarPedido.disabled =
//         false;

// }


// // ========================================
// // AUMENTAR PRODUTO
// // ========================================

// function aumentarProduto(index) {

//     pedidoAtual[index].quantidade++;

//     renderizarPedidoAtual();

// }


// // ========================================
// // DIMINUIR PRODUTO
// // ========================================

// function diminuirProduto(index) {

//     const item =
//         pedidoAtual[index];


//     // Nunca permite quantidade negativa
//     if (item.quantidade <= 1) {

//         pedidoAtual.splice(
//             index,
//             1
//         );

//     }

//     else {

//         item.quantidade--;

//     }


//     renderizarPedidoAtual();

// }


// // ========================================
// // CONFIRMAR PEDIDO
// // ========================================

// btnConfirmarPedido.addEventListener(
//     "click",
//     confirmarPedido
// );


// // ========================================
// // CONFIRMAR PEDIDO
// // ========================================

// async function confirmarPedido() {

//     if (pedidoAtual.length === 0) {
//         return;
//     }


//     // ========================================
//     // MONTAR RESUMO
//     // ========================================

//     const resumo =
//         pedidoAtual
//             .map(
//                 item =>
//                     `${item.quantidade}x ${item.nome}`
//             )
//             .join("\n");


//     // ========================================
//     // CONFIRMAÇÃO DO GARÇOM
//     // ========================================

//     const confirmou =
//         confirm(
//             `CONFIRME O PEDIDO:\n\n` +
//             `${resumo}\n\n` +
//             `O cliente confirmou o pedido?`
//         );


//     if (!confirmou) {
//         return;
//     }


//     btnConfirmarPedido.disabled = true;

//     btnConfirmarPedido.textContent =
//         "Enviando...";


//     try {

//         // ========================================
//         // 1. ENVIAR ITENS PARA O PEDIDO PENDENTE
//         // ========================================

//         for (const item of pedidoAtual) {

//             const resposta =
//                 await fetch(
//                     `http://localhost:3000/comandas/${comandaId}/itens`,
//                     {

//                         method: "POST",

//                         headers: {
//                             "Content-Type":
//                                 "application/json"
//                         },

//                         body: JSON.stringify({

//                             produto_id:
//                                 item.produto_id,

//                             quantidade:
//                                 item.quantidade

//                         })

//                     }
//                 );


//             const dados =
//                 await resposta.json();


//             if (!resposta.ok) {

//                 throw new Error(
//                     dados.erro ||
//                     "Erro ao adicionar produto ao pedido."
//                 );

//             }

//         }


//         // ========================================
//         // 2. BUSCAR O PEDIDO PENDENTE
//         // ========================================

//         const respostaPedidos =
//             await fetch(
//                 `http://localhost:3000/comandas/${comandaId}/pedido-pendente`
//             );


//         const dadosPedido =
//             await respostaPedidos.json();


//         if (!respostaPedidos.ok) {

//             throw new Error(
//                 dadosPedido.erro ||
//                 "Não foi possível localizar o pedido."
//             );

//         }


//         const pedidoId =
//             dadosPedido.pedido_id;


//         // ========================================
//         // 3. CONFIRMAR O PEDIDO
//         // ========================================

//         const respostaConfirmacao =
//             await fetch(
//                 `http://localhost:3000/comandas/${comandaId}/pedido/${pedidoId}/confirmar`,
//                 {

//                     method: "PUT",

//                     headers: {
//                         "Content-Type":
//                             "application/json"
//                     }

//                 }
//             );


//         const dadosConfirmacao =
//             await respostaConfirmacao.json();


//         if (!respostaConfirmacao.ok) {

//             throw new Error(
//                 dadosConfirmacao.erro ||
//                 "Erro ao confirmar pedido."
//             );

//         }


//         // ========================================
//         // 4. PEDIDO FOI CONFIRMADO
//         // ========================================

//         alert(
//             "Pedido confirmado e enviado para a cozinha!"
//         );


//         // ========================================
//         // 5. LIMPAR PEDIDO ATUAL
//         // ========================================

//         pedidoAtual = [];


//         renderizarPedidoAtual();


//         // ========================================
//         // 6. RECARREGAR ITENS DA MESA
//         // ========================================

//         await carregarItensEnviados();


//     } catch (erro) {

//         console.error(
//             "Erro ao confirmar pedido:",
//             erro
//         );


//         alert(
//             erro.message ||
//             "Não foi possível confirmar o pedido."
//         );

//     }


//     btnConfirmarPedido.disabled = false;

//     btnConfirmarPedido.textContent =
//         "Confirmar pedido";

// }

// // ========================================
// // INICIAR
// // ========================================

// async function iniciarPedido() {

//     await carregarMesa();

//     await abrirComanda();

//     await carregarItensEnviados();

//     await carregarProdutos();

// }


// iniciarPedido();
// ============================================================
// PEDIDOS DA MESA
// ============================================================


// ============================================================
// CONFIGURAÇÃO
// ============================================================

const API = "http://localhost:3000";


// ============================================================
// ELEMENTOS DO HTML
// ============================================================

// ========================================
// IDENTIFICAR MESA PELA URL
// ========================================

const parametros =
    new URLSearchParams(window.location.search);

const mesaId =
    parametros.get("mesa");


if (!mesaId) {

    alert("Nenhuma mesa foi informada.");

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


// ========================================
// VARIÁVEIS
// ========================================

let comandaId = null;

// Itens que já foram enviados para a cozinha
let itensEnviados = [];

// Pedido que ainda está sendo montado
let pedidoAtual = [];


// ========================================
// CARREGAR / RECUPERAR COMANDA
// ========================================

async function abrirComanda() {

    try {

        const resposta =
            await fetch(
                `http://localhost:3000/mesas/${mesaId}/abrir`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                dados.erro ||
                "Erro ao abrir a mesa."
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


        alert(
            erro.message ||
            "Não foi possível abrir a comanda."
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
                `http://localhost:3000/mesas/${mesaId}/comanda/itens`
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar itens da mesa."
            );

        }


        itensEnviados =
            await resposta.json();


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
                "http://localhost:3000/produtos"
            );


        if (!resposta.ok) {

            throw new Error(
                "Erro ao buscar produtos."
            );

        }


        const produtos =
            await resposta.json();


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
        confirm(
            `CONFIRME O PEDIDO:\n\n` +
            `${resumo}\n\n` +
            `O cliente confirmou o pedido?`
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
                    `http://localhost:3000/comandas/${comandaId}/itens`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
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
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    dados.erro ||
                    "Erro ao adicionar produto ao pedido."
                );

            }

        }


        // ========================================
        // 2. BUSCAR PEDIDO PENDENTE
        // ========================================

        const respostaPedidos =
            await fetch(
                `http://localhost:3000/comandas/${comandaId}/pedido-pendente`
            );


        const dadosPedido =
            await respostaPedidos.json();


        if (!respostaPedidos.ok) {

            throw new Error(
                dadosPedido.erro ||
                "Não foi possível localizar o pedido."
            );

        }


        const pedidoId =
            dadosPedido.pedido_id;


        // ========================================
        // 3. CONFIRMAR PEDIDO
        // ========================================

        const respostaConfirmacao =
            await fetch(
                `http://localhost:3000/comandas/${comandaId}/pedido/${pedidoId}/confirmar`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }

                }
            );


        const dadosConfirmacao =
            await respostaConfirmacao.json();


        if (!respostaConfirmacao.ok) {

            throw new Error(
                dadosConfirmacao.erro ||
                "Erro ao confirmar pedido."
            );

        }


        // ========================================
        // 4. PEDIDO CONFIRMADO
        // ========================================

        alert(
            "Pedido confirmado e enviado para a cozinha!"
        );


        // ========================================
        // 5. LIMPAR PEDIDO ATUAL
        // ========================================

        pedidoAtual = [];


        renderizarPedidoAtual();


        // ========================================
        // 6. RECARREGAR ITENS ENVIADOS
        // ========================================

        await carregarItensEnviados();


    } catch (erro) {

        console.error(
            "Erro ao confirmar pedido:",
            erro
        );


        alert(
            erro.message ||
            "Não foi possível confirmar o pedido."
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