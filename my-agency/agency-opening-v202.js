/* Opening image only. The other sections retain their existing sources and navigation. */
(async function () {
  'use strict';
  const images = [...document.querySelectorAll('img[data-pick="hero"]')];
  if (!images.length) return;
  const fallback = () => images.forEach(img => { if (img.dataset.agencyFallback) img.src = img.dataset.agencyFallback; });
  const host = 'https://hnsxwrarctqqasddtghq.supabase.co';
  const valid = file => Number.isInteger(file.width) && file.width > 0 &&
    typeof file.url === 'string' && file.url.startsWith(host+'/storage/v1/object/sign/myeod-agency-library/') && !file.url.includes('/originals/');
  function apply(data) {
    const photo = data.photo;
    if (!photo || !['desktop','mobile'].every(device => photo.variants?.some(v => v.device === device && v.files.some(f => f.format === 'JPEG' && valid(f))))) throw Error('Opening unavailable');
    for (const img of images) {
      if (img.parentElement.matches('picture[data-agency-opening]')) {
        const previous=img.parentElement;previous.replaceWith(img);
      }
      const picture = document.createElement('picture');picture.style.display='contents';picture.dataset.agencyOpening=photo.id;
      const sizes='100vw';
      for (const device of ['mobile','desktop']) for (const format of ['AVIF','WEBP','JPEG']) {
        const files=photo.variants.find(v=>v.device===device).files.filter(f=>f.format===format&&valid(f)).sort((a,b)=>a.width-b.width);
        if (!files.length) continue;
        const source=document.createElement('source');source.type={AVIF:'image/avif',WEBP:'image/webp',JPEG:'image/jpeg'}[format];
        source.media=device==='mobile'?'(max-width: 639px)':'(min-width: 640px)';source.sizes=sizes;
        source.srcset=files.map(f=>f.url+' '+f.width+'w').join(', ');picture.append(source);
      }
      const jpeg=photo.variants.find(v=>v.device==='desktop').files.filter(f=>f.format==='JPEG'&&valid(f)).sort((a,b)=>a.width-b.width);
      img.parentNode.insertBefore(picture,img);picture.append(img);
      img.style.objectPosition='50% 50%';img.loading='eager';img.fetchPriority='high';img.decoding='async';
      img.dataset.agencyImage=photo.id;img.dataset.agencyExport=data.exportId;img.src=jpeg.find(f=>f.width>=1600)?.url||jpeg.at(-1).url;
      img.onerror=()=>{img.onerror=null;picture.querySelectorAll('source').forEach(s=>s.remove());img.src=img.dataset.agencyFallback;};
    }
  }
  // Same-origin backoffice preview: receives only the selected web derivatives, never an original.
  if (new URLSearchParams(location.search).get('openingPreview')==='1' && parent!==window) {
    addEventListener('message',event=>{
      if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='myeod-opening-preview')return;
      try{apply(event.data);}catch(_){fallback();}
    });
    parent.postMessage({type:'myeod-opening-ready'},location.origin);
    return;
  }
  try {
    const response = await fetch(host+'/functions/v1/agency-opening',{headers:{apikey:'sb_publishable_bPnkexoj2cGftGvUUbdFNQ_MHfg1z99'},signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw Error('Opening unavailable');
    apply(await response.json());
  } catch (_) { fallback(); }
})();
