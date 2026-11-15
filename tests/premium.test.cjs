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
