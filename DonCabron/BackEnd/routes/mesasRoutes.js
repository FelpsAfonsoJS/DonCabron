
const express = require("express");
const router = express.Router();

const conexao = require("../config/database");

// ============================================================
// LISTAR TODAS AS MESAS
// ATIVAS E DESATIVADAS
// ============================================================

router.get("/todas", async (req, res) => {

    try {

        const [mesas] = await conexao.query(`
            SELECT
                id,
                numero,
                capacidade,
                status,
                ativo
            FROM mesas
            ORDER BY numero
        `);

        return res.json(mesas);

    } catch (erro) {

        console.error("Erro ao buscar todas as mesas:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar todas as mesas"
        });

    }

});


// ============================================================
// LISTAR MESAS
// ============================================================

router.get("/", async (req, res) => {

    try {

        const [mesas] = await conexao.query(`
            SELECT
                id,
                numero,
                capacidade,
                status,
                ativo
            FROM mesas
            ORDER BY numero
        `);

        return res.json(mesas);

    } catch (erro) {

        console.error("Erro ao buscar mesas:", erro);

        return res.status(500).json({
            erro: "Erro ao buscar mesas"
        });

    }

});


// ============================================================
// CADASTRAR MESA
// ============================================================

router.post("/", async (req, res) => {

    try {

        const {
            numero,
            capacidade
        } = req.body;


        if (!numero || !capacidade) {

            return res.status(400).json({
                erro: "Número e capacidade são obrigatórios"
            });

        }


        const [resultado] = await conexao.query(
            `
            INSERT INTO mesas
            (
                numero,
                capacidade,
                status,
                ativo
            )
            VALUES (?, ?, 'LIVRE', 1)
            `,
            [
                numero,
                capacidade
            ]
        );


        return res.status(201).json({

            mensagem: "Mesa cadastrada com sucesso",

            id: resultado.insertId

        });

    } catch (erro) {

        console.error("Erro ao cadastrar mesa:", erro);


        if (erro.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                erro: "Esse número de mesa já está cadastrado."
            });

        }


        return res.status(500).json({
            erro: "Erro ao cadastrar mesa"
        });

    }

});


// ============================================================
// ALTERAR MESA
// NÃO PERMITE ALTERAR MESA OCUPADA
// ============================================================

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            numero,
            capacidade
        } = req.body;


        if (!numero || !capacidade) {

            return res.status(400).json({
                erro: "Número e capacidade são obrigatórios"
            });

        }


        const [mesas] = await conexao.query(
            `
            SELECT
                id,
                numero,
                capacidade,
                status,
                ativo
            FROM mesas
            WHERE id = ?
            `,
            [id]
        );


        if (mesas.length === 0) {

            return res.status(404).json({
                erro: "Mesa não encontrada"
            });

        }


        const mesa = mesas[0];


        if (mesa.ativo !== 1) {

            return res.status(400).json({
                erro: "Esta mesa está desativada"
            });

        }


        if (mesa.status === "OCUPADA") {

            return res.status(400).json({
                erro: "Não é possível alterar uma mesa que está ocupada"
            });

        }


        const [resultado] = await conexao.query(
            `
            UPDATE mesas
            SET
                numero = ?,
                capacidade = ?
            WHERE id = ?
            AND ativo = 1
            `,
            [
                numero,
                capacidade,
                id
            ]
        );


        if (resultado.affectedRows === 0) {

            return res.status(400).json({
                erro: "Não foi possível alterar a mesa"
            });

        }


        return res.json({
            mensagem: "Mesa alterada com sucesso"
        });

    } catch (erro) {

        console.error("Erro ao alterar mesa:", erro);


        if (erro.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                erro: "Esse número de mesa já está cadastrado."
            });

        }


        return res.status(500).json({
            erro: "Erro ao alterar mesa"
        });

    }

});


// ============================================================
// DESATIVAR MESA
// NÃO PERMITE DESATIVAR MESA OCUPADA
// ============================================================

router.patch("/:id/desativar", async (req, res) => {

    try {

        const { id } = req.params;


        const [mesas] = await conexao.query(
            `
            SELECT
                id,
                numero,
                status,
                ativo
            FROM mesas
            WHERE id = ?
            `,
            [id]
        );


        if (mesas.length === 0) {

            return res.status(404).json({
                erro: "Mesa não encontrada"
            });

        }


        const mesa = mesas[0];


        if (mesa.ativo !== 1) {

            return res.status(400).json({
                erro: "Mesa já está desativada"
            });

        }


        if (mesa.status === "OCUPADA") {

            return res.status(400).json({
                erro: "Não é possível desativar uma mesa que está ocupada"
            });

        }


        const [resultado] = await conexao.query(
            `
            UPDATE mesas
            SET ativo = 0
            WHERE id = ?
            AND ativo = 1
            `,
            [id]
        );


        if (resultado.affectedRows === 0) {

            return res.status(400).json({
                erro: "Não foi possível desativar a mesa"
            });

        }


        return res.json({
            mensagem: "Mesa desativada com sucesso"
        });

    } catch (erro) {

        console.error("Erro ao desativar mesa:", erro);

        return res.status(500).json({
            erro: "Erro ao desativar mesa"
        });

    }

});


// ============================================================
// REATIVAR MESA
// ============================================================

router.patch("/:id/reativar", async (req, res) => {

    try {

        const { id } = req.params;


        const [mesas] = await conexao.query(
            `
            SELECT
                id,
                numero,
                capacidade,
                status,
                ativo
            FROM mesas
            WHERE id = ?
            `,
            [id]
        );


        if (mesas.length === 0) {

            return res.status(404).json({
                erro: "Mesa não encontrada"
            });

        }


        const mesa = mesas[0];


        if (mesa.ativo === 1) {

            return res.status(400).json({
                erro: "Esta mesa já está ativa"
            });

        }


        if (mesa.status === "OCUPADA") {

            return res.status(400).json({
                erro: "Não é possível reativar uma mesa ocupada"
            });

        }


        const [resultado] = await conexao.query(
            `
            UPDATE mesas
            SET
                ativo = 1,
                status = 'LIVRE'
            WHERE id = ?
            AND ativo = 0
            `,
            [id]
        );


        if (resultado.affectedRows === 0) {

            return res.status(400).json({
                erro: "Não foi possível reativar a mesa"
            });

        }


        return res.json({

            mensagem: "Mesa reativada com sucesso",

            mesa: {
                id: mesa.id,
                numero: mesa.numero,
                capacidade: mesa.capacidade,
                status: mesa.status,
                ativo: 1
            }

        });

    } catch (erro) {

        console.error("Erro ao reativar mesa:", erro);


        if (erro.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                erro: "Não é possível reativar esta mesa porque o número já está sendo usado por outra mesa."
            });

        }


        return res.status(500).json({
            erro: "Erro ao reativar mesa"
        });

    }

});


// ============================================================
// ABRIR MESA
//
// SE LIVRE:
//    cria uma nova comanda
//
// SE OCUPADA:
//    recupera a comanda aberta existente
// ============================================================

router.post("/:id/abrir", async (req, res) => {

    const conexaoTransacao = await conexao.getConnection();

    try {

        const { id } = req.params;


        await conexaoTransacao.beginTransaction();


        // ----------------------------------------------------
        // BUSCAR MESA
        // ----------------------------------------------------

        const [mesas] = await conexaoTransacao.query(
            `
            SELECT
                id,
                numero,
                capacidade,
                status,
                ativo
            FROM mesas
            WHERE id = ?
            FOR UPDATE
            `,
            [id]
        );


        if (mesas.length === 0) {

            await conexaoTransacao.rollback();

            return res.status(404).json({
                erro: "Mesa não encontrada"
            });

        }


        const mesa = mesas[0];


        // ----------------------------------------------------
        // MESA DESATIVADA
        // ----------------------------------------------------

        if (mesa.ativo !== 1) {

            await conexaoTransacao.rollback();

            return res.status(400).json({
                erro: "Esta mesa está desativada"
            });

        }


        // ----------------------------------------------------
        // MESA OCUPADA
        //
        // RECUPERAR COMANDA EXISTENTE
        // ----------------------------------------------------

        if (mesa.status === "OCUPADA") {

            const [comandas] = await conexaoTransacao.query(
                `
                SELECT
                    id,
                    mesa_id,
                    data_abertura,
                    data_fechamento,
                    status
                FROM comandas
                WHERE mesa_id = ?
                AND status = 'ABERTA'
                ORDER BY id DESC
                LIMIT 1
                `,
                [id]
            );


            if (comandas.length === 0) {

                await conexaoTransacao.rollback();

                return res.status(409).json({
                    erro: "A mesa está ocupada, mas não possui uma comanda aberta."
                });

            }


            await conexaoTransacao.commit();


            return res.json({

                mensagem: "Comanda existente recuperada",

                mesa: {
                    id: mesa.id,
                    numero: mesa.numero,
                    capacidade: mesa.capacidade,
                    status: mesa.status,
                    ativo: mesa.ativo
                },

                comanda: comandas[0]

            });

        }


        // ----------------------------------------------------
        // MESA LIVRE
        //
        // CRIAR NOVA COMANDA
        // ----------------------------------------------------

        const [resultado] = await conexaoTransacao.query(
            `
            INSERT INTO comandas
            (
                mesa_id,
                status
            )
            VALUES (?, 'ABERTA')
            `,
            [id]
        );


        const comandaId = resultado.insertId;


        // ----------------------------------------------------
        // ALTERAR STATUS DA MESA
        // ----------------------------------------------------

        await conexaoTransacao.query(
            `
            UPDATE mesas
            SET status = 'OCUPADA'
            WHERE id = ?
            `,
            [id]
        );


        await conexaoTransacao.commit();


        return res.status(201).json({

            mensagem: "Mesa aberta com sucesso",

            mesa: {
                id: mesa.id,
                numero: mesa.numero,
                capacidade: mesa.capacidade,
                status: "OCUPADA",
                ativo: mesa.ativo
            },

            comanda: {
                id: comandaId,
                mesa_id: mesa.id,
                status: "ABERTA"
            }

        });

    } catch (erro) {

        await conexaoTransacao.rollback();

        console.error("Erro ao abrir mesa:", erro);

        return res.status(500).json({
            erro: "Erro ao abrir mesa"
        });

    } finally {

        conexaoTransacao.release();

    }

});


// ============================================================
// BUSCAR COMANDA ABERTA DA MESA
// ============================================================

router.get("/:id/comanda", async (req, res) => {

    try {

        const { id } = req.params;


        const [comandas] = await conexao.query(
            `
            SELECT
                c.id,
                c.mesa_id,
                c.data_abertura,
                c.data_fechamento,
                c.status
            FROM comandas c
            WHERE c.mesa_id = ?
            AND c.status = 'ABERTA'
            ORDER BY c.id DESC
            LIMIT 1
            `,
            [id]
        );


        if (comandas.length === 0) {

            return res.status(404).json({
                erro: "Não existe uma comanda aberta para esta mesa"
            });

        }


        return res.json(comandas[0]);

    } catch (erro) {

        console.error(
            "Erro ao buscar comanda da mesa:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao buscar comanda da mesa"
        });

    }

});


// ============================================================
// BUSCAR ITENS DA COMANDA ABERTA
// ============================================================

router.get("/:id/comanda/itens", async (req, res) => {

    try {

        const { id } = req.params;


        const [itens] = await conexao.query(
            `
            SELECT

                ic.id,

                ic.comanda_id,

                ic.produto_id,

                p.nome AS produto,

                ic.quantidade,

                ic.quantidade_paga,

                (
                    ic.quantidade - ic.quantidade_paga
                ) AS quantidade_restante,

                ic.preco_unitario,

                (
                    ic.quantidade * ic.preco_unitario
                ) AS subtotal,

                (
                    (ic.quantidade - ic.quantidade_paga)
                    * ic.preco_unitario
                ) AS subtotal_restante

            FROM comandas c

            INNER JOIN itens_comanda ic
                ON ic.comanda_id = c.id

            INNER JOIN produtos p
                ON p.id = ic.produto_id

            WHERE c.mesa_id = ?
            AND c.status = 'ABERTA'

            ORDER BY ic.id
            `,
            [id]
        );


        return res.json(itens);

    } catch (erro) {

        console.error(
            "Erro ao buscar itens da mesa:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao buscar itens da mesa"
        });

    }

});


// ============================================================
// ADICIONAR PRODUTO À COMANDA
// ============================================================

router.post("/:id/comanda/itens", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            produto_id,
            quantidade
        } = req.body;


        // ----------------------------------------------------
        // VALIDAR
        // ----------------------------------------------------

        if (!produto_id || !quantidade) {

            return res.status(400).json({
                erro: "Produto e quantidade são obrigatórios"
            });

        }


        if (Number(quantidade) <= 0) {

            return res.status(400).json({
                erro: "A quantidade deve ser maior que zero"
            });

        }


        // ----------------------------------------------------
        // BUSCAR COMANDA ABERTA
        // ----------------------------------------------------

        const [comandas] = await conexao.query(
            `
            SELECT
                id,
                mesa_id,
                status
            FROM comandas
            WHERE mesa_id = ?
            AND status = 'ABERTA'
            ORDER BY id DESC
            LIMIT 1
            `,
            [id]
        );


        if (comandas.length === 0) {

            return res.status(404).json({
                erro: "Não existe uma comanda aberta para esta mesa"
            });

        }


        const comanda = comandas[0];


        // ----------------------------------------------------
        // BUSCAR PRODUTO
        // ----------------------------------------------------

        const [produtos] = await conexao.query(
            `
            SELECT
                id,
                nome,
                preco,
                controla_estoque
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

        const quantidadeNumerica = Number(quantidade);


        // ----------------------------------------------------
        // VERIFICAR ESTOQUE
        // ----------------------------------------------------

        if (produto.controla_estoque === 1) {

            const [estoque] = await conexao.query(
                `
                SELECT
                    quantidade
                FROM estoque
                WHERE produto_id = ?
                `,
                [produto_id]
            );


            if (estoque.length === 0) {

                return res.status(400).json({
                    erro: "Produto não possui estoque cadastrado"
                });

            }


            if (
                estoque[0].quantidade <
                quantidadeNumerica
            ) {

                return res.status(400).json({
                    erro: "Quantidade em estoque insuficiente"
                });

            }

        }


        // ----------------------------------------------------
        // ADICIONAR ITEM
        // ----------------------------------------------------

        const [resultado] = await conexao.query(
            `
            INSERT INTO itens_comanda
            (
                comanda_id,
                produto_id,
                quantidade,
                quantidade_paga,
                preco_unitario
            )
            VALUES (?, ?, ?, 0, ?)
            `,
            [
                comanda.id,
                produto.id,
                quantidadeNumerica,
                produto.preco
            ]
        );


        // ----------------------------------------------------
        // DIMINUIR ESTOQUE
        // ----------------------------------------------------

        if (produto.controla_estoque === 1) {

            await conexao.query(
                `
                UPDATE estoque
                SET quantidade = quantidade - ?
                WHERE produto_id = ?
                `,
                [
                    quantidadeNumerica,
                    produto_id
                ]
            );

        }


        // ----------------------------------------------------
        // RESPOSTA
        // ----------------------------------------------------

        return res.status(201).json({

            mensagem: "Produto adicionado à comanda",

            item: {
                id: resultado.insertId,
                comanda_id: comanda.id,
                produto_id: produto.id,
                produto: produto.nome,
                quantidade: quantidadeNumerica,
                quantidade_paga: 0,
                preco_unitario: produto.preco,
                subtotal:
                    quantidadeNumerica *
                    Number(produto.preco),
                controla_estoque:
                    produto.controla_estoque
            }

        });

    } catch (erro) {

        console.error(
            "Erro ao adicionar produto à comanda:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao adicionar produto à comanda"
        });

    }

});


module.exports = router;