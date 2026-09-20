function formatPhone509(value){
  let n = String(value || "").replace(/\D/g,"");
  if(n.startsWith("509")) n=n.slice(3);
  if(n.length===8) return "+509 "+n.slice(0,4)+"-"+n.slice(4);
  return value;
}
const K="SISI_DB",CK="SISI_CODE_V2";let db=JSON.parse(localStorage.getItem(K)||'{"clients":[],"payments":[],"fees":[]}');if(!db.fees)db.fees=[];if(!db.funds)db.funds=[];if(!db.archives)db.archives=[];if(!db.audit)db.audit=[];if(!db.period)db.period={name:"Sòl 2026",start:"2026-09-15",end:"2026-11-03",daily:100};if(!localStorage.getItem(CK)||localStorage.getItem(CK)==="2026")localStorage.setItem(CK,"sisi2026");const $=x=>document.getElementById(x),fmt=n=>Number(n||0).toLocaleString("fr-FR")+" Gdes";let sessionOpen=false;
function enterApp(){sessionOpen=true;$("welcome").classList.add("hide");logAction("Koneksyon","Sesyon responsab ouvè")}
function requestLogin(){auth(()=>enterApp())}
function lockApp(){sessionOpen=false;$("welcome").classList.remove("hide");page("dash")}
function page(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");$("title").textContent=id==="dash"?"Dashboard":id==="clients"?"Kliyan":id==="calendar"?"Kalandriye Peman":id==="late"?"Kontwòl Reta":id==="payments"?"Peman":id==="funds"?"Remèt Fon":id==="fees"?"Frè & Amand":id==="daily"?"Rapò Jounalye":id==="reports"?"Rapò Jeneral":id==="periods"?"Peryòd & Achiv":id==="audit"?"Jounal Aktivite":"Sovgad"}function save(){localStorage.setItem(K,JSON.stringify(db));render()}function next(a,k,p){let m=a.reduce((n,x)=>Math.max(n,parseInt((x[k]||"").replace(/\D/g,""))||0),0);return p+String(m+1).padStart(4,"0")}let authCallback=null;
function auth(action){
 authCallback=action||null;
 $("authInput").value="";$("authError").textContent="";
 $("authModal").classList.add("show");
 setTimeout(()=>$("authInput").focus(),50);
}
function submitAuth(){
 let x=$("authInput").value.trim().toLowerCase();
 let ok=x===String(localStorage.getItem(CK)||"sisi2026").trim().toLowerCase();
 if(!ok){$("authError").textContent="Kòd la pa kòrèk."; $("authInput").value=""; $("authInput").focus(); return}
 $("authModal").classList.remove("show");
 let cb=authCallback;authCallback=null;if(cb)cb();
}
function cancelAuth(){$("authModal").classList.remove("show");authCallback=null}
function logAction(action,detail){
 if(!db.audit)db.audit=[];
 db.audit.push({ts:new Date().toISOString(),action,detail:detail||""});
 if(db.audit.length>1000)db.audit=db.audit.slice(-1000);
 localStorage.setItem(K,JSON.stringify(db));
}
function renderAudit(){
 if(!$("auditRows"))return;
 $("auditRows").innerHTML=(db.audit||[]).slice().reverse().map(x=>{
   let d=new Date(x.ts);return `<tr><td>${d.toLocaleString("fr-FR")}</td><td><b>${x.action}</b></td><td>${x.detail||"—"}</td></tr>`
 }).join("")||'<tr><td colspan="3">Pa gen aktivite anrejistre.</td></tr>'
}
function periodDateStrings(){
 let out=[],d=new Date(db.period.start+"T00:00:00"),end=new Date(db.period.end+"T00:00:00");
 while(d<=end){out.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}
 return out
}
function paymentCoverage(no){
 let used=[];
 db.payments.filter(p=>p.no===no).forEach(p=>{
   if(Array.isArray(p.coveredDates))used.push(...p.coveredDates);
   else {
     let all=periodDateStrings();
     for(let i=0;i<Number(p.days||0);i++){let free=all.find(x=>!used.includes(x));if(free)used.push(free)}
   }
 });
 return used
}
function allocatePaymentDates(no,days){
 let used=paymentCoverage(no),all=periodDateStrings(),free=all.filter(x=>!used.includes(x));
 return free.slice(0,days)
}
function daysBetween(a,b){
 let x=new Date(a+"T00:00:00"),y=new Date(b+"T00:00:00");
 return Math.max(0,Math.round((y-x)/86400000))
}
function addClient(){let no=next(db.clients,"no","S-"),nom=prompt("Nom:");if(!nom)return;let prenom=prompt("Prénom:")||"",nif=prompt("NIF/CIN:")||"",adr=prompt("Adresse:")||"",tel=formatPhone509(prompt("Tel:")||""),hands=Number(prompt("Nbre(s) de main(s):","1"))||1;db.clients.push({no,nom,prenom,nif,adr,tel,hands});logAction("Ajoute kliyan",no+" - "+nom+" "+prenom);save()}function editClient(i){auth(()=>{let c=db.clients[i];c.nom=prompt("Nom:",c.nom)||c.nom;c.prenom=prompt("Prénom:",c.prenom)||c.prenom;c.nif=prompt("NIF/CIN:",c.nif)??c.nif;c.adr=prompt("Adresse:",c.adr)??c.adr;c.tel=prompt("Tel:",c.tel)??c.tel;c.hands=Number(prompt("Nbre(s) de main(s):",c.hands))||c.hands;save()})}function del(t,i){auth(()=>{if(confirm("Responsab: ou konfime efase sa a?")){db[t].splice(i,1);save()}})}function addPay(){
 if(!db.clients.length)return alert("Ajoute kliyan anvan.");
 let list=db.clients.map(c=>c.no+" - "+c.nom+" "+c.prenom).join("\n"),id=prompt("Antre No kliyan an:\n"+list);
 let c=db.clients.find(c=>c.no===id);if(!c)return alert("Kliyan pa jwenn.");
 let days=Number(prompt("Kantite jou peye:","1"));if(!Number.isInteger(days)||days<1)return alert("Kantite jou a pa valab.");
 let available=periodDateStrings().length-paymentCoverage(id).length;
 if(days>available)return alert("Kantite jou sa depase kantite jou ki rete nan peryòd la.");
 let payDate=new Date().toISOString().slice(0,10);
 let coveredDates=allocatePaymentDates(id,days);
 let lateDetails=coveredDates.map(d=>({dueDate:d,paidDate:payDate,lateDays:daysBetween(d,payDate)}));
 let lateCount=lateDetails.filter(x=>x.lateDays>0).length;
 let receipt=next(db.payments,"receipt","RS-");
 db.payments.push({receipt,date:payDate,no:id,days,total:days*Number(db.period.daily||100),coveredDates,lateDetails});
 logAction("Ajoute peman",`${receipt} • ${c.nom} ${c.prenom} • ${days} jou${lateCount?` • ${lateCount} dat peye an reta`:""}`);
 save()
}
function addFund(){
 if(!db.clients.length)return alert("Ajoute kliyan anvan.");
 let list=db.clients.map(c=>c.no+" - "+c.nom+" "+c.prenom).join("\n");
 let id=prompt("Antre No kliyan an:\n"+list);
 let c=db.clients.find(c=>c.no===id); if(!c)return alert("Kliyan pa jwenn.");
 let type=prompt("Kalite Remèt Fon:\n1 = Nòmal (fen sòl la)\n2 = Davans","1");
 if(type!=="1"&&type!=="2")return;
 const finishFund=()=>{
 let amount=Number(prompt("Montan pou remèt kliyan an (Gdes):","0"));
 if(!amount||amount<0)return alert("Montan an pa valab.");
 let reason=type==="2"?(prompt("Motif / rezon pou remèt fon davans:")||"Pa presize"):"Fen sòl la";
 let bon=next(db.funds,"bon","RF-");
 db.funds.push({bon,date:new Date().toISOString().slice(0,10),no:id,type:type==="2"?"Davans":"Nòmal",hands:c.hands,amount,reason,status:type==="2"?"Fon deja remèt – Kontinye peye":"Fon remèt"});
 logAction("Remèt fon",`${bon} • ${c.nom} ${c.prenom} • ${type==="2"?"Davans":"Nòmal"} • ${fmt(amount)}`);save();};
 if(type==="2"){auth(finishFund);return} finishFund();
}
function editFund(i){auth(()=>{
 let f=db.funds[i];
 let a=Number(prompt("Montan:",f.amount)); if(a>0)f.amount=a;
 f.reason=prompt("Motif:",f.reason)??f.reason; save();
})}
function delFund(i){auth(()=>{
 if(confirm("Responsab: ou konfime efase Remèt Fon sa a?")){db.funds.splice(i,1);save()}
})}

function addFee(){if(!db.clients.length)return alert("Ajoute kliyan anvan.");let list=db.clients.map(c=>c.no+" - "+c.nom+" "+c.prenom).join("\\n"),id=prompt("Antre No kliyan an:\\n"+list);if(!db.clients.find(c=>c.no===id))return alert("Kliyan pa jwenn.");let type=prompt("Chwazi kalite a:\\n1 = Ranplasman kanè (300 Gdes)\\n2 = Frè sou chak men (100 Gdes)\\n3 = Ekriti san otorizasyon (1000 Gdes)\\n4 = Peman apre 5è (100 Gdes)","1");let map={"1":["Ranplasman kanè",300],"2":["Frè sou chak men",100],"3":["Ekriti san otorizasyon",1000],"4":["Peman apre 5è",100]};if(!map[type])return;let amount=map[type][1];if(type==="2"){let c=db.clients.find(c=>c.no===id);amount=100*c.hands}db.fees.push({date:new Date().toISOString().slice(0,10),no:id,type:map[type][0],amount});save()}
function delFee(i){auth(()=>{if(confirm("Responsab: ou konfime efase frè/amand sa a?")){db.fees.splice(i,1);save()}})}
function render(){let name=id=>{let c=db.clients.find(x=>x.no===id);return c?c.nom+" "+c.prenom:id};$("cr").innerHTML=db.clients.map((c,i)=>`<tr><td>${c.no}</td><td>${c.nom}</td><td>${c.prenom}</td><td>${c.nif}</td><td>${c.adr}</td><td>${c.tel}</td><td>${c.hands}</td><td><button class="secure" onclick="showProfile(${i})">👁 Fich</button><button class="secure" onclick="editClient(${i})">🔒 Modifye</button><button class="secure danger" onclick="del('clients',${i})">🔒 Efase</button></td></tr>`).join("");$("pr").innerHTML=db.payments.map((p,i)=>`<tr><td>${p.receipt}</td><td>${p.date}</td><td>${name(p.no)}</td><td>${p.days}</td><td>${fmt(p.total)}</td><td><button class="secure danger" onclick="del('payments',${i})">🔒 Efase</button></td></tr>`).join("");$("dc").textContent=db.clients.length;$("dh").textContent=db.clients.reduce((s,c)=>s+c.hands,0);$("dm").textContent=fmt(db.payments.reduce((s,p)=>s+p.total,0));$("dr").textContent=db.payments.length;let feeTotal=db.fees.reduce((s,f)=>s+f.amount,0);if($("fr"))$("fr").innerHTML=db.fees.map((f,i)=>`<tr><td>${f.date}</td><td>${name(f.no)}</td><td>${f.type}</td><td>${fmt(f.amount)}</td><td><button class="secure danger" onclick="delFee(${i})">🔒 Efase</button></td></tr>`).join("")||'<tr><td colspan="5">Pa gen frè/amand.</td></tr>';if($("fundRows"))$("fundRows").innerHTML=db.funds.map((f,i)=>`<tr><td>${f.bon}</td><td>${f.date}</td><td>${name(f.no)}</td><td>${f.type}</td><td>${f.hands}</td><td>${fmt(f.amount)}</td><td>${f.reason}</td><td><b>${f.status}</b></td><td><button class="secure" onclick="editFund(${i})">🔒 Modifye</button><button class="secure danger" onclick="delFund(${i})">🔒 Efase</button></td></tr>`).join("")||'<tr><td colspan="9">Pa gen fon remèt.</td></tr>';let fundsTotal=db.funds.reduce((s,f)=>s+f.amount,0);renderLate();renderCalendar();renderPeriods();renderAudit();
if($("dashPeriod"))$("dashPeriod").textContent=`${fmt(db.period.daily)} pa jou • Peryòd: ${db.period.start} rive ${db.period.end}`;
if($("report"))$("report").innerHTML=`<div class="panel"><h3>Rezime Sik la</h3><p><b>Kliyan:</b> ${db.clients.length} &nbsp; • &nbsp; <b>Men:</b> ${db.clients.reduce((s,c)=>s+c.hands,0)} &nbsp; • &nbsp; <b>Jou peye:</b> ${db.payments.reduce((s,p)=>s+p.days,0)}</p><p><b>Kotizasyon:</b> ${fmt(db.payments.reduce((s,p)=>s+p.total,0))} &nbsp; • &nbsp; <b>Frè/Amand:</b> ${fmt(feeTotal)} &nbsp; • &nbsp; <b>Total anrejistre:</b> ${fmt(db.payments.reduce((s,p)=>s+p.total,0)+feeTotal)}</p><p><b>Total Fon Remèt:</b> ${fmt(fundsTotal)}</p><p><b>Peryòd:</b> ${db.period.start} — ${db.period.end}</p></div>`}

function pStart(){return new Date(db.period.start+"T00:00:00")}function pEnd(){return new Date(db.period.end+"T00:00:00")}
function cycleDates(){let a=[],d=new Date(pStart()),END=pEnd();while(d<=END){a.push(new Date(d));d.setDate(d.getDate()+1)}return a}
function iso(d){return d.toISOString().slice(0,10)}
function expectedDays(){
 let now=new Date();now.setHours(0,0,0,0);
 let START=pStart(),END=pEnd();if(now<START)return 0;
 let stop=now>END?END:now;
 return Math.floor((stop-START)/86400000)+1
}
function clientPaidDays(no){return paymentCoverage(no).length}
function lateInfo(c){
 let today=new Date().toISOString().slice(0,10),dates=periodDateStrings(),covered=paymentCoverage(c.no);
 let due=dates.filter(d=>d<=today),lateDates=due.filter(d=>!covered.includes(d));
 let futurePaid=covered.filter(d=>d>today);
 let paid=covered.length,late=lateDates.length,ahead=futurePaid.length;
 let status=ahead>0&&late===0?`Davans ${ahead} jou`:late===0?"Ajou":late===1?"Anreta 1 jou":late===2?"Anreta 2 jou":late===3?"Anreta 3 jou":"Anreta 4+ jou";
 return {exp:due.length,paid,late,ahead,status,lateDates}
}
function renderLate(){
 if(!$("lateRows"))return;
 $("lateRows").innerHTML=db.clients.map((c,i)=>{let x=lateInfo(c);let cls=x.ahead>0?"ahead":x.late>=3?"critical":x.late?"warning":"ok";return `<tr><td>${c.no}</td><td>${c.nom} ${c.prenom}</td><td>${c.hands}</td><td>${x.paid}</td><td>${x.exp}</td><td>${x.late}</td><td><span class="chip ${cls}">${x.status}</span></td><td><button class="secure" onclick="showProfile(${i})">👁 Fich</button></td></tr>`}).join("")||'<tr><td colspan="8">Pa gen kliyan.</td></tr>'
}
function renderCalendar(){
 if(!$("calClient"))return;
 let old=$("calClient").value;
 $("calClient").innerHTML='<option value="">Chwazi kliyan...</option>'+db.clients.map(c=>`<option value="${c.no}">${c.no} - ${c.nom} ${c.prenom}</option>`).join("");
 if(old&&db.clients.some(c=>c.no===old))$("calClient").value=old;
 let no=$("calClient").value;if(!no){$("calendarGrid").innerHTML="";$("calSummary").innerHTML="";return}
 let c=db.clients.find(x=>x.no===no),covered=paymentCoverage(no),dates=periodDateStrings(),today=new Date().toISOString().slice(0,10);
 $("calSummary").innerHTML=`<div class="calInfo"><b>${c.nom} ${c.prenom}</b> • ${c.hands} men • ${covered.length} jou kouvri • Peryòd ${db.period.start} → ${db.period.end}</div>`;
 $("calendarGrid").innerHTML=dates.map(ds=>{
   let p=db.payments.find(x=>x.no===no&&Array.isArray(x.coveredDates)&&x.coveredDates.includes(ds));
   let lateRec=p&&Array.isArray(p.lateDetails)?p.lateDetails.find(x=>x.dueDate===ds):null;
   let paid=covered.includes(ds),latePaid=paid&&lateRec&&lateRec.lateDays>0;
   let state=latePaid?"paidLate":paid?"paid":ds<=today?"lateDay":"future";
   let label=latePaid?`✓ Peye +${lateRec.lateDays}j`:paid?"✓ Peye":ds<=today?"Anreta":"Poko rive";
   let d=new Date(ds+"T00:00:00");
   return `<div class="day ${state}" title="${latePaid?`Te dwe peye ${ds}; peye ${lateRec.paidDate}`:""}"><small>${d.toLocaleDateString("ht-HT",{month:"short"})}</small><b>${d.getDate()}</b><span>${label}</span></div>`
 }).join("")
}
function showProfile(i){
 let c=db.clients[i],li=lateInfo(c),ps=db.payments.filter(p=>p.no===c.no),fs=db.fees.filter(f=>f.no===c.no),rs=db.funds.filter(f=>f.no===c.no);
 let ptotal=ps.reduce((s,p)=>s+p.total,0),fee=fs.reduce((s,f)=>s+f.amount,0),fund=rs.reduce((s,f)=>s+f.amount,0);
 $("profileBody").innerHTML=`<div class="profileHead"><small>FICH ENDIVIDYÈL KLIYAN</small><h2>${c.nom} ${c.prenom}</h2><p>${c.no} • ${c.tel||"Pa gen telefòn"}</p></div><div class="profileStats"><div><span>Men</span><b>${c.hands}</b></div><div><span>Jou Peye</span><b>${li.paid}</b></div><div><span>Reta</span><b>${li.late} jou</b></div><div><span>Estati</span><b>${li.status}</b></div></div><div class="profileInfo"><p><b>NIF/CIN:</b> ${c.nif||"—"}</p><p><b>Adrès:</b> ${c.adr||"—"}</p><p><b>Total Kotizasyon:</b> ${fmt(ptotal)}</p><p><b>Frè/Amand:</b> ${fmt(fee)}</p><p><b>Fon Remèt:</b> ${fmt(fund)}</p></div><h3>Dènye Peman</h3><table><thead><tr><th>Dat</th><th>Resi</th><th>Jou</th><th>Montan</th></tr></thead><tbody>${ps.slice().reverse().map(p=>`<tr><td>${p.date}</td><td>${p.receipt}</td><td>${p.days}</td><td>${fmt(p.total)}</td></tr>`).join("")||'<tr><td colspan="4">Pa gen peman.</td></tr>'}</tbody></table>`;
 $("profileModal").classList.add("show")
}
function closeProfile(){$("profileModal").classList.remove("show")}


function newPeriod(){auth(()=>{
 if(!confirm("Peryòd aktyèl la pral fèmen epi tout done li yo pral konsève nan Achiv. Kontinye?"))return;
 let namep=prompt("Non nouvo peryòd la:","Nouvo Sòl");if(!namep)return;
 let start=prompt("Dat kòmansman (AAAA-MM-JJ):",new Date().toISOString().slice(0,10));if(!/^\d{4}-\d{2}-\d{2}$/.test(start))return alert("Dat kòmansman an pa valab.");
 let end=prompt("Dat fen (AAAA-MM-JJ):","");if(!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<start)return alert("Dat fen an pa valab.");
 let daily=Number(prompt("Montan pa jou (Gdes):",String(db.period.daily||100)));if(!daily||daily<1)return alert("Montan an pa valab.");
 let keep=confirm("Èske ou vle kenbe menm lis kliyan yo pou nouvo peryòd la?\nOK = Wi\nAnile = Non");
 db.archives.push({period:JSON.parse(JSON.stringify(db.period)),clients:JSON.parse(JSON.stringify(db.clients)),payments:JSON.parse(JSON.stringify(db.payments)),fees:JSON.parse(JSON.stringify(db.fees)),funds:JSON.parse(JSON.stringify(db.funds)),closed:new Date().toISOString()});
 db.period={name:namep,start,end,daily};logAction("Nouvo peryòd",`${namep} • ${start} → ${end}`);
 db.clients=keep?db.clients.map(c=>({...c})):[];db.payments=[];db.fees=[];db.funds=[];
 save();alert("Nouvo peryòd la kòmanse. Ansyen peryòd la konsève nan Achiv.")
})}
function renderPeriods(){
 if(!$("currentPeriod"))return;
 $("currentPeriod").innerHTML=`<div class="periodCurrent"><small>PERYÒD AKTYÈL</small><h3>${db.period.name}</h3><p>${db.period.start} → ${db.period.end} • ${fmt(db.period.daily)} pa jou</p></div>`;
 $("archiveRows").innerHTML=db.archives.slice().reverse().map(a=>`<tr><td>${a.period.name}</td><td>${a.period.start}</td><td>${a.period.end}</td><td>${fmt(a.period.daily)}</td><td>${a.clients.length}</td><td>${fmt(a.payments.reduce((s,p)=>s+p.total,0))}</td><td>${fmt(a.funds.reduce((s,f)=>s+f.amount,0))}</td></tr>`).join("")||'<tr><td colspan="7">Pa gen peryòd achive pou kounye a.</td></tr>'
}

function validDailyDate(){
 let input=$("dailyDate"),today=new Date().toISOString().slice(0,10);
 input.min=db.period.start;input.max=db.period.end;
 let d=input.value||today;
 if(d<db.period.start)d=db.period.start;
 if(d>db.period.end)d=db.period.end;
 input.value=d;return d
}
function renderDaily(){
 let d=validDailyDate();
 let ps=db.payments.filter(x=>x.date===d),fs=db.fees.filter(x=>x.date===d),rs=db.funds.filter(x=>x.date===d);
 let ptotal=ps.reduce((s,x)=>s+x.total,0),ftotal=fs.reduce((s,x)=>s+x.amount,0),rtotal=rs.reduce((s,x)=>s+x.amount,0);
 let names=id=>{let c=db.clients.find(x=>x.no===id);return c?c.nom+" "+c.prenom:id};
 $("dailyReport").innerHTML=`
 <div class="dailyTotals"><article><span>Kotizasyon</span><strong>${fmt(ptotal)}</strong></article><article><span>Frè / Amand</span><strong>${fmt(ftotal)}</strong></article><article><span>Total Antre</span><strong>${fmt(ptotal+ftotal)}</strong></article><article><span>Remèt Fon</span><strong>${fmt(rtotal)}</strong></article><article><span>Balans Jounen</span><strong>${fmt(ptotal+ftotal-rtotal)}</strong></article></div>
 <h3>Kotizasyon — ${d}</h3><table><thead><tr><th>Resi</th><th>Kliyan</th><th>Jou Peye</th><th>Montan</th></tr></thead><tbody>${ps.map(x=>`<tr><td>${x.receipt}</td><td>${names(x.no)}</td><td>${x.days}</td><td>${fmt(x.total)}</td></tr>`).join("")||'<tr><td colspan="4">Pa gen kotizasyon pou dat sa.</td></tr>'}</tbody></table>
 <h3>Frè & Amand</h3><table><thead><tr><th>Kliyan</th><th>Kalite</th><th>Montan</th></tr></thead><tbody>${fs.map(x=>`<tr><td>${names(x.no)}</td><td>${x.type}</td><td>${fmt(x.amount)}</td></tr>`).join("")||'<tr><td colspan="3">Pa gen frè/amand pou dat sa.</td></tr>'}</tbody></table>
 <h3>Remèt Fon</h3><table><thead><tr><th>N° Bon</th><th>Kliyan</th><th>Kalite</th><th>Montan</th><th>Estati</th></tr></thead><tbody>${rs.map(x=>`<tr><td>${x.bon}</td><td>${names(x.no)}</td><td>${x.type}</td><td>${fmt(x.amount)}</td><td>${x.status}</td></tr>`).join("")||'<tr><td colspan="5">Pa gen fon remèt pou dat sa.</td></tr>'}</tbody></table>`;
}
function printDaily(){renderDaily();document.body.classList.add("printingDaily");window.print();setTimeout(()=>document.body.classList.remove("printingDaily"),500)}

function backup(){
 let payload={application:"SISI SAPOTAY Manager",version:1,backupDate:new Date().toISOString(),data:db};
 let a=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
 a.href=url;a.download=`SISI_SAPOTAY_SOVGAD_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function restoreBackup(){auth(()=>{
 let f=$("restoreFile").files[0];if(!f)return alert("Chwazi yon fichye sovgad anvan.");
 let r=new FileReader();r.onload=()=>{
   try{
     let x=JSON.parse(r.result),data=x.data||x;
     if(!data||!Array.isArray(data.clients)||!Array.isArray(data.payments))throw new Error();
     if(!confirm("Sa pral ranplase done aktyèl yo ak done ki nan sovgad la. Kontinye?"))return;
     db=data;if(!db.fees)db.fees=[];if(!db.funds)db.funds=[];if(!db.archives)db.archives=[];if(!db.audit)db.audit=[];
     if(!db.period)db.period={name:"Sòl 2026",start:"2026-09-15",end:"2026-11-03",daily:100};
     logAction("Restore sovgad","Done sistèm nan retabli depi yon fichye sovgad");save();$("restoreFile").value="";alert("Sovgad la retabli avèk siksè.")
   }catch(e){alert("Fichye sa a pa yon sovgad SISI SAPOTAY ki valab.")}
 };r.readAsText(f)
})}function changeCode(){auth(()=>{
 let n=prompt("Nouvo kòd la dwe gen EGZAKTEMAN 8 karaktè: lèt miniskil ak chif sèlman.");
 if(!n)return;
 if(!/^(?=.*[a-z])(?=.*[0-9])[a-z0-9]{8}$/.test(n))return alert("Kòd la pa valab. Li dwe gen 8 karaktè egzak, omwen yon lèt miniskil ak yon chif, san majiskil.");
 localStorage.setItem(CK,n);alert("Kòd responsab la chanje avèk siksè.")
})}sessionOpen=false;render();
if(document.getElementById("dailyDate")){validDailyDate();renderDaily();}

if($("authInput"))$("authInput").addEventListener("keydown",e=>{if(e.key==="Enter")submitAuth()});


/* ===== SISI SAPOTAY CLOUD ADMIN ===== */
let sisiCloud=null, cloudReady=false, cloudPeriodId=null, cloudSyncBusy=false;
function cloudClient(){
  if(sisiCloud)return sisiCloud;
  const c=window.SISI_CLOUD||{};
  if(!window.supabase||!c.SUPABASE_URL||!c.SUPABASE_PUBLISHABLE_KEY)return null;
  sisiCloud=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY);
  return sisiCloud;
}
function requestLogin(){
  const s=cloudClient();
  if(!s){alert("Konfigirasyon Cloud la pa disponib.");return}
  $("cloudEmail").value=localStorage.getItem("SISI_ADMIN_EMAIL")||"";
  $("cloudPassword").value=""; $("cloudLoginError").textContent="";
  $("cloudLoginModal").classList.add("show"); setTimeout(()=>$("cloudEmail").focus(),50);
}
function closeCloudLogin(){$("cloudLoginModal").classList.remove("show")}
async function submitCloudLogin(){
  const s=cloudClient(), email=$("cloudEmail").value.trim(), password=$("cloudPassword").value;
  if(!email||!password){$("cloudLoginError").textContent="Antre imel ak modpas la.";return}
  $("cloudLoginError").textContent="Koneksyon...";
  const {data,error}=await s.auth.signInWithPassword({email,password});
  if(error){$("cloudLoginError").textContent="Koneksyon pa reyisi. Verifye imel/modpas la.";return}
  const {data:isAdmin,error:adminErr}=await s.rpc("is_sisi_admin");
  if(adminErr||isAdmin!==true){await s.auth.signOut();$("cloudLoginError").textContent="Kont sa a pa gen dwa Administratè.";return}
  localStorage.setItem("SISI_ADMIN_EMAIL",email);
  await loadCloudCore();
  closeCloudLogin(); enterApp();
}
async function lockApp(){
  sessionOpen=false; cloudReady=false;
  try{const s=cloudClient(); if(s)await s.auth.signOut()}catch(e){}
  $("welcome").classList.remove("hide");page("dash");
}
async function loadCloudCore(){
 const s=cloudClient(); if(!s)return;
 const [{data:ps,error:pe},{data:cs,error:ce},{data:pays,error:pae}]=await Promise.all([
   s.from("periods").select("*").eq("active",true).order("id",{ascending:false}).limit(1),
   s.from("clients").select("*").eq("active",true).order("id"),
   s.from("payments").select("*").order("payment_date")
 ]);
 if(pe||ce||pae)throw new Error((pe||ce||pae).message);
 if(ps&&ps[0]){
   cloudPeriodId=ps[0].id;
   db.period={name:ps[0].name,start:ps[0].start_date,end:ps[0].end_date,daily:Number(ps[0].daily_amount)};
 }
 db.clients=(cs||[]).map(c=>({no:c.client_no,nom:c.nom,prenom:c.prenom||"",nif:c.nif_cin||"",adr:c.address||"",tel:c.phone||"",hands:Number(c.hands||1)}));
 const byId=Object.fromEntries((cs||[]).map(c=>[c.id,c.client_no]));
 db.payments=(pays||[]).filter(x=>!cloudPeriodId||x.period_id===cloudPeriodId).map(x=>({
   receipt:x.receipt_no,date:x.payment_date,no:byId[x.client_id]||"",days:Number(x.days),total:Number(x.amount),
   coveredDates:x.covered_dates||[],lateDetails:(x.covered_dates||[]).map(d=>({dueDate:d,paidDate:x.payment_date,lateDays:daysBetween(d,x.payment_date)}))
 }));
 localStorage.setItem(K,JSON.stringify(db)); cloudReady=true; render();
}
async function syncCloudCore(){
 if(!cloudReady||cloudSyncBusy)return;
 cloudSyncBusy=true;
 try{
   const s=cloudClient();
   // active period
   if(cloudPeriodId){
     let {error}=await s.from("periods").update({name:db.period.name,start_date:db.period.start,end_date:db.period.end,daily_amount:Number(db.period.daily),active:true}).eq("id",cloudPeriodId);
     if(error)throw error;
   }else{
     let {data,error}=await s.from("periods").insert({name:db.period.name,start_date:db.period.start,end_date:db.period.end,daily_amount:Number(db.period.daily),active:true}).select("id").single();
     if(error)throw error; cloudPeriodId=data.id;
   }
   // upsert clients
   if(db.clients.length){
     let rows=db.clients.map(c=>({client_no:c.no,nom:c.nom,prenom:c.prenom||"",nif_cin:c.nif||"",address:c.adr||"",phone:c.tel||"",hands:Number(c.hands||1),active:true}));
     let {error}=await s.from("clients").upsert(rows,{onConflict:"client_no"}); if(error)throw error;
   }
   let {data:cloudClients,error:clErr}=await s.from("clients").select("id,client_no"); if(clErr)throw clErr;
   let idByNo=Object.fromEntries((cloudClients||[]).map(c=>[c.client_no,c.id]));
   // payments first
   if(db.payments.length){
     let rows=db.payments.map(x=>({receipt_no:x.receipt,client_id:idByNo[x.no],period_id:cloudPeriodId,payment_date:x.date,days:Number(x.days),amount:Number(x.total),covered_dates:x.coveredDates||[]}));
     let {error}=await s.from("payments").upsert(rows,{onConflict:"receipt_no"}); if(error)throw error;
   }
   // delete cloud payments removed locally for active period
   let {data:cp}=await s.from("payments").select("receipt_no").eq("period_id",cloudPeriodId);
   let localReceipts=new Set(db.payments.map(x=>x.receipt));
   let delReceipts=(cp||[]).map(x=>x.receipt_no).filter(x=>!localReceipts.has(x));
   if(delReceipts.length){let {error}=await s.from("payments").delete().in("receipt_no",delReceipts);if(error)throw error}
   // delete clients removed locally only when no payment FK remains
   let localNos=new Set(db.clients.map(x=>x.no));
   let delNos=(cloudClients||[]).map(x=>x.client_no).filter(x=>!localNos.has(x));
   if(delNos.length){let {error}=await s.from("clients").delete().in("client_no",delNos);if(error)throw error}
   const badge=document.querySelector(".sessionBox b"); if(badge)badge.textContent="● CLOUD SENKRONIZE";
 }catch(e){
   console.error(e); const badge=document.querySelector(".sessionBox b"); if(badge)badge.textContent="⚠ CLOUD PA SENKRONIZE";
   alert("Done lokal la anrejistre, men Cloud la pa t senkronize: "+e.message);
 }finally{cloudSyncBusy=false}
}
const _localSave=save;
save=function(){localStorage.setItem(K,JSON.stringify(db));render();syncCloudCore();}
window.addEventListener("load",async()=>{
 const s=cloudClient(); if(!s)return;
 const {data}=await s.auth.getSession();
 if(data&&data.session){
   try{const {data:ok}=await s.rpc("is_sisi_admin");if(ok===true){await loadCloudCore();$("welcome").classList.add("hide");sessionOpen=true}}catch(e){}
 }
});
