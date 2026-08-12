
const express = require("express");
const router = express.Router();

const conexao = require("../config/database");


// ABRIR UMA COMANDA PARA UMA MESA
router.post("/", async (req, res) => {

    try {

        const { mesa_id } = req.body;

        // Verifica se foi informado o ID da mesa
        if (!mesa_id) {
            return res.status(400).json({
                erro: "O ID da mesa é obrigatório"
            });
        }


        // Verifica se a mesa existe
        const [mesas] = await conexao.query(
            "SELECT * FROM mesas WHERE id = ?",
            [mesa_id]
        );

        if (mesas.length === 0) {
            return res.status(404).json({
                erro: "Mesa não encontrada"
            });
        }


        // verifica se já existe uma comanda aberta para essa mesa
        const [comandasAbertas] = await conexao.query(
            `
            SELECT *
            FROM comandas
            WHERE mesa_id = ?
            AND status = 'ABERTA'
            `,
            [mesa_id]
        );


        // Se já existir, retorna a comanda existente
        if (comandasAbertas.length > 0) {

            return res.json({
                mensagem: "A mesa já possui uma comanda aberta",
                comanda: comandasAbertas[0]
            });

        }


        // Cria uma nova comanda
        const [resultado] = await conexao.query(
            `
            INSERT INTO comandas
            (mesa_id)
            VALUES (?)
            `,
            [mesa_id]
        );


        // Atualiza a mesa para OCUPADA
        await conexao.query(
            `
            UPDATE mesas
            SET status = 'OCUPADA'
            WHERE id = ?
            `,
            [mesa_id]
        );


        res.status(201).json({
            mensagem: "Comanda aberta com sucesso",
            comanda_id: resultado.insertId,
            mesa_id: mesa_id
        });


    } catch (error) {

        console.error("Erro ao abrir comanda:", error);

        res.status(500).json({
            erro: error.message
        });

    }

});


module.exports = router;
