(function(root){'use strict';
const BUCKET='myeod-agency-library';
const regis='5e101491-fc2c-4081-9fdd-a513cb7e7404';
const isEnglish=()=>document.documentElement.lang==='en';
const t=(fr,en)=>isEnglish()?en:fr;
function element(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
async function allowed(client,user){
 if(user?.id!==regis)return false;
 const result=await client.rpc('myeod_agency_library_access');return !result.error&&result.data===true;
}
async function mount({client,user,container,error=()=>{}}){
 if(!await allowed(client,user))throw Error(t('Accès réservé à Régis.','Access restricted to Régis.'));
 let disposed=false,busy=false,selected=[],imports=[],managerDispose=null;const urls=new Set();
 const alive=()=>{if(disposed)throw Error(t('Rubrique fermée. Le transfert incomplet pourra être repris.','Section closed. The incomplete transfer can be resumed.'));};
 const status=element('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const title=element('h2',t('My Agency · Photothèque privée','My Agency · Private image library'));
 const intro=element('p',t('Importez les volumes ZIP créés par « Exporter la photothèque complète ». Originaux, classements et cadrages sont conservés. Seul Régis a accès à cette bibliothèque.','Import ZIP volumes created by “Export entire image library”. Originals, classifications and crops are preserved. This library is accessible only to Régis.'));
 const note=element('p',t('Après réception de tous les volumes, les photos affectées à « Ouverture » alimentent l’accueil public My Agency avec leurs cadrages optimisés. Les originaux et les notes restent privés. Les autres sections ne sont pas reliées.','Once every volume has been received, images assigned to “Opening” supply the public My Agency opening with their optimized crops. Originals and notes remain private. Other sections are not connected.'));
 const manage=element('button',t('Gérer les photos d’ouverture','Manage opening images'));manage.type='button';manage.setAttribute('aria-expanded','false');
 const manager=element('section');manager.hidden=true;
 manage.onclick=async()=>{manager.hidden=!manager.hidden;manage.setAttribute('aria-expanded',String(!manager.hidden));if(manager.hidden||managerDispose)return;manage.disabled=true;try{const dispose=await root.MyEODAgencyOpeningManager.mount({client,user,container:manager});if(disposed){dispose();return;}managerDispose=dispose;}catch(e){report(e);}finally{if(!disposed)manage.disabled=false;}};
 const input=element('input');input.type='file';input.accept='.zip,application/zip';input.multiple=true;input.id='agency-transfer-files';
 const label=element('label',t('Volumes à importer','Volumes to import'));label.htmlFor=input.id;
 const inspect=element('button',t('Vérifier les archives','Check archives'));inspect.type='button';
 const confirm=element('button',t('Importer les volumes vérifiés','Import checked volumes'));confirm.type='button';confirm.disabled=true;
 const refresh=element('button',t('Actualiser les lots','Refresh batches'));refresh.type='button';
 const actions=element('div');actions.className='agency-library-actions';actions.append(inspect,confirm,refresh);
 const summary=element('div'),list=element('div'),detail=element('div');list.className='agency-library-batches';detail.className='agency-library-detail';
 container.classList.add('agency-library-panel');container.append(title,intro,note,manage,manager,label,input,actions,status,summary,list,detail);
 function lock(value){busy=value;input.disabled=inspect.disabled=refresh.disabled=value;confirm.disabled=value||!selected.length;}
 function report(e){if(disposed)return;status.textContent=e.message||String(e);error(e);}
 async function rpc(name,args){alive();const r=await client.rpc(name,args);if(r.error)throw r.error;alive();return r.data;}
 async function load(){
  alive();const r=await client.from('myeod_agency_imports').select('id,export_id,library_id,part,parts,status,created_at').order('created_at',{ascending:false}).limit(200);
  if(r.error)throw r.error;alive();imports=r.data;list.replaceChildren();
  list.append(element('h3',t('Lots reçus','Received batches')));
  if(!imports.length)list.append(element('p',t('Aucun lot importé.','No imported batches.')));
  for(const batch of imports){
   const button=element('button',`${batch.status==='complete'?'✓':t('À reprendre','Resume')} · ${t('Volume','Volume')} ${batch.part}/${batch.parts} · ${new Date(batch.created_at).toLocaleString(isEnglish()?'en-GB':'fr-FR')}`);
   button.type='button';button.onclick=()=>show(batch).catch(report);list.append(button);
  }
 }
 async function download(batch,photo){
  alive();if(!await allowed(client,user))throw Error(t('Accès révoqué.','Access revoked.'));
  const r=await client.storage.from(BUCKET).download(batch.id+'/'+photo.original);if(r.error)throw r.error;alive();
  const url=URL.createObjectURL(r.data);urls.add(url);const link=element('a');link.href=url;link.download=photo.image.filename||'photo';link.click();setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);},30000);
 }
 async function show(batch){
  if(busy)return;const r=await client.from('myeod_agency_imports').select('id,status,manifest').eq('id',batch.id).single();if(r.error)throw r.error;alive();
  const manifest=r.data.manifest;detail.replaceChildren();detail.append(element('h3',`${manifest.images.length} ${t('photo(s)','image(s)')} · ${t('Volume','Volume')} ${manifest.part}/${manifest.parts}`));
  const names=new Map(manifest.sections.map(x=>[x.id,x.label]));
  for(const photo of manifest.images){
   const card=element('article');card.append(element('h4',photo.record.description||photo.image.filename));
   card.append(element('p',`${photo.image.width} × ${photo.image.height} px · ${photo.record.sections.map(s=>names.get(s)||s).join(', ')||t('Sans affectation','Unassigned')} · ${Object.keys(photo.record.crops).length} ${t('cadrage(s)','crop(s)')}${photo.record.removed?' · '+t('Retirée de l’index','Removed from index'):''}`));
   if(photo.record.notes)card.append(element('p',photo.record.notes));
   const open=element('button',t('Télécharger l’original','Download original'));open.type='button';open.disabled=batch.status!=='complete';open.onclick=()=>download(batch,photo).catch(report);card.append(open);detail.append(card);
  }
 }
 input.onchange=()=>{selected=[];confirm.disabled=true;summary.replaceChildren();};
 inspect.onclick=async()=>{
  if(busy)return;selected=[];confirm.disabled=true;summary.replaceChildren();lock(true);
  try{
   const files=[...input.files];if(!files.length)throw Error(t('Choisissez au moins un volume ZIP.','Choose at least one ZIP volume.'));
   const seen=new Set();
   for(const file of files){
    alive();status.textContent=t('Vérification : ','Checking: ')+file.name;
    const pack=await root.MyEODAgencyTransfer.open(file,root.JSZip,(n,total)=>{alive();status.textContent=`${file.name} · ${n}/${total} ${t('fichiers vérifiés','files checked')}`;});
    const key=pack.manifest.exportId+':'+pack.manifest.part;if(seen.has(key))throw Error(t('Volume sélectionné deux fois.','Duplicate volume selection.'));seen.add(key);
    // Keep the file handle and small manifest, not multiple decompressed libraries in memory.
    selected.push({file,manifest:pack.manifest,summary:pack.summary});
    summary.append(element('p',`${file.name} · ${pack.summary.images} photo(s) · ${pack.summary.files} ${t('fichiers','files')} · ${(pack.summary.bytes/1048576).toFixed(1)} Mio · ${t('volume','volume')} ${pack.manifest.part}/${pack.manifest.parts}`));
   }
   status.textContent=t('Archives vérifiées. Vous pouvez lancer l’import. Importez tous les volumes pour transférer la photothèque complète.','Archives checked. You can start the import. Import every volume to transfer the complete library.');
  }catch(e){selected=[];report(e);}finally{if(!disposed)lock(false);}
 };
 confirm.onclick=async()=>{
  if(busy||!selected.length)return;lock(true);
  try{
   for(const chosen of selected){
    alive();const pack=await root.MyEODAgencyTransfer.open(chosen.file,root.JSZip);
    const prepared=await rpc('myeod_agency_prepare_transfer',{payload:pack.manifest});
    if(prepared.status==='complete')continue;
    let done=0;
    for(const f of pack.manifest.files){
     alive();status.textContent=`${chosen.file.name} · ${++done}/${pack.manifest.files.length} ${t('fichiers transférés','files transferred')}`;
     const data=await pack.read(f),path=prepared.id+'/'+f.path;
     const uploaded=await client.storage.from(BUCKET).upload(path,new Blob([data],{type:f.mime}),{contentType:f.mime,upsert:false,cacheControl:'3600'});
     if(uploaded.error){
      // A resumed volume may already contain this immutable file. Verify actual stored bytes before skipping it.
      if(!['409','400'].includes(String(uploaded.error.statusCode))&&!/already exists|duplicate/i.test(uploaded.error.message||''))throw uploaded.error;
      const existing=await client.storage.from(BUCKET).download(path);if(existing.error)throw existing.error;
      if(existing.data.size!==f.bytes||await root.MyEODAgencyTransfer.sha256(await existing.data.arrayBuffer())!==f.sha256)throw Error(t('Un fichier reçu diffère de l’archive. Import interrompu.','A stored file differs from the archive. Import stopped.'));
     }
    }
    await rpc('myeod_agency_finish_transfer',{target:prepared.id});
   }
   selected=[];input.value='';summary.replaceChildren();await load();status.textContent=t('Import terminé. Les lots sont disponibles dans votre bibliothèque privée My Agency.','Import complete. Batches are available in your private My Agency library.');
  }catch(e){report(e);status.textContent+=' '+t('Le lot incomplet reste à reprendre : sélectionnez à nouveau la même archive.','You can resume the incomplete batch by selecting the same archive again.');}
  finally{if(!disposed)lock(false);}
 };
 refresh.onclick=()=>load().catch(report);await load();
 return ()=>{disposed=true;managerDispose?.();selected=[];for(const url of urls)URL.revokeObjectURL(url);urls.clear();container.replaceChildren();};
}
root.MyEODAgencyLibrary={allowed,mount};
})(window);
