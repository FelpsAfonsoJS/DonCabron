const express = require("express");
const router = express.Router();

const conexao = require("../config/database");


router.get("/", async (req,res)=>{

    try{

        const [produtos] = await conexao.query(
            "SELECT * FROM produtos"
        );

        res.json(produtos);

    }catch(error){

        res.status(500).json({
            erro:error.message
        });

    }

});


module.exports = router;