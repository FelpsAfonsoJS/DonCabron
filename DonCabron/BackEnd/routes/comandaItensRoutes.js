const express = require("express");
const router = express.Router();

const conexao = require("../config/database");

// =====================================================
// ADICIONAR PRODUTO AO PEDIDO PENDENTE
// =====================================================

router.post("/:comanda_id/itens", async (req, res) => {

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
        // VERIFICAR COMANDA
        // =====================================================

        const [comandas] = await conexao.query(
            `
            SELECT id, mesa_id, status
            FROM comandas
            WHERE id = ?
            AND status = 'ABERTA'
            `,
            [comanda_id]
        );


        if (comandas.length === 0) {

            return res.status(404).json({
                erro: "Comanda não encontrada ou está fechada"
            });

        }


        // =====================================================
        // BUSCAR OU CRIAR PEDIDO PENDENTE
        // =====================================================

        let [pedidos] = await conexao.query(
            `
            SELECT id, comanda_id, status
            FROM pedidos
            WHERE comanda_id = ?
            AND status = 'PENDENTE'
            ORDER BY id DESC
            LIMIT 1
            `,
            [comanda_id]
        );


        let pedido;


        if (pedidos.length > 0) {

            pedido = pedidos[0];

        } else {

            const [resultadoPedido] = await conexao.query(
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

        const [produtos] = await conexao.query(
            `
            SELECT id, nome, preco
            FROM produtos
            WHERE id = ?
            `,
            [produto_id]
        );


        if (produtos.length === 0) {

            return res.status(404).json({
                erro: "Produto não encontrado"
            });

        }


        const produto = produtos[0];


        // =====================================================
        // VERIFICAR SE O PRODUTO JÁ ESTÁ NO PEDIDO PENDENTE
        // =====================================================

        const [itensExistentes] = await conexao.query(
            `
            SELECT id, quantidade
            FROM itens_comanda
            WHERE pedido_id = ?
            AND produto_id = ?
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
                Number(item.quantidade) + quantidadeNumero;


            await conexao.query(
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


            return res.json({

                mensagem: "Quantidade atualizada no pedido",

                pedido_id: pedido.id,

                item_id: item.id,

                comanda_id: Number(comanda_id),

                produto_id: produto.id,

                produto: produto.nome,

                quantidade: novaQuantidade,

                preco_unitario: produto.preco

            });

        }


        // =====================================================
        // CRIAR ITEM
        // =====================================================

        const [resultado] = await conexao.query(
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


        return res.status(201).json({

            mensagem: "Produto adicionado ao pedido",

            pedido_id: pedido.id,

            item_id: resultado.insertId,

            comanda_id: Number(comanda_id),

            produto_id: produto.id,

            produto: produto.nome,

            quantidade: quantidadeNumero,

            preco_unitario: produto.preco

        });


    } catch (erro) {

        console.error(
            "Erro ao adicionar produto ao pedido:",
            erro
        );


        return res.status(500).json({
            erro: "Erro interno ao adicionar produto ao pedido"
        });

    }

});


// =====================================================
// BUSCAR ITENS CONFIRMADOS DA COMANDA
// =====================================================

router.get("/:comanda_id/itens", async (req, res) => {

    try {

        const { comanda_id } = req.params;


        // =====================================================
        // VERIFICAR COMANDA
        // =====================================================

        const [comandas] = await conexao.query(
            `
            SELECT id, mesa_id, status
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


        // =====================================================
        // BUSCAR ITENS DE PEDIDOS CONFIRMADOS
        // =====================================================

        const [itens] = await conexao.query(
            `
            SELECT
                ic.produto_id,
                p.nome,

                SUM(ic.quantidade) AS quantidade,

                MAX(ic.preco_unitario) AS preco_unitario,

                SUM(
                    ic.quantidade * ic.preco_unitario
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
// BUSCAR PEDIDO PENDENTE DA COMANDA
// =====================================================

router.get("/:comanda_id/pedido-pendente", async (req, res) => {

    try {

        const { comanda_id } = req.params;


        const [pedidos] = await conexao.query(
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
            `,
            [comanda_id]
        );


        if (pedidos.length === 0) {

            return res.status(404).json({
                erro: "Nenhum pedido pendente encontrado"
            });

        }


        return res.json({

            pedido_id: pedidos[0].id,

            comanda_id: pedidos[0].comanda_id,

            status: pedidos[0].status

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

});


// =====================================================
// CONFIRMAR PEDIDO
// =====================================================

router.put(
    "/:comanda_id/pedido/:pedido_id/confirmar",
    async (req, res) => {

        try {

            const {
                comanda_id,
                pedido_id
            } = req.params;


            // =====================================================
            // VERIFICAR COMANDA
            // =====================================================

            const [comandas] = await conexao.query(
                `
                SELECT
                    id,
                    mesa_id,
                    status
                FROM comandas
                WHERE id = ?
                AND status = 'ABERTA'
                `,
                [comanda_id]
            );


            if (comandas.length === 0) {

                return res.status(404).json({
                    erro: "Comanda não encontrada ou está fechada"
                });

            }


            // =====================================================
            // VERIFICAR PEDIDO PENDENTE
            // =====================================================

            const [pedidos] = await conexao.query(
                `
                SELECT
                    id,
                    comanda_id,
                    status
                FROM pedidos
                WHERE id = ?
                AND comanda_id = ?
                AND status = 'PENDENTE'
                `,
                [
                    pedido_id,
                    comanda_id
                ]
            );


            if (pedidos.length === 0) {

                return res.status(404).json({
                    erro: "Pedido não encontrado ou já foi confirmado"
                });

            }


            // =====================================================
            // VERIFICAR ITENS
            // =====================================================

            const [itens] = await conexao.query(
                `
                SELECT id
                FROM itens_comanda
                WHERE pedido_id = ?
                `,
                [pedido_id]
            );


            if (itens.length === 0) {

                return res.status(400).json({
                    erro: "O pedido não possui itens"
                });

            }


            // =====================================================
            // CONFIRMAR PEDIDO
            // =====================================================

            await conexao.query(
                `
                UPDATE pedidos
                SET status = 'RECEBIDO'
                WHERE id = ?
                AND status = 'PENDENTE'
                `,
                [pedido_id]
            );


            // =====================================================
            // RETORNO
            // =====================================================

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

            console.error(
                "Erro ao confirmar pedido:",
                erro
            );


            return res.status(500).json({
                erro: "Erro ao confirmar pedido"
            });

        }

    }
);


module.exports = router;