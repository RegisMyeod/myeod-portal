(function(root){'use strict';
const MAX=192*1024*1024,MAX_ARCHIVE=224*1024*1024;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const path=/^(originals|images)\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|avif|heic|heif|tif|tiff|bmp)$/;
const mimes=new Set(['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif','image/tiff','image/bmp']);
function assert(test,message){if(!test)throw Error(message);}
async function sha256(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function zipDirectory(bytes){
 assert(bytes.length<=MAX_ARCHIVE,'Archive trop volumineuse : importer les volumes séparément.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break;}
 assert(end>=0,'ZIP invalide ou incomplet.');
 assert(view.getUint16(end+4,true)===0&&view.getUint16(end+6,true)===0,'ZIP multi-disque non accepté.');
 const count=view.getUint16(end+10,true),length=view.getUint32(end+12,true);let cursor=view.getUint32(end+16,true),total=0;const files=new Map();
 assert(count<=50002&&cursor+length===end,'Structure ZIP non prise en charge.');
 for(let n=0;n<count;n++){
  assert(cursor+46<=end&&view.getUint32(cursor,true)===0x02014b50,'Répertoire ZIP invalide.');
  const flags=view.getUint16(cursor+8,true),method=view.getUint16(cursor+10,true),size=view.getUint32(cursor+24,true),nameLength=view.getUint16(cursor+28,true),extra=view.getUint16(cursor+30,true),comment=view.getUint16(cursor+32,true);
  assert(!(flags&1)&&[0,8].includes(method)&&cursor+46+nameLength+extra+comment<=end,'ZIP chiffré ou invalide.');
  const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(cursor+46,cursor+46+nameLength));
  assert(name==='manifest.json'||name==='LIRE-MOI.txt'||path.test(name),'Chemin interdit dans l’archive.');
  assert(!files.has(name)&&((view.getUint32(cursor+38,true)>>>16)&0xf000)!==0xa000,'Doublon ou lien symbolique interdit.');
  assert(size<=(name==='manifest.json'?16*1024*1024:65000000),'Fichier trop volumineux.');
  total+=size;assert(total<=MAX_ARCHIVE,'Archive décompressée trop volumineuse.');files.set(name,size);cursor+=46+nameLength+extra+comment;
 }
 assert(cursor===end&&files.has('manifest.json'),'Manifeste manquant.');return files;
}
function validate(manifest,entries){
 assert(manifest?.schema==='myeod-library-transfer/v1','Choisir un export complet de la photothèque MyEOD.');
 assert(uuid.test(manifest.exportId)&&uuid.test(manifest.libraryId),'Identifiants de transfert invalides.');
 assert(Number.isInteger(manifest.part)&&Number.isInteger(manifest.parts)&&manifest.part>=1&&manifest.part<=manifest.parts&&manifest.parts<=1000,'Numéro de volume invalide.');
 assert(Array.isArray(manifest.images)&&manifest.images.length<=5000&&Array.isArray(manifest.files)&&manifest.files.length<=50000&&Array.isArray(manifest.sections),'Catalogue invalide.');
 const ids=new Set(),paths=new Map(),sections=new Set(manifest.sections.map(x=>x.id));let total=0;
 for(const photo of manifest.images){
  const id=photo?.image?.id,r=photo?.record;
  assert(typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id)&&!ids.has(id)&&r?.id===id,'Identifiant photo invalide ou doublonné.');ids.add(id);
  assert(Number.isInteger(photo.image.width)&&photo.image.width>0&&Number.isInteger(photo.image.height)&&photo.image.height>0,'Dimensions photo invalides.');
  assert(Array.isArray(r.sections)&&r.sections.every(s=>sections.has(s))&&r.crops&&typeof r.crops==='object'&&!Array.isArray(r.crops),'Classements invalides.');
  assert(typeof r.description==='string'&&r.description.length<=2000&&typeof r.notes==='string'&&r.notes.length<=6000&&typeof r.reviewed==='boolean'&&typeof r.removed==='boolean','Réglages photo invalides.');
  for(const [slot,frame] of Object.entries(r.crops)){
   const parts=slot.split(':');assert([2,3].includes(parts.length)&&sections.has(parts[0])&&['desktop','mobile'].includes(parts[1]),'Emplacement de cadrage invalide.');
   assert(['x','y','w','h'].every(k=>typeof frame[k]==='number'&&Number.isFinite(frame[k]))&&frame.x>=0&&frame.y>=0&&frame.w>0&&frame.h>0&&frame.x+frame.w<=1.00001&&frame.y+frame.h<=1.00001,'Cadrage invalide.');
   assert(frame.rotation===undefined||typeof frame.rotation==='number'&&Number.isFinite(frame.rotation)&&Math.abs(frame.rotation)<=90,'Rotation invalide.');
  }
 }
 for(const f of manifest.files){
  assert(path.test(f.path)&&!paths.has(f.path)&&/^[a-f0-9]{64}$/.test(f.sha256)&&ids.has(f.imageId)&&['original','web'].includes(f.kind)&&mimes.has(f.mime),'Fichier déclaré invalide.');
  assert(Number.isSafeInteger(f.bytes)&&f.bytes>0&&f.bytes<=65000000&&entries.get(f.path)===f.bytes,'Taille de fichier incohérente.');
  total+=f.bytes;paths.set(f.path,f);
 }
 assert(total<=MAX&&entries.size===manifest.files.length+1+(entries.has('LIRE-MOI.txt')?1:0),'Volume incomplet ou fichiers inattendus.');
 for(const photo of manifest.images){const f=paths.get(photo.original);assert(f?.kind==='original'&&f.imageId===photo.image.id&&(!photo.image.sha256||f.sha256===photo.image.sha256),'Original manquant ou différent.');}
 return {images:manifest.images.length,files:manifest.files.length,bytes:total};
}
async function open(file,JSZip,progress=()=>{}){
 assert(file.size<=MAX_ARCHIVE,'Archive trop volumineuse.');
 const bytes=new Uint8Array(await file.arrayBuffer()),entries=zipDirectory(bytes),zip=await JSZip.loadAsync(bytes);
 const text=new TextDecoder('utf-8',{fatal:true}).decode(await boundedRead(zip.file('manifest.json'),16*1024*1024));
 const manifest=JSON.parse(text),summary=validate(manifest,entries);
 async function read(f){const bytes=await boundedRead(zip.file(f.path),f.bytes);assert(bytes.length===f.bytes&&await sha256(bytes)===f.sha256,'Fichier altéré : '+f.path);return bytes;}
 let done=0;for(const f of manifest.files){await read(f);progress(++done,manifest.files.length);}
 return {manifest,summary,read};
}
function boundedRead(entry,maximum){
 return new Promise((resolve,reject)=>{
  if(!entry){reject(Error('Fichier manquant.'));return;}
  const chunks=[];let size=0,failed=false;const stream=entry.internalStream('uint8array');
  stream.on('data',chunk=>{size+=chunk.length;if(size>maximum){failed=true;stream.pause();reject(Error('Données décompressées trop volumineuses.'));return;}chunks.push(chunk);});
  stream.on('error',reject);stream.on('end',()=>{if(failed)return;const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}resolve(bytes);});stream.resume();
 });
}
const api={open,validate,zipDirectory,sha256,MAX_ARCHIVE};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MyEODAgencyTransfer=api;
})(typeof window==='undefined'?globalThis:window);
