/* Apply only assigned web derivatives. Empty galleries preserve the existing illustrations. */
(async()=>{'use strict';
 const registry=window.MyEODAgencyAreas,host='https://kewhxzitwdrnpsnzlihn.supabase.co';if(!registry)return;
 const valid=f=>Number.isInteger(f.width)&&f.width>0&&typeof f.url==='string'&&f.url.startsWith(host+'/storage/v1/object/sign/myeod-agency-library/')&&!f.url.includes('/originals/');
 function files(photo,device,format){return (photo.variants?.find(v=>v.device===device)?.files||[]).filter(f=>f.format===format&&valid(f)).sort((a,b)=>a.width-b.width);}
 function jpeg(photo,device){const a=files(photo,device,'JPEG');return a.find(f=>f.width>=1600)||a.at(-1);}
 function picture(img,photo,area){
  if(!['desktop','mobile'].every(d=>jpeg(photo,d)))return;
  const fallback=img.dataset.agencyFallback||img.src;if(img.parentElement.matches('picture[data-agency-area],picture[data-agency-opening]'))img.parentElement.replaceWith(img);
  const wrapper=document.createElement('picture');wrapper.style.display='contents';wrapper.dataset.agencyArea=area.id;if(area.id==='0')wrapper.dataset.agencyOpening=photo.id;
  for(const device of ['mobile','desktop'])for(const format of ['AVIF','WEBP','JPEG']){const list=files(photo,device,format);if(!list.length)continue;const source=document.createElement('source');source.style.display='none';source.type={AVIF:'image/avif',WEBP:'image/webp',JPEG:'image/jpeg'}[format];source.media=device==='mobile'?'(max-width: 639px)':'(min-width: 640px)';source.sizes=area.id==='0'||area.id==='9'?'100vw':'(max-width: 639px) 100vw, 50vw';source.srcset=list.map(f=>f.url+' '+f.width+'w').join(', ');wrapper.append(source);}
  img.parentNode.insertBefore(wrapper,img);wrapper.append(img);img.dataset.agencyImage=photo.id;img.dataset.agencyArea=area.id;img.dataset.agencyFallback=fallback;img.style.objectPosition='50% 50%';img.decoding='async';img.loading=area.id==='0'?'eager':'lazy';if(area.id==='0')img.fetchPriority='high';
  img.onload=()=>img.classList.add('ld');img.onerror=()=>{img.onerror=null;wrapper.querySelectorAll('source').forEach(s=>s.remove());img.src=fallback;img.classList.add('ld');};img.src=jpeg(photo,'desktop').url;
 }
 function apply(area,photos){if(!area.strip&&!photos?.length)return;
  for(const language of document.querySelectorAll('.lang')){
   if(area.strip){for(const section of language.querySelectorAll(area.selector))section.dispatchEvent(new CustomEvent('myeod-universe-gallery',{detail:{photos:photos||[],universe:area.universe,area:area.id,preview}}));continue;}
   if(area.panorama){const device=innerWidth<=639?'mobile':'desktop';const urls=photos.map(p=>jpeg(p,device)?.url).filter(Boolean);if(!urls.length)continue;
    for(const cv of language.querySelectorAll(area.selector)){cv.style.display='block';cv.dataset.agencyImage=photos[0].id;cv.dataset.agencyArea=area.id;const poster=cv.closest('.pano-box')?.querySelector('[data-area-static360]');if(poster)poster.style.display='none';cv.dispatchEvent(new CustomEvent('myeod-pano-gallery',{detail:{urls}}));}continue;
   }
   if(area.id==='83')for(const cv of language.querySelectorAll('canvas.pano')){const box=cv.closest('.pano-box');if(!box.querySelector('[data-area-static360]')){const img=document.createElement('img');img.dataset.areaStatic360='';img.alt='Visual Intelligence';img.style.cssText='display:block;width:100%;height:clamp(320px,52vw,640px);object-fit:cover';cv.before(img);}cv.style.display='none';}
   [...language.querySelectorAll(area.selector)].forEach((img,index)=>{const photo=photos[index%photos.length];picture(img,photo,area);
    if(area.id==='6'){const caption=img.parentElement.tagName==='PICTURE'?img.parentElement.nextElementSibling:img.nextElementSibling;if(caption){const place=caption.querySelector('[data-f="z"]'),coordinates=caption.querySelector('[data-f="c"]');if(place)place.textContent=photo.location||'';if(coordinates)coordinates.textContent=photo.coordinates||'';caption.hidden=!photo.location&&!photo.coordinates;}}
   });
  }
 }
 function focusArea(area){if(area.id==='0'){scrollTo(0,0);return;}const language=[...document.querySelectorAll('.lang')].find(n=>!n.hidden),target=language?.querySelector(area.selector)||language?.querySelector('#'+area.anchor);if(!target)return;scrollTo(0,Math.max(0,scrollY+target.getBoundingClientRect().top-90));}
 const preview=new URLSearchParams(location.search).get('openingPreview')==='1'&&parent!==window;
 if(preview){
  addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='myeod-opening-preview')return;const area=registry.areas.find(a=>a.id===(e.data.area||'0'));if(!area)return;apply(area,e.data.photos||(e.data.photo?[e.data.photo]:[]));requestAnimationFrame(()=>focusArea(area));});
  parent.postMessage({type:'myeod-opening-ready'},location.origin);return;
 }
 const opening=[...document.querySelectorAll('img[data-pick="hero"]')];
 try{const r=await fetch(host+'/functions/v1/agency-opening?areas=all',{headers:{apikey:'sb_publishable_owbl6MuPlOfMYAOPMxQ8Hg_deQuxLWi'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Unavailable');const data=await r.json();for(const result of data.areas||[]){const area=registry.areas.find(a=>a.id===result.area);if(area)apply(area,result.photos);}if(!data.areas?.some(a=>a.area==='0'))throw Error('No opening');}
 catch(_){for(const img of opening)if(!img.dataset.agencyImage&&img.dataset.agencyFallback)img.src=img.dataset.agencyFallback;}
 finally{for(const section of document.querySelectorAll('.agency-universes'))section.dispatchEvent(new CustomEvent('myeod-universe-galleries-ready'));}
})();
