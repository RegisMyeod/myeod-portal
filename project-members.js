(function(root){'use strict';
let sb,host,config,selected=null,projectId=null,generation=0,busy=false;
const t=(fr,en)=>root.document.documentElement.lang==='en'?en:fr;
const element=(tag,text)=>{const e=root.document.createElement(tag);if(text)e.textContent=text;return e;};
function clear(){generation++;host?.remove();host=null;sb=null;selected=null;projectId=null;busy=false;}
function eligible(view){return view?.mode==='project_manager'||view?.manageProjects===true;}
function result(r){if(r.error)throw Object.assign(Error(r.error.message),{code:r.error.code});return r.data;}
async function load(client,options){
 clear();config=options;if(root.MyEODAccessPolicyMode!=='scoped-v48'||!eligible(options.view))return;
 sb=client;const ticket=generation;host=element('section');host.id='project-members-panel';
 host.append(element('h2',t('Membres du projet','Project members')));
 const form=element('form'),project=element('select'),email=element('input'),lookup=element('button'),status=element('p'),targetBox=element('div');
 project.id='member-project';email.id='member-email';email.type='email';email.required=true;email.maxLength=254;lookup.type='submit';lookup.textContent=t('Rechercher ce compte','Find this account');
 for(const p of options.projects){if(options.view.mode==='project_manager'&&p.id!==options.view.project_id)continue;const opt=element('option',p.name);opt.value=p.id;project.append(opt);}
 if(!project.children.length){clear();return;}projectId=project.children[0].value;project.value=projectId;
 const pl=element('label',t('Projet','Project'));pl.htmlFor=project.id;const el=element('label',t('Email exact du compte existant','Exact email of the existing account'));el.htmlFor=email.id;
 form.append(pl,project,el,email,lookup);host.append(form,targetBox,status);
 (root.document.getElementById('projects-workspace')||root.document.getElementById('workspace')).append(host);
 project.onchange=()=>{if(busy)return;generation++;projectId=project.value;selected=null;targetBox.replaceChildren();};
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;const turn=generation;busy=true;config.lock?.(true);selected=null;targetBox.replaceChildren();lookup.disabled=true;project.disabled=true;status.textContent='';
  try{
   const row=result(await sb.rpc('myeod_project_member_lookup_v50',{project_id:projectId,email_address:email.value.trim()}));if(turn!==generation)return;
   if(!row||!['client','collaborateur'].includes(row.role)||typeof row.member!=='boolean'){status.textContent=t('Compte non disponible pour ce projet.','Account unavailable for this project.');return;}
   selected={...row,project_id:projectId};targetBox.append(element('p',row.full_name+' — '+(row.role==='client'?'Client':t('Collaborateur','Collaborator'))));
   const save=element('button',row.member?t('Retirer du projet','Remove from project'):t('Ajouter au projet','Add to project'));save.type='button';targetBox.append(save);
   save.onclick=async()=>{
    if(busy||!selected)return;const member=selected;const turn=generation;const present=!member.member;
    if(!root.confirm((present?t('Ajouter ce compte à ce projet ?','Add this account to this project?'):t('Retirer ce compte de ce projet ?','Remove this account from this project?'))))return;
    busy=true;config.lock?.(true);save.disabled=true;project.disabled=true;lookup.disabled=true;
    try{const saved=result(await sb.rpc('myeod_set_project_member_v48',{target:member.id,project_id:member.project_id,present,expected_present:member.member}));
     if(turn!==generation)return;if(saved!==present)throw Error(t('Modification non confirmée.','Change not confirmed.'));
     selected=null;targetBox.replaceChildren();status.textContent=t('Accès au projet mis à jour.','Project access updated.');config.note?.(status.textContent);
    }catch(error){if(turn===generation){selected=null;targetBox.replaceChildren();status.textContent=error.message;config.error?.(error);}}
    finally{busy=false;config.lock?.(false);project.disabled=false;lookup.disabled=false;}
   };
  }catch(error){if(turn===generation){status.textContent=error.message;config.error?.(error);}}
  finally{busy=false;config.lock?.(false);lookup.disabled=false;project.disabled=false;}
 });
}
root.MyEODProjectMembers={load,clear,setLanguage:()=>{if(sb)load(sb,config);}};
})(typeof window==='undefined'?globalThis:window);
