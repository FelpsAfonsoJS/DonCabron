const express = require("express");
const router = express.Router();

const conexao = require("../config/database");


// ========================================
// LISTAR MESAS ATIVAS
// ========================================

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
            WHERE ativo = 1
            ORDER BY numero
        `);

        res.json(mesas);

    } catch (erro) {

        console.error("Erro ao buscar mesas:", erro);

        res.status(500).json({
            erro: "Erro ao buscar mesas"
        });

    }

});


// ========================================
// CADASTRAR MESA
// ========================================

router.post("/", async (req, res) => {

    try {

        const { numero, capacidade } = req.body;


        if (!numero || !capacidade) {

            return res.status(400).json({
                erro: "Número e capacidade são obrigatórios"
            });

        }


        const [resultado] = await conexao.query(
            `
            INSERT INTO mesas
            (numero, capacidade, status, ativo)
            VALUES (?, ?, 'LIVRE', 1)
            `,
            [numero, capacidade]
        );


        res.status(201).json({

            mensagem: "Mesa cadastrada com sucesso",

            id: resultado.insertId

        });


    } catch (erro) {

        console.error("Erro ao cadastrar mesa:", erro);

        // Número da mesa já existe
        if (erro.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                erro: "Esse número de mesa já está cadastrado."
            });

        }


        res.status(500).json({
            erro: "Erro ao cadastrar mesa"
        });

    }

});


// ========================================
// ALTERAR MESA
// ========================================

router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { numero, capacidade } = req.body;


        if (!numero || !capacidade) {

            return res.status(400).json({
                erro: "Número e capacidade são obrigatórios"
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
            [numero, capacidade, id]
        );


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                erro: "Mesa não encontrada ou está desativada"
            });

        }


        res.json({
            mensagem: "Mesa alterada com sucesso"
        });


    } catch (erro) {

        console.error("Erro ao alterar mesa:", erro);


        if (erro.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                erro: "Esse número de mesa já está cadastrado."
            });

        }


        res.status(500).json({
            erro: "Erro ao alterar mesa"
        });

    }

});


// ========================================
// DESATIVAR MESA
// ========================================

router.patch("/:id/desativar", async (req, res) => {

    try {

        const { id } = req.params;


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

            return res.status(404).json({
                erro: "Mesa não encontrada ou já está desativada"
            });

        }


        res.json({
            mensagem: "Mesa desativada com sucesso"
        });


    } catch (erro) {

        console.error("Erro ao desativar mesa:", erro);

        res.status(500).json({
            erro: "Erro ao desativar mesa"
        });

    }

});
// ========================================
// ABRIR MESA / CRIAR COMANDA
// ========================================

router.post("/:id/abrir", async (req, res) => {

    const conexaoTransacao = await conexao.getConnection();

    try {

        const { id } = req.params;

        // Inicia a transação
        await conexaoTransacao.beginTransaction();

        // ========================================
        // VERIFICAR SE A MESA EXISTE E ESTÁ LIVRE
        // ========================================

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

        // Mesa desativada
        if (mesa.ativo !== 1) {

            await conexaoTransacao.rollback();

            return res.status(400).json({
                erro: "Esta mesa está desativada"
            });

        }

        // Mesa já ocupada
        if (mesa.status === "OCUPADA") {

            await conexaoTransacao.rollback();

            return res.status(400).json({
                erro: "Esta mesa já está ocupada"
            });

        }

        // ========================================
        // CRIAR A COMANDA
        // ========================================

        const [resultado] = await conexaoTransacao.query(
            `
            INSERT INTO comandas
            (mesa_id, status)
            VALUES (?, 'ABERTA')
            `,
            [id]
        );

        const comandaId = resultado.insertId;

        // ========================================
        // ALTERAR STATUS DA MESA
        // ========================================

        await conexaoTransacao.query(
            `
            UPDATE mesas
            SET status = 'OCUPADA'
            WHERE id = ?
            `,
            [id]
        );

        // ========================================
        // CONFIRMAR TRANSAÇÃO
        // ========================================

        await conexaoTransacao.commit();

        res.status(201).json({

            mensagem: "Mesa aberta com sucesso",

            mesa: {
                id: mesa.id,
                numero: mesa.numero,
                capacidade: mesa.capacidade,
                status: "OCUPADA"
            },

            comanda: {
                id: comandaId,
                status: "ABERTA"
            }

        });

    } catch (erro) {

        // Se alguma coisa der errado,
        // desfaz tudo que foi feito na transação.

        await conexaoTransacao.rollback();

        console.error("Erro ao abrir mesa:", erro);

        res.status(500).json({
            erro: "Erro ao abrir mesa"
        });

    } finally {

        // Libera a conexão de volta para o pool
        conexaoTransacao.release();

    }

});
// ========================================
// BUSCAR COMANDA ABERTA DA MESA
// ========================================

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

        res.json(comandas[0]);

    } catch (erro) {

        console.error("Erro ao buscar comanda da mesa:", erro);

        res.status(500).json({
            erro: "Erro ao buscar comanda da mesa"
        });

    }

});
// ========================================
// BUSCAR ITENS DA COMANDA ABERTA DA MESA
// ========================================

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
                (ic.quantidade - ic.quantidade_paga) AS quantidade_restante,
                ic.preco_unitario,
                (ic.quantidade * ic.preco_unitario) AS subtotal,
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

        res.json(itens);

    } catch (erro) {

        console.error("Erro ao buscar itens da mesa:", erro);

        res.status(500).json({
            erro: "Erro ao buscar itens da mesa"
        });

    }

});
// ========================================
// ADICIONAR PRODUTO À COMANDA DA MESA
// ========================================

router.post("/:id/comanda/itens", async (req, res) => {

    try {

        const { id } = req.params;
        const { produto_id, quantidade } = req.body;


        // ========================================
        // VALIDAR DADOS
        // ========================================

        if (!produto_id || !quantidade) {

            return res.status(400).json({
                erro: "Produto e quantidade são obrigatórios"
            });

        }


        if (quantidade <= 0) {

            return res.status(400).json({
                erro: "A quantidade deve ser maior que zero"
            });

        }


        // ========================================
        // BUSCAR COMANDA ABERTA DA MESA
        // ========================================

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


        // ========================================
        // BUSCAR PRODUTO
        // ========================================

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


        // ========================================
        // VERIFICAR ESTOQUE
        // ========================================

        if (produto.controla_estoque === 1) {

            const [estoque] = await conexao.query(
                `
                SELECT quantidade
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


            if (estoque[0].quantidade < quantidade) {

                return res.status(400).json({
                    erro: "Quantidade em estoque insuficiente"
                });

            }

        }


        // ========================================
        // ADICIONAR ITEM À COMANDA
        // ========================================

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
                quantidade,
                produto.preco
            ]
        );


        // ========================================
        // DIMINUIR ESTOQUE
        // ========================================

        if (produto.controla_estoque === 1) {

            await conexao.query(
                `
                UPDATE estoque
                SET quantidade = quantidade - ?
                WHERE produto_id = ?
                `,
                [
                    quantidade,
                    produto_id
                ]
            );

        }


        // ========================================
        // RESPOSTA
        // ========================================

        res.status(201).json({

            mensagem: "Produto adicionado à comanda",

            item: {
                id: resultado.insertId,
                comanda_id: comanda.id,
                produto_id: produto.id,
                nome: produto.nome,
                quantidade: quantidade,
                preco_unitario: produto.preco,
                controla_estoque: produto.controla_estoque
            }

        });


    } catch (erro) {

        console.error(
            "Erro ao adicionar produto à comanda:",
            erro
        );


        res.status(500).json({
            erro: "Erro ao adicionar produto à comanda"
        });

    }

});

module.exports = router;
