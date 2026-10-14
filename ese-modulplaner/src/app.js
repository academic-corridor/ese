/* src/app.js: Oberfläche (Darstellung, Ziehen und Ablegen, Dialoge, Browser-Speicher).
   Rechenlogik: regeln.js. Semester: semester.js. Zustand und Prüfung von Dateien: zustand.js. Daten: ../data/. */
(function(){
"use strict";
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var komma=function(x){return String(x).replace('.',',')};
var noteText=function(n){return n===null||n===undefined?'':komma(n.toFixed(1))};

var S=ESE.Struktur, Regeln=ESE.Regeln, Zustand=ESE.Zustand, Sem=ESE.Semester;
var THEMEN=S.themen, TURNUS=S.turnus, SPRACHEN=S.sprachen;
var BEREICHE={};
Object.keys(S.bereiche).forEach(function(k){BEREICHE[k]={name:S.bereiche[k].name,cv:S.bereiche[k].farbe}});
var BEREICH_REIHE=['Grundlagen','IEP','Thesis','Wahlpflicht','Wahlbereich'];

var KEY=Zustand.KEY;
var plan=null, filterT=null, filterTurnus='', filterSprache='', query='';

/* ---------- Browser-Speicher (localStorage) ---------- */
function load(){
  plan=Zustand.neu();
  var raw=null;
  try{raw=localStorage.getItem(KEY)}catch(e){}
  if(!raw) return;
  try{var r=Zustand.importieren(JSON.parse(raw)); if(r.ok) plan=r.plan;}catch(e){}
}
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(Zustand.exportieren(plan)))}catch(e){}
}
function modById(id){return plan.mods.filter(function(x){return x.id===id})[0]}

/* ---------- Hilfen für die Darstellung ---------- */
function colorVar(m){
  var t=m.bereich==='Wahlpflicht'?(m.thema||m.themen[0]):null;
  return t?'--c-'+t:BEREICHE[m.bereich].cv;
}
function einordnung(m){
  if(m.bereich==='Wahlpflicht'){var t=m.thema||m.themen[0]; return t?Regeln.themaName(t):BEREICHE.Wahlpflicht.name}
  return BEREICHE[m.bereich].name;
}
function semInfo(id,aktuell){
  var v=Sem.vergleich(id,aktuell);
  return v<0?'vorbei':(v===0?'läuft':'geplant');
}

function cardHTML(m,compact){
  var warn=Regeln.saisonKonflikt(m);
  var turn=TURNUS[m.turnus]||TURNUS.x;
  var meta='<span class="cp">'+m.cp+' CP</span>';
  if(compact){
    if(m.ok&&m.note!==null) meta+='<span class="grade">'+noteText(m.note)+'</span>';
    if(warn) meta+='<span class="tag warn">Angebot: '+esc(turn)+'</span>';
  }else{
    meta+='<span class="tag">'+esc(turn)+'</span>';
    if(m.sprache) meta+='<span class="tag">'+esc(m.sprache==='de/en'?'DE/EN':m.sprache.toUpperCase())+'</span>';
    if(m.themen.length>1) meta+='<span class="tag">auch '+esc(m.themen.slice(1).map(Regeln.themaName).join(', '))+'</span>';
    if(m.custom) meta+='<span class="tag">eigenes</span>';
  }
  var chk=compact?'<label class="chk" title="bestanden"><input type="checkbox" data-ok="'+esc(m.id)+'"'+(m.ok?' checked':'')+' aria-label="'+esc(m.name)+' bestanden"></label>':'';
  return '<div class="card'+(compact?' compact':'')+(m.ok?' is-ok':'')+'" draggable="true" tabindex="0" role="button" data-id="'+esc(m.id)+'" style="--sc:var('+colorVar(m)+')" title="'+esc(einordnung(m)+(m.nr?' ('+m.nr+')':''))+'">'
   +chk+'<div class="cbody"><div class="n">'+esc(m.name)+'</div><div class="m">'+meta+'</div></div></div>';
}

/* ---------- Kopfband ---------- */
function renderBand(c){
  var order=['Grundlagen','IEP','Wahlpflicht','Thesis','Wahlbereich'];
  var h='';
  order.forEach(function(k){
    var soll=c.soll[k]; if(soll<=0) return;
    var o=c.S[k], d=Math.min(o.d,soll), a=Math.min(o.d+o.a+o.p,soll);
    h+='<div class="seg" style="flex:'+soll+' 1 0;--sc:var('+BEREICHE[k].cv+')" title="'+esc(BEREICHE[k].name+': '+d+' bestanden, '+(a-d)+' laufend oder geplant, Soll '+soll)+' CP">'
     +'<div class="fp" style="width:'+(a/soll*100)+'%"></div><div class="fd" style="width:'+(d/soll*100)+'%"></div>'
     +'<div class="sl">'+esc(BEREICHE[k].name)+'</div></div>';
  });
  $('#band').innerHTML=h;
  $('#bandNum').innerHTML=c.done+' <small>von '+S.grenzen.gesamt+' CP bestanden, mit Planung '+c.total+'</small>';
  $('#grade').innerHTML=c.noten
    ? 'Ø '+komma(c.noten.schnitt.toFixed(2))+' <small>über '+c.noten.cp+' benotete CP</small>'
    : '<small>Noch keine Noten eingetragen</small>';
  var r='';
  order.forEach(function(k){
    var o=c.S[k], soll=c.soll[k];
    var sub=(k==='Grundlagen')
      ? (c.all(o)+' CP eingetragen, höchstens '+S.grenzen.grundlagenMax+' zählen')
      : (o.d+' bestanden, '+(o.a+o.p)+' laufend oder geplant, Soll '+soll);
    r+='<div class="row" style="--sc:var('+BEREICHE[k].cv+')"><span class="dot"></span><div><b>'+esc(BEREICHE[k].name)+'</b><span>'+esc(sub)+'</span></div></div>';
  });
  $('#rows').innerHTML=r;
}

/* ---------- Semesterplan ---------- */
function renderPlanner(c){
  var h='', liste=Zustand.semester(plan);
  liste.forEach(function(id,i){
    var items=plan.mods.filter(function(m){return m.sem===id});
    var sum=items.reduce(function(s,m){return s+m.cp},0);
    var okCp=items.filter(function(m){return m.ok}).reduce(function(s,m){return s+m.cp},0);
    var info=semInfo(id,c.aktuell);
    var last=i===liste.length-1;
    var head='<div class="colhead"><div class="t"><b>'+esc(Sem.label(id))+'</b><span class="s">'+sum+' CP</span></div>'
      +'<div class="s">'+(i+1)+'. Semester, '+info+(okCp?', '+okCp+' CP bestanden':'')
      +(last&&!items.length&&liste.length>1?' <button class="linkbtn" data-delsem="1" title="Letztes Semester entfernen">entfernen</button>':'')+'</div>';
    var pct=Math.min(100,sum/S.grenzen.semesterRichtwert*100);
    head+='<div class="load'+(sum>S.grenzen.semesterHoch?' hi':'')+'" title="Richtwert '+S.grenzen.semesterRichtwert+' CP pro Semester"><i style="width:'+pct+'%"></i></div></div>';
    var body=items.length?items.map(function(m){return cardHTML(m,true)}).join(''):'<div class="hint-empty">Modul hierher ziehen</div>';
    h+='<div class="col dropzone'+(info==='läuft'?' now':'')+(info==='vorbei'?' past':'')+'" data-sem="'+id+'">'+head+'<div class="colbody">'+body+'</div></div>';
  });
  h+='<button class="addcol" id="btnAddSem" title="Semester anhängen"><span>+</span>Semester</button>';
  $('#grid').innerHTML=h;
}

/* ---------- Katalog ---------- */
function gruppenSchluessel(m){
  var b=BEREICH_REIHE.indexOf(m.bereich), t=0;
  if(m.bereich==='Wahlpflicht'){var th=m.themen[0]; t=THEMEN.map(function(x){return x.id}).indexOf(th)+1}
  return b*100+t;
}
function passtFilter(m,q){
  if(m.sem) return false;
  if(filterT==='_pf' && m.bereich==='Wahlpflicht') return false;
  if(filterT && filterT!=='_pf' && m.themen.indexOf(filterT)<0) return false;
  if(filterTurnus==='WiSe'&&m.turnus!=='WiSe') return false;
  if(filterTurnus==='SoSe'&&m.turnus!=='SoSe') return false;
  if(filterTurnus==='jedes'&&m.turnus!=='jedes') return false;
  if(filterTurnus==='unklar'&&['zwei','drei','x'].indexOf(m.turnus)<0) return false;
  if(filterSprache&&m.sprache!==filterSprache&&m.sprache!=='de/en') return false;
  if(q && (m.name+' '+m.nr).toLowerCase().indexOf(q)<0) return false;
  return true;
}
function renderCatalog(){
  var chips='<button class="chip" aria-pressed="'+(filterT===null)+'" data-f="">Alle</button>';
  THEMEN.forEach(function(t){
    chips+='<button class="chip" style="--sc:var(--c-'+t.id+')" aria-pressed="'+(filterT===t.id)+'" data-f="'+t.id+'"><i></i>'+esc(t.name)+'</button>';
  });
  chips+='<button class="chip" aria-pressed="'+(filterT==='_pf')+'" data-f="_pf">Pflicht und Wahlbereich</button>';
  $('#chips').innerHTML=chips;
  var q=query.trim().toLowerCase();
  var list=plan.mods.map(function(m,i){return {m:m,i:i}}).filter(function(x){return passtFilter(x.m,q)});
  /* Bei Themenfilter erscheint ein Modul aus mehreren Themenbereichen unter dem gefilterten */
  list.sort(function(a,b){return (gruppenSchluessel(a.m)-gruppenSchluessel(b.m))||(a.i-b.i)});
  $('#catCount').textContent=list.length+' von '+plan.mods.filter(function(m){return !m.sem}).length;
  var h=addCardHTML();
  if(!list.length){
    h+='<div class="empty">Keine Module gefunden. Ändere Suche oder Filter, oder lege das Modul oben selbst an.</div>';
  }else{
    var lastG='', lastU='';
    list.forEach(function(x){
      var m=x.m;
      var g=(m.bereich==='Wahlpflicht'&&filterT&&filterT!=='_pf')?Regeln.themaName(filterT):(m.bereich==='Wahlpflicht'?Regeln.themaName(m.themen[0]):BEREICHE[m.bereich].name);
      var u=m.gruppe||'';
      if(g!==lastG){h+='<div class="group-h">'+esc(g)+'</div>';lastG=g;lastU=''}
      if(u!==lastU){if(u) h+='<div class="group-u">'+esc(u)+'</div>';lastU=u}
      h+=cardHTML(m,false);
    });
  }
  $('#catList').innerHTML=h;
}

/* Feld "Eigenes Modul anlegen" oben im Katalog. Vorbelegung richtet sich nach Filter und Suche. */
function addVorgabe(){
  var v={name:query.trim(),bereich:'Wahlbereich'};
  if(filterT&&filterT!=='_pf'){v.bereich='Wahlpflicht';v.thema=filterT}
  return v;
}
function addCardHTML(){
  var v=addVorgabe();
  var titel=v.name?'„'+esc(v.name)+'“ als eigenes Modul anlegen':'Eigenes Modul anlegen';
  var sub=v.bereich==='Wahlpflicht'?'im Themenbereich '+esc(Regeln.themaName(v.thema)):'z. B. Studium Generale oder andere Module für den Wahlbereich';
  return '<button type="button" class="addcard" id="catAdd"><span class="plus">+</span><span><b>'+titel+'</b><small>'+sub+'</small></span></button>';
}

/* ---------- Vertiefung und Hinweise ---------- */
function renderCheck(c){
  var v='';
  THEMEN.forEach(function(t){
    var o=c.T[t.id], all=o.d+o.a+o.p, ziel=t.vertiefung!==false;
    var dp=Math.min(100,o.d/S.grenzen.vertiefungMin*100), ap=Math.min(100,all/S.grenzen.vertiefungMin*100);
    v+='<div class="vrow" style="--sc:var(--c-'+t.id+')"><div class="vt"><span>'+esc(t.name)+'</span><b>'+all+(ziel?' von '+S.grenzen.vertiefungMin+' CP':' CP')+'</b></div>'
      +'<div class="vbar"><div class="p" style="width:'+ap+'%"></div><div class="d" style="width:'+dp+'%"></div>'+(ziel?'<div class="mk"></div>':'')+'</div></div>';
  });
  $('#vert').innerHTML=v;
  var msgs=Regeln.hinweise(c,plan);
  $('#msgs').innerHTML=msgs.map(function(x){return '<li class="'+x[0]+'">'+esc(x[1])+'</li>'}).join('');
}

function render(){
  var c=Regeln.berechne(plan);
  renderBand(c); renderPlanner(c); renderCatalog(); renderCheck(c);
  save();
}

/* ---------- Bewegen ---------- */
function moveTo(id,sem){
  var m=modById(id);
  if(!m || m.sem===sem) return;
  m.sem=sem;
  if(!sem){m.ok=false;m.note=null}
  render();
}

var dragId=null;
document.addEventListener('dragstart',function(e){
  var el=e.target.closest&&e.target.closest('.card'); if(!el) return;
  dragId=el.getAttribute('data-id');
  try{e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.effectAllowed='move'}catch(x){}
  el.classList.add('dragging');
  var m=modById(dragId);
  document.querySelectorAll('.col').forEach(function(col){
    var s=col.getAttribute('data-sem');
    if(m && (m.turnus==='WiSe'||m.turnus==='SoSe') && m.turnus!==Sem.saison(s)) col.classList.add('dim');
  });
  closePop();
});
document.addEventListener('dragend',function(){
  dragId=null;
  document.querySelectorAll('.dragging').forEach(function(x){x.classList.remove('dragging')});
  document.querySelectorAll('.dim,.over').forEach(function(x){x.classList.remove('dim');x.classList.remove('over')});
});
document.addEventListener('dragover',function(e){
  var z=e.target.closest&&e.target.closest('.col,.cat-zone'); if(!z) return;
  e.preventDefault();
  document.querySelectorAll('.over').forEach(function(x){if(x!==z)x.classList.remove('over')});
  z.classList.add('over');
});
document.addEventListener('drop',function(e){
  var z=e.target.closest&&e.target.closest('.col,.cat-zone'); if(!z) return;
  e.preventDefault();
  var id=dragId; try{id=e.dataTransfer.getData('text/plain')||dragId}catch(x){}
  var sem=z.classList.contains('col')?z.getAttribute('data-sem'):null;
  if(id) moveTo(id,sem);
});

/* Häkchen "bestanden" direkt an der Karte */
document.addEventListener('change',function(e){
  var id=e.target.getAttribute&&e.target.getAttribute('data-ok'); if(!id) return;
  var m=modById(id); if(!m) return;
  m.ok=e.target.checked; render();
});

/* ---------- Modul-Menü (Antippen) ---------- */
var pop=$('#pop'), popFor=null;
function popHTML(m){
  var info=[m.cp+' CP',TURNUS[m.turnus]||TURNUS.x];
  if(m.sprache) info.push(SPRACHEN[m.sprache]);
  var h='<div class="ph"><b>'+esc(m.name)+'</b><span>'+esc((m.nr?m.nr+' · ':'')+einordnung(m)+(m.gruppe?', '+m.gruppe:''))+'</span><span>'+esc(info.join(' · '))+'</span>'
    +(m.hinweis?'<span class="hw">'+esc(m.hinweis)+'</span>':'')+'</div>';
  if(m.sem){
    h+='<label class="prow"><input type="checkbox" data-pok="1"'+(m.ok?' checked':'')+'> bestanden</label>';
    if(m.ok){
      h+='<label class="prow">Note <select data-pnote="1"><option value="">keine</option>'
        +S.noten.map(function(n){return '<option value="'+n+'"'+(m.note===n?' selected':'')+'>'+noteText(n)+'</option>'}).join('')+'</select></label>';
    }
  }
  if(m.bereich==='Wahlpflicht'&&m.themen.length>1){
    h+='<label class="prow">zählt für <select data-pthema="1">'
      +m.themen.map(function(t){return '<option value="'+t+'"'+(m.thema===t?' selected':'')+'>'+esc(Regeln.themaName(t))+'</option>'}).join('')+'</select></label>';
  }
  h+='<div class="psep">'+(m.sem?'Verschieben nach':'Einplanen in')+'</div><div class="psem">';
  Zustand.semester(plan).forEach(function(s){
    h+='<button role="menuitem" data-to="'+s+'"'+(m.sem===s?' disabled':'')+'>'+esc(Sem.label(s))+'</button>';
  });
  h+='</div>';
  if(m.sem) h+='<button role="menuitem" data-to="">Zurück in den Katalog</button>';
  if(m.custom) h+='<button role="menuitem" data-edit="1">Eigenes Modul bearbeiten</button><button role="menuitem" class="del" data-del="1">Eigenes Modul löschen</button>';
  return h;
}
function placePop(el){
  var r=el.getBoundingClientRect(), pw=pop.offsetWidth, ph=pop.offsetHeight;
  var left=Math.min(Math.max(8,r.left),window.innerWidth-pw-8);
  var top=r.bottom+6; if(top+ph>window.innerHeight-8) top=Math.max(8,r.top-ph-6);
  pop.style.left=left+'px'; pop.style.top=top+'px';
}
function openPop(el){
  var m=modById(el.getAttribute('data-id')); if(!m) return;
  popFor=m.id;
  pop.innerHTML=popHTML(m); pop.classList.add('on');
  placePop(el);
  var f=pop.querySelector('input,select,button:not([disabled])'); if(f) f.focus();
}
function refreshPop(){
  var m=modById(popFor); if(!m){closePop();return}
  pop.innerHTML=popHTML(m);
}
function closePop(){pop.classList.remove('on');popFor=null}
pop.addEventListener('click',function(e){
  var b=e.target.closest('button'); if(!b||b.disabled) return;
  var id=popFor, m=modById(id); closePop();
  if(b.hasAttribute('data-del')){ plan.mods=plan.mods.filter(function(x){return x.id!==id}); render(); toast(m.name+' gelöscht.'); return; }
  if(b.hasAttribute('data-edit')){ modulDialog(m); return; }
  var to=b.getAttribute('data-to'); moveTo(id,to===''?null:to);
});
pop.addEventListener('change',function(e){
  var m=modById(popFor); if(!m) return;
  var t=e.target;
  if(t.hasAttribute('data-pok')){ m.ok=t.checked; if(!m.ok) m.note=null; }
  else if(t.hasAttribute('data-pnote')){ m.note=t.value===''?null:parseFloat(t.value); }
  else if(t.hasAttribute('data-pthema')){ m.thema=t.value; }
  render(); refreshPop();
});
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('.chk')) return;
  var card=e.target.closest&&e.target.closest('.card');
  if(card){ if(pop.classList.contains('on')&&popFor===card.getAttribute('data-id')){closePop();} else openPop(card); return; }
  if(!e.target.closest('#pop')) closePop();
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closePop();closeModal()}
  if((e.key==='Enter'||e.key===' ')&&document.activeElement&&document.activeElement.classList.contains('card')){
    e.preventDefault(); openPop(document.activeElement);
  }
});

/* ---------- Semester anhängen und entfernen ---------- */
$('#grid').addEventListener('click',function(e){
  if(e.target.closest('#btnAddSem')){
    var r=Zustand.zeitraumAendern(plan,plan.start,plan.anzahl+1);
    if(!r.ok) toast(r.grund); render(); return;
  }
  if(e.target.closest('[data-delsem]')){
    var r2=Zustand.zeitraumAendern(plan,plan.start,plan.anzahl-1);
    if(!r2.ok) toast(r2.grund); render();
  }
});

/* ---------- Filter ---------- */
$('#q').addEventListener('input',function(e){query=e.target.value;renderCatalog()});
$('#fTurnus').addEventListener('change',function(e){filterTurnus=e.target.value;renderCatalog()});
$('#fSprache').addEventListener('change',function(e){filterSprache=e.target.value;renderCatalog()});
$('#chips').addEventListener('click',function(e){
  var b=e.target.closest('.chip'); if(!b) return;
  var f=b.getAttribute('data-f'); filterT=f===''?null:(filterT===f?null:f); renderCatalog();
});

/* ---------- Dialoge ---------- */
var modal=$('#modal');
function openModal(html){modal.innerHTML='<div class="dlg">'+html+'</div>';modal.classList.add('on')}
function closeModal(){modal.classList.remove('on');modal.innerHTML=''}
modal.addEventListener('click',function(e){ if(e.target===modal) closeModal(); });

/* Eigenes Modul anlegen (m leer) oder bearbeiten */
function modulDialog(m,vorgabe){
  var opt=function(list,sel){return list.map(function(o){return '<option value="'+esc(o[0])+'"'+(o[0]===sel?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')};
  var a=m||Object.assign({nr:'',name:'',cp:3,bereich:'Wahlbereich',thema:THEMEN[0].id,turnus:'x',sprache:'de'},vorgabe||{});
  openModal('<h3>'+(m?'Eigenes Modul bearbeiten':'Eigenes Modul hinzufügen')+'</h3>'
   +'<div class="two"><div><label for="fNr">Modulnummer (optional)</label><input id="fNr" type="text" value="'+esc(a.nr||'')+'" placeholder="z. B. 16-10-5220"></div>'
   +'<div><label for="fC">Credit Points (CP)</label><input id="fC" type="number" min="1" max="30" value="'+a.cp+'"></div></div>'
   +'<label for="fN">Modulname</label><input id="fN" type="text" value="'+esc(a.name)+'" placeholder="z. B. Wärmepumpen und Kältetechnik">'
   +'<label for="fB">Bereich</label><select id="fB">'+opt([['Wahlpflicht','Wahlpflichtbereich'],['Wahlbereich','Wahlbereich (freie Wahl)'],['Grundlagen','Grundlagenmodul'],['IEP','Interdisziplinäres Energieprojekt'],['Thesis','Masterthesis']],a.bereich)+'</select>'
   +'<div id="fTw"><label for="fT">Themenbereich</label><select id="fT">'+opt(THEMEN.map(function(t){return [t.id,t.name]}),a.thema||THEMEN[0].id)+'</select></div>'
   +'<div class="two"><div><label for="fU">Angebot</label><select id="fU">'+opt(Object.keys(TURNUS).map(function(k){return [k,TURNUS[k]]}),a.turnus)+'</select></div>'
   +'<div><label for="fS">Sprache</label><select id="fS">'+opt(Object.keys(SPRACHEN).map(function(k){return [k,SPRACHEN[k]]}),a.sprache||'de')+'</select></div></div>'
   +'<p class="err" id="fErr"></p>'
   +'<div class="bar"><button class="btn" id="fX">Abbrechen</button><button class="btn primary" id="fOK">'+(m?'Speichern':'Modul hinzufügen')+'</button></div>');
  var tw=$('#fTw'), sync=function(){tw.style.display=$('#fB').value==='Wahlpflicht'?'block':'none'};
  sync(); $('#fB').addEventListener('change',sync);
  $('#fX').addEventListener('click',closeModal);
  $('#fOK').addEventListener('click',function(){
    var ang={nr:$('#fNr').value,name:$('#fN').value,cp:parseInt($('#fC').value,10),bereich:$('#fB').value,
             thema:$('#fT').value,turnus:$('#fU').value,sprache:$('#fS').value};
    if(!ang.name.trim()){$('#fErr').textContent='Bitte einen Modulnamen eingeben.';$('#fN').focus();return}
    if(!(ang.cp>=1&&ang.cp<=30)){$('#fErr').textContent='CP müssen zwischen 1 und 30 liegen.';$('#fC').focus();return}
    if(m){ if(!Zustand.aendereModul(m,ang)) return; }
    else { var neu=Zustand.neuesModul(ang); if(!neu) return; plan.mods.push(neu); }
    closeModal(); render(); toast(m?'Modul gespeichert.':'Modul angelegt, es steht jetzt im Katalog.');
  });
  var fN=$('#fN'); fN.focus(); fN.setSelectionRange(fN.value.length,fN.value.length);
}
$('#catList').addEventListener('click',function(e){ if(e.target.closest('#catAdd')) modulDialog(null,addVorgabe()); });

/* Zeitraum: Studienbeginn und Anzahl der Semester */
$('#btnZeit').addEventListener('click',function(){
  var akt=Sem.aktuell(), first=Sem.naechstes(akt,-12), opts='';
  for(var i=0;i<15;i++){var s=Sem.naechstes(first,i);opts+='<option value="'+s+'"'+(s===plan.start?' selected':'')+'>'+esc(Sem.label(s))+'</option>'}
  openModal('<h3>Zeitraum</h3><p class="fine">Die Semesterspalten beginnen mit deinem Studienbeginn. Vergangene Semester trägst du ein und setzt das Häkchen bei bestandenen Modulen.</p>'
   +'<div class="two"><div><label for="zS">Studienbeginn</label><select id="zS">'+opts+'</select></div>'
   +'<div><label for="zA">Anzahl Semester</label><input id="zA" type="number" min="'+S.zeitraum.min+'" max="'+S.zeitraum.max+'" value="'+plan.anzahl+'"></div></div>'
   +'<p class="err" id="zErr"></p>'
   +'<div class="bar"><button class="btn" id="zX">Abbrechen</button><button class="btn primary" id="zOK">Übernehmen</button></div>');
  $('#zX').addEventListener('click',closeModal);
  $('#zOK').addEventListener('click',function(){
    var r=Zustand.zeitraumAendern(plan,$('#zS').value,parseInt($('#zA').value,10));
    if(!r.ok){$('#zErr').textContent=r.grund;return}
    closeModal(); render();
  });
});

$('#btnExport').addEventListener('click',function(){
  var c=Regeln.berechne(plan), L=[];
  L.push('ESE-Plan, Stand '+new Date().toLocaleDateString('de-DE'));
  L.push('Bestanden '+c.done+' von '+S.grenzen.gesamt+' CP, mit Planung '+c.total+' CP'+(c.noten?', Notenschnitt '+komma(c.noten.schnitt.toFixed(2)):''));
  L.push('');
  Zustand.semester(plan).forEach(function(id){
    var items=plan.mods.filter(function(m){return m.sem===id}); if(!items.length) return;
    L.push(Sem.label(id)+' ('+items.reduce(function(s,m){return s+m.cp},0)+' CP)');
    items.forEach(function(m){
      var b=m.bereich==='Wahlpflicht'?'Wahlpflicht, '+Regeln.themaName(m.thema):BEREICHE[m.bereich].name;
      L.push('  ['+(m.ok?'x':' ')+'] '+m.name+(m.nr?' ('+m.nr+')':'')+' ['+m.cp+' CP, '+b+(m.ok&&m.note!==null?', Note '+noteText(m.note):'')+']');
    });
    L.push('');
  });
  openModal('<h3>Plan als Text</h3><p class="fine">[x] = bestanden. Text markieren und kopieren, z. B. für eine E-Mail an den Prüfungsausschuss.</p><textarea id="fT2" readonly></textarea><div class="bar"><button class="btn" id="fCp">Kopieren</button><button class="btn primary" id="fCl">Schließen</button></div>');
  var ta=$('#fT2'); ta.value=L.join('\n'); ta.focus(); ta.select();
  $('#fCl').addEventListener('click',closeModal);
  $('#fCp').addEventListener('click',function(){
    ta.focus(); ta.select();
    try{ if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value)} else {document.execCommand('copy')} }catch(e){}
    toast('Text kopiert.');
  });
});

$('#btnTheme').addEventListener('click',function(){
  var cur=document.documentElement.getAttribute('data-theme');
  var sysDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark=cur?cur==='dark':sysDark;
  document.documentElement.setAttribute('data-theme',isDark?'light':'dark');
});

var resetArmed=false, rb=$('#btnReset');
rb.addEventListener('click',function(){
  if(!resetArmed){resetArmed=true;rb.textContent='Wirklich leeren?';setTimeout(function(){resetArmed=false;rb.textContent='Plan leeren'},3500);return}
  resetArmed=false; rb.textContent='Plan leeren';
  var start=plan.start, anzahl=plan.anzahl;
  plan=Zustand.neu(); plan.start=start; plan.anzahl=anzahl;
  render(); toast('Plan geleert. Eigene Module und Einträge sind entfernt, der Zeitraum bleibt.');
});

/* ---------- Plan sichern und laden (JSON-Datei) ---------- */
var toastTimer=null;
function toast(msg){
  var t=$('#toast'); t.textContent=msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.classList.remove('on')},4500);
}
$('#btnSave').addEventListener('click',function(){
  var json=JSON.stringify(Zustand.exportieren(plan),null,2);
  var url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  var a=document.createElement('a');
  a.href=url; a.download='ese-plan-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
  toast('Plan gesichert als '+a.download+'. Die Datei liegt im Download-Ordner.');
});
$('#btnLoad').addEventListener('click',function(){$('#fileIn').click()});
$('#fileIn').addEventListener('change',function(e){
  var f=e.target.files&&e.target.files[0]; if(!f) return;
  var r=new FileReader();
  r.onload=function(){
    var s=null;
    try{s=JSON.parse(String(r.result))}catch(x){}
    var res=Zustand.importieren(s);
    if(!res.ok){toast('Die Datei ist kein gültiger Plan (oder stammt aus einer älteren Version). Es wurde nichts geändert.');}
    else{plan=res.plan; render(); toast('Plan geladen'+(res.skipped?' ('+res.skipped+' ungültige Einträge übersprungen).':'.'));}
  };
  r.onerror=function(){toast('Die Datei konnte nicht gelesen werden.')};
  r.readAsText(f);
  e.target.value='';
});

/* ---------- Anleitung (beim ersten Besuch und über das i oben) ---------- */
var HILFE_KEY='ese-planer-hilfe-v1';
function showHelp(){
  openModal('<h3>So funktioniert der Planer</h3>'
   +'<ol class="help">'
   +'<li><b>Zeitraum festlegen.</b> Unter „Zeitraum“ stellst du Studienbeginn und Anzahl der Semester ein. Mit „+ Semester“ hängst du später weitere an.</li>'
   +'<li><b>Module einplanen.</b> Ziehe ein Modul aus dem Katalog links in ein Semester. Auf dem Handy: Modul antippen und Semester wählen. Zurück in den Katalog geht es ebenfalls per Ziehen.</li>'
   +'<li><b>Bestanden markieren.</b> Das Häkchen an der Karte setzt das Modul auf „bestanden“. Eine Note trägst du ein, indem du die Karte antippst.</li>'
   +'<li><b>Fehlendes Modul?</b> Ganz oben im Katalog legst du ein eigenes Modul an, z. B. für das Studium Generale.</li>'
   +'<li><b>Fortschritt prüfen.</b> Oben siehst du die Credit Points (CP) im Verhältnis zu den 120 CP. Rechts zeigt die Vertiefung, wie weit du bei den 20 CP in einem Themenbereich bist, darunter stehen Hinweise zu Angebotsturnus und Semesterlast.</li>'
   +'<li><b>Speichern.</b> Dein Plan wird automatisch in diesem Browser gespeichert und verlässt ihn nicht. Für eine Sicherung oder ein anderes Gerät nutze „Plan sichern“ und „Plan laden“.</li>'
   +'</ol>'
   +'<p class="fine">Diese Anleitung erreichst du jederzeit über das „i“ oben. Angaben ohne Gewähr, maßgeblich sind Prüfungsordnung, Studienplan und Modulhandbuch.</p>'
   +'<div class="bar"><button class="btn primary" id="hOK">Verstanden</button></div>');
  $('#hOK').addEventListener('click',closeModal);
  $('#hOK').focus();
}
$('#btnHelp').addEventListener('click',showHelp);

load(); render();
(function(){
  var seen=false;
  try{seen=localStorage.getItem(HILFE_KEY)==='1'; localStorage.setItem(HILFE_KEY,'1')}catch(e){}
  if(!seen) showHelp();
})();
})();
