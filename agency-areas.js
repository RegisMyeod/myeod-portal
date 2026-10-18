(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MyEODAgencyAreas=api;})(globalThis,()=>{
 'use strict';
 const areas=[];
 const add=(id,label,english,selector,anchor,count=1,variant='main',extra={})=>areas.push({id,section:id.split(':')[0],variant,label,english,selector,anchor,count,...extra});
 add('0','Ouverture','Opening','img[data-pick="hero"]','agency-top');
 add('1','Regards','Perspectives','img[data-pick^="l"]','large',3);
 add('2','La Rencontre','The meeting','img[data-pick^="r"]','rencontre',3);
 add('3','La Glisse','Board sports','img[data-pick^="gl"]','regard',3);
 add('4','041 — Ensemble','041 — Together','img[data-k="392cf66b92fb2b3ef309602f2ff41d95"]','equipe');
 add('4:portrait','042 — Portrait Alizé','042 — Alizé portrait','img[data-k="d11f517ee30e52417b8da043db259609"]','equipe',1,'portrait');
 add('4:portrait_regis','043 — Portrait Régis','043 — Régis portrait','img[data-k="bc58a3dd84484dcceb6fad5e359a88b1"]','equipe',1,'portrait_regis');
 add('5','De l’intérieur','From within','img[data-pick^="i"]','interieur',4);
 add('6','Nos escales','Our destinations','img[data-pick^="e"]:not([data-pick="eq"])','escales',7);
 add('71','Domaine · Industrie & Énergie','Industry & Energy','img[data-pick="d0"]','domaines');
 add('72','Domaine · Construction','Construction','img[data-pick="d1"]','domaines');
 add('73','Domaine · Naval & Nautisme','Naval & Marine','img[data-pick="d2"]','domaines');
 add('74','Domaine · Innovation','Innovation','img[data-pick="d3"]','domaines');
 add('81','Visual Intelligence · Illustration','Visual Intelligence · Illustration','img[data-pick="vt"]','vi');
 add('82','Visual Intelligence · Livrables','Visual Intelligence · Deliverables','img[data-pick^="v"]:not([data-pick="vt"])','vi',2);
 add('83','Visual Intelligence · Vue fixe 360°','Visual Intelligence · 360° still','img[data-area-static360]','vi');
 add('83:panorama','Visual Intelligence · Panorama 360°','Visual Intelligence · 360° panorama','canvas.pano','vi',32,'panorama',{panorama:true});
 add('9','Notre quête · L’équilibre','Our quest · Balance','img[data-pick="eq"]','equilibre');
 add('10','Notre promesse · Galerie','Our promise · Gallery','img[data-pick^="p"]','promesse',3);
 add('10:ccus','Notre promesse · Planches CCUS','Our promise · CCUS boards','img[data-pick^="cc"]','promesse',2,'ccus');
 add('11','Bandeau des univers · La glisse','Universe strip · Board sports','.agency-universes','agency-universes',32,'main',{strip:true});
 const team={'4':['041','main'],'4:portrait':['042','portrait'],'4:portrait_regis':['043','portrait_regis']};
 for(const a of areas)if(team[a.id]){a.section=team[a.id][0];a.variant='main';}
 function sources(photo,area){
  const sections=photo.record?.sections||[],old=team[area.id];
  if(sections.includes(area.section))return [{section:area.section,variant:area.variant}];
  if(!old||!sections.includes('4'))return [];
  const portraits=(photo.web||[]).filter(w=>['portrait','portrait_regis'].includes(w.variant));
  if(old[1]==='main'&&portraits.length)return [];
  return old[1]==='main'||portraits.some(w=>w.variant===old[1])?[{section:'4',variant:old[1]}]:[];
 }
 function candidates(rows,area){
  const result=[],seen=new Set();
  for(const row of [...rows].sort((a,b)=>Date.parse(b.created_at||b.manifest?.createdAt||0)-Date.parse(a.created_at||a.manifest?.createdAt||0))){
   const declared=new Map((row.manifest?.files||[]).filter(f=>f.kind==='web').map(f=>[f.path,f]));
   for(const p of row.manifest?.images||[]){if(seen.has(p.image.id))continue;seen.add(p.image.id);if(p.record?.removed)continue;
    const targets=sources(p,area);if(!targets.length)continue;
    const variants=['desktop','mobile'].map(device=>{
     const target=targets[0],slot=target.section+':'+device+(target.variant==='main'?'':':'+target.variant);
     const w=p.web?.find(w=>w.slot===slot&&w.variant===target.variant);
     const fallback=area.panorama||team[area.id]&&target.section==='4'&&target.variant!=='main'?p.web?.find(w=>w.variant===target.variant&&w.slot.split(':')[0]===target.section):null;
     return {device,files:((w||fallback)?.files||[]).filter(f=>declared.get(f.file)?.imageId===p.image.id&&declared.get(f.file)?.bytes===f.bytes&&/^images\/[A-Za-z0-9_-]+\.(avif|webp|jpg)$/.test(f.file)&&['AVIF','WEBP','JPEG'].includes(f.format)&&Number.isInteger(f.width)&&f.width>0).map(f=>({path:row.id+'/'+f.file,format:f.format,width:f.width,height:f.height}))};
    });
    if(variants.every(v=>v.files.some(f=>f.format==='JPEG')))result.push({id:p.image.id,variants,name:p.record.description||p.image.filename,location:p.image.location||'',coordinates:p.image.coordinates||''});
   }
  }return result;
 }
 function snapshots(rows){
  const groups=new Map();for(const r of rows){if(r.owner_id!=='5e101491-fc2c-4081-9fdd-a513cb7e7404')continue;const g=groups.get(r.export_id)||[];g.push(r);groups.set(r.export_id,g);}
  const complete=[...groups.values()].filter(g=>Number.isInteger(g[0].parts)&&g[0].parts>0&&g.length===g[0].parts&&g.every(r=>r.status==='complete'&&r.parts===g[0].parts&&r.library_id===g[0].library_id&&r.part>=1&&r.part<=r.parts)&&new Set(g.map(r=>r.part)).size===g.length).sort((a,b)=>Math.max(...b.map(r=>Date.parse(r.created_at)))-Math.max(...a.map(r=>Date.parse(r.created_at))));
  const library=complete[0]?.[0].library_id;return complete.filter(g=>g[0].library_id===library).flat();
 }
 function choose(candidates,prefs={},count=1,random=Math.random){const pool=candidates.filter(p=>prefs[p.id]!=='excluded'),result=[];
  while(pool.length&&result.length<count){let draw=random()*pool.reduce((s,p)=>s+(prefs[p.id]==='favorite'?4:1),0),index=pool.length-1;
   for(let i=0;i<pool.length;i++){draw-=prefs[pool[i].id]==='favorite'?4:1;if(draw<0){index=i;break;}}result.push(pool.splice(index,1)[0]);
  }return result;
 }
 return {areas,candidates,choose,snapshots};
});
