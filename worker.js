const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const ALLOWED_SECTIONS = new Set(['joeys','cubs','scouts','venturers']);
const MAX_FILES = 5, MAX_FILE_BYTES = 8 * 1024 * 1024, SESSION_SECONDS = 12 * 60 * 60;
const MIME_EXT = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' };

function json(data, status=200, headers={}) { return new Response(JSON.stringify(data), {status, headers:{...JSON_HEADERS, ...headers}}); }
function xml(text, status=200) { return new Response(text, {status, headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public, max-age=300'}}); }
function escXml(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
function slugify(s) { return String(s||'story').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90) || 'story'; }
function isoNow() { return new Date().toISOString(); }
function apiBase(env) { return (env.API_PUBLIC_URL || '').replace(/\/$/,''); }
function originAllowed(origin, env) {
  if (!origin) return true;
  const allowed = new Set(['https://boulderscouts.com','https://www.boulderscouts.com','https://scoutpegs.github.io']);
  (env.ALLOWED_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean).forEach(s=>allowed.add(s));
  try { const u = new URL(origin); if (['localhost','127.0.0.1'].includes(u.hostname)) allowed.add(u.origin); } catch (_) {}
  return allowed.has(origin);
}
function corsHeaders(req, env) {
  const origin = req.headers.get('Origin') || '';
  const h = {'Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, Accept','Access-Control-Max-Age':'86400'};
  if (originAllowed(origin, env) && origin) h['Access-Control-Allow-Origin'] = origin;
  return h;
}
function respond(req, env, body, status=200, headers={}) { return new Response(body, {status, headers:{...headers,...corsHeaders(req,env)}}); }
function apiJson(req, env, data, status=200, extra={}) { return respond(req,env,JSON.stringify(data),status,{...JSON_HEADERS,...extra}); }
function secureEqual(a,b) { const x=new TextEncoder().encode(String(a||'')), y=new TextEncoder().encode(String(b||'')); let diff=x.length^y.length; const n=Math.max(x.length,y.length); for(let i=0;i<n;i++) diff|=(x[i]||0)^(y[i]||0); return diff===0; }
async function sha256(value) { const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)); return [...new Uint8Array(data)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
function randomToken() { const b=crypto.getRandomValues(new Uint8Array(32)); return [...b].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function clientIp(req) { return req.headers.get('CF-Connecting-IP') || 'unknown'; }
async function rateLimit(env, req, scope, limit, windowSeconds) {
  if (!env.DB || !env.RATE_LIMIT_SALT) return {ok:false, reason:'Rate limiting is not configured.'};
  const key=await sha256(env.RATE_LIMIT_SALT+'|'+scope+'|'+clientIp(req));
  const cutoff=new Date(Date.now()-windowSeconds*1000).toISOString();
  const row=await env.DB.prepare('SELECT COUNT(*) AS n FROM rate_limits WHERE rate_key=? AND created_at>=?').bind(key,cutoff).first();
  if ((row?.n||0)>=limit) return {ok:false, reason:'Too many requests. Please try again later.'};
  await env.DB.prepare('INSERT INTO rate_limits(rate_key,created_at) VALUES(?,?)').bind(key,isoNow()).run();
  return {ok:true};
}
async function checkTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return false; // Fail closed: never bypass missing anti-spam configuration.
  if (!token) return false;
  const form=new FormData(); form.set('secret',env.TURNSTILE_SECRET); form.set('response',token); if(ip&&ip!=='unknown')form.set('remoteip',ip);
  try { const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form}); const d=await r.json(); return d.success===true; } catch (_) { return false; }
}
async function adminSession(req, env) {
  const m=(req.headers.get('Authorization')||'').match(/^Bearer\s+([a-f0-9]{64})$/i); if(!m||!env.DB||!env.ADMIN_SESSION_SECRET)return null;
  const hash=await sha256(env.ADMIN_SESSION_SECRET+'|'+m[1]); const row=await env.DB.prepare('SELECT token_hash,expires_at FROM admin_sessions WHERE token_hash=? AND expires_at>?').bind(hash,isoNow()).first(); return row?{hash,expiresAt:row.expires_at}:null;
}
async function requireAdmin(req, env) { const session=await adminSession(req,env); return session; }
async function requireBindings(env, names=['DB','MEDIA_BUCKET']) { return names.every(n=>!!env[n]); }
function validateImageBytes(bytes, mime) {
  if(mime==='image/jpeg') return bytes.length>3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(mime==='image/png') return bytes.length>8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  if(mime==='image/webp') return bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  return false;
}
async function publicPhotos(req, env, url) {
  if(!env.DB)return apiJson(req,env,{error:'Database binding DB is not configured.'},503);
  const section=url.searchParams.get('section')||'all'; if(section!=='all'&&!ALLOWED_SECTIONS.has(section))return apiJson(req,env,{error:'Invalid section.'},400);
  let rows;
  if(section==='all') rows=await env.DB.prepare(`SELECT id,section,title,caption,created_at FROM media WHERE status='approved' ORDER BY COALESCE(approved_at,created_at) DESC LIMIT 40`).all();
  else rows=await env.DB.prepare(`SELECT id,section,title,caption,created_at FROM media WHERE status='approved' AND section=? ORDER BY COALESCE(approved_at,created_at) DESC LIMIT 10`).bind(section).all();
  const photos=(rows.results||[]).map(x=>({id:x.id,section:x.section,title:x.title||'',caption:x.caption||'',alt:x.caption||x.title||'Boulder Scout Group activity',createdAt:x.created_at,url:apiBase(env)+'/api/media/'+encodeURIComponent(x.id)}));
  return apiJson(req,env,{photos});
}
async function servePublicMedia(req, env, id) {
  if(!env.DB||!env.MEDIA_BUCKET)return respond(req,env,'Media service is not configured.',503);
  const row=await env.DB.prepare(`SELECT r2_key,content_type FROM media WHERE id=? AND status='approved'`).bind(id).first();
  if(!row)return respond(req,env,'Not found',404,{'Content-Type':'text/plain; charset=utf-8'});
  const object=await env.MEDIA_BUCKET.get(row.r2_key); if(!object)return respond(req,env,'Not found',404,{'Content-Type':'text/plain; charset=utf-8'});
  const headers={'Content-Type':row.content_type,'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'};
  object.writeHttpMetadata(headers); headers['Content-Type']=row.content_type; headers['X-Content-Type-Options']='nosniff';
  return respond(req,env,object.body,200,headers);
}
async function getNews(req, env, url) {
  if(!env.DB)return apiJson(req,env,{error:'Database binding DB is not configured.'},503);
  const slug=url.searchParams.get('slug');
  if(slug){const a=await env.DB.prepare(`SELECT slug,title,section,summary,body,published_at FROM articles WHERE status='published' AND slug=?`).bind(slug).first();if(!a)return apiJson(req,env,{error:'Article not found.'},404);return apiJson(req,env,{article:{...a,publishedAt:a.published_at}});}
  const limit=Math.max(1,Math.min(50,Number(url.searchParams.get('limit')||20)||20));
  const d=await env.DB.prepare(`SELECT slug,title,section,summary,published_at FROM articles WHERE status='published' ORDER BY published_at DESC LIMIT ?`).bind(limit).all();
  const articles=(d.results||[]).map(a=>({slug:a.slug,title:a.title,section:a.section,summary:a.summary,publishedAt:a.published_at}));return apiJson(req,env,{articles});
}
async function submitContent(req, env) {
  if(!env.DB||!env.MEDIA_BUCKET)return apiJson(req,env,{error:'Submission storage is not configured.'},503);
  const rl=await rateLimit(env,req,'submit',5,3600);if(!rl.ok)return apiJson(req,env,{error:rl.reason},429);
  if(!env.TURNSTILE_SECRET)return apiJson(req,env,{error:'Secure submissions are temporarily disabled because anti-spam verification is not configured.'},503);
  let f;try{f=await req.formData()}catch(_){return apiJson(req,env,{error:'Expected multipart form data.'},400)}
  if(String(f.get('website')||'').trim())return apiJson(req,env,{error:'Submission rejected.'},400);
  const valid=await checkTurnstile(env,String(f.get('turnstileToken')||''),clientIp(req));if(!valid)return apiJson(req,env,{error:'Anti-spam verification failed. Please retry.'},400);
  const kind=String(f.get('kind')||'photo');const section=String(f.get('section')||'');const title=String(f.get('title')||'').trim().slice(0,140);const story=String(f.get('story')||'').trim().slice(0,6000);const submitterName=String(f.get('submitterName')||'').trim().slice(0,120);const submitterEmail=String(f.get('submitterEmail')||'').trim().slice(0,254);const consent=String(f.get('consent')||'')==='yes';
  if(!['photo','story'].includes(kind)||!title||!submitterName||!/^\S+@\S+\.\S+$/.test(submitterEmail)||!consent)return apiJson(req,env,{error:'Please complete all required fields and confirm media permission.'},400);
  if(kind==='photo'&&!ALLOWED_SECTIONS.has(section))return apiJson(req,env,{error:'Please choose a section for your photos.'},400);
  if(kind==='story'&&!story)return apiJson(req,env,{error:'Please provide the story text.'},400);
  const files=f.getAll('photos').filter(x=>x instanceof File&&x.size>0);
  if(kind==='photo'&&(!files.length||files.length>MAX_FILES))return apiJson(req,env,{error:'Please upload between 1 and 5 photos.'},400);
  if(kind==='story'&&files.length)return apiJson(req,env,{error:'Story submissions do not accept file uploads on this form.'},400);
  const id=crypto.randomUUID();const now=isoNow();const uploadedKeys=[];
  await env.DB.prepare(`INSERT INTO submissions(id,kind,section,title,story,submitter_name,submitter_email,consent,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id,kind,kind==='photo'?section:null,title,story,submitterName,submitterEmail,1,'pending',now).run();
  try {
    for(const file of files){if(file.size>MAX_FILE_BYTES)throw new Error('Each photo must be 8 MB or smaller.');if(!MIME_EXT[file.type])throw new Error('Only JPEG, PNG and WebP images are accepted.');const bytes=new Uint8Array(await file.arrayBuffer());if(!validateImageBytes(bytes,file.type))throw new Error('An uploaded file does not match its image format.');const mediaId=crypto.randomUUID();const key=`pending/${section}/${id}/${mediaId}.${MIME_EXT[file.type]}`;await env.MEDIA_BUCKET.put(key,bytes,{httpMetadata:{contentType:file.type,cacheControl:'private, no-store'}});uploadedKeys.push(key);await env.DB.prepare(`INSERT INTO media(id,submission_id,section,title,caption,r2_key,content_type,original_name,size_bytes,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(mediaId,id,section,title,story,key,file.type,file.name.slice(0,180),file.size,'pending',now).run();}
  } catch(e) {for(const key of uploadedKeys){try{await env.MEDIA_BUCKET.delete(key)}catch(_){}}await env.DB.prepare('DELETE FROM media WHERE submission_id=?').bind(id).run();await env.DB.prepare('DELETE FROM submissions WHERE id=?').bind(id).run();return apiJson(req,env,{error:e.message||'Photo upload failed.'},400)}
  return apiJson(req,env,{ok:true,status:'pending',message:'Your content has been received and is pending review.'},202);
}
async function trimApproved(env, section) {
  const old=(await env.DB.prepare(`SELECT id,r2_key FROM media WHERE status='approved' AND section=? ORDER BY COALESCE(approved_at,created_at) DESC LIMIT -1 OFFSET 10`).bind(section).all()).results||[];
  for(const row of old){await env.MEDIA_BUCKET.delete(row.r2_key);await env.DB.prepare('DELETE FROM media WHERE id=?').bind(row.id).run();}
}
async function loginAdmin(req, env) {
  if(!env.DB||!env.ADMIN_PASSWORD||!env.ADMIN_SESSION_SECRET||!env.RATE_LIMIT_SALT)return apiJson(req,env,{error:'Admin service is not configured.'},503);
  const rl=await rateLimit(env,req,'admin-login',8,900);if(!rl.ok)return apiJson(req,env,{error:rl.reason},429);
  let d;try{d=await req.json()}catch(_){return apiJson(req,env,{error:'Expected JSON.'},400)}
  if(!d||typeof d!=='object'||Array.isArray(d))return apiJson(req,env,{error:'Expected a JSON object.'},400);
  if(!secureEqual(d.password,env.ADMIN_PASSWORD))return apiJson(req,env,{error:'Invalid password.'},401);
  const token=randomToken(),hash=await sha256(env.ADMIN_SESSION_SECRET+'|'+token),expires=new Date(Date.now()+SESSION_SECONDS*1000).toISOString();
  await env.DB.prepare('INSERT INTO admin_sessions(token_hash,created_at,expires_at) VALUES(?,?,?)').bind(hash,isoNow(),expires).run();
  return apiJson(req,env,{token,expiresAt:expires});
}
async function listSubmissions(req, env) {
  const session=await requireAdmin(req,env);if(!session)return apiJson(req,env,{error:'Admin session expired or missing.'},401);
  const rows=(await env.DB.prepare(`SELECT * FROM submissions WHERE status='pending' ORDER BY created_at ASC LIMIT 100`).all()).results||[];
  const submissions=[];for(const s of rows){const media=(await env.DB.prepare(`SELECT id,title,caption,content_type,created_at FROM media WHERE submission_id=? AND status='pending' ORDER BY created_at ASC`).bind(s.id).all()).results||[];submissions.push({id:s.id,kind:s.kind,section:s.section,title:s.title,story:s.story,submitterName:s.submitter_name,submitterEmail:s.submitter_email,createdAt:s.created_at,media:media.map(m=>({...m}))});}
  return apiJson(req,env,{submissions});
}
async function serveAdminMedia(req, env, id) {
  const session=await requireAdmin(req,env);if(!session)return respond(req,env,'Admin session expired or missing.',401,{'Content-Type':'text/plain; charset=utf-8'});if(!env.MEDIA_BUCKET)return respond(req,env,'Media storage is not configured.',503,{'Content-Type':'text/plain; charset=utf-8'});
  const row=await env.DB.prepare(`SELECT r2_key,content_type FROM media WHERE id=? AND status='pending'`).bind(id).first();if(!row)return respond(req,env,'Not found',404,{'Content-Type':'text/plain; charset=utf-8'});
  const object=await env.MEDIA_BUCKET.get(row.r2_key);if(!object)return respond(req,env,'Not found',404,{'Content-Type':'text/plain; charset=utf-8'});return respond(req,env,object.body,200,{'Content-Type':row.content_type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'});
}
async function reviewSubmission(req, env, id, action) {
  const session=await requireAdmin(req,env);if(!session)return apiJson(req,env,{error:'Admin session expired or missing.'},401);
  const sub=await env.DB.prepare('SELECT * FROM submissions WHERE id=? AND status=\'pending\'').bind(id).first();if(!sub)return apiJson(req,env,{error:'Pending submission not found.'},404);
  const now=isoNow();
  if(action==='reject'){
    const rows=(await env.DB.prepare('SELECT id,r2_key FROM media WHERE submission_id=?').bind(id).all()).results||[];for(const m of rows)await env.MEDIA_BUCKET.delete(m.r2_key);await env.DB.prepare('DELETE FROM media WHERE submission_id=?').bind(id).run();await env.DB.prepare('UPDATE submissions SET status=\'rejected\',reviewed_at=? WHERE id=?').bind(now,id).run();return apiJson(req,env,{ok:true,status:'rejected'});
  }
  await env.DB.prepare('UPDATE submissions SET status=\'approved\',reviewed_at=? WHERE id=?').bind(now,id).run();
  if(sub.kind==='photo'){
    await env.DB.prepare(`UPDATE media SET status='approved',approved_at=? WHERE submission_id=?`).bind(now,id).run();
    // Publishable keys move out of the pending prefix; only DB-approved rows are served by /api/media.
    const rows=(await env.DB.prepare(`SELECT id,r2_key,section FROM media WHERE submission_id=? AND status='approved'`).bind(id).all()).results||[];
    for(const m of rows){const obj=await env.MEDIA_BUCKET.get(m.r2_key);if(!obj)continue;const newKey=`approved/${m.section}/${m.id}/${m.r2_key.split('/').pop()}`;await env.MEDIA_BUCKET.put(newKey,obj.body,{httpMetadata:obj.httpMetadata});await env.MEDIA_BUCKET.delete(m.r2_key);await env.DB.prepare('UPDATE media SET r2_key=? WHERE id=?').bind(newKey,m.id).run();}
    await trimApproved(env,sub.section);
  } else {
    const base=slugify(sub.title);let slug=base,idx=2;while(await env.DB.prepare('SELECT slug FROM articles WHERE slug=?').bind(slug).first())slug=base+'-'+idx++;
    await env.DB.prepare(`INSERT INTO articles(id,slug,title,section,summary,body,status,published_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),slug,sub.title,'Community',sub.story.slice(0,300),sub.story,'published',now,now).run();
  }
  return apiJson(req,env,{ok:true,status:'approved'});
}
async function publishArticle(req, env) {
  const session=await requireAdmin(req,env);if(!session)return apiJson(req,env,{error:'Admin session expired or missing.'},401);
  let d;try{d=await req.json()}catch(_){return apiJson(req,env,{error:'Expected JSON.'},400)}
  if(!d||typeof d!=='object'||Array.isArray(d))return apiJson(req,env,{error:'Expected a JSON object.'},400);
  const title=String(d.title||'').trim().slice(0,140),body=String(d.body||'').trim().slice(0,20000),summary=String(d.summary||'').trim().slice(0,500),section=String(d.section||'News').slice(0,40);
  if(!title||!body)return apiJson(req,env,{error:'Title and full story body are required.'},400);
  const base=slugify(d.slug||title);let slug=base,idx=2;while(await env.DB.prepare('SELECT slug FROM articles WHERE slug=?').bind(slug).first())slug=base+'-'+idx++;
  const now=isoNow();await env.DB.prepare(`INSERT INTO articles(id,slug,title,section,summary,body,status,published_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),slug,title,section,summary,body,'published',now,now).run();return apiJson(req,env,{ok:true,slug,url:(env.SITE_URL||'https://boulderscouts.com')+'/article.html?slug='+encodeURIComponent(slug)},201);
}
async function rssNews(req, env) {
  const rows=(await env.DB.prepare(`SELECT slug,title,section,summary,published_at FROM articles WHERE status='published' ORDER BY published_at DESC LIMIT 50`).all()).results||[];
  const items=rows.map(a=>`<item><title>${escXml(a.title)}</title><link>${escXml((env.SITE_URL||'https://boulderscouts.com')+'/article.html?slug='+encodeURIComponent(a.slug))}</link><guid isPermaLink="true">${escXml((env.SITE_URL||'https://boulderscouts.com')+'/article.html?slug='+encodeURIComponent(a.slug))}</guid><pubDate>${new Date(a.published_at).toUTCString()}</pubDate><category>${escXml(a.section||'News')}</category><description>${escXml(a.summary||'')}</description></item>`).join('');
  return xml(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Boulder Scout Group News</title><link>${escXml(env.SITE_URL||'https://boulderscouts.com')}</link><description>Published news from Boulder Scout Group.</description><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`);
}
async function rssPhotos(req, env, section) {
  if(section!=='all'&&!ALLOWED_SECTIONS.has(section))return xml('<?xml version="1.0"?><rss version="2.0"><channel><title>Boulder Scout Group photos</title></channel></rss>',400);
  const rows=section==='all'?(await env.DB.prepare(`SELECT id,section,title,caption,created_at,content_type,size_bytes FROM media WHERE status='approved' ORDER BY COALESCE(approved_at,created_at) DESC LIMIT 40`).all()).results||[]:(await env.DB.prepare(`SELECT id,section,title,caption,created_at,content_type,size_bytes FROM media WHERE status='approved' AND section=? ORDER BY COALESCE(approved_at,created_at) DESC LIMIT 10`).bind(section).all()).results||[];
  const base=apiBase(env),site=env.SITE_URL||'https://boulderscouts.com';const items=rows.map(p=>{const media=base+'/api/media/'+encodeURIComponent(p.id);return `<item><title>${escXml(p.title||p.caption||'Boulder Scout Group photo')}</title><link>${escXml(site+'/'+p.section+'.html')}</link><guid isPermaLink="false">${escXml('photo:'+p.id)}</guid><pubDate>${new Date(p.created_at).toUTCString()}</pubDate><category>${escXml(p.section)}</category><description>${escXml(p.caption||'Approved Scout Group photo')}</description><enclosure url="${escXml(media)}" type="${escXml(p.content_type||'application/octet-stream')}" length="${Math.max(0,Number(p.size_bytes)||0)}"/></item>`}).join('');
  return xml(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Boulder Scout Group ${escXml(section)} photos</title><link>${escXml(site)}</link><description>Approved photos only.</description><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}</channel></rss>`);
}
async function health(req, env) { return apiJson(req,env,{ok:!!(env.DB&&env.MEDIA_BUCKET),bindings:{DB:!!env.DB,MEDIA_BUCKET:!!env.MEDIA_BUCKET},configured:{SITE_URL:!!env.SITE_URL,API_PUBLIC_URL:!!env.API_PUBLIC_URL,ADMIN_PASSWORD:!!env.ADMIN_PASSWORD,ADMIN_SESSION_SECRET:!!env.ADMIN_SESSION_SECRET,RATE_LIMIT_SALT:!!env.RATE_LIMIT_SALT,TURNSTILE_SECRET:!!env.TURNSTILE_SECRET},timeZone:'Australia/Perth'},(env.DB&&env.MEDIA_BUCKET)?200:503); }

const PUBLIC_CALENDAR_IDS = Object.freeze({
  whole:'147c938779b4fe249b19a47abc53e2f2070b7f536f50bfdc0fbabda1276a2246@group.calendar.google.com',
  joeys:'6c5ec6e03d3c8f4d56be43a2980ae482627b20192f7fb3a0d98670c32d1ef214@group.calendar.google.com',
  cubs:'0cee13b6cf55915f7e1ce6adcf7f610ce4d1aab4f8de645dff509031ee000300@group.calendar.google.com',
  scouts:'2d01af5880a708dc71f84202fdf26ba4beaa54733973d15a529105a3c2edc2bc@group.calendar.google.com',
  venturers:'22b8edad6e49ee7b5a0c16cf6e99f95bec387d8ae31939e5040d862a884f0b5e@group.calendar.google.com'
});
async function publicCalendarFeeds(req, env, url) {
  const names=[...new Set((url.searchParams.get('calendars')||'whole,joeys,cubs,scouts,venturers').split(',').map(x=>x.trim()).filter(Boolean))];
  if(!names.length||names.some(x=>!Object.hasOwn(PUBLIC_CALENDAR_IDS,x)))return apiJson(req,env,{error:'Choose one or more known Boulder Scout Group calendars.'},400);
  const loaded=await Promise.all(names.map(async name=>{
    const id=PUBLIC_CALENDAR_IDS[name];
    const feedUrl='https://calendar.google.com/calendar/ical/'+encodeURIComponent(id)+'/public/basic.ics';
    try {
      const response=await fetch(feedUrl,{headers:{Accept:'text/calendar'},cf:{cacheTtl:300,cacheEverything:true}});
      const body=await response.text();
      if(!response.ok||!body.includes('BEGIN:VCALENDAR'))return {name,error:'This calendar is not publicly readable yet. Enable public visibility in Google Calendar settings.'};
      return {name,body};
    } catch (_) { return {name,error:'The Google Calendar feed could not be reached.'}; }
  }));
  const calendars={},errors=[];
  for(const item of loaded){if(item.body)calendars[item.name]=item.body;else errors.push({calendar:item.name,message:item.error});}
  if(!Object.keys(calendars).length)return apiJson(req,env,{error:'No public calendars could be read. The owner must enable public visibility for the group calendars.',calendars,errors},503,{'Cache-Control':'no-store'});
  return apiJson(req,env,{calendars,errors,timeZone:'Australia/Perth',updatedAt:isoNow()},200,{'Cache-Control':'public, max-age=300'});
}
async function handle(req, env) {
  const url=new URL(req.url);const path=url.pathname.replace(/\/+$/,'')||'/';
  if(req.method==='OPTIONS')return respond(req,env,null,204,{'Access-Control-Allow-Headers':'Content-Type, Authorization, Accept'});
  if(!path.startsWith('/api/'))return respond(req,env,'Not found',404,{'Content-Type':'text/plain; charset=utf-8'});
  if(req.method==='GET'&&path==='/api/health')return health(req,env);
  if(req.method==='GET'&&path==='/api/calendar')return publicCalendarFeeds(req,env,url);
  if(req.method==='GET'&&path==='/api/photos')return publicPhotos(req,env,url);
  if(req.method==='GET'&&path==='/api/news')return getNews(req,env,url);
  const publicMedia=path.match(/^\/api\/media\/([0-9a-f-]{36})$/i);if(req.method==='GET'&&publicMedia)return servePublicMedia(req,env,publicMedia[1]);
  if(req.method==='GET'&&path==='/api/feed/news.xml')return rssNews(req,env);
  const feedMatch=path.match(/^\/api\/feed\/photos\/(joeys|cubs|scouts|venturers|all)\.xml$/);if(req.method==='GET'&&feedMatch)return rssPhotos(req,env,feedMatch[1]);
  if(req.method==='POST'&&path==='/api/submissions')return submitContent(req,env);
  if(req.method==='POST'&&path==='/api/admin/login')return loginAdmin(req,env);
  if(req.method==='GET'&&path==='/api/admin/submissions')return listSubmissions(req,env);
  const review=path.match(/^\/api\/admin\/submissions\/([0-9a-f-]{36})\/(approve|reject)$/);if(req.method==='POST'&&review)return reviewSubmission(req,env,review[1],review[2]);
  const preview=path.match(/^\/api\/admin\/media\/([0-9a-f-]{36})$/);if(req.method==='GET'&&preview)return serveAdminMedia(req,env,preview[1]);
  if(req.method==='POST'&&path==='/api/admin/articles')return publishArticle(req,env);
  return respond(req,env,'Not found',404,{'Content-Type':'text/plain; charset=utf-8'});
}
export default {
  async fetch(req, env) {
    const origin=req.headers.get('Origin')||''; if(origin&&!originAllowed(origin,env))return new Response('Origin not allowed',{status:403,headers:{'Vary':'Origin'}});
    try{return await handle(req,env)}catch(e){console.error('Boulder Scouts API error',e);return json({error:'Internal server error. Check Worker logs for details.'},500,corsHeaders(req,env))}
  },
  async scheduled(controller, env, ctx) {
    // Safety net only: enforce the ten newest approved photos per section, never a month-end purge.
    if(!env.DB||!env.MEDIA_BUCKET)return;
    ctx.waitUntil((async()=>{for(const section of ALLOWED_SECTIONS){const rows=(await env.DB.prepare(`SELECT id,r2_key FROM media WHERE status='approved' AND section=? ORDER BY COALESCE(approved_at,created_at) DESC LIMIT -1 OFFSET 10`).bind(section).all()).results||[];for(const m of rows){await env.MEDIA_BUCKET.delete(m.r2_key);await env.DB.prepare('DELETE FROM media WHERE id=?').bind(m.id).run();}}await env.DB.prepare(`DELETE FROM rate_limits WHERE created_at < ?`).bind(new Date(Date.now()-86400000).toISOString()).run();await env.DB.prepare(`DELETE FROM admin_sessions WHERE expires_at < ?`).bind(isoNow()).run();})());
  }
};
