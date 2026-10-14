(function(root){
'use strict';
function failure(message){return new Error(message);}
async function removeFile(sb,bucket,path){
 const r=await sb.storage.from(bucket).remove([path]);
 if(r.error)throw r.error;
 if(!Array.isArray(r.data)||r.data.length!==1)throw failure('Suppression du fichier non confirmée : '+path);
}
async function upload(sb,bucket,table,path,file,metadata){
 const sent=await sb.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
 if(sent.error)throw sent.error;
 try{
  const saved=await sb.from(table).insert(metadata).select('id');
  if(saved.error)throw saved.error;
  if(!Array.isArray(saved.data)||saved.data.length!==1)throw failure('Insertion des métadonnées non confirmée');
  return saved.data[0];
 }catch(original){
  try{await removeFile(sb,bucket,path);}catch(cleanup){throw failure('Envoi non confirmé ; nettoyage non confirmé. Chemin à contrôler : '+path+' | '+original.message+' | '+cleanup.message);}
  throw failure('Envoi échoué ; fichier temporaire supprimé : '+original.message);
 }
}
async function remove(sb,bucket,table,id,path){
 await removeFile(sb,bucket,path);
 const r=await sb.from(table).delete().eq('id',id).select('id');
 if(r.error || !Array.isArray(r.data)||r.data.length!==1)throw failure('Fichier supprimé, métadonnées non supprimées : '+id+' | '+(r.error?.message||'suppression non confirmée'));
}
root.MyEODDocumentTransactions={upload,remove};
})(typeof window==='undefined'?globalThis:window);
