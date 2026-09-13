// tela de inicio
const botaoTema = document.querySelector("#tema");
const icone = document.querySelector(".icone-tema");

if (botaoTema) {
  botaoTema.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      icone.textContent = "☀️";
    } else {
      icone.textContent = "🌙";
    }
  });
}
const btnInicio = document.getElementById("btnInicio");
const btnCozinha = document.getElementById("btnCozinha");
const btnRelatorios = document.getElementById("btnRelatorios");

if (btnInicio) {
  btnInicio.addEventListener("click", () => {
    window.location.href = "/DonCabron/index/index.html";
  });
}

if (btnCozinha) {
  btnCozinha.addEventListener("click", () => {
    window.location.href = "/DonCabron/index/cozinha.html";
  });
}

if (btnRelatorios) {
  btnRelatorios.addEventListener("click", () => {
    window.location.href = "/DonCabron/index/relatorios.html";
  });
}

const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    menu.classList.toggle("ativo");
  });
}

let lastScrollTop = 0;
const header = document.querySelector(".header");
const scrollThreshold = 100;
window.addEventListener("scroll", () => {
  const currentScroll =
    window.pageXOffset || document.documentElement.scrollTop;
  if (currentScroll < 0) return;

  if (currentScroll > lastScrollTop && currentScroll > scrollThreshold) {
    header.classList.add("scroll-hide");
  } else {
    header.classList.remove("scroll-hide");
  }
  lastScrollTop = currentScroll;
});

//esconder botao
const btnMenu = document.getElementById("btnMenu");
const listaCadastro = document.querySelector(".dropdown-cadastro");

if (btnMenu && listaCadastro) {
  btnMenu.addEventListener("click", () => {
    listaCadastro.classList.toggle("escondido");
  });
}


async function carregarProdutos() {

    try {

        const resposta = await fetch(
            "http://localhost:3000/produtos"
        );

        if (!resposta.ok) {
            throw new Error("Erro ao buscar produtos");
        }

        const produtos = await resposta.json();

        // Limpar as listas
        document.querySelector("#listaComidas").innerHTML = "";
        document.querySelector("#listaAlcoolicas").innerHTML = "";
        document.querySelector("#listaGaseificadas").innerHTML = "";
        document.querySelector("#listaArtesanais").innerHTML = "";


        produtos.forEach(produto => {

            const card = document.createElement("div");

            card.classList.add("produto");


            card.innerHTML = `

                <img
                    src="/DonCabron/img/Produtos/${produto.imagem}"
                    alt="${produto.nome}"
                >

                <h3>
                    ${produto.nome}
                </h3>

                <p class="descricao">
                    ${produto.descricao}
                </p>

                <span>
                    R$ ${Number(produto.preco).toFixed(2).replace(".", ",")}
                </span>

            `;


            // ========================================
            // SEPARAR POR CATEGORIA
            // ========================================

            if (produto.categoria === "Comida") {

                document
                    .querySelector("#listaComidas")
                    .appendChild(card);

            }

            else if (
                produto.categoria === "Bebida Alcoolica"
            ) {

                document
                    .querySelector("#listaAlcoolicas")
                    .appendChild(card);

            }

            else if (
                produto.categoria === "Bebida Gaseificada"
            ) {

                document
                    .querySelector("#listaGaseificadas")
                    .appendChild(card);

            }

            else if (
                produto.categoria === "Artesanal"
            ) {

                document
                    .querySelector("#listaArtesanais")
                    .appendChild(card);

            }

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar produtos:",
            erro
        );

    }

}


// ========================================
// INICIAR
// ========================================

if (document.querySelector("#listaComidas")) {
  carregarProdutos();
}
