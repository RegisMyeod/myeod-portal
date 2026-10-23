'use strict';
// SSO controller for the MyEOD portal. No client secret belongs in this module.
// Each Supabase project may only be used from its own portal origins.
const RECIPE = 'https://hnsxwrarctqqasddtghq.supabase.co';
const PRODUCTION = 'https://kewhxzitwdrnpsnzlihn.supabase.co';
const ENVIRONMENTS = {
  [RECIPE]: ['https://portal.myexpertondemand.com'],
  [PRODUCTION]: ['https://www.myexpertondemand.com', 'https://myexpertondemand.com']
};
function createSSO({client, config, storage, location, history, now = Date.now}) {
  const key = 'myeod-recipe-sso-pending';
  let busy = false;
  const fail = () => new Error('SSO indisponible ou retour expiré. Recommencez la connexion.');
  function check() {
    const origins = Object.prototype.hasOwnProperty.call(ENVIRONMENTS, config.supabaseUrl) ? ENVIRONMENTS[config.supabaseUrl] : null;
    if (config.enabled !== true || !origins ||
        client.supabaseUrl.replace(/\/$/, '') !== config.supabaseUrl ||
        !Array.isArray(config.allowedOrigins) || !config.allowedOrigins.includes(location.origin) ||
        !origins.includes(location.origin) || location.protocol !== 'https:' ||
        !Array.isArray(config.allowedPaths) || !config.allowedPaths.includes(location.pathname)) throw fail();
  }
  function cleanURL() { history.replaceState(null, '', location.pathname); }
  async function start() {
    check(); if (busy) throw fail(); busy = true;
    try {
      storage.setItem(key, JSON.stringify({at: now(), path: location.pathname}));
      const {data, error} = await client.auth.signInWithOAuth({provider:'custom:authentik', options:{
        redirectTo:location.origin + location.pathname, skipBrowserRedirect:true
      }});
      if (error || !data?.url) throw fail();
      const url = new URL(data.url);
      if (url.origin !== config.supabaseUrl || url.pathname !== '/auth/v1/authorize') throw fail();
      location.assign(url.href);
    } catch (_) { storage.removeItem(key); throw fail(); }
    finally { busy = false; }
  }
  async function callback() {
    const params = new URLSearchParams(location.search);
    const implicit = /access_token=|refresh_token=/.test(location.hash);
    if (!params.has('code') && !params.has('error') && !implicit) return false;
    // Supabase reports a refused account creation (e.g. email already used by another
    // MyEOD account) as a database error; keep only that fact, never the raw text.
    const hash = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
    const description = params.get('error_description') || hash.get('error_description') || '';
    const accountConflict = params.has('error') && /database error saving new user/i.test(description);
    cleanURL();
    if (busy) throw fail(); busy = true;
    try {
      check();
      const raw = storage.getItem(key); storage.removeItem(key);
      const pending = raw && JSON.parse(raw);
      if (!pending || pending.path !== location.pathname || now() - pending.at > 600000 || now() < pending.at ||
          !Number.isFinite(pending.at)) throw fail();
      if (accountConflict) { const e = fail(); e.code = 'SSO_ACCOUNT_CONFLICT'; throw e; }
      if (params.has('error') || params.getAll('code').length !== 1 || !params.get('code') || implicit) throw fail();
      const result = await client.auth.exchangeCodeForSession(params.get('code'));
      if (result.error || !result.data?.session) throw fail();
      const verified = await client.auth.getUser();
      if (verified.error || !verified.data?.user?.id) throw fail();
      return true; // Caller must run existing load()/SQL authorization, not grant access here.
    } catch (e) {
      storage.removeItem(key);
      try { await client.auth.signOut({scope:'local'}); } catch (_) {}
      if (e && e.code === 'SSO_ACCOUNT_CONFLICT') throw e;
      throw fail();
    } finally { busy = false; }
  }
  return {start, callback};
}
// Keep the session through a page reload, but only for this browser tab.
function createPKCEStorage(sessionStorage, storageKey) {
  const allowed = key => key === storageKey || key.startsWith(storageKey + '-');
  return {
    getItem: key => allowed(key) ? sessionStorage.getItem(key) : null,
    setItem: (key, value) => { if (allowed(key)) sessionStorage.setItem(key, value); },
    removeItem: key => { if (allowed(key)) sessionStorage.removeItem(key); }
  };
}
if (typeof module !== 'undefined') module.exports = {createSSO, createPKCEStorage};
else window.MyEODSSO = {createSSO, createPKCEStorage};
