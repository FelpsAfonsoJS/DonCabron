(() => {
const API_RELATORIOS = "http://localhost:3000/relatorios";
const $ = seletor => document.querySelector(seletor);
const moeda = valor => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = data => data.split("-").reverse().join("/");
let relatorio = null;
let versaoConsulta = 0;

async function consultar(url) {
  const resposta = await fetch(url, { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } });
  let dados;
  try { dados = await resposta.json(); }
  catch { throw new Error("Não foi possível carregar o relatório. Reinicie o backend e tente novamente."); }
  if (!resposta.ok) throw new Error(dados.mensagem || dados.erro || "Não foi possível consultar os dados.");
  return dados;
}
function invalidar() {
  versaoConsulta++;
  relatorio = null;
  $("#pdfRelatorio").disabled = true;
  $("#resultadoRelatorio").textContent = "Consulte para atualizar o relatório com os filtros selecionados.";
}
const colunasGarcons = [
  { titulo: "Garçom", valor: g => g.nome },
  { titulo: "Atendimentos na seleção", valor: g => g.atendimentos },
  { titulo: "Mesa(s) mais atendida(s) no período", valor: g => g.mesas_mais_atendidas.map(m => `Mesa ${m.numero} (${m.atendimentos})`).join(", ") || "Não informado" },
];
const colunasProdutos = [
  { titulo: "Produto", valor: p => p.nome },
  { titulo: "Quantidade", valor: p => p.quantidade },
  { titulo: "Valor total", valor: p => moeda(p.valor_total) },
];
function lideres(garcons) {
  const conhecidos = garcons.filter(g => g.id != null);
  const maximo = Math.max(0, ...conhecidos.map(g => g.atendimentos));
  return conhecidos.filter(g => g.atendimentos === maximo).map(g => `${g.nome} (${g.atendimentos})`).join(", ") || "Não informado";
}
function secoes(dados) {
  const secoes = [
    { titulo: "Resumo por mesa", colunas: [
      { titulo: "Mesa", valor: m => `Mesa ${m.numero}` },
      { titulo: "Valor total", valor: m => moeda(m.valor_total) },
      { titulo: "Atendimentos", valor: m => m.atendimentos },
      { titulo: "Garçom(ns) com mais atendimentos", valor: m => lideres(m.garcons) },
    ], linhas: dados.mesas },
    { titulo: "Atendimentos dos garçons", colunas: colunasGarcons, linhas: dados.garcons },
  ];
  for (const mesa of dados.mesas) {
    secoes.push({ titulo: `Mesa ${mesa.numero} — Produtos — Total: ${moeda(mesa.valor_total)}`, colunas: colunasProdutos, linhas: mesa.produtos });
    secoes.push({ titulo: `Mesa ${mesa.numero} — Garçons`, colunas: colunasGarcons, linhas: mesa.garcons });
  }
  return secoes;
}
function mostrar(dados) {
  const area = $("#resultadoRelatorio");
  area.replaceChildren();
  if (!dados.mesas.length) {
    area.textContent = "Nenhuma mesa com total de pelo menos R$ 1,00 para os filtros informados.";
    return;
  }
  const resumo = document.createElement("p");
  resumo.className = "resumo-relatorio";
  resumo.textContent = `${dataBR(dados.inicio)} a ${dataBR(dados.fim)} | Total: ${moeda(dados.valor_total)} | Mais atendimentos na seleção: ${lideres(dados.garcons)}`;
  area.append(resumo);
  for (const secao of secoes(dados)) {
    const bloco = document.createElement("section");
    bloco.className = "secao-relatorio";
    const titulo = document.createElement("h3");
    titulo.textContent = secao.titulo;
    const rolagem = document.createElement("div");
    rolagem.className = "tabela-relatorio";
    const tabela = document.createElement("table");
    const head = document.createElement("thead"), linha = document.createElement("tr"), body = document.createElement("tbody");
    secao.colunas.forEach(c => { const th = document.createElement("th"); th.scope = "col"; th.textContent = c.titulo; linha.append(th); });
    head.append(linha);
    secao.linhas.forEach(item => {
      const tr = document.createElement("tr");
      secao.colunas.forEach(c => { const td = document.createElement("td"); td.textContent = c.valor(item); tr.append(td); });
      body.append(tr);
    });
    tabela.append(head, body);
    rolagem.append(tabela);
    bloco.append(titulo, rolagem);
    area.append(bloco);
  }
}
async function carregarRelatorio(evento) {
  evento.preventDefault();
  invalidar();
  const versao = versaoConsulta;
  const filtros = { inicio: $("#relatorioInicio").value, fim: $("#relatorioFim").value, mesa_id: $("#consolidadoMesaId").value, ordem: $("#consolidadoOrdem").value };
  if (!filtros.inicio || !filtros.fim || filtros.inicio > filtros.fim) {
    $("#resultadoRelatorio").textContent = "Informe um período válido.";
    return;
  }
  $("#resultadoRelatorio").textContent = "Carregando relatório...";
  try {
    const dados = await consultar(`${API_RELATORIOS}/consolidado?${new URLSearchParams(filtros)}`);
    if (versao !== versaoConsulta) return;
    // Não exibir uma resposta que corresponda a outros filtros.
    if (dados.mesa_id !== filtros.mesa_id || dados.inicio !== filtros.inicio || dados.fim !== filtros.fim ||
        !Array.isArray(dados.mesas) || dados.mesas.some(m => Number(m.valor_total) < 1 || (filtros.mesa_id && String(m.id) !== filtros.mesa_id))) {
      throw new Error("O relatório recebido não corresponde aos filtros. Reinicie o backend e consulte novamente.");
    }
    mostrar(dados);
    relatorio = dados;
    $("#pdfRelatorio").disabled = !dados.mesas.length;
  } catch (erro) {
    if (versao === versaoConsulta) $("#resultadoRelatorio").textContent = erro.message;
  }
}
function gerarPdf() {
  if (!relatorio?.mesas.length) return;
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) return alert("Não foi possível carregar o gerador de PDF.");
  const pdf = new jsPDF();
  const dados = relatorio;
  pdf.setFontSize(18);
  pdf.text("Don Cabrón - Relatório consolidado", 14, 18);
  pdf.setFontSize(10);
  const contexto = [
    `Período: ${dataBR(dados.inicio)} a ${dataBR(dados.fim)}`,
    `Seleção: ${dados.mesa_id ? "Mesa " + dados.mesas[0].numero : "Todas as mesas"} | Total: ${moeda(dados.valor_total)}`,
    `Ordem: ${dados.ordem === "menor" ? "Menores" : "Maiores"} valores`,
    "Atendimentos: comandas distintas com pedidos no período, atribuídas ao garçom de abertura.",
    "Mesa mais atendida: considera todas as mesas no período. Empates são exibidos.",
    "Vendas registradas; não representam lucro líquido. Mesas com total mínimo de R$ 1,00.",
  ];
  const texto = pdf.splitTextToSize(contexto.join("\n"), 180);
  pdf.text(texto, 14, 27);
  let y = 30 + texto.length * 5;
  for (const secao of secoes(dados)) {
    if (y > 250) { pdf.addPage(); y = 18; }
    pdf.setFontSize(12);
    // A fonte padrão do PDF não inclui travessão.
    const titulo = pdf.splitTextToSize(secao.titulo.replaceAll("—", "-"), 180);
    pdf.text(titulo, 14, y);
    y += titulo.length * 5 + 3;
    pdf.autoTable({
      startY: y, head: [secao.colunas.map(c => c.titulo)],
      body: secao.linhas.map(item => secao.colunas.map(c => c.valor(item))),
      headStyles: { fillColor: [129,44,9] }, alternateRowStyles: { fillColor: [255,244,226] },
      margin: { top: 18, bottom: 20 }, styles: { fontSize: 9, overflow: "linebreak" },
    });
    y = pdf.lastAutoTable.finalY + 12;
  }
  const paginas = pdf.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    pdf.setPage(i); pdf.setFontSize(9);
    pdf.text(`Don Cabrón | Página ${i} de ${paginas}`, 105, 289, { align: "center" });
  }
  pdf.save(`relatorio-consolidado-${dados.inicio}-${dados.fim}.pdf`);
}
async function carregarListaMesas() {
  try {
    const mesas = await consultar("http://localhost:3000/mesas/todas");
    mesas.forEach(m => {
      const opcao = document.createElement("option");
      opcao.value = m.id; opcao.textContent = `Mesa ${m.numero}`;
      $("#consolidadoMesaId").append(opcao);
    });
  } catch (erro) { $("#erroListaMesasConsolidado").textContent = "Não foi possível carregar as mesas. Atualize a página para tentar novamente."; }
}
const agora = new Date();
const mes = String(agora.getMonth() + 1).padStart(2, "0");
$("#relatorioInicio").value = `${agora.getFullYear()}-${mes}-01`;
$("#relatorioFim").value = `${agora.getFullYear()}-${mes}-${String(agora.getDate()).padStart(2, "0")}`;
$("#filtroRelatorio").addEventListener("submit", carregarRelatorio);
$("#filtroRelatorio").addEventListener("input", invalidar);
$("#filtroRelatorio").addEventListener("change", invalidar);
$("#pdfRelatorio").addEventListener("click", gerarPdf);
carregarListaMesas();

})();
