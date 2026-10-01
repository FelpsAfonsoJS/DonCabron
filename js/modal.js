(function () {
  const modalId = "modalGlobal";
  let resolverAtual = null;

  function modal() {
    let elemento = document.getElementById(modalId);

    if (elemento) {
      return elemento;
    }

    elemento = document.createElement("div");
    elemento.id = modalId;
    elemento.className = "modal-global hidden";
    elemento.setAttribute("aria-hidden", "true");
    elemento.innerHTML = `
      <div class="modal-backdrop" data-acao="fechar"></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="tituloModalGlobal">
        <div class="modal-header">
          <h3 id="tituloModalGlobal">Atenção</h3>
          <button type="button" class="modal-close" aria-label="Fechar modal" data-acao="fechar">×</button>
        </div>
        <div class="modal-body">
          <p id="mensagemModalGlobal"></p>
          <label class="modal-input-wrap hidden" id="wrapperInputModalGlobal">
            <span id="labelInputModalGlobal"></span>
            <input id="inputModalGlobal" type="text" />
          </label>
        </div>
        <div class="modal-actions">
          <button type="button" class="modal-btn modal-btn-secondary hidden" data-acao="cancelar">Cancelar</button>
          <button type="button" class="modal-btn modal-btn-primary" data-acao="confirmar">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(elemento);

    const fechar = (event) => {
      const acao = event.target?.dataset?.acao;
      if (acao === "fechar") {
        fecharModal(false);
      }
    };

    elemento.addEventListener("click", (event) => {
      const alvo = event.target;
      if (alvo && alvo.dataset && alvo.dataset.acao) {
        fechar(event);
      }
    });

    const botaoFechar = elemento.querySelector(".modal-close");
    if (botaoFechar) {
      botaoFechar.addEventListener("click", () => fecharModal(false));
    }

    const botaoCancelar = elemento.querySelector('[data-acao="cancelar"]');
    if (botaoCancelar) {
      botaoCancelar.addEventListener("click", () => fecharModal(false));
    }

    const botaoConfirmar = elemento.querySelector('[data-acao="confirmar"]');
    if (botaoConfirmar) {
      botaoConfirmar.addEventListener("click", () => {
        const modo = elemento.dataset.modo || "alerta";
        const input = elemento.querySelector("#inputModalGlobal");

        if (modo === "input") {
          fecharModal(input ? input.value : "");
          return;
        }

        fecharModal(true);
      });
    }

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && !elemento.classList.contains("hidden")) {
        fecharModal(false);
      }
    });

    return elemento;
  }

  function fecharModal(valor) {
    const elemento = modal();
    const resolve = resolverAtual;
    resolverAtual = null;

    elemento.classList.add("hidden");
    elemento.setAttribute("aria-hidden", "true");

    if (resolve) {
      resolve(valor);
    }
  }

  function abrirModal({ titulo, mensagem, tipo = "alerta", textoConfirmar = "OK", textoCancelar = "Cancelar", valorPadrao = "", label = "Valor", tipoInput = "text" }) {
    const elemento = modal();
    const tituloEl = elemento.querySelector("#tituloModalGlobal");
    const mensagemEl = elemento.querySelector("#mensagemModalGlobal");
    const wrapperInput = elemento.querySelector("#wrapperInputModalGlobal");
    const input = elemento.querySelector("#inputModalGlobal");
    const cancelBtn = elemento.querySelector('[data-acao="cancelar"]');
    const confirmBtn = elemento.querySelector('[data-acao="confirmar"]');

    tituloEl.textContent = titulo || "Atenção";
    mensagemEl.textContent = mensagem || "";

    const ehInput = tipo === "input";
    wrapperInput.classList.toggle("hidden", !ehInput);
    input.value = ehInput ? valorPadrao ?? "" : "";
    input.type = tipoInput;
    input.placeholder = label || "Digite aqui";
    elemento.querySelector("#labelInputModalGlobal").textContent = label || "Valor";

    const mostrarCancelar = tipo === "confirmar" || tipo === "input";
    cancelBtn.classList.toggle("hidden", !mostrarCancelar);
    cancelBtn.textContent = textoCancelar || "Cancelar";

    confirmBtn.textContent = textoConfirmar || "OK";
    elemento.dataset.modo = tipo;
    elemento.classList.remove("hidden");
    elemento.setAttribute("aria-hidden", "false");

    return new Promise((resolve) => {
      resolverAtual = resolve;
    });
  }

  window.mostrarAlerta = function (mensagem, titulo = "Atenção") {
    return abrirModal({
      titulo,
      mensagem: String(mensagem || ""),
      tipo: "alerta",
      textoConfirmar: "OK",
      textoCancelar: "Cancelar",
    }).then(() => undefined);
  };

  window.confirmarAcao = function (mensagem, titulo = "Confirmação") {
    return abrirModal({
      titulo,
      mensagem: String(mensagem || ""),
      tipo: "confirmar",
      textoConfirmar: "Confirmar",
      textoCancelar: "Cancelar",
    }).then((valor) => Boolean(valor));
  };

  window.pedirValorModal = function (mensagem, valorPadrao = "", titulo = "Editar", label = "Valor", tipoInput = "text") {
    return abrirModal({
      titulo,
      mensagem: String(mensagem || ""),
      tipo: "input",
      textoConfirmar: "Salvar",
      textoCancelar: "Cancelar",
      valorPadrao,
      label,
      tipoInput,
    }).then((valor) => {
      if (valor === false || valor === null || valor === undefined) {
        return null;
      }

      return String(valor);
    });
  };
})();
