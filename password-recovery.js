(function(){
'use strict';
const en=document.documentElement.lang==='en',t=(fr,eng)=>en?eng:fr,$=id=>document.getElementById(id),host='kewhxzitwdrnpsnzlihn.supabase.co';
const sb=window.supabase.createClient('https://'+host,'sb_publishable_owbl6MuPlOfMYAOPMxQ8Hg_deQuxLWi',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'myeod-password-recovery'}});
let busy=false,recoveryUser=null,recoveryEmail=null;
const note=text=>{$('recovery-log').textContent+='\n'+text;};

function recoveryStage(stage){
 const labels={
  request:[t('Réinitialisation du mot de passe','Password reset'),t('Récupérer votre mot de passe','Recover your password'),t('Renseignez votre email pour recevoir un lien de récupération. Vous pouvez aussi utiliser le code reçu.','Enter your email to receive a recovery link. You can also use the emailed code.')],
  confirm:[t('Réinitialisation du mot de passe','Password reset'),t('Confirmer la récupération','Confirm password recovery'),t('Cliquez sur Continuer pour choisir un nouveau mot de passe.','Click Continue to choose a new password.')],
  password:[t('Nouveau mot de passe','New password'),t('Choisir un nouveau mot de passe','Set your new password'),t('Saisissez votre nouveau mot de passe et confirmez-le.','Enter your new password and confirm it.')],
  success:[t('Mot de passe','Password'),t('Mot de passe modifié.','Password updated.'),t('Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.','You can now sign in with your new password.')]
 };
 const value=labels[stage];if(!value)return;
 for(const [id,text] of [['recovery-header',value[0]],['recovery-heading',value[1]],['recovery-subtitle',value[2]]]){const el=$(id);if(el)el.textContent=text;}
 const done=stage==='success';$('recovery-cancel').hidden=done;
 if($('recovery-diagnostics'))$('recovery-diagnostics').hidden=done;
 $('recovery-success').hidden=!done;
 if(done)$('recovery-login').textContent=t('Se connecter','Sign in');
}
recoveryStage('request');

function resetAccess(){$('recovery-email').readOnly=false;recoveryUser=null;recoveryEmail=null;$('recovery-change').hidden=true;$('recovery-change').reset();recoveryStage('request');}
function fail(e){const raw=String(e?.message||e),msg=/failed to fetch|networkerror|network request failed/i.test(raw)?t('Connexion réseau indisponible. Rétablissez Internet puis réessayez.','Network unavailable. Restore your connection and try again.'):/expired|invalid.*token|otp.*invalid/i.test(raw)?t('Lien ou code invalide, expiré ou déjà utilisé. Demandez un nouvel email.','Link or code invalid, expired or already used. Request a new email.'):e?.safe?raw:t('Opération non confirmée. Vérifiez la connexion et réessayez.','Operation not confirmed. Check your connection and try again.');$('recovery-message').textContent=msg;note(msg);}
function error(fr,eng){const e=Error(t(fr,eng));e.safe=true;return e;}
async function safe(action){if(busy)return;busy=true;for(const b of document.querySelectorAll('form button'))b.disabled=true;$('recovery-message').textContent='';try{await action();}catch(e){fail(e);}finally{busy=false;for(const b of document.querySelectorAll('form button'))b.disabled=false;}}
async function currentIdentity(){const r=await sb.auth.getUser();if(r.error||!r.data.user||r.data.user.id!==recoveryUser||r.data.user.email?.toLowerCase()!==recoveryEmail)throw error('Session de récupération non confirmée. Validez un nouveau lien ou code.','Recovery session not confirmed. Verify a new link or code.');return r.data.user;}
$('recovery-request').addEventListener('submit',e=>{e.preventDefault();safe(async()=>{resetAccess();await sb.auth.signOut({scope:'local'});const email=$('recovery-email').value.trim().toLowerCase();if(!email)throw error('Renseignez votre email.','Enter your email.');let options;
 if(location.protocol==='https:'||location.protocol==='http:'){const callback=new URL(en?'reset-password-en.html':'reset-password.html',location.href);options={redirectTo:callback.href};}
 const r=await sb.auth.resetPasswordForEmail(email,options);if(r.error)throw r.error;
 const text=t('Si cette adresse correspond à un compte, un email de récupération sera envoyé. Utilisez le code ou copiez le lien reçu dans le champ ci-dessous.','If this address belongs to an account, a recovery email will be sent. Use the code or copy the received link into the field below.');$('recovery-message').textContent=text;note(t('Demande de récupération acceptée. Réception de l’email à confirmer.','Recovery request accepted. Email receipt remains to be confirmed.'));});});
$('recovery-verify').addEventListener('submit',e=>{e.preventDefault();safe(async()=>{resetAccess();const email=$('recovery-email').value.trim().toLowerCase(),value=$('recovery-token').value.trim();$('recovery-token').value='';if(!email)throw error('Renseignez l’email du compte à récupérer.','Enter the email of the account to recover.');let params;
 if(/^\d{6,10}$/.test(value))params={email,token:value,type:'recovery'};
 else{let url;try{url=new URL(value);}catch{throw error('Code reçu par email ou lien de récupération complet requis.','Enter the emailed code or full recovery link.');}
 if(url.protocol!=='https:'||url.hostname!==host||url.pathname!=='/auth/v1/verify'||url.searchParams.get('type')!=='recovery'||!url.searchParams.get('token'))throw error('Lien de récupération MyEOD requis.','A MyEOD recovery link is required.');
 params={token_hash:url.searchParams.get('token'),type:'recovery'};}
 const r=await sb.auth.verifyOtp(params);if(r.error)throw r.error;
 if(!r.data.session||!r.data.user||r.data.user.email?.toLowerCase()!==email){await sb.auth.signOut({scope:'local'});throw error('Le lien ou code ne correspond pas à cet email.','The link or code does not match this email.');}
 recoveryUser=r.data.user.id;recoveryEmail=email;await currentIdentity();$('recovery-email').readOnly=true;$('recovery-change').hidden=false;recoveryStage('password');$('recovery-new').focus();note(t('Récupération validée par Auth. Vous pouvez choisir votre mot de passe.','Recovery verified by Auth. You can choose your password.'));});});
$('recovery-change').addEventListener('submit',e=>{e.preventDefault();safe(async()=>{if(!recoveryUser)throw error('Validez le lien ou code avant de changer le mot de passe.','Verify the link or code before changing your password.');
 const user=await currentIdentity(),password=$('recovery-new').value;if(password.length<6)throw error('Utilisez au moins 6 caractères.','Use at least 6 characters.');if(password!==$('recovery-confirm').value)throw error('Les mots de passe ne correspondent pas.','The passwords do not match.');
 const r=await sb.auth.updateUser({password});if(r.error)throw r.error;$('recovery-change').reset();if(!r.data.user||r.data.user.id!==user.id)throw error('Identité inattendue. Reconnectez-vous.','Unexpected identity. Sign in again.');
 const p=await sb.from('profiles').select('role,must_change_password').eq('id',user.id).single();if(p.error||p.data.must_change_password!==false)throw error('Mot de passe modifié, mais confirmation du profil indisponible. Reconnectez-vous avant de réessayer.','Password changed, but profile confirmation is unavailable. Sign in before trying again.');
 const result=await sb.auth.signOut({scope:'local'});if(result.error)throw error('Mot de passe confirmé ; déconnexion à vérifier.','Password confirmed; sign-out requires verification.');
 resetAccess();$('recovery-verify').hidden=true;$('recovery-request').hidden=true;$('recovery-success').hidden=false;recoveryStage('success');$('recovery-login').href=p.data.role==='client'?(en?'client-login-en.html':'client-login.html'):p.data.role==='fondateur'?(en?'acces-collaborateurs-en.html':'acces-collaborateurs.html'):(en?'acces-collaborateurs-en.html':'acces-collaborateurs.html');
 $('recovery-message').textContent='';note(t('Mot de passe enregistré.','Password saved.'));});});
$('recovery-cancel').onclick=()=>safe(async()=>{const r=await sb.auth.signOut({scope:'local'});resetAccess();if(r.error)throw r.error;note(t('Récupération annulée.','Recovery cancelled.'));});
// Retour heberge : aucun jeton TokenHash consomme avant confirmation explicite.
(async()=>{let url;try{url=new URL(location.href);}catch{return;}
 const hash=new URLSearchParams(url.hash.slice(1)),query=url.searchParams;
 const tokenHash=query.get('type')==='recovery'?query.get('token_hash'):null;
 const implicit=hash.get('type')==='recovery'&&hash.get('access_token')&&hash.get('refresh_token');
 const returnedError=hash.get('error')||hash.get('error_code')||query.get('error')||query.get('error_code');
 if(!tokenHash&&!implicit&&!returnedError)return;
 try{history.replaceState(null,'',url.pathname);}catch{}
 if(returnedError){resetAccess();fail(error('Lien invalide, expiré ou déjà utilisé. Demandez un nouvel email de récupération.','Link invalid, expired or already used. Request a new recovery email.'));return;}
 async function adoptRecovery(r){
  if(r.error)throw r.error;if(!r.data.user||!r.data.session)throw error('Récupération non confirmée.','Recovery not confirmed.');
  recoveryUser=r.data.user.id;recoveryEmail=r.data.user.email?.toLowerCase();await currentIdentity();$('recovery-email').value=recoveryEmail;$('recovery-email').readOnly=true;$('recovery-request').hidden=true;$('recovery-verify').hidden=true;$('recovery-change').hidden=false;recoveryStage('password');note(t('Lien de récupération validé par Auth.','Recovery link verified by Auth.'));
 }
 if(tokenHash){
  resetAccess();$('recovery-request').hidden=true;$('recovery-verify').hidden=true;
  recoveryStage('confirm');const button=document.createElement('button');button.id='recovery-link-confirm';button.type='button';button.textContent=t('Continuer la récupération','Continue recovery');
  $('recovery-message').textContent=t('Votre lien est prêt. Cliquez sur Continuer pour valider la récupération et choisir un nouveau mot de passe.','Your link is ready. Click Continue to verify recovery and choose a new password.');
  $('recovery-request').parentNode.insertBefore(button,$('recovery-request'));
  button.onclick=()=>safe(async()=>{button.disabled=true;try{
   await adoptRecovery(await sb.auth.verifyOtp({token_hash:tokenHash,type:'recovery'}));button.remove();
  }catch(e){await sb.auth.signOut({scope:'local'}).catch(()=>{});resetAccess();$('recovery-request').hidden=false;$('recovery-verify').hidden=false;button.remove();throw e;}});
  return;
 }
 await safe(async()=>{resetAccess();await adoptRecovery(await sb.auth.setSession({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token')}));});
})();

})();
