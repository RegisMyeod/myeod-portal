(function(){
'use strict';
// Shortcuts to the technical tools according to the active MyEOD profile (V1).
// Showing a tool grants nothing: RSIP and Lizmap check the user's rights themselves.
// Mode 'link' (default): full-page links in the same tab, as agreed with Pascal on 23/10.
// Mode 'embed' (off): frame in the active project view, only if confirmed later
// (Lizmap embed first; needs framing allowed and myexpertondemand.com subdomains).
const CONFIG = Object.freeze({
  mode: 'link',
  roles: ['fondateur', 'collaborateur', 'client'],
  tools: [
    // url: generic address; projectUrl: per-project address ('{project}' = mapped id).
    {id: 'rsip', label: 'RSIP', url: 'https://maps.so-geo.com/rsip/', projectUrl: null},
    {id: 'gis', label: 'GIS', url: 'https://maps.so-geo.com/gis/', projectUrl: null}
  ],
  // MyEOD project id -> tool project id, per tool (Trion first, to be provided).
  projects: {}
});
const ALLOWED = /^https:\/\/[a-z0-9.-]+\.(myexpertondemand\.com|so-geo\.com)\//;
function toolsFor(role, projectId, cfg = CONFIG) {
  if (typeof role !== 'string' || !cfg.roles.includes(role)) return [];
  return cfg.tools.flatMap(t => {
    const mapped = projectId && cfg.projects?.[projectId]?.[t.id];
    const src = mapped && t.projectUrl ? t.projectUrl.replace('{project}', encodeURIComponent(mapped)) : t.url;
    if (cfg.mode === 'embed' && !mapped) return [];
    return src && ALLOWED.test(src) ? [{id: t.id, label: t.label, src}] : [];
  });
}
function render(role, en, projectId, cfg = CONFIG) {
  let panel = document.getElementById('portal-tools');
  const embed = cfg.mode === 'embed';
  const host = document.getElementById(embed ? 'workspace' : 'session-actions');
  const tools = (cfg.mode === 'link' || embed) ? toolsFor(role, projectId, cfg) : [];
  if (!host || !tools.length) { if (panel) panel.remove(); return []; }
  if (panel && panel.parent !== undefined && panel.parent !== host) { panel.remove(); panel = null; }
  if (!panel) {
    panel = document.createElement(embed ? 'section' : 'nav'); panel.id = 'portal-tools';
    const docs = embed && document.getElementById('documents');
    if (docs && typeof host.insertBefore === 'function') host.insertBefore(panel, docs); else host.appendChild(panel);
  }
  panel.setAttribute('aria-label', en ? 'Tools' : 'Outils');
  panel.replaceChildren();
  if (!embed) {
    panel.style.display = 'flex'; panel.style.gap = '0.75rem'; panel.style.alignItems = 'center';
    const title = document.createElement('span'); title.textContent = en ? 'Tools:' : 'Outils :'; panel.appendChild(title);
    for (const t of tools) {
      const a = document.createElement('a'); // same tab, no target
      a.href = t.src; a.textContent = t.label; a.rel = 'noreferrer'; a.dataset.tool = t.id; panel.appendChild(a);
    }
    return tools.map(t => t.id);
  }
  const bar = document.createElement('div'); bar.setAttribute('role', 'tablist'); panel.appendChild(bar);
  const frame = document.createElement('iframe');
  frame.id = 'portal-tools-frame';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads');
  frame.setAttribute('referrerpolicy', 'no-referrer');
  frame.style.width = '100%'; frame.style.height = '75vh'; frame.style.border = '1px solid #ddd';
  const show = t => { frame.src = t.src; frame.title = t.label;
    for (const b of bar.children) b.setAttribute('aria-selected', String(b.dataset.tool === t.id)); };
  for (const t of tools) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = t.label;
    b.dataset.tool = t.id; b.setAttribute('role', 'tab'); b.onclick = () => show(t); bar.appendChild(b);
  }
  panel.appendChild(frame); show(tools[0]);
  return tools.map(t => t.id);
}
const api = {render, toolsFor, CONFIG};
if (typeof module !== 'undefined') module.exports = api; else window.MyEODTools = api;
})();
