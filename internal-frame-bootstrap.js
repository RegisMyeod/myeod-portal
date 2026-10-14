/* Executed in an opaque sandbox. Authentication stays in the parent portal. */
(function(){
 const initial=window.MyEODFrameInitial, pending=new Map();let counter=0;
 function call(kind,data){return new Promise((resolve,reject)=>{const id=++counter;pending.set(id,{resolve,reject});parent.postMessage({myeodInternal:true,id,kind,...data},'*');setTimeout(()=>{if(pending.delete(id))reject(Error('No response'));},kind==='choose_json'?120000:15000);});}
 addEventListener('message',event=>{if(event.source!==parent||!event.data?.myeodInternal)return;const p=pending.get(event.data.id);if(p){pending.delete(event.data.id);event.data.error?p.reject(Object.assign(Error(event.data.error),{code:event.data.code})):p.resolve(event.data.value);}});
 function jsonImportAllowed(el){return initial.can_edit&&['rh','planning','bizdev'].includes(initial.section)&&(el.getAttribute('accept')||'').split(',').map(x=>x.trim()).includes('.json')&&/^(?:handleRhgridJsonImport|importData)\(event\);?$/.test(el.getAttribute('onchange')||'');}
 const inputClick=HTMLInputElement.prototype.click;
 HTMLInputElement.prototype.click=function(){if(this.type==='file'&&jsonImportAllowed(this)){const input=this;call('choose_json',{}).then(file=>{if(!file)return;const transfer=new DataTransfer();transfer.items.add(new File([file.content],file.filename,{type:'application/json'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));}).catch(e=>alert(e.message));return;}return inputClick.call(this);};
 const exportBlobs=new Map(),createBlobURL=URL.createObjectURL.bind(URL),revokeBlobURL=URL.revokeObjectURL.bind(URL),anchorClick=HTMLAnchorElement.prototype.click;
 URL.createObjectURL=blob=>{const url=createBlobURL(blob);if(blob instanceof Blob&&/^application\/json(?:;|$)/i.test(blob.type))exportBlobs.set(url,blob);return url;};
 URL.revokeObjectURL=url=>{exportBlobs.delete(url);revokeBlobURL(url);};
 HTMLAnchorElement.prototype.click=function(){const blob=exportBlobs.get(this.href);if(this.download&&blob){const filename=this.download;blob.text().then(content=>call('download_json',{filename,content})).catch(e=>alert(e.message));return;}return anchorClick.call(this);};
 window.alert=message=>{
  const dialog=document.createElement('dialog'),text=document.createElement('p'),button=document.createElement('button');dialog.setAttribute('role','alertdialog');dialog.setAttribute('aria-label',initial.lang==='en'?'Module message':'Message du module');text.textContent=String(message);button.type='button';button.textContent=initial.lang==='en'?'Close':'Fermer';button.onclick=()=>{dialog.close();dialog.remove();};dialog.addEventListener('cancel',()=>dialog.remove());dialog.append(text,button);document.body.append(dialog);dialog.showModal();button.focus();
 };
 const values={...initial.values};
 const storage={getItem:key=>values[key]??null,setItem:(key,value)=>{values[key]=String(value);call('state',{key,value:String(value)}).catch(e=>alert(e.message));},removeItem:key=>storage.setItem(key,''),clear:()=>{for(const key of Object.keys(values))storage.removeItem(key);}};
 window.MyEODFrameSaveState=async(key,value)=>{const text=String(value);await call('state',{key,value:text});values[key]=text;return true;};
 window.MyEODFrameModal=open=>call('modal_layout',{open:open===true});
 Object.defineProperty(window,'localStorage',{value:storage});Object.defineProperty(window,'sessionStorage',{value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});
 window.fetch=async(input,options={})=>{
  const url=typeof input==='string'?input:input.url;
  const result=await call('request',{url,method:options.method||'GET',body:options.body||null});
  return new Response(result.body,{status:result.status,headers:result.headers});
 };
 const chain={on(){return this;},subscribe(){return this;},unsubscribe(){}};
 function from(table){
  const q={table,method:'GET',params:{},body:null,one:false};
  const b={select(columns='*'){q.params.select=columns;return b;},eq(k,v){q.params[k]='eq.'+v;return b;},neq(k,v){q.params[k]='neq.'+v;return b;},order(k,o={}){q.params.order=k+(o.ascending===false?'.desc':'.asc');return b;},limit(n){q.params.limit=n;return b;},single(){q.one=true;return b;},maybeSingle(){q.one=true;return b;},insert(v){q.method='POST';q.body=v;return b;},upsert(v,o={}){q.method='POST';q.body=v;q.params.on_conflict=o.onConflict||'';q.upsert=true;q.ignoreDuplicates=o.ignoreDuplicates;return b;},update(v){q.method='PATCH';q.body=v;return b;},delete(){q.method='DELETE';return b;},then(resolve,reject){return call('query',q).then(r=>{if(q.one&&Array.isArray(r.data)){r.data=r.data[0]??null;if(!r.data)r.error={message:'Record unavailable'};}return r;}).catch(e=>({data:null,error:{message:e.message,code:e.code}})).then(resolve,reject);}};return b;
 }
 const session={user:initial.user};
 const client={from,rpc:async(name,args)=>{if(name!=='myeod_structure_reset')return {data:null,error:{message:'RPC unavailable'}};try{return await call('query',{table:'admin_docs',method:'RESET',params:{},body:args?.desired});}catch(e){return {data:null,error:{message:e.message,code:e.code}};}},auth:{getSession:async()=>({data:{session},error:null}),getUser:async()=>({data:{user:initial.user},error:null}),onAuthStateChange:fn=>{queueMicrotask(()=>fn('SIGNED_IN',session));return {data:{subscription:{unsubscribe(){}}}};},setSession:async()=>({data:{session},error:null})},channel:()=>chain,removeChannel(){},removeAllChannels(){},storage:{from:()=>({upload:async()=>({error:{message:'Use Documents in the portal'}}),getPublicUrl:()=>({data:{publicUrl:''}})})}};
 window.supabase={createClient:()=>client};window.MyEODLegacyClient=()=>client;window.__supabase__={createClient:()=>client};
 function navigate(url){call('navigate',{url:String(url)}).catch(e=>alert(e.message));}
 window.open=(url)=>{navigate(url);return null;};window.close=()=>navigate('acces-collaborateurs.html');
 addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(!a)return;const href=a.getAttribute('href');if(!href||href.startsWith('#')||href.startsWith('blob:')||href.startsWith('data:'))return;event.preventDefault();navigate(href);});
 addEventListener('click',event=>{const label=event.target.closest?.('label');const input=label?.querySelector('input[type="file"]');if(input&&jsonImportAllowed(input)){event.preventDefault();input.click();}},true);
 addEventListener('DOMContentLoaded',()=>{
  document.documentElement.lang=initial.lang;
  // Legacy modules render editors after load. Gate only mutation commands, preserving views and exports.
  const readOnlySelectors={
   rh:'button[onclick="newRhRecord()"],button[onclick="triggerRhgridJsonImport()"],button[onclick="resetRhgridDemo()"],button[onclick="deleteRhRecord()"],button[data-rh-action="publish"],#rhgrid-form button[type="submit"],#rhgrid-form input,#rhgrid-form select,#rhgrid-form textarea',
   operations:'button[onclick="openNewProjectPopup()"],button[onclick="copyTemplate()"],button[onclick="addContactRow()"],button[onclick="removeContactRow(this)"],#new-project-form button[type="submit"],#new-project-form input,#new-project-form select,#new-project-form textarea',
   planning:'button[onclick="openModal()"],button[onclick="saveEvent()"],button[onclick="deleteEvent()"],input[id^="ev-"],select[id^="ev-"],textarea[id^="ev-"]',
   bizdev:'button[onclick="openAdd()"],button[onclick="crmOpenModal()"],button[onclick="crmSaveNew()"],button[onclick="crmConfDo()"],button[onclick="savePanel()"],button[onclick="saveNew()"],button[onclick="doDel()"],button[onclick="saveCC()"],button[onclick="addPJ()"],button[onclick="addTL()"],[onclick*="cPrio("],[onclick*="cSvc("],[onclick*="cStat("],[onclick*="askDel("],[onclick^="editCC("],[onclick^="delCC("],[onclick^="delPJ("],[onclick^="delTL("],input[id^="cm-"],select[id^="cm-"],textarea[id^="cm-"],input[id^="p-"],select[id^="p-"],textarea[id^="p-"],input[id^="cf-"],input[id^="nf-"],select[id^="nf-"],textarea[id^="nf-"],input[id^="pj-"],input[id^="tl-"]'
  };
  const readOnlySelector=!initial.can_edit&&readOnlySelectors[initial.section];
  function enforceModuleReadOnly(){if(!readOnlySelector)return;for(const el of document.querySelectorAll(readOnlySelector)){if('disabled' in el){if(!el.disabled)el.disabled=true;}else{el.setAttribute('aria-disabled','true');el.style.cursor='not-allowed';}}}
  enforceModuleReadOnly();
  if(readOnlySelector){
   addEventListener('click',event=>{if(event.target.closest?.(readOnlySelector)){event.preventDefault();event.stopImmediatePropagation();}},true);
   new MutationObserver(enforceModuleReadOnly).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','data-rh-action','onclick']});
  }
  if(!initial.can_edit&&initial.section==='juridique'){
   const selector='button[onclick="resetAll()"],[onclick^="toggle("]';
   function enforceLegalReadOnly(){for(const el of document.querySelectorAll(selector)){if(el.tagName==='BUTTON'){if(!el.disabled)el.disabled=true;}else{el.setAttribute('role','button');el.setAttribute('aria-disabled','true');el.setAttribute('tabindex','-1');el.style.cursor='not-allowed';}}}
   enforceLegalReadOnly();
   addEventListener('click',event=>{if(event.target.closest?.(selector)){event.preventDefault();event.stopImmediatePropagation();}},true);
   new MutationObserver(enforceLegalReadOnly).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','onclick']});
  }
  const layoutStyle=document.createElement('style');
  layoutStyle.textContent='html,body{height:auto!important;min-height:0!important;overflow:visible!important;} .hero,.myeod-hero,.page-body{min-height:0!important;height:auto!important;} .myeod-app-frame{border:0!important;overflow:visible!important;} .myeod-app-frame #main{height:auto!important;overflow:visible!important;} .myeod-app-frame #list-col{overflow:visible!important;}';
  document.head.append(layoutStyle);
  let scheduled=false,lastHeight=0;
  function scheduleHeight(){
   if(scheduled)return;scheduled=true;
   requestAnimationFrame(()=>{scheduled=false;const height=Math.ceil(Math.max(document.body.getBoundingClientRect().height,document.body.offsetHeight));if(height>0&&height!==lastHeight){lastHeight=height;parent.postMessage({myeodInternal:true,kind:'layout',height},'*');}});
  }
  new ResizeObserver(scheduleHeight).observe(document.body);
  new MutationObserver(scheduleHeight).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
  addEventListener('resize',scheduleHeight);
  document.addEventListener('load',scheduleHeight,true);
  document.fonts?.ready.then(scheduleHeight);
  scheduleHeight();

  if(!initial.can_edit){for(const el of document.querySelectorAll('input,select,textarea'))el.disabled=true;}
  for(const el of document.querySelectorAll('input[type="file"]')){
   const jsonImport=jsonImportAllowed(el);
   el.disabled=!jsonImport;if(!jsonImport)el.title='Documents : utiliser le portail';
  }
  for(const el of document.querySelectorAll('button,a,[role="button"]')){if(/upload|charger un fichier|téléverser/i.test(el.textContent+' '+el.getAttribute('onclick'))){el.removeAttribute('onclick');el.onclick=()=>navigate('documents.html');}}
 });
})();
