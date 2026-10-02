const formulario = document.getElementById("formUsuario");
const mensagem = document.getElementById("mensagem-usuario");

document.getElementById("btnInicio").addEventListener("click", () => {
    window.location.href = "/DonCabron/index/index.html";
});

formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();


    const nome = document.getElementById("nome").value.trim();

    const email = document.getElementById("email").value.trim();

    const senha = document.getElementById("senha").value;

    const tipo = document.getElementById("tipo").value;


    mensagem.textContent = "";


    if (!nome || !email || !senha || !tipo) {

        mensagem.textContent =
            "Preencha todos os campos.";

        return;
    }


    const token = sessionStorage.getItem("token");


    if (!token) {

        mensagem.textContent =
            "Sessão não encontrada. Faça login novamente.";

        return;
    }


    try {

        const resposta = await fetch("http://localhost:3000/auth/usuarios", {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                "Authorization": `Bearer ${token}`

            },

            body: JSON.stringify({

                nome,
                email,
                senha,
                tipo

            })

        });


        const dados = await resposta.json();


        if (!resposta.ok) {

            mensagem.textContent =
                dados.mensagem ||
                "Erro ao cadastrar usuário.";

            return;
        }


        mensagem.textContent =
            dados.mensagem ||
            "Usuário cadastrado com sucesso.";


        formulario.reset();

        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao cadastrar usuário:",
            erro
        );


        mensagem.textContent =
            "Não foi possível conectar ao servidor.";

    }

});
// =========================================================
// LISTAR FUNCIONÁRIOS
// =========================================================

async function carregarUsuarios() {

    const lista = document.getElementById("listaUsuarios");

    const token = sessionStorage.getItem("token");


    if (!token) {

        lista.innerHTML = `
            <p>
                Sessão expirada. Faça login novamente.
            </p>
        `;

        return;
    }


    try {

        const resposta = await fetch(
            "http://localhost:3000/auth/usuarios",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        const dados = await resposta.json();


        if (!resposta.ok) {

            lista.innerHTML = `
                <p>
                    ${dados.mensagem || "Erro ao carregar usuários."}
                </p>
            `;

            return;
        }


        if (dados.length === 0) {

            lista.innerHTML = `
                <p>
                    Nenhum funcionário cadastrado.
                </p>
            `;

            return;
        }


        lista.innerHTML = "";


        dados.forEach(usuario => {

            const card = document.createElement("div");

            card.classList.add("usuario-card");


            const tipoFormatado =
                usuario.tipo === "GARCOM"
                    ? "GARÇOM"
                    : "COZINHA";


            const status =
                usuario.ativo === 1
                    ? "ATIVO"
                    : "DESATIVADO";


            const classeStatus =
                usuario.ativo === 1
                    ? "ativo"
                    : "desativado";


            const textoBotao =
                usuario.ativo === 1
                    ? "Desativar"
                    : "Ativar";


            const informacoes = document.createElement("div");
            informacoes.classList.add("usuario-informacoes");

            const nome = document.createElement("h3");
            nome.textContent = String(usuario.nome ?? "");

            const email = document.createElement("p");
            email.textContent = `E-mail: ${String(usuario.email ?? "")}`;

            const funcao = document.createElement("p");
            funcao.textContent = `Função: ${tipoFormatado}`;

            const statusCampo = document.createElement("p");
            const statusTexto = document.createElement("strong");
            statusTexto.textContent = "Status: ";
            const statusValor = document.createElement("span");
            statusValor.classList.add("status", classeStatus);
            statusValor.textContent = status;
            statusCampo.append(statusTexto, statusValor);
            informacoes.append(nome, email, funcao, statusCampo);

            const botaoStatus = document.createElement("button");
            botaoStatus.classList.add("botao-status", classeStatus);
            botaoStatus.textContent = textoBotao;
            botaoStatus.addEventListener("click", () => {
                alterarStatusUsuario(usuario.id, usuario.ativo);
            });

            card.append(informacoes, botaoStatus);


            lista.appendChild(card);

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar usuários:",
            erro
        );


        lista.innerHTML = `
            <p>
                Não foi possível carregar os funcionários.
            </p>
        `;

    }

}
// =========================================================
// ATIVAR / DESATIVAR
// =========================================================

async function alterarStatusUsuario(id, statusAtual) {

    const token = sessionStorage.getItem("token");


    if (!token) {

        await mostrarAlerta(
            "Sessão expirada. Faça login novamente.",
            "Sessão encerrada"
        );

        return;
    }


    const novoStatus =
        statusAtual === 1
            ? 0
            : 1;


    const acao =
        novoStatus === 1
            ? "ativar"
            : "desativar";


    const confirmou = await confirmarAcao(
        `Deseja ${acao} este funcionário?`,
        "Confirmar alteração"
    );


    if (!confirmou) {
        return;
    }


    try {

        const resposta = await fetch(
            `http://localhost:3000/auth/usuarios/${id}/status`,
            {

                method: "PATCH",

                headers: {

                    "Content-Type": "application/json",

                    "Authorization": `Bearer ${token}`

                },

                body: JSON.stringify({

                    ativo: novoStatus

                })

            }
        );


        const dados = await resposta.json();


        if (!resposta.ok) {

            await mostrarAlerta(
                dados.mensagem ||
                "Erro ao alterar status.",
                "Status do funcionário"
            );

            return;
        }


        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );


        await mostrarAlerta(
            "Não foi possível conectar ao servidor.",
            "Erro de conexão"
        );

    }

}
// Carrega os funcionários quando a página abre
carregarUsuarios();

// Garante a recarga após todos os scripts e recursos da página estarem prontos.
window.addEventListener("load", carregarUsuarios);
