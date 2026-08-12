const botaoTema = document.querySelector("#tema");
const icone = document.querySelector(".icone-tema");

if(botaoTema){
botaoTema.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){
        icone.textContent = "☀️";
    } else {
        icone.textContent = "🌙";
    }
});
}

const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

if(menuToggle){
menuToggle.addEventListener("click", () => {
    menu.classList.toggle("ativo");
});
}

let lastScrollTop = 0;
const header = document.querySelector('.header');
const scrollThreshold = 100;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageXOffset || document.documentElement.scrollTop;
    if (currentScroll < 0) return;

    if (currentScroll > lastScrollTop && currentScroll > scrollThreshold){
        header.classList.add('scroll-hide');
    } else {
        header.classList.remove('scroll-hide');
    }
        lastScrollTop = currentScroll;
    
});

//campos que aceita somente numeros
const documento = document.querySelector("#documento");
const telefone = document.querySelector("#telefone");

documento.addEventListener("input", () => {
    documento.value = documento.value.replace(/[^0-9]/g, "");
});

telefone.addEventListener("input", () => {
    telefone.value = telefone.value.replace(/[^0-9]/g, "");
});

//tratativa para em telefone e cpf aceitar somente numeros


function validarDocumento(valor) {

    if (valor.length === 11) {
        return "CPF";
    }

    if (valor.length === 14) {
        return "CNPJ";
    }

    return false;
}

//tratativa para verificar se os numeros informados é de um cpf ou de um cnpj


function validarTelefone(valor) {

    if (valor.length < 10 || valor.length > 11) {
        return false;
    }

    return true;
}

//ele vai aceitar 10 ou 11 numeros, dd mais o telefone se for fixo
//dd e o numero de telefone fixo que nao tem o 9 na frente


const formulario = document.querySelector("#formFornecedor");


formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const documentoValor = documento.value;
    const telefoneValor = telefone.value;

    if (!validarDocumento(documentoValor)) {

        alert("Digite um CPF com 11 números ou CNPJ com 14 números.");
        documento.focus();
        return;

    }

    if (!validarTelefone(telefoneValor)) {

        alert("Digite um telefone válido com 10 ou 11 números.");
        telefone.focus();
        return;

    }

    const fornecedor = {

        documento: documentoValor,
        nome: document.querySelector("#nome").value.trim(),
        endereco: document.querySelector("#endereco").value.trim(),
        bairro: document.querySelector("#bairro").value.trim(),
        cidade: document.querySelector("#cidade").value.trim(),
        telefone: telefoneValor

    };

    try {

        const resposta = await fetch("http://localhost:3000/fornecedores", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(fornecedor)

        });

        const dados = await resposta.json();

        if (!resposta.ok) {

            alert(dados.mensagem);
            return;

        }

        alert(dados.mensagem);

        formulario.reset();

    } catch (erro) {

        console.error("Erro ao cadastrar fornecedor:", erro);

        alert("Não foi possível conectar ao servidor.");

    }

});


const pesquisaFornecedor = document.querySelector("#pesquisaFornecedor");
const resultadoFornecedores = document.querySelector("#resultadoFornecedores");


//pesquisa fornecedores no banco de dados
pesquisaFornecedor.addEventListener("input", async () => {

    const pesquisa = pesquisaFornecedor.value.trim();

    resultadoFornecedores.innerHTML = "";

    if (!pesquisa) {
        return;
    }

    try {

        const resposta = await fetch(
            `http://localhost:3000/fornecedores?busca=${encodeURIComponent(pesquisa)}`
        );

        const fornecedores = await resposta.json();

        if (!resposta.ok) {

            resultadoFornecedores.textContent =
                "Erro ao pesquisar fornecedores.";

            return;

        }

        if (fornecedores.length === 0) {

            resultadoFornecedores.textContent =
                "Nenhum fornecedor encontrado.";

            return;

        }

        fornecedores.forEach((fornecedor) => {

            const div = document.createElement("div");

            div.classList.add("resultado-fornecedor");

            div.innerHTML = `
                <h3>${fornecedor.nome}</h3>

                <p>CPF/CNPJ: ${fornecedor.documento}</p>

                <p>Endereço: ${fornecedor.endereco}</p>

                <p>Bairro: ${fornecedor.bairro}</p>

                <p>Cidade: ${fornecedor.cidade}</p>

                <p>Telefone: ${fornecedor.telefone}</p>

                <button
                    type="button"
                    data-id="${fornecedor.id}"
                    data-nome="${fornecedor.nome}"
                    data-documento="${fornecedor.documento}"
                    data-endereco="${fornecedor.endereco}"
                    data-bairro="${fornecedor.bairro}"
                    data-cidade="${fornecedor.cidade}"
                    data-telefone="${fornecedor.telefone}"
                >
                    Selecionar
                </button>
            `;

            resultadoFornecedores.appendChild(div);

        });

    } catch (erro) {

        console.error("Erro ao pesquisar fornecedor:", erro);

        resultadoFornecedores.textContent =
            "Não foi possível conectar ao servidor.";

    }

});


//seleciona fornecedores encontrados
resultadoFornecedores.addEventListener("click", (evento) => {

    if (!evento.target.matches("button")) {
        return;
    }

    const botao = evento.target;

    const fornecedor = {

        id: Number(botao.dataset.id),
        nome: botao.dataset.nome,
        documento: botao.dataset.documento,
        endereco: botao.dataset.endereco,
        bairro: botao.dataset.bairro,
        cidade: botao.dataset.cidade,
        telefone: botao.dataset.telefone

    };

    console.log("Fornecedor selecionado:", fornecedor);

    resultadoFornecedores.innerHTML = `
        <div class="fornecedor-selecionado">

            <h3>Fornecedor selecionado</h3>

            <p><strong>Nome:</strong> ${fornecedor.nome}</p>

            <p><strong>CPF/CNPJ:</strong> ${fornecedor.documento}</p>

            <p><strong>Endereço:</strong> ${fornecedor.endereco}</p>

            <p><strong>Bairro:</strong> ${fornecedor.bairro}</p>

            <p><strong>Cidade:</strong> ${fornecedor.cidade}</p>

            <p><strong>Telefone:</strong> ${fornecedor.telefone}</p>

        </div>
    `;

    pesquisaFornecedor.value = fornecedor.nome;

});
const btnMenu = document.getElementById('btnMenu')
const classeLista = document.querySelector('.spanlista')

btnMenu.addEventListener('click', () => {
  classeLista.classList.toggle('escondido')
});