(function(root){'use strict';
const BUCKET='myeod-agency-library',REGIS='5e101491-fc2c-4081-9fdd-a513cb7e7404';
const en=()=>document.documentElement.lang==='en',t=(fr,eng)=>en()?eng:fr;
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
function snapshot(rows){return root.MyEODAgencyAreas.snapshots(rows);}
async function mount({client,user,container}){
 if(user?.id!==REGIS)throw Error(t('Accès réservé à Régis.','Access restricted to Régis.'));
 let disposed=false,busy=false,photos=[],revision=0,preferences={},draft={},library='',exportId='',chosen='',preview=null,previewSerial=0,view='desktop',cards=[];
 let area=root.MyEODAgencyAreas.areas[0];
 const valid=()=>{if(disposed)throw Error('Closed');};
 const heading=el('h3',t('Gérer les illustrations My Agency','Manage My Agency illustrations'));
 const intro=el('p',t('Vérifiez la composition avec le texte réel du site. Une favorite apparaît quatre fois plus souvent qu’une photo en rotation. Écarter une photo la retire uniquement de la zone sélectionnée ; elle reste dans la photothèque.','Check the composition with the actual website text. A favorite appears four times as often as a rotation image. Excluding an image only removes it from the selected area; it remains in the library.'));
 const status=el('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const toolbar=el('div');toolbar.className='agency-opening-toolbar';
 const save=el('button',t('Enregistrer la sélection','Save selection'));save.type='button';save.disabled=true;
 const cancel=el('button',t('Annuler les modifications','Discard changes'));cancel.type='button';cancel.disabled=true;
 const refresh=el('button',t('Actualiser la photothèque','Refresh library'));refresh.type='button';
 const deviceLabel=el('label',t('Aperçu : ','Preview: ')),device=el('select');deviceLabel.className='agency-opening-device-choice';device.setAttribute('aria-label',t('Écran de l’aperçu','Preview screen'));
 for(const [value,label] of [['desktop',t('Ordinateur','Desktop')],['mobile',t('Mobile','Mobile')]]){const option=el('option',label);option.value=value;device.append(option);}deviceLabel.append(device);
 const areaLabel=el('label',t('Zone d’illustration','Illustration area')),areaSelect=el('select');areaSelect.setAttribute('aria-label',t('Zone d’illustration','Illustration area'));
 for(const a of root.MyEODAgencyAreas.areas){const option=el('option',en()?a.english:a.label);option.value=a.id;areaSelect.append(option);}areaLabel.append(areaSelect);
 toolbar.append(areaLabel,save,cancel,refresh,deviceLabel);
 const previewName=el('p'),stage=el('div');stage.className='agency-opening-stage';stage.dataset.view=view;
 const screens=['desktop','mobile'].map(device=>{
  const card=el('section'),label=el('h4',device==='desktop'?t('Ordinateur','Desktop'):t('Mobile','Mobile')),viewport=el('div'),frame=el('iframe');
  card.className='agency-opening-preview';card.dataset.device=device;viewport.className='agency-opening-viewport';
  frame.title=device==='desktop'?t('Aperçu ordinateur avec le texte My Agency','Desktop preview with My Agency text'):t('Aperçu mobile avec le texte My Agency','Mobile preview with My Agency text');
  frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');viewport.append(frame);card.append(label,viewport);stage.append(card);return {device,viewport,frame};
 });
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
  save.disabled=cancel.disabled=busy||!dirty();device.disabled=busy;areaSelect.disabled=busy||dirty();refresh.disabled=busy||dirty();search.disabled=busy;filter.disabled=busy;
  for(const card of cards){const state=draft[card.photo.id]||'rotation';card.select.disabled=busy;card.button.disabled=busy;card.node.hidden=!(filter.value==='all'||filter.value===state)||!card.photo.name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase());card.node.dataset.state=state;card.button.setAttribute('aria-pressed',String(chosen===card.photo.id));}
 }
 function resize(){for(const {device,viewport,frame} of screens){const width=device==='mobile'?360:1440,height=device==='mobile'?747:828;viewport.style.aspectRatio=width+'/'+height;frame.style.width=width+'px';frame.style.height=height+'px';if(viewport.clientWidth)frame.style.transform='scale('+(viewport.clientWidth/width)+')';}}
 const observer=new ResizeObserver(resize);for(const screen of screens)observer.observe(screen.viewport);
 function sendPreview(){if(!disposed)for(const {frame} of screens)frame.contentWindow?.postMessage({type:'myeod-opening-preview',area:area.id,photo:preview,photos:preview?[preview]:[],exportId},location.origin);}
 function onMessage(event){if(event.origin===location.origin&&screens.some(s=>event.source===s.frame.contentWindow)&&event.data?.type==='myeod-opening-ready')sendPreview();}
 addEventListener('message',onMessage);for(const {frame} of screens){frame.onload=sendPreview;frame.src='my-agency/?openingPreview=1&lang='+(en()?'en':'fr')+'&area='+encodeURIComponent(area.id)+'&version=214';}
 areaSelect.onchange=()=>{if(busy||dirty())return;area=root.MyEODAgencyAreas.areas.find(a=>a.id===areaSelect.value);previewSerial++;preview=null;chosen='';for(const {frame} of screens)frame.src='my-agency/?openingPreview=1&lang='+(en()?'en':'fr')+'&area='+encodeURIComponent(area.id)+'&version=214';load();};
 device.onchange=()=>{view=device.value;stage.dataset.view=view;resize();sendPreview();};search.oninput=update;filter.onchange=update;
 async function sign(paths){valid();if(!paths.length)return new Map();const result=await client.storage.from(BUCKET).createSignedUrls(paths,3600);if(result.error)throw result.error;valid();const urls=new Map(result.data.filter(x=>!x.error&&x.signedUrl).map(x=>[x.path,x.signedUrl]));if(paths.some(p=>!urls.has(p)))throw Error(t('Un aperçu est indisponible. Actualisez la photothèque.','A preview is unavailable. Refresh the library.'));return urls;}
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
   const current=snapshot(result.data);if(!current.length)throw Error(t('Importez tous les volumes avant de gérer les illustrations.','Import every volume before managing illustrations.'));
   library=current[0].library_id;exportId=current[0].export_id;
   const [volumes,selection]=await Promise.all([client.from('myeod_agency_imports').select('id,created_at,manifest').in('id',current.map(r=>r.id)),(area.id==='0'?client.from('myeod_agency_opening_selection').select('revision,preferences').eq('library_id',library):client.from('myeod_agency_area_selection').select('revision,preferences').eq('library_id',library).eq('area',area.id)).maybeSingle()]);
   if(volumes.error||selection.error)throw volumes.error||selection.error;valid();revision=selection.data?.revision||0;preferences=selection.data?.preferences||{};draft={...preferences};photos=[];
   photos=root.MyEODAgencyAreas.candidates(volumes.data,area);
   for(const option of areaSelect.options){const a=root.MyEODAgencyAreas.areas.find(a=>a.id===option.value);option.textContent=(en()?a.english:a.label)+' · '+root.MyEODAgencyAreas.candidates(volumes.data,a).length+' photo(s)';}
   const thumbs=photos.map(p=>({photo:p,file:p.variants[0].files.filter(f=>f.format==='JPEG').sort((a,b)=>a.width-b.width)[0]}));
   const urls=await sign(thumbs.map(x=>x.file.path));valid();gallery.replaceChildren();cards=[];
   for(const {photo,file} of thumbs){
    const card=el('article'),button=el('button'),image=el('img');button.type='button';button.className='agency-opening-thumb';button.setAttribute('aria-label',t('Prévisualiser : ','Preview: ')+photo.name);image.src=urls.get(file.path);image.alt=photo.name;image.loading='lazy';button.append(image);button.onclick=()=>choose(photo);
    const title=el('p',photo.name),label=el('label',t('Utilisation','Usage')),select=el('select');select.setAttribute('aria-label',t('Utilisation : ','Usage: ')+photo.name);
    for(const [value,text] of Object.entries(names)){const option=el('option',text);option.value=value;select.append(option);}select.value=draft[photo.id]||'rotation';
    select.onchange=()=>{draft[photo.id]=select.value;status.textContent=t('Modifications non enregistrées.','Unsaved changes.');update();};label.append(select);card.append(button,title,label);gallery.append(card);cards.push({photo,node:card,button,select});
   }
   if(photos.length){await choose(photos.find(p=>p.id===chosen)||photos[0]);}else {preview=null;sendPreview();previewName.textContent=en()?area.english:area.label;status.textContent=t('Aucune photo importée pour cette zone. Les illustrations actuelles du site sont conservées.','No images imported for this area. Current website illustrations are preserved.');}
  }catch(e){if(!disposed)status.textContent=e.message;}finally{busy=false;if(!disposed)update();}
 }
 save.onclick=async()=>{
  if(busy||!dirty())return;
  if(photos.every(p=>draft[p.id]==='excluded')){status.textContent=t('Conservez au moins une photo active pour cette zone.','Keep at least one active image for this area.');return;}
  busy=true;update();status.textContent=t('Enregistrement…','Saving…');
  try{const changes=photos.filter(p=>(draft[p.id]||'rotation')!==(preferences[p.id]||'rotation')).map(p=>({id:p.id,status:draft[p.id]||'rotation'}));
   const r=await client.rpc('myeod_agency_save_area',{target_library:library,target_export:exportId,target_area:area.id,expected_revision:revision,changes});if(r.error)throw r.error;valid();revision=r.data.revision;preferences={...r.data.preferences};draft={...preferences};status.textContent=t('Sélection enregistrée. Elle s’applique aux prochains chargements de cette zone.','Selection saved. It applies to subsequent loads of this area.');
  }catch(e){if(!disposed)status.textContent=e.message;}finally{busy=false;if(!disposed)update();}
 };
 cancel.onclick=()=>{draft={...preferences};for(const card of cards)card.select.value=draft[card.photo.id]||'rotation';status.textContent=t('Modifications annulées. La sélection publiée est conservée.','Changes discarded. The published selection is unchanged.');update();};
 function onLibraryChanged(){if(!busy&&!dirty())load();}
 addEventListener('myeod-agency-library-changed',onLibraryChanged);
 refresh.onclick=()=>load();await load();
 return ()=>{disposed=true;removeEventListener('myeod-agency-library-changed',onLibraryChanged);previewSerial++;observer.disconnect();removeEventListener('message',onMessage);for(const {frame} of screens)frame.src='about:blank';container.replaceChildren();};
}
root.MyEODAgencyOpeningManager={mount};
})(window);
