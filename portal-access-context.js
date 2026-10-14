/* Context choices come only from the authenticated server bootstrap.
   This is presentation, never a substitute for SQL/endpoint authorization. */
(function(){'use strict';
const labels={administration:['Administration','Administration'],super_administrator:['Super administrateur','Super Administrator'],grand_administrator:['Grand administrateur','Grand Administrator'],collaborator:['Collaborateur','Collaborator'],client:['Client','Client'],project_manager:['Chef de projet','Project Manager'],guest_client:['Invité','Guest'],guest_collaborator:['Invité','Guest'],client_preview:['Client','Client']};
function create(sb,userId){
 let data=null,epoch=0,refreshing=null;
 const language=()=>document.documentElement.lang==='en'?1:0;
 const denied=()=>Error(language()?'Access denied. Please sign in again.':'Accès refusé. Reconnectez-vous.');
 function choices(){
  if(!data)return [];
  const s=data.snapshot,result=[],seen=new Set();
  function add(mode,project_id=null){const key=mode+':'+(project_id||'');if(!seen.has(key)){seen.add(key);result.push({mode,project_id});}}
  if(s.assignment){add('administration');for(const p of data.projects)add('client_preview',p.id);}
  else{
   if(s.profile.role==='client')add('client');
   if(s.profile.role==='collaborateur')add('collaborator');
   for(const g of s.projectGrants){
    if(g.active!==true||g.user_id!==userId||!data.projects.some(p=>p.id===g.project_id))continue;
    if(g.role==='project_manager'&&s.profile.role==='collaborateur'){add('project_manager',g.project_id);add('client_preview',g.project_id);}
    if(g.role==='guest'&&s.profile.role==='guest')for(const side of g.sides||[])if(['client','collaborator'].includes(side))add('guest_'+side,g.project_id);
   }
  }
  return result;
 }
 function refresh(){
  if(refreshing)return refreshing;
  const pending=readSnapshot(epoch);refreshing=pending;
  const release=()=>{if(refreshing===pending)refreshing=null;};pending.then(release,release);
  return pending;
 }
 async function readSnapshot(ticket){
  const r=await sb.rpc('myeod_access_bootstrap_v49');
  if(ticket!==epoch)throw denied();
  const b=r.data,s=b?.snapshot;
  if(r.error||!s?.session?.active||s.session.user_id!==userId||s.session.must_change_password!==false||!Array.isArray(s.projectGrants)||!Array.isArray(b.projects)||!Number.isSafeInteger(b.revision)||b.revision<0){data=null;throw r.error||denied();}
  if(s.assignment&&(s.assignment.user_id!==userId||!['super_administrator','grand_administrator'].includes(s.assignment.level))){data=null;throw denied();}
  data=b;
  if(!choices().length){data=null;throw denied();}
  if(b.context&&!choices().some(c=>c.mode===b.context.mode&&c.project_id===(b.context.project_id||null))){data=null;throw denied();}
  return view();
 }
 async function change(choice){
  if(!data||!choices().some(c=>c.mode===choice.mode&&c.project_id===(choice.project_id||null)))throw denied();
  const ticket=++epoch;refreshing=null;const expected=data.revision;
  const r=await sb.rpc('myeod_set_access_context_v48',{mode:choice.mode,project_id:choice.project_id||null,expected_revision:expected});
  if(ticket!==epoch)throw denied();
  if(r.error){data=null;throw r.error;}
  return refresh();
 }
 function view(){
  if(!data)return null;
  const ctx=data.context,s=data.snapshot,l=language();
  const role=ctx?.mode==='administration'?s.assignment?.level:ctx?.mode;
  const project=data.projects.find(p=>p.id===ctx?.project_id);
  const preview=ctx?.mode==='client_preview';
  const admin=ctx?.mode==='administration';const domains=s.assignment?.write_domains||[];
  const writes=domain=>admin&&(domains.includes('*')||domains.includes(domain));
  return {mode:ctx?.mode||null,project_id:ctx?.project_id||null,role:labels[role]?.[l]||'',position:s.assignment?.[l?'position_en':'position_fr']||'',
   notice:preview?(l?'Client preview — read only':'Aperçu client — lecture seule')+(project?' — '+project.name:''):ctx?.mode?.startsWith('guest_')?(l?'Read only — pages and metadata':'Lecture seule — pages et métadonnées')+(project?' — '+project.name:''):'',
   readGlobalAccounts:admin&&!!s.assignment,globalAccounts:writes('it')&&s.assignment?.level==='super_administrator',manageProjects:writes('projects'),manageDocuments:writes('projects')||ctx?.mode==='project_manager',
   collaborator:ctx?.mode==='collaborator',download:!!ctx&&!preview&&!ctx.mode.startsWith('guest_'),choices:choices().map(c=>({...c,label:labels[c.mode][l]+(c.project_id?' — '+(data.projects.find(p=>p.id===c.project_id)?.name||c.project_id):'')+(c.mode==='guest_client'?(l?' (client side)':' (côté client)'):c.mode==='guest_collaborator'?(l?' (collaborator side)':' (côté collaborateur)'):c.mode==='client_preview'?(l?' (read only)':' (lecture seule)'):'')}))};
 }
 function clear(){epoch++;data=null;refreshing=null;}
 return {refresh,change,view,clear};
}
window.MyEODAccessContext={create};
})();
