const API_RELATORIOS = "http://localhost:3000/relatorios";
let dadosProdutos = [];
let dadosAtendimentos = [];

function hoje() { return new Date().toISOString().slice(0, 10); }
function inicioMes() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }
function headers() { return { Authorization: `Bearer ${sessionStorage.getItem("token")}` }; }
function moeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" }); }
function periodo(prefixo) { return { inicio: document.querySelector(`#${prefixo}Inicio`).value, fim: document.querySelector(`#${prefixo}Fim`).value }; }
function validar({ inicio, fim }) { return inicio && fim && inicio <= fim; }
function tabela(destino, colunas, dados) {
  const area = document.querySelector(destino); area.replaceChildren();
  if (!dados.length) { const p=document.createElement("p"); p.className="vazio"; p.textContent="Nenhum dado encontrado para os filtros informados."; area.append(p); return; }
  const table=document.createElement("table"), thead=document.createElement("thead"), tr=document.createElement("tr"), tbody=document.createElement("tbody");
  colunas.forEach(c=>{const th=document.createElement("th");th.textContent=c.titulo;tr.append(th);}); thead.append(tr);
  dados.forEach(l=>{const linha=document.createElement("tr");colunas.forEach(c=>{const td=document.createElement("td");td.textContent=c.valor(l);linha.append(td);});tbody.append(linha);}); table.append(thead,tbody);area.append(table);
}
async function consultar(url) { const resposta=await fetch(url,{headers:headers()}); const dados=await resposta.json(); if(!resposta.ok) throw new Error(dados.mensagem||"Não foi possível gerar o relatório."); return dados; }
const colunasProdutos=[{titulo:"Item",valor:x=>x.nome},{titulo:"Quantidade vendida",valor:x=>x.quantidade_vendida},{titulo:"Valor total",valor:x=>moeda(x.valor_total)}];
const colunasAtendimentos=[{titulo:"Garçom",valor:x=>x.garcom},{titulo:"Atendimentos",valor:x=>x.quantidade_atendimentos}];
async function carregarProdutos(){ const p=periodo("produto"); if(!validar(p)) return mostrarAlerta("Informe um período válido.", "Período inválido"); const item=document.querySelector("#produtoId").value; try { dadosProdutos=await consultar(`${API_RELATORIOS}/produtos?inicio=${p.inicio}&fim=${p.fim}&produto_id=${item}`); tabela("#resultadoProdutos",colunasProdutos,dadosProdutos); }catch(e){await mostrarAlerta(e.message, "Erro no relatório");} }
async function carregarAtendimentos(){ const p=periodo("atendimento"); if(!validar(p)) return mostrarAlerta("Informe um período válido.", "Período inválido"); try { dadosAtendimentos=await consultar(`${API_RELATORIOS}/atendimentos?inicio=${p.inicio}&fim=${p.fim}`); tabela("#resultadoAtendimentos",colunasAtendimentos,dadosAtendimentos); }catch(e){await mostrarAlerta(e.message, "Erro no relatório");} }
function gerarPdf(titulo, periodoRelatorio, colunas, dados) { if(!dados.length) return mostrarAlerta("Consulte o relatório antes de gerar o PDF.", "PDF indisponível"); const jsPDF=window.jspdf?.jsPDF; if(!jsPDF) return mostrarAlerta("Não foi possível carregar o gerador de PDF.", "PDF indisponível"); const pdf=new jsPDF(); pdf.setFillColor(62,18,7);pdf.rect(0,0,210,30,"F");pdf.setTextColor(255,157,0);pdf.setFontSize(20);pdf.text("DON CABRÓN",14,15);pdf.setFontSize(12);pdf.text(titulo,14,24);pdf.setTextColor(40,20,10);pdf.setFontSize(10);pdf.text(`Período: ${periodoRelatorio.inicio.split('-').reverse().join('/')} a ${periodoRelatorio.fim.split('-').reverse().join('/')}`,14,38); pdf.autoTable({startY:44,head:[colunas.map(c=>c.titulo)],body:dados.map(d=>colunas.map(c=>c.valor(d))),headStyles:{fillColor:[129,44,9]},alternateRowStyles:{fillColor:[255,244,226]},margin:{bottom:18}});const paginas=pdf.getNumberOfPages();for(let i=1;i<=paginas;i++){pdf.setPage(i);pdf.setFontSize(9);pdf.setTextColor(90);pdf.text(`Don Cabrón • Página ${i} de ${paginas}`,105,290,{align:"center"});}pdf.save(`${titulo.toLowerCase().replaceAll(" ","-")}.pdf`); }
async function carregarListaProdutos(){ try { const r=await fetch("http://localhost:3000/produtos");const produtos=await r.json();const select=document.querySelector("#produtoId");produtos.forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.nome;select.append(o);}); }catch(e){console.error(e);} }
async function consultar(url) {
  const resposta = await fetch(url, { headers: headers() });
  const texto = await resposta.text();
  let dados;
  try { dados = texto ? JSON.parse(texto) : {}; }
  catch { throw new Error(`A rota de relatórios não respondeu corretamente (HTTP ${resposta.status}). Reinicie o backend.`); }
  if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível gerar o relatório.");
  return dados;
}

async function carregarAtendimentos() {
  const filtro = periodo("atendimento");
  if (!validar(filtro)) return mostrarAlerta("Informe um período válido.", "Período inválido");
  const garcomId = document.querySelector("#garcomId").value;
  try {
    dadosAtendimentos = await consultar(`${API_RELATORIOS}/atendimentos?inicio=${filtro.inicio}&fim=${filtro.fim}&garcom_id=${garcomId}`);
    tabela("#resultadoAtendimentos", colunasAtendimentos, dadosAtendimentos);
  } catch (erro) { await mostrarAlerta(erro.message, "Erro no relatório"); }
}

async function carregarListaGarcons() {
  try {
    const garcons = await consultar(`${API_RELATORIOS}/garcons`);
    const select = document.querySelector("#garcomId");
    garcons.forEach(garcom => {
      const opcao = document.createElement("option");
      opcao.value = garcom.id;
      opcao.textContent = garcom.nome;
      select.append(opcao);
    });
  } catch (erro) { console.error(erro); }
}

carregarListaGarcons();
["produtoInicio","atendimentoInicio"].forEach(id=>document.querySelector(`#${id}`).value=inicioMes());["produtoFim","atendimentoFim"].forEach(id=>document.querySelector(`#${id}`).value=hoje());
document.querySelector("#filtroProdutos").addEventListener("submit",e=>{e.preventDefault();carregarProdutos();});document.querySelector("#filtroAtendimentos").addEventListener("submit",e=>{e.preventDefault();carregarAtendimentos();});document.querySelector("#pdfProdutos").addEventListener("click",()=>gerarPdf("Itens mais vendidos",periodo("produto"),colunasProdutos,dadosProdutos));document.querySelector("#pdfAtendimentos").addEventListener("click",()=>gerarPdf("Atendimentos por garçom",periodo("atendimento"),colunasAtendimentos,dadosAtendimentos));carregarListaProdutos();

const colunasMesas = [
  { titulo: "Mesa", valor: x => `Mesa ${x.numero}` },
  { titulo: "Pedidos", valor: x => x.quantidade_pedidos },
  { titulo: "Valor total", valor: x => moeda(x.valor_total) },
];
let relatorioMesas = null;
let consultaMesas = 0;
const filtroMesas = document.querySelector("#filtroMesas");
const pdfMesas = document.querySelector("#pdfMesas");
function invalidarMesas() {
  consultaMesas++;
  relatorioMesas = null;
  pdfMesas.disabled = true;
  document.querySelector("#resultadoMesas").textContent = "Consulte para atualizar o relatório com os filtros selecionados.";
}
async function carregarMesas() {
  const filtro = periodo("mesa");
  if (!validar(filtro)) return mostrarAlerta("Informe um período válido.", "Período inválido");
  invalidarMesas();
  const consulta = consultaMesas;
  const ordem = document.querySelector("#mesaOrdem").value;
  const mesaId = document.querySelector("#mesaId").value;
  const area = document.querySelector("#resultadoMesas");
  area.textContent = "Carregando relatório...";
  try {
    const parametros = new URLSearchParams({ ...filtro, ordem, mesa_id: mesaId });
    const resposta = await consultar(`${API_RELATORIOS}/mesas?${parametros}`);
    if (consulta !== consultaMesas) return;
    const dados = resposta.filter(mesa => (!mesaId || String(mesa.id) === mesaId) && Number(mesa.valor_total) >= 1);
    tabela("#resultadoMesas", colunasMesas, dados);
    if (dados.length) {
      const resumo = document.createElement("p");
      resumo.textContent = `Total do período: ${moeda(dados.reduce((total, mesa) => total + Number(mesa.valor_total), 0))}`;
      area.prepend(resumo);
    }
    relatorioMesas = { filtro, ordem, dados, mesaId };
    pdfMesas.disabled = !dados.length;
  } catch (erro) {
    if (consulta === consultaMesas) area.textContent = erro.message;
  }
}
document.querySelector("#mesaInicio").value = inicioMes();
const dataLocal = new Date();
document.querySelector("#mesaFim").value = `${dataLocal.getFullYear()}-${String(dataLocal.getMonth() + 1).padStart(2, "0")}-${String(dataLocal.getDate()).padStart(2, "0")}`;
filtroMesas.addEventListener("input", invalidarMesas);
filtroMesas.addEventListener("change", invalidarMesas);
filtroMesas.addEventListener("submit", evento => { evento.preventDefault(); carregarMesas(); });
pdfMesas.addEventListener("click", () => {
  if (!relatorioMesas) return;
  const { filtro, ordem, dados, mesaId } = relatorioMesas;
  const titulo = mesaId ? `Rendimento da mesa ${dados[0].numero}` : `Rendimento por mesa - ${ordem === "menor" ? "Menores" : "Maiores"} valores`;
  gerarPdf(titulo, filtro, colunasMesas, dados);
});
async function carregarListaMesasRelatorio() {
  try {
    const mesas = await consultar("http://localhost:3000/mesas/todas");
    mesas.forEach(mesa => {
      const opcao = document.createElement("option");
      opcao.value = mesa.id; opcao.textContent = `Mesa ${mesa.numero}`;
      document.querySelector("#mesaId").append(opcao);
    });
  } catch (erro) {
    document.querySelector("#erroListaMesas").textContent = "Não foi possível carregar as mesas. Atualize a página para tentar novamente.";
  }
}
carregarListaMesasRelatorio();
