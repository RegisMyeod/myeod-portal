(function(root){
'use strict';
const FRAME_BOOTSTRAP="/* Executed in an opaque sandbox. Authentication stays in the parent portal. */\n(function(){\n const initial=window.MyEODFrameInitial, pending=new Map();let counter=0;\n function call(kind,data){return new Promise((resolve,reject)=>{const id=++counter;pending.set(id,{resolve,reject});parent.postMessage({myeodInternal:true,id,kind,...data},'*');setTimeout(()=>{if(pending.delete(id))reject(Error('No response'));},kind==='choose_json'?120000:15000);});}\n addEventListener('message',event=>{if(event.source!==parent||!event.data?.myeodInternal)return;const p=pending.get(event.data.id);if(p){pending.delete(event.data.id);event.data.error?p.reject(Object.assign(Error(event.data.error),{code:event.data.code})):p.resolve(event.data.value);}});\n function jsonImportAllowed(el){return initial.can_edit&&['rh','planning','bizdev'].includes(initial.section)&&(el.getAttribute('accept')||'').split(',').map(x=>x.trim()).includes('.json')&&/^(?:handleRhgridJsonImport|importData)\\(event\\);?$/.test(el.getAttribute('onchange')||'');}\n const inputClick=HTMLInputElement.prototype.click;\n HTMLInputElement.prototype.click=function(){if(this.type==='file'&&jsonImportAllowed(this)){const input=this;call('choose_json',{}).then(file=>{if(!file)return;const transfer=new DataTransfer();transfer.items.add(new File([file.content],file.filename,{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));}).catch(e=>alert(e.message));return;}return inputClick.call(this);};\n const exportBlobs=new Map(),createBlobURL=URL.createObjectURL.bind(URL),revokeBlobURL=URL.revokeObjectURL.bind(URL),anchorClick=HTMLAnchorElement.prototype.click;\n URL.createObjectURL=blob=>{const url=createBlobURL(blob);if(blob instanceof Blob&&/^application\\/json(?:;|$)/i.test(blob.type))exportBlobs.set(url,blob);return url;};\n URL.revokeObjectURL=url=>{exportBlobs.delete(url);revokeBlobURL(url);};\n HTMLAnchorElement.prototype.click=function(){const blob=exportBlobs.get(this.href);if(this.download&&blob){const filename=this.download;blob.text().then(content=>call('download_json',{filename,content})).catch(e=>alert(e.message));return;}return anchorClick.call(this);};\n window.alert=message=>{\n  const dialog=document.createElement('dialog'),text=document.createElement('p'),button=document.createElement('button');dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-label',initial.lang==='en'?'Module message':'Message du module');text.textContent=String(message);button.type='button';button.textContent=initial.lang==='en'?'Close':'Fermer';button.onclick=()=>{dialog.close();dialog.remove();};dialog.addEventListener('cancel',()=>dialog.remove());dialog.append(text,button);document.body.append(dialog);dialog.showModal();button.focus();\n };\n const values={...initial.values};\n const storage={getItem:key=>values[key]??null,setItem:(key,value)=>{values[key]=String(value);call('state',{key,value:String(value)}).catch(e=>alert(e.message));},removeItem:key=>storage.setItem(key,''),clear:()=>{for(const key of Object.keys(values))storage.removeItem(key);}};\n window.MyEODFrameSaveState=async(key,value)=>{const text=String(value);await call('state',{key,value:text});values[key]=text;return true;};\n window.MyEODFrameModal=open=>call('modal_layout',{open:open===true});\n Object.defineProperty(window,'localStorage',{value:storage});Object.defineProperty(window,'sessionStorage',{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});\n window.fetch=async(input,options={})=>{\n  const url=typeof input==='string'?input:input.url;\n  const result=await call('request',{url,method:options.method||'GET',body:options.body||null});\n  return new Response(result.body,{status:result.status,headers:result.headers});\n };\n const chain={on(){return this;},subscribe(){return this;},unsubscribe(){}};\n function from(table){\n  const q={table,method:'GET',params:{},body:null,one:false};\n  const b={select(columns='*'){q.params.select=columns;return b;},eq(k,v){q.params[k]='eq.'+v;return b;},neq(k,v){q.params[k]='neq.'+v;return b;},order(k,o={}){q.params.order=k+(o.ascending===false?'.desc':'.asc');return b;},limit(n){q.params.limit=n;return b;},single(){q.one=true;return b;},maybeSingle(){q.one=true;return b;},insert(v){q.method='POST';q.body=v;return b;},upsert(v,o={}){q.method='POST';q.body=v;q.params.on_conflict=o.onConflict||'';q.upsert=true;q.ignoreDuplicates=o.ignoreDuplicates;return b;},update(v){q.method='PATCH';q.body=v;return b;},delete(){q.method='DELETE';return b;},then(resolve,reject){return call('query',q).then(r=>{if(q.one&&Array.isArray(r.data)){r.data=r.data[0]??null;if(!r.data)r.error={message:'Record unavailable'};}return r;}).catch(e=>({data:null,error:{message:e.message,code:e.code}})).then(resolve,reject);}};return b;\n }\n const session={user:initial.user};\n const client={from,rpc:async(name,args)=>{if(name!=='myeod_structure_reset')return {data:null,error:{message:'RPC unavailable'}};try{return await call('query',{table:'admin_docs',method:'RESET',params:{},body:args?.desired});}catch(e){return {data:null,error:{message:e.message,code:e.code}};}},auth:{getSession:async()=>({data:{session},error:null}),getUser:async()=>({data:{user:initial.user},error:null}),onAuthStateChange:fn=>{queueMicrotask(()=>fn('SIGNED_IN',session));return {data:{subscription:{unsubscribe(){}}}};},setSession:async()=>({data:{session},error:null})},channel:()=>chain,removeChannel(){},removeAllChannels(){},storage:{from:()=>({upload:async()=>({error:{message:'Use Documents in the portal'}}),getPublicUrl:()=>({data:{publicUrl:''}})})}};\n window.supabase={createClient:()=>client};window.MyEODLegacyClient=()=>client;window.__supabase__={createClient:()=>client};\n function navigate(url){call('navigate',{url:String(url)}).catch(e=>alert(e.message));}\n window.open=(url)=>{navigate(url);return null;};window.close=()=>navigate('acces-collaborateurs.html');\n addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(!a)return;const href=a.getAttribute('href');if(!href||href.startsWith('#')||href.startsWith('blob:')||href.startsWith('data:'))return;event.preventDefault();navigate(href);});\n addEventListener('click',event=>{const label=event.target.closest?.('label');const input=label?.querySelector('input[type=\"file\"]');if(input&&jsonImportAllowed(input)){event.preventDefault();input.click();}},true);\n addEventListener('DOMContentLoaded',()=>{\n  document.documentElement.lang=initial.lang;\n  // Legacy modules render editors after load. Gate only mutation commands, preserving views and exports.\n  const readOnlySelectors={\n   rh:'button[onclick=\"newRhRecord()\"],button[onclick=\"triggerRhgridJsonImport()\"],button[onclick=\"resetRhgridDemo()\"],button[onclick=\"deleteRhRecord()\"],button[data-rh-action=\"publish\"],#rhgrid-form button[type=\"submit\"],#rhgrid-form input,#rhgrid-form select,#rhgrid-form textarea',\n   operations:'button[onclick=\"openNewProjectPopup()\"],button[onclick=\"copyTemplate()\"],button[onclick=\"addContactRow()\"],button[onclick=\"removeContactRow(this)\"],#new-project-form button[type=\"submit\"],#new-project-form input,#new-project-form select,#new-project-form textarea',\n   planning:'button[onclick=\"openModal()\"],button[onclick=\"saveEvent()\"],button[onclick=\"deleteEvent()\"],input[id^=\"ev-\"],select[id^=\"ev-\"],textarea[id^=\"ev-\"]',\n   bizdev:'button[onclick=\"openAdd()\"],button[onclick=\"crmOpenModal()\"],button[onclick=\"crmSaveNew()\"],button[onclick=\"crmConfDo()\"],button[onclick=\"savePanel()\"],button[onclick=\"saveNew()\"],button[onclick=\"doDel()\"],button[onclick=\"saveCC()\"],button[onclick=\"addPJ()\"],button[onclick=\"addTL()\"],[onclick*=\"cPrio(\"],[onclick*=\"cSvc(\"],[onclick*=\"cStat(\"],[onclick*=\"askDel(\"],[onclick^=\"editCC(\"],[onclick^=\"delCC(\"],[onclick^=\"delPJ(\"],[onclick^=\"delTL(\"],input[id^=\"cm-\"],select[id^=\"cm-\"],textarea[id^=\"cm-\"],input[id^=\"p-\"],select[id^=\"p-\"],textarea[id^=\"p-\"],input[id^=\"cf-\"],input[id^=\"nf-\"],select[id^=\"nf-\"],textarea[id^=\"nf-\"],input[id^=\"pj-\"],input[id^=\"tl-\"]'\n  };\n  const readOnlySelector=!initial.can_edit&&readOnlySelectors[initial.section];\n  function enforceModuleReadOnly(){if(!readOnlySelector)return;for(const el of document.querySelectorAll(readOnlySelector)){if('disabled' in el){if(!el.disabled)el.disabled=true;}else{el.setAttribute('aria-disabled','true');el.style.cursor='not-allowed';}}}\n  enforceModuleReadOnly();\n  if(readOnlySelector){\n   addEventListener('click',event=>{if(event.target.closest?.(readOnlySelector)){event.preventDefault();event.stopImmediatePropagation();}},true);\n   new MutationObserver(enforceModuleReadOnly).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','data-rh-action','onclick']});\n  }\n  if(!initial.can_edit&&initial.section==='juridique'){\n   const selector='button[onclick=\"resetAll()\"],[onclick^=\"toggle(\"]';\n   function enforceLegalReadOnly(){for(const el of document.querySelectorAll(selector)){if(el.tagName==='BUTTON'){if(!el.disabled)el.disabled=true;}else{el.setAttribute('role','button');el.setAttribute('aria-disabled','true');el.setAttribute('tabindex','-1');el.style.cursor='not-allowed';}}}\n   enforceLegalReadOnly();\n   addEventListener('click',event=>{if(event.target.closest?.(selector)){event.preventDefault();event.stopImmediatePropagation();}},true);\n   new MutationObserver(enforceLegalReadOnly).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','onclick']});\n  }\n  const layoutStyle=document.createElement('style');\n  layoutStyle.textContent='html,body{height:auto!important;min-height:0!important;overflow:visible!important;} .hero,.myeod-hero,.page-body{min-height:0!important;height:auto!important;} .myeod-app-frame{border:0!important;overflow:visible!important;} .myeod-app-frame #main{height:auto!important;overflow:visible!important;} .myeod-app-frame #list-col{overflow:visible!important;}';\n  document.head.append(layoutStyle);\n  let scheduled=false,lastHeight=0;\n  function scheduleHeight(){\n   if(scheduled)return;scheduled=true;\n   requestAnimationFrame(()=>{scheduled=false;const height=Math.ceil(Math.max(document.body.getBoundingClientRect().height,document.body.offsetHeight));if(height>0&&height!==lastHeight){lastHeight=height;parent.postMessage({myeodInternal:true,kind:'layout',height},'*');}});\n  }\n  new ResizeObserver(scheduleHeight).observe(document.body);\n  new MutationObserver(scheduleHeight).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});\n  addEventListener('resize',scheduleHeight);\n  document.addEventListener('load',scheduleHeight,true);\n  document.fonts?.ready.then(scheduleHeight);\n  scheduleHeight();\n\n  if(!initial.can_edit){for(const el of document.querySelectorAll('input,select,textarea'))el.disabled=true;}\n  for(const el of document.querySelectorAll('input[type=\"file\"]')){\n   const jsonImport=jsonImportAllowed(el);\n   el.disabled=!jsonImport;if(!jsonImport)el.title='Documents : utiliser le portail';\n  }\n  for(const el of document.querySelectorAll('button,a,[role=\"button\"]')){if(/upload|charger un fichier|téléverser/i.test(el.textContent+' '+el.getAttribute('onclick'))){el.removeAttribute('onclick');el.onclick=()=>navigate('documents.html');}}\n });\n})();\n";
const sections={admin:['Administration','Administration'],rh:['Ressources humaines','Human resources'],finance:['Finance','Finance'],juridique:['Juridique','Legal'],structure_admin:['Structuration','Administrative structure'],bizdev:['Développement commercial','Business development'],operations:['Opérations','Operations'],planning:['Planning','Planning']};
const catalogSections={admin:'admin',rh:'rh',finance:'finance',juridique:'juridique',structure_admin:'structure_admin',bizdev:'bizdev',operations:'operations',planning:'planning',projet_trion:'operations',projet_mozlng:'operations',projet_swissrenov:'operations',briefing_cadeler:'operations',Cadeler_CRM:'bizdev',CoreMarine_CRM:'bizdev',SBM_Offshore_CRM:'bizdev'};
let agencyPanel,agencyDispose;
let sb,role,user,opts={},rootPanel,frame,current,permissions=[],state={},queue=Promise.resolve(),timer,generation=0,grantBox,nativeToolbar;
const en=()=>document.documentElement.lang==='en',t=(fr,eng)=>en()?eng:fr;
function element(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function report(error){const message=error?.message||String(error);if(rootPanel?.querySelector('[data-internal-message]'))rootPanel.querySelector('[data-internal-message]').textContent=message;opts.error?.(Error(message));}
function clear(){agencyDispose?.();agencyDispose=null;agencyPanel?.remove();agencyPanel=null;generation++;grantBox?.remove();grantBox=null;clearInterval(timer);frame?.remove();frame=null;current=null;rootPanel?.remove();rootPanel=null;permissions=[];sb=null;state={};}
function restore(){
 agencyDispose?.();agencyDispose=null;agencyPanel?.remove();agencyPanel=null;
 frame?.closest('.internal-view')?.remove();frame=null;current=null;state={};nativeToolbar?.remove();nativeToolbar=null;
 for(const id of ['it-workspace','projects-workspace']){const panel=document.getElementById(id);if(panel)panel.hidden=true;}
 if(rootPanel)delete rootPanel.dataset.sectionOpen;
 for(const child of rootPanel?.children||[])if(child.dataset.hubHome!==undefined)child.hidden=false;
 const h=document.querySelector('.myeod-header-content-label');const active=opts.accessView?document.getElementById('connected-role')?.textContent?.replace(/^"|"$/g,''):null; if(h)h.textContent=active?(en()?active+' portal':'Espace '+active):role==='fondateur'?t('Espace Fondateur','Founder portal'):t('Espace Collaborateur','Collaborator portal');
}
function clearMessage(){const message=rootPanel?.querySelector('[data-internal-message]');if(message)message.textContent='';opts.clearError?.();}
function hideHome(){rootPanel.dataset.sectionOpen='';for(const child of rootPanel.children)if(child.dataset.hubHome!==undefined)child.hidden=true;}
function enabled(key){const granted=s=>permissions.some(p=>p.section===s);return key==='agency'?user?.id==='5e101491-fc2c-4081-9fdd-a513cb7e7404':key==='it'?(opts.accessView?opts.accessView.readGlobalAccounts||opts.accessView.globalAccounts:role==='fondateur'):key==='projects'?true:key==='admin'?['admin','finance','juridique','structure_admin'].some(granted):key==='operations'?granted('operations')||granted('planning'):granted(key);}
function showNative(key){
 if(key==='it'&&!enabled('it'))throw Error('Access denied');
 restore();clearMessage();hideHome();const panel=document.getElementById(key==='it'?'it-workspace':'projects-workspace');if(!panel)throw Error('Section unavailable');panel.hidden=false;
 current={kind:'native',section:key};
 const h=document.querySelector('.myeod-header-content-label');if(h)h.textContent=key==='it'?'IT':t('Projets','Projects');panel.scrollIntoView({behavior:'smooth'});
}
async function rpc(name,args){const r=await sb.rpc(name,args);if(r.error)throw r.error;return r.data;}
async function allowed(){return await rpc('myeod_internal_sections',{});}
function action(label,fn){const b=element('button',label,'internal-card');b.type='button';b.onclick=()=>Promise.resolve(fn()).catch(report);return b;}
async function load(client,config){
 restore();clear();sb=client;opts=config||{};role=config.role;user=config.user;
 if(!['fondateur','collaborateur'].includes(role)||(opts.accessView&&!['administration','collaborator'].includes(opts.accessView.mode)))return;
 const rev=generation;permissions=await allowed();if(rev!==generation)return;
 rootPanel=element('section',null,'internal-navigation');rootPanel.id='internal-navigation';
 const heading=element('h2',t('Choisir une rubrique','Choose a section'));heading.dataset.hubHome='';rootPanel.append(heading);
 const grid=element('div',null,'internal-grid');grid.dataset.hubHome='';
 for(const [label,key] of [['Admin','admin'],['RH','rh'],['IT','it'],[t('Opérations','Operations'),'operations'],[t('Projets','Projects'),'projects'],['BizDev','bizdev']]){
  const button=action(label,()=>navigate(key+'.html'));button.dataset.hubRoute=key;button.disabled=!enabled(key);if(button.disabled)button.title=t('Accès non attribué','Access not assigned');grid.append(button);
 }
 const scopeNotice=element('p',t('Périmètre actuel : les modules Survey avancés et les fiches opérationnelles complètes restent reportés. Les fiches historiques sont consultables ; leur contenu doit être vérifié avant utilisation. Les services d’IA externe ne sont pas disponibles dans ce portail.','Current scope: advanced Survey modules and complete operational project sheets remain deferred. Historical sheets can be consulted; their content must be checked before use. External AI services are not available in this portal.'),'internal-scope-notice');scopeNotice.dataset.hubHome='';rootPanel.append(scopeNotice);
 if(await root.MyEODAgencyLibrary?.allowed(sb,user)){
  if(rev!==generation)return;
  const agency=action('My Agency',openAgency);agency.dataset.hubRoute='agency';grid.append(agency);
 }
 rootPanel.append(grid);const message=element('p');message.dataset.internalMessage='';message.setAttribute('role','status');rootPanel.append(message);
 document.getElementById('workspace').prepend(rootPanel);
 if(opts.accessView?opts.accessView.globalAccounts:role==='fondateur')await grantsPanel();
 timer=setInterval(async()=>{try{
  const latest=await allowed();if(rev!==generation)return;
  const profile=await sb.from('profiles').select('role,must_change_password').eq('id',user.id).single();
  if(rev!==generation)return;
  if(profile.error||profile.data?.role!==(opts.profileRole||role)||profile.data?.must_change_password||(opts.verifyContext&&!(await opts.verifyContext()))){if(rev!==generation)return;restore();opts.revoke?.();return;}
  if(current&&((current.kind!=='native'&&!latest.some(p=>p.section===current.section))||(current.section==='it'&&!latest.length))){restore();report(Error(t('Accès à la rubrique révoqué.','Section access revoked.')));}
  permissions=latest;for(const button of grid.children)button.disabled=!enabled(button.dataset.hubRoute);
 }catch(e){restore();report(e);}},15000);
}
async function grantsPanel(){
 const box=element('details'),summary=element('summary',t('Autorisations des rubriques internes','Internal section permissions'));box.append(summary);
 const warning=element('p',t('Chaque autorisation ouvre toute la rubrique, y compris ses données internes. IT et la gestion des comptes restent réservés au fondateur.','Each permission opens the complete section and its internal data. IT and account management remain founder-only.'));box.append(warning);
 const profiles=await sb.from('profiles').select('id,email,full_name,role').eq('role','collaborateur');if(profiles.error)throw profiles.error;
 const select=element('select');select.setAttribute('aria-label',t('Collaborateur','Collaborator'));select.append(new Option(t('Choisir un collaborateur','Choose a collaborator'),''));for(const p of profiles.data)select.append(new Option(p.full_name||p.email||p.id,p.id));box.append(select);
 const choices=element('fieldset');choices.append(element('legend',t('Accès et modification','Access and editing')));box.append(choices);
 const controls={};for(const [key,names] of Object.entries(sections)){const line=element('div');const access=element('input'),edit=element('input');access.type=edit.type='checkbox';const accessLabel=element('label'),editLabel=element('label');accessLabel.append(access,document.createTextNode(' '+names[en()?1:0]));editLabel.append(edit,document.createTextNode(' '+t('Modifier','Edit')));line.append(accessLabel,editLabel);choices.append(line);controls[key]={access,edit};access.onchange=()=>{edit.disabled=!access.checked;if(!access.checked)edit.checked=false;};}
 let expected=[],selected='',loading=false;
 async function choose(){selected=select.value;choices.disabled=true;loading=true;save.disabled=true;try{const r=await sb.from('portal_internal_grants').select('section,can_edit').eq('user_id',selected).order('section');if(r.error)throw r.error;expected=r.data;for(const [key,c] of Object.entries(controls)){const grant=expected.find(g=>g.section===key);c.access.checked=!!grant;c.edit.checked=!!grant?.can_edit;c.edit.disabled=!grant;}choices.disabled=!selected;save.disabled=!selected;}catch(e){report(e);}finally{loading=false;}}
 const save=action(t('Enregistrer les autorisations','Save permissions'),async()=>{if(loading||!selected)return;save.disabled=true;choices.disabled=true;const desired=Object.entries(controls).filter(([,c])=>c.access.checked).map(([section,c])=>({section,can_edit:c.edit.checked})).sort((a,b)=>a.section.localeCompare(b.section));try{await rpc('myeod_internal_set_grants',{target:selected,expected,desired});expected=desired;rootPanel.querySelector('[data-internal-message]').textContent=t('Autorisations enregistrées et journalisées.','Permissions saved and audited.');}finally{save.disabled=false;choices.disabled=false;}});save.disabled=true;box.append(save);select.onchange=choose;choices.disabled=true;grantBox=box;document.getElementById('it-workspace').append(box);
}
async function openAgency(){
 const rev=generation;
 if(!await root.MyEODAgencyLibrary?.allowed(sb,user)||rev!==generation)throw Error(t('Accès réservé à Régis.','Access restricted to Régis.'));
 restore();clearMessage();hideHome();current={kind:'native',section:'agency'};
 agencyPanel=element('section');rootPanel.append(agencyPanel);const panel=agencyPanel;
 const dispose=await root.MyEODAgencyLibrary.mount({client:sb,user,container:panel,error:report});
 if(rev!==generation||agencyPanel!==panel){dispose();return;}agencyDispose=dispose;
 const header=document.querySelector('.myeod-header-content-label');if(header)header.textContent='My Agency';panel.scrollIntoView({behavior:'smooth'});
}
async function navigate(url){
 const parsed=new URL(url,location.href),name=parsed.pathname.split('/').pop().replace(/\.html$/,'');
 if(name==='agency'){await openAgency();return;}
 if(name==='it'){showNative('it');return;}
 if(name==='documents'||name==='projects'){showNative('projects');return;}
 if(/^acces-collaborateurs(?:-en)?$/.test(name)){restore();return;}
 if(name==='admin'&&!permissions.some(p=>p.section==='admin')){await adminMenu();return;}
 if(name==='operations'&&!permissions.some(p=>p.section==='operations')){await open('planning');return;}
 if(Object.hasOwn(catalogSections,name)){await open(name);return;}
 if(parsed.origin===location.origin&&/^(index(?:-en)?|services(?:-en)?|legal(?:-en)?)$/.test(name)){location.href=parsed.href;return;}
 if(parsed.hostname.endsWith('.supabase.co')){showNative('projects');return;}
 if(['https:','http:','mailto:','tel:'].includes(parsed.protocol)&&parsed.origin!==location.origin){window.open(parsed.href,'_blank','noopener,noreferrer');return;}
 throw Error(t('Destination interne non disponible.','Internal destination unavailable.'));
}
async function adminMenu(){
 restore();hideHome();current={kind:'native',section:'admin'};nativeToolbar=element('nav',null,'internal-section-links');for(const section of ['finance','juridique','structure_admin'])if(permissions.some(p=>p.section===section))nativeToolbar.append(action(sections[section][en()?1:0],()=>open(section)));rootPanel.append(nativeToolbar);
 const h=document.querySelector('.myeod-header-content-label');if(h)h.textContent='Admin';
}
async function open(page){
 const rev=generation;const r=await sb.functions.invoke('internal-pages',{body:{page}});if(r.error||r.data?.error)throw r.error||Error(r.data.error);if(rev!==generation)return;
 restore();clearMessage();hideHome();current=r.data;state=Object.fromEntries(current.state.map(row=>[row.key,{value:row.value,stamp:row.updated_at}]));
 const panel=element('div',null,'internal-view'),bar=element('nav',null,'internal-section-links');if(['operations','planning'].includes(current.section)){for(const target of ['operations','planning'])if(target!==current.section&&permissions.some(p=>p.section===target))bar.append(action(sections[target][en()?1:0],()=>open(target)));}if(bar.children.length)panel.append(bar);
 const iframe=element('iframe');iframe.title=sections[current.section][en()?1:0];iframe.setAttribute('sandbox','allow-scripts allow-downloads allow-forms');iframe.setAttribute('referrerpolicy','no-referrer');panel.append(iframe);rootPanel.append(panel);frame=iframe;
 const h=document.querySelector('.myeod-header-content-label');if(h)h.textContent=sections[current.section][en()?1:0];
 const config={section:current.section,user:{id:user.id,email:user.email},values:Object.fromEntries(Object.entries(state).map(([key,row])=>[key,row.value])),can_edit:current.can_edit,lang:en()?'en':'fr'};
 const bootstrap=FRAME_BOOTSTRAP;if(rev!==generation||frame!==iframe)return;
 const base=location.href.slice(0,location.href.lastIndexOf('/')+1);
 const csp="default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'unsafe-inline' https://myexpertondemand.com "+(location.origin==='null'?'':location.origin)+"; font-src https://myexpertondemand.com data: "+(location.origin==='null'?'':location.origin)+"; img-src data: blob: https:; connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none';";
 const escape=s=>s.replace(/</g,'\\u003c');
 iframe.srcdoc=current.html.replace('<head>','<head><base href="'+base+'"><meta http-equiv="Content-Security-Policy" content="'+csp+'"><script>window.MyEODFrameInitial='+escape(JSON.stringify(config))+';<\/script><script>'+bootstrap.replace(/<\/script/gi,'<\\/script')+'<\/script>');
 iframe.scrollIntoView({behavior:'smooth'});
}
function rowFromLegacy(d){return {id:d.id,cat:d.cat,prio:d.prio,name:d.name,nameEn:d.name_en,icon:d.icon,desc:d.doc_desc,owner:d.owner,statusFr:d.status_fr,statusEn:d.status_en,refFr:d.ref_fr,refEn:d.ref_en,notes:d.notes};}
function rowToLegacy(row){const d=JSON.parse(row.payload);const uncategorized=!['commercial','admin','financier','rh','suisse','operationnel'].includes(d.cat);return {id:row.doc_id,cat:d.cat,prio:d.prio,name:d.name||d.titre,name_en:d.nameEn,icon:d.icon,doc_desc:d.desc||d.contenu,owner:d.owner,status_fr:d.statusFr,status_en:d.statusEn,ref_fr:d.refFr,ref_en:d.refEn,notes:d.notes,updated_at:row.updated_at,collab_revision:row.collab_revision,...(uncategorized?{legacy_payload:d}:{})};}
// A frame keeps its original revisions until a confirmed mutation or reopening.
// Background reads must not silently authorise overwriting another user's work.
const querySnapshots=new WeakMap();
async function query(q){
 const active=current,client=sb;
 const baseline=new Map(active?querySnapshots.get(active):[]);
 const tables={bizdev:['crm_clients'],structure_admin:['admin_docs'],finance:['checklist_states'],juridique:['checklist_states']};
 if(!active||!tables[active.section]?.includes(q.table))throw Error('Use the portal document and access management.');
 const ensureActive=()=>{if(current!==active||sb!==client)throw Error('Page closed');};
 const live=(await allowed()).find(p=>p.section===active.section);ensureActive();
 if(!live)throw Error('Access denied');
 if(!['GET','POST','PATCH','DELETE','RESET'].includes(q.method))throw Error('Invalid operation');
 if(q.method!=='GET'&&!live.can_edit)throw Error('Read only');
 const session=await client.auth.getSession();ensureActive();
 if(session.error||!session.data?.session)throw Error('Sign in required');
 let snapshot=querySnapshots.get(active);if(!snapshot){snapshot=new Map();querySnapshots.set(active,snapshot);}
 const key=q.table==='admin_docs'?'doc_id':'id',params={...q.params};
 if(q.table==='checklist_states')params.id='eq.myeod_'+active.section;
 if(q.table==='admin_docs'){
  if(params.id){params.doc_id=params.id;delete params.id;}
  params.select='doc_id,payload,updated_at,collab_revision';
  if(params.order)params.order=params.order.replace(/^id\./,'doc_id.');
 }
 const cacheKey=id=>q.table+':'+String(id);
 const revision=row=>{if(!Number.isSafeInteger(row.collab_revision)||row.collab_revision<1)throw Error('Invalid server revision');return row.collab_revision;};
 const output=rows=>q.table==='admin_docs'?rows.map(rowToLegacy):rows;
 if(q.method==='GET'){
  if(q.table!=='admin_docs'&&params.select&&params.select!=='*')params.select+=','+key+',collab_revision';
  const response=await fetch(client.supabaseUrl+'/rest/v1/'+q.table+'?'+new URLSearchParams(params),{method:'GET',headers:{apikey:client.supabaseKey,Authorization:'Bearer '+session.data.session.access_token}});
  const payload=await response.text(),data=payload?JSON.parse(payload):[];ensureActive();
  if(!response.ok)return {data:null,error:{message:data?.message||'Read denied',code:data?.code}};
  if(!Array.isArray(data))throw Error('Invalid read confirmation');
  for(const row of data){revision(row);if(row[key]==null)throw Error('Missing record identifier');if(!snapshot.has(cacheKey(row[key])))snapshot.set(cacheKey(row[key]),{...row});}
  return {data:output(data),error:null};
 }
 if(q.method==='RESET'){
  if(q.table!=='admin_docs'||active.section!=='structure_admin')throw Error('Invalid reset section');
  const rows=q.body;if(!Array.isArray(rows)||!rows.length||rows.length>500)throw Error('Invalid reset records');
  const ids=new Set(),desired=rows.map(row=>{
   if(!row||typeof row!=='object'||row.id==null||String(row.id)===''||ids.has(String(row.id)))throw Error('Invalid reset identifier');
   ids.add(String(row.id));return {doc_id:row.id,payload:JSON.stringify(rowFromLegacy(row))};
  });
  const expected=[...baseline.entries()].filter(([k])=>k.startsWith('admin_docs:')).map(([,row])=>({id:String(row.doc_id),revision:revision(row)}));
  if(expected.length>500)throw Error('Too many records');ensureActive();
  const result=await client.rpc('myeod_structure_reset',{expected,desired});ensureActive();
  if(result.error)return {data:null,error:{message:result.error.message,code:result.error.code}};
  const data=result.data;if(!Array.isArray(data)||data.length!==desired.length)throw Error('Invalid reset confirmation; reopen this section');
  const confirmed=new Map();
  for(const row of data){const id=String(row.doc_id),old=baseline.get(cacheKey(id));
   if(!ids.has(id)||confirmed.has(id)||(old?revision(row)!==revision(old)+1:revision(row)<1))throw Error('Invalid reset revision; reopen this section');
   const parsed=rowToLegacy(row);if(String(parsed.id)!==id)throw Error('Invalid reset payload');confirmed.set(id,{...row});
  }
  snapshot.clear();for(const [id,row] of confirmed)snapshot.set(cacheKey(id),row);
  return {data:output(data),error:null};
 }
 const operation=q.method==='DELETE'?'delete':q.method==='PATCH'?'update':q.upsert?(q.ignoreDuplicates?'seed':'upsert'):'insert';
 let rows;
 if(q.method==='POST'){
  rows=Array.isArray(q.body)?q.body:[q.body];
  if(!rows.length||rows.some(r=>!r||typeof r!=='object'||Array.isArray(r)))throw Error('Invalid records');
 }else{
  const filters=Object.entries(params).filter(([k])=>!['select','order','limit','on_conflict'].includes(k));
  if(filters.length!==1||filters[0][0]!==key||!/^eq\./.test(String(filters[0][1])))throw Error('Select one record before changing it');
  const id=String(filters[0][1]).slice(3),known=baseline.get(cacheKey(id));
  if(!known)throw Error('Reload this section before changing the record');
  rows=[{...(q.body||{}),[key]:known[key]}];
 }
 const ids=new Set(),changes=rows.map(row=>{
  let values={...row};
  if(q.table==='crm_clients'&&operation==='insert'&&values.id==null)values.id=crypto.randomUUID();
  if(q.table==='admin_docs'){
   const id=row.id??row.doc_id,known=baseline.get(cacheKey(id));
   const legacy=q.method==='PATCH'&&known?{...rowToLegacy(known),...row,id}:row;
   values={doc_id:id,payload:JSON.stringify(rowFromLegacy(legacy)),updated_at:new Date().toISOString()};
  }
  if(q.table==='checklist_states'){
   const own='myeod_'+active.section;if(values.id!=null&&values.id!==own)throw Error('Invalid checklist identifier');values.id=own;
  }
  const id=values[key];if(id==null||String(id)===''||ids.has(String(id)))throw Error('Invalid or duplicate record identifier');ids.add(String(id));
  const known=baseline.get(cacheKey(id));
  const expected=operation==='insert'||operation==='seed'?0:known?revision(known):0;
  if(operation==='update'||operation==='delete'){if(!known)throw Error('Reload this section before changing the record');}
  delete values.collab_revision;
  return {id:String(id),expected,values:operation==='delete'?{}:values};
 });
 if(changes.length>500)throw Error('Too many records');ensureActive();
 const result=await client.rpc('myeod_collab_mutate',{target_table:q.table,operation,changes});ensureActive();
 if(result.error)return {data:null,error:{message:result.error.message,code:result.error.code}};
 const data=result.data;
 if(!Array.isArray(data)||data.length!==changes.length)throw Error('Invalid mutation confirmation; reopen this section');
 const confirmed=new Map();
 for(const row of data){const id=String(row[key]),change=changes.find(c=>c.id===id);if(!change||confirmed.has(id))throw Error('Invalid mutation identifier');
  const actual=revision(row),expected=operation==='delete'?change.expected:operation==='seed'?actual:change.expected+1;
  if((change.expected===0&&operation!=='delete'&&operation!=='seed')?actual<1:actual!==expected)throw Error('Invalid mutation revision; reopen this section');confirmed.set(id,row);
 }
 for(const [id,row] of confirmed){if(operation==='delete')snapshot.delete(cacheKey(id));else if(operation!=='seed'||!snapshot.has(cacheKey(id)))snapshot.set(cacheKey(id),{...row});}
 return {data:output(data),error:null};
}
addEventListener('message',async event=>{
 if(!frame||event.source!==frame.contentWindow||!event.data?.myeodInternal)return;
 const target=event.source,msg=event.data,active=current;
 if(msg.kind==='layout'){if(typeof msg.height==='number'&&Number.isFinite(msg.height)&&msg.height>0&&msg.height<=1000000){frame.dataset.normalHeight=String(Math.ceil(msg.height+8));if(frame.dataset.modalOpen!=='true')frame.setAttribute('style','height:'+frame.dataset.normalHeight+'px');}return;}
 try{
  let value;
  if(msg.kind==='modal_layout'){
   if(active?.section!=='bizdev'||typeof msg.open!=='boolean'||current!==active)throw Error('Modal unavailable');
   const container=frame.parentElement;if(!container?.classList.contains('internal-view'))throw Error('Modal unavailable');
   if(msg.open){frame.dataset.modalOpen='true';container.style.cssText='position:fixed;inset:8px;z-index:1000;background:transparent;margin:0;padding:0;';frame.style.cssText='width:100%;height:calc(100dvh - 16px);border:0;';}
   else{delete frame.dataset.modalOpen;container.removeAttribute('style');frame.style.cssText='height:'+(frame.dataset.normalHeight||'600')+'px';}
   value=true;
  }
  else if(msg.kind==='navigate')value=await navigate(msg.url);
  else if(msg.kind==='query')value=await query(msg);
  else if(msg.kind==='request')throw Error(t('Appel externe indisponible. Utiliser le portail.','External call unavailable. Use the portal.'));
  else if(msg.kind==='choose_json'){
   if(!active?.can_edit||!['rh','planning','bizdev'].includes(active.section))throw Error('Import unavailable');
   const selected=await new Promise((resolve,reject)=>{const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;document.body.append(input);input.oncancel=()=>{input.remove();resolve(null);};input.onchange=()=>{const file=input.files?.[0];input.remove();if(!file){resolve(null);return;}if(file.size>5*1024*1024||!file.name.toLowerCase().endsWith('.json')){reject(Error('Invalid JSON file'));return;}file.text().then(content=>resolve({filename:file.name,content}),reject);};input.click();});
   if(current!==active||!(await allowed()).some(p=>p.section===active.section&&p.can_edit))throw Error('Import unavailable');value=selected;
  }
  else if(msg.kind==='download_json'){
   if(!active||!['rh','planning','bizdev','structure_admin'].includes(active.section)||!(await allowed()).some(p=>p.section===active.section))throw Error('Export unavailable');
   if(current!==active)throw Error('Page closed');
   if(typeof msg.filename!=='string'||msg.filename.length>128||!/^[-a-zA-Z0-9_.]+\.json$/.test(msg.filename)||typeof msg.content!=='string'||new TextEncoder().encode(msg.content).length>5*1024*1024)throw Error('Invalid JSON export');
   const parsed=JSON.parse(msg.content);if(!parsed||typeof parsed!=='object')throw Error('Invalid JSON export');
   const blob=new Blob([msg.content],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=msg.filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);value=true;
  }
  else if(msg.kind==='state'){
   if(!(await allowed()).some(p=>p.section===active.section&&p.can_edit))throw Error(t('Cette rubrique est en consultation.','This section is read only.'));
   if(typeof msg.key!=='string'||msg.key.length>150||typeof msg.value!=='string')throw Error('Invalid state');
   const save=async()=>{if(current!==active)throw Error('Page closed');const stamp=await rpc('myeod_internal_save_state',{target:active.section,name:msg.key,content:msg.value,expected:state[msg.key]?.stamp||null});state[msg.key]={value:msg.value,stamp};rootPanel.querySelector('[data-internal-message]').textContent=t('Modifications enregistrées.','Changes saved.');return true;};const work=queue.then(save,save);queue=work.catch(()=>{});value=await work;
  } else return;
  target.postMessage({myeodInternal:true,id:msg.id,value},'*');
 }catch(e){target.postMessage({myeodInternal:true,id:msg.id,error:e.message||String(e),code:e.code},'*');report(e);}
});
root.MyEODInternalPages={load,home:restore,route:()=>current?(current.kind==='native'?current.section:current.page):null,resume:key=>navigate(key+'.html'),clear:()=>{restore();clear();},setLanguage:()=>{if(sb){const client=sb;load(client,{...opts,role,user}).catch(report);}}};
})(window);
