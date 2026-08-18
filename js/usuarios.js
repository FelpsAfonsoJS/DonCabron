const formulario = document.getElementById("formUsuario");
const mensagem = document.getElementById("mensagem-usuario");


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

        const resposta = await fetch("/auth/usuarios", {

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
            "/auth/usuarios",
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


            card.innerHTML = `

                <div class="usuario-informacoes">

                    <h3>
                        ${usuario.nome}
                    </h3>

                    <p>
                        <strong>E-mail:</strong>
                        ${usuario.email}
                    </p>

                    <p>
                        <strong>Função:</strong>
                        ${tipoFormatado}
                    </p>

                    <p>
                        <strong>Status:</strong>

                        <span class="status ${classeStatus}">
                            ${status}
                        </span>
                    </p>

                </div>


                <button
                    class="botao-status ${classeStatus}"
                    onclick="alterarStatusUsuario(
                        ${usuario.id},
                        ${usuario.ativo}
                    )"
                >
                    ${textoBotao}
                </button>

            `;


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

        alert(
            "Sessão expirada. Faça login novamente."
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


    const confirmar = confirm(
        `Deseja ${acao} este funcionário?`
    );


    if (!confirmar) {
        return;
    }


    try {

        const resposta = await fetch(
            `/auth/usuarios/${id}/status`,
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

            alert(
                dados.mensagem ||
                "Erro ao alterar status."
            );

            return;
        }


        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );


        alert(
            "Não foi possível conectar ao servidor."
        );

    }

}
// Carrega os funcionários quando a página abre
carregarUsuarios();