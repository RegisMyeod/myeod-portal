(function(){
'use strict';
window.MyEODSSOUI = function({client,config,load,clear,isBusy,setBusy}) {
 const form=document.getElementById('login-form'), message=document.getElementById('message');
 const button=document.createElement('button'), status=document.createElement('p');
 button.type='button';button.id='sso-login';button.className='login-button';
 button.style.width='100%';
 status.id='sso-status';status.setAttribute('role','status');button.setAttribute('aria-describedby',status.id);
 const en=()=>document.documentElement.lang==='en';
 const text=(fr,eng)=>en()?eng:fr;
 let working=false;
 const enabled=config.enabled===true;
 // SSO active: SSO button first, password form folded behind a toggle.
 // SSO inactive: unchanged password form, disabled SSO button below it.
 let toggle=null;
 if(enabled){
  if(!form.id)form.id='login-form';
  toggle=document.createElement('button');
  toggle.type='button';toggle.id='password-login-toggle';toggle.className='password-login-toggle';
  toggle.setAttribute('aria-controls',form.id);toggle.setAttribute('aria-expanded','false');
  Object.assign(toggle.style,{display:'block',width:'100%',marginTop:'1rem',padding:'0.5rem',background:'none',border:'0',color:'inherit',textDecoration:'underline',textUnderlineOffset:'3px',cursor:'pointer',font:'inherit'});
  // The password-recovery footer belongs to the password form: fold it too.
  const footer=form.parentElement&&typeof form.parentElement.querySelector==='function'?form.parentElement.querySelector('.login-footer'):null;
  const fold=hide=>{form.hidden=hide;if(footer)footer.hidden=hide;};
  fold(true);
  form.before(button,status,toggle);
  toggle.onclick=()=>{
   const open=form.hidden;fold(!open);toggle.setAttribute('aria-expanded',String(open));labels();
   if(open){const first=form.elements[0];if(first&&typeof first.focus==='function')first.focus();}
  };
 } else {
  button.style.marginTop='0.5rem';
  form.after(button,status);
 }
 function labels(){
  button.textContent=text('Se connecter avec MyEOD SSO','Sign in with MyEOD SSO');
  button.disabled=!enabled||working;
  if(toggle){
   const open=!form.hidden;
   toggle.textContent=(open?'\u25B4 ':'\u25BE ')+text('Connexion par email et mot de passe','Sign in with email and password');
   toggle.disabled=working;
  }
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
