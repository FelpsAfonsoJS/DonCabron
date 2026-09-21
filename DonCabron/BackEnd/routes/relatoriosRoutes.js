const express = require("express");
const router = express.Router();
const conexao = require("../config/database");
const { autenticar, permitir } = require("../middleware/auth");

function periodoValido(inicio, fim, res) {
  if (!inicio || !fim || inicio > fim) {
    res.status(400).json({ mensagem: "Informe um período válido." });
    return false;
  }
  return true;
}

router.get("/produtos", autenticar, permitir("ADMIN"), async (req, res) => {
  const { inicio, fim, produto_id } = req.query;
  if (!periodoValido(inicio, fim, res)) return;

  try {
    const parametros = [inicio, fim];
    let filtroProduto = "";

    if (produto_id) {
      filtroProduto = " AND p.id = ? ";
      parametros.push(Number(produto_id));
    }

    const [itens] = await conexao.query(
      `SELECT p.id, p.nome,
                    SUM(ic.quantidade) AS quantidade_vendida,
                    SUM(ic.quantidade * ic.preco_unitario) AS valor_total
             FROM itens_comanda ic
             INNER JOIN pedidos pe ON pe.id = ic.pedido_id
             INNER JOIN produtos p ON p.id = ic.produto_id
             WHERE pe.status IN ('RECEBIDO', 'EM_PREPARO', 'PRONTO')
               AND DATE(pe.data_pedido) BETWEEN ? AND ?
               ${filtroProduto}
             GROUP BY p.id, p.nome
             ORDER BY quantidade_vendida DESC, p.nome ASC`,
      parametros,
    );

    res.json(itens);
  } catch (erro) {
    console.error("Erro no relatório de produtos:", erro);
    res
      .status(500)
      .json({ mensagem: "Não foi possível gerar o relatório de produtos." });
  }
});

router.get("/atendimentos", autenticar, permitir("ADMIN"), async (req, res) => {
  const { inicio, fim, garcom_id } = req.query;
  if (!periodoValido(inicio, fim, res)) return;

  try {
    const parametros = [inicio, fim];
    let filtroGarcom = "";

    if (garcom_id) {
      filtroGarcom = " AND c.garcom_id = ? ";
      parametros.push(Number(garcom_id));
    }

    const [atendimentos] = await conexao.query(
      `SELECT COALESCE(u.nome, 'Não informado') AS garcom,
                    COUNT(c.id) AS quantidade_atendimentos
             FROM comandas c
             LEFT JOIN usuarios u ON u.id = c.garcom_id
             WHERE DATE(c.data_abertura) BETWEEN ? AND ?
               ${filtroGarcom}
             GROUP BY c.garcom_id, u.nome
             ORDER BY quantidade_atendimentos DESC, garcom ASC`,
      parametros,
    );

    res.json(atendimentos);
  } catch (erro) {
    console.error("Erro no relatório de atendimentos:", erro);
    res
      .status(500)
      .json({
        mensagem: "Não foi possível gerar o relatório de atendimentos.",
      });
  }
});

router.get("/garcons", autenticar, permitir("ADMIN"), async (req, res) => {
  try {
    const [garcons] = await conexao.query(
      `SELECT id, nome FROM usuarios
             WHERE tipo = 'GARCOM'
             ORDER BY nome ASC`,
    );
    res.json(garcons);
  } catch (erro) {
    console.error("Erro ao buscar garçons para relatório:", erro);
    res.status(500).json({ mensagem: "Não foi possível buscar os garçons." });
  }
});

module.exports = router;
