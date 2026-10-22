(function(){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function initAdmin(){
  const root=document.getElementById('admin-root');if(!root)return;
  const cfg=window.BOULDER_CONFIG,login=document.getElementById('admin-login'),status=document.getElementById('admin-login-status'),queue=document.getElementById('admin-queue');
  if(!cfg||!cfg.apiBase){status.textContent='The secure API is not configured. Login is unavailable.';return}
  const api=cfg.apiBase.replace(/\/$/,''),tokenKey='boulderAdminSession';
  const token=()=>sessionStorage.getItem(tokenKey)||'';
  const auth=()=>({'Authorization':'Bearer '+token(),'Accept':'application/json'});
  const editorHTML=()=>'<section class="admin-item"><h2>Publish a news article</h2><p class="form-help">Publishing makes the article visible on the news page and its full article page. Keep stories factual and avoid unnecessary personal details about children.</p><form id="admin-article-form"><div><label for="article-title">Headline</label><input id="article-title" name="title" maxlength="140" required></div><div><label for="article-section">Section</label><select id="article-section" name="section"><option>News</option><option>Whole group</option><option>Joey Scouts</option><option>Cub Scouts</option><option>Scouts</option><option>Venturer Scouts</option></select></div><div><label for="article-summary">Summary</label><textarea id="article-summary" name="summary" rows="2" maxlength="500" required></textarea></div><div><label for="article-body">Full article</label><textarea id="article-body" name="body" rows="8" maxlength="20000" required></textarea></div><button class="btn" type="submit">Publish article</button><p id="article-publish-status" class="form-status" role="status" aria-live="polite"></p></form></section>';
  function bindLogout(){const b=document.getElementById('admin-logout');if(b)b.onclick=()=>{sessionStorage.removeItem(tokenKey);queue.hidden=true;login.hidden=false;status.textContent='Signed out.'}}
  function bindArticleEditor(){
   const f=queue.querySelector('#admin-article-form');if(!f)return;const out=f.querySelector('#article-publish-status');
   f.addEventListener('submit',async e=>{e.preventDefault();const b=f.querySelector('button[type=submit]');b.disabled=true;out.textContent='Publishing…';const data=Object.fromEntries(new FormData(f).entries());
    try{const r=await fetch(api+'/api/admin/articles',{method:'POST',headers:{...auth(),'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});const result=await r.json().catch(()=>({}));if(!r.ok)throw new Error(result.error||'The article could not be published.');f.reset();out.textContent='Published successfully. ';const a=document.createElement('a');a.href='article.html?slug='+encodeURIComponent(result.slug);a.textContent='Open the full article';out.append(a)}catch(err){out.textContent=err.message||'Article publishing failed.'}finally{b.disabled=false}
   });
  }
  async function actOnSubmission(id,action,button){const label=action==='approve'?'approve and publish':'reject and delete';if(!confirm('Are you sure you want to '+label+' this submission?'))return;button.disabled=true;
   try{const r=await fetch(api+'/api/admin/submissions/'+encodeURIComponent(id)+'/'+action,{method:'POST',headers:{...auth(),'Content-Type':'application/json'},body:'{}'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Review action failed.');await loadQueue()}catch(err){alert(err.message||'Review action failed.');button.disabled=false}
  }
  async function renderQueue(items){
   queue.hidden=false;login.hidden=true;
   queue.innerHTML=editorHTML()+'<div class="button-row"><h2>Pending submissions</h2><button class="btn o" id="admin-logout" type="button">Sign out</button></div>'+(items.length?items.map(x=>'<article class="admin-item" data-id="'+esc(x.id)+'"><h3>'+esc(x.title||'(untitled)')+'</h3><p class="mute">'+esc(x.kind)+' · '+esc(x.section||'All sections')+' · '+esc(x.createdAt||'')+'</p><p>'+esc(x.story||'')+'</p><p class="form-help">Submitted by '+esc(x.submitterName||'')+' · '+esc(x.submitterEmail||'')+' (visible to signed-in admins only)</p><div class="admin-preview" data-previews></div><div class="button-row"><button class="btn" data-action="approve" type="button">Approve</button><button class="btn o" data-action="reject" type="button">Reject / delete</button></div></article>').join(''):'<p class="mute">No pending submissions right now.</p>');
   bindLogout();bindArticleEditor();
   for(const item of items){const el=queue.querySelector('[data-id="'+CSS.escape(item.id)+'"]');const previews=el&&el.querySelector('[data-previews]');if(!previews||!Array.isArray(item.media))continue;
    for(const media of item.media){const img=document.createElement('img');img.alt=media.title||'Pending submission image';img.referrerPolicy='no-referrer';previews.append(img);try{const r=await fetch(api+'/api/admin/media/'+encodeURIComponent(media.id),{headers:auth()});if(!r.ok)throw new Error('Preview unavailable');const url=URL.createObjectURL(await r.blob());img.src=url;img.dataset.objectUrl=url}catch(_){img.alt='Preview unavailable; sign in again or reload.';img.removeAttribute('src')}}
   }
   queue.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>actOnSubmission(b.closest('[data-id]').dataset.id,b.dataset.action,b)));
  }
  async function loadQueue(){queue.hidden=false;login.hidden=true;queue.innerHTML='<p>Loading pending submissions…</p>';
   try{const r=await fetch(api+'/api/admin/submissions',{headers:auth()});if(r.status===401||r.status===403)throw new Error('Your admin session has expired. Please sign in again.');const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load submissions.');await renderQueue(Array.isArray(d.submissions)?d.submissions:[])}
   catch(err){queue.hidden=true;login.hidden=false;status.textContent=err.message||'Could not load the review queue.';sessionStorage.removeItem(tokenKey)}
  }
  login.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Signing in…';const button=document.getElementById('admin-login-button');button.disabled=true;
   try{const r=await fetch(api+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({password:login.elements.password.value})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Login failed.');sessionStorage.setItem(tokenKey,d.token);login.reset();status.textContent='Signed in.';await loadQueue()}
   catch(err){status.textContent=err.message||'Login failed.'}finally{button.disabled=false}
  });
  if(token())loadQueue();
 }
 document.addEventListener('DOMContentLoaded',initAdmin);
})();
