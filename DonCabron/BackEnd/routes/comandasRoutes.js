
// const express = require("express");
// const router = express.Router();

// const conexao = require("../config/database");


// // ABRIR UMA COMANDA PARA UMA MESA
// router.post("/", async (req, res) => {

//     try {

//         const { mesa_id } = req.body;

//         // Verifica se foi informado o ID da mesa
//         if (!mesa_id) {
//             return res.status(400).json({
//                 erro: "O ID da mesa é obrigatório"
//             });
//         }


//         // Verifica se a mesa existe
//         const [mesas] = await conexao.query(
//             "SELECT * FROM mesas WHERE id = ?",
//             [mesa_id]
//         );

//         if (mesas.length === 0) {
//             return res.status(404).json({
//                 erro: "Mesa não encontrada"
//             });
//         }


//         // verifica se já existe uma comanda aberta para essa mesa
//         const [comandasAbertas] = await conexao.query(
//             `
//             SELECT *
//             FROM comandas
//             WHERE mesa_id = ?
//             AND status = 'ABERTA'
//             `,
//             [mesa_id]
//         );


//         // Se já existir, retorna a comanda existente
//         if (comandasAbertas.length > 0) {

//             return res.json({
//                 mensagem: "A mesa já possui uma comanda aberta",
//                 comanda: comandasAbertas[0]
//             });

//         }


//         // Cria uma nova comanda
//         const [resultado] = await conexao.query(
//             `
//             INSERT INTO comandas
//             (mesa_id)
//             VALUES (?)
//             `,
//             [mesa_id]
//         );


//         // Atualiza a mesa para OCUPADA
//         await conexao.query(
//             `
//             UPDATE mesas
//             SET status = 'OCUPADA'
//             WHERE id = ?
//             `,
//             [mesa_id]
//         );


//         res.status(201).json({
//             mensagem: "Comanda aberta com sucesso",
//             comanda_id: resultado.insertId,
//             mesa_id: mesa_id
//         });


//     } catch (error) {

//         console.error("Erro ao abrir comanda:", error);

//         res.status(500).json({
//             erro: error.message
//         });

//     }

// });


// module.exports = router;
const express = require("express");
const router = express.Router();

const conexao = require("../config/database");


// ========================================
// ABRIR COMANDA PARA UMA MESA
// ========================================

router.post("/", async (req, res) => {

    const conexaoTransacao = await conexao.getConnection();

    try {

        const { mesa_id } = req.body;


        // ========================================
        // VALIDAR DADOS
        // ========================================

        if (!mesa_id) {

            return res.status(400).json({
                erro: "O ID da mesa é obrigatório"
            });

        }


        await conexaoTransacao.beginTransaction();


        // ========================================
        // BUSCAR E BLOQUEAR A MESA
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
            [mesa_id]
        );


        if (mesas.length === 0) {

            await conexaoTransacao.rollback();

            return res.status(404).json({
                erro: "Mesa não encontrada"
            });

        }


        const mesa = mesas[0];


        // ========================================
        // VERIFICAR SE A MESA ESTÁ ATIVA
        // ========================================

        if (mesa.ativo !== 1) {

            await conexaoTransacao.rollback();

            return res.status(400).json({
                erro: "Esta mesa está desativada"
            });

        }


        // ========================================
        // VERIFICAR SE JÁ ESTÁ OCUPADA
        // ========================================

        if (mesa.status === "OCUPADA") {

            await conexaoTransacao.rollback();

            return res.status(400).json({
                erro: "Esta mesa já está ocupada"
            });

        }


        // ========================================
        // CRIAR COMANDA
        // ========================================

        const [resultado] = await conexaoTransacao.query(
            `
            INSERT INTO comandas
            (
                mesa_id,
                status
            )
            VALUES (?, 'ABERTA')
            `,
            [mesa_id]
        );


        const comandaId = resultado.insertId;


        // ========================================
        // OCUPAR MESA
        // ========================================

        await conexaoTransacao.query(
            `
            UPDATE mesas
            SET status = 'OCUPADA'
            WHERE id = ?
            `,
            [mesa_id]
        );


        // ========================================
        // CONFIRMAR TRANSAÇÃO
        // ========================================

        await conexaoTransacao.commit();


        return res.status(201).json({

            mensagem: "Comanda aberta com sucesso",

            mesa: {
                id: mesa.id,
                numero: mesa.numero,
                capacidade: mesa.capacidade,
                status: "OCUPADA"
            },

            comanda: {
                id: comandaId,
                mesa_id: mesa.id,
                status: "ABERTA"
            }

        });


    } catch (erro) {

        await conexaoTransacao.rollback();

        console.error(
            "Erro ao abrir comanda:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao abrir comanda"
        });

    } finally {

        conexaoTransacao.release();

    }

});


module.exports = router;