const jwt = require("jsonwebtoken");

const CHAVE_SECRETA = process.env.JWT_SECRET;

function autenticar(req, res, next) {

    try {

        const cabecalho = req.headers.authorization;

        if (!cabecalho) {
            return res.status(401).json({
                mensagem: "Usuário não autenticado."
            });
        }

        const partes = cabecalho.split(" ");

        if (partes.length !== 2 || partes[0] !== "Bearer") {
            return res.status(401).json({
                mensagem: "Token inválido."
            });
        }

        const token = partes[1];

        const usuario = jwt.verify(
            token,
            CHAVE_SECRETA
        );

        req.usuario = usuario;

        next();

    } catch (erro) {

        console.error("Erro de autenticação:", erro.message);

        return res.status(401).json({
            mensagem: "Sessão inválida ou expirada."
        });
    }
}


function permitir(...tiposPermitidos) {

    return (req, res, next) => {

        if (!req.usuario) {
            return res.status(401).json({
                mensagem: "Usuário não autenticado."
            });
        }

        if (!tiposPermitidos.includes(req.usuario.tipo)) {

            return res.status(403).json({
                mensagem: "Você não possui permissão para acessar este recurso."
            });
        }

        next();
    };
}


module.exports = {
    autenticar,
    permitir
};