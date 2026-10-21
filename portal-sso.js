'use strict';
// Recipe-only controller. No client secret belongs in this module.
const RECIPE = 'https://hnsxwrarctqqasddtghq.supabase.co';
function createSSO({client, config, storage, location, history, now = Date.now}) {
  const key = 'myeod-recipe-sso-pending';
  let busy = false;
  const fail = () => new Error('SSO indisponible ou retour expiré. Recommencez la connexion.');
  function check() {
    if (config.enabled !== true || config.supabaseUrl !== RECIPE ||
        client.supabaseUrl.replace(/\/$/, '') !== RECIPE ||
        !Array.isArray(config.allowedOrigins) || !config.allowedOrigins.includes(location.origin) ||
        location.protocol !== 'https:' || /(^|\.)myexpertondemand\.com$/i.test(location.hostname) &&
        ['myexpertondemand.com','www.myexpertondemand.com'].includes(location.hostname) ||
        !config.allowedPaths.includes(location.pathname)) throw fail();
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
      if (url.origin !== RECIPE || url.pathname !== '/auth/v1/authorize') throw fail();
      location.assign(url.href);
    } catch (_) { storage.removeItem(key); throw fail(); }
    finally { busy = false; }
  }
  async function callback() {
    const params = new URLSearchParams(location.search);
    const implicit = /access_token=|refresh_token=/.test(location.hash);
    if (!params.has('code') && !params.has('error') && !implicit) return false;
    cleanURL();
    if (busy) throw fail(); busy = true;
    try {
      check();
      const raw = storage.getItem(key); storage.removeItem(key);
      const pending = raw && JSON.parse(raw);
      if (!pending || pending.path !== location.pathname || now() - pending.at > 600000 || now() < pending.at ||
          !Number.isFinite(pending.at) || params.has('error') || params.getAll('code').length !== 1 || !params.get('code') ||
          implicit) throw fail();
      const result = await client.auth.exchangeCodeForSession(params.get('code'));
      if (result.error || !result.data?.session) throw fail();
      const verified = await client.auth.getUser();
      if (verified.error || !verified.data?.user?.id) throw fail();
      return true; // Caller must run existing load()/SQL authorization, not grant access here.
    } catch (_) {
      storage.removeItem(key);
      try { await client.auth.signOut({scope:'local'}); } catch (_) {}
      throw fail();
    } finally { busy = false; }
  }
  return {start, callback};
}
// Keep the recipe session through a page reload, but only for this browser tab.
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
