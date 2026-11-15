// Extrai blocos de código do script principal (app/index.html) e calcula uma impressão digital de cada um.
// Serve para provar que a modernização visual não alterou lógica (dados, Firebase, permissões, cálculos).
const crypto=require('node:crypto');

const ANTES_DE_REGEX='(,=:[!&|?{};+-*%<>~^\n';
// Avança de i até o fim de uma string, template ou regex, ignorando o conteúdo.
function pularString(t,i){ const q=t[i]; for(i++;i<t.length&&t[i]!==q&&t[i]!=='\n';i++) if(t[i]==='\\') i++; return i; }
function pularRegex(t,i){ let cl=false; for(i++;i<t.length&&t[i]!=='\n';i++){ const c=t[i]; if(c==='\\'){i++;continue;} if(c==='[')cl=true; else if(c===']')cl=false; else if(c==='/'&&!cl) return i; } return i; }
function pularTemplate(t,i){ for(i++;i<t.length;i++){ const c=t[i]; if(c==='\\'){i++;continue;} if(c==='`') return i; if(c==='$'&&t[i+1]==='{'){ i=fimBalanceado(t,i+1)-1; } } return t.length; }
function ehRegex(t,i){ let j=i-1; while(j>=0&&(t[j]===' '||t[j]==='\t')) j--; return j<0||ANTES_DE_REGEX.includes(t[j])||/\b(return|typeof|in|of)$/.test(t.slice(Math.max(0,j-6),j+1)); }
// Fim do bloco balanceado que começa em t[abre] ({, [ ou ().
function fimBalanceado(t,abre){
  let n=0;
  for(let i=abre;i<t.length;i++){
    const c=t[i], d=t[i+1];
    if(c==='/'&&d==='/'){ i=t.indexOf('\n',i); if(i<0) return t.length; continue; }
    if(c==='/'&&d==='*'){ i=t.indexOf('*/',i+2)+1; continue; }
    if(c==='/'&&ehRegex(t,i)){ i=pularRegex(t,i); continue; }
    if(c==='"'||c==="'"){ i=pularString(t,i); continue; }
    if(c==='`'){ i=pularTemplate(t,i); continue; }
    if(c==='{'||c==='['||c==='(') n++;
    else if(c==='}'||c===']'||c===')'){ n--; if(n===0) return i+1; }
  }
  return t.length;
}
// Fim de uma declaração de topo "const X = ..." (até ; ou quebra de linha com profundidade zero).
function fimDeclaracao(t,ini){
  let n=0;
  for(let i=t.indexOf('=',ini)+1;i<t.length;i++){
    const c=t[i], d=t[i+1];
    if(c==='/'&&d==='/'){ i=t.indexOf('\n',i)-1; continue; }
    if(c==='/'&&d==='*'){ i=t.indexOf('*/',i+2)+1; continue; }
    if(c==='/'&&ehRegex(t,i)){ i=pularRegex(t,i); continue; }
    if(c==='"'||c==="'"){ i=pularString(t,i); continue; }
    if(c==='`'){ i=pularTemplate(t,i); continue; }
    if(c==='{'||c==='['||c==='(') n++;
    else if(c==='}'||c===']'||c===')') n--;
    else if(n===0&&(c===';'||(c==='\n'&&!/^\s*[.?:+\-*/|&]/.test(t.slice(i+1,i+40))&&!/[=,(\[{+\-*/|&?:]\s*$/.test(t.slice(Math.max(0,i-40),i))))) return c===';'?i+1:i;
  }
  return t.length;
}

function blocos(codigo){
  codigo=codigo.replace(/\r\n?/g,'\n');
  const out={};
  const put=(k,v)=>{ let n=k,j=2; while(out[n]) n=k+'#'+(j++); out[n]=v; };
  for(const m of codigo.matchAll(/^(?:async )?function ([A-Za-z0-9_$]+)\s*\(/gm)){
    const abre=codigo.indexOf('{',m.index); put('function '+m[1],codigo.slice(m.index,fimBalanceado(codigo,abre)));
  }
  for(const m of codigo.matchAll(/^(?:const|let) ([A-Za-z0-9_$]+)\s*=/gm)){
    put('const '+m[1],codigo.slice(m.index,fimDeclaracao(codigo,m.index)));
  }
  return out;
}

const scriptPrincipal=html=>[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('FIREBASE_CONFIG'));
const hash=t=>crypto.createHash('sha256').update(t).digest('hex').slice(0,16);
function digitais(html){ const b=blocos(scriptPrincipal(html)); return Object.fromEntries(Object.entries(b).map(([k,v])=>[k,hash(v)]).sort()); }

module.exports={digitais,blocos,scriptPrincipal};
