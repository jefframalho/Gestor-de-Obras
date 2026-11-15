// Linha de base da modernização: o que NÃO pode mudar.
// Lógica (Firebase, dados, permissões, cálculos), regras do Firestore, cores originais, ações e IDs da interface.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {digitais}=require('./helpers/blocos.cjs');

const html=readFileSync('app/index.html','utf8').replace(/\r\n/g,'\n');
const ler=f=>JSON.parse(readFileSync('tests/fixtures/'+f,'utf8'));

// Funções de interface alteradas de propósito na modernização, com o motivo.
// Qualquer outra diferença em relação à main (2266514) faz o teste falhar.
const ALTERADAS_DE_PROPOSITO={};

test('lógica idêntica à produção (exceto interface listada)',()=>{
  const base=ler('logica-base.json').blocos, atual=digitais(html);
  const sumiram=Object.keys(base).filter(k=>!(k in atual));
  const mudaram=Object.keys(base).filter(k=>k in atual&&base[k]!==atual[k]&&!(k in ALTERADAS_DE_PROPOSITO));
  assert.deepEqual(sumiram,[],'blocos removidos: '+sumiram.join(', '));
  assert.deepEqual(mudaram,[],'blocos alterados sem autorização: '+mudaram.join(', '));
});

test('Firebase, assinatura, permissões e perfis exatamente como na produção',()=>{
  const base=ler('logica-base.json').blocos, atual=digitais(html);
  for(const k of ['const FIREBASE_CONFIG','const ADMIN_EMAILS','const PRECO_MENSAL','const DIAS_TESTE','const WHATS_SUPORTE','const USE_FB',
    'const API','const Demo','const PERM','const PAPEIS','const pode','const isAdmin','const ACT','const HOOK','const SCHEMA','const PAGES'])
    assert.equal(atual[k],base[k],k+' foi alterado');
});

test('regras do Firestore idênticas à produção',()=>{
  const h=crypto.createHash('sha256').update(readFileSync('firestore.rules','utf8').replace(/\r\n/g,'\n')).digest('hex');
  assert.equal(h,ler('regras-base.json').sha256);
});

test('cores originais mantidas exatamente (claro e escuro)',()=>{
  const base=ler('cores-base.json').cores;
  const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));
  const blocos={claro:css.match(/:root\{([^}]*)\}/)[1],
    'escuro-auto':css.match(/@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{([^}]*)\}\}/)[1],
    'escuro-manual':css.match(/:root\[data-theme="dark"\]\{(--bg[^}]*)\}/)[1]};
  const falhas=[];
  for(const [tema,vars] of Object.entries(base)){
    const atual=Object.fromEntries([...blocos[tema].matchAll(/--([A-Za-z0-9-]+):([^;]+);?/g)].map(x=>[x[1],x[2].trim()]));
    for(const [k,v] of Object.entries(vars)) if(atual[k]!==v) falhas.push(`${tema} --${k}: ${v} -> ${atual[k]}`);
  }
  assert.deepEqual(falhas,[]);
});

test('nenhuma ação (data-act) ou ID da produção foi removido',()=>{
  const base=ler('interface-base.json');
  const marc=html.replace(/<style[^>]*>[\s\S]*?<\/style>/g,'');
  const n=(a,v)=>marc.split(`${a}="${v}"`).length-1;
  const f1=Object.entries(base.dataAct).filter(([a,c])=>n('data-act',a)<c).map(([a])=>a);
  const f2=Object.entries(base.ids).filter(([i,c])=>n('id',i)<c).map(([i])=>i);
  assert.deepEqual(f1,[],'data-act a menos: '+f1.join(', '));
  assert.deepEqual(f2,[],'IDs a menos: '+f2.join(', '));
});

test('todos os scripts da página são válidos',()=>{
  for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) assert.doesNotThrow(()=>new vm.Script(m[1]));
});

test('PWA: manifesto intacto e service worker com a mesma lista de arquivos',()=>{
  const man=JSON.parse(readFileSync('app/manifest.webmanifest','utf8'));
  assert.equal(man.theme_color,'#14181f'); assert.equal(man.display,'standalone'); assert.equal(man.start_url,'./');
  const sw=readFileSync('app/sw.js','utf8');
  assert.match(sw,/const FILES = \["\.\/", "index\.html", "manifest\.webmanifest", "\.\.\/assets\/icon-192\.png", "\.\.\/assets\/icon-512\.png"\];/);
  assert.match(sw,/if \(e\.request\.method !== "GET" \|\| u\.origin !== location\.origin\) return;/,'não intercepta Firebase/externos');
});
