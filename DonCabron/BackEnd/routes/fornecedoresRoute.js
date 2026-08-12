const express = require("express");
const router = express.Router();

const conexao = require("../config/database");


// Buscar todos os fornecedores
router.get("/", async (req, res) => {

    try {

        const busca = req.query.busca?.trim() || "";

        let sql = `
            SELECT
                id,
                documento,
                nome,
                endereco,
                bairro,
                cidade,
                telefone
            FROM fornecedores
        `;

        const valores = [];

        if (busca) {

            sql += `
                WHERE nome LIKE ?
                OR documento LIKE ?
            `;

            const termo = `%${busca}%`;

            valores.push(termo, termo);
        }

        sql += " ORDER BY nome";

        const [fornecedores] = await conexao.query(sql, valores);

        res.json(fornecedores);

    } catch (erro) {

        console.error("Erro ao buscar fornecedores:", erro);

        res.status(500).json({
            mensagem: "Erro ao buscar fornecedores"
        });

    }

});


// Cadastrar fornecedor
router.post("/", async (req, res) => {

    try {

        const {
            documento,
            nome,
            endereco,
            bairro,
            cidade,
            telefone
        } = req.body;

        if (!documento || !nome || !endereco || !bairro || !cidade || !telefone) {

            return res.status(400).json({
                mensagem: "Todos os campos são obrigatórios"
            });

        }

        const [resultado] = await conexao.query(
            `INSERT INTO fornecedores
            (documento, nome, endereco, bairro, cidade, telefone)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                documento,
                nome,
                endereco,
                bairro,
                cidade,
                telefone
            ]
        );

        res.status(201).json({
            mensagem: "Fornecedor cadastrado com sucesso",
            id: resultado.insertId
        });

    } catch (erro) {

        console.error("Erro ao cadastrar fornecedor:", erro);

        if (erro.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                mensagem: "Já existe um fornecedor com esse CPF/CNPJ"
            });

        }

        res.status(500).json({
            mensagem: "Erro ao cadastrar fornecedor"
        });

    }

});


module.exports = router;