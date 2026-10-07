/* =========================================================
   Sistema APDA - Amigos Pet de Solonópole (versão offline)
   JavaScript puro. Os dados ficam no localStorage do navegador.
   ========================================================= */

const CHAVE_DB = "apda_dados_v1";
const CHAVE_SESSAO = "apda_sessao_v1";

const CATEGORIAS_SOCIO = { fundador: "Fundador", contribuinte: "Contribuinte", benemerito: "Benemérito", honorario: "Honorário", protetor: "Protetor", voluntario: "Voluntário" };
const CATEGORIAS_ENTRADA = { taxa_socio: "Taxa de sócios", contribuicao_padrinho: "Contribuição de padrinho", doacao: "Doação", evento: "Evento/Bazar", outros_entrada: "Outras entradas" };
const CATEGORIAS_SAIDA = { veterinario: "Veterinário", racao: "Ração", medicamentos: "Medicamentos", castracao: "Castração", manutencao: "Manutenção", outros_saida: "Outras saídas" };
const SITUACOES_ANIMAL = { disponivel: "Disponível", tratamento: "Em tratamento", adotado: "Adotado" };

/* ---------- Dados de exemplo ---------- */
function dadosIniciais() {
  return {
    proxId: 100,
    usuarios: [{ id: 1, usuario: "admin", senha: "admin123", nome: "Administrador" }],
    socios: [
      { id: 2, nome: "Maria das Graças Silva", categoria: "fundador", inscricao: "001", profissao: "Professora", nascimento: "1975-10-12", telefone: "(88) 99999-1111", ativo: true, obs: "" },
      { id: 3, nome: "José Ferreira Lima", categoria: "contribuinte", inscricao: "002", profissao: "Comerciante", nascimento: "1982-03-05", telefone: "(88) 99999-2222", ativo: true, obs: "" },
      { id: 4, nome: "Ana Paula Souza", categoria: "protetor", inscricao: "003", profissao: "Enfermeira", nascimento: "1990-10-25", telefone: "(88) 99999-3333", ativo: true, obs: "Ajuda nos resgates" },
    ],
    padrinhos: [
      { id: 5, nome: "Carlos Eduardo Ramos", nascimento: "1980-07-19", telefone: "(88) 98888-1111", endereco: "Rua Central, 120", obs: "" },
      { id: 6, nome: "Padaria Pão Dourado", nascimento: "", telefone: "(88) 3555-1234", endereco: "Av. Principal, 45", obs: "Doa ração mensalmente" },
    ],
    animais: [
      { id: 7, nome: "Luna", especie: "Canina", sexo: "femea", castrado: true, situacao: "disponivel", obs: "" },
      { id: 8, nome: "Thor", especie: "Canina", sexo: "macho", castrado: false, situacao: "tratamento", obs: "Pitbull resgatado" },
      { id: 9, nome: "Mimi", especie: "Felina", sexo: "femea", castrado: false, situacao: "disponivel", obs: "" },
      { id: 10, nome: "Bob", especie: "Canina", sexo: "macho", castrado: true, situacao: "adotado", obs: "" },
    ],
    adocoes: [{ id: 11, animalId: 10, adotante: "Francisca Oliveira", telefone: "(88) 97777-1111", endereco: "Rua das Flores, 9", data: "2026-09-10" }],
    caixa: [
      { id: 12, tipo: "entrada", categoria: "taxa_socio", mes: "2026-09", valor: 10, descricao: "Maria das Graças Silva" },
      { id: 13, tipo: "entrada", categoria: "contribuicao_padrinho", mes: "2026-09", valor: 50, descricao: "Carlos Eduardo Ramos - apadrinhamento do Thor" },
      { id: 14, tipo: "saida", categoria: "racao", mes: "2026-09", valor: 120, descricao: "Saco de ração 15kg" },
      { id: 15, tipo: "saida", categoria: "veterinario", mes: "2026-09", valor: 80, descricao: "Consulta do Thor" },
    ],
  };
}

let db = carregar();
function carregar() {
  try { return JSON.parse(localStorage.getItem(CHAVE_DB)) || dadosIniciais(); }
  catch { return dadosIniciais(); }
}
function salvar() { localStorage.setItem(CHAVE_DB, JSON.stringify(db)); }
function novoId() { db.proxId++; return db.proxId; }

/* ---------- Utilidades ---------- */
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (d) => (d ? d.split("-").reverse().join("/") : "-");
const mesBR = (m) => (m ? m.split("-").reverse().join("/") : "-");
const mesAtual = () => new Date().toISOString().slice(0, 7);

function maskTelefone(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  return v;
}
function maskDinheiro(v) {
  const n = v.replace(/\D/g, "");
  return n ? (Number(n) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "";
}
const lerDinheiro = (v) => Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("oculto");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.add("oculto"), 2500);
}

/* ---------- Modal genérico ----------
   campos: [{ nome, rotulo, tipo, opcoes, valor, obrigatorio }] */
function abrirModal(titulo, campos, aoSalvar) {
  $("#modal-titulo").textContent = titulo;
  const form = $("#modal-form");
  form.innerHTML = campos.map((c) => {
    const req = c.obrigatorio ? "required" : "";
    const v = esc(c.valor ?? "");
    let input;
    if (c.tipo === "select") input = `<select name="${c.nome}" ${req}>${Object.entries(c.opcoes).map(([k, r]) => `<option value="${esc(k)}" ${String(c.valor) === k ? "selected" : ""}>${esc(r)}</option>`).join("")}</select>`;
    else if (c.tipo === "textarea") input = `<textarea name="${c.nome}" rows="3">${v}</textarea>`;
    else if (c.tipo === "checkbox") return `<label><input type="checkbox" name="${c.nome}" style="width:auto" ${c.valor ? "checked" : ""}> ${esc(c.rotulo)}</label>`;
    else input = `<input name="${c.nome}" type="${c.tipo || "text"}" value="${v}" ${req} data-mask="${c.mascara || ""}">`;
    return `<label>${esc(c.rotulo)} ${input}</label>`;
  }).join("") + `<div class="acoes" style="justify-content:flex-end"><button type="button" class="btn" id="modal-cancelar">Cancelar</button><button class="btn primario">Salvar</button></div>`;

  form.querySelectorAll("[data-mask=telefone]").forEach((i) => i.addEventListener("input", () => (i.value = maskTelefone(i.value))));
  form.querySelectorAll("[data-mask=dinheiro]").forEach((i) => i.addEventListener("input", () => (i.value = maskDinheiro(i.value))));
  $("#modal-cancelar").onclick = fecharModal;
  form.onsubmit = (e) => {
    e.preventDefault();
    const dados = {};
    campos.forEach((c) => {
      const el = form.elements[c.nome];
      dados[c.nome] = c.tipo === "checkbox" ? el.checked : el.value.trim();
    });
    aoSalvar(dados); salvar(); fecharModal(); render(); toast("Salvo com sucesso!");
  };
  $("#modal").classList.remove("oculto");
  return form;
}
function fecharModal() { $("#modal").classList.add("oculto"); }

function excluir(lista, id, nome) {
  if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return;
  db[lista] = db[lista].filter((x) => x.id !== id);
  salvar(); render(); toast("Excluído.");
}

/* ---------- Páginas ---------- */
const PAGINAS = {
  painel: { titulo: "Painel", render: paginaPainel },
  socios: { titulo: "Sócios", render: paginaSocios },
  padrinhos: { titulo: "Padrinhos", render: paginaPadrinhos },
  animais: { titulo: "Animais", render: paginaAnimais },
  adocoes: { titulo: "Adoções", render: paginaAdocoes },
  caixa: { titulo: "Caixa", render: paginaCaixa },
  relatorio: { titulo: "Relatório", render: paginaRelatorio },
};
let paginaAtual = "painel";
let busca = "";
let filtroMes = mesAtual();

function paginaPainel() {
  const ativos = db.socios.filter((s) => s.ativo).length;
  const saldo = db.caixa.reduce((t, l) => t + (l.tipo === "entrada" ? l.valor : -l.valor), 0);
  const mes = new Date().getMonth() + 1;
  const aniver = [...db.socios, ...db.padrinhos].filter((p) => p.nascimento && Number(p.nascimento.slice(5, 7)) === mes);
  const faltam = db.animais.filter((a) => !a.castrado && a.situacao !== "adotado").length;
  return `
    <div class="grade">
      <div class="cartao indicador"><small>Sócios ativos</small><b>${ativos}</b></div>
      <div class="cartao indicador"><small>Padrinhos</small><b>${db.padrinhos.length}</b></div>
      <div class="cartao indicador"><small>Animais na associação</small><b>${db.animais.filter((a) => a.situacao !== "adotado").length}</b></div>
      <div class="cartao indicador"><small>Faltam castrar</small><b>${faltam}</b></div>
      <div class="cartao indicador"><small>Adoções</small><b>${db.adocoes.length}</b></div>
      <div class="cartao indicador"><small>Saldo do caixa</small><b>${brl(saldo)}</b></div>
    </div>
    <div class="cartao">
      <h3>🎂 Aniversariantes do mês</h3>
      ${aniver.length ? `<ul>${aniver.map((p) => `<li>${esc(p.nome)} — ${dataBR(p.nascimento).slice(0, 5)}</li>`).join("")}</ul>` : "<p>Nenhum aniversariante este mês.</p>"}
    </div>
    <p class="nao-imprimir"><button class="btn" data-acao="restaurar">Restaurar dados de exemplo</button></p>`;
}

function filtrar(lista) {
  const b = busca.toLowerCase();
  return lista.filter((x) => !b || JSON.stringify(x).toLowerCase().includes(b));
}
const barraBusca = (botao) => `<div class="acoes"><input placeholder="Buscar..." id="busca" value="${esc(busca)}"><button class="btn primario" data-acao="${botao}">+ Novo</button></div>`;
const botoesLinha = (lista, id) => `<button class="btn pequeno" data-editar="${lista}" data-id="${id}">✏️</button> <button class="btn pequeno perigo" data-excluir="${lista}" data-id="${id}">🗑️</button>`;

/* Sócios */
function formSocio(s = {}) {
  abrirModal(s.id ? "Editar sócio" : "Novo sócio", [
    { nome: "nome", rotulo: "Nome completo", valor: s.nome, obrigatorio: true },
    { nome: "categoria", rotulo: "Categoria", tipo: "select", opcoes: CATEGORIAS_SOCIO, valor: s.categoria || "contribuinte" },
    { nome: "inscricao", rotulo: "Nº de inscrição", valor: s.inscricao },
    { nome: "profissao", rotulo: "Profissão", valor: s.profissao },
    { nome: "nascimento", rotulo: "Data de nascimento", tipo: "date", valor: s.nascimento },
    { nome: "telefone", rotulo: "Telefone", valor: s.telefone, mascara: "telefone" },
    { nome: "obs", rotulo: "Observações", tipo: "textarea", valor: s.obs },
    { nome: "ativo", rotulo: "Sócio ativo", tipo: "checkbox", valor: s.id ? s.ativo : true },
  ], (d) => { s.id ? Object.assign(s, d) : db.socios.push({ id: novoId(), ...d }); });
}
function paginaSocios() {
  const lista = filtrar(db.socios);
  return barraBusca("novo-socio") + `<table><tr><th>Inscr.</th><th>Nome</th><th>Categoria</th><th>Profissão</th><th>Telefone</th><th>Situação</th><th></th></tr>
    ${lista.map((s) => `<tr><td>${esc(s.inscricao)}</td><td>${esc(s.nome)}${s.obs ? `<br><small>${esc(s.obs)}</small>` : ""}</td><td><span class="etiqueta">${CATEGORIAS_SOCIO[s.categoria]}</span></td><td>${esc(s.profissao)}</td><td>${esc(s.telefone)}</td><td>${s.ativo ? "Ativo" : "Inativo"}</td><td>${botoesLinha("socios", s.id)}</td></tr>`).join("") || `<tr><td colspan="7">Nenhum sócio.</td></tr>`}</table>`;
}

/* Padrinhos */
function formPadrinho(p = {}) {
  abrirModal(p.id ? "Editar padrinho" : "Novo padrinho", [
    { nome: "nome", rotulo: "Nome", valor: p.nome, obrigatorio: true },
    { nome: "nascimento", rotulo: "Data de nascimento", tipo: "date", valor: p.nascimento },
    { nome: "telefone", rotulo: "Telefone", valor: p.telefone, mascara: "telefone" },
    { nome: "endereco", rotulo: "Endereço", valor: p.endereco },
    { nome: "obs", rotulo: "Observações", tipo: "textarea", valor: p.obs },
  ], (d) => { p.id ? Object.assign(p, d) : db.padrinhos.push({ id: novoId(), ...d }); });
}
function paginaPadrinhos() {
  const lista = filtrar(db.padrinhos);
  return barraBusca("novo-padrinho") + `<table><tr><th>Nome</th><th>Nascimento</th><th>Telefone</th><th>Endereço</th><th>Observações</th><th></th></tr>
    ${lista.map((p) => `<tr><td>${esc(p.nome)}</td><td>${dataBR(p.nascimento)}</td><td>${esc(p.telefone)}</td><td>${esc(p.endereco)}</td><td>${esc(p.obs)}</td><td>${botoesLinha("padrinhos", p.id)}</td></tr>`).join("") || `<tr><td colspan="6">Nenhum padrinho.</td></tr>`}</table>`;
}

/* Animais */
function formAnimal(a = {}) {
  abrirModal(a.id ? "Editar animal" : "Novo animal", [
    { nome: "nome", rotulo: "Nome", valor: a.nome, obrigatorio: true },
    { nome: "especie", rotulo: "Espécie", tipo: "select", opcoes: { Canina: "Canina", Felina: "Felina", Outra: "Outra" }, valor: a.especie },
    { nome: "sexo", rotulo: "Sexo", tipo: "select", opcoes: { macho: "Macho", femea: "Fêmea" }, valor: a.sexo },
    { nome: "situacao", rotulo: "Situação", tipo: "select", opcoes: SITUACOES_ANIMAL, valor: a.situacao },
    { nome: "castrado", rotulo: "Castrado", tipo: "checkbox", valor: a.castrado },
    { nome: "obs", rotulo: "Observações", tipo: "textarea", valor: a.obs },
  ], (d) => { a.id ? Object.assign(a, d) : db.animais.push({ id: novoId(), ...d }); });
}
function paginaAnimais() {
  const lista = filtrar(db.animais);
  return barraBusca("novo-animal") + `<table><tr><th>Nome</th><th>Espécie</th><th>Sexo</th><th>Castrado</th><th>Situação</th><th></th></tr>
    ${lista.map((a) => `<tr><td>${esc(a.nome)}</td><td>${a.especie}</td><td>${a.sexo === "macho" ? "Macho" : "Fêmea"}</td><td>${a.castrado ? "Sim" : "Não"}</td><td><span class="etiqueta">${SITUACOES_ANIMAL[a.situacao]}</span></td><td>${botoesLinha("animais", a.id)}</td></tr>`).join("") || `<tr><td colspan="6">Nenhum animal.</td></tr>`}</table>`;
}

/* Adoções */
function formAdocao(ad = {}) {
  const opcoes = {};
  db.animais.filter((a) => a.situacao !== "adotado" || a.id === ad.animalId).forEach((a) => (opcoes[a.id] = `${a.nome} (${a.especie})`));
  if (!Object.keys(opcoes).length) return toast("Nenhum animal disponível para adoção.");
  abrirModal(ad.id ? "Editar adoção" : "Nova adoção", [
    { nome: "animalId", rotulo: "Animal", tipo: "select", opcoes, valor: String(ad.animalId || "") },
    { nome: "adotante", rotulo: "Nome do adotante", valor: ad.adotante, obrigatorio: true },
    { nome: "telefone", rotulo: "Telefone", valor: ad.telefone, mascara: "telefone" },
    { nome: "endereco", rotulo: "Endereço do adotante", valor: ad.endereco },
    { nome: "data", rotulo: "Data da adoção", tipo: "date", valor: ad.data || new Date().toISOString().slice(0, 10), obrigatorio: true },
  ], (d) => {
    d.animalId = Number(d.animalId);
    ad.id ? Object.assign(ad, d) : db.adocoes.push({ id: novoId(), ...d });
    const animal = db.animais.find((a) => a.id === d.animalId);
    if (animal) animal.situacao = "adotado";
  });
}
function paginaAdocoes() {
  const lista = filtrar(db.adocoes);
  return barraBusca("nova-adocao") + `<table><tr><th>Data</th><th>Animal</th><th>Adotante</th><th>Telefone</th><th>Endereço</th><th></th></tr>
    ${lista.map((ad) => { const a = db.animais.find((x) => x.id === ad.animalId); return `<tr><td>${dataBR(ad.data)}</td><td>${esc(a ? a.nome : "-")}</td><td>${esc(ad.adotante)}</td><td>${esc(ad.telefone)}</td><td>${esc(ad.endereco)}</td><td>${botoesLinha("adocoes", ad.id)}</td></tr>`; }).join("") || `<tr><td colspan="6">Nenhuma adoção.</td></tr>`}</table>`;
}

/* Caixa */
function formLancamento(l = {}, tipo = l.tipo || "entrada") {
  const cats = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;
  const form = abrirModal(`${l.id ? "Editar" : "Nova"} ${tipo === "entrada" ? "entrada" : "saída"}`, [
    { nome: "categoria", rotulo: "Categoria", tipo: "select", opcoes: cats, valor: l.categoria },
    { nome: "mes", rotulo: "Mês de referência", tipo: "month", valor: l.mes || mesAtual(), obrigatorio: true },
    { nome: "descricao", rotulo: "Descrição / Nome", valor: l.descricao, obrigatorio: true },
    { nome: "valor", rotulo: "Valor (R$)", valor: l.valor ? Number(l.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "", mascara: "dinheiro", obrigatorio: true },
  ], (d) => {
    const dados = { ...d, tipo, valor: lerDinheiro(d.valor) };
    l.id ? Object.assign(l, dados) : db.caixa.push({ id: novoId(), ...dados });
  });
  // Seletor que puxa sócios ou padrinhos cadastrados
  const sel = form.elements.categoria;
  const desc = form.elements.descricao;
  const seletor = document.createElement("label");
  desc.parentElement.before(seletor);
  const atualizar = () => {
    const fonte = sel.value === "taxa_socio" ? db.socios.filter((s) => s.ativo) : sel.value === "contribuicao_padrinho" ? db.padrinhos : null;
    if (!fonte) { seletor.innerHTML = ""; return; }
    seletor.innerHTML = `${sel.value === "taxa_socio" ? "Sócio cadastrado" : "Padrinho cadastrado"} <select><option value="">Selecione...</option>${fonte.map((p) => `<option>${esc(p.nome)}</option>`).join("")}</select>`;
    seletor.querySelector("select").onchange = (e) => { if (e.target.value) desc.value = e.target.value; };
  };
  sel.addEventListener("change", atualizar); atualizar();
}
function paginaCaixa() {
  const lista = filtrar(db.caixa.filter((l) => !filtroMes || l.mes === filtroMes)).sort((a, b) => b.mes.localeCompare(a.mes));
  const ent = lista.filter((l) => l.tipo === "entrada").reduce((t, l) => t + l.valor, 0);
  const sai = lista.filter((l) => l.tipo === "saida").reduce((t, l) => t + l.valor, 0);
  return `<div class="grade">
      <div class="cartao indicador"><small>Entradas</small><b class="entrada">${brl(ent)}</b></div>
      <div class="cartao indicador"><small>Saídas</small><b class="saida">${brl(sai)}</b></div>
      <div class="cartao indicador"><small>Resultado</small><b>${brl(ent - sai)}</b></div>
    </div>
    <div class="acoes"><input type="month" id="filtro-mes" value="${filtroMes}"> <button class="btn" data-acao="todos-meses">Todos os meses</button>
      <input placeholder="Buscar..." id="busca" value="${esc(busca)}">
      <button class="btn primario" data-acao="nova-entrada">+ Entrada</button><button class="btn perigo" data-acao="nova-saida">+ Saída</button></div>
    <table><tr><th>Mês</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th></th></tr>
    ${lista.map((l) => `<tr><td>${mesBR(l.mes)}</td><td class="${l.tipo}">${l.tipo === "entrada" ? "Entrada" : "Saída"}</td><td>${CATEGORIAS_ENTRADA[l.categoria] || CATEGORIAS_SAIDA[l.categoria]}</td><td>${esc(l.descricao)}</td><td class="${l.tipo}">${brl(l.valor)}</td><td>${botoesLinha("caixa", l.id)}</td></tr>`).join("") || `<tr><td colspan="6">Nenhum lançamento neste período.</td></tr>`}</table>`;
}

/* Relatório para impressão */
function paginaRelatorio() {
  const lista = db.caixa.filter((l) => !filtroMes || l.mes === filtroMes);
  const bloco = (tipo, cats) => Object.entries(cats).map(([k, nome]) => {
    const itens = lista.filter((l) => l.tipo === tipo && l.categoria === k);
    if (!itens.length) return "";
    const sub = itens.reduce((t, l) => t + l.valor, 0);
    return `<tr><th colspan="2">${nome}</th><th>${brl(sub)}</th></tr>` + itens.map((l) => `<tr><td>${mesBR(l.mes)}</td><td>${esc(l.descricao)}</td><td>${brl(l.valor)}</td></tr>`).join("");
  }).join("");
  const ent = lista.filter((l) => l.tipo === "entrada").reduce((t, l) => t + l.valor, 0);
  const sai = lista.filter((l) => l.tipo === "saida").reduce((t, l) => t + l.valor, 0);
  return `<div class="acoes"><input type="month" id="filtro-mes" value="${filtroMes}"><button class="btn" data-acao="todos-meses">Todos os meses</button><button class="btn primario" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button></div>
    <div class="cartao">
      <div style="text-align:center"><h2 style="margin:0">Associação Protetora dos Animais - APDA</h2><p>Amigos Pet de Solonópole</p><h3>Relatório do Caixa — ${filtroMes ? mesBR(filtroMes) : "Todos os meses"}</h3></div>
      <p><b>Entradas:</b> ${brl(ent)} &nbsp; <b>Saídas:</b> ${brl(sai)} &nbsp; <b>Resultado:</b> ${brl(ent - sai)}</p>
      <h4>Entradas</h4><table>${bloco("entrada", CATEGORIAS_ENTRADA) || "<tr><td>Sem entradas.</td></tr>"}</table>
      <h4>Saídas</h4><table>${bloco("saida", CATEGORIAS_SAIDA) || "<tr><td>Sem saídas.</td></tr>"}</table>
      <div class="assinaturas"><div>Presidente</div><div>Tesoureiro(a)</div></div>
      <p style="text-align:right;font-size:12px">Emitido em ${new Date().toLocaleDateString("pt-BR")}</p>
    </div>`;
}

/* ---------- Renderização e eventos ---------- */
const FORMS = { socios: formSocio, padrinhos: formPadrinho, animais: formAnimal, adocoes: formAdocao, caixa: (l) => formLancamento(l) };

function render() {
  $("#nav").innerHTML = Object.entries(PAGINAS).map(([k, p]) => `<a data-pagina="${k}" class="${k === paginaAtual ? "ativo" : ""}">${p.titulo}</a>`).join("");
  $("#titulo-pagina").textContent = PAGINAS[paginaAtual].titulo;
  $("#pagina").innerHTML = PAGINAS[paginaAtual].render();
  const b = $("#busca");
  if (b) b.oninput = () => { busca = b.value; const pos = b.selectionStart; render(); const n = $("#busca"); n.focus(); n.setSelectionRange(pos, pos); };
  const fm = $("#filtro-mes");
  if (fm) fm.onchange = () => { filtroMes = fm.value; render(); };
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-pagina],[data-acao],[data-editar],[data-excluir]");
  if (!t) return;
  if (t.dataset.pagina) { paginaAtual = t.dataset.pagina; busca = ""; if (innerWidth < 760) document.body.classList.add("menu-fechado"); return render(); }
  if (t.dataset.editar) { const item = db[t.dataset.editar].find((x) => x.id === Number(t.dataset.id)); return FORMS[t.dataset.editar](item); }
  if (t.dataset.excluir) { const item = db[t.dataset.excluir].find((x) => x.id === Number(t.dataset.id)); return excluir(t.dataset.excluir, item.id, item.nome || item.adotante || item.descricao); }
  const acoes = {
    "novo-socio": () => formSocio(), "novo-padrinho": () => formPadrinho(), "novo-animal": () => formAnimal(), "nova-adocao": () => formAdocao(),
    "nova-entrada": () => formLancamento({}, "entrada"), "nova-saida": () => formLancamento({}, "saida"),
    "todos-meses": () => { filtroMes = ""; render(); },
    restaurar: () => { if (confirm("Apagar tudo e voltar aos dados de exemplo?")) { db = dadosIniciais(); salvar(); render(); toast("Dados restaurados."); } },
  };
  acoes[t.dataset.acao]?.();
});

/* Login / sessão */
function entrarApp() { $("#tela-login").classList.add("oculto"); $("#tela-app").classList.remove("oculto"); render(); }
$("#form-login").onsubmit = (e) => {
  e.preventDefault();
  const u = db.usuarios.find((x) => x.usuario === $("#login-usuario").value.trim() && x.senha === $("#login-senha").value);
  if (!u) return toast("Usuário ou senha inválidos.");
  localStorage.setItem(CHAVE_SESSAO, u.usuario); entrarApp();
};
$("#btn-sair").onclick = () => { localStorage.removeItem(CHAVE_SESSAO); location.reload(); };
$("#btn-menu").onclick = () => document.body.classList.toggle("menu-fechado");
$("#btn-tema").onclick = () => { document.body.classList.toggle("escuro"); localStorage.setItem("apda_tema", document.body.classList.contains("escuro") ? "escuro" : "claro"); };
$("#modal-fechar").onclick = fecharModal;

if (localStorage.getItem("apda_tema") === "escuro") document.body.classList.add("escuro");
salvar();
if (localStorage.getItem(CHAVE_SESSAO)) entrarApp();
