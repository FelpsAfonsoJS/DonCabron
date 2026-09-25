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
    res.status(500).json({
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


router.get("/mesas", autenticar, permitir("ADMIN"), async (req, res) => {
  const { inicio, fim, ordem = "maior", mesa_id = "" } = req.query;
  const dataValida = valor => typeof valor === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(valor)
    && Number.isFinite(Date.parse(valor))
    && new Date(valor).toISOString().slice(0, 10) === valor;
  if (!dataValida(inicio) || !dataValida(fim) || inicio > fim) {
    return res.status(400).json({ mensagem: "Informe um período válido." });
  }
  if (!["maior", "menor"].includes(ordem)) {
    return res.status(400).json({ mensagem: "Informe uma ordenação válida." });
  }
  if (typeof mesa_id !== "string" || (mesa_id !== "" && (!/^[1-9]\d*$/.test(mesa_id) || !Number.isSafeInteger(Number(mesa_id))))) {
    return res.status(400).json({ mensagem: "Informe uma mesa válida." });
  }
  const parametros = [inicio, fim];
  const filtroMesa = mesa_id ? "AND m.id = ?" : "";
  if (mesa_id) parametros.push(Number(mesa_id));
  const direcao = ordem === "menor" ? "ASC" : "DESC";
  try {
    const [mesas] = await conexao.query(
      `SELECT m.id, m.numero,
              COALESCE(v.quantidade_pedidos, 0) AS quantidade_pedidos,
              COALESCE(v.valor_total, 0) AS valor_total
       FROM mesas m
       LEFT JOIN (
         SELECT c.mesa_id, COUNT(DISTINCT pe.id) AS quantidade_pedidos,
                SUM(ic.quantidade * ic.preco_unitario) AS valor_total
         FROM comandas c
         INNER JOIN pedidos pe ON pe.comanda_id = c.id
         INNER JOIN itens_comanda ic ON ic.pedido_id = pe.id
         WHERE pe.status IN ('RECEBIDO', 'EM_PREPARO', 'PRONTO')
           AND pe.data_pedido >= ?
           AND pe.data_pedido < DATE_ADD(?, INTERVAL 1 DAY)
         GROUP BY c.mesa_id
       ) v ON v.mesa_id = m.id
       WHERE COALESCE(v.valor_total, 0) >= 1
       ${filtroMesa}
       ORDER BY valor_total ${direcao}, m.numero ASC, m.id ASC`,
      parametros,
    );
    res.json(mesas);
  } catch (erro) {
    console.error("Erro no relatório de mesas:", erro);
    res.status(500).json({ mensagem: "Não foi possível gerar o relatório de mesas." });
  }
});


router.get("/consolidado", autenticar, permitir("ADMIN"), async (req, res) => {
  const { inicio, fim, mesa_id = "", ordem = "maior" } = req.query;
  const dataValida = x => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)
    && Number.isFinite(Date.parse(x)) && new Date(x).toISOString().slice(0,10) === x;
  if (!dataValida(inicio) || !dataValida(fim) || inicio > fim ||
      !["maior", "menor"].includes(ordem) || typeof mesa_id !== "string" ||
      (mesa_id !== "" && (!/^[1-9]\d*$/.test(mesa_id) || !Number.isSafeInteger(Number(mesa_id))))) {
    return res.status(400).json({ mensagem: "Informe um período, mesa e ordenação válidos." });
  }
  try {
    // Todas as mesas permitem comparar a frequência de cada garçom no período.
    // Uma linha por comanda/produto evita multiplicar valores e atendimentos.
    const [linhas] = await conexao.query(
      `SELECT m.id AS mesa_id, m.numero, c.id AS comanda_id, c.garcom_id,
              COALESCE(u.nome, 'Não informado') AS garcom,
              ic.produto_id, COALESCE(p.nome, 'Produto indisponível') AS produto,
              SUM(ic.quantidade) AS quantidade,
              SUM(ic.quantidade * ic.preco_unitario) AS valor_total
       FROM pedidos pe
       INNER JOIN comandas c ON c.id = pe.comanda_id
       INNER JOIN mesas m ON m.id = c.mesa_id
       INNER JOIN itens_comanda ic ON ic.pedido_id = pe.id
       LEFT JOIN usuarios u ON u.id = c.garcom_id
       LEFT JOIN produtos p ON p.id = ic.produto_id
       WHERE pe.status IN ('RECEBIDO', 'EM_PREPARO', 'PRONTO')
         AND pe.data_pedido >= ? AND pe.data_pedido < DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY m.id, m.numero, c.id, c.garcom_id, u.nome, ic.produto_id, p.nome`,
      [inicio, fim],
    );
    const { consolidar } = require("./relatorioConsolidado");
    res.json({ inicio, fim, mesa_id, ordem, ...consolidar(linhas, mesa_id, ordem) });
  } catch (erro) {
    console.error("Erro no relatório consolidado:", erro);
    res.status(500).json({ mensagem: "Não foi possível gerar o relatório consolidado." });
  }
});

module.exports = router;
