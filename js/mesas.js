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
const listaCadastro = document.querySelector(".dropdown-cadastro");

if (btnMenu && listaCadastro) {
  btnMenu.addEventListener("click", () => {
    listaCadastro.classList.toggle("escondido");
  });
}

const formMesa = document.querySelector("#formMesa");
const resultadoMesas = document.querySelector("#resultadoMesas");

const btnInicio = document.getElementById("btnInicio");

if (btnInicio) {
  btnInicio.addEventListener("click", () => {
    window.location.href = "/DonCabron/index/index.html";
  });
}

const btnRelatorios = document.getElementById("btnRelatorios");

if (btnRelatorios) {
  btnRelatorios.addEventListener("click", () => {
    window.location.href = "/DonCabron/index/relatorios.html";
  });
}

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
          mostrarAlerta("Esta mesa está desativada.", "Mesa inativa");

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
    await mostrarAlerta("Preencha todos os campos.", "Campos obrigatórios");

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

    await mostrarAlerta("Mesa cadastrada com sucesso!", "Cadastro realizado");

    formMesa.reset();

    await carregarMesas();
  } catch (erro) {
    console.error("Erro ao cadastrar mesa:", erro);

    await mostrarAlerta(erro.message || "Não foi possível cadastrar a mesa.", "Erro ao cadastrar mesa");
  }
});

// ========================================
// ALTERAR MESA
// ========================================

async function alterarMesa(id, numeroAtual, capacidadeAtual) {
  const novoNumero = await pedirValorModal(
    "Digite o novo número da mesa:",
    String(numeroAtual),
    "Alterar mesa",
    "Número da mesa",
    "number"
  );

  if (novoNumero === null) {
    return;
  }

  const novaCapacidade = await pedirValorModal(
    "Digite a nova capacidade da mesa:",
    String(capacidadeAtual),
    "Alterar mesa",
    "Capacidade da mesa",
    "number"
  );

  if (novaCapacidade === null) {
    return;
  }

  if (!novoNumero || !novaCapacidade) {
    await mostrarAlerta("Preencha os dados corretamente.", "Dados inválidos");

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

    await mostrarAlerta("Mesa alterada com sucesso!", "Mesa atualizada");

    await carregarMesas();
  } catch (erro) {
    console.error("Erro ao alterar mesa:", erro);

    await mostrarAlerta(erro.message || "Não foi possível alterar a mesa.", "Erro ao alterar mesa");
  }
}

// ========================================
// DESATIVAR MESA
// ========================================

async function desativarMesa(id) {
  const confirmou = await confirmarAcao("Tem certeza que deseja desativar esta mesa?", "Desativar mesa");

  if (!confirmou) {
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

    await mostrarAlerta("Mesa desativada com sucesso!", "Mesa desativada");

    await carregarMesas();
  } catch (erro) {
    console.error("Erro ao desativar mesa:", erro);

    await mostrarAlerta(erro.message || "Não foi possível desativar a mesa.", "Erro ao desativar mesa");
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

        await mostrarAlerta(dados.mensagem || "Mesa reativada com sucesso.", "Mesa reativada");

        await carregarMesas();

    } catch (erro) {

        console.error(
            "Erro ao reativar mesa:",
            erro
        );

        await mostrarAlerta(erro.message || "Não foi possível reativar a mesa.", "Erro ao reativar mesa");

    }

}

// ========================================
// INICIAR
// ========================================

carregarMesas();
