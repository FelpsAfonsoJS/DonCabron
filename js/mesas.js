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

const btnMenu = document.getElementById("btnMenu");
const classeLista = document.querySelector(".spanlista");

btnMenu.addEventListener("click", () => {
  classeLista.classList.toggle("escondido");
});

const formMesa = document.querySelector("#formMesa");
const resultadoMesas = document.querySelector("#resultadoMesas");

// ========================================
// CARREGAR MESAS
// ========================================

async function carregarMesas() {
  try {
    const resposta = await fetch("http://localhost:3000/mesas");

    if (!resposta.ok) {
      throw new Error("Erro ao buscar mesas");
    }

    const mesas = await resposta.json();

    resultadoMesas.innerHTML = "";

    if (mesas.length === 0) {
      resultadoMesas.innerHTML = `
                <p class="nenhuma-mesa">
                    Nenhuma mesa cadastrada.
                </p>
            `;

      return;
    }

    mesas.forEach((mesa) => {
      const card = document.createElement("div");

      card.classList.add("mesa");

      // ========================================
      // ABRIR PEDIDO DA MESA
      // ========================================

      card.addEventListener("click", (event) => {
        // Não abrir quando clicar em botão
        if (event.target.closest("button")) {
          return;
        }

        // Mesa desativada não pode ser aberta
        if (mesa.ativo !== 1) {
          alert("Esta mesa está desativada.");

          return;
        }

        window.location.href = `/DonCabron/index/pedidos.html?mesa=${mesa.id}`;
      });

      const statusClasse = mesa.status === "OCUPADA" ? "ocupada" : "livre";

      card.innerHTML = `
                <h3>Mesa ${mesa.numero}</h3>

                <p>
                    Capacidade:
                    ${mesa.capacidade} lugares
                </p>

                <span class="status ${statusClasse}">
                    ${mesa.status}
                </span>

                <div class="acoes-mesa">

    ${
      mesa.ativo === 1
        ? `
            <button
                type="button"
                class="btn-alterar"
                onclick="alterarMesa(${mesa.id}, ${mesa.numero}, ${mesa.capacidade})"
            >
                Alterar
            </button>

            <button
                type="button"
                class="btn-desativar"
                onclick="desativarMesa(${mesa.id})"
            >
                Desativar
            </button>
        `
        : `
            <button
                type="button"
                class="btn-reativar"
                onclick="reativarMesa(${mesa.id})"
            >
                Reativar
            </button>
        `
    }

</div>
            `;

      resultadoMesas.appendChild(card);
    });
  } catch (erro) {
    console.error("Erro ao carregar mesas:", erro);

    resultadoMesas.innerHTML = `
            <p class="erro-mesas">
                Não foi possível carregar as mesas.
            </p>
        `;
  }
}

// ========================================
// CADASTRAR MESA
// ========================================

formMesa.addEventListener("submit", async (event) => {
  event.preventDefault();

  const numero = document.querySelector("#numero").value;
  const capacidade = document.querySelector("#capacidade").value;

  if (!numero || !capacidade) {
    alert("Preencha todos os campos.");

    return;
  }

  try {
    const resposta = await fetch("http://localhost:3000/mesas", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        numero: Number(numero),
        capacidade: Number(capacidade),
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao cadastrar mesa");
    }

    alert("Mesa cadastrada com sucesso!");

    formMesa.reset();

    await carregarMesas();
  } catch (erro) {
    console.error("Erro ao cadastrar mesa:", erro);

    alert(erro.message || "Não foi possível cadastrar a mesa.");
  }
});

// ========================================
// ALTERAR MESA
// ========================================

async function alterarMesa(id, numeroAtual, capacidadeAtual) {
  const novoNumero = prompt("Digite o novo número da mesa:", numeroAtual);

  if (novoNumero === null) {
    return;
  }

  const novaCapacidade = prompt(
    "Digite a nova capacidade da mesa:",
    capacidadeAtual,
  );

  if (novaCapacidade === null) {
    return;
  }

  if (!novoNumero || !novaCapacidade) {
    alert("Preencha os dados corretamente.");

    return;
  }

  try {
    const resposta = await fetch(`http://localhost:3000/mesas/${id}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        numero: Number(novoNumero),
        capacidade: Number(novaCapacidade),
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao alterar mesa");
    }

    alert("Mesa alterada com sucesso!");

    await carregarMesas();
  } catch (erro) {
    console.error("Erro ao alterar mesa:", erro);

    alert(erro.message);
  }
}

// ========================================
// DESATIVAR MESA
// ========================================

async function desativarMesa(id) {
  const confirmar = confirm("Tem certeza que deseja desativar esta mesa?");

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(
      `http://localhost:3000/mesas/${id}/desativar`,
      {
        method: "PATCH",
      },
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao desativar mesa");
    }

    alert("Mesa desativada com sucesso!");

    await carregarMesas();
  } catch (erro) {
    console.error("Erro ao desativar mesa:", erro);

    alert(erro.message);
  }
}
async function reativarMesa(id) {

    try {

        const resposta = await fetch(
            `http://localhost:3000/mesas/${id}/reativar`,
            {
                method: "PATCH"
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {

            throw new Error(
                dados.erro || "Erro ao reativar mesa"
            );

        }

        alert(dados.mensagem);

        await carregarMesas();

    } catch (erro) {

        console.error(
            "Erro ao reativar mesa:",
            erro
        );

        alert(erro.message);

    }

}

// ========================================
// INICIAR
// ========================================

carregarMesas();
