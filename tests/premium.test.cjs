// Testes da camada visual Premium (acrescentada ao fim do CSS, fase a fase).
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');

const html=readFileSync('app/index.html','utf8').replace(/\r\n/g,'\n');
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));
const premium=css.slice(css.indexOf('/* ===== Premium UI'));
const R=[...premium.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m=>({sel:m[1].trim(),dec:m[2]}));
const decl=sel=>R.filter(r=>r.sel.split(',').map(x=>x.trim()).includes(sel)).map(r=>r.dec).join(';');

test('camada Premium não introduz nenhuma cor nova (só variáveis originais)',()=>{
  assert.ok(premium.length>100,'camada Premium presente');
  const sem=premium.replace(/\/\*[\s\S]*?\*\//g,'');
  assert.doesNotMatch(sem,/#[0-9a-fA-F]{3,8}\b/,'cor hexadecimal fixa');
  assert.doesNotMatch(sem,/rgba?\(\s*\d/,'cor rgb fixa');
});

test('Fase 1: números tabulares, valores sem quebra e foco visível na cor da marca',()=>{
  assert.match(decl('.kpi b'),/white-space:nowrap/);
  assert.match(decl('td.r'),/white-space:nowrap/);
  assert.match(decl('.kpi b'),/tabular-nums/);
  assert.match(decl(':focus-visible'),/outline:2px solid var\(--pri\)/);
});

test('Fase 2: "Mais" com ícone próprio; menu com foco visível e toque confortável',()=>{
  assert.match(html,/data-act="maisMenu" data-a="__mais">\$\{ico\('mais'\)\}/);
  assert.match(html,/const IC = \{\n  mais:'<circle/);
  assert.match(decl('.nav button:focus-visible'),/outline:2px solid var\(--pri\)/);
  assert.match(decl('.bnav button'),/min-height:52px/);
});
test('Fase 2: permissões do menu continuam decididas pela mesma lógica',()=>{
  assert.match(html,/const navs = PAGES\.filter\(p => pode\(p\[0\]\)\)/);
  assert.match(html,/\(isAdmin\(\) \? `<button data-act="nav" data-a="admin">/);
});

test('Fase 3: cartões do painel não se esticam; indicadores com altura uniforme',()=>{
  assert.match(decl('.grid2'),/align-items:start/);
  assert.match(decl('.grid2>div:not(.card)'),/display:grid/);
  assert.match(decl('.kpi'),/min-height:104px/);
});

test('Fase 4: abas da obra numa linha com rolagem no celular; cartões de obra com hover/foco',()=>{
  assert.ok(R.some(r=>r.sel==='.tabs'&&/flex-wrap:nowrap/.test(r.dec)&&/overflow-x:auto/.test(r.dec)));
  assert.match(decl('.obra:hover'),/border-color:var\(--pri\)/);
});

test('Fase 5: nome da etapa do cronograma em até duas linhas no celular',()=>{
  assert.ok(R.some(r=>r.sel==='.gname'&&/-webkit-line-clamp:2/.test(r.dec)&&/white-space:normal/.test(r.dec)));
});

test('regressão: rodapé do menu só vira grade no computador (no celular continua oculto)',()=>{
  assert.doesNotMatch(premium.replace(/@media[^{]*\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g,''),/\.sidefoot\{display:grid/,'display:grid fora de @media anularia o display:none do celular');
  assert.match(premium,/@media \(min-width:861px\)\{\.sidefoot\{display:grid;gap:2px\}\}/);
});
test('regressão: indicadores em duas colunas no celular',()=>{
  assert.match(premium,/@media \(max-width:860px\)\{\.kpis\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}\}/);
});
