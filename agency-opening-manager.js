(function(root){'use strict';
const BUCKET='myeod-agency-library',REGIS='5e101491-fc2c-4081-9fdd-a513cb7e7404';
const en=()=>document.documentElement.lang==='en',t=(fr,eng)=>en()?eng:fr;
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
function snapshot(rows){
 const groups=new Map();for(const row of rows){if(row.owner_id!==REGIS)continue;const group=groups.get(row.export_id)||[];group.push(row);groups.set(row.export_id,group);}
 return [...groups.values()].filter(g=>g.length===g[0].parts&&g.every(r=>r.status==='complete'&&r.parts===g[0].parts&&r.library_id===g[0].library_id)&&new Set(g.map(r=>r.part)).size===g.length)
 .sort((a,b)=>Math.max(...b.map(r=>Date.parse(r.created_at)))-Math.max(...a.map(r=>Date.parse(r.created_at))))[0]||[];
}
async function mount({client,user,container}){
 if(user?.id!==REGIS)throw Error(t('Accès réservé à Régis.','Access restricted to Régis.'));
 let disposed=false,busy=false,photos=[],revision=0,preferences={},draft={},library='',exportId='',chosen='',preview=null,previewSerial=0,view='desktop',cards=[];
 const valid=()=>{if(disposed)throw Error('Closed');};
 const heading=el('h3',t('Gérer les photos d’ouverture','Manage opening images'));
 const intro=el('p',t('Vérifiez la composition avec le texte réel du site. Une favorite apparaît quatre fois plus souvent qu’une photo en rotation. Écarter une photo la retire uniquement de l’ouverture ; elle reste dans la photothèque.','Check the composition with the actual website text. A favorite appears four times as often as a rotation image. Excluding an image only removes it from the opening; it remains in the library.'));
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const toolbar=el('div');toolbar.className='agency-opening-toolbar';
 const save=el('button',t('Enregistrer la sélection','Save selection'));save.type='button';save.disabled=true;
 const cancel=el('button',t('Annuler les modifications','Discard changes'));cancel.type='button';cancel.disabled=true;
 const refresh=el('button',t('Actualiser la photothèque','Refresh library'));refresh.type='button';
 const deviceLabel=el('label',t('Aperçu : ','Preview: ')),device=el('select');device.setAttribute('aria-label',t('Écran de l’aperçu','Preview screen'));
 for(const [value,label] of [['desktop',t('Ordinateur','Desktop')],['mobile',t('Mobile','Mobile')]]){const option=el('option',label);option.value=value;device.append(option);}deviceLabel.append(device);
 toolbar.append(save,cancel,refresh,deviceLabel);
 const previewName=el('p'),stage=el('div'),viewport=el('div'),frame=el('iframe');stage.className='agency-opening-stage';viewport.className='agency-opening-viewport';frame.title=t('Aperçu de la photo avec le texte My Agency','Image preview with My Agency text');frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');viewport.append(frame);stage.append(viewport);
 const searchLabel=el('label',t('Rechercher une photo','Find an image')),search=el('input');search.type='search';search.placeholder=t('Nom de la photo…','Image name…');searchLabel.append(search);
 const filterLabel=el('label',t('Afficher','Show')),filter=el('select');
 const names={favorite:t('Favorite','Favorite'),rotation:t('En rotation','In rotation'),excluded:t('Écartée','Excluded')};
 for(const [value,label] of [['all',t('Toutes les photos','All images')],...Object.entries(names)]){const option=el('option',label);option.value=value;filter.append(option);}filterLabel.append(filter);
 const filters=el('div');filters.className='agency-opening-toolbar';filters.append(searchLabel,filterLabel);
 const counts=el('p'),gallery=el('div');gallery.className='agency-opening-gallery';
 container.classList.add('agency-opening-manager');container.append(heading,intro,toolbar,status,previewName,stage,filters,counts,gallery);
 const dirty=()=>photos.some(p=>(draft[p.id]||'rotation')!==(preferences[p.id]||'rotation'));
 function update(){
  const total={favorite:0,rotation:0,excluded:0};for(const p of photos)total[draft[p.id]||'rotation']++;
  counts.textContent=`${photos.length} photo(s) · ${total.favorite} ${names.favorite.toLowerCase()} · ${total.rotation} ${names.rotation.toLowerCase()} · ${total.excluded} ${names.excluded.toLowerCase()}`;
  save.disabled=cancel.disabled=busy||!dirty();device.disabled=busy;refresh.disabled=busy||dirty();search.disabled=busy;filter.disabled=busy;
  for(const card of cards){const state=draft[card.photo.id]||'rotation';card.select.disabled=busy;card.button.disabled=busy;card.node.hidden=!(filter.value==='all'||filter.value===state)||!card.photo.name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase());card.node.dataset.state=state;card.button.setAttribute('aria-pressed',String(chosen===card.photo.id));}
 }
 function resize(){const width=view==='mobile'?360:1440,height=view==='mobile'?747:828;viewport.style.maxWidth=view==='mobile'?'360px':'100%';viewport.style.aspectRatio=width+'/'+height;frame.style.width=width+'px';frame.style.height=height+'px';frame.style.transform='scale('+(viewport.clientWidth/width)+')';}
 const observer=new ResizeObserver(resize);observer.observe(viewport);
 function sendPreview(){if(preview&&!disposed)frame.contentWindow?.postMessage({type:'myeod-opening-preview',photo:preview,exportId},location.origin);}
 function onMessage(event){if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='myeod-opening-ready')sendPreview();}
 addEventListener('message',onMessage);frame.onload=sendPreview;
 frame.src='my-agency/?openingPreview=1&lang='+(en()?'en':'fr')+'&version=205';
 device.onchange=()=>{view=device.value;resize();};search.oninput=update;filter.onchange=update;
 async function sign(paths){valid();const result=await client.storage.from(BUCKET).createSignedUrls(paths,3600);if(result.error)throw result.error;valid();const urls=new Map(result.data.filter(x=>!x.error&&x.signedUrl).map(x=>[x.path,x.signedUrl]));if(paths.some(p=>!urls.has(p)))throw Error(t('Un aperçu est indisponible. Actualisez la photothèque.','A preview is unavailable. Refresh the library.'));return urls;}
 async function choose(photo){
  const serial=++previewSerial;chosen=photo.id;previewName.textContent=t('Aperçu : ','Preview: ')+photo.name;status.textContent=t('Chargement de l’aperçu…','Loading preview…');update();
  try{const paths=photo.variants.flatMap(v=>v.files.map(f=>f.path)),urls=await sign(paths);if(disposed||serial!==previewSerial)return;
   preview={id:photo.id,variants:photo.variants.map(v=>({device:v.device,files:v.files.map(f=>({format:f.format,width:f.width,height:f.height,url:urls.get(f.path)}))}))};sendPreview();status.textContent=dirty()?t('Modifications non enregistrées.','Unsaved changes.'):t('Sélection publiée à jour.','Published selection is up to date.');
  }catch(e){if(!disposed&&serial===previewSerial)status.textContent=e.message;}
 }
 async function load(){
  if(busy)return;busy=true;update();status.textContent=t('Chargement de la photothèque…','Loading library…');
  try{
   const access=await client.rpc('myeod_agency_library_access');if(access.error||access.data!==true)throw Error(t('Accès réservé à Régis.','Access restricted to Régis.'));valid();
   const result=await client.from('myeod_agency_imports').select('id,export_id,library_id,part,parts,status,owner_id,created_at').order('created_at',{ascending:false}).limit(1000);if(result.error)throw result.error;valid();
   const current=snapshot(result.data);if(!current.length)throw Error(t('Importez tous les volumes avant de gérer l’ouverture.','Import every volume before managing the opening.'));
   library=current[0].library_id;exportId=current[0].export_id;
   const [volumes,selection]=await Promise.all([client.from('myeod_agency_imports').select('id,manifest').eq('export_id',exportId).eq('status','complete'),client.from('myeod_agency_opening_selection').select('revision,preferences').eq('library_id',library).maybeSingle()]);
   if(volumes.error||selection.error)throw volumes.error||selection.error;valid();revision=selection.data?.revision||0;preferences=selection.data?.preferences||{};draft={...preferences};photos=[];
   for(const volume of volumes.data){const descriptors=new Map(volume.manifest.files.filter(f=>f.kind==='web').map(f=>[f.path,f]));for(const photo of volume.manifest.images){
    if(photo.record.removed||!photo.record.sections.includes('0'))continue;
    const variants=['desktop','mobile'].map(device=>({device,files:(photo.web.find(w=>w.slot==='0:'+device&&w.variant==='main')?.files||[]).filter(f=>descriptors.get(f.file)?.imageId===photo.image.id).map(f=>({...f,path:volume.id+'/'+f.file}))}));
    if(variants.some(v=>!v.files.some(f=>f.format==='JPEG')))continue;
    photos.push({id:photo.image.id,name:photo.record.description||photo.image.filename,variants});
   }}
   const thumbs=photos.map(p=>({photo:p,file:p.variants[0].files.filter(f=>f.format==='JPEG').sort((a,b)=>a.width-b.width)[0]}));
   const urls=await sign(thumbs.map(x=>x.file.path));valid();gallery.replaceChildren();cards=[];
   for(const {photo,file} of thumbs){
    const card=el('article'),button=el('button'),image=el('img');button.type='button';button.className='agency-opening-thumb';button.setAttribute('aria-label',t('Prévisualiser : ','Preview: ')+photo.name);image.src=urls.get(file.path);image.alt=photo.name;image.loading='lazy';button.append(image);button.onclick=()=>choose(photo);
    const title=el('p',photo.name),label=el('label',t('Utilisation','Usage')),select=el('select');select.setAttribute('aria-label',t('Utilisation : ','Usage: ')+photo.name);
    for(const [value,text] of Object.entries(names)){const option=el('option',text);option.value=value;select.append(option);}select.value=draft[photo.id]||'rotation';
    select.onchange=()=>{draft[photo.id]=select.value;status.textContent=t('Modifications non enregistrées.','Unsaved changes.');update();};label.append(select);card.append(button,title,label);gallery.append(card);cards.push({photo,node:card,button,select});
   }
   if(photos.length){await choose(photos.find(p=>p.id===chosen)||photos[0]);}else status.textContent=t('Aucune photo affectée à l’ouverture.','No images assigned to the opening.');
  }catch(e){if(!disposed)status.textContent=e.message;}finally{busy=false;if(!disposed)update();}
 }
 save.onclick=async()=>{
  if(busy||!dirty())return;
  if(photos.every(p=>draft[p.id]==='excluded')){status.textContent=t('Conservez au moins une photo active pour l’ouverture.','Keep at least one active image for the opening.');return;}
  busy=true;update();status.textContent=t('Enregistrement…','Saving…');
  try{const changes=photos.filter(p=>(draft[p.id]||'rotation')!==(preferences[p.id]||'rotation')).map(p=>({id:p.id,status:draft[p.id]||'rotation'}));
   const r=await client.rpc('myeod_agency_save_opening',{target_library:library,target_export:exportId,expected_revision:revision,changes});if(r.error)throw r.error;valid();revision=r.data.revision;preferences={...r.data.preferences};draft={...preferences};status.textContent=t('Sélection enregistrée. Elle s’applique aux prochains chargements de l’ouverture.','Selection saved. It applies to subsequent opening page loads.');
  }catch(e){if(!disposed)status.textContent=e.message;}finally{busy=false;if(!disposed)update();}
 };
 cancel.onclick=()=>{draft={...preferences};for(const card of cards)card.select.value=draft[card.photo.id]||'rotation';status.textContent=t('Modifications annulées. La sélection publiée est conservée.','Changes discarded. The published selection is unchanged.');update();};
 refresh.onclick=()=>load();await load();
 return ()=>{disposed=true;previewSerial++;observer.disconnect();removeEventListener('message',onMessage);frame.src='about:blank';container.replaceChildren();};
}
root.MyEODAgencyOpeningManager={mount};
})(window);
