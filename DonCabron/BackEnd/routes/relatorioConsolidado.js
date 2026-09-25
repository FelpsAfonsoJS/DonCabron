function consolidar(linhas, mesaId, ordem) {
  const mesas = new Map();
  const frequencias = new Map();
  for (const item of linhas) {
    const id = String(item.mesa_id);
    if (!mesas.has(id)) mesas.set(id, { id: item.mesa_id, numero: item.numero, centavos: 0, comandas: new Set(), produtos: new Map(), garcons: new Map() });
    const mesa = mesas.get(id);
    const centavos = Math.round(Number(item.valor_total) * 100);
    mesa.centavos += centavos;
    mesa.comandas.add(item.comanda_id);
    const produtoId = String(item.produto_id);
    if (!mesa.produtos.has(produtoId)) mesa.produtos.set(produtoId, { nome: item.produto, quantidade: 0, centavos: 0 });
    const produto = mesa.produtos.get(produtoId);
    produto.quantidade += Number(item.quantidade);
    produto.centavos += centavos;
    const garcomId = item.garcom_id == null ? "sem-garcom" : String(item.garcom_id);
    if (!mesa.garcons.has(garcomId)) mesa.garcons.set(garcomId, { id: item.garcom_id, nome: item.garcom, comandas: new Set() });
    mesa.garcons.get(garcomId).comandas.add(item.comanda_id);
    if (item.garcom_id != null) {
      if (!frequencias.has(garcomId)) frequencias.set(garcomId, new Map());
      const porMesa = frequencias.get(garcomId);
      if (!porMesa.has(id)) porMesa.set(id, { numero: item.numero, comandas: new Set() });
      porMesa.get(id).comandas.add(item.comanda_id);
    }
  }
  const favoritos = id => {
    const dados = [...(frequencias.get(String(id)) || new Map()).values()];
    const maximo = Math.max(0, ...dados.map(x => x.comandas.size));
    return dados.filter(x => x.comandas.size === maximo)
      .sort((a,b) => Number(a.numero) - Number(b.numero))
      .map(x => ({ numero: x.numero, atendimentos: x.comandas.size }));
  };
  const ranking = garcons => [...garcons.values()].map(g => ({
    id: g.id, nome: g.nome, atendimentos: g.comandas.size,
    mesas_mais_atendidas: favoritos(g.id),
  })).sort((a,b) => b.atendimentos - a.atendimentos || a.nome.localeCompare(b.nome));
  const selecionadas = [...mesas.values()].filter(m => m.centavos >= 100 && (!mesaId || String(m.id) === mesaId));
  const garcons = new Map();
  for (const mesa of selecionadas) for (const [id,g] of mesa.garcons) {
    if (!garcons.has(id)) garcons.set(id, { ...g, comandas: new Set() });
    for (const comanda of g.comandas) garcons.get(id).comandas.add(comanda);
  }
  const resultado = selecionadas.map(m => ({
    id: m.id, numero: m.numero, valor_total: m.centavos / 100,
    atendimentos: m.comandas.size, garcons: ranking(m.garcons),
    produtos: [...m.produtos.values()].map(p => ({ nome: p.nome, quantidade: p.quantidade, valor_total: p.centavos / 100 }))
      .sort((a,b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome)),
  })).sort((a,b) => (ordem === "menor" ? 1 : -1) * (a.valor_total - b.valor_total) || Number(a.numero) - Number(b.numero));
  return { mesas: resultado, garcons: ranking(garcons), valor_total: selecionadas.reduce((s,m) => s + m.centavos, 0) / 100 };
}
module.exports = { consolidar };
