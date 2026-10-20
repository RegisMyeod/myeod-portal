/* Local photo sequences. Add future universes here and to the two language selectors. */
(() => {
  'use strict';
  const UNIVERSES = { boardsports: { base: 'assets/universes/boardsports/', images: [["glisse-001.jpg", 747], ["glisse-002.jpg", 373], ["glisse-003.jpg", 386], ["glisse-004.jpg", 747], ["glisse-005.jpg", 747], ["glisse-006.jpg", 420], ["glisse-007.jpg", 747], ["glisse-008.jpg", 747], ["glisse-009.jpg", 374], ["glisse-010.jpg", 373], ["glisse-011.jpg", 421], ["glisse-012.jpg", 841], ["glisse-013.jpg", 373], ["glisse-014.jpg", 373], ["glisse-015.jpg", 373], ["glisse-016.jpg", 878], ["glisse-017.jpg", 405], ["glisse-018.jpg", 747], ["glisse-019.jpg", 560], ["glisse-020.jpg", 750], ["glisse-021.jpg", 821], ["glisse-022.jpg", 1438], ["glisse-023.jpg", 560], ["glisse-024.jpg", 1259], ["glisse-025.jpg", 840], ["glisse-026.jpg", 840], ["glisse-027.jpg", 840], ["glisse-028.jpg", 840], ["glisse-029.jpg", 374], ["glisse-030.jpg", 840], ["glisse-031.jpg", 373], ["glisse-032.jpg", 840], ["glisse-033.jpg", 374], ["glisse-034.jpg", 374], ["glisse-035.jpg", 315], ["glisse-036.jpg", 995], ["glisse-037.jpg", 315], ["glisse-038.jpg", 995], ["glisse-039.jpg", 994], ["glisse-040.jpg", 994], ["glisse-041.jpg", 1244], ["glisse-042.jpg", 278], ["glisse-043.jpg", 996], ["glisse-044.jpg", 900], ["glisse-045.jpg", 1010], ["glisse-046.jpg", 427], ["glisse-047.jpg", 315], ["glisse-048.jpg", 995], ["glisse-049.jpg", 942], ["glisse-050.jpg", 559], ["glisse-051.jpg", 559], ["glisse-052.jpg", 563], ["glisse-053.jpg", 996], ["glisse-054.jpg", 995], ["glisse-055.jpg", 995], ["glisse-056.jpg", 648], ["glisse-057.jpg", 995], ["glisse-058.jpg", 995], ["glisse-059.jpg", 1064], ["glisse-060.jpg", 995], ["glisse-061.jpg", 840], ["glisse-062.jpg", 373], ["glisse-063.jpg", 374], ["glisse-064.jpg", 374], ["glisse-065.jpg", 1349], ["glisse-066.jpg", 1886], ["glisse-067.jpg", 374], ["glisse-068.jpg", 374], ["glisse-069.jpg", 1060], ["glisse-070.jpg", 575], ["glisse-071.jpg", 388], ["glisse-072.jpg", 561], ["glisse-073.jpg", 836], ["glisse-074.jpg", 996], ["glisse-075.jpg", 1153], ["glisse-076.jpg", 836], ["glisse-077.jpg", 560], ["glisse-078.jpg", 315]] } };
  for (const key of ['onshore','offshore','maritime','sailing','transport','cities','art','travel']) UNIVERSES[key]={base:'',images:[]};
  // One draw per page, shared by both languages; explicit preview choices stay deterministic.
  const openingDraw = Math.random();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  /* touch-color:start */
  function bindTouchColor(track) {
    let contact = null;
    const moved = (e, start) => Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
      if (e.isPrimary === false) { contact = null; return; }
      const image = e.target.closest('img');
      contact = image && track.contains(image) ? { image, id: e.pointerId, x: e.clientX, y: e.clientY, time: e.timeStamp, scroll: window.scrollY } : null;
    }, { passive: true });
    track.addEventListener('pointermove', e => {
      if (contact && e.pointerId === contact.id && moved(e, contact)) contact = null;
    }, { passive: true });
    track.addEventListener('pointercancel', () => { contact = null; }, { passive: true });
    track.addEventListener('pointerup', e => {
      if (!contact || e.pointerId !== contact.id) return;
      const start = contact; contact = null;
      if (moved(e, start) || e.timeStamp - start.time > 500 || Math.abs(window.scrollY - start.scroll) > 4) return;
      if (!track.contains(start.image) || e.target.closest('img') !== start.image) return;
      const wasColor = start.image.classList.contains('is-color');
      track.querySelectorAll('img.is-color').forEach(img => img.classList.remove('is-color'));
      if (!wasColor) start.image.classList.add('is-color');
    }, { passive: true });
  }
  /* touch-color:end */
  document.querySelectorAll('.agency-universes').forEach(section => {
    const box = section.querySelector('.agency-universes-strip');
    const track = section.querySelector('.agency-universes-track');
    bindTouchColor(track);
    const button = section.querySelector('button');
    const select = section.querySelector('select');
    const defaultUniverse = 'boardsports';
    if (!UNIVERSES[select.value]) select.value = defaultUniverse;
    const galleries = {...UNIVERSES};
    let manuallyChosen = false, initialChoiceDone = false;
    let universe = galleries[select.value];
    const empty = document.createElement('p');empty.className='agency-universes-empty';empty.setAttribute('role','status');empty.hidden=true;box.append(empty);
    let queue = [], last = null, x = 0, prev = null, raf = 0;
    let inView = false, paused = reduced.matches;
    const gap = 4;
    const scale = () => box.clientHeight / 560;
    function next() {
      if (!queue.length) {
        queue = universe.images.slice();
        for (let i = queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        if (last && queue[queue.length - 1][0] === last) queue.unshift(queue.pop());
      }
      const item = queue.pop(); last = item[0]; return item;
    }
    function fill() {
      if (!universe.images.length || !box.clientWidth || !box.clientHeight) return;
      let width = Array.from(track.children).reduce((sum, img) => sum + Number(img.dataset.width) * scale() + gap, 0) + x;
      while (width < box.clientWidth * 2 && track.children.length < 32) {
        const [file, originalWidth] = next();
        const img = new Image();
        // My Agency hides section images without .ld; these local images have their own loader.
        img.className = 'ld';
        img.alt = ''; img.decoding = 'async'; img.draggable = false;
        img.width = originalWidth; img.height = 560; img.dataset.width = originalWidth;
        img.style.width = (originalWidth * scale()) + 'px';
        img.src = universe.base + file;
        track.appendChild(img); width += originalWidth * scale() + gap;
      }
    }
    function canPlay() { return universe.images.length > 0 && !paused && inView && !document.hidden && box.clientWidth > 0; }
    function frame(t) {
      raf = 0;
      if (!canPlay()) { prev = null; return; }
      if (prev !== null) {
        x -= Math.min(t - prev, 100) / 1000 * Number(box.dataset.speed) * scale();
        let first = track.firstElementChild;
        while (first && -x >= Number(first.dataset.width) * scale() + gap) {
          x += Number(first.dataset.width) * scale() + gap;
          first.remove(); first = track.firstElementChild;
        }
        fill(); track.style.transform = `translate3d(${x}px,0,0)`;
      }
      prev = t; raf = requestAnimationFrame(frame);
    }
    function sync() {
      // Display the default sequence even when paused or waiting for intersection.
      fill();
      empty.hidden=universe.images.length>0;button.disabled=!universe.images.length;
      const label=select.selectedOptions[0]?.textContent||select.value;box.setAttribute('aria-label',label+' — My Agency');box.dataset.universe=select.value;track.dataset.universe=select.value;
      empty.textContent=section.dataset.universeLang==='en'?'The '+label+' gallery is being prepared.':'Le bandeau '+label+' est en préparation.';
      button.textContent = paused ? button.dataset.resume : button.dataset.pause;
      if (canPlay()) { fill(); if (!raf) raf = requestAnimationFrame(frame); }
      else { if (raf) cancelAnimationFrame(raf); raf = 0; prev = null; }
    }
    button.addEventListener('click', () => { paused = !paused; sync(); });
    section.addEventListener('myeod-universe-gallery',event=>{
      const key=event.detail?.universe;if(!Object.hasOwn(galleries,key))return;
      const device=innerWidth<=639?'mobile':'desktop';
      const images=(event.detail?.photos||[]).map(p=>{
        const files=(p.variants?.find(v=>v.device===device)?.files||[]).filter(f=>f.format==='JPEG'&&f.url?.startsWith('https://hnsxwrarctqqasddtghq.supabase.co/storage/v1/object/sign/myeod-agency-library/')&&!f.url.includes('/originals/')).sort((a,b)=>a.width-b.width);
        const file=files.find(f=>f.width>=1120)||files.at(-1);return file?[file.url,Math.max(1,Math.round(file.width/file.height*560))]:null;
      }).filter(Boolean);
      galleries[key]=images.length?{base:'',images}:UNIVERSES[key];
      if(event.detail.preview)select.value=key;
      if(select.value!==key)return;
      track.dataset.agencyArea=event.detail.area;universe=galleries[key];queue=[];last=null;x=0;prev=null;
      track.replaceChildren();track.style.transform='translate3d(0,0,0)';fill();sync();
    });
    section.addEventListener('myeod-universe-galleries-ready',()=>{
      if(initialChoiceDone)return;initialChoiceDone=true;
      if(manuallyChosen)return;
      const available=Object.keys(galleries).filter(key=>galleries[key].images.length>0);
      if(!available.length)return;
      select.value=available[Math.floor(openingDraw*available.length)];
      delete track.dataset.agencyArea;universe=galleries[select.value];queue=[];last=null;x=0;prev=null;
      track.replaceChildren();track.style.transform='translate3d(0,0,0)';sync();
    });
    select.addEventListener('change', () => {
      manuallyChosen=true;
      if (!galleries[select.value]) return;
      delete track.dataset.agencyArea;universe = galleries[select.value]; queue = []; last = null; x = 0;
      paused = reduced.matches;
      track.replaceChildren(); track.style.transform = 'translate3d(0,0,0)'; fill(); sync();
    });
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) fill(); sync();
    }, { rootMargin: '150px' }).observe(box);
    new ResizeObserver(() => {
      if (!box.clientWidth || !box.clientHeight) { sync(); return; }
      for (const img of track.children) img.style.width = (Number(img.dataset.width) * scale()) + 'px';
      x = 0; prev = null; track.style.transform = 'translate3d(0,0,0)';
      if (inView) fill(); sync();
    }).observe(box);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
    sync();
  });
})();
