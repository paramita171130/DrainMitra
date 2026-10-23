const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const toast = $('#toast');
let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2800)}
function todayLabel(){const d=new Date();return d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
$('#today').textContent=todayLabel();
let reviewed = new Set();
function updateAlertCounts(){
 const n=$$('.alert-row').filter(row=>!row.classList.contains('row-reviewed')).length;
 $('#nav-alert-count').textContent=n;$('#metric-alerts').innerHTML=String(n).padStart(2,'0')+' <small>need review</small>';
 $('#alert-count').textContent=n+' open';
}
function applyFilters(){
 const q=$('#drain-search').value.trim().toLowerCase(), status=$('#status-filter').value;
 let visible=0;
 $$('#drain-rows tr').forEach(row=>{const match=row.dataset.id.toLowerCase().includes(q)&&(status==='all'||row.dataset.status===status);row.hidden=!match;if(match)visible++});
 $('#visible-count').textContent=visible;$('#empty-state').hidden=visible!==0;
}
$('#drain-search').addEventListener('input',applyFilters);
$('#status-filter').addEventListener('change',applyFilters);
$('#refresh-btn').addEventListener('click',()=>{const btn=$('#refresh-btn');btn.disabled=true;btn.textContent='↻ Refreshing…';setTimeout(()=>{btn.disabled=false;btn.textContent='↻ Refresh readings';notify('Demo readings refreshed. No live sensors are connected.')},550)});
$$('[data-resolve]').forEach(btn=>btn.addEventListener('click',()=>{const row=btn.closest('.alert-row');if(row.classList.contains('row-reviewed'))return;row.classList.add('row-reviewed');btn.textContent='Reviewed';btn.disabled=true;reviewed.add(btn.dataset.resolve);updateAlertCounts();notify(btn.dataset.resolve+' marked as reviewed in this demo.')}));
$$('[data-detail]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.detail,row=$('#drain-rows tr[data-id="'+id+'"]');notify(id+' · '+row.dataset.status+' status. Readings are simulated.')}));
const backdrop=$('#modal-backdrop');
function openModal(){backdrop.hidden=false;$('#log-notes').focus()}
function closeModal(){backdrop.hidden=true;$('#log-form').reset()}
$('#add-log-btn').addEventListener('click',openModal);
$('#modal-close').addEventListener('click',closeModal);
$('#cancel-log').addEventListener('click',closeModal);
backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!backdrop.hidden)closeModal()});
$('#log-form').addEventListener('submit',e=>{
 e.preventDefault();
 const drain=$('#log-drain').value, activity=$('#log-activity').value, notes=$('#log-notes').value.trim();
 const row=document.createElement('div');row.className='log-row';
 const icon=document.createElement('span');icon.className='log-icon blue-log';icon.textContent='✓';
 const body=document.createElement('div');const title=document.createElement('b');title.textContent=activity;
 const desc=document.createElement('p');desc.textContent=drain+' · '+(notes||'No additional notes');
 const time=document.createElement('small');time.textContent='Just now · Demo entry';
 body.append(title,desc,time);row.append(icon,body);$('#log-list').prepend(row);
 const total=$$('#log-list .log-row').length;$('#maintenance-total').textContent=String(17+total-3);
 closeModal();notify('Maintenance entry added to this demo session.');
});
updateAlertCounts();

// Persistent end-user accounts use Hatchable's verified-email authentication.
const loginScreen=$('#login-screen');
const appShell=$('#app-shell');
const loginForm=$('#login-form');
const signupForm=$('#signup-form');
const auth=window.hatchable&&window.hatchable.auth;
let loginStep='email';
let signupStep='details';
let currentProfile=null;
function showDashboard(){loginScreen.hidden=true;appShell.hidden=false}
function showLogin(){loginScreen.hidden=false;appShell.hidden=true}
function showLoginError(message){$('#login-error').textContent=message;$('#login-error').hidden=false}
function showSignupError(message){$('#signup-error').textContent=message;$('#signup-error').hidden=false}
function errorText(err,fallback){return err&&err.message?err.message:fallback}
async function requestProfile(method='GET',body){
 const response=await fetch('/api/account/profile',{method,headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||'Could not load your profile.');
 return data;
}
function initials(name){return String(name||'DM').trim().split(/\\s+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('')||'DM'}
function personalize(profile,account){
 const name=(profile&&profile.full_name)||(account&&account.name)||'DrainMitra user';
 const email=(profile&&profile.email)||(account&&account.email)||'';
 const organization=(profile&&profile.organization)||'Personal workspace';
 currentProfile={name,email,organization,accountType:'Verified account'};
 $('#welcome-heading').innerHTML='Welcome, <em></em>';
 $('#welcome-heading em').textContent=name.split(/\\s+/)[0]+'.';
 $('#user-name-sidebar').textContent=name;
 $('#user-org-sidebar').textContent=organization||'Personal workspace';
 $('#user-avatar-sidebar').textContent=initials(name);
 $('#top-profile-btn').textContent=initials(name);
 const details=$$('.profile-detail b');
 if(details.length>=4){details[0].textContent=name;details[1].textContent=email;details[2].textContent=organization||'Personal workspace';details[3].textContent='Verified email account';}
 const labels=$$('.profile-detail span');
 if(labels.length>=4){labels[0].textContent='Full name';labels[1].textContent='Verified email';labels[2].textContent='Organization';labels[3].textContent='Account type';}
 const eyebrow=$('.profile-modal .eyebrow');if(eyebrow)eyebrow.textContent='ACCOUNT PROFILE';
 const subtitle=$('.profile-modal-subtitle');if(subtitle)subtitle.textContent='Your saved DrainMitra account details.';
}
async function enterAccount(){
 const session=await auth.getSession();
 if(!session||!session.user){showLogin();return}
 const data=await requestProfile('GET');
 personalize(data.profile,data.account||session.user);
 showDashboard();
}
if(auth){
 auth.getSession().then(session=>{
   if(session&&session.user)enterAccount().catch(()=>showLogin());
   else showLogin();
 }).catch(()=>showLogin());
}else{
 showLogin();
 showLoginError('Account sign-in is not available yet. Please refresh in a moment.');
}
$('#login-form').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!auth){showLoginError('Secure sign-in is unavailable. Please refresh and try again.');return}
 const email=$('#login-username').value.trim().toLowerCase();
 const code=$('#login-password').value.trim();
 const submit=$('#login-submit');submit.disabled=true;$('#login-error').hidden=true;
 try{
   if(loginStep==='email'){
     await auth.startLogin({email});
     loginStep='code';$('#login-code-row').hidden=false;$('#login-password').required=true;
     submit.innerHTML='Verify code & sign in <span>→</span>';
     showLoginError('A one-time code was requested for '+email+'. Check your email and enter it below.');
     $('#login-error').style.color='#168f83';$('#login-password').focus();
   }else{
     await auth.verifyCode({email,code});
     const data=await requestProfile('GET');
     if(!data.profile){
       await auth.signOut();
       showLoginError('No account exists for this email yet. Please create a DrainMitra account first.');
       return;
     }
     personalize(data.profile,data.account);
     showDashboard();notify('Signed in successfully. Welcome to DrainMitra.');
   }
 }catch(err){showLoginError(errorText(err,'Could not sign in. Check the email/code and try again.'));$('#login-error').style.color='';}
 finally{submit.disabled=false}
});
$('#show-signup').addEventListener('click',()=>{
 loginForm.hidden=true;signupForm.hidden=false;$('#login-error').hidden=true;
 signupStep='details';$('#signup-code-row').hidden=true;$('#signup-name').focus();
});
$('#back-to-login').addEventListener('click',()=>{
 signupForm.hidden=true;loginForm.hidden=false;$('#signup-error').hidden=true;
 signupStep='details';$('#signup-code-row').hidden=true;$('#signup-submit').innerHTML='Verify email & create account <span>→</span>';
});
signupForm.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!auth){showSignupError('Secure sign-up is unavailable. Please refresh and try again.');return}
 const name=$('#signup-name').value.trim(),email=$('#signup-email').value.trim().toLowerCase(),organization=$('#signup-organization').value.trim(),code=$('#signup-code').value.trim();
 if(!name||!email||!$('#signup-consent').checked){showSignupError('Enter your name and email, and accept the linked policies.');return}
 const submit=$('#signup-submit');submit.disabled=true;$('#signup-error').hidden=true;
 try{
   if(signupStep==='details'){
     await auth.startLogin({email});
     signupStep='code';$('#signup-code-row').hidden=false;$('#signup-code').required=true;
     submit.innerHTML='Verify code & save profile <span>→</span>';
     showSignupError('We requested a one-time code for '+email+'. Enter it here to verify your email and create your account.');
     $('#signup-error').style.color='#168f83';$('#signup-code').focus();
   }else{
     await auth.verifyCode({email,code});
     const data=await requestProfile('POST',{fullName:name,organization});
     personalize(data.profile,{email});
     loginStep='email';signupStep='details';
     showDashboard();notify('Your verified account and profile are saved. Welcome, '+name.split(/\\s+/)[0]+'.');
   }
 }catch(err){showSignupError(errorText(err,'Could not verify your email. Check the code and try again.'));$('#signup-error').style.color='';}
 finally{submit.disabled=false}
});
const profileBackdrop=$('#profile-backdrop');
function openProfile(){
 if(currentProfile)personalize({full_name:currentProfile.name,email:currentProfile.email,organization:currentProfile.organization},null);
 profileBackdrop.hidden=false
}
function closeProfile(){profileBackdrop.hidden=true}
$('#top-profile-btn').addEventListener('click',openProfile);
$('#sidebar-profile-btn').addEventListener('click',openProfile);
$('#profile-close').addEventListener('click',closeProfile);
$('#profile-done').addEventListener('click',closeProfile);
profileBackdrop.addEventListener('click',e=>{if(e.target===profileBackdrop)closeProfile()});
$('#logout-btn').addEventListener('click',async()=>{
 try{if(auth)await auth.signOut()}catch(err){notify('Sign-out could not be confirmed. Please try again.');return}
 currentProfile=null;loginStep='email';signupStep='details';
 $('#login-password').value='';$('#login-code-row').hidden=true;$('#login-password').required=false;
 $('#login-submit').innerHTML='Email me a sign-in code <span>→</span>';
 $('#login-error').hidden=true;signupForm.hidden=true;loginForm.hidden=false;showLogin();
 notify('You have signed out of DrainMitra.');
});
$$('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{
 const value=btn.dataset.copy;
 try{await navigator.clipboard.writeText(value);btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy',1400)}catch{const input=document.createElement('textarea');input.value=value;document.body.append(input);input.select();document.execCommand('copy');input.remove();btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy',1400)}
}));