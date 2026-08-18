const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const conexao = require("../config/database");

const { autenticar, permitir } = require("../middleware/auth");

const router = express.Router();

const CHAVE_SECRETA = process.env.JWT_SECRET;


// LOGIN
router.post("/login", async (req, res) => {

    try {

        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                mensagem: "E-mail e senha são obrigatórios."
            });
        }


        const [usuarios] = await conexao.query(
            `SELECT id, nome, email, senha, tipo, ativo
             FROM usuarios
             WHERE email = ?
             AND ativo = 1
             LIMIT 1`,
            [email]
        );


        if (usuarios.length === 0) {
            return res.status(401).json({
                mensagem: "E-mail ou senha incorretos."
            });
        }


        const usuario = usuarios[0];


        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );


        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "E-mail ou senha incorretos."
            });
        }


        const token = jwt.sign(
            {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            },
            CHAVE_SECRETA,
            {
                expiresIn: "8h"
                //depois de 8 horas o token expira e o usuario precisa logar novamente
            }
        );


        res.json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            }
        });


    } catch (erro) {

        console.error("Erro no login:", erro);

        res.status(500).json({
            mensagem: "Erro interno do servidor."
        });
    }
});

//criaçao de novo usuario, apenas o admin pode criar novos usuarios 
router.post(
    "/usuarios",
    autenticar,
    permitir("ADMIN"),
    async (req, res) => {

        try {

            const { nome, email, senha, tipo } = req.body;


            // Verifica os campos obrigatórios
            if (!nome || !email || !senha || !tipo) {

                return res.status(400).json({
                    mensagem: "Nome, e-mail, senha e tipo são obrigatórios."
                });

            }


            // Tipos permitidos
            const tiposPermitidos = [
                "GARCOM",
                "COZINHA"
            ];


            if (!tiposPermitidos.includes(tipo)) {

                return res.status(400).json({
                    mensagem: "Tipo de usuário inválido."
                });

            }


            // Verifica se o e-mail já existe
            const [usuarioExistente] = await conexao.query(
                `SELECT id
                 FROM usuarios
                 WHERE email = ?
                 LIMIT 1`,
                [email]
            );


            if (usuarioExistente.length > 0) {

                return res.status(409).json({
                    mensagem: "Este e-mail já está cadastrado."
                });

            }


            // Criptografa a senha
            const senhaCriptografada = await bcrypt.hash(
                senha,
                10
            );


            // Insere o usuário
            const [resultado] = await conexao.query(
                `INSERT INTO usuarios
                (nome, email, senha, tipo)
                VALUES (?, ?, ?, ?)`,
                [
                    nome,
                    email,
                    senhaCriptografada,
                    tipo
                ]
            );


            res.status(201).json({

                mensagem: "Usuário cadastrado com sucesso.",

                usuario: {
                    id: resultado.insertId,
                    nome,
                    email,
                    tipo
                }

            });


        } catch (erro) {

            console.error("Erro ao cadastrar usuário:", erro);

            res.status(500).json({
                mensagem: "Erro interno do servidor."
            });

        }

    }
);

// LISTAR FUNCIONÁRIOS
// Apenas ADMIN pode consultar
router.get(
    "/usuarios",
    autenticar,
    permitir("ADMIN"),
    async (req, res) => {

        try {

            const [usuarios] = await conexao.query(
                `SELECT id, nome, email, tipo, ativo
                 FROM usuarios
                 WHERE tipo IN ('GARCOM', 'COZINHA')
                 ORDER BY nome ASC`
            );


            res.json(usuarios);


        } catch (erro) {

            console.error(
                "Erro ao buscar usuários:",
                erro
            );

            res.status(500).json({
                mensagem: "Erro ao buscar usuários."
            });

        }

    }
);

// ATIVAR / DESATIVAR FUNCIONÁRIO
// Apenas ADMIN pode alterar

router.patch(
    "/usuarios/:id/status",
    autenticar,
    permitir("ADMIN"),
    async (req, res) => {

        try {

            const { id } = req.params;

            const { ativo } = req.body;


            // Verifica se o valor recebido é válido
            if (ativo !== 0 && ativo !== 1) {

                return res.status(400).json({
                    mensagem: "Status inválido."
                });

            }


            // Verifica se o usuário existe
            const [usuarios] = await conexao.query(
                `SELECT id, nome, tipo, ativo
                 FROM usuarios
                 WHERE id = ?
                 LIMIT 1`,
                [id]
            );


            if (usuarios.length === 0) {

                return res.status(404).json({
                    mensagem: "Usuário não encontrado."
                });

            }


            const usuario = usuarios[0];


            // Não permite alterar ADMIN
            if (usuario.tipo === "ADMIN") {

                return res.status(403).json({
                    mensagem: "Não é permitido alterar o status de um ADMIN."
                });

            }


            // Atualiza o status
            await conexao.query(
                `UPDATE usuarios
                 SET ativo = ?
                 WHERE id = ?`,
                [ativo, id]
            );


            res.json({
                mensagem:
                    ativo === 1
                        ? "Usuário ativado com sucesso."
                        : "Usuário desativado com sucesso."
            });


        } catch (erro) {

            console.error(
                "Erro ao alterar status do usuário:",
                erro
            );

            res.status(500).json({
                mensagem: "Erro ao alterar status do usuário."
            });

        }

    }
);
module.exports = router;