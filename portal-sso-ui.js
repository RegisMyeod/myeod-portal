(function(){
'use strict';
window.MyEODSSOUI = function({client,config,load,clear,isBusy,setBusy}) {
 const form=document.getElementById('login-form'), message=document.getElementById('message');
 const button=document.createElement('button'), status=document.createElement('p');
 button.type='button';button.id='sso-login';button.className='login-button';
 button.style.width='100%';button.style.marginTop='0.5rem';
 status.id='sso-status';status.setAttribute('role','status');button.setAttribute('aria-describedby',status.id);
 form.after(button,status);
 const en=()=>document.documentElement.lang==='en';
 const text=(fr,eng)=>en()?eng:fr;
 let working=false;
 const enabled=config.enabled===true;
 function labels(){
  button.textContent=text('Se connecter avec Authentik','Sign in with Authentik');
  button.disabled=!enabled||working;
  status.textContent=working?text('Connexion en cours…','Signing in…'):enabled?'':text('SSO en préparation — connexion habituelle disponible.','SSO being prepared — existing sign-in remains available.');
 }
 new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 let saved=[];
 function lock(value){
  working=value;setBusy(value);
  if(value){saved=[...form.elements].map(el=>[el,el.disabled]);saved.forEach(([el])=>el.disabled=true);}
  else {saved.forEach(([el,disabled])=>el.disabled=disabled);saved=[];}
  labels();
 }
 function storage(){return window.sessionStorage;}
 const proxy={getItem:k=>storage().getItem(k),setItem:(k,v)=>storage().setItem(k,v),removeItem:k=>{try{storage().removeItem(k);}catch(_){}}};
 const controller=window.MyEODSSO.createSSO({client,config,storage:proxy,location:window.location,history:window.history});
 async function report(error){
  clear();try{await client.auth.signOut({scope:'local'});}catch(_){}
  message.textContent=error?.code==='PASSWORD_REQUIRED'
   ?text('Ce compte nécessite une intervention avant sa connexion SSO. Contactez votre administrateur.','This account needs attention before SSO sign-in. Contact your administrator.')
   :text('Connexion SSO indisponible ou expirée. Réessayez ou utilisez votre connexion habituelle.','SSO unavailable or expired. Try again or use your existing sign-in.');
  message.setAttribute('role','alert');
 }
 button.onclick=async()=>{if(isBusy()||!enabled)return;lock(true);try{await controller.start();}catch(e){await report(e);}finally{lock(false);}};
 labels();
 // Immediately prevent local submission until the callback has been handled.
 lock(true);
 controller.callback().then(async connected=>{if(connected)await load();}).catch(report).finally(()=>lock(false));
};
})();
