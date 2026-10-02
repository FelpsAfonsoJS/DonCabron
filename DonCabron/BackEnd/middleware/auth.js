const jwt = require("jsonwebtoken");
const conexao = require("../config/database");

const CHAVE_SECRETA = process.env.JWT_SECRET;

async function autenticar(req, res, next) {
  let usuarioToken;

  try {
    const cabecalho = req.headers.authorization;

    if (!cabecalho) {
      return res.status(401).json({
        mensagem: "Usuário não autenticado.",
      });
    }

    const partes = cabecalho.split(" ");

    if (partes.length !== 2 || partes[0] !== "Bearer") {
      return res.status(401).json({
        mensagem: "Token inválido.",
      });
    }

    const token = partes[1];

    usuarioToken = jwt.verify(token, CHAVE_SECRETA);
  } catch (erro) {
    return res.status(401).json({
      mensagem: "Sessão inválida ou expirada.",
    });
  }

  try {
    const [usuarios] = await conexao.query(
      "SELECT id, nome, email, tipo FROM usuarios WHERE id = ? AND ativo = 1 LIMIT 1",
      [usuarioToken.id],
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ mensagem: "Usuário inativo ou inexistente." });
    }

    req.usuario = { ...usuarioToken, ...usuarios[0] };
    return next();
  } catch (erro) {
    console.error("Erro ao validar usuário autenticado:", erro.message);
    return res.status(503).json({ mensagem: "Não foi possível validar a sessão." });
  }
}

function permitir(...tiposPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        mensagem: "Usuário não autenticado.",
      });
    }

    if (!tiposPermitidos.includes(req.usuario.tipo)) {
      return res.status(403).json({
        mensagem: "Você não possui permissão para acessar este recurso.",
      });
    }

    next();
  };
}

module.exports = {
  autenticar,
  permitir,
};
