(function(root){
'use strict';
let sb=null,opts={},revision=0,data=null,selected=null,ready=false,creationRequest=null,operationBusy=false,actorId=null;
const $=id=>document.getElementById(id);
let english=document.documentElement?.lang==='en',messageRender=null,creationRender=null,auditRows=[];
const translations={"Session administrateur requise.": "Administrator session required.", "Votre compte administrateur est protégé : utilisez un autre administrateur pour modifier ses droits.": "Your administrator account is protected: use another administrator to change its permissions.", "Installation serveur en attente : consultation disponible, sauvegarde désactivée.": "Server setup pending: viewing is available, saving is disabled.", "Sélectionnez uniquement les entreprises et projets à autoriser.": "Select only the companies and projects to allow.", "La création de droits administrateur est hors de ce formulaire.": "Administrator permissions cannot be created with this form.", "Chaque projet client exige le rattachement à son entreprise.": "Each client project must be linked to its company.", "Aucun changement à enregistrer.": "No changes to save.", "Enregistrer les droits de ": "Save permissions for ", " ?\nRôle : ": "?\nRole: ", "\nEntreprises : ": "\nCompanies: ", "\nProjets : ": "\nProjects: ", "\nCe compte perdra ses accès métier.": "\nThis account will lose access to business resources.", "\nCe compte perdra tous ses privilèges administrateur.": "\nThis account will lose all administrator privileges.", "Relecture différente : contrôlez les droits et le journal avant tout nouvel essai.": "Readback differs: check permissions and the audit log before trying again.", "Droits enregistrés et relus. Journal : ": "Permissions saved and verified. Audit: ", "Droits déjà identiques.": "Permissions are already identical.", "Enregistrement non confirmé : ": "Save not confirmed: ", ". Actualisez les droits avant de réessayer.": ". Refresh permissions before trying again.", "Mot de passe temporaire : au moins 6 caractères.": "Temporary password: at least 6 characters.", "Créer le compte ": "Create account ", " avec le rôle ": " with role ", "Création en cours…": "Creating account…", "Création non confirmée. Vérifiez la liste des comptes avant de réessayer.": "Creation not confirmed. Check the account list before trying again.", "Réponse de création non confirmée.": "Account creation response not confirmed.", "Compte créé et droits confirmés : ": "Account created and permissions confirmed: ", " — changement du mot de passe requis.": " — password change required.", " Journal : ": " Audit: ", " | entreprises ": " | companies ", " | projets ": " | projects ", " [ID : ": " [ID: ", "Méthode non autorisée.": "Method not allowed.", "Connexion requise.": "Sign-in required.", "Service de création indisponible.": "Account creation service unavailable.", "Session invalide. Reconnectez-vous.": "Invalid session. Sign in again.", "Demande trop volumineuse.": "Request too large.", "Paramètres invalides.": "Invalid parameters.", "Adresse email invalide.": "Invalid email address.", "Nom trop long.": "Name too long.", "Mot de passe temporaire : 6 à 128 caractères.": "Temporary password: 6 to 128 characters.", "Rôle de création non autorisé.": "Account creation role not allowed.", "Identifiant de demande invalide.": "Invalid request identifier.", "Affectations invalides.": "Invalid assignments.", "Accès administrateur requis.": "Administrator access required.", "Affectations non vérifiables. Aucun compte créé.": "Assignments could not be verified. No account created.", "Entreprise ou projet introuvable.": "Company or project not found.", "Vérification du compte indisponible.": "Account verification unavailable.", "Cette adresse possède déjà un compte. Utilisez la gestion des comptes existants.": "This address already has an account. Use existing account management.", "Création Auth non confirmée. Vérifiez la liste des comptes avant de réessayer.": "Auth creation not confirmed. Check the account list before trying again.", "Compte créé ; activation non confirmée. Contrôle administrateur requis.": "Account created; activation not confirmed. Administrator review required.", "Le compte a été modifié depuis sa création. Contrôlez ses droits.": "The account has changed since creation. Check its permissions.", "Compte créé ; droits non confirmés. Contrôle administrateur requis.": "Account created; permissions not confirmed. Administrator review required.", "Compte créé mais accès non activé. Il reste à contrôler dans le backoffice.": "Account created but access not activated. Review it in the backoffice.", "Acces administrateur requis": "Administrator access required", "Acces administrateur actif requis": "Active administrator access required", "Role non autorise dans ce formulaire": "Role not allowed in this form", "Profil introuvable": "Profile not found", "Compte administrateur protege": "Administrator account protected", "Votre compte administrateur est protege": "Your administrator account is protected", "Promotion administrateur non autorisee dans ce formulaire": "Administrator promotion not allowed in this form", "Entreprise introuvable": "Company not found", "Projet introuvable": "Project not found", "Chaque projet client exige le rattachement a son entreprise": "Each client project must be linked to its company", "Les droits ont change. Actualisez avant de sauvegarder.": "Permissions have changed. Refresh before saving."};
const roleNames={fr:{fondateur:'Fondateur',client:'Client',collaborateur:'Collaborateur',revoked:'Révoqué',fournisseur:'Fournisseur'},en:{fondateur:'Founder',client:'Client',collaborateur:'Collaborator',revoked:'Revoked',fournisseur:'Supplier'}};
const t=text=>english?(translations[text]||text):text;
function errorText(error){const text=String(error.message||error);const parts=text.match(/^(.*?)( \[ID\s*:\s*[^\]]+\])$/);return parts?t(parts[1])+parts[2].replace('ID :','ID:'):t(text);}
const roleName=role=>role==='guest'?(english?'Guest':'Invité'):roleNames[english?'en':'fr'][role]||role;
function creationMessage(render){creationRender=typeof render==='function'?render:()=>render;$('create-account-result').textContent=creationRender();}
function renderProfiles(){if(!data)return;const value=$('account-select').value;$('account-select').replaceChildren();for(const profile of data.profiles){const option=document.createElement('option');option.value=profile.id;option.textContent=(profile.full_name||profile.email||profile.id)+' — '+roleName(profile.role);$('account-select').append(option);}if(data.profiles.some(p=>p.id===value))$('account-select').value=value;}
function renderAudit(){
 if(!data)return;$('account-audit').replaceChildren();
 if(ready)for(const row of auditRows){
  const line=document.createElement('p'),who=id=>data.profiles.find(p=>p.id===id)?.email||id;
  const before=row.before_state||{},after=row.after_state||{};
  const prefix=new Date(row.created_at).toLocaleString(english?'en-GB':'fr-FR')+' — '+who(row.actor_id)+' → '+who(row.target_user_id)+' | ';
  let details;
  if(before.project||after.project){
   const project=after.project||before.project,name=data.projects.find(p=>p.id===project)?.name||project;
   const value=v=>JSON.stringify(v??null);
   details=(english?'Project ':'Projet ')+name+' | '+(after.mandate||before.mandate||(english?'Membership':'Membre'))+' : '+value(before.value??before.present)+' → '+value(after.value??after.present);
  }else if(Array.isArray(before.companies)&&Array.isArray(after.companies)&&Array.isArray(before.projects)&&Array.isArray(after.projects)){
   details=roleName(before.role)+' → '+roleName(after.role)+t(' | entreprises ')+before.companies.length+' → '+after.companies.length+t(' | projets ')+before.projects.length+' → '+after.projects.length;
  }else details=(english?'Event: ':'Événement : ')+JSON.stringify(before)+' → '+JSON.stringify(after);
  line.textContent=prefix+details+t(' [ID : ')+row.id+']';$('account-audit').append(line);
 }
}
function setLanguage(en){english=!!en;const panel=$('accounts-panel');if(panel.querySelector){const copy=[
[':scope > h2','Comptes et accès aux projets','Accounts and project access'],
['#create-account-panel > summary','Créer un compte client, collaborateur ou invité','Create a client, collaborator or guest account'],
['#create-account-panel > p','Le compte sera créé avec un mot de passe temporaire à changer à la première connexion. Aucun email n’est envoyé par ce formulaire.','The account will be created with a temporary password that must be changed at first login. This form does not send an email.'],
[':scope > p:not([id])','Gestion des comptes existants. Vous pouvez modifier les droits d’un autre administrateur. Votre propre compte administrateur reste protégé.','Manage existing accounts. You can change another administrator’s permissions. Your own administrator account remains protected.'],
['label[for="create-email"]','Email','Email'],['label[for="create-name"]','Nom complet','Full name'],['label[for="create-role"]','Rôle','Role'],['label[for="create-password"]','Mot de passe temporaire','Temporary password'],['label[for="account-select"]','Compte','Account'],['label[for="account-role"]','Rôle','Role'],
['#create-account-form fieldset:nth-of-type(1) legend','Entreprises autorisées','Allowed companies'],['#create-account-form fieldset:nth-of-type(2) legend','Projets autorisés','Allowed projects'],['#account-form fieldset:nth-of-type(1) legend','Entreprises autorisées','Allowed companies'],['#account-form fieldset:nth-of-type(2) legend','Projets autorisés','Allowed projects'],
['#create-account-save','Créer le compte','Create account'],['#account-refresh','Actualiser les droits','Refresh permissions'],['#account-save','Enregistrer les droits','Save permissions'],[':scope > details:last-of-type > summary','Journal des 20 derniers changements','Audit log: last 20 changes']];
for(const [selector,fr,enText] of copy){const node=panel.querySelector(selector);if(node)node.textContent=english?enText:fr;}
for(const selectId of ['create-role','account-role'])for(const option of $(selectId).querySelectorAll('option'))option.textContent=roleName(option.value);
}renderProfiles();renderAudit();if(messageRender)$('accounts-message').textContent=messageRender();if(creationRender)$('create-account-result').textContent=creationRender();}
const sorted=xs=>[...new Set(xs)].sort();
function snapshot(id){return {role:data.profiles.find(p=>p.id===id).role,companies:sorted(data.companyMembers.filter(p=>p.user_id===id).map(p=>p.company_id)),projects:sorted(data.projectMembers.filter(p=>p.user_id===id).map(p=>p.project_id))};}
function message(render){messageRender=typeof render==='function'?render:()=>render;$('accounts-message').textContent=messageRender();}
function clear(){creationRequest=null;$('create-account-form').reset();creationMessage('');auditRows=[];$('create-companies').replaceChildren();$('create-projects').replaceChildren();revision++;actorId=null;data=null;selected=null;ready=false;$('accounts-panel').hidden=true;$('account-select').replaceChildren();$('account-companies').replaceChildren();$('account-projects').replaceChildren();$('account-audit').replaceChildren();$('account-form').reset();message('');}
function checkboxes(parent,values,selectedValues){$(parent).replaceChildren();for(const item of values){const label=document.createElement('label');label.className='account-choice';const box=document.createElement('input');box.type='checkbox';box.value=item.id;box.checked=selectedValues.includes(item.id);label.append(box,document.createTextNode(item.name));$(parent).append(label);}}
function choose(){selected=$('account-select').value;const profile=data.profiles.find(p=>p.id===selected);if(!profile)return;
 const state=snapshot(selected);$('account-role').value=state.role;checkboxes('account-companies',data.companies,state.companies);checkboxes('account-projects',data.projects.map(p=>({...p,name:p.name+' — '+(data.companies.find(c=>c.id===p.company_id)?.name||'')})),state.projects);
 const protectedAccount=profile.role==='fondateur'&&profile.id===actorId;for(const el of $('account-form').querySelectorAll('input,select,button'))el.disabled=!!opts.readOnly||protectedAccount||!ready;
 $('account-save').disabled=!!opts.readOnly||protectedAccount||!ready;$('account-select').disabled=false;$('account-refresh').disabled=false;
 message(()=>opts.readOnly?(english?'Read only — account creation and access changes are reserved for authorized Super administrators.':'Lecture seule — création de comptes et modification des accès réservées aux Super administrateurs autorisés.'):protectedAccount?t('Votre compte administrateur est protégé : utilisez un autre administrateur pour modifier ses droits.'):!ready?t('Installation serveur en attente : consultation disponible, sauvegarde désactivée.'):t('Sélectionnez uniquement les entreprises et projets à autoriser.'));
}
async function load(client,callbacks){sb=client;opts=callbacks||opts;const rev=++revision;const auth=await sb.auth.getUser();if(auth.error||!auth.data?.user)throw Error(t('Session administrateur requise.'));actorId=auth.data.user.id;
 const tables=['profiles','portal_companies','portal_projects','portal_company_members','portal_project_members','portal_access_audit'];
 const result=await Promise.all(tables.map(table=>table==='portal_access_audit'?sb.from(table).select('id,created_at,actor_id,target_user_id,before_state,after_state').order('created_at',{ascending:false}).limit(20):sb.from(table).select(({profiles:'id,email,full_name,role',portal_companies:'id,name',portal_projects:'id,name,company_id',portal_company_members:'company_id,user_id',portal_project_members:'project_id,user_id'})[table])));
 for(let i=0;i<5;i++)if(result[i].error)throw result[i].error;
 if(rev!==revision)return;
 data={profiles:result[0].data,companies:result[1].data,projects:result[2].data,companyMembers:result[3].data,projectMembers:result[4].data};ready=!result[5].error;
 const prior=selected;renderProfiles();if(data.profiles.some(p=>p.id===prior))$('account-select').value=prior;
 $('accounts-panel').hidden=false;auditRows=result[5].data||[];renderAudit();setLanguage(english);
 const companyValues=values('create-companies'),projectValues=values('create-projects');checkboxes('create-companies',data.companies,companyValues);checkboxes('create-projects',data.projects,projectValues);$('create-account-save').disabled=!!opts.readOnly||!ready;
 const creation=$('create-account-form').closest('details');if(creation)creation.hidden=!!opts.readOnly;
 choose();
}
function values(parent){return sorted([...$(parent).querySelectorAll('input:checked')].map(el=>el.value));}
async function save(e){e.preventDefault();if(opts.readOnly||operationBusy||!ready||!selected)return;const id=selected,expected=snapshot(id),role=$('account-role').value,companies=values('account-companies'),projects=values('account-projects');
 if(expected.role==='fondateur'&&id===actorId)return;
 if(role==='fondateur'&&expected.role!=='fondateur'){message(()=>t('La création de droits administrateur est hors de ce formulaire.'));return;}
 if(role==='client'&&data.projects.some(p=>projects.includes(p.id)&&!companies.includes(p.company_id))){message(()=>t('Chaque projet client exige le rattachement à son entreprise.'));return;}
 const after={role,companies,projects};if(JSON.stringify(after)===JSON.stringify(expected)){message(()=>t('Aucun changement à enregistrer.'));return;}
 const profile=data.profiles.find(p=>p.id===id);
 if(!confirm(t('Enregistrer les droits de ')+(profile.email||profile.id)+t(' ?\nRôle : ')+roleName(expected.role)+' → '+roleName(role)+t('\nEntreprises : ')+companies.length+t('\nProjets : ')+projects.length+(role==='revoked'?t('\nCe compte perdra ses accès métier.'):expected.role==='fondateur'&&role!=='fondateur'?t('\nCe compte perdra tous ses privilèges administrateur.'):'')))return;
 for(const el of $('account-form').querySelectorAll('input,select,button'))el.disabled=true;$('account-select').disabled=true;$('account-refresh').disabled=true;operationBusy=true;$('create-account-save').disabled=true;$('account-save').disabled=true;opts.lock?.(true);const rev=revision;
 try{
  const response=await sb.rpc('myeod_admin_save_access',{target_user_id:id,expected_state:expected,new_role:role,company_ids:companies,project_ids:projects});if(response.error)throw response.error;
  if(rev!==revision)return;
  await load(sb,opts);const actual=snapshot(id);if(JSON.stringify(actual)!==JSON.stringify(after))throw Error(t('Relecture différente : contrôlez les droits et le journal avant tout nouvel essai.'));
  const text=()=>response.data.changed?t('Droits enregistrés et relus. Journal : ')+response.data.audit_id:t('Droits déjà identiques.');message(text);opts.note?.(text());
 }catch(e){if(data&&selected===id){message(()=>t('Enregistrement non confirmé : ')+errorText(e)+t('. Actualisez les droits avant de réessayer.'));opts.error?.(e);}}
 finally{operationBusy=false;opts.lock?.(false);$('create-account-save').disabled=!ready;const locked=!ready||(selected===actorId&&data?.profiles.find(p=>p.id===selected)?.role==='fondateur');for(const el of $('account-form').querySelectorAll('input,select,button'))el.disabled=locked;$('account-select').disabled=false;$('account-refresh').disabled=false;$('account-save').disabled=locked;}
}

async function createAccount(e){
 e.preventDefault();if(opts.readOnly||operationBusy||!ready||!sb)return;
 const fields={email:$('create-email').value.trim(),full_name:$('create-name').value.trim(),role:$('create-role').value,companies:values('create-companies'),projects:values('create-projects')};
 if(fields.role==='guest'&&(fields.companies.length||fields.projects.length)){creationMessage(()=>english?'Guests require project mandates, without company/project memberships.':'Invité : utiliser les mandats projet, sans rattachement entreprise/projet.');return;}
 if(fields.role==='client'&&data.projects.some(p=>fields.projects.includes(p.id)&&!fields.companies.includes(p.company_id))){creationMessage(()=>t('Chaque projet client exige le rattachement à son entreprise.'));return;}
 if($('create-password').value.length<6){creationMessage(()=>t('Mot de passe temporaire : au moins 6 caractères.'));return;}
 if(!confirm(t('Créer le compte ')+fields.email+t(' avec le rôle ')+roleName(fields.role)+' ?'))return;
 const fingerprint=JSON.stringify(fields);if(!creationRequest||creationRequest.fingerprint!==fingerprint)creationRequest={id:crypto.randomUUID(),fingerprint};
 const body={...fields,request_id:creationRequest.id,password:$('create-password').value};$('create-password').value='';
 operationBusy=true;for(const el of $('account-form').querySelectorAll('input,select,button'))el.disabled=true;$('account-select').disabled=true;$('account-refresh').disabled=true;for(const el of $('create-account-form').querySelectorAll('input,select,button'))el.disabled=true;$('create-account-save').disabled=true;opts.lock?.(true);const rev=revision;creationMessage(()=>t('Création en cours…'));
 try{
  const result=await sb.functions.invoke('create-portal-account',{body});body.password='';
  if(rev!==revision)return;
  if(result.error){let detail;try{detail=await result.error.context?.json();}catch{}throw Error((detail?.error||'Création non confirmée. Vérifiez la liste des comptes avant de réessayer.')+(detail?.user_id?' [ID : '+detail.user_id+']':''));}
  if(!result.data?.user_id)throw Error('Réponse de création non confirmée.');
  const text=()=>t('Compte créé et droits confirmés : ')+fields.email+t(' [ID : ')+result.data.user_id+']'+(result.data.must_change_password?t(' — changement du mot de passe requis.'):'')+(result.data.audit_id?t(' Journal : ')+result.data.audit_id:'');
  creationRequest=null;$('create-account-form').reset();creationMessage(text);opts.note?.(text());
  try{await load(sb,opts);$('account-select').value=result.data.user_id;choose();}catch(e){opts.error?.(e);}
 }catch(e){if(data)creationMessage(()=>errorText(e));}
 finally{body.password='';operationBusy=false;opts.lock?.(false);for(const el of $('create-account-form').querySelectorAll('input,select,button'))el.disabled=!ready;for(const el of $('account-form').querySelectorAll('input,select,button'))el.disabled=!ready||(selected===actorId&&data?.profiles.find(p=>p.id===selected)?.role==='fondateur');$('account-select').disabled=false;$('account-refresh').disabled=false;$('create-account-save').disabled=!ready;}
}
$('create-account-form').addEventListener('submit',createAccount);

$('account-select').onchange=choose;$('account-form').addEventListener('submit',save);
$('account-refresh').onclick=async()=>{if(operationBusy)return;try{await load(sb,opts);}catch(e){message(()=>errorText(e));opts.error?.(e);}};
root.MyEODAdminAccounts={load,clear,setLanguage};setLanguage(english);
})(window);
