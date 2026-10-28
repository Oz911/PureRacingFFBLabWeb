(()=>{'use strict';
const $=id=>document.getElementById(id);const fmt=(n,d=1)=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:d});
const all=REFERENCE.models,brands=[...new Set(all.map(x=>x.brand))];let selected=null;
function option(el,label,value){let o=document.createElement('option');o.textContent=label;o.value=value;el.appendChild(o)}
brands.forEach(b=>option($('brand'),b,b));
function updateModels(){let old=$('model').value;$('model').replaceChildren();all.filter(m=>m.brand===$('brand').value).forEach(m=>option($('model'),m.name,m.name));if([...$('model').options].some(x=>x.value===old))$('model').value=old;updateProfile()}
function updateProfile(){selected=all.find(m=>m.brand===$('brand').value&&m.name===$('model').value);if(!selected)return;const m=selected,s=REFERENCE.strengths[m.nm],mul=REFERENCE.lmuRanges.find(r=>m.nm>=r[0]&&m.nm<=r[1]);$('torque').textContent=fmt(m.nm)+' Nm';$('torqueType').textContent='Couple annoncé, nature et firmware non vérifiés';$('strength').textContent=s===undefined?'N/D':s+' %';$('strengthNote').textContent=s===undefined?'Aucune correspondance exacte : pas d’interpolation':'Valeur de départ non validée';$('ceiling').textContent=s===undefined?'N/D':fmt(m.nm*s/100,2)+' Nm';$('multiplier').textContent=$('sim').value==='Le Mans Ultimate'&&mul?mul[2].toFixed(2):'N/D';const f=REFERENCE.filters[m.brand];['damping','friction','inertia'].forEach((id,i)=>$(id).textContent=f[i]);$('profileWarning').textContent='Référence documentaire uniquement. '+m.brand+' '+m.name+' : les réglages et la puissance annoncée n’ont pas été vérifiés pour ce modèle/firmware. Un couple théorique ne mesure ni le ressenti ni le clipping. Ne pas appliquer automatiquement ces filtres.'}
$('brand').addEventListener('change',updateModels);$('model').addEventListener('change',updateProfile);$('sim').addEventListener('change',updateProfile);$('wheel').addEventListener('change',()=>{if($('wheel').value==='gtneo'){$('diameter').value=300;$('mass').value=1.1}});updateModels();$('brand').value='Simagic';updateModels();$('model').value='Alpha Mini';updateProfile();
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('main section').forEach(s=>s.classList.toggle('active',s.id===b.dataset.tab));if(b.dataset.tab==='live')draw()}));
function record(){const s=REFERENCE.strengths[selected.nm];return {date:new Date().toISOString(),brand:selected.brand,model:selected.name,advertisedNm:selected.nm,driverPct:s??null,theoreticalNm:s===undefined?null:Math.round(selected.nm*s)/100,simulator:$('sim').value,wheel:$('wheel').value,diameterMm:Number($('diameter').value),massKg:Number($('mass').value),validation:'unverified_reference_only'}}
const key='prfx-ffb-v2-profiles';function load(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a:[]}catch{return []}}function save(a){try{localStorage.setItem(key,JSON.stringify(a));return true}catch{alert('Stockage local indisponible');return false}}
function render(){let rows=$('savedRows');rows.replaceChildren();const a=load();if(!a.length){let tr=rows.insertRow();let td=tr.insertCell();td.colSpan=6;td.textContent='Aucun profil enregistré.';return}a.forEach(x=>{let tr=rows.insertRow();[new Date(x.date).toLocaleString('fr-FR'),x.brand,x.model,x.simulator,x.driverPct===null?'N/D':x.driverPct+' %',x.theoreticalNm===null?'N/D':fmt(x.theoreticalNm,2)+' Nm'].forEach(v=>{let td=tr.insertCell();td.textContent=v})})}
$('saveProfile').onclick=()=>{const a=load();a.push(record());if(save(a)){render();alert('Profil enregistré dans ce navigateur.')}};
function download(name,content,type){let b=new Blob([content],{type}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportProfile').onclick=()=>download('ffb-profile.json',JSON.stringify(record(),null,2),'application/json');$('exportAll').onclick=()=>download('ffb-profiles.json',JSON.stringify(load(),null,2),'application/json');
$('exportCsv').onclick=()=>{let a=load(),cols=['date','brand','model','advertisedNm','driverPct','theoreticalNm','simulator','wheel','diameterMm','massKg','validation'];let csv=[cols.join(';'),...a.map(r=>cols.map(c=>'"'+String(r[c]??'').replaceAll('"','""')+'"').join(';'))].join('\r\n');download('ffb-profiles.csv','\ufeff'+csv,'text/csv;charset=utf-8')};$('clearSaved').onclick=()=>{if(confirm('Supprimer tous les profils enregistrés dans ce navigateur ?')&&save([]))render()};render();

// ===================== LIVE : données réelles du plugin SimHub =====================
// Allègement pour tablette : 4 interrogations par seconde (au lieu de 8), courbe redessinée au plus une fois par image,
// tableau des tours reconstruit seulement quand il change, « hors ligne » affiché seulement après 3 s sans réponse.
const q=new URLSearchParams(location.search).get('k');const qs=q?('?k='+encodeURIComponent(q)):'';
const api=(p,extra)=>p+(qs?qs+(extra?'&'+extra:''):(extra?'?'+extra:''));
const pc=(v,d=0)=>v==null?'—':fmt(v*100,d);
const STATUS={Ok:'Correct',Risk:'À surveiller',Clipping:'Écrêtage excessif',Excessive:'Marge excessive',Excluded:'Exclu',Unknown:'Tour trop court'};
const WARN='#ffb35c',BAD='#ff5a66';
let last=null,threshold=.98,drawPending=false,lapSig='';const canvas=$('chart');
function draw(){drawPending=false;if(!$('live').classList.contains('active')||!last)return;const h0=last.history||{t:[],v:[]};const dpr=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const W=Math.round(w*dpr),H=Math.round(h*dpr);if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 const mx=h0.v.reduce((m,v)=>Math.max(m,Math.abs(v)),0),V=Math.min(8,Math.max(1.15,mx*1.08));
 const top=8,bot=h-8,Y=v=>bot-Math.min(V,Math.abs(v))/V*(bot-top),X=t=>(t+10)/10*w;
 const grid=V<=1.2?[.25,.5,.75,1]:(()=>{const a=[],st=V>4?1:.5;for(let g=st;g<V;g+=st)a.push(g);return a})();
 c.strokeStyle='#243657';c.lineWidth=1;c.beginPath();grid.forEach(g=>{c.moveTo(0,Y(g));c.lineTo(w,Y(g))});c.stroke();
 c.setLineDash([6,5]);c.strokeStyle='#ff9d59';c.beginPath();c.moveTo(0,Y(threshold));c.lineTo(w,Y(threshold));c.stroke();c.setLineDash([]);
 // un seul tracé par couleur au lieu d'un tracé par segment
 c.lineWidth=2;['#48d4a1','#ff2b3a'].forEach((col,k)=>{c.strokeStyle=col;c.beginPath();for(let i=1;i<h0.t.length;i++){const red=Math.abs(h0.v[i])>=threshold;if(red!==(k===1))continue;c.moveTo(X(h0.t[i-1]),Y(h0.v[i-1]));c.lineTo(X(h0.t[i]),Y(h0.v[i]))}c.stroke()});
 c.fillStyle='#a7b1cc';c.font='11px system-ui';grid.forEach(g=>{if(g===.25||g===.75)return;c.fillText(Math.round(g*100)+' %',4,Y(g)-3)})}
function scheduleDraw(){if(drawPending)return;drawPending=true;(window.requestAnimationFrame||(f=>setTimeout(f,16)))(draw)}
function lapTime(s){if(!(s>0))return '—';const m=Math.floor(s/60),r=s-m*60;return m+':'+(r<10?'0':'')+r.toFixed(3)}
function setPill(text,on){const c=$('conn');if(c.textContent!==text)c.textContent=text;c.className='pill '+(on?'on':'off')}
function renderLive(d){last=d;threshold=d.threshold||.98;$('ver').textContent='v'+d.version;$('gameName').textContent=d.game||'aucun jeu';
 setPill(window.PFA_DEMO?'DÉMONSTRATION · DONNÉES SIMULÉES':(d.game?'CONNECTÉ À SIMHUB':'SIMHUB · EN ATTENTE DU JEU'),!window.PFA_DEMO);
 const al=$('sourceAlert');if(d.game&&!d.source_ok){al.hidden=false;al.innerHTML='<b>Aucune source FFB lisible pour ce jeu.</b> Ouvre l’onglet « Sources » du plugin dans SimHub et affiche les options avancées pour lancer la recherche.'}
 else if(d.scale_missing){al.hidden=false;al.innerHTML='<b>Pleine échelle non renseignée : les pourcentages et l’écrêtage ne sont pas fiables.</b> Le couple mesuré ('+fmt(Math.abs(d.raw),1)+' Nm) est comparé à '+fmt(d.full_scale,1)+' Nm, calculés avec les valeurs par défaut du plugin. Saisis STC, force et multiplicateur du jeu dans l’onglet « Sources » du plugin.'}
 else if(d.game&&d.source_ok&&d.torque_nm!=null&&!d.settings_confirmed){al.hidden=false;al.innerHTML='<b>Réglages du jeu à saisir.</b> Dans l’onglet « Sources » du plugin, saisis ta STC, ta force FFB et le multiplicateur de la voiture <b>à l’identique du jeu</b>, puis « Enregistrer ». Sans eux, le couple voiture équivalent ne s’affiche pas.'}
 else al.hidden=true;
 $('signal').innerHTML=pc(Math.abs(d.signal))+' <small>%</small>';$('signal').className='metric'+(d.clipping?' clip':'');
 $('signalCap').textContent=d.unit==='Nm'?('Couple de colonne '+fmt(d.raw,1)+' Nm sur '+fmt(d.full_scale,1)+' Nm de pleine échelle'):('Force envoyée au volant, en part de la pleine échelle'+(d.torque_nm!=null?' · couple de colonne '+fmt(Math.abs(d.torque_nm),1)+' Nm':''));
 $('peak').innerHTML=pc(d.peak_window)+' <small>%</small>';
 // Couleur de l'écrêtage du tour : mêmes seuils que le verdict (0,5 % et 2 %)
 $('lapClip').innerHTML=pc(d.lap_clip_pct,1)+' <small>%</small>';$('lapClip').className='metric';$('lapClip').style.color=d.lap_clip_pct>.02?BAD:d.lap_clip_pct>=.005?WARN:'';
 $('lapClipCap').textContent='Tour '+d.lap+' · '+d.lap_clip_events+' événement(s) · session '+pc(d.session_clip_pct,1)+' %'+(d.lap_incident?' · incident détecté ('+d.lap_incident+') : tour exclu':'');
 $('rec').innerHTML='<span class="dot '+(d.recording?'rec':'')+'"></span>'+(d.recording?'ENREGISTREMENT':'NON ENREGISTRÉ');
 const valid=(d.laps||[]).filter(l=>l.status!=='Excluded'),L=valid.length?valid[valid.length-1]:null;
 if(L){$('lastPeak').innerHTML=pc(L.p995!=null?L.p995:L.peak)+' <small>% · 99,5e centile</small>';$('lastCap').innerHTML='Dernier tour valide ('+L.lap+') · pic '+pc(L.peak)+' % · <span class="st-'+L.status+'">'+STATUS[L.status]+'</span>';$('gain').textContent=d.advice||'';$('gain').style.color=L.status==='Ok'?'#48d4a1':WARN}
 else{$('lastPeak').textContent='—';$('lastCap').textContent=d.excluded_laps>0?('Aucun tour valide pour l’instant ('+d.excluded_laps+' tour(s) exclu(s) pour incident)'):'Disponible après le premier tour complet';$('gain').textContent=''}
 {const full=L&&L.p99_nm!=null,raw=full?L.p99_nm:d.lap_p99_nm,eq=full?L.equiv_nm:d.lap_equiv_nm,tb=$('torqueBox');tb.hidden=raw==null;
  const reminder=d.settings_confirmed?(' Réglages saisis : STC '+fmt(d.settings_stc,1)+' Nm · force '+fmt(d.settings_strength*100,0)+' % · multiplicateur '+fmt(d.settings_mult*100,0)+' %, à garder identiques au jeu.'):'';
  if(raw!=null){const when=full?'DERNIER TOUR VALIDE':'TOUR EN COURS';
   if(eq!=null){$('torqueLbl').textContent='COUPLE VOITURE ÉQUIVALENT FFB LAB · '+when;$('torqueVal').innerHTML=fmt(eq,1)+' <small>Nm</small>';
    $('torqueNote').textContent='Valeur à saisir dans le calculateur et le comparateur. Couple de colonne p99 du jeu : '+fmt(raw,1)+' Nm · pleine échelle mesurée '+fmt(d.scale_nm,1)+' Nm, réglages '+fmt(d.settings_scale_nm,1)+' Nm.'+reminder}
   else{$('torqueLbl').textContent='COUPLE DE COLONNE P99 DU JEU · '+when;$('torqueVal').innerHTML=fmt(raw,1)+' <small>Nm</small>';
    $('torqueNote').textContent=d.settings_scale_nm==null?'Pas encore la valeur du FFB Lab : saisis STC, force et multiplicateur du jeu dans l’onglet Sources du plugin.':'Pas encore la valeur du FFB Lab : la pleine échelle mesurée apparaît après quelques virages.'}}}
 // Tableau des tours : reconstruit seulement s'il a changé
 const laps=d.laps||[],sig=JSON.stringify(laps.map(l=>[l.lap,l.time,l.status,l.clip_pct,l.events,l.equiv_nm,l.incident]));
 if(sig!==lapSig){lapSig=sig;const rows=$('lapRows');rows.replaceChildren();laps.slice().reverse().forEach(l=>{const tr=rows.insertRow();if(l.status==='Excluded')tr.style.opacity='.55';[l.lap,lapTime(l.time),pc(l.clip_pct,2)+' %',l.events,pc(l.peak)+' %',l.equiv_nm!=null?fmt(l.equiv_nm,1)+' Nm':(l.p99_nm!=null?'(colonne '+fmt(l.p99_nm,1)+')':'—'),pc(l.margin)+' %'].forEach((v,i)=>{const c=tr.insertCell();c.textContent=v;if(i===5)c.className='tq'});const td=tr.insertCell();td.textContent=(STATUS[l.status]||l.status)+(l.incident?' · '+l.incident:'');td.className='st-'+l.status});
  if(!laps.length){const tr=rows.insertRow(),td=tr.insertCell();td.colSpan=8;td.textContent='Aucun tour complet pour l’instant.'}}
 scheduleDraw()}
let lastOk=Date.now(),polling=false,fail=0;
async function poll(){if(polling)return;polling=true;
 const ctl=window.AbortController?new AbortController():null,timer=setTimeout(()=>{if(ctl)ctl.abort()},4000);
 try{const r=await fetch(api('api/live'),{cache:'no-store',signal:ctl?ctl.signal:undefined});if(!r.ok)throw new Error(r.status===403?'Jeton refusé':'HTTP '+r.status);
  const d=await r.json();try{renderLive(d)}catch(e){showErr('affichage : '+e.message)}fail=0;lastOk=Date.now()}
 catch(e){fail++;if(Date.now()-lastOk>3000)showErr(e.name==='AbortError'?'pas de réponse, reconnexion…':e.message)}
 finally{clearTimeout(timer);polling=false;setTimeout(poll,document.hidden?1500:fail?600:250)}}
function showErr(m){setPill('HORS LIGNE · '+m,false)}
// Filet de sécurité : si plus aucune mise à jour depuis 5 s (veille de l'iPad, Wi-Fi), on relance la boucle
setInterval(()=>{if(Date.now()-lastOk>5000&&!polling)poll()},2000);
// Empêche la mise en veille de l'écran de la tablette pendant la session (Safari 16.4 et plus récents)
let wakeLock=null;async function keepAwake(){try{if(navigator.wakeLock&&!document.hidden&&!wakeLock){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null})}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){keepAwake();poll()}});
document.addEventListener('click',keepAwake);keepAwake();
async function loadSessions(){const rows=$('sessionRows');rows.replaceChildren();try{const r=await fetch(api('api/sessions'),{cache:'no-store'});const a=await r.json();
 if(!a.length){const tr=rows.insertRow(),td=tr.insertCell();td.colSpan=8;td.textContent='Aucune session enregistrée.';return}
 a.forEach(s=>{const tr=rows.insertRow(),t=s.totals||{};[new Date(s.started).toLocaleString('fr-FR'),s.game,s.car,s.track,t.laps,pc(t.clip_pct,2)+' %',pc(t.peak)+' %'].forEach(v=>{tr.insertCell().textContent=v??''});
  const td=tr.insertCell(),a2=document.createElement('a');a2.href=api('api/session/csv','id='+encodeURIComponent(s.id));a2.textContent='Télécharger';td.appendChild(a2)})}
 catch(e){const tr=rows.insertRow(),td=tr.insertCell();td.colSpan=8;td.textContent='Liste indisponible : '+e.message}}
$('refreshSessions').onclick=loadSessions;
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.tab==='sessions')loadSessions()}));
window.addEventListener('resize',scheduleDraw);poll();
})();
