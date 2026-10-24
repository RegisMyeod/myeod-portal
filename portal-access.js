/* Intégration locale de recette : connexion, rôle, projets et lecture privée. */
(function(){
'use strict';
let en=document.documentElement.lang==='en';
const entryRole=document.body.dataset.accessRole;let expected=entryRole;let profileName='';
const t=(fr,eng)=>en?eng:fr,$=id=>document.getElementById(id);
const sb=window.supabase.createClient('https://kewhxzitwdrnpsnzlihn.supabase.co','sb_publishable_owbl6MuPlOfMYAOPMxQ8Hg_deQuxLWi',{auth:(window.MyEODSSOConfig&&window.MyEODSSOConfig.enabled===true)?{persistSession:true,flowType:'pkce',detectSessionInUrl:false,storageKey:'myeod-integrated-access',storage:window.MyEODSSO.createPKCEStorage({getItem:k=>sessionStorage.getItem(k),setItem:(k,v)=>sessionStorage.setItem(k,v),removeItem:k=>{try{sessionStorage.removeItem(k);}catch(_){}}},'myeod-integrated-access')}:{persistSession:false,storageKey:'myeod-integrated-access'},global:{fetch:window.MyEODPrivateFetch}});
let busy=false,revision=0,currentUser=null,cachedView=null;
const scoped=window.MyEODAccessPolicyMode==='scoped-v48';let accessContext=null,accessView=null,returnChoice=null,actualProfileRole=null;
const canManageDocuments=()=>scoped?accessView?.manageDocuments===true:expected==='fondateur';
const isCollaborator=()=>scoped?accessView?.collaborator===true:expected==='collaborateur';
const canDownload=()=>!scoped||accessView?.download===true;
const canUpload=()=>isCollaborator()||(scoped&&(accessView?.mode==='project_manager'||accessView?.manageProjects));
function clearPanels(){window.MyEODProjectMembers?.clear();window.MyEODInternalPages?.clear();window.MyEODAdminProjects?.clear();window.MyEODAdminAccounts?.clear();}
function renderContextControls(){
 const panel=$('access-context-controls');if(!panel)return;panel.replaceChildren();panel.hidden=!scoped||!accessView;
 if(panel.hidden)return;
 const label=document.createElement('label'),select=document.createElement('select'),button=document.createElement('button');label.textContent=t('Rôle et projet actif','Active role and project');select.id='access-context-choice';label.htmlFor=select.id;
 for(const [i,choice] of accessView.choices.entries()){const option=document.createElement('option');option.value=String(i);option.textContent=choice.label;option.selected=choice.mode===accessView.mode&&choice.project_id===accessView.project_id;select.append(option);}
 button.type='button';button.textContent=t('Ouvrir ce contexte','Open this context');button.onclick=()=>switchContext(accessView.choices[Number(select.value)]);panel.append(label,select,button);
 if(accessView.mode==='client_preview'&&returnChoice){const back=document.createElement('button');back.type='button';back.textContent=t('Revenir à mon rôle','Return to my role');back.onclick=()=>switchContext(returnChoice);panel.append(back);}
}
async function switchContext(choice){
 if(busy||!choice)return;busy=true;lockActions(true);
 const old=accessView;if(choice.mode==='client_preview'&&old?.mode!=='client_preview')returnChoice={mode:old.mode,project_id:old.project_id};
 revision++;clearPanels();cachedView=null;$('documents').replaceChildren();$('workspace').hidden=true;$('upload-area').hidden=true;
 try{await accessContext.change(choice);await load();}catch(e){accessContext?.clear();accessView=null;sessionLabel(currentUser);try{await load();}catch(reload){clear();showError(reload);}showError(e);}finally{busy=false;lockActions(false);}
}
function sessionLabel(user){
 const role=accessView?.role||(expected==='fondateur'?t('Fondateur','Founder'):expected==='client'?t('Client','Client'):t('Collaborateur','Collaborator'));
 const base=entryRole==='fondateur'?t('Accès fondateur','Founder access'):entryRole==='client'?t('Espace Client','Client area'):t('Espace Collaborateurs','Collaborator area');
 const heading=user?t('Espace ','')+role+(en?' portal':''):base;
 document.title=user?role+' — '+(profileName||user.email)+' | MyEOD':base+' — MyEOD';
 const header=document.querySelector?.('.myeod-header-content-label');if(header)header.textContent=heading;
 const badge=$('connected-role');if(badge){badge.textContent=user?'"'+role+'"':'';badge.hidden=!user;}
 const actions=$('session-actions');if(actions)actions.hidden=!user;
 $('identity').textContent=user?(profileName.trim()||t('Nom non renseigné','Name not provided')):'';
 if($('connected-position')){$('connected-position').textContent=user?accessView?.position||'':'';$('connected-position').hidden=!user||!accessView?.position;}
 if($('context-notice')){$('context-notice').textContent=user?accessView?.notice||'':'';$('context-notice').hidden=!user||!accessView?.notice;}
 window.MyEODTools?.render(user?expected:null,en,accessView?.project_id);
 renderContextControls();

}
function passwordRequired(){const e=Error(t('Veuillez choisir votre nouveau mot de passe.','Please choose your new password.'));e.code='PASSWORD_REQUIRED';return e;}
function showPassword(required=true){window.MyEODProjectMembers?.clear();window.MyEODInternalPages?.clear();window.MyEODAdminProjects?.clear();window.MyEODAdminAccounts?.clear();if($('admin-overview'))$('admin-overview').hidden=true;revision++;$('workspace').hidden=true;$('upload-area').hidden=true;$('login-area').hidden=true;$('password-area').hidden=false;sessionLabel(currentUser);$('refresh').disabled=true;$('change-password').disabled=true;$('documents').replaceChildren();$('projects').replaceChildren();$('password-form').reset();$('back-password').hidden=required;$('message').textContent=required?t('Un changement de mot de passe est requis.','A password change is required.'):t('Choisissez votre nouveau mot de passe.','Choose your new password.');$('new-password').focus();}
function note(msg){$('access-log').textContent+='\n'+msg;}
function showError(e){const raw=String(e?.message||e);const msg=/failed to fetch|networkerror|network request failed/i.test(raw)?t('Connexion réseau indisponible. Rétablissez Internet puis réessayez.','Network unavailable. Restore your connection and try again.'):/invalid login credentials/i.test(raw)?t('Email ou mot de passe incorrect.','Incorrect email or password.'):raw;$('message').textContent=msg;note(msg);}
function clear(){window.MyEODProjectMembers?.clear();accessContext?.clear();accessContext=null;accessView=null;returnChoice=null;window.MyEODInternalPages?.clear();window.MyEODAdminProjects?.clear();window.MyEODAdminAccounts?.clear();if($('admin-overview'))$('admin-overview').hidden=true;revision++;expected=entryRole;currentUser=null;cachedView=null;$('upload-area').hidden=true;$('upload-form').reset();$('upload-result').textContent='';$('cleanup-panel').replaceChildren();$('password-area').hidden=true;$('password-form').reset();$('workspace').hidden=true;$('login-area').hidden=false;$('documents').replaceChildren();$('projects').replaceChildren();$('identity').textContent='';profileName='';sessionLabel(null);}
async function identity(allowPasswordChange=false,allowContextChange=false){
 const previousContext=accessView&&{mode:accessView.mode,project_id:accessView.project_id};
 const u=await sb.auth.getUser();if(u.error||!u.data.user)throw u.error||Error(t('Reconnectez-vous.','Please sign in again.'));
 const p=await sb.from('profiles').select('role,must_change_password,full_name').eq('id',u.data.user.id).single();
 if(p.error)throw Error(t('Profil indisponible. Accès non autorisé.','Profile unavailable. Access denied.'));
 if(!scoped&&p.data.role!==entryRole&&!(entryRole==='collaborateur'&&p.data.role==='fondateur'))throw Error(t('Accès refusé : utilisez l’espace correspondant à votre rôle.','Access denied: use the portal for your role.'));
 currentUser=u.data.user;actualProfileRole=p.data.role;profileName=String(p.data.full_name||'').trim();
 if(p.data.must_change_password!==false&&!allowPasswordChange){expected=p.data.role;throw passwordRequired();}
 if(!scoped&&p.data.role==='fondateur'&&p.data.must_change_password===false){const admin=await sb.rpc('myeod_admin_can_create_accounts');if(admin.error||admin.data!==true){window.MyEODAdminAccounts?.clear();window.MyEODAdminProjects?.clear();expected=entryRole;throw Error(t('Accès administrateur non autorisé.','Administrator access denied.'));}}
 if(expected==='fondateur'&&p.data.role!=='fondateur'){window.MyEODAdminAccounts?.clear();window.MyEODAdminProjects?.clear();}
 expected=p.data.role;profileName=p.data.full_name||'';
 if(scoped&&!allowPasswordChange){
  if(!window.MyEODAccessContext)throw Error(t('Module de contexte indisponible.','Access context module unavailable.'));
  if(!accessContext)accessContext=window.MyEODAccessContext.create(sb,u.data.user.id);
  try{accessView=await accessContext.refresh();
   if(!accessView.mode){await accessContext.change(accessView.choices[0]);accessView=accessContext.view();}
  }catch(error){clear();throw error;}
  if(previousContext&&!allowContextChange&&(previousContext.mode!==accessView.mode||previousContext.project_id!==accessView.project_id)){
   revision++;clearPanels();cachedView=null;$('documents').replaceChildren();$('projects').replaceChildren();$('workspace').hidden=true;$('upload-area').hidden=true;
   await load();throw Error(t('Vos accès ont changé. La vue a été actualisée ; relancez votre action dans le contexte autorisé.','Your access has changed. The view was refreshed; restart your action in the authorized context.'));
  }
  expected=accessView.mode==='administration'?'fondateur':accessView.mode==='collaborator'||accessView.mode==='project_manager'?'collaborateur':accessView.mode==='client'||accessView.mode==='client_preview'?'client':'guest';
 }
 return u.data.user;
}
async function load(){
 const previousRoute=cachedView?window.MyEODInternalPages?.route():null;
 const rev=revision,user=await identity(false,true);
 const result=await Promise.all([sb.from('portal_projects').select('id,name,company_id'),sb.from('portal_documents').select('id,project_id,bucket_id,storage_path,filename,notes,state,uploaded_by,client_shared,collab_revision,collab_deleting,file_version,replaces_document_id')]);
 for(const r of result)if(r.error)throw r.error;
 if(rev!==revision)return;
 if((scoped?accessView?.readGlobalAccounts||accessView?.globalAccounts:expected==='fondateur')&&window.MyEODAdminAccounts){await window.MyEODAdminAccounts.load(sb,{readOnly:scoped&&!accessView?.globalAccounts,note,error:showError,lock:value=>{busy=value;lockActions(value);}});if(rev!==revision)return;}
 if((scoped?accessView?.manageProjects:expected==='fondateur')&&window.MyEODAdminProjects){await window.MyEODAdminProjects.load(sb,{note,error:showError,lock:value=>{busy=value;lockActions(value);}});if(rev!==revision)return;}
 const projects=result[0].data,docs=result[1].data;currentUser=user;cachedView={projects,docs,user};
 if(window.MyEODInternalPages){const mode=accessView?.mode,project=accessView?.project_id;await window.MyEODInternalPages.load(sb,{role:expected,user,profileRole:actualProfileRole,accessView:scoped?accessView:null,verifyContext:scoped?async()=>{const v=await accessContext.refresh();return v.mode===mode&&v.project_id===project;}:null,error:showError,revoke:clear,clearError:()=>{$('message').textContent='';}});if(rev!==revision)return;}
 if(scoped&&!['administration','collaborator'].includes(accessView.mode)){
  if($('projects-workspace'))$('projects-workspace').hidden=false;
  if($('it-workspace'))$('it-workspace').hidden=true;
 }
 if(scoped&&window.MyEODProjectMembers){await window.MyEODProjectMembers.load(sb,{projects,view:accessView,note,error:showError,lock:value=>{busy=value;lockActions(value);}});if(rev!==revision)return;}
 configureUpload(projects);renderCleanup();
 if($('admin-overview'))$('admin-overview').hidden=scoped?!(accessView?.globalAccounts||accessView?.manageProjects):expected!=='fondateur';
 sessionLabel(user);$('refresh').disabled=false;$('change-password').disabled=false;$('change-password').hidden=currentUser?.app_metadata?.myeod_sso_only===true;
 $('projects').textContent=t('Projets accessibles : ','Accessible projects: ')+(projects.map(p=>p.name).join(', ')||t('Aucun projet attribué.','No assigned project.'));
 const table=renderDocuments(projects,docs,user);
 $('password-area').hidden=true;$('documents').replaceChildren(table);$('workspace').hidden=false;$('login-area').hidden=true;$('message').textContent='';note(t('Lecture : ','Read: ')+projects.length+t(' projet(s), ',' project(s), ')+docs.length+t(' document(s).',' document(s).'));
 if(previousRoute)try{await window.MyEODInternalPages.resume(previousRoute);}catch(e){showError(e);}
}
function documentDialog(title,value){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog'),form=document.createElement('form'),heading=document.createElement('h2'),field=document.createElement('textarea'),save=document.createElement('button'),cancel=document.createElement('button');
  dialog.id='document-note-dialog';heading.id='document-note-title';heading.textContent=title;dialog.setAttribute('aria-labelledby',heading.id);field.id='document-note-value';field.setAttribute('aria-label',title);field.value=value;field.rows=6;field.style.width='100%';save.type='submit';save.textContent=t('Enregistrer la note','Save note');cancel.type='button';cancel.textContent=t('Annuler','Cancel');
  const finish=result=>{dialog.close();dialog.remove();resolve(result);};form.onsubmit=event=>{event.preventDefault();finish(field.value);};cancel.onclick=()=>finish(null);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null);});form.append(heading,field,save,cancel);dialog.append(form);document.body.append(dialog);dialog.showModal();field.focus();
 });
}
function documentReplacementDialog(row){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog'),form=document.createElement('form'),heading=document.createElement('h2'),description=document.createElement('p'),label=document.createElement('label'),field=document.createElement('input'),send=document.createElement('button'),cancel=document.createElement('button');
  dialog.id='document-replacement-dialog';heading.id='document-replacement-title';heading.textContent=t('Nouvelle version : ','New version: ')+row.filename;dialog.setAttribute('aria-labelledby',heading.id);
  description.textContent=t('Le fichier précédent sera conservé. La nouvelle version restera en brouillon, sans partage client automatique.','The previous file will be retained. The new version will remain a draft, with no automatic client sharing.');
  field.id='document-replacement-file';field.type='file';field.required=true;label.htmlFor=field.id;label.textContent=t('Fichier de la nouvelle version','New version file');send.type='submit';send.textContent=t('Envoyer la nouvelle version','Upload new version');cancel.type='button';cancel.textContent=t('Annuler','Cancel');
  const finish=result=>{dialog.close();dialog.remove();resolve(result);};form.onsubmit=e=>{e.preventDefault();if(field.files?.length===1)finish(field.files[0]);};cancel.onclick=()=>finish(null);dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null);});form.append(heading,description,label,field,send,cancel);dialog.append(form);document.body.append(dialog);dialog.showModal();field.focus();
 });
}
function renderDocuments(projects,docs,user){
 const table=document.createElement('table'),head=table.createTHead().insertRow();
 for(const label of [t('Document / note','Document / note'),t('Projet','Project'),t('Statut','Status'),t('Action','Action')]){const h=document.createElement('th');h.textContent=label;head.append(h);}
 for(const row of docs){const hasNewerVersion=docs.some(other=>other.replaces_document_id===row.id);const tr=table.insertRow();tr.insertCell().textContent=row.filename+(Number.isSafeInteger(row.file_version)?' — v'+row.file_version:'')+(row.notes?' — '+row.notes:'')+(expected==='fondateur'?' [ID : '+row.id+']':'');tr.insertCell().textContent=projects.find(p=>p.id===row.project_id)?.name||'';tr.insertCell().textContent=({draft:t('Brouillon','Draft'),submitted:t('Soumis','Submitted'),approved:t('Approuvé','Approved')})[row.state]||row.state;
 if(expected==='fondateur')tr.cells[2].textContent+=' — '+(row.client_shared?t('Partagé au client','Shared with client'):t('Non partagé','Not shared'));
 const actions=tr.insertCell();
 if(canDownload()){const button=document.createElement('button');button.type='button';button.textContent=t('Télécharger','Download');button.onclick=async()=>{button.disabled=true;try{await identity();if(!canDownload())throw Error(t('Téléchargement interdit dans ce contexte.','Download is forbidden in this context.'));const r=await sb.storage.from(row.bucket_id).download(row.storage_path);if(r.error)throw r.error;const url=URL.createObjectURL(r.data),a=document.createElement('a');a.href=url;a.download=row.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('message').textContent='';note(t('Téléchargement réussi : ','Download successful: ')+row.filename+' ('+r.data.size+' '+t('octets','bytes')+')');}catch(e){const unavailable=/object not found|resource not found|not authorized|permission denied|access denied/i.test(String(e?.message||''))||[403,404].includes(Number(e?.statusCode));showError(unavailable?Error(t('Document indisponible ou accès retiré. Actualisez la liste de vos documents.','Document unavailable or access removed. Refresh your document list.')):e);}finally{button.disabled=false;}};actions.append(button);}else{actions.textContent=t('Consultation des métadonnées','View metadata');}
 if(canManageDocuments()||(isCollaborator()&&row.uploaded_by===user.id&&row.state==='draft')){
  const edit=document.createElement('button');edit.type='button';edit.textContent=t('Modifier la note','Edit note');edit.onclick=()=>runDocumentAction(edit,async()=>{const value=await documentDialog(t('Note du document','Document note'),window.MyEODPortalDocuments.noteDraft(user.id,row.id)??row.notes??'');if(value===null)return;await window.MyEODPortalDocuments.updateNotes(sb,row,value,user.id);note(t('Note modifiée : ','Note updated: ')+row.id);});edit.disabled=row.collab_deleting===true;actions.append(edit);
  if(Number.isSafeInteger(row.file_version)&&row.file_version>=1&&!hasNewerVersion&&!row.collab_deleting){const replace=document.createElement('button');replace.type='button';replace.textContent=t('Nouvelle version','New version');replace.onclick=()=>runDocumentAction(replace,async()=>{const file=await documentReplacementDialog(row);if(!file)return;const saved=await window.MyEODPortalDocuments.replace(sb,row,file);note(t('Nouvelle version envoyée : ','New version uploaded: ')+saved.filename+' — v'+saved.file_version);});actions.append(replace);}
  const del=document.createElement('button');del.type='button';del.textContent=row.collab_deleting?t('Reprendre la suppression','Resume deletion'):t('Supprimer','Delete');del.disabled=hasNewerVersion;if(hasNewerVersion)del.title=t('Supprimez les versions suivantes avant celle-ci.','Delete newer versions before this one.');del.onclick=()=>runDocumentAction(del,async()=>{if(!confirm(t('Supprimer ce document : ','Delete this document: ')+row.filename+' ?'))return;await window.MyEODPortalDocuments.remove(sb,row);note(t('Fichier et métadonnées supprimés : ','File and metadata deleted: ')+row.id);});actions.append(del);
 }

 if(canManageDocuments()&&['draft','submitted'].includes(row.state)){
  const approve=document.createElement('button');approve.type='button';approve.textContent=t('Approuver','Approve');approve.onclick=()=>runDocumentAction(approve,async()=>{if(!confirm(t('Approuver ce document sans le partager au client : ','Approve this document without sharing it with the client: ')+row.filename+' ?'))return;await window.MyEODPortalDocuments.approve(sb,row);note(t('Approbation confirmée : ','Approval confirmed: ')+row.id);});approve.disabled=row.collab_deleting===true;actions.append(approve);
 }
 if(canManageDocuments()&&row.state==='approved'){
  const share=document.createElement('button');share.type='button';share.textContent=row.client_shared?t('Retirer le partage client','Remove client sharing'):t('Partager au client','Share with client');share.onclick=()=>runDocumentAction(share,async()=>{const value=!row.client_shared;if(!confirm((value?t('Partager ce document avec les clients autorisés de ce projet : ','Share this document with the authorized clients of this project: '):t('Retirer le partage de ce document : ','Remove sharing for this document: '))+row.filename+' ?'))return;await window.MyEODPortalDocuments.setClientShared(sb,row,value);note((value?t('Partage client confirmé : ','Client sharing confirmed: '):t('Partage client retiré : ','Client sharing removed: '))+row.id);});share.disabled=row.collab_deleting===true;actions.append(share);
 }
 }
 return table;
}
$('login-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;const b=e.submitter||$('login-form').querySelector('button[type="submit"]');const label=b.textContent;b.disabled=true;b.textContent=t('Connexion…','Signing in…');$('message').textContent='';try{const r=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});$('password').value='';if(r.error)throw r.error;await load();}catch(e){if(e.code==='PASSWORD_REQUIRED'){showPassword();}else{clear();await sb.auth.signOut({scope:'local'}).catch(()=>{});showError(e);}}finally{busy=false;b.disabled=false;b.textContent=label;}});


function configureUpload(projects){
 $('upload-area').hidden=!canUpload();
 if(!canUpload())return;
 const selected=$('upload-project').value;$('upload-project').replaceChildren();
 for(const project of projects){const option=document.createElement('option');option.value=project.id;option.textContent=project.name;$('upload-project').append(option);}
 if(projects.some(p=>p.id===selected))$('upload-project').value=selected;
 $('upload-send').disabled=!projects.length;
}
function renderCleanup(){
 $('cleanup-panel').replaceChildren();if(!canUpload()||!currentUser)return;
 for(const id of window.MyEODPortalDocuments.pendingCleanups(currentUser.id)){
  const label=document.createElement('p');label.textContent=t('Nettoyage à reprendre : ','Cleanup pending: ')+id;
  const button=document.createElement('button');button.type='button';button.textContent=t('Reprendre le nettoyage après retour du réseau','Resume cleanup after connection returns');
  button.onclick=()=>runDocumentAction(button,async()=>{await window.MyEODPortalDocuments.retryCleanup(sb,id);note(t('Nettoyage repris ; fichier et métadonnées supprimés : ','Cleanup resumed; file and metadata deleted: ')+id);});
  $('cleanup-panel').append(label,button);
 }
}
let adminControlSnapshot=null;
function lockActions(locked){
 for(const id of ['logout','change-password','refresh','upload-send'])$(id).disabled=locked;
 for(const el of $('access-context-controls')?.querySelectorAll('select,button')||[])el.disabled=locked;
 if(locked&&!adminControlSnapshot){adminControlSnapshot=[];for(const id of ['accounts-panel','admin-projects-panel','project-members-panel'])for(const el of $(id)?.querySelectorAll('input,select,button')||[]){adminControlSnapshot.push([el,el.disabled]);el.disabled=true;}}
 else if(!locked&&adminControlSnapshot){for(const [el,disabled] of adminControlSnapshot)el.disabled=disabled;adminControlSnapshot=null;}
}
async function runDocumentAction(button,action){
 if(busy)return;busy=true;button.disabled=true;lockActions(true);
 try{await identity();await action();await load();}catch(e){if(e.reload)try{await load();}catch(refresh){showError(refresh);}showError(e);renderCleanup();}finally{busy=false;button.disabled=false;lockActions(false);}
}
$('upload-form').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 const file=$('upload-file').files[0];if(!file)return;
 busy=true;lockActions(true);const rev=revision;
 $('upload-result').textContent=t('Envoi en cours…','Uploading…');
 try{
  await identity();if(!canUpload())throw Error(t('Envoi interdit dans ce contexte.','Upload is forbidden in this context.'));const row=await window.MyEODPortalDocuments.upload(sb,{id:$('upload-project').value},file,$('upload-notes').value);
  if(rev!==revision)return;
  const text=t('1 envoyé · 0 échec — ','1 sent · 0 failed — ')+row.filename+' [ID : '+row.id+']';$('upload-result').textContent=text;note(text);$('upload-file').value='';$('upload-notes').value='';
  try{await load();}catch(e){showError(e);}
 }catch(e){if(rev===revision){const text=t('0 envoyé · 1 échec — ','0 sent · 1 failed — ')+String(e.message||e);$('upload-result').textContent=text;note(text);showError(e);renderCleanup();}}
 finally{busy=false;lockActions(false);}
});

$('password-form').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;busy=true;const button=$('save-password');button.disabled=true;$('cancel-password').disabled=true;$('back-password').disabled=true;$('message').textContent='';
 try{
  const password=$('new-password').value;
  if(password.length<6)throw Error(t('Utilisez au moins 6 caractères.','Use at least 6 characters.'));
  if(password!==$('confirm-password').value)throw Error(t('Les mots de passe ne correspondent pas.','The passwords do not match.'));
  const rev=revision,user=await identity(true);
  const result=await sb.auth.updateUser({password});
  if(result.error)throw result.error;
  $('password-form').reset();
  if(!result.data.user||result.data.user.id!==user.id||rev!==revision)throw Error(t('Session modifiée. Reconnectez-vous.','Session changed. Please sign in again.'));
  // Le déclencheur serveur lève l'obligation uniquement si Auth modifie le hash.
  await identity();
  note(t('Changement de mot de passe confirmé par le serveur.','Password change confirmed by the server.'));
  await load();
  $('message').textContent=t('Votre mot de passe a été modifié.','Your password has been changed.');
 }catch(e){if(e.code==='PASSWORD_REQUIRED'){$('message').textContent=t('La confirmation serveur est encore requise. Réessayez avec un autre nouveau mot de passe ou reconnectez-vous.','Server confirmation is still required. Retry with a different new password or sign in again.');note($('message').textContent);}else{showError(e);}}
 finally{busy=false;button.disabled=false;$('cancel-password').disabled=false;$('back-password').disabled=false;}
});
$('cancel-password').onclick=async()=>{if(busy)return;clear();const r=await sb.auth.signOut({scope:'local'});if(r.error)showError(r.error);else $('message').textContent='';};
$('change-password').onclick=async()=>{if(busy)return;busy=true;try{await identity();showPassword(false);}catch(e){if(e.code==='PASSWORD_REQUIRED')showPassword();else showError(e);}finally{busy=false;}};
$('back-password').onclick=async()=>{if(busy)return;busy=true;try{$('password-form').reset();await load();}catch(e){if(e.code==='PASSWORD_REQUIRED')showPassword();else showError(e);}finally{busy=false;}};
$('refresh').onclick=async()=>{if(busy)return;const b=$('refresh');b.disabled=true;try{await load();}catch(e){showError(e);}finally{b.disabled=false;}};
$('logout').onclick=async()=>{if(busy)return;const b=$('logout');b.disabled=true;try{const r=await sb.auth.signOut();if(r.error)throw r.error;clear();$('email').value='';$('password').value='';$('message').textContent='';note(t('Déconnexion confirmée.','Signed out.'));if(window.MyEODSSOAfterSignOut&&window.MyEODSSOAfterSignOut())return;}catch(e){showError(e);}finally{b.disabled=false;}};

// Translate this document without navigating or transferring Auth tokens.
if(window.MyEODPortalLanguage&&$('lang-btn')){
 $('lang-btn').onclick=()=>{
  if(busy)return;
  en=!en;window.MyEODPortalLanguage.apply(entryRole,en);window.MyEODAdminProjects?.setLanguage?.(en);window.MyEODAdminAccounts?.setLanguage?.(en);
  document.documentElement.lang=en?'en':'fr';window.MyEODProjectMembers?.setLanguage();if(scoped)accessView=accessContext?.view()||null;if(!scoped||['administration','collaborator'].includes(accessView?.mode))window.MyEODInternalPages?.setLanguage();sessionLabel(!$('login-area').hidden?null:currentUser);
  $('lang-current').textContent=en?'EN':'FR';$('lang-other').textContent=en?'FR':'EN';
  $('message').textContent=window.MyEODPortalLanguage.message($('message').textContent,en);
  if(cachedView&&!$('workspace').hidden){
   const {projects,docs,user}=cachedView;
   $('projects').textContent=t('Projets accessibles : ','Accessible projects: ')+(projects.map(p=>p.name).join(', ')||t('Aucun projet attribué.','No assigned project.'));
   $('documents').replaceChildren(renderDocuments(projects,docs,user));renderCleanup();
  }
 };
}
const headerBack=document.querySelector('.btn-nav-back');
if(headerBack)headerBack.onclick=()=>{if(busy)return;if(window.MyEODInternalPages?.route()){window.MyEODInternalPages.home();return;}window.location.href=en?'index-en.html':'index.html';};
sessionLabel(null);
sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')clear();});
window.MyEODSSOUI({client:sb,config:window.MyEODSSOConfig,load,clear,isBusy:()=>busy,setBusy:value=>{busy=value;}});
})();
