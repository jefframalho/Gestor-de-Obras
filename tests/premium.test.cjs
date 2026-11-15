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
