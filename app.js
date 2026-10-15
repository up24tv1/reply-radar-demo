const KEY='replyRadar.v1';
const RULES=[
 {cat:'Booking',words:['book','reserve','reservation','private room','table','event','party','réserv','appointment','rendez']},
 {cat:'Refund / billing',words:['refund','charged','charge','money back','overcharg','cancel','rembours','invoice','payment']},
 {cat:'Order / delivery',words:['order','shipped','delivery','tracking','arrived','commande','livraison','package']},
 {cat:'Account access',words:['locked','login','password','banned','account','compte','blocked','bloqué']},
 {cat:'Complaint',words:['rude','terrible','worst','disappointed','ignored','no response','no reply','on read','still waiting','pas de réponse']}];
const URGENT=['still','again','days','week','urgent','asap','no response','no reply','ignored','on read','never','lawyer','chargeback','toujours','scam'];
const FR=[' je ',' le ',' la ',' pas ',' mon ',' une ',' est ','bonjour','merci'];
function triage(t){const s=' '+t.toLowerCase()+' ';
 let best={cat:'General question',n:0};RULES.forEach(r=>{const n=r.words.filter(w=>s.includes(w)).length;if(n>best.n)best={cat:r.cat,n}});
 const u=URGENT.filter(w=>s.includes(w)).length+(s.match(/!/g)||[]).length*.5;
 const pr=u>=2?'high':u>=1?'med':'low';const lang=FR.filter(w=>s.includes(w)).length>=2?'fr':'en';return{cat:best.cat,pr,lang}}
const TPL={en:{Booking:"Hi {n}, thanks for your booking request — we've received it. A team member will confirm availability and details within {t}. If it's time-sensitive, reply with your preferred date, time and party size.",
'Refund / billing':"Hi {n}, sorry about the billing issue. We've logged it and a team member will review your charge and reply within {t}. Please reply with your order number or the date of the charge.",
'Order / delivery':"Hi {n}, sorry for the wait on your order. We're checking its status now and will update you within {t}. Your order number will help us find it faster.",
'Account access':"Hi {n}, sorry you can't get into your account. We've escalated this and will get back to you within {t}.",
Complaint:"Hi {n}, we're sorry — you should have heard from us sooner. Your message is now with a team member, who will reply personally within {t}.",
'General question':"Hi {n}, thanks for reaching out! We've got your message and will reply within {t}."},
fr:{Booking:"Bonjour {n}, merci pour votre demande de réservation. Nous confirmons la disponibilité sous {t}.",
'Refund / billing':"Bonjour {n}, désolés pour ce problème de facturation. Nous l'examinons et revenons vers vous sous {t}.",
'Order / delivery':"Bonjour {n}, désolés pour l'attente. Nous vérifions votre commande et vous répondons sous {t}.",
'Account access':"Bonjour {n}, nous avons transmis votre problème d'accès et revenons vers vous sous {t}.",
Complaint:"Bonjour {n}, toutes nos excuses pour ce délai. Un membre de l'équipe vous répond personnellement sous {t}.",
'General question':"Bonjour {n}, merci pour votre message ! Nous vous répondons sous {t}."}};
const load=()=>JSON.parse(localStorage.getItem(KEY)||'[]'),save=a=>localStorage.setItem(KEY,JSON.stringify(a));
function fmtT(m){return m>=60?Math.round(m/60)+(m>=120?' hours':' hour'):m+' minutes'}
function add(name,channel,msg,sla,ageMin=0){const t=triage(msg);const a=load();
 const tgt=t.pr==='high'?Math.min(sla,30):sla;
 a.push({id:Date.now()+Math.random(),name:name||'there',channel,msg,...t,sla:tgt,created:Date.now()-ageMin*60000,done:null,
  draft:TPL[t.lang][t.cat].replace('{n}',name||'there').replace('{t}',fmtT(tgt))});save(a);render()}
function esc(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function render(){const a=load(),now=Date.now(),f=document.getElementById('filter').value;
 const left=x=>x.sla*60000-(now-x.created);
 let v=a.slice();if(f==='late')v=v.filter(x=>!x.done&&left(x)<0);
 const w={high:0,med:1,low:2};v.sort((x,y)=>(!!x.done-!!y.done)||w[x.pr]-w[y.pr]||left(x)-left(y));
 document.getElementById('sOpen').textContent=a.filter(x=>!x.done).length;
 document.getElementById('sLate').textContent=a.filter(x=>!x.done&&left(x)<0).length;
 document.getElementById('sHigh').textContent=a.filter(x=>!x.done&&x.pr==='high').length;
 document.getElementById('sDone').textContent=a.filter(x=>x.done).length;
 document.getElementById('list').innerHTML=v.length?v.map(x=>{const l=left(x),late=!x.done&&l<0,m=Math.abs(Math.round(l/60000));
 return `<div class="item ${late?'late':''} ${x.done?'done':''}"><span class="timer">${x.done?'✅ answered':late?'⚠️ '+m+' min overdue':'⏱ '+m+' min left'}</span>
 <b>${esc(x.name)}</b> <span class="tag">${esc(x.channel)}</span><span class="tag">${x.cat}</span><span class="tag ${x.pr}">${x.pr}</span><span class="tag">${x.lang.toUpperCase()}</span>
 <p style="margin:6px 0">${esc(x.msg)}</p><div class="draft">${esc(x.draft)}</div>
 ${x.done?'':`<button class="ghost" onclick="copyD(${x.id})">Copy reply</button> <button class="ok" onclick="mark(${x.id})">Mark answered</button>`}</div>`}).join(''):'<p style="color:#9aa6bf">No messages yet — add one or load samples.</p>'}
function copyD(id){const x=load().find(x=>x.id===id);navigator.clipboard&&navigator.clipboard.writeText(x.draft)}
function mark(id){const a=load();a.find(x=>x.id===id).done=Date.now();save(a);render()}
document.getElementById('add').onclick=()=>{const m=document.getElementById('msg').value.trim();if(!m)return;
 add(document.getElementById('name').value.trim(),document.getElementById('channel').value,m,+document.getElementById('sla').value||60);document.getElementById('msg').value=''};
document.getElementById('sample').onclick=()=>{ // illustrative samples written for this demo
 add('Alex','Web form','Hi, I tried to book a private room for 12 people on Saturday and had no response. Emailed again, still no reply?',60,75);
 add('Jordan','Email','I was charged twice for my order last week, please refund the duplicate charge.',120,30);
 add('Camille','DM',"Bonjour, j'ai passé une commande il y a deux semaines et je n'ai toujours pas de réponse du service client.",60,10);
 add('Priya','Email','Do you have vegetarian options on the lunch menu?',240,5)};
document.getElementById('clear').onclick=()=>{if(confirm('Clear all messages?')){save([]);render()}};
document.getElementById('filter').onchange=render;
render();setInterval(render,30000);
if(typeof module!=='undefined')module.exports={triage};
