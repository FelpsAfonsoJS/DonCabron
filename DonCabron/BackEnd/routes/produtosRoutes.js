const express = require("express");
const router = express.Router();

const conexao = require("../config/database");
const { autenticar, permitir } = require("../middleware/auth");

router.get("/", autenticar, permitir("GARCOM", "ADMIN"), async (req, res) => {
  try {
    const [produtos] = await conexao.query("SELECT * FROM produtos");

    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({
      erro: "Erro ao buscar produtos",
    });
  }
});

module.exports = router;
