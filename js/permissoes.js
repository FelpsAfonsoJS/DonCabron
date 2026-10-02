const ROTAS_PERMITIDAS = {
    ADMIN: [
        "/DonCabron/index/index.html",
        "/DonCabron/index/mesas.html",
        "/DonCabron/index/pedidos.html",
        "/DonCabron/index/fornecedor.html",
        "/DonCabron/index/usuarios.html",
        "/DonCabron/index/cozinha.html",
        "/DonCabron/index/relatorios.html"
    ],
    GARCOM: [
        "/DonCabron/index/mesas.html",
        "/DonCabron/index/pedidos.html"
    ],
    COZINHA: [
        "/DonCabron/index/cozinha.html"
    ]
};

const usuarioLogado = (() => {
    try {
        return JSON.parse(sessionStorage.getItem("usuario") || "null");
    } catch {
        return null;
    }
})();

const tokenLogado = sessionStorage.getItem("token");
const tipoUsuario = usuarioLogado?.tipo;

function cabecalhosDaSessao(incluirJson = false) {
    const token = sessionStorage.getItem("token");

    if (!token) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
    }

    const cabecalhos = { Authorization: `Bearer ${token}` };
    if (incluirJson) cabecalhos["Content-Type"] = "application/json";

    return cabecalhos;
}

function redirecionarPorPerfil() {
    switch (tipoUsuario) {
        case "ADMIN":
            window.location.href = "/DonCabron/index/index.html";
            break;
        case "GARCOM":
            window.location.href = "/DonCabron/index/mesas.html";
            break;
        case "COZINHA":
            window.location.href = "/DonCabron/index/cozinha.html";
            break;
        default:
            sessionStorage.clear();
            window.location.href = "/DonCabron/index/login.html";
    }
}

if (!tokenLogado || !tipoUsuario) {
    window.location.href = "/DonCabron/index/login.html";
} else {
    const paginaAtual = window.location.pathname;
    const permitidas = ROTAS_PERMITIDAS[tipoUsuario] || [];

    if (!permitidas.includes(paginaAtual)) {
        redirecionarPorPerfil();
    }
}

function configurarMenuPorPerfil() {
    const menuAdmin = document.querySelectorAll(".menu-admin");

    if (tipoUsuario !== "ADMIN") {
        document
            .querySelectorAll(
                ".menu-list > li:not(.menu-sair), .menu-cozinha-top > a:not(.menu-sair)"
            )
            .forEach(item => item.remove());

        return;
    }

    menuAdmin.forEach(el => {
        el.hidden = false;
    });
}

function sairSistema() {
    sessionStorage.clear();
    window.location.href = "/DonCabron/index/login.html";
}

function configurarTema() {
    const botaoTema = document.querySelector("[data-controle-tema]");
    if (!botaoTema) return;

    const temaSalvo = localStorage.getItem("temaDonCabron");
    document.body.classList.toggle("tema-claro", temaSalvo === "claro");
    botaoTema.textContent = document.body.classList.contains("tema-claro") ? "🌙" : "☀️";

    botaoTema.addEventListener("click", () => {
        const claro = document.body.classList.toggle("tema-claro");
        localStorage.setItem("temaDonCabron", claro ? "claro" : "escuro");
        botaoTema.textContent = claro ? "🌙" : "☀️";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    configurarMenuPorPerfil();
    configurarTema();
});
