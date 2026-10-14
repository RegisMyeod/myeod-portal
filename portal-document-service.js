(function(root){
'use strict';
const pendingCleanup=new Map(), pendingNotes=new Map();
const messages={'Partage réservé à un administrateur.':'Sharing is reserved for an administrator.','Approuvez le document avant de le partager.':'Approve the document before sharing it.','Partage non confirmé. Actualisez les documents.':'Sharing not confirmed. Refresh the documents.','Reconnectez-vous.': 'Please sign in again.', 'Compte sans rôle pris en charge.': 'Unsupported account role.', 'Envoi réservé au collaborateur.': 'Uploads are reserved for collaborators.', 'Métadonnées non confirmées : ': 'Metadata not confirmed: ', 'ligne non supprimée': 'row not deleted', 'Envoi non confirmé ; nettoyage à contrôler : ': 'Upload not confirmed; cleanup requires attention: ', 'Envoi échoué ; témoin nettoyé : ': 'Upload failed; temporary record cleaned up: ', 'Suppression non autorisée.': 'Deletion not authorized.', 'Modification non autorisée.': 'Editing not authorized.', 'Modification non confirmée. Actualisez les droits.': 'Update not confirmed. Refresh access permissions.', 'Approbation réservée à un administrateur.': 'Approval is reserved for an administrator.', 'Approbation non confirmée.': 'Approval not confirmed.', 'Aucun témoin de nettoyage pour cette session.': 'No pending cleanup for this session.', 'Témoin inaccessible ou absent : contrôle administrateur requis : ': 'Record inaccessible or absent; administrator check required: ', 'Nettoyage non autorisé ; témoin conservé : ': 'Cleanup not authorized; record retained: ', 'Nettoyage métadonnées non confirmé : ': 'Metadata cleanup not confirmed: '};
function tr(text){return root.document?.documentElement?.lang==='en'?(messages[text]||text):text;}
function must(r){if(r.error)throw Object.assign(new Error(r.error.message),{code:r.error.code});return r.data;}
function conflict(){return Object.assign(Error(root.document?.documentElement?.lang==='en'?'Content changed. Refresh before retrying.':'Contenu modifié. Actualisez avant de réessayer.'),{code:'PT409'});}
function revision(row){if(!Number.isSafeInteger(row.collab_revision)||row.collab_revision<1)throw Error('Version indisponible / Version unavailable.');return row.collab_revision;}
async function identity(sb){const user=must(await sb.auth.getUser()).user;if(!user)throw Error(tr('Reconnectez-vous.'));const p=must(await sb.from('profiles').select('role,must_change_password').eq('id',user.id).single());if(!['client','collaborateur','fondateur'].includes(p.role))throw Error(tr('Compte sans rôle pris en charge.'));if(p.must_change_password!==false)throw Error('Changement de mot de passe requis / Password change required.');if(root.MyEODAccessPolicyMode==='scoped-v48'){
 const snapshot=must(await sb.rpc('myeod_access_snapshot_v48'));if(!snapshot?.session?.active||snapshot.session.user_id!==user.id||snapshot.session.must_change_password!==false||!snapshot.context?.mode)throw Error(tr('Modification non autorisée.'));
 return {user,role:p.role,snapshot};
}return {user,role:p.role};}
function canManage(who,row){
 if(!who.snapshot)return who.role==='fondateur';
 const {context,assignment}=who.snapshot;return (context.mode==='project_manager'&&context.project_id===row.project_id)||(context.mode==='administration'&&assignment?.user_id===who.user.id&&(assignment.write_domains?.includes('*')||assignment.write_domains?.includes('projects')));
}
function canEdit(who,row){if(canManage(who,row))return true;return (!who.snapshot||who.snapshot.context.mode==='collaborator')&&who.role==='collaborateur'&&row.uploaded_by===who.user.id&&row.state==='draft';}
function canUpload(who){return who.snapshot?who.snapshot.context.mode==='collaborator'||who.snapshot.context.mode==='project_manager'||canManage(who,{project_id:who.snapshot.context.project_id}):who.role==='collaborateur';}
async function mutate(sb,operation,row,values={}){
 const expected=operation==='insert'?0:revision(row);
 const scoped=root.MyEODAccessPolicyMode==='scoped-v48';const args={operation,changes:[{id:row.id,expected,values}]};if(!scoped)args.target_table='portal_documents';
 const result=await sb.rpc(scoped?'myeod_document_mutate_v50':'myeod_collab_mutate',args);
 if(result.error?.code==='PT409')throw conflict();
 const saved=must(result);
 const next=operation==='delete'?expected:expected+1;
 if(!Array.isArray(saved)||saved.length!==1||saved[0].id!==row.id||saved[0].collab_revision!==next)throw Error('Modification non confirmée / Update not confirmed.');
 return saved[0];
}
async function read(sb,id){const found=must(await sb.from('portal_documents').select('*').eq('id',id));if(!Array.isArray(found)||found.length!==1)throw Error(tr('Témoin inaccessible ou absent : contrôle administrateur requis : ')+id);return found[0];}
async function removeReserved(sb,row){
 const reserved=row.collab_deleting===true?row:await mutate(sb,'reserve-delete',row);
 if(reserved.collab_deleting!==true)throw Error('Réservation non confirmée / Reservation not confirmed.');
 const removed=must(await sb.storage.from(reserved.bucket_id).remove([reserved.storage_path]));
 if(!Array.isArray(removed)||removed.length>1)throw Error('Suppression du fichier non confirmée / File removal not confirmed.');
 // Le RPC refuse la finalisation tant qu'un objet existe, même si remove renvoie [].
 await mutate(sb,'delete',reserved);
 return reserved.id;
}
async function upload(sb,project,file,notes){
 const who=await identity(sb);if(!canUpload(who))throw Error(tr('Envoi réservé au collaborateur.'));
 const actual=must(await sb.from('portal_projects').select('id,company_id').eq('id',project.id).single());
 const id=crypto.randomUUID(),path='portal/'+id+'/file',bucket='uploads-collab';
 const values={id,company_id:actual.company_id,project_id:actual.id,uploaded_by:who.user.id,bucket_id:bucket,storage_path:path,filename:file.name,notes:notes||'',state:'draft',client_shared:false};
 const row=await mutate(sb,'insert',{id},values);
 if(Object.keys(values).some(key=>row[key]!==values[key]))throw Error(tr('Métadonnées non confirmées : ')+id);
 try{const sent=must(await sb.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false}));if(!sent||sent.path!==path)throw Error('Envoi non confirmé / Upload not confirmed.');}
 catch(e){
  try{await removeReserved(sb,row);}
  catch(clean){pendingCleanup.set(id,row);throw Error(tr('Envoi non confirmé ; nettoyage à contrôler : ')+id+' | '+e.message+' | '+clean.message);}
  throw Error(tr('Envoi échoué ; témoin nettoyé : ')+e.message);
 }
 return row;
}
async function remove(sb,row){
 const who=await identity(sb),fresh=await read(sb,row.id);
 if(!canEdit(who,fresh))throw Error(tr('Suppression non autorisée.'));
 if(revision(fresh)!==revision(row))throw conflict();
 try{return await removeReserved(sb,fresh);}catch(e){e.reload=true;throw e;}
}
async function replace(sb,row,file){
 const who=await identity(sb),fresh=await read(sb,row.id);
 if(!canEdit(who,fresh)||!canUpload(who))throw Error(tr('Modification non autorisée.'));
 if(revision(fresh)!==revision(row)||fresh.file_version!==row.file_version)throw conflict();
 if(fresh.collab_deleting||!Number.isSafeInteger(fresh.file_version)||fresh.file_version<1||!file||typeof file.name!=='string'||!file.name.trim())throw Error('Version ou fichier indisponible / Version or file unavailable.');
 const id=crypto.randomUUID(),path='portal/'+id+'/file',bucket='uploads-collab';
 const values={new_id:id,filename:file.name};
 const args={operation:'replace',changes:[{id:fresh.id,expected:revision(fresh),values}]};
 const scoped=root.MyEODAccessPolicyMode==='scoped-v48';if(!scoped)args.target_table='portal_documents';
 const reply=await sb.rpc(scoped?'myeod_document_mutate_v50':'myeod_collab_mutate',args);
 if(reply.error?.code==='PT409')throw conflict();
 const result=must(reply),expected={id,company_id:fresh.company_id,project_id:fresh.project_id,uploaded_by:who.user.id,bucket_id:bucket,storage_path:path,filename:file.name,notes:fresh.notes,state:'draft',client_shared:false,file_version:fresh.file_version+1,replaces_document_id:fresh.id,collab_revision:1,collab_deleting:false};
 if(!Array.isArray(result)||result.length!==1||Object.keys(expected).some(key=>result[0]?.[key]!==expected[key]))throw Error(tr('Métadonnées non confirmées : ')+id);
 const saved=result[0];
 try{const sent=must(await sb.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false}));if(!sent||sent.path!==path)throw Error('Envoi non confirmé / Upload not confirmed.');}
 catch(error){
  try{await removeReserved(sb,saved);}catch(clean){pendingCleanup.set(id,saved);throw Error(tr('Envoi non confirmé ; nettoyage à contrôler : ')+id+' | '+error.message+' | '+clean.message);}
  throw Error(tr('Envoi échoué ; témoin nettoyé : ')+error.message);
 }
 return saved;
}
async function updateNotes(sb,row,notes,knownUserId){
 if(knownUserId)pendingNotes.set(knownUserId+':'+row.id,notes);
 const who=await identity(sb);
 if(knownUserId&&knownUserId!==who.user.id)throw Error(tr('Reconnectez-vous.'));
 if(!canEdit(who,row))throw Error(tr('Modification non autorisée.'));
 const key=who.user.id+':'+row.id;pendingNotes.set(key,notes);
 const saved=await mutate(sb,'update',row,{notes});
 if(saved.notes!==notes)throw Error(tr('Modification non confirmée. Actualisez les droits.'));
 pendingNotes.delete(key);return saved;
}
async function approve(sb,row){
 const who=await identity(sb);if(!canManage(who,row))throw Error(tr('Approbation réservée à un administrateur.'));
 if(!['draft','submitted'].includes(row.state)||row.collab_deleting===true)throw Error(tr('Approbation non confirmée.'));
 const saved=await mutate(sb,'update',row,{state:'approved'});
 if(saved.state!=='approved')throw Error(tr('Approbation non confirmée.'));return saved;
}
async function setClientShared(sb,row,shared){
 const who=await identity(sb);if(!canManage(who,row))throw Error(tr('Partage réservé à un administrateur.'));
 if(row.state!=='approved'||row.collab_deleting===true)throw Error(tr('Approuvez le document avant de le partager.'));
 if(typeof shared!=='boolean')throw Error(tr('Partage non confirmé. Actualisez les documents.'));
 const saved=await mutate(sb,'update',row,{client_shared:shared});
 if(saved.state!=='approved'||saved.client_shared!==shared)throw Error(tr('Partage non confirmé. Actualisez les documents.'));return saved;
}
async function retryCleanup(sb,id){
 const original=pendingCleanup.get(id);if(!original)throw Error(tr('Aucun témoin de nettoyage pour cette session.'));
 const who=await identity(sb),row=await read(sb,id);
 if(!canUpload(who)||row.uploaded_by!==who.user.id||row.state!=='draft'||row.bucket_id!==original.bucket_id||row.storage_path!==original.storage_path||row.project_id!==original.project_id||row.company_id!==original.company_id)throw Error(tr('Nettoyage non autorisé ; témoin conservé : ')+id);
 try{await removeReserved(sb,row);}catch(e){e.reload=true;throw e;}
 pendingCleanup.delete(id);return id;
}
root.MyEODPortalDocuments={identity,upload,replace,remove,updateNotes,approve,setClientShared,retryCleanup,noteDraft:(userId,id)=>pendingNotes.get(userId+':'+id),pendingCleanups:userId=>Array.from(pendingCleanup.values()).filter(row=>!userId||row.uploaded_by===userId).map(row=>row.id)};
})(typeof window==='undefined'?globalThis:window);
