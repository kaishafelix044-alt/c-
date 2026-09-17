import './style.css';
import { restoreHistory } from './history.js';

const icons = {
 calculator:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h1m6 0h1M8 14h1m6 0h1M8 18h1m6 0h1"/>',
 scientific:'<path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2L14 9V3M7 15h10"/>',
 algebra:'<path d="M5 6h14M5 18h14M9 10l6 4m0-4-6 4"/>',
 history:'<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7M12 7v5l3 2"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 moon:'<path d="M20 15a9 9 0 0 1-11-11 9 9 0 1 0 11 11Z"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2M12 17h.01"/>',
 back:'<path d="m8 5-6 7 6 7h13V5ZM11 9l6 6m0-6-6 6"/>',
 arrow:'<path d="m9 5 7 7-7 7"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.calculator}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* App remains usable without persistence. */ } };
let mode = 'scientific', angle = 'DEG', inverse = false, hyperbolic = false;
let ans = '0', memory = null, currentRaw = '0', busy = false, requestId = 0, timeout;
let history = restoreHistory(read('calc-history', []));
let replayAns = null;
document.documentElement.dataset.theme = read('calc-theme', 'light') === 'dark' ? 'dark' : 'light';
let worker, workerFailed = false;
function startWorker() {
  workerFailed = false;
  worker = new Worker(new URL('./worker.js', import.meta.url), { type:'module' });
  worker.onmessage = ({ data }) => {
    if (data.id !== requestId) return;
    clearTimeout(timeout); setBusy(false);
    if (data.error) { showError(data.error); return; }
    const { result } = data;
    $('#result').textContent = result.text;
    $('#result').classList.toggle('small', result.text.length > 19);
    currentRaw = result.raw;
    if (result.raw) ans = result.raw;
    history.unshift({ ...pending, text: result.text, raw: result.raw, time: new Date().toISOString() });
    history = history.slice(0, 50); save('calc-history', history); renderHistory();
  };
  worker.onerror = () => { clearTimeout(timeout); setBusy(false); showError('The calculation engine could not complete this request. Please try again.'); worker.terminate(); workerFailed = true; };
}
let pending;
const $ = selector => document.querySelector(selector);
$('#app').innerHTML = `
<header><div class="brand"><div class="logo" aria-hidden="true">∑</div>Calc<span>Studio</span></div><div class="header-actions"><span class="local"><span class="dot"></span>Calculated on your device</span><button class="icon-button" id="theme" aria-label="Toggle dark theme">${icon('moon')}</button><button class="icon-button" id="help" aria-label="Open calculator help">${icon('help')}</button></div></header>
<div class="shell"><nav aria-label="Calculator modes"><div class="nav-label">Workspace</div>${[['standard','Standard','calculator'],['scientific','Scientific','scientific'],['algebra','Algebra','algebra']].map(([id,name,i]) => `<button data-mode="${id}" ${id===mode?'class="active" aria-current="page"':''}>${icon(i)}${name}</button>`).join('')}<div class="nav-bottom"><div class="nav-label">A little more possibility</div><p class="nav-note">From the everyday<br>to the extraordinary.</p></div></nav>
<main class="workspace"><div class="page-heading"><div><h1 id="mode-title">Scientific calculator</h1><p id="mode-description">More power for your everyday problem solving.</p></div><span class="badge">Your thinking space</span></div>
<div class="workbench"><section class="calculator" aria-label="Calculator"><div class="toolbar"><div class="segment" aria-label="Angle units"><button data-angle="DEG" class="active" aria-pressed="true">DEG</button><button data-angle="RAD" aria-pressed="false">RAD</button></div><div class="toolbar-right"><span id="precision">14-digit display</span><button class="icon-button" id="copy" aria-label="Copy result">${icon('copy')}</button></div></div>
<div class="display"><label for="expression">Expression</label><textarea class="expression" id="expression" rows="1" placeholder="0" spellcheck="false" aria-describedby="error" aria-label="Mathematical expression"></textarea><div class="result" id="result" role="status" aria-live="polite">0</div><div class="error" id="error" role="alert"></div></div>
<div class="memory" aria-label="Calculator memory">${['MC','MR','M+','M−','MS'].map(label=>`<button data-memory="${label}" title="${{'MC':'Clear memory','MR':'Recall memory','M+':'Add result to memory','M−':'Subtract result from memory','MS':'Store result'}[label]}">${label}</button>`).join('')}<button id="memory-status" aria-label="Show memory">M</button></div>
<div class="function-row" id="function-row"><button id="inverse" aria-pressed="false">2nd</button><button id="hyperbolic" aria-pressed="false">Hyperbolic</button><button id="insert-ans">ans <span aria-hidden="true">↗</span></button></div>
<div id="algebra-controls" class="algebra-controls hidden"><label class="field">Operation<select id="operation"><option value="simplify">Simplify expression</option><option value="expand">Expand polynomial</option><option value="derivative">Differentiate</option><option value="substitute">Evaluate at a value</option></select></label><div class="field-row"><label class="field">Variable<input id="variable" value="x" maxlength="30" /></label><label class="field" id="value-field">Value<input id="variable-value" value="2" /></label></div><p class="algebra-note">Use x^2 for powers and 2x for multiplication. Symbolic calculus and substitution use radians. Expansion supports polynomial and rational expressions.</p><button class="primary" id="algebra-run">Simplify expression</button></div>
<div class="keypad" id="keypad"></div><div class="key-hint"><span><kbd>Enter</kbd> calculate <span aria-hidden="true">·</span> <kbd>Esc</kbd> clear</span><span>Made for your keyboard, too</span></div></section>
<aside aria-label="Calculation history"><div class="aside-heading"><h2>History <span id="history-count"></span></h2><button class="icon-button" id="clear-history" aria-label="Clear history">${icon('trash')}</button></div><div class="history-list" id="history-list"></div><div class="aside-tip"><strong>A thought worth keeping.</strong>Your calculations stay here. Select any expression to bring it back to your workspace.</div></aside></div>
<section class="examples" aria-label="Example calculations"><div class="example-heading"><span class="eyebrow">A starting point</span><span>Select an example to give it a try</span></div><div class="example-grid" id="examples"></div></section>
<footer><span>Big ideas start with a little calculation.</span><span>Calc Studio / 01</span></footer></main></div>
<dialog class="help-dialog" id="help-dialog"><button class="icon-button" id="close-help" aria-label="Close help">✕</button><h2>A little help with the math</h2><p>Type an expression or use the keypad. Press Enter to calculate, or Escape to clear.</p><ul><li><b>Scientific:</b> <code>sin(30)</code>, <code>log10(1000)</code>, <code>5!</code>, <code>2^8</code>. DEG/RAD applies to numeric trigonometry; hyperbolic functions are unitless.</li><li><b>Algebra:</b> simplify <code>2x + 3x</code>, expand <code>(x+1)^3</code>, differentiate <code>x^3 + sin(x)</code>, or substitute a value for x. Calculus uses radians.</li><li><b>Complex numbers:</b> <code>sqrt(-1)</code> or <code>(2+3i)*(1-i)</code>.</li><li><b>Matrices:</b> <code>det([1,2;3,4])</code>, <code>inv([1,2;3,4])</code>.</li><li><b>Statistics:</b> <code>mean([2,4,6])</code>, <code>std([2,4,6])</code>, <code>combinations(10,3)</code>.</li><li><b>Units:</b> <code>5 cm to inch</code>. <b>Percent:</b> <code>200 * 10%</code> is 20; % means divide by 100.</li><li><b>Memory:</b> MS stores the numeric result, MR inserts it, M+/M− adjusts it, MC clears it. <code>ans</code> recalls the last numeric result.</li></ul><p>Calculations use floating-point arithmetic with a 14-digit display. This is not an arbitrary-precision or general equation-solving system. History is saved in this browser; memory resets on reload. Calculations time out after 8 seconds.</p></dialog><div class="toast hidden" id="toast" role="status"></div>`;

function showError(message) { $('#error').textContent = message; $('#expression').setAttribute('aria-invalid','true'); }
function clearError() { $('#error').textContent = ''; $('#expression').removeAttribute('aria-invalid'); }
function setBusy(value) { busy=value; $('#algebra-run').disabled=value; document.querySelectorAll('[data-key="="]').forEach(button=>button.disabled=value); $('#result').setAttribute('aria-busy',String(value)); }
function run() {
  if (busy) return;
  if (workerFailed) startWorker();
  clearError();
  pending = { expression:$('#expression').value, operation:mode==='algebra'?$('#operation').value:'evaluate', angle, mode, variable:$('#variable').value, value:$('#variable-value').value, ans:replayAns ?? ans };
  setBusy(true);
  worker.postMessage({ ...pending, id:++requestId });
  timeout=setTimeout(()=>{worker.terminate(); startWorker(); setBusy(false); showError('This calculation took too long. Try a smaller expression.');},8000);
}
function insert(text) {
  replayAns = null;
  const input=$('#expression');
  input.setRangeText(text,input.selectionStart,input.selectionEnd,'end');
  clearError(); input.focus();
}
function cancelPending() { if(busy){clearTimeout(timeout);requestId++;worker.terminate();startWorker();setBusy(false);} }
function clear() { cancelPending(); replayAns=null; $('#expression').value=''; $('#result').textContent='0'; $('#result').classList.remove('small'); currentRaw='0'; clearError(); }
function renderKeys() {
  const trig = base => `${inverse?'a':''}${base}${hyperbolic?'h':''}`;
  const scientific = [
    ['x²','^2'],['1/x','reciprocal'],['|x|','abs('],['exp','e^('],['mod',' mod '],
    [trig('sin'),trig('sin')+'('],[trig('cos'),trig('cos')+'('],[trig('tan'),trig('tan')+'('],['C','clear'],[icon('back'),'back','utility','Backspace'],
    ['√x','sqrt('],['(', '('],[')',')'],['n!','!'],['÷','÷','operator'],
    ['xʸ','^'],['7','7','numeric'],['8','8','numeric'],['9','9','numeric'],['×','×','operator'],
    ['10ˣ','10^('],['4','4','numeric'],['5','5','numeric'],['6','6','numeric'],['−','−','operator'],
    ['log','log10('],['1','1','numeric'],['2','2','numeric'],['3','3','numeric'],['+','+','operator'],
    ['ln','log('],['±','negate'],['0','0','numeric'],['.','.','numeric'],['=','=','equal'],
    ['π','π'],['e','e'],['i','i'],['%','%'],['ans','ans','utility'],
  ];
  const standard = [['%','%'],['CE','clear'],['C','clear'],[icon('back'),'back','utility','Backspace'],['1/x','reciprocal'],['x²','^2'],['√x','sqrt('],['÷','÷','operator'],['7','7','numeric'],['8','8','numeric'],['9','9','numeric'],['×','×','operator'],['4','4','numeric'],['5','5','numeric'],['6','6','numeric'],['−','−','operator'],['1','1','numeric'],['2','2','numeric'],['3','3','numeric'],['+','+','operator'],['±','negate'],['0','0','numeric'],['.','.','numeric'],['=','=','equal']];
  $('#keypad').className=`keypad ${mode==='standard'?'standard':''} ${mode==='algebra'?'hidden':''}`;
  $('#keypad').innerHTML=(mode==='standard'?standard:scientific).map(([label,key,type='',aria])=>`<button class="key ${type}" data-key="${escape(key)}" ${aria?`aria-label="${aria}"`:''}>${label}</button>`).join('');
}
function renderHistory() {
  $('#history-count').textContent=history.length?`· ${history.length}`:'';
  $('#history-list').innerHTML=history.length?history.map((item,index)=>`<button class="history-item" data-history="${index}" aria-label="Restore ${escape(item.expression)}"><span class="meta">${escape(item.operation==='evaluate'?item.angle:item.operation)}${item.operation==='substitute'?` · ${escape(item.variable)} = ${escape(item.value)}`:''}</span><span class="history-expression">${escape(item.expression)}</span><span class="history-result">${escape(item.text)}</span></button>`).join(''):`<div class="empty">${icon('history')}<strong>A fresh page for your thoughts</strong>Your calculations will appear here.</div>`;
}
const exampleSets = {
 standard:[['Everyday arithmetic','(128 + 64) / 3'],['A percentage','250 * 18%'],['Powers & roots','sqrt(144) + 2^3']],
 scientific:[['A little trigonometry','sin(30)^2 + cos(30)^2'],['Beyond real numbers','(2 + 3i) * (1 - i)'],['Work with matrices','det([1, 2; 3, 4])']],
 algebra:[['Collect like terms','2x^2 + 3x + x^2','simplify'],['Open the brackets','(x + 1)^3','expand'],['Find the derivative','x^3 + sin(x)','derivative']],
};
function setMode(next) {
  mode=next;
  document.querySelectorAll('[data-mode]').forEach(button=>{button.classList.toggle('active',button.dataset.mode===mode); if(button.dataset.mode===mode)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  $('#mode-title').textContent={standard:'Standard calculator',scientific:'Scientific calculator',algebra:'Algebra workspace'}[mode];
  $('#mode-description').textContent={standard:'The familiar essentials. A little more considered.',scientific:'More power for your everyday problem solving.',algebra:'Explore expressions, uncover patterns, find the next step.'}[mode];
  $('#function-row').classList.toggle('hidden',mode!=='scientific');
  $('#algebra-controls').classList.toggle('hidden',mode!=='algebra');
  $('.segment').classList.toggle('hidden',mode==='algebra');
  $('#examples').innerHTML=exampleSets[mode].map(([label,expression],i)=>`<button class="example" data-example="${i}"><span>${label}</span><code>${escape(expression)}</code></button>`).join('');
  renderKeys(); updateOperation();
}
function updateOperation() { const op=$('#operation');$('#algebra-run').textContent=op.selectedOptions[0].textContent;$('#value-field').classList.toggle('hidden',op.value!=='substitute');$('#variable').disabled=['simplify','expand'].includes(op.value); }
let toastTimer;
function toast(message) { $('#toast').textContent=message;$('#toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.add('hidden'),2500); }
document.addEventListener('click', event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.key && !['=', 'clear'].includes(button.dataset.key)) replayAns=null;
  if(button.dataset.example!==undefined) replayAns=null;
  if(button.dataset.history!==undefined){cancelPending();replayAns=history[Number(button.dataset.history)].ans;}
  if(button.dataset.mode)setMode(button.dataset.mode);
  if(button.dataset.angle){angle=button.dataset.angle;document.querySelectorAll('[data-angle]').forEach(b=>{b.classList.toggle('active',b.dataset.angle===angle);b.setAttribute('aria-pressed',String(b.dataset.angle===angle));});}
  if(button.dataset.key){const key=button.dataset.key;if(key==='=')run();else if(key==='clear')clear();else if(key==='back'){const input=$('#expression');const start=input.selectionStart,end=input.selectionEnd;input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');input.focus();clearError();}else if(key==='negate'||key==='reciprocal'){const input=$('#expression');input.value=key==='negate'?`-(${input.value||'0'})`:`1/(${input.value||'0'})`;input.focus();}else insert(key);}
  if(button.dataset.example!==undefined){const [,expression,operation]=exampleSets[mode][Number(button.dataset.example)];$('#expression').value=expression;if(operation){$('#operation').value=operation;updateOperation();}clearError();$('#expression').focus();}
  if(button.dataset.history!==undefined){const item=history[Number(button.dataset.history)];setMode(item.mode||'scientific');$('#expression').value=item.expression;$('#operation').value=item.operation==='evaluate'?'simplify':item.operation;$('#variable').value=item.variable||'x';$('#variable-value').value=item.value||'0';$(`[data-angle="${item.angle==='RAD'?'RAD':'DEG'}"]`).click();updateOperation();$('#result').textContent=item.text;$('#result').classList.toggle('small',item.text.length>19);currentRaw=item.raw;clearError();}
  if(button.dataset.memory){const action=button.dataset.memory;if(action==='MC'){memory=null;toast('Memory cleared');}else if(action==='MR'){if(memory!==null)insert(`(${memory})`);else toast('Memory is empty');}else {const number=Number(currentRaw);if(currentRaw===null||!Number.isFinite(number)){toast('Memory supports finite real numbers.');return;}const next=action==='MS'?number:(memory??0)+(action==='M−'?-number:number);if(!Number.isFinite(next)){toast('Memory result is outside the numeric range.');return;}memory=next;toast('Memory updated');}$('#memory-status').textContent=memory===null?'M':'M •';}
});
$('#inverse').onclick=()=>{inverse=!inverse;$('#inverse').classList.toggle('active',inverse);$('#inverse').setAttribute('aria-pressed',String(inverse));renderKeys();};
$('#hyperbolic').onclick=()=>{hyperbolic=!hyperbolic;$('#hyperbolic').classList.toggle('active',hyperbolic);$('#hyperbolic').setAttribute('aria-pressed',String(hyperbolic));renderKeys();};
$('#insert-ans').onclick=()=>insert('ans');
$('#algebra-run').onclick=run;$('#operation').onchange=updateOperation;
$('#expression').oninput=()=>{replayAns=null;clearError();};
$('#memory-status').onclick=()=>toast(memory===null?'Memory is empty':`Memory: ${memory}`);
$('#clear-history').onclick=()=>{history=[];save('calc-history',history);renderHistory();};
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#result').textContent);toast('Result copied');}catch{toast('Copy unavailable. Select the result to copy it.');}};
$('#theme').onclick=()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;save('calc-theme',theme);};
$('#help').onclick=()=>$('#help-dialog').showModal();$('#close-help').onclick=()=>$('#help-dialog').close();
document.addEventListener('keydown',event=>{
  if($('#help-dialog').open)return;
  const editing=event.target.matches('input,select');
  if(event.key==='Escape'&&!editing){event.preventDefault();clear();}
  if(event.key==='Enter'&&!editing&&(event.target===$('#expression')||!event.target.closest('button'))){event.preventDefault();run();}
  if(!editing&&event.target!==$('#expression')&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&/^[0-9.+\-*/^()%]$/.test(event.key)){event.preventDefault();insert(event.key);}
});
startWorker();setMode(mode);renderHistory();
