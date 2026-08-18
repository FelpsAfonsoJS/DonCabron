const formulario = document.getElementById("form-login");
const mensagem = document.getElementById("mensagem-login");

if (formulario) {
formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();


    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;


    mensagem.textContent = "";


    try {

        const resposta = await fetch("/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                senha
            })

        });


        const dados = await resposta.json();


        if (!resposta.ok) {

            mensagem.textContent =
                dados.mensagem || "Erro ao realizar login.";

            return;
        }


        sessionStorage.setItem(
            "token",
            dados.token
        );


        sessionStorage.setItem(
            "usuario",
            JSON.stringify(dados.usuario)
        );


        switch (dados.usuario.tipo) {

            case "ADMIN":

                window.location.href =
                    "/DonCabron/index/index.html";

                break;


            case "GARCOM":

                window.location.href =
                    "/DonCabron/index/mesas.html";

                break;


            case "COZINHA":

                window.location.href =
                    "/DonCabron/index/cozinha.html";

                break;


            default:

                sessionStorage.clear();

                mensagem.textContent =
                    "Tipo de usuário inválido.";

        }


    } catch (erro) {

        console.error(erro);

        mensagem.textContent =
            "Não foi possível conectar ao servidor.";

    }

});

}