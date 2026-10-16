/* Local photo sequences. Add future universes here and to the two language selectors. */
(() => {
  'use strict';
  const UNIVERSES = { boardsports: { base: 'assets/universes/boardsports/', images: [["glisse-001.jpg", 747], ["glisse-002.jpg", 373], ["glisse-003.jpg", 386], ["glisse-004.jpg", 747], ["glisse-005.jpg", 747], ["glisse-006.jpg", 420], ["glisse-007.jpg", 747], ["glisse-008.jpg", 747], ["glisse-009.jpg", 374], ["glisse-010.jpg", 373], ["glisse-011.jpg", 421], ["glisse-012.jpg", 841], ["glisse-013.jpg", 373], ["glisse-014.jpg", 373], ["glisse-015.jpg", 373], ["glisse-016.jpg", 878], ["glisse-017.jpg", 405], ["glisse-018.jpg", 747], ["glisse-019.jpg", 560], ["glisse-020.jpg", 750], ["glisse-021.jpg", 821], ["glisse-022.jpg", 1438], ["glisse-023.jpg", 560], ["glisse-024.jpg", 1259], ["glisse-025.jpg", 840], ["glisse-026.jpg", 840], ["glisse-027.jpg", 840], ["glisse-028.jpg", 840], ["glisse-029.jpg", 374], ["glisse-030.jpg", 840], ["glisse-031.jpg", 373], ["glisse-032.jpg", 840], ["glisse-033.jpg", 374], ["glisse-034.jpg", 374], ["glisse-035.jpg", 315], ["glisse-036.jpg", 995], ["glisse-037.jpg", 315], ["glisse-038.jpg", 995], ["glisse-039.jpg", 994], ["glisse-040.jpg", 994], ["glisse-041.jpg", 1244], ["glisse-042.jpg", 278], ["glisse-043.jpg", 996], ["glisse-044.jpg", 900], ["glisse-045.jpg", 1010], ["glisse-046.jpg", 427], ["glisse-047.jpg", 315], ["glisse-048.jpg", 995], ["glisse-049.jpg", 942], ["glisse-050.jpg", 559], ["glisse-051.jpg", 559], ["glisse-052.jpg", 563], ["glisse-053.jpg", 996], ["glisse-054.jpg", 995], ["glisse-055.jpg", 995], ["glisse-056.jpg", 648], ["glisse-057.jpg", 995], ["glisse-058.jpg", 995], ["glisse-059.jpg", 1064], ["glisse-060.jpg", 995], ["glisse-061.jpg", 840], ["glisse-062.jpg", 373], ["glisse-063.jpg", 374], ["glisse-064.jpg", 374], ["glisse-065.jpg", 1349], ["glisse-066.jpg", 1886], ["glisse-067.jpg", 374], ["glisse-068.jpg", 374], ["glisse-069.jpg", 1060], ["glisse-070.jpg", 575], ["glisse-071.jpg", 388], ["glisse-072.jpg", 561], ["glisse-073.jpg", 836], ["glisse-074.jpg", 996], ["glisse-075.jpg", 1153], ["glisse-076.jpg", 836], ["glisse-077.jpg", 560], ["glisse-078.jpg", 315]] } };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.agency-universes').forEach(section => {
    const box = section.querySelector('.agency-universes-strip');
    const track = section.querySelector('.agency-universes-track');
    const button = section.querySelector('button');
    const select = section.querySelector('select');
    const defaultUniverse = 'boardsports';
    if (!UNIVERSES[select.value]) select.value = defaultUniverse;
    let universe = UNIVERSES[select.value];
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
      if (!box.clientWidth || !box.clientHeight) return;
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
    function canPlay() { return !paused && inView && !document.hidden && box.clientWidth > 0; }
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
      button.textContent = paused ? button.dataset.resume : button.dataset.pause;
      if (canPlay()) { fill(); if (!raf) raf = requestAnimationFrame(frame); }
      else { if (raf) cancelAnimationFrame(raf); raf = 0; prev = null; }
    }
    button.addEventListener('click', () => { paused = !paused; sync(); });
    select.addEventListener('change', () => {
      if (!UNIVERSES[select.value]) return;
      universe = UNIVERSES[select.value]; queue = []; last = null; x = 0;
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
