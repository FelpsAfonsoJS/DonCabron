const express = require("express");
const router = express.Router();

const conexao = require("../config/database");


router.get("/", async (req, res) => {

    try {

        const [estoque] = await conexao.query(`
            SELECT 
                produtos.nome,
                produtos.categoria,
                estoque.quantidade
            FROM produtos
            INNER JOIN estoque
            ON produtos.id = estoque.produto_id
        `);

        res.json(estoque);

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            erro: erro.message
        });

    }

});


module.exports = router;