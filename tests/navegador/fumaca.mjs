// Teste de fumaça no navegador (Chrome headless), SEM dados reais.
// - Serve a pasta do projeto localmente e entrega o app com FIREBASE_CONFIG vazio (modo demonstração),
//   alterando só a resposta em memória: nenhum arquivo do projeto é modificado.
// - Bloqueia todos os domínios do Firebase/Google APIs: nada sai para a produção.
// Uso: npm run test:navegador   (Chrome instalado; outro caminho: variável CHROME)
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORTA = 8900 + Math.floor(Math.random() * 90), DEPURACAO = PORTA + 1000;
const CHROME = process.env.CHROME || ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(c => fs.existsSync(c));
if (!CHROME) { console.error('Chrome não encontrado. Informe o caminho na variável CHROME.'); process.exit(2); }

const MENUS = {
  admin: ['dashboard', 'obras', 'orcamentos', 'financeiro', 'materiais', 'equipe', 'clientes', 'config'],
  engenheiro: ['dashboard', 'obras', 'materiais', 'equipe'],
  financeiro: ['dashboard', 'obras', 'orcamentos', 'financeiro', 'materiais', 'clientes', 'config'],
};
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };

function modoDemonstracao(html) {
  const a = html.indexOf('const FIREBASE_CONFIG = {'); if (a < 0) throw new Error('FIREBASE_CONFIG não encontrado');
  const b = html.indexOf('};', a) + 2;
  return html.slice(0, a) + 'const FIREBASE_CONFIG = {};' + html.slice(b);
}
const servidor = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(RAIZ, p);
  if (!f.startsWith(RAIZ) || f.includes(`${path.sep}.git`) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  if (f === path.join(RAIZ, 'app', 'index.html')) return r.end(modoDemonstracao(fs.readFileSync(f, 'utf8')));
  fs.createReadStream(f).pipe(r);
}).listen(PORTA, '127.0.0.1');

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'gestor-fumaca-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEPURACAO}`, `--user-data-dir=${perfil}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
let ws, seq = 0; const pend = new Map(), errosJS = [], falhas = [];
const cmd = (method, params = {}, sessionId) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params, sessionId })); return new Promise((res, rej) => pend.set(id, { res, rej })); };
const js = (s, e) => cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }, s).then(r => r.exceptionDetails ? `EXC ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}` : r.result?.value);
const confere = (ok, msg) => { console.log(`${ok ? '  ok ' : '  FALHOU'} ${msg}`); if (!ok) falhas.push(msg); };
const BASE = `http://127.0.0.1:${PORTA}/app/index.html`;
const TELAS = { desktop: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, celular: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true } };

async function novaAba(vp, tema) {
  const { targetId } = await cmd('Target.createTarget', { url: 'about:blank' });
  const { sessionId: s } = await cmd('Target.attachToTarget', { targetId, flatten: true });
  for (const d of ['Page', 'Runtime', 'Network']) await cmd(`${d}.enable`, {}, s);
  await cmd('Network.setBlockedURLs', { urls: ['*firebase*', '*identitytoolkit*', '*firestore.googleapis.com*', '*securetoken*', '*google-analytics*', '*googletagmanager*'] }, s);
  await cmd('Emulation.setDeviceMetricsOverride', TELAS[vp], s);
  await cmd('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-color-scheme', value: tema }] }, s);
  return { s, targetId };
}
async function ir(s) { await cmd('Page.navigate', { url: BASE }, s); await espera(1500); }
async function entrarDemo(s) {
  await ir(s); await js(s, 'localStorage.clear(); sessionStorage.clear(); ""'); await ir(s);
  const ok = await js(s, `(()=>{const b=document.getElementById('b_demo'); if(!b) return false; b.click(); return true})()`);
  if (!ok) throw new Error('botão de demonstração não encontrado');
  await espera(1500); await js(s, `document.querySelector('[data-act="exemplo"]')?.click(); ""`); await espera(1500);
}
const nav = async (s, p) => { await js(s, `document.querySelector('[data-act="nav"][data-a="${p}"]')?.click(); ""`); await espera(700); };
const menu = s => js(s, `[...document.querySelectorAll('.side [data-act="nav"]')].map(b=>b.dataset.a)`);
const transborda = s => js(s, 'document.documentElement.scrollWidth > innerWidth + 1');

async function rodada(vp, tema) {
  console.log(`\n[${vp} · ${tema === 'dark' ? 'escuro' : 'claro'}]`);
  const { s, targetId } = await novaAba(vp, tema);
  await entrarDemo(s);
  confere(await js(s, '!!document.querySelector("#main")'), 'entrou no modo demonstração com dados de exemplo');
  for (const [papel, esperado] of Object.entries(MENUS)) {
    if (papel !== 'admin') { await js(s, `S.perfil.papel='${papel}'; montarApp(); ""`); await espera(600); }
    const m = await menu(s);
    confere(JSON.stringify(m) === JSON.stringify(esperado), `menu do perfil ${papel}: ${m.join(', ')}`);
    for (const p of m) { await nav(s, p); if (await transborda(s)) confere(false, `${papel}/${p} sem rolagem lateral`); }
  }
  await js(s, `S.perfil.papel='admin'; montarApp(); ""`); await espera(600);
  await nav(s, 'financeiro');
  const linha = await js(s, `(()=>{const tr=document.querySelector('#main tbody tr[data-col][data-id]'); if(!tr) return 'sem linhas'; tr.focus(); if(document.activeElement!==tr) return 'linha não focável';
    tr.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); return !!document.querySelector('.ov .modal')})()`);
  confere(linha === true, 'Enter numa linha do financeiro abre o lançamento');
  await js(s, `typeof fecharModal==='function'&&fecharModal(); ""`);
  await cmd('Emulation.setEmulatedMedia', { media: 'print', features: [{ name: 'prefers-color-scheme', value: tema }] }, s);
  await espera(400);
  const imp = await js(s, `(()=>{const vis=q=>[...document.querySelectorAll(q)].some(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none'); return {menu:vis('.side')||vis('.bnav'), fundo:getComputedStyle(document.body).backgroundColor, print:matchMedia('print').matches}})()`);
  confere(!imp.menu && imp.fundo === 'rgb(255, 255, 255)', `impressão sem menus e em fundo branco (${JSON.stringify(imp)})`);
  await cmd('Target.closeTarget', { targetId });
}

(async () => {
  for (let i = 0; i < 60 && !ws; i++) { try { const v = await (await fetch(`http://127.0.0.1:${DEPURACAO}/json/version`)).json(); ws = new WebSocket(v.webSocketDebuggerUrl); } catch { await espera(250); } }
  if (!ws) throw new Error('não foi possível conectar ao Chrome');
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
    if (m.method === 'Runtime.exceptionThrown') errosJS.push(m.params.exceptionDetails?.exception?.description?.split('\n')[0]); };
  for (const [vp, tema] of [['desktop', 'light'], ['celular', 'light'], ['celular', 'dark']]) await rodada(vp, tema);
  confere(!errosJS.length, `nenhum erro de JavaScript${errosJS.length ? ': ' + [...new Set(errosJS)].join(' | ') : ''}`);
  console.log(falhas.length ? `\n${falhas.length} verificação(ões) falharam.` : '\nTudo certo.');
  encerrar(falhas.length ? 1 : 0);
})().catch(e => { console.error('FALHA:', e.message); encerrar(1); });

function encerrar(codigo) {
  try { ws?.close(); } catch {}
  chrome.kill(); servidor.close();
  // O perfil temporário do Chrome fica na pasta temporária do sistema (limpa pelo próprio sistema).
  setTimeout(() => process.exit(codigo), 500);
}
