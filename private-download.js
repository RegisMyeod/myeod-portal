/* Recette : forcer une nouvelle requete pour chaque lecture Storage privee. */
window.MyEODPrivateFetch = async function(input, init) {
 const source = input instanceof Request ? input.url : String(input);
 const url = new URL(source, window.location.href);
 const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
 const privateObject = url.origin === 'https://kewhxzitwdrnpsnzlihn.supabase.co' &&
  url.pathname.startsWith('/storage/v1/object/') &&
  !url.pathname.startsWith('/storage/v1/object/public/') &&
  !url.pathname.startsWith('/storage/v1/object/sign/');
 if (method === 'GET' && privateObject) {
  url.searchParams.set('cacheNonce', crypto.randomUUID());
  const request = input instanceof Request ? new Request(url.toString(), input) : url.toString();
  return window.fetch(request, {...init, cache:'no-store'});
 }
 return window.fetch(input, init);
};
