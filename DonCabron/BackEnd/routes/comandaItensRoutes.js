// const express = require("express");
// const router = express.Router();

// const conexao = require("../config/database");


// router.post("/:comanda_id/itens", async (req, res) => {

//     try {

//         const { comanda_id } = req.params;
//         const { produto_id, quantidade } = req.body;


//         if (!produto_id || quantidade === undefined) {

//             return res.status(400).json({
//                 erro: "Produto e quantidade são obrigatórios"
//             });

//         }
//         const quantidadeNumero = Number(quantidade);

//         if (
//             !Number.isInteger(quantidadeNumero) ||
//             quantidadeNumero <= 0
//         ) {

//             return res.status(400).json({
//                 erro: "A quantidade deve ser um número inteiro maior que zero"
//             });

//         }

//         const [comandas] = await conexao.query(
//             `
//             SELECT id, mesa_id, status
//             FROM comandas
//             WHERE id = ?
//             AND status = 'ABERTA'
//             `,
//             [comanda_id]
//         );

//         if (comandas.length === 0) {

//             return res.status(404).json({
//                 erro: "Comanda não encontrada ou está fechada"
//             });

//         }

//         let [pedidos] = await conexao.query(
//             `
//             SELECT id, comanda_id, status
//             FROM pedidos
//             WHERE comanda_id = ?
//             AND status = 'PENDENTE'
//             ORDER BY id DESC
//             LIMIT 1
//             `,
//             [comanda_id]
//         );

//         let pedido;

//         if (pedidos.length > 0) {

//             pedido = pedidos[0];

//         } else {

//             const [resultadoPedido] = await conexao.query(
//                 `
//                 INSERT INTO pedidos
//                 (
//                     comanda_id,
//                     status
//                 )
//                 VALUES (?, 'PENDENTE')
//                 `,
//                 [comanda_id]
//             );

//             pedido = {
//                 id: resultadoPedido.insertId,
//                 comanda_id: Number(comanda_id),
//                 status: "PENDENTE"
//             };

//         }

//         const [produtos] = await conexao.query(
//             `
//             SELECT id, nome, preco
//             FROM produtos
//             WHERE id = ?
//             `,
//             [produto_id]
//         );

//         if (produtos.length === 0) {

//             return res.status(404).json({
//                 erro: "Produto não encontrado"
//             });

//         }

//         const produto = produtos[0];
    
//         const [itensExistentes] = await conexao.query(
//             `
//             SELECT id, quantidade
//             FROM itens_comanda
//             WHERE pedido_id = ?
//             AND produto_id = ?
//             `,
//             [
//                 pedido.id,
//                 produto_id
//             ]
//         );

//         if (itensExistentes.length > 0) {

//             const item = itensExistentes[0];

//             const novaQuantidade =
//                 Number(item.quantidade) + quantidadeNumero;


//             await conexao.query(
//                 `
//                 UPDATE itens_comanda
//                 SET quantidade = ?
//                 WHERE id = ?
//                 `,
//                 [
//                     novaQuantidade,
//                     item.id
//                 ]
//             );

//             return res.json({

//                 mensagem: "Quantidade atualizada no pedido",

//                 pedido_id: pedido.id,

//                 item_id: item.id,

//                 comanda_id: Number(comanda_id),

//                 produto_id: produto.id,

//                 produto: produto.nome,

//                 quantidade: novaQuantidade,

//                 preco_unitario: produto.preco

//             });

//         }

//         const [resultado] = await conexao.query(
//             `
//             INSERT INTO itens_comanda
//             (
//                 pedido_id,
//                 comanda_id,
//                 produto_id,
//                 quantidade,
//                 quantidade_paga,
//                 preco_unitario,
//                 valor_pago
//             )
//             VALUES (?, ?, ?, ?, 0, ?, 0.00)
//             `,
//             [
//                 pedido.id,
//                 comanda_id,
//                 produto_id,
//                 quantidadeNumero,
//                 produto.preco
//             ]
//         );

//         return res.status(201).json({
//             mensagem: "Produto adicionado ao pedido",
//             pedido_id: pedido.id,
//             item_id: resultado.insertId,
//             comanda_id: Number(comanda_id),
//             produto_id: produto.id,
//             produto: produto.nome,
//             quantidade: quantidadeNumero,
//             preco_unitario: produto.preco
//         });


//     } catch (erro) {
//         console.error(
//             "Erro ao adicionar produto ao pedido:",
//             erro
//         );


//         return res.status(500).json({
//             erro: "Erro interno ao adicionar produto ao pedido"
//         });
//     }
// });

// router.get("/:comanda_id/itens", async (req, res) => {
//     try {
//         const { comanda_id } = req.params;
//         const [comandas] = await conexao.query(
//             `
//             SELECT id, mesa_id, status
//             FROM comandas
//             WHERE id = ?
//             `,
//             [comanda_id]
//         );


//         if (comandas.length === 0) {
//             return res.status(404).json({
//                 erro: "Comanda não encontrada"
//             });
//         }
//         const [itens] = await conexao.query(
//             `
//             SELECT
//                 ic.produto_id,
//                 p.nome,
//                 SUM(ic.quantidade) AS quantidade,
//                 MAX(ic.preco_unitario) AS preco_unitario,
//                 SUM(
//                     ic.quantidade * ic.preco_unitario
//                 ) AS total
//             FROM itens_comanda ic
//             INNER JOIN produtos p
//                 ON p.id = ic.produto_id
//             INNER JOIN pedidos pe
//                 ON pe.id = ic.pedido_id
//             WHERE ic.comanda_id = ?
//             AND pe.status IN (
//                 'RECEBIDO',
//                 'EM_PREPARO',
//                 'PRONTO',
//                 'ENTREGUE'
//             )
//             GROUP BY
//                 ic.produto_id,
//                 p.nome
//             ORDER BY
//                 p.nome ASC
//             `,
//             [comanda_id]
//         );

//         return res.json(itens);

//     } catch (erro) {
//         console.error(
//             "Erro ao buscar itens da comanda:",
//             erro
//         );

//         return res.status(500).json({
//             erro: "Erro ao buscar itens da comanda"
//         });

//     }

// });

// router.get("/:comanda_id/pedido-pendente", async (req, res) => {
//     try {
//         const { comanda_id } = req.params;
//         const [pedidos] = await conexao.query(
//             `
//             SELECT
//                 id,
//                 comanda_id,
//                 status
//             FROM pedidos
//             WHERE comanda_id = ?
//             AND status = 'PENDENTE'
//             ORDER BY id DESC
//             LIMIT 1
//             `,
//             [comanda_id]
//         );

//         if (pedidos.length === 0) {
//             return res.status(404).json({
//                 erro: "Nenhum pedido pendente encontrado"
//             });
//         }

//         return res.json({
//             pedido_id: pedidos[0].id,
//             comanda_id: pedidos[0].comanda_id,
//             status: pedidos[0].status
//         });


//     } catch (erro) {
//         console.error(
//             "Erro ao buscar pedido pendente:",
//             erro
//         );

//         return res.status(500).json({
//             erro: "Erro ao buscar pedido pendente"
//         });
//     }
// });

// router.put(
//     "/:comanda_id/pedido/:pedido_id/confirmar",
//     async (req, res) => {
//         try {
//             const {
//                 comanda_id,
//                 pedido_id
//             } = req.params;

//             const [comandas] = await conexao.query(
//                 `
//                 SELECT
//                     id,
//                     mesa_id,
//                     status
//                 FROM comandas
//                 WHERE id = ?
//                 AND status = 'ABERTA'
//                 `,
//                 [comanda_id]
//             );

//             if (comandas.length === 0) {
//                 return res.status(404).json({
//                     erro: "Comanda não encontrada ou está fechada"
//                 });
//             }

//             const [pedidos] = await conexao.query(
//                 `
//                 SELECT
//                     id,
//                     comanda_id,
//                     status
//                 FROM pedidos
//                 WHERE id = ?
//                 AND comanda_id = ?
//                 AND status = 'PENDENTE'
//                 `,
//                 [
//                     pedido_id,
//                     comanda_id
//                 ]
//             );

//             if (pedidos.length === 0) {
//                 return res.status(404).json({
//                     erro: "Pedido não encontrado ou já foi confirmado"
//                 });
//             }

//             const [itens] = await conexao.query(
//                 `
//                 SELECT id
//                 FROM itens_comanda
//                 WHERE pedido_id = ?
//                 `,
//                 [pedido_id]
//             );

//             if (itens.length === 0) {
//                 return res.status(400).json({
//                     erro: "O pedido não possui itens"
//                 });
//             }

//             await conexao.query(
//                 `
//                 UPDATE pedidos
//                 SET status = 'RECEBIDO'
//                 WHERE id = ?
//                 AND status = 'PENDENTE'
//                 `,
//                 [pedido_id]
//             );

//             return res.json({
//                 mensagem:
//                     "Pedido confirmado e enviado para a cozinha",
//                 pedido_id:
//                     Number(pedido_id),
//                 comanda_id:
//                     Number(comanda_id),
//                 mesa_id:
//                     comandas[0].mesa_id,
//                 status:
//                     "RECEBIDO"
//             });

//         } catch (erro) {
//             console.error(
//                 "Erro ao confirmar pedido:",
//                 erro
//             );

//             return res.status(500).json({
//                 erro: "Erro ao confirmar pedido"
//             });
//         }

//     }
// );

// router.get("/cozinha/pedidos", async (req, res) => {
//     try {
//         const [pedidos] = await conexao.query(
//             `
//             SELECT
//                 pe.id AS pedido_id,
//                 pe.comanda_id,
//                 c.mesa_id,
//                 m.numero AS mesa,
//                 pe.data_pedido,
//                 pe.status,

//                 ic.produto_id,
//                 p.nome AS produto,
//                 p.categoria,
//                 ic.quantidade,
//                 ic.preco_unitario

//             FROM pedidos pe
//             INNER JOIN comandas c
//                 ON c.id = pe.comanda_id
//             INNER JOIN mesas m
//                 ON m.id = c.mesa_id
//             INNER JOIN itens_comanda ic
//                 ON ic.pedido_id = pe.id
//             INNER JOIN produtos p
//                 ON p.id = ic.produto_id
//             WHERE pe.status = 'RECEBIDO'
//             ORDER BY
//                 pe.data_pedido ASC,
//                 pe.id ASC
//             `
//         );

//         const pedidosAgrupados = {};
//         pedidos.forEach(item => {
//             if (!pedidosAgrupados[item.pedido_id]) {
//                 pedidosAgrupados[item.pedido_id] = {
//                     pedido_id: item.pedido_id,
//                     comanda_id: item.comanda_id,
//                     mesa_id: item.mesa_id,
//                     mesa: item.mesa,
//                     data_pedido: item.data_pedido,
//                     status: item.status,
//                     itens: []
//                 };
//             }

//             pedidosAgrupados[item.pedido_id].itens.push({
//                 produto_id: item.produto_id,
//                 produto: item.produto,
//                 categoria: item.categoria,
//                 quantidade: item.quantidade,
//                 preco_unitario: item.preco_unitario
//             });
//         });

//         return res.json(
//             Object.values(pedidosAgrupados)
//         );

//     } catch (erro) {
//         console.error(
//             "Erro ao buscar pedidos da cozinha:",
//             erro
//         );

//         return res.status(500).json({
//             erro: "Erro ao buscar pedidos da cozinha"
//         });
//     }
// });
// module.exports = router;

const express = require("express");
const router = express.Router();

const conexao = require("../config/database");


// =====================================================
// ADICIONAR PRODUTO AO PEDIDO PENDENTE
// =====================================================

router.post("/:comanda_id/itens", async (req, res) => {

    const conexaoTransacao = await conexao.getConnection();

    try {

        const { comanda_id } = req.params;
        const { produto_id, quantidade } = req.body;


        // =====================================================
        // VALIDAR DADOS
        // =====================================================

        if (!produto_id || quantidade === undefined) {

            return res.status(400).json({
                erro: "Produto e quantidade são obrigatórios"
            });

        }


        const quantidadeNumero = Number(quantidade);


        if (
            !Number.isInteger(quantidadeNumero) ||
            quantidadeNumero <= 0
        ) {

            return res.status(400).json({
                erro: "A quantidade deve ser um número inteiro maior que zero"
            });

        }


        // =====================================================
        // INICIAR TRANSAÇÃO
        // =====================================================

        await conexaoTransacao.beginTransaction();


        // =====================================================
        // VERIFICAR E BLOQUEAR A COMANDA
        // =====================================================

        const [comandas] = await conexaoTransacao.query(
            `
            SELECT
                id,
                mesa_id,
                status
            FROM comandas
            WHERE id = ?
            FOR UPDATE
            `,
            [comanda_id]
        );


        if (comandas.length === 0) {

            await conexaoTransacao.rollback();

            return res.status(404).json({
                erro: "Comanda não encontrada"
            });

        }


        const comanda = comandas[0];


        if (comanda.status !== "ABERTA") {

            await conexaoTransacao.rollback();

            return res.status(400).json({
                erro: "A comanda está fechada"
            });

        }


        // =====================================================
        // BUSCAR PEDIDO PENDENTE
        // =====================================================

        const [pedidos] = await conexaoTransacao.query(
            `
            SELECT
                id,
                comanda_id,
                status
            FROM pedidos
            WHERE comanda_id = ?
            AND status = 'PENDENTE'
            ORDER BY id DESC
            LIMIT 1
            FOR UPDATE
            `,
            [comanda_id]
        );


        let pedido;


        // =====================================================
        // SE JÁ EXISTE PEDIDO PENDENTE
        // =====================================================

        if (pedidos.length > 0) {

            pedido = pedidos[0];

        }


        // =====================================================
        // SE NÃO EXISTE, CRIAR PEDIDO PENDENTE
        // =====================================================

        else {

            const [resultadoPedido] =
                await conexaoTransacao.query(
                    `
                    INSERT INTO pedidos
                    (
                        comanda_id,
                        status
                    )
                    VALUES (?, 'PENDENTE')
                    `,
                    [comanda_id]
                );


            pedido = {

                id: resultadoPedido.insertId,

                comanda_id: Number(comanda_id),

                status: "PENDENTE"

            };

        }


        // =====================================================
        // BUSCAR PRODUTO
        // =====================================================

        const [produtos] = await conexaoTransacao.query(
            `
            SELECT
                id,
                nome,
                preco
            FROM produtos
            WHERE id = ?
            `,
            [produto_id]
        );


        if (produtos.length === 0) {

            await conexaoTransacao.rollback();

            return res.status(404).json({
                erro: "Produto não encontrado"
            });

        }


        const produto = produtos[0];


        // =====================================================
        // VERIFICAR SE PRODUTO JÁ ESTÁ NO PEDIDO
        // =====================================================

        const [itensExistentes] =
            await conexaoTransacao.query(
                `
                SELECT
                    id,
                    quantidade
                FROM itens_comanda
                WHERE pedido_id = ?
                AND produto_id = ?
                FOR UPDATE
                `,
                [
                    pedido.id,
                    produto_id
                ]
            );


        // =====================================================
        // ATUALIZAR QUANTIDADE
        // =====================================================

        if (itensExistentes.length > 0) {

            const item = itensExistentes[0];

            const novaQuantidade =
                Number(item.quantidade) +
                quantidadeNumero;


            await conexaoTransacao.query(
                `
                UPDATE itens_comanda
                SET quantidade = ?
                WHERE id = ?
                `,
                [
                    novaQuantidade,
                    item.id
                ]
            );


            await conexaoTransacao.commit();


            return res.json({

                mensagem:
                    "Quantidade atualizada no pedido",

                pedido_id:
                    pedido.id,

                item_id:
                    item.id,

                comanda_id:
                    Number(comanda_id),

                produto_id:
                    produto.id,

                produto:
                    produto.nome,

                quantidade:
                    novaQuantidade,

                preco_unitario:
                    produto.preco

            });

        }


        // =====================================================
        // CRIAR NOVO ITEM
        // =====================================================

        const [resultadoItem] =
            await conexaoTransacao.query(
                `
                INSERT INTO itens_comanda
                (
                    pedido_id,
                    comanda_id,
                    produto_id,
                    quantidade,
                    quantidade_paga,
                    preco_unitario,
                    valor_pago
                )
                VALUES (?, ?, ?, ?, 0, ?, 0.00)
                `,
                [
                    pedido.id,
                    comanda_id,
                    produto_id,
                    quantidadeNumero,
                    produto.preco
                ]
            );


        // =====================================================
        // CONFIRMAR TRANSAÇÃO
        // =====================================================

        await conexaoTransacao.commit();


        return res.status(201).json({

            mensagem:
                "Produto adicionado ao pedido",

            pedido_id:
                pedido.id,

            item_id:
                resultadoItem.insertId,

            comanda_id:
                Number(comanda_id),

            produto_id:
                produto.id,

            produto:
                produto.nome,

            quantidade:
                quantidadeNumero,

            preco_unitario:
                produto.preco

        });


    } catch (erro) {

        await conexaoTransacao.rollback();

        console.error(
            "Erro ao adicionar produto ao pedido:",
            erro
        );

        return res.status(500).json({
            erro: "Erro interno ao adicionar produto ao pedido"
        });

    } finally {

        conexaoTransacao.release();

    }

});


// =====================================================
// BUSCAR ITENS CONFIRMADOS DA COMANDA
// =====================================================

router.get("/:comanda_id/itens", async (req, res) => {

    try {

        const { comanda_id } = req.params;


        const [comandas] = await conexao.query(
            `
            SELECT id
            FROM comandas
            WHERE id = ?
            `,
            [comanda_id]
        );


        if (comandas.length === 0) {

            return res.status(404).json({
                erro: "Comanda não encontrada"
            });

        }


        const [itens] = await conexao.query(
    `
    SELECT
        ic.comanda_id,
        ic.produto_id,
        p.nome,

        SUM(ic.quantidade) AS quantidade,

        SUM(ic.quantidade_paga) AS quantidade_paga,

        MAX(ic.preco_unitario) AS preco_unitario,

        SUM(
            ic.quantidade *
            ic.preco_unitario
        ) AS total

    FROM itens_comanda ic

    INNER JOIN produtos p
        ON p.id = ic.produto_id

    INNER JOIN pedidos pe
        ON pe.id = ic.pedido_id

    WHERE ic.comanda_id = ?

    AND pe.status IN (
        'RECEBIDO',
        'EM_PREPARO',
        'PRONTO',
        'ENTREGUE'
    )

    GROUP BY
        ic.comanda_id,
        ic.produto_id,
        p.nome

    ORDER BY
        p.nome ASC
    `,
    [comanda_id]
);


        return res.json(itens);


    } catch (erro) {

        console.error(
            "Erro ao buscar itens da comanda:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao buscar itens da comanda"
        });

    }

});


// =====================================================
// BUSCAR PEDIDO PENDENTE
// =====================================================

router.get(
    "/:comanda_id/pedido-pendente",
    async (req, res) => {

        try {

            const { comanda_id } = req.params;


            const [pedidos] = await conexao.query(
                `
                SELECT
                    id,
                    comanda_id,
                    data_pedido,
                    status
                FROM pedidos
                WHERE comanda_id = ?
                AND status = 'PENDENTE'
                ORDER BY id DESC
                LIMIT 1
                `,
                [comanda_id]
            );


            if (pedidos.length === 0) {

                return res.status(404).json({
                    erro: "Nenhum pedido pendente encontrado"
                });

            }


            return res.json({

                pedido_id:
                    pedidos[0].id,

                comanda_id:
                    pedidos[0].comanda_id,

                data_pedido:
                    pedidos[0].data_pedido,

                status:
                    pedidos[0].status

            });


        } catch (erro) {

            console.error(
                "Erro ao buscar pedido pendente:",
                erro
            );

            return res.status(500).json({
                erro: "Erro ao buscar pedido pendente"
            });

        }

    }
);


// =====================================================
// CONFIRMAR PEDIDO
// PENDENTE → RECEBIDO
// =====================================================

router.put(
    "/:comanda_id/pedido/:pedido_id/confirmar",
    async (req, res) => {

        const conexaoTransacao =
            await conexao.getConnection();

        try {

            const {
                comanda_id,
                pedido_id
            } = req.params;


            await conexaoTransacao.beginTransaction();


            // =====================================================
            // BLOQUEAR COMANDA
            // =====================================================

            const [comandas] =
                await conexaoTransacao.query(
                    `
                    SELECT
                        id,
                        mesa_id,
                        status
                    FROM comandas
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [comanda_id]
                );


            if (comandas.length === 0) {

                await conexaoTransacao.rollback();

                return res.status(404).json({
                    erro: "Comanda não encontrada"
                });

            }


            if (comandas[0].status !== "ABERTA") {

                await conexaoTransacao.rollback();

                return res.status(400).json({
                    erro: "A comanda está fechada"
                });

            }


            // =====================================================
            // BLOQUEAR PEDIDO
            // =====================================================

            const [pedidos] =
                await conexaoTransacao.query(
                    `
                    SELECT
                        id,
                        comanda_id,
                        status
                    FROM pedidos
                    WHERE id = ?
                    AND comanda_id = ?
                    FOR UPDATE
                    `,
                    [
                        pedido_id,
                        comanda_id
                    ]
                );


            if (pedidos.length === 0) {

                await conexaoTransacao.rollback();

                return res.status(404).json({
                    erro: "Pedido não encontrado"
                });

            }


            const pedido = pedidos[0];


            // =====================================================
            // GARANTIR QUE AINDA ESTÁ PENDENTE
            // =====================================================

            if (pedido.status !== "PENDENTE") {

                await conexaoTransacao.rollback();

                return res.status(409).json({
                    erro:
                        `O pedido já está com status ${pedido.status}`
                });

            }


            // =====================================================
            // VERIFICAR SE POSSUI ITENS
            // =====================================================

            const [itens] =
                await conexaoTransacao.query(
                    `
                    SELECT id
                    FROM itens_comanda
                    WHERE pedido_id = ?
                    LIMIT 1
                    `,
                    [pedido_id]
                );


            if (itens.length === 0) {

                await conexaoTransacao.rollback();

                return res.status(400).json({
                    erro: "O pedido não possui itens"
                });

            }


            // =====================================================
            // ALTERAR PARA RECEBIDO
            // =====================================================

            await conexaoTransacao.query(
                `
                UPDATE pedidos
                SET status = 'RECEBIDO'
                WHERE id = ?
                AND status = 'PENDENTE'
                `,
                [pedido_id]
            );


            await conexaoTransacao.commit();


            return res.json({

                mensagem:
                    "Pedido confirmado e enviado para a cozinha",

                pedido_id:
                    Number(pedido_id),

                comanda_id:
                    Number(comanda_id),

                mesa_id:
                    comandas[0].mesa_id,

                status:
                    "RECEBIDO"

            });


        } catch (erro) {

            await conexaoTransacao.rollback();

            console.error(
                "Erro ao confirmar pedido:",
                erro
            );

            return res.status(500).json({
                erro: "Erro ao confirmar pedido"
            });

        } finally {

            conexaoTransacao.release();

        }

    }
);


// =====================================================
// LISTAR PEDIDOS DA COZINHA
// SOMENTE RECEBIDOS
// =====================================================

router.get("/cozinha/pedidos", async (req, res) => {

    try {

        const [pedidos] = await conexao.query(
            `
            SELECT
                pe.id AS pedido_id,
                pe.comanda_id,
                c.mesa_id,
                m.numero AS mesa,
                pe.data_pedido,
                pe.status,

                ic.produto_id,
                p.nome AS produto,
                p.categoria,
                ic.quantidade,
                ic.preco_unitario

            FROM pedidos pe

            INNER JOIN comandas c
                ON c.id = pe.comanda_id

            INNER JOIN mesas m
                ON m.id = c.mesa_id

            INNER JOIN itens_comanda ic
                ON ic.pedido_id = pe.id

            INNER JOIN produtos p
                ON p.id = ic.produto_id

            WHERE pe.status IN (
                'RECEBIDO',
                'EM_PREPARO',
                'PRONTO'
            )

            ORDER BY
                pe.data_pedido ASC,
                pe.id ASC,
                ic.id ASC
            `
        );


        const pedidosAgrupados = {};


        pedidos.forEach(item => {

            if (!pedidosAgrupados[item.pedido_id]) {

                pedidosAgrupados[item.pedido_id] = {

                    pedido_id:
                        item.pedido_id,

                    comanda_id:
                        item.comanda_id,

                    mesa_id:
                        item.mesa_id,

                    mesa:
                        item.mesa,

                    data_pedido:
                        item.data_pedido,

                    status:
                        item.status,

                    itens: []

                };

            }


            pedidosAgrupados[item.pedido_id]
                .itens
                .push({

                    produto_id:
                        item.produto_id,

                    produto:
                        item.produto,

                    categoria:
                        item.categoria,

                    quantidade:
                        item.quantidade,

                    preco_unitario:
                        item.preco_unitario

                });

        });


        return res.json(
            Object.values(pedidosAgrupados)
        );


    } catch (erro) {

        console.error(
            "Erro ao buscar pedidos da cozinha:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao buscar pedidos da cozinha"
        });

    }

});


// =====================================================
// INICIAR PREPARO
// RECEBIDO → EM_PREPARO
// =====================================================

router.put(
    "/cozinha/pedido/:pedido_id/preparo",
    async (req, res) => {

        const conexaoTransacao =
            await conexao.getConnection();

        try {

            const { pedido_id } = req.params;


            await conexaoTransacao.beginTransaction();


            const [pedidos] =
                await conexaoTransacao.query(
                    `
                    SELECT
                        id,
                        comanda_id,
                        status
                    FROM pedidos
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [pedido_id]
                );


            if (pedidos.length === 0) {

                await conexaoTransacao.rollback();

                return res.status(404).json({
                    erro: "Pedido não encontrado"
                });

            }


            if (pedidos[0].status !== "RECEBIDO") {

                await conexaoTransacao.rollback();

                return res.status(409).json({

                    erro:
                        `Não é possível iniciar o preparo. ` +
                        `O pedido está com status ${pedidos[0].status}`

                });

            }


            await conexaoTransacao.query(
                `
                UPDATE pedidos
                SET status = 'EM_PREPARO'
                WHERE id = ?
                AND status = 'RECEBIDO'
                `,
                [pedido_id]
            );


            await conexaoTransacao.commit();


            return res.json({

                mensagem:
                    "Pedido colocado em preparo",

                pedido_id:
                    Number(pedido_id),

                status:
                    "EM_PREPARO"

            });


        } catch (erro) {

            await conexaoTransacao.rollback();

            console.error(
                "Erro ao iniciar preparo:",
                erro
            );

            return res.status(500).json({
                erro: "Erro ao iniciar preparo"
            });

        } finally {

            conexaoTransacao.release();

        }

    }
);


// =====================================================
// FINALIZAR PEDIDO
// EM_PREPARO → PRONTO
// =====================================================

router.put(
    "/cozinha/pedido/:pedido_id/pronto",
    async (req, res) => {

        const conexaoTransacao =
            await conexao.getConnection();

        try {

            const { pedido_id } = req.params;


            await conexaoTransacao.beginTransaction();


            const [pedidos] =
                await conexaoTransacao.query(
                    `
                    SELECT
                        id,
                        comanda_id,
                        status
                    FROM pedidos
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [pedido_id]
                );


            if (pedidos.length === 0) {

                await conexaoTransacao.rollback();

                return res.status(404).json({
                    erro: "Pedido não encontrado"
                });

            }


            if (pedidos[0].status !== "EM_PREPARO") {

                await conexaoTransacao.rollback();

                return res.status(409).json({

                    erro:
                        `Não é possível finalizar o pedido. ` +
                        `O pedido está com status ${pedidos[0].status}`

                });

            }


            await conexaoTransacao.query(
                `
                UPDATE pedidos
                SET status = 'PRONTO'
                WHERE id = ?
                AND status = 'EM_PREPARO'
                `,
                [pedido_id]
            );


            await conexaoTransacao.commit();


            return res.json({

                mensagem:
                    "Pedido finalizado e pronto",

                pedido_id:
                    Number(pedido_id),

                status:
                    "PRONTO"

            });


        } catch (erro) {

            await conexaoTransacao.rollback();

            console.error(
                "Erro ao finalizar pedido:",
                erro
            );

            return res.status(500).json({
                erro: "Erro ao finalizar pedido"
            });

        } finally {

            conexaoTransacao.release();

        }

    }
);


module.exports = router;