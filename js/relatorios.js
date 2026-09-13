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
async function carregarProdutos(){ const p=periodo("produto"); if(!validar(p)) return alert("Informe um período válido."); const item=document.querySelector("#produtoId").value; try { dadosProdutos=await consultar(`${API_RELATORIOS}/produtos?inicio=${p.inicio}&fim=${p.fim}&produto_id=${item}`); tabela("#resultadoProdutos",colunasProdutos,dadosProdutos); }catch(e){alert(e.message);} }
async function carregarAtendimentos(){ const p=periodo("atendimento"); if(!validar(p)) return alert("Informe um período válido."); try { dadosAtendimentos=await consultar(`${API_RELATORIOS}/atendimentos?inicio=${p.inicio}&fim=${p.fim}`); tabela("#resultadoAtendimentos",colunasAtendimentos,dadosAtendimentos); }catch(e){alert(e.message);} }
function gerarPdf(titulo, periodoRelatorio, colunas, dados) { if(!dados.length) return alert("Consulte o relatório antes de gerar o PDF."); const jsPDF=window.jspdf?.jsPDF; if(!jsPDF) return alert("Não foi possível carregar o gerador de PDF."); const pdf=new jsPDF(); pdf.setFillColor(62,18,7);pdf.rect(0,0,210,30,"F");pdf.setTextColor(255,157,0);pdf.setFontSize(20);pdf.text("DON CABRÓN",14,15);pdf.setFontSize(12);pdf.text(titulo,14,24);pdf.setTextColor(40,20,10);pdf.setFontSize(10);pdf.text(`Período: ${periodoRelatorio.inicio.split('-').reverse().join('/')} a ${periodoRelatorio.fim.split('-').reverse().join('/')}`,14,38); pdf.autoTable({startY:44,head:[colunas.map(c=>c.titulo)],body:dados.map(d=>colunas.map(c=>c.valor(d))),headStyles:{fillColor:[129,44,9]},alternateRowStyles:{fillColor:[255,244,226]},margin:{bottom:18}});const paginas=pdf.getNumberOfPages();for(let i=1;i<=paginas;i++){pdf.setPage(i);pdf.setFontSize(9);pdf.setTextColor(90);pdf.text(`Don Cabrón • Página ${i} de ${paginas}`,105,290,{align:"center"});}pdf.save(`${titulo.toLowerCase().replaceAll(" ","-")}.pdf`); }
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
  if (!validar(filtro)) return alert("Informe um período válido.");
  const garcomId = document.querySelector("#garcomId").value;
  try {
    dadosAtendimentos = await consultar(`${API_RELATORIOS}/atendimentos?inicio=${filtro.inicio}&fim=${filtro.fim}&garcom_id=${garcomId}`);
    tabela("#resultadoAtendimentos", colunasAtendimentos, dadosAtendimentos);
  } catch (erro) { alert(erro.message); }
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
