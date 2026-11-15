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
  // Única exceção: na impressão, o trecho delimitado reaplica a paleta clara ORIGINAL (conferida no teste da Fase 11)
  const sem=premium.replace(/paleta-clara-original:inicio[\s\S]*?paleta-clara-original:fim/,'').replace(/\/\*[\s\S]*?\*\//g,'');
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

test('Fase 6: cartões no celular com informações empilhadas, sem vãos e textos longos em largura total',()=>{
  assert.ok(R.some(r=>r.sel==='table.cards td'&&/display:grid/.test(r.dec)&&/row-gap:2px/.test(r.dec)),'grade com espaço vertical pequeno (a regra original tem gap:12px)');
  assert.ok(R.some(r=>r.sel==='table.cards td::before'&&/grid-row:1\/span 3/.test(r.dec)));
  assert.ok(R.some(r=>r.sel.includes('[data-label="Descrição"]')&&r.sel.endsWith('>*')&&/justify-self:auto/.test(r.dec)),'Chrome aplica justify-self também em bloco');
});

test('Fase 7: 1ª coluna continua título do cartão; cotação com 1ª coluna fixa; toque nos botões',()=>{
  assert.ok(R.filter(r=>r.sel.includes('[data-label="Descrição"]')).every(r=>r.sel.includes('td:not(:first-child):is(')),'a 1ª coluna (ex.: Material) não pode receber o rótulo de texto longo');
  assert.match(decl('table.cot td:first-child'),/position:sticky;left:0/);
  assert.ok(R.some(r=>r.sel==='table.cards td .btn.sm'&&/min-height:36px/.test(r.dec)));
});

test('Fase 8: listas de seleção da equipe com toque de 44px no celular',()=>{
  assert.ok(R.some(r=>r.sel==='.checks label,.chk'&&/min-height:44px/.test(r.dec)));
  assert.match(decl('.rpes:hover'),/border-color:var\(--pri\)/);
});

test('Fase 9: campos com 16px no celular (sem zoom do iPhone), altura confortável e desabilitado visível',()=>{
  assert.ok(R.some(r=>r.sel.startsWith('.fld input:not([type=checkbox]),.fld select,.fld textarea,.sel')&&/font-size:16px/.test(r.dec)));
  assert.match(decl('.fld input:disabled'),/cursor:not-allowed/);
  assert.ok(R.some(r=>r.sel==='.mact .btn'&&/min-height:44px/.test(r.dec)));
});

test('Fase 10: linhas que abrem registro são focáveis e Enter/Espaço disparam o mesmo clique',()=>{
  assert.match(html,/document\.querySelectorAll\("tbody tr\[data-col\]\[data-id\]:not\(\[tabindex\]\)"\)\.forEach\(tr => \{ tr\.tabIndex = 0; \}\)/);
  assert.match(html,/if \(\(e\.key === "Enter" \|\| e\.key === " "\) && e\.target\?\.matches\?\.\("tbody tr\[data-col\]\[data-id\]"\)\) \{ e\.preventDefault\(\); e\.target\.click\(\); \}/);
  assert.match(decl('tbody tr:focus-visible'),/outline:2px solid var\(--pri\)/);
});

test('Fase 11: impressão usa só valores claros originais, esconde controles e volta a tabela',()=>{
  const base=require('./fixtures/cores-base.json').cores.claro;
  const m=premium.match(/paleta-clara-original:inicio[\s\S]*?\{([^}]*)\}[\s\S]*?paleta-clara-original:fim/);
  assert.ok(m,'trecho da paleta de impressão presente');
  const cvOrig=Object.fromEntries([...css.match(/:root\{(--cv-grid[^}]*)\}/)[1].matchAll(/--([\w-]+):([^;]+)/g)].map(x=>[x[1],x[2].trim()]));
  let n=0;
  for(const [,k,v] of m[1].matchAll(/--([\w-]+):([^;]+)/g)){
    const esperado=k.startsWith('cv-')?cvOrig[k]:base[k];
    assert.equal(v.trim(),esperado,'--'+k+' deve ser o valor claro original'); n++;
  }
  assert.ok(n>=10,'paleta de impressão completa');
  assert.match(decl('.bnav'),/display:none!important/);
  assert.match(decl('table.cards td'),/display:table-cell!important/);
});
