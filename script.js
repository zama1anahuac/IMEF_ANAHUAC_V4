'use strict';
// Megabase V4, static site. Every proposal/question/route comes only from data/catalogo_v4.json.
const DATA_PATH='data/catalogo_v4.json', PAGE=18;
let D=null, P=new Map(), Q=new Map(), L=new Map(), T=new Map(), B=new Map(), S=new Map(), R=new Map(), searches=new Map();
let screen='inicio', stage=0, instMode='exec', instPage=0, dlPage=0, page=0, finder='', dlQuery='', dlLine='';
const state={linea:null,problema:null,propuesta:null,alcance:null,sector:null};
const STEPS=['Tema general','Tema específico y problema','Pregunta de investigación','Alcance metodológico','Sector de Yucatán','Ficha final'];
const $=s=>document.querySelector(s);
const el=(s)=>document.getElementById(s);
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeHref=s=>/^https?:\/\//.test(String(s??''))?esc(s):'#';
const fmt=n=>new Intl.NumberFormat('es-MX').format(Number(n||0));
function note(s){const t=el('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2700)}
function pqs(id,alc){return (Q.get(id)||[]).find(q=>q.alcance===alc)}
function sectorsFor(prop,alc){return [...new Set((R.get(prop)||[]).filter(x=>x.alcance===alc).map(x=>x.id_sector))].filter(x=>S.has(x))}
function navParams(){const u=new URL(location.href);u.search='';u.searchParams.set('vista',screen);if(screen==='explorar'){
 if(state.linea)u.searchParams.set('linea',state.linea);
 if(state.problema)u.searchParams.set('problema',state.problema);
 if(state.propuesta)u.searchParams.set('propuesta',state.propuesta);
 if(state.alcance)u.searchParams.set('alcance',state.alcance);
 if(state.sector)u.searchParams.set('sector',state.sector);
 u.searchParams.set('paso',String(stage+1));
}return u.pathname+u.search+u.hash}
function syncURL(replace=false){history[replace?'replaceState':'pushState'](null,'',navParams())}
function pickView(name,replace=false){screen=['inicio','explorar','institucional','metodo','descargas'].includes(name)?name:'inicio';
 document.querySelectorAll('.screen').forEach(x=>x.hidden=x.id!==`screen-${screen}`);
 document.querySelectorAll('[data-view]').forEach(x=>{if(x.classList.contains('navbtn'))x.classList.toggle('selected',x.dataset.view===screen)});
 el('nav').classList.remove('open');el('menu').setAttribute('aria-expanded','false');
 if(screen==='explorar')renderExplorer();if(screen==='institucional')renderInstitutional();if(screen==='metodo')renderMethod();if(screen==='descargas')renderDownloads();
 syncURL(replace);scrollTo({top:0,behavior:'auto'});
}
function clearAfter(key){const order=['linea','problema','propuesta','alcance','sector'];let at=order.indexOf(key);for(let i=at+1;i<order.length;i++)state[order[i]]=null}
function choose(key,id,next){state[key]=id;clearAfter(key);stage=next;page=0;finder='';el('finder').value='';renderExplorer();syncURL();}
function stageSet(n){stage=Math.max(0,Math.min(n,5));page=0;finder='';el('finder').value='';renderExplorer();syncURL()}
function pagerHtml(total,cur){let n=Math.max(1,Math.ceil(total/PAGE));if(n===1)return '';return `<button type="button" data-page="${Math.max(0,cur-1)}" ${cur===0?'disabled':''}>← Anterior</button><span>${cur+1} / ${n} · ${fmt(total)} opciones</span><button type="button" data-page="${Math.min(n-1,cur+1)}" ${cur===n-1?'disabled':''}>Siguiente →</button>`}
function makeOption(label,tag,desc,id,key,next,cls='',extra=''){return `<button type="button" class="option ${cls}" data-choice="${esc(key)}" data-id="${esc(id)}" data-next="${next}" ${extra}><span class="tag">${esc(tag)}</span><strong>${esc(label)}</strong><small>${esc(desc)}</small><span class="arrow" aria-hidden="true">↗</span></button>`}
function renderExplorer(){
 const idx=stage;
 el('stepCounter').textContent=`PASO ${idx+1} DE 6`;
 el('stepTitle').textContent=['Selecciona un tema general','Elige un tema específico y su problema','Selecciona la pregunta de investigación','Elige el alcance de estudio','Delimita el sector y territorio','Ficha final de investigación'][idx];
 el('stepSubtitle').textContent=['12 líneas temáticas documentadas; sus conteos corresponden a propuestas únicas.','Los problemas proceden de pares compatibles con el tema seleccionado.','Las formulaciones DES son preguntas base; el alcance causal se consulta después.','Una hipótesis causal redactada no demuestra un efecto ni valida el diseño.','Los sectores proceden de vínculos existentes entre propuesta, pregunta y alcance.','Revisa el estado metodológico, las fuentes y las limitaciones antes de usarla.'][idx];
 el('stepProgress').textContent=`${idx+1} / 6`;
 el('stepList').innerHTML=STEPS.map((name,i)=>`<button class="stepbtn ${i===stage?'active':i<stage?'done':''}" data-step="${i}" ${i>stage?'disabled':''}><span class="num">${i+1}</span><em>${esc(name)}</em></button>`).join('');
 el('routeHint').textContent=[state.linea?L.get(state.linea)?.nombre:'Sin tema',state.problema?B.get(state.problema)?.problema:'',state.propuesta?state.propuesta:'',state.alcance||'',state.sector?S.get(state.sector)?.nombre:''].filter(Boolean).join('  ·  ')||'Selecciona un tema para comenzar.';
 el('backStep').disabled=stage===0;
 el('searchWrap').hidden=stage>=3;el('options').hidden=stage===5;el('finalFicha').hidden=stage!==5;el('pager').hidden=stage>=3;
 const filter=norm(finder.trim());let list=[];
 if(stage===0){
  list=D.lineas.filter(l=>!filter||norm(l.nombre).includes(filter)).map(l=>({line:l,count:D.propuestas.filter(p=>p.id_linea===l.id_linea).length}));
  el('options').innerHTML=list.map(x=>makeOption(x.line.nombre,`${x.line.id_linea} · ${x.count} propuestas`,x.line.clasificacion_imef==='A'?'Vinculación local documentada por tema':'Afinidad temática con comités nacionales',x.line.id_linea,'linea',1)).join('');
 } else if(stage===1){
  list=D.propuestas.filter(p=>p.id_linea===state.linea && (!filter||searches.get(p.id_propuesta).includes(filter)));
  el('options').innerHTML=paginated(list).map(p=>makeOption(p.problema,`${p.id_propuesta} · ${p.tema_especifico}`,`Problema hipotético · ${p.sector_original}`,p.id_problema,'problema',2)).join('');
 } else if(stage===2){
  list=D.propuestas.filter(p=>p.id_linea===state.linea && p.id_problema===state.problema && (!filter||searches.get(p.id_propuesta).includes(filter)));
  el('options').innerHTML=paginated(list).map(p=>{const q=pqs(p.id_propuesta,'DES');return makeOption(q?.texto_base||p.pregunta_v1||p.titulo_original,`${p.id_propuesta} · ${q?.id_pregunta||'Pregunta pendiente'}`,p.titulo_original,p.id_propuesta,'propuesta',3)}).join('');
 } else if(stage===3){
  const id=state.propuesta, p=P.get(id),des=pqs(id,'DES'),cau=pqs(id,'CAU');list=des?[des,...(cau?[cau]:[])]:[];
  let out=makeOption(des?.texto_base||'Pregunta descriptiva pendiente','RUTA A · DESCRIPTIVA',`${des?.diseno_candidato||p?.metodo||''} · Estado: ${des?.estado_factibilidad||'Preliminar'}`,'DES','alcance',4,'des');
  if(cau){out+=makeOption(cau.texto_base,'RUTA B · CAUSAL CANDIDATA',`${cau.estado_factibilidad}. Requiere identificación, datos y revisión. NO HABILITADA.`, 'CAU','alcance',4,'cau');}
  else out+=`<div class="option cau" role="status"><span class="tag">RUTA B · NO FORMULADA</span><strong>Sin pregunta causal documentada</strong><small>Esta investigación no contiene una candidata causal en el catálogo V4. No se crea una pregunta automáticamente.</small></div>`;
  el('options').innerHTML=out;
 } else if(stage===4){
  list=sectorsFor(state.propuesta,state.alcance).map(id=>S.get(id));
  el('options').innerHTML=list.map(s=>makeOption(s.nombre,s.id_sector,`Territorio: ${s.territorio}. Sector vinculado en la base V4.`,s.id_sector,'sector',5)).join('');
 } else if(stage===5){el('finalFicha').innerHTML=fichaHtml();}
 el('noOptions').hidden=stage===5||list.length>0;
 if(stage<3){el('pager').innerHTML=pagerHtml(list.length,page)}else el('pager').innerHTML='';
}
function paginated(list){const n=Math.max(1,Math.ceil(list.length/PAGE));page=Math.max(0,Math.min(page,n-1));return list.slice(page*PAGE,(page+1)*PAGE)}
function addFact(label,value,full=false){if(value===null||value===undefined||String(value).trim()==='')return '';return `<div class="fact ${full?'full':''}"><span class="label">${esc(label)}</span><p>${esc(value)}</p></div>`}
function fichaHtml(){
 const p=P.get(state.propuesta),q=pqs(state.propuesta,state.alcance),s=S.get(state.sector);
 if(!p||!q||!s||!sectorsFor(p.id_propuesta,state.alcance).includes(s.id_sector))return '<div class="empty">Ruta inconsistente. Regresa y modifica la selección.</div>';
 const causal=state.alcance==='CAU';const srcCodes=String(p.fuentes||'').split(';').map(x=>x.trim()).filter(Boolean);
 const avail=srcCodes.map(id=>D.fuentes.find(s=>s.id===(D.fuentes_alias_v3[id]||id))).filter(Boolean).filter(x=>/^https?:\/\//.test(x.url||''));
 const refHTML=avail.length?`<div class="source-list">${avail.map(x=>`<a href="${safeHref(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.id)} · ${esc(x.titulo)} ↗</a>`).join('')}</div>`:'Códigos de fuente registrados en la base maestra; sin enlaces públicos disponibles.';
 const causalStatus=causal?`<div class="caution warning"><strong>CAUSAL CANDIDATA · NO HABILITADA</strong><p>${esc(q.estado_factibilidad)}. Ningún efecto está identificado ni existe validación metodológica del profesor. La ficha es una hipótesis de diseño.</p></div>`:'<div class="caution"><strong>DESCRIPTIVA PRELIMINAR</strong><p>Se puede explorar su formulación; falta muestra, datos y validación de instrumentos.</p></div>';
 const score=p.puntaje_v1===null?'Sin calificación: nueva propuesta pendiente de calibración':`${p.puntaje_v1}/100 · puntaje editorial heredado V1, no aprobación`;
 return `<div class="ficha-head"><strong>${esc(p.id_propuesta)} · ${causal?'RUTA B CAUSAL':'RUTA A DESCRIPTIVA'}</strong><h2>${esc(p.titulo_original)}</h2><p>${esc(p.revision)}</p></div><div class="trace"><span>${esc(p.id_linea)}</span><b>→</b><span>Problema</span><b>→</b><span>Pregunta</span><b>→</b><span>${esc(state.alcance)}</span><b>→</b><span>${esc(s.id_sector)}</span></div>${causalStatus}<div class="facts">${addFact('Tema general',p.tema_general)}${addFact('Tema específico',p.tema_especifico)}${addFact('Problema de investigación',p.problema,true)}${addFact('Pregunta '+state.alcance,q.texto_base,true)}${addFact('Pregunta contextualizada',((R.get(p.id_propuesta)||[]).find(r=>r.id_pregunta===q.id_pregunta&&r.id_sector===s.id_sector)||{}).pregunta_contextualizada,true)}${addFact('Sector y población',s.nombre)}${addFact('Territorio',s.territorio)}${addFact('Variables sustantivas',p.variables_originales,true)}${addFact('Objetivo potencial',`Describir o analizar ${p.variables_originales} según el alcance ${causal?'causal candidato':'descriptivo'} propuesto. No es un estudio ejecutado.`,true)}${addFact('Relación con IMEF',p.clasificacion_imef)}${addFact('Relación con Anáhuac Mayab',p.aporte_facultad)}${addFact('Contexto de Yucatán',p.evidencia,true)}${addFact('Método potencial',causal?q.diseno_candidato:p.metodo,true)}${addFact('Información necesaria',p.datos_necesarios,true)}${causal?addFact('Exposición candidata',q.exposicion):''}${causal?addFact('Resultado causal',q.resultado):''}${causal?addFact('Confusores y contrafactual',`${q.confusores||'Pendientes'} · ${q.temporalidad_contrafactual||'Pendiente'}`,true):''}${addFact('Factibilidad y revisión',`${p.factibilidad}. ${q.estado_factibilidad}`,true)}${addFact('Pertinencia editorial',score)}${addFact('Limitaciones',`${p.hipotesis}. ${p.revision}. Acceso y consentimiento pendientes.`,true)}${addFact('Fuentes verificables',srcCodes.join(', '),true)}${addFact('Estado institucional','Propuesta preliminar. Sin autorización docente de difusión ni aprobación del IMEF Yucatán.',true)}</div><div class="fact full"><span class="label">Fuentes de contexto enlazadas</span>${refHTML}</div><div class="ficha-buttons"><a class="btn" href="downloads/fichas/${encodeURIComponent(p.id_propuesta)}.pdf" download>↓ Ficha PDF preliminar</a><button class="btn outline" id="scopeChange">↔ Cambiar alcance</button><button class="btn outline" id="sectorChange">⌖ Cambiar sector</button><button class="btn outline" id="copyLink">Copiar enlace directo</button><button class="btn outline" id="newExplore">Otra investigación</button></div>`;
}
function goProposal(id){const p=P.get(id);if(!p)return;state.linea=p.id_linea;state.problema=p.id_problema;state.propuesta=id;state.alcance='DES';state.sector=sectorsFor(id,'DES')[0]||null;stage=state.sector?5:4;page=0;finder='';el('finder').value='';pickView('explorar')}
function renderMetrics(){el('metrics').innerHTML=[['n_propuestas_unicas','Propuestas únicas'],['n_preguntas_descriptivas_unicas','Preguntas descriptivas'],['n_preguntas_causales_candidatas_unicas','Causales candidatas'],['n_temas_generales','Líneas del IMEF'],['n_sectores','Sectores y poblaciones']].map(([k,t])=>`<div class="metric"><strong>${fmt(D.counts[k])}</strong><span>${esc(t)}</span></div>`).join('')}
function renderInstitutional(){let filtered=instMode==='exec'?D.propuestas.filter(x=>x.ejecutiva):instMode==='legacy'?D.propuestas.filter(x=>x.id_problema_v3):D.propuestas.filter(x=>!x.id_problema_v3);
 ['exec','legacy','ampliado'].forEach(m=>{let e=el(m==='exec'?'showExec':m==='legacy'?'showLegacy':'showAmpliado');e.classList.toggle('selected',instMode===m);e.setAttribute('aria-pressed',String(instMode===m))});
 const n=Math.ceil(filtered.length/12),shown=filtered.slice(instPage*12,(instPage+1)*12);
 el('institutionalGrid').innerHTML=shown.map(p=>`<article class="catalog-card"><span class="id">${esc(p.id_propuesta)} · ${esc(p.id_linea)} ${p.ejecutiva?'· EJECUTIVA':''}</span><h3>${esc(p.titulo_original)}</h3><p>${esc(p.sector_original)}</p><p>${p.puntaje_v1===null?'Sin puntuación asignada':`Puntaje editorial V1: ${p.puntaje_v1}/100`}</p><button class="btn outline" data-openprop="${esc(p.id_propuesta)}">Abrir ficha →</button></article>`).join('');
 el('institutionalPager').innerHTML=n>1?`<button data-instpage="${Math.max(0,instPage-1)}" ${instPage===0?'disabled':''}>Anterior</button><span>${instPage+1} de ${n}</span><button data-instpage="${Math.min(n-1,instPage+1)}" ${instPage===n-1?'disabled':''}>Siguiente</button>`:'';
}
function renderMethod(){el('filtersAE').innerHTML=[['A','IMEF','Afinidad respaldada por área técnica nacional o declaración local, sin aval a propuestas.'],['B','Facultad','Correspondencia con programas publicados de Anáhuac Mayab; recursos docentes no comprometidos.'],['C','Yucatán','Actividad económica y territorio plausibles; no prueba de prevalencia municipal.'],['D','Coherencia científica','Problema, preguntas, variables, población y alcance compatibles; revisión individual pendiente.'],['E','Datos y factibilidad','Datos públicos o participación voluntaria razonable; acceso y consentimiento no confirmados.']].map(([k,n,t])=>`<div class="list-card"><div class="key">${k}</div><div><strong>${n}</strong><p>${t}</p></div></div>`).join('');
 el('rubric').innerHTML=D.rubrica.map(x=>`<div class="rubricitem"><div><span>${esc(x.criterio)}</span><span>${x.peso}%</span></div><div class="bar"><span style="width:${x.peso}%"></span></div><p>${esc(x.definicion)}</p></div>`).join('');
 el('sourceList').innerHTML=D.fuentes.filter(x=>/^https?:\/\//.test(x.url||'')).map(x=>`<div class="source"><span class="sourceid">${esc(x.id)}</span><strong>${esc(x.titulo)}</strong><p>${esc(x.autor)} · ${esc(x.fecha)} · ${esc(x.limite)}</p><a href="${safeHref(x.url)}" target="_blank" rel="noopener noreferrer">Consultar fuente ↗</a></div>`).join('')}
function renderDownloads(){
 el('dlFeatured').innerHTML=[['PDF','Agenda ejecutiva · 12 propuestas','Resumen de la selección institucional original.','downloads/03_AGENDA_EJECUTIVA_V4.pdf'],['CSV','Catálogo preliminar V4','249 propuestas únicas y preguntas asociadas.','downloads/02_CATALOGO_PRELIMINAR_V4.csv'],['PDF','Metodología, estados y fuentes','Reglas A–E y límites de inferencia causal.','downloads/04_METODOLOGIA_V4.pdf'],['CSV','Registro público de fuentes','Fuentes con URL y alcance probatorio.','downloads/05_FUENTES_PUBLICAS_V4.csv'],['CSV','Autorizadas para difusión · 0','Solo encabezados hasta contar con autorización.','downloads/06_PROPUESTAS_AUTORIZADAS_DIFUSION.csv']].map(([ico,title,desc,path])=>`<article class="dl-tile"><span class="dl-icon">${ico}</span><h3>${title}</h3><p>${desc}</p><a class="btn" download href="${path}">Descargar ↓</a></article>`).join('');
 if(!el('dlLine').dataset.ready){el('dlLine').innerHTML='<option value="">Todas las líneas</option>'+D.lineas.map(l=>`<option value="${esc(l.id_linea)}">${esc(l.nombre)}</option>`).join('');el('dlLine').dataset.ready='yes'}
 const matching=downloadMatches();let n=Math.ceil(matching.length/PAGE);dlPage=Math.min(dlPage,Math.max(0,n-1));
 el('downloadList').innerHTML=matching.slice(dlPage*PAGE,(dlPage+1)*PAGE).map(p=>`<article class="dlitem"><div><small>${esc(p.id_propuesta)} · ${esc(p.id_linea)}</small><h3>${esc(p.titulo_original)}</h3><p>${esc(p.sector_original)}</p></div><a class="btn outline" download href="downloads/fichas/${encodeURIComponent(p.id_propuesta)}.pdf">↓ PDF</a></article>`).join('')||'<div class="empty">No hay fichas con los filtros actuales.</div>';
 el('downloadPager').innerHTML=n>1?`<button data-dlpage="${Math.max(0,dlPage-1)}" ${dlPage===0?'disabled':''}>Anterior</button><span>${dlPage+1} de ${n} · ${fmt(matching.length)} fichas</span><button data-dlpage="${Math.min(n-1,dlPage+1)}" ${dlPage===n-1?'disabled':''}>Siguiente</button>`:'';
}
function downloadMatches(){let text=norm(dlQuery.trim());return D.propuestas.filter(p=>(!dlLine||p.id_linea===dlLine)&&(!text||searches.get(p.id_propuesta).includes(text)))}
function csvVal(s){return '"'+String(s??'').replace(/"/g,'""')+'"'}
function downloadCSV(){let matched=new Set(downloadMatches().map(p=>p.id_propuesta));let r=D.relaciones.filter(x=>matched.has(x.id_propuesta));let fields=['id_relacion','id_propuesta','id_pregunta','alcance','id_sector','sector','territorio','estado_causal','pregunta_contextualizada'];let str='\ufeff'+fields.join(',')+'\r\n'+r.map(row=>fields.map(f=>csvVal(row[f])).join(',')).join('\r\n');let blob=new Blob([str],{type:'text/csv;charset=utf-8'});let href=URL.createObjectURL(blob);let a=document.createElement('a');a.href=href;a.download='02_RUTAS_FILTRADAS_PRELIMINARES_V4.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);note(`${fmt(r.length)} relaciones exportadas; no equivalen a propuestas únicas.`)}
function parseURL(){const x=new URLSearchParams(location.search);let vista=x.get('vista')||'inicio';const id=x.get('propuesta');const p=P.get(id);if(p){state.linea=p.id_linea;state.problema=p.id_problema;state.propuesta=id;let alc=x.get('alcance')||'DES';state.alcance=pqs(id,alc)?alc:'DES';let secs=sectorsFor(id,state.alcance);state.sector=secs.includes(x.get('sector'))?x.get('sector'):null;stage=state.sector?5:4;}else{let line=x.get('linea');if(L.has(line)){state.linea=line;stage=1;let prob=x.get('problema');if(B.has(prob)&&D.propuestas.some(p=>p.id_linea===line&&p.id_problema===prob)){state.problema=prob;stage=2}}}
 if(vista==='explorar')screen='explorar';else if(['institucional','metodo','descargas'].includes(vista))screen=vista;else screen='inicio';return screen}
function attach(){
 document.addEventListener('click',e=>{const nav=e.target.closest('[data-view]');if(nav){pickView(nav.dataset.view);return}const open=e.target.closest('[data-openprop]');if(open){goProposal(open.dataset.openprop);return}});
 el('menu').onclick=()=>{let isOpen=el('nav').classList.toggle('open');el('menu').setAttribute('aria-expanded',String(isOpen))};
 el('retry').onclick=()=>location.reload();
 el('resetAll').onclick=()=>{Object.keys(state).forEach(k=>state[k]=null);stage=0;finder='';el('finder').value='';renderExplorer();syncURL()};
 el('backStep').onclick=()=>{if(stage>0)stageSet(stage-1)};
 el('stepList').onclick=e=>{const btn=e.target.closest('[data-step]');if(btn&&Number(btn.dataset.step)<=stage)stageSet(Number(btn.dataset.step))};
 el('finder').oninput=e=>{finder=e.target.value;page=0;renderExplorer()};
 el('options').onclick=e=>{const b=e.target.closest('button[data-choice]');if(!b||b.disabled)return;choose(b.dataset.choice,b.dataset.id,Number(b.dataset.next))};
 el('pager').onclick=e=>{const b=e.target.closest('[data-page]');if(b){page=Number(b.dataset.page);renderExplorer();el('options').scrollIntoView({block:'nearest',behavior:'smooth'})}};
 el('finalFicha').onclick=async e=>{if(e.target.closest('#scopeChange'))stageSet(3);if(e.target.closest('#sectorChange'))stageSet(4);if(e.target.closest('#newExplore')){Object.keys(state).forEach(k=>state[k]=null);stageSet(0)}if(e.target.closest('#copyLink')){try{await navigator.clipboard.writeText(location.href);note('Enlace directo copiado')}catch(err){note('Copia el enlace de la barra de direcciones')}}};
 el('showExec').onclick=()=>{instMode='exec';instPage=0;renderInstitutional()};el('showLegacy').onclick=()=>{instMode='legacy';instPage=0;renderInstitutional()};el('showAmpliado').onclick=()=>{instMode='ampliado';instPage=0;renderInstitutional()};
 el('institutionalPager').onclick=e=>{let b=e.target.closest('[data-instpage]');if(b){instPage=Number(b.dataset.instpage);renderInstitutional()}};
 el('dlLine').onchange=e=>{dlLine=e.target.value;dlPage=0;renderDownloads()};
 el('dlSearch').oninput=e=>{dlQuery=e.target.value;dlPage=0;renderDownloads()};
 el('downloadPager').onclick=e=>{let b=e.target.closest('[data-dlpage]');if(b){dlPage=Number(b.dataset.dlpage);renderDownloads()}};
 el('downloadFiltered').onclick=downloadCSV;
 window.addEventListener('popstate',()=>{Object.keys(state).forEach(k=>state[k]=null);stage=0;parseURL();pickView(screen,true)})
}
async function init(){try{const res=await fetch(DATA_PATH,{cache:'no-cache'});if(!res.ok)throw Error('HTTP '+res.status);D=await res.json();
 if(D.counts.n_propuestas_unicas!==D.propuestas.length||D.counts.n_rutas_navegables_validas!==D.relaciones.length)throw Error('El manifiesto no coincide con los datos');
 D.propuestas.forEach(p=>P.set(p.id_propuesta,p));D.preguntas.forEach(q=>{if(!Q.has(q.id_propuesta))Q.set(q.id_propuesta,[]);Q.get(q.id_propuesta).push(q)});D.lineas.forEach(x=>L.set(x.id_linea,x));D.temas_especificos.forEach(x=>T.set(x.id_tema_especifico,x));D.problemas.forEach(x=>B.set(x.id_problema,x));D.sectores.forEach(x=>S.set(x.id_sector,x));D.relaciones.forEach(r=>{if(!R.has(r.id_propuesta))R.set(r.id_propuesta,[]);R.get(r.id_propuesta).push(r)});
 D.propuestas.forEach(p=>{const questions=Q.get(p.id_propuesta)||[];searches.set(p.id_propuesta,norm([p.id_propuesta,p.titulo_original,p.problema,p.tema_especifico,p.tema_general,p.sector_original,...questions.map(q=>q.texto_base)].join(' ')))});
 attach();renderMetrics();el('loading').hidden=true;parseURL();pickView(screen,true);
 }catch(err){el('loading').hidden=true;el('error').hidden=false;console.error('Megabase V4',err)}}
init();
