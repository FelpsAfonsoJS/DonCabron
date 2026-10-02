const { autenticar, permitir } = require("../middleware/auth");
const express = require("express");
const router = express.Router();

const conexao = require("../config/database");
const { inteiroPositivo } = require("../middleware/validacao");

// ========================================
// ABRIR COMANDA PARA UMA MESA
// ========================================

// router.post("/", async (req, res) => {
router.post("/", autenticar, permitir("GARCOM", "ADMIN"), async (req, res) => {
  const conexaoTransacao = await conexao.getConnection();

  try {
    const { mesa_id } = req.body || {};

    // ========================================
    // VALIDAR DADOS
    // ========================================

    if (!inteiroPositivo(mesa_id)) {
      return res.status(400).json({
        erro: "O ID da mesa deve ser um inteiro positivo",
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
      [mesa_id],
    );

    if (mesas.length === 0) {
      await conexaoTransacao.rollback();

      return res.status(404).json({
        erro: "Mesa não encontrada",
      });
    }

    const mesa = mesas[0];

    // ========================================
    // VERIFICAR SE A MESA ESTÁ ATIVA
    // ========================================

    if (mesa.ativo !== 1) {
      await conexaoTransacao.rollback();

      return res.status(400).json({
        erro: "Esta mesa está desativada",
      });
    }

    // ========================================
    // VERIFICAR SE JÁ ESTÁ OCUPADA
    // ========================================

    if (mesa.status === "OCUPADA") {
      await conexaoTransacao.rollback();

      return res.status(400).json({
        erro: "Esta mesa já está ocupada",
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
                garcom_id,
                status
            )
            VALUES (?, ?, 'ABERTA')
            `,
      [mesa_id, req.usuario.id],
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
      [mesa_id],
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
        status: "OCUPADA",
      },

      comanda: {
        id: comandaId,
        mesa_id: mesa.id,
        status: "ABERTA",
      },
    });
  } catch (erro) {
    await conexaoTransacao.rollback();

    console.error("Erro ao abrir comanda:", erro);

    return res.status(500).json({
      erro: "Erro ao abrir comanda",
    });
  } finally {
    conexaoTransacao.release();
  }
});

module.exports = router;
