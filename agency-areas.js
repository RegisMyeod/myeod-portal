(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MyEODAgencyAreas=api;})(globalThis,()=>{
 'use strict';
 const areas=[];
 const add=(id,label,english,selector,anchor,count=1,variant='main',extra={})=>areas.push({id,section:id.split(':')[0],variant,label,english,selector,anchor,count,...extra});
 add('0','Ouverture','Opening','img[data-pick="hero"]','agency-top');
 add('1','Regards','Perspectives','img[data-pick^="l"]','large',3);
 add('2','La Rencontre','The meeting','img[data-pick^="r"]','rencontre',3);
 add('3','La Glisse','Board sports','img[data-pick^="gl"]','regard',3);
 add('4','Équipe · Photo commune','Team · Shared photograph','img[data-k="392cf66b92fb2b3ef309602f2ff41d95"]','equipe');
 add('4:portrait','Équipe · Portrait Alizé','Team · Alizé portrait','img[data-k="d11f517ee30e52417b8da043db259609"]','equipe',1,'portrait');
 add('4:portrait_regis','Équipe · Portrait Régis','Team · Régis portrait','img[data-k="bc58a3dd84484dcceb6fad5e359a88b1"]','equipe',1,'portrait_regis');
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
 function candidates(rows,area){
  const result=[];
  for(const row of rows){const declared=new Map((row.manifest?.files||[]).filter(f=>f.kind==='web').map(f=>[f.path,f]));
   for(const p of row.manifest?.images||[]){if(p.record?.removed||!p.record?.sections?.includes(area.section))continue;
    const variants=['desktop','mobile'].map(device=>{
     const w=p.web?.find(w=>w.slot===area.section+':'+device+(area.variant==='main'?'':':'+area.variant)&&w.variant===area.variant);
     const fallback=area.panorama?p.web?.find(w=>w.variant==='panorama'&&w.slot.split(':')[0]===area.section):null;
     return {device,files:((w||fallback)?.files||[]).filter(f=>declared.get(f.file)?.imageId===p.image.id&&declared.get(f.file)?.bytes===f.bytes&&/^images\/[A-Za-z0-9_-]+\.(avif|webp|jpg)$/.test(f.file)&&['AVIF','WEBP','JPEG'].includes(f.format)&&Number.isInteger(f.width)&&f.width>0).map(f=>({path:row.id+'/'+f.file,format:f.format,width:f.width,height:f.height}))};
    });
    if(variants.every(v=>v.files.some(f=>f.format==='JPEG')))result.push({id:p.image.id,variants,name:p.record.description||p.image.filename,location:p.image.location||'',coordinates:p.image.coordinates||''});
   }
  }return result;
 }
 function choose(candidates,prefs={},count=1,random=Math.random){const pool=candidates.filter(p=>prefs[p.id]!=='excluded'),result=[];
  while(pool.length&&result.length<count){let draw=random()*pool.reduce((s,p)=>s+(prefs[p.id]==='favorite'?4:1),0),index=pool.length-1;
   for(let i=0;i<pool.length;i++){draw-=prefs[pool[i].id]==='favorite'?4:1;if(draw<0){index=i;break;}}result.push(pool.splice(index,1)[0]);
  }return result;
 }
 return {areas,candidates,choose};
});
