/* Shared shell behaviour; authentication, page content and portal roles stay with their existing modules. */
(() => {
  'use strict';
  const headers = [...document.querySelectorAll('.site-header')];
  const mobile = matchMedia('(max-width:1199px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
  const visibleHeader = () => headers.find(h => !h.closest('[hidden]'));
  function closeMenu(header, restoreFocus = false) {
    header.classList.remove('is-menu-open');
    header.querySelector('.site-burger')?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) header.querySelector('.site-burger')?.focus();
    document.body.classList.toggle('site-menu-open', mobile.matches && headers.some(h => h.classList.contains('is-menu-open')));
    syncVisibility(header);
  }
  function syncVisibility(header) {
    const nav = header.querySelector('.site-nav');
    const collapsible = mobile.matches || (header.classList.contains('site-header-agency') && !header.classList.contains('agency-menu-groups'));
    nav.inert = collapsible && !header.classList.contains('is-menu-open');
    header.querySelectorAll('.site-space').forEach(space => {
      space.querySelector('.site-space-panel').inert = !mobile.matches && !space.classList.contains('is-open');
      if(header.classList.contains('agency-menu-groups')){const button=space.querySelector('button');button.disabled=mobile.matches;button.tabIndex=mobile.matches?-1:0;button.setAttribute('aria-expanded',String(mobile.matches||space.classList.contains('is-open')));}
    });
  }
  function setSpace(space, open) {
    space.classList.toggle('is-open', open);
    space.querySelector('button').setAttribute('aria-expanded', String(open));
    syncVisibility(space.closest('.site-header'));
  }
  function localize() {
    const en = document.documentElement.lang === 'en';
    document.querySelectorAll('[data-shell-fr]').forEach(el => { el.textContent = el.dataset[en ? 'shellEn' : 'shellFr']; });
    document.querySelectorAll('[data-shell-route-fr]').forEach(el => { el.setAttribute('href', el.dataset[en ? 'shellRouteEn' : 'shellRouteFr']); });
    headers.forEach(header => {
      closeMenu(header);
      header.querySelector('.site-burger').setAttribute('aria-label', en ? 'Open menu' : 'Ouvrir le menu');
      header.querySelector('.site-nav').setAttribute('aria-label', header.classList.contains('site-header-agency') ? (en ? 'My Agency chapters' : 'Chapitres My Agency') : (en ? 'Main navigation' : 'Navigation principale'));
      header.querySelectorAll('.site-nav-link').forEach(link => {
        const url = new URL(link.href, location.href);
        if (!url.hash && url.pathname.replace(/\/$/, '/index.html') === location.pathname.replace(/\/$/, '/index.html')) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    });
  }
  function onScroll() {
    headers.forEach(header => header.classList.toggle('is-scrolled', window.scrollY > 40));
  }
  headers.forEach(header => {
    const trigger = header.querySelector('.site-burger');
    trigger.addEventListener('click', () => {
      const open = !header.classList.contains('is-menu-open');
      headers.forEach(h => closeMenu(h));
      if (open) {
        header.classList.add('is-menu-open');
        trigger.setAttribute('aria-expanded', 'true');
        document.body.classList.toggle('site-menu-open', mobile.matches);
        syncVisibility(header);
        header.querySelector('.site-nav a')?.focus();
      }
    });
    header.querySelectorAll('.site-space').forEach(space => {
      let openedByHover = false;
      space.querySelector('button').addEventListener('click', () => {
        setSpace(space, openedByHover || !space.classList.contains('is-open'));
        openedByHover = false;
      });
      space.addEventListener('mouseenter', () => {
        if (!mobile.matches && matchMedia('(hover:hover)').matches && !space.classList.contains('is-open')) { openedByHover = true; setSpace(space, true); }
      });
      space.addEventListener('mouseleave', () => { if (!space.contains(document.activeElement)) { openedByHover = false; setSpace(space, false); } });
      space.addEventListener('focusout', event => { if (!space.contains(event.relatedTarget)) setSpace(space, false); });
    });
  });
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a');
    // Agency anchors must resolve inside the active language, whose chapter IDs are shared.
    if (anchor && anchor.closest('.lang') && anchor.getAttribute('href')?.startsWith('#')) {
      const root = anchor.closest('.lang');
      const id = anchor.getAttribute('href').slice(1);
      const target = id === 'agency-top' ? root.querySelector('[data-agency-top]') : root.querySelector('#' + CSS.escape(id));
      if (target) {
        event.preventDefault();
        const header = root.querySelector('.site-header');
        closeMenu(header);
        const barHeight = header.querySelector('.site-header-bar').getBoundingClientRect().height;
        window.scrollTo({top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - barHeight - 20), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
      }
    }
    if (anchor?.closest('.site-nav')) closeMenu(anchor.closest('.site-header'));
    headers.forEach(header => {
      if (!header.contains(event.target)) closeMenu(header);
      header.querySelectorAll('.site-space').forEach(space => { if (!space.contains(event.target)) setSpace(space, false); });
    });
  });
  document.addEventListener('keydown', event => {
    const header = visibleHeader();
    if (!header) return;
    if (event.key === 'Escape') {
      header.querySelectorAll('.site-space.is-open').forEach(space => { setSpace(space, false); space.querySelector('button').focus(); });
      if (header.classList.contains('is-menu-open')) { closeMenu(header, true); event.preventDefault(); }
    }
    if (event.key === 'Tab' && mobile.matches && header.classList.contains('is-menu-open')) {
      const focusables = [...header.querySelectorAll('a[href],button')].filter(el => !el.closest('[inert]') && el.getBoundingClientRect().width && getComputedStyle(el).visibility !== 'hidden' && !el.classList.contains('legacy-language-control'));
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  mobile.addEventListener('change', () => headers.forEach(h => { closeMenu(h); h.querySelectorAll('.site-space').forEach(s => setSpace(s, false)); }));
  new MutationObserver(localize).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  window.addEventListener('scroll', onScroll, {passive: true});
  localize(); onScroll();
})();

// The sector baseline follows Alizé's reference; keep the existing scroll/logo animation.
(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)');let timer=null;const tick=()=>{document.querySelectorAll('.agency-rotator').forEach(rotator=>{const words=[...rotator.children],current=words.findIndex(w=>w.classList.contains('is-active')),index=current<0?0:current;words[index].classList.remove('is-active');words[index].classList.add('is-leaving');setTimeout(()=>words[index].classList.remove('is-leaving'),900);words[(index+1)%words.length].classList.add('is-active');});};const sync=()=>{clearInterval(timer);if(!reduced.matches)timer=setInterval(tick,2600);};reduced.addEventListener('change',sync);sync();})();
