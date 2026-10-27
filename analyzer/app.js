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
const q=new URLSearchParams(location.search).get('k');const qs=q?('?k='+encodeURIComponent(q)):'';
const api=(p,extra)=>p+(qs?qs+(extra?'&'+extra:''):(extra?'?'+extra:''));
const pc=(v,d=0)=>v==null?'—':fmt(v*100,d);
const STATUS={Ok:'Marge correcte',Risk:'Risque d’écrêtage',Clipping:'Écrêtage',Excessive:'Marge excessive',Unknown:'—'};
let last=null,fail=0,threshold=.98;const canvas=$('chart');
function draw(){if(!$('live').classList.contains('active')||!last)return;const h0=last.history||{t:[],v:[]};const dpr=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');c.scale(dpr,dpr);
 const top=8,bot=h-8,Y=v=>bot-Math.min(1.15,Math.abs(v))/1.15*(bot-top),X=t=>(t+10)/10*w;
 c.strokeStyle='#243657';c.lineWidth=1;[.25,.5,.75,1].forEach(g=>{c.beginPath();c.moveTo(0,Y(g));c.lineTo(w,Y(g));c.stroke()});
 c.setLineDash([6,5]);c.strokeStyle='#ff9d59';c.beginPath();c.moveTo(0,Y(threshold));c.lineTo(w,Y(threshold));c.stroke();c.setLineDash([]);
 c.lineWidth=2;for(let i=1;i<h0.t.length;i++){const a=Math.abs(h0.v[i]);c.strokeStyle=a>=threshold?'#ff2b3a':'#48d4a1';c.beginPath();c.moveTo(X(h0.t[i-1]),Y(h0.v[i-1]));c.lineTo(X(h0.t[i]),Y(h0.v[i]));c.stroke()}
 c.fillStyle='#a7b1cc';c.font='11px system-ui';c.fillText('100 %',4,Y(1)-3);c.fillText('50 %',4,Y(.5)-3)}
function lapTime(s){if(!(s>0))return '—';const m=Math.floor(s/60),r=s-m*60;return m+':'+(r<10?'0':'')+r.toFixed(3)}
function renderLive(d){last=d;threshold=d.threshold||.98;$('ver').textContent='v'+d.version;$('gameName').textContent=d.game||'aucun jeu';
 const conn=$('conn');conn.textContent=window.PFA_DEMO?'DÉMONSTRATION · DONNÉES SIMULÉES':(d.game?'CONNECTÉ À SIMHUB':'SIMHUB · EN ATTENTE DU JEU');conn.className='pill '+(window.PFA_DEMO?'off':'on');
 const al=$('sourceAlert');if(d.game&&!d.source_ok){al.hidden=false;al.innerHTML='<b>Aucune source FFB lisible pour ce jeu.</b> Ouvre l’onglet « Sources » du plugin dans SimHub et lance la recherche automatique.'}else al.hidden=true;
 $('signal').innerHTML=pc(Math.abs(d.signal))+' <small>%</small>';$('signal').className='metric'+(d.clipping?' clip':'');
 $('signalCap').textContent=d.unit==='Nm'?('Couple de colonne '+fmt(d.raw,1)+' Nm sur '+fmt(d.full_scale,1)+' Nm de pleine échelle'):'Pourcentage de la pleine échelle du jeu';
 $('peak').innerHTML=pc(d.peak_window)+' <small>%</small>';
 $('lapClip').innerHTML=pc(d.lap_clip_pct,1)+' <small>%</small>';$('lapClip').className='metric'+(d.lap_clip_pct>0?' clip':'');
 $('lapClipCap').textContent='Tour '+d.lap+' · '+d.lap_clip_events+' événement(s) · session '+pc(d.session_clip_pct,1)+' %';
 $('rec').innerHTML='<span class="dot '+(d.recording?'rec':'')+'"></span>'+(d.recording?'ENREGISTREMENT':'NON ENREGISTRÉ');
 const L=d.laps&&d.laps.length?d.laps[d.laps.length-1]:null;
 if(L){$('lastPeak').innerHTML=pc(L.peak)+' <small>% de pic</small>';$('lastCap').innerHTML='Marge '+pc(L.margin)+' % · <span class="st-'+L.status+'">'+STATUS[L.status]+'</span>'+(L.p99_nm!=null?'<br>Couple voiture p99 : <b>'+fmt(L.p99_nm,1)+' Nm</b> (à saisir dans le calculateur)':'');
  $('gain').textContent=d.gain_lo!=null?('Pour un pic entre 75 et 90 % : multiplier la force en jeu par '+fmt(d.gain_lo,2)+' à '+fmt(d.gain_hi,2)+(L.status==='Clipping'?' (au moins : le signal saturé masque le vrai pic).':'.')):''}
 else{$('lastPeak').textContent='—';$('lastCap').textContent='Disponible après le premier tour complet';$('gain').textContent=''}
 const rows=$('lapRows');rows.replaceChildren();(d.laps||[]).slice().reverse().forEach(l=>{const tr=rows.insertRow();[l.lap,lapTime(l.time),pc(l.clip_pct,2)+' %',l.events,pc(l.peak)+' %',l.p99_nm!=null?fmt(l.p99_nm,1)+' Nm':'—',pc(l.margin)+' %'].forEach(v=>{tr.insertCell().textContent=v});const td=tr.insertCell();td.textContent=STATUS[l.status]||l.status;td.className='st-'+l.status});
 if(!(d.laps||[]).length){const tr=rows.insertRow(),td=tr.insertCell();td.colSpan=8;td.textContent='Aucun tour complet pour l’instant.'}
 draw()}
async function poll(){try{const r=await fetch(api('api/live'),{cache:'no-store'});if(!r.ok)throw new Error(r.status===403?'Jeton refusé':'HTTP '+r.status);renderLive(await r.json());fail=0}
 catch(e){fail++;if(fail>2){const c=$('conn');c.textContent='HORS LIGNE · '+e.message;c.className='pill off'}}
 finally{setTimeout(poll,document.hidden?1000:125)}}
async function loadSessions(){const rows=$('sessionRows');rows.replaceChildren();try{const r=await fetch(api('api/sessions'),{cache:'no-store'});const a=await r.json();
 if(!a.length){const tr=rows.insertRow(),td=tr.insertCell();td.colSpan=8;td.textContent='Aucune session enregistrée.';return}
 a.forEach(s=>{const tr=rows.insertRow(),t=s.totals||{};[new Date(s.started).toLocaleString('fr-FR'),s.game,s.car,s.track,t.laps,pc(t.clip_pct,2)+' %',pc(t.peak)+' %'].forEach(v=>{tr.insertCell().textContent=v??''});
  const td=tr.insertCell(),a2=document.createElement('a');a2.href=api('api/session/csv','id='+encodeURIComponent(s.id));a2.textContent='Télécharger';td.appendChild(a2)})}
 catch(e){const tr=rows.insertRow(),td=tr.insertCell();td.colSpan=8;td.textContent='Liste indisponible : '+e.message}}
$('refreshSessions').onclick=loadSessions;
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.tab==='sessions')loadSessions()}));
window.addEventListener('resize',draw);poll();
})();
