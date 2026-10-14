(function(root){
'use strict';
const fail=(code,uncertain=false)=>Object.assign(new Error(code),{code,uncertain});
function payload(kind,fields){
 if(!['company','project'].includes(kind))throw fail('VALIDATION');
 if(typeof fields.name!=='string'||fields.name.length>200||/[\x00-\x1f\x7f]/.test(fields.name)||!fields.name.trim())throw fail('VALIDATION');
 const result={name:fields.name.trim()};
 if(kind==='project'){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fields.company_id||''))throw fail('COMPANY_REQUIRED');result.company_id=fields.company_id;}
 return result;
}
async function identity(sb,expected,active=()=>true){
 const u=await sb.auth.getUser();if(!active())throw fail('STALE');
 const id=u.data?.user?.id;if(u.error||!id||expected&&expected!==id)throw fail('IDENTITY');
 const p=await sb.from('profiles').select('role,must_change_password').eq('id',id).single();if(!active())throw fail('STALE');
 if(p.error||p.data?.must_change_password!==false)throw fail('DENIED');
 if(root.MyEODAccessPolicyMode==='scoped-v48'){
  const r=await sb.rpc('myeod_access_snapshot_v48');if(!active())throw fail('STALE');
  const view=r.data,assignment=view?.assignment;
  if(r.error||view?.session?.active!==true||view.session.user_id!==id||view.session.must_change_password!==false||view.context?.mode!=='administration'||assignment?.user_id!==id||!['super_administrator','grand_administrator'].includes(assignment.level)||!Array.isArray(assignment.write_domains)||!assignment.write_domains.some(domain=>domain==='*'||domain==='projects'))throw fail('DENIED');
  return id;
 }
 if(p.data.role!=='fondateur')throw fail('DENIED');
 const r=await sb.rpc('myeod_admin_can_create_accounts');if(!active())throw fail('STALE');
 if(r.error||r.data!==true)throw fail('DENIED');return id;
}
function same(row,r){return row?.id===r.id&&row.name===r.payload.name&&(r.kind!=='project'||row.company_id===r.payload.company_id);}
async function create(sb,request,{active=()=>true}={}){
 const fields=payload(request.kind,request.payload);if(JSON.stringify(fields)!==request.fingerprint)throw fail('CONFLICT');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.id))throw fail('VALIDATION');
 const table=request.kind==='company'?'portal_companies':'portal_projects',columns=request.kind==='company'?'id,name':'id,name,company_id';let attempted=false;
 const guard=async()=>identity(sb,request.user_id,active);
 const read=async()=>{const r=await sb.from(table).select(columns).eq('id',request.id).maybeSingle();if(!active())throw fail('STALE');if(r.error)throw fail('READ');return r.data;};
 try{
  await guard();const existing=await read();
  if(existing){if(!same(existing,request))throw fail('CONFLICT');await guard();return existing;}
  if(request.kind==='project'){
   const c=await sb.from('portal_companies').select('id').eq('id',fields.company_id).maybeSingle();if(!active())throw fail('STALE');if(c.error||!c.data)throw fail('COMPANY_REQUIRED');
  }
  await guard();attempted=true;
  const inserted=await sb.from(table).insert({id:request.id,...fields}).select(columns).single();if(!active())throw fail('STALE');
  // A lost response may still have committed. Only a matching server re-read confirms it.
  const row=await read();if(!row){throw fail(inserted.error?'UNCONFIRMED':'READ',true);}
  if(!same(row,request))throw fail('CONFLICT',true);
  await guard();return row;
 }catch(e){const safe=e instanceof Error?e:fail('UNCONFIRMED');if(attempted)safe.uncertain=true;throw safe;}
}
root.MyEODAdminProjectService={payload,identity,create};
})(typeof window==='undefined'?globalThis:window);
