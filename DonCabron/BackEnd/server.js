const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();


const conexao = require("./config/database"); //rota do banco de dados
const produtosRoutes = require("./routes/produtosRoutes");//rota dos produtos
const estoqueRoutes = require("./routes/estoqueRoutes");//consulta de estoque
const fornecedoresRoutes = require("./routes/fornecedoresRoute"); //consulta os fornecedores
const mesasRoutes = require("./routes/mesasRoutes"); //consulta as mesas
const comandasRoutes = require("./routes/comandasRoutes"); //consulta as comandas
const comandaItensRoutes = require("./routes/comandaItensRoutes"); //consulta os itens das comandas
const authRoutes = require("./routes/authRoutes"); //rotas para segurança e autenticaçao para o login e cadastro de usuarios
const app = express();

const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "..")
    )
);
app.use(
    "/DonCabron",
    express.static(
        path.join(__dirname, "..")
    )
);

app.use("/js", express.static(path.join(__dirname, "../../", "js")));

app.use("/auth", authRoutes); //autenticação
app.use("/produtos", produtosRoutes); //produtos
app.use("/estoque", estoqueRoutes); //estoque
app.use("/fornecedores", fornecedoresRoutes); //fornecedores
app.use("/mesas", mesasRoutes); //mesas
app.use("/comandas", comandasRoutes); //comandas
app.use("/comandas", comandaItensRoutes); //itens das comandas
app.get("/", (req, res) => {
    res.send("Backend do Don Cabrón esta funcionando corretamente");
});


app.get("/teste-banco", async (req, res) => {
    try {

        const [resultado] = await conexao.query("SELECT 1");

        res.json({
            mensagem: "Banco conectado com sucesso!",
            resultado
        });

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            mensagem: "Erro ao conectar no banco",
            erro: erro.message
        });

    }
});


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
