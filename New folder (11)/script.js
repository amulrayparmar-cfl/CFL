/* =========================================================
   MOCK DATA & APPLICATION STATE
========================================================= */
const AGENTS = [
  {id:'a1', name:'Asma Vohra', assigned:14, resolved:9, aht:'11m', sla:96, csat:4.7},
  {id:'a2', name:'Thor Odinson', assigned:11, resolved:7, aht:'14m', sla:88, csat:4.4},
  {id:'a3', name:'Loki Odinson', assigned:9, resolved:8, aht:'9m', sla:99, csat:4.9},
  {id:'a4', name:'jahnvi Darji', assigned:16, resolved:10, aht:'18m', sla:79, csat:4.1},
  {id:'a5', name:'Priya Patel', assigned:6, resolved:6, aht:'8m', sla:100, csat:4.8},
  {id:'a6', name:'Adam Black', assigned:14, resolved:9, aht:'11m', sla:96, csat:4.7},
  {id:'a7', name:'Aditya Roy', assigned:11, resolved:7, aht:'14m', sla:88, csat:4.4},
  {id:'a8', name:'Arwin Elves', assigned:9, resolved:8, aht:'9m', sla:99, csat:4.9},
  {id:'a9', name:'Amrin Ali', assigned:16, resolved:10, aht:'18m', sla:79, csat:4.1},
  {id:'a10', name:'Alex Mac', assigned:6, resolved:6, aht:'18m', sla:100, csat:4.8},
];

/* =========================================================
   AGENT STATUS CONTROL & ACTIVITY LOGGING
========================================================= */
const STATUS_OPTIONS = ['Available','Break','Meeting','Training','Offline'];
const STATUS_COLOR = {Available:'#22C55E', Break:'#D98E3F', Meeting:'#6C4FB6', Training:'#3B6FA0', Offline:'#94A3B8'};
const CURRENT_AGENT_ID = 'a1';
const CURRENT_MANAGER_NAME = 'Manager';

function statusDotClass(s){ return 'dot-' + s.replace(/[^a-zA-Z]/g,''); }
function agentStatClass(s){ return 'astat-' + s.replace(/[^a-zA-Z]/g,''); }

function fmtLogTime(ts){
  return new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + ' · ' + new Date(ts).toLocaleDateString([], {month:'short', day:'numeric'});
}
function fmtDuration(mins){
  mins = Math.max(0, Math.round(mins));
  const h = Math.floor(mins/60), m = mins%60;
  return h>0 ? `${h}h ${m}m` : `${m}m`;
}

function initAgentStatuses(){
  const now = Date.now();
  const seed = [
    {status:'Available', minsAgo: 46},
    {status:'Break', minsAgo: 9},
    {status:'Meeting', minsAgo: 18},
    {status:'Training', minsAgo: 63},
    {status:'Available', minsAgo: 5},
  ];
  AGENTS.forEach((a,i)=>{
    const s = seed[i % seed.length];
    const startTs = now - s.minsAgo*60000;
    a.status = s.status;
    a.statusSince = startTs;
    a.paused = false;
    a.onLeave = false;
    a.leaveFrom = null; a.leaveFromTime = null; a.leaveTo = null; a.leaveToTime = null; a.leaveReason = null;
    a.durations = {Available:0, Break:0, Meeting:0, Training:0, Offline:0};
    a.log = [{ts: startTs, text: `Shift started — status set to ${s.status}`, actor:a.name, by:'agent'}];
  });
}

/* Records the elapsed time in the outgoing status, switches to the new one, and writes a timestamped log entry. */
function changeAgentStatus(agentId, newStatus, actorType, actorName, note){
  const a = AGENTS.find(x=>x.id===agentId);
  if(!a) return null;
  const now = Date.now();
  const elapsedMin = (now - a.statusSince) / 60000;
  a.durations[a.status] = (a.durations[a.status] || 0) + elapsedMin;
  const prevStatus = a.status;
  a.status = newStatus;
  a.statusSince = now;
  const who = actorType === 'manager' ? `by manager (${actorName})` : 'by self';
  a.log.unshift({
    ts: now,
    text: `Status changed from ${prevStatus} to ${newStatus}${note ? ' — ' + note : ''} (${who})`,
    actor: actorName, by: actorType
  });
  return a;
}

function liveDurations(a){
  const now = Date.now();
  const live = Object.assign({}, a.durations);
  live[a.status] = (live[a.status] || 0) + (now - a.statusSince) / 60000;
  return live;
}

function renderStatusLogModal(agentId, gridId, listId){
  const a = AGENTS.find(x=>x.id===agentId);
  if(!a) return;
  const live = liveDurations(a);
  document.getElementById(gridId).innerHTML = STATUS_OPTIONS.map(s=>`
    <div class="duration-card">
      <div class="dc-lbl"><span class="status-dot-lg" style="background:${STATUS_COLOR[s]};"></span>${s}</div>
      <div class="dc-val">${fmtDuration(live[s] || 0)}</div>
    </div>`).join('');
  document.getElementById(listId).innerHTML = a.log.map(e=>`
    <div class="log-row"><div class="log-time">${fmtLogTime(e.ts)}</div><div class="log-text">${e.text}</div></div>
  `).join('') || `<div style="color:var(--ink-faint);font-size:12px;padding:10px 0;">No activity logged yet.</div>`;
}

/* ---------- Self-service (agent) ---------- */
let statusDropdownOpen = false;
function buildStatusOptionsList(){
  const me = AGENTS.find(a=>a.id===CURRENT_AGENT_ID);
  document.getElementById('statusOptionsList').innerHTML = STATUS_OPTIONS.map(s=>`
    <div class="sd-opt ${s===me.status?'active':''}" onclick="setMyStatus('${s}')">
      <span class="status-dot-lg" style="background:${STATUS_COLOR[s]};"></span> ${s}
    </div>`).join('');
}
function toggleStatusDropdown(e){
  if(e) e.stopPropagation();
  statusDropdownOpen = !statusDropdownOpen;
  if(statusDropdownOpen) buildStatusOptionsList();
  document.getElementById('statusDropdownMenu').classList.toggle('show', statusDropdownOpen);
}
document.addEventListener('click', e=>{
  const btn = document.getElementById('statusPillBtn');
  const menu = document.getElementById('statusDropdownMenu');
  if(statusDropdownOpen && btn && menu && !btn.contains(e.target) && !menu.contains(e.target)){
    statusDropdownOpen = false;
    menu.classList.remove('show');
  }
});
function setMyStatus(newStatus){
  const me = AGENTS.find(a=>a.id===CURRENT_AGENT_ID);
  changeAgentStatus(me.id, newStatus, 'agent', me.name);
  refreshHeaderStatus();
  statusDropdownOpen = false;
  document.getElementById('statusDropdownMenu').classList.remove('show');
  showToast(`Status set to ${newStatus} — incoming tickets will route accordingly`);
  if(document.getElementById('view-team').classList.contains('active')) renderTeamStatus();
}
function openMyStatusLog(){
  statusDropdownOpen = false;
  document.getElementById('statusDropdownMenu').classList.remove('show');
  renderStatusLogModal(CURRENT_AGENT_ID, 'myDurationGrid', 'myLogList');
  document.getElementById('modalMyLog').classList.add('show');
}
function refreshHeaderStatus(){
  const me = AGENTS.find(a=>a.id===CURRENT_AGENT_ID);
  if(!me) return;
  document.getElementById('headerAvatarInitials').textContent = initials(me.name);
  document.getElementById('statusPillLabel').textContent = me.status;
  document.getElementById('headerStatusDot').style.background = STATUS_COLOR[me.status];
}

/* ---------- Team management (manager) ---------- */
function fmtLeaveRange(a){
  if(!a.leaveFrom || !a.leaveTo) return '';
  const dOpts = {month:'short', day:'numeric'};
  const tOpts = {hour:'2-digit', minute:'2-digit'};
  const f = new Date(a.leaveFrom + 'T' + (a.leaveFromTime || '00:00'));
  const t = new Date(a.leaveTo + 'T' + (a.leaveToTime || '00:00'));
  const fTxt = f.toLocaleDateString([], dOpts) + (a.leaveFromTime ? ' ' + f.toLocaleTimeString([], tOpts) : '');
  const tTxt = t.toLocaleDateString([], dOpts) + (a.leaveToTime ? ' ' + t.toLocaleTimeString([], tOpts) : '');
  return `${fTxt} \u2192 ${tTxt}`;
}
function renderTeamStatus(){
  const body = document.getElementById('teamStatusBody');
  if(!body) return;
  body.innerHTML = AGENTS.map(a=>{
    const live = liveDurations(a);
    return `<tr>
      <td><span class="assignee-pill"><span class="mini-avatar">${initials(a.name)}</span>${a.name}</span></td>
      <td>
        <select class="team-status-select" onchange="managerChangeStatus('${a.id}', this.value)">
          ${STATUS_OPTIONS.map(s=>`<option value="${s}" ${s===a.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="color:var(--ink-faint);">${fmtLogTime(a.statusSince)}</td>
      <td>${fmtDuration(live[a.status] || 0)}</td>
      <td><label class="mini-toggle" style="${a.onLeave?'opacity:.55;':''}"><input type="checkbox" ${a.paused?'checked':''} ${a.onLeave?'disabled title="Automatically paused while on leave"':''} onchange="togglePauseAssignment('${a.id}', this.checked)"> Paused</label></td>
      <td><label class="mini-toggle"><input type="checkbox" ${a.onLeave?'checked':''} onchange="handleLeaveCheckbox('${a.id}', this.checked)"> On leave</label>${a.onLeave ? `<div style="font-size:10px;color:var(--ink-faint);margin-top:2px;">${fmtLeaveRange(a)}</div>` : ''}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="openAgentLog('${a.id}')">View log</button></td>
    </tr>`;
  }).join('');
  enhanceAllSelects(body);
}
function managerChangeStatus(agentId, newStatus){
  const a = changeAgentStatus(agentId, newStatus, 'manager', CURRENT_MANAGER_NAME, 'manual override');
  showToast(`${a.name}'s status set to ${newStatus} by manager`);
  renderTeamStatus();
  if(agentId === CURRENT_AGENT_ID) refreshHeaderStatus();
}
function togglePauseAssignment(agentId, checked){
  const a = AGENTS.find(x=>x.id===agentId);
  if(!a || a.onLeave) return;
  a.paused = checked;
  a.log.unshift({ts: Date.now(), text: checked ? 'Ticket assignment paused by manager' : 'Ticket assignment resumed by manager', actor: CURRENT_MANAGER_NAME, by:'manager'});
  showToast(`${a.name}'s ticket assignment ${checked ? 'paused' : 'resumed'}`);
  renderTeamStatus();
}
let leaveModalAgentId = null;
function handleLeaveCheckbox(agentId, checked){
  if(checked) openLeaveModal(agentId);
  else endLeave(agentId);
}
function openLeaveModal(agentId){
  const a = AGENTS.find(x=>x.id===agentId);
  if(!a) return;
  leaveModalAgentId = agentId;
  document.getElementById('leaveAgentInfo').textContent = `Scheduling leave for ${a.name} — ticket assignment will be automatically paused for the leave period.`;
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('leaveFromDate').value = a.leaveFrom || today;
  document.getElementById('leaveFromTime').value = a.leaveFromTime || '09:00';
  document.getElementById('leaveToDate').value = a.leaveTo || today;
  document.getElementById('leaveToTime').value = a.leaveToTime || '18:00';
  document.getElementById('leaveReasonInput').value = a.leaveReason || '';
  document.getElementById('modalLeave').classList.add('show');
}
function closeLeaveModal(){
  document.getElementById('modalLeave').classList.remove('show');
  leaveModalAgentId = null;
  renderTeamStatus();
}
function submitLeaveForm(){
  const a = AGENTS.find(x=>x.id===leaveModalAgentId);
  if(!a) return;
  const fromDate = document.getElementById('leaveFromDate').value;
  const fromTime = document.getElementById('leaveFromTime').value;
  const toDate = document.getElementById('leaveToDate').value;
  const toTime = document.getElementById('leaveToTime').value;
  const reason = document.getElementById('leaveReasonInput').value.trim();
  if(!fromDate || !toDate){ showToast('Select both a from and to date to continue'); return; }
  if(new Date(toDate + 'T' + (toTime||'00:00')) < new Date(fromDate + 'T' + (fromTime||'00:00'))){
    showToast('Leave end must be after the start'); return;
  }
  a.onLeave = true;
  a.paused = true;
  a.leaveFrom = fromDate; a.leaveFromTime = fromTime;
  a.leaveTo = toDate; a.leaveToTime = toTime;
  a.leaveReason = reason;
  const rangeTxt = fmtLeaveRange(a);
  a.log.unshift({ts: Date.now(), text: `Ticket assignment automatically paused — On Leave (${rangeTxt})${reason ? ' — ' + reason : ''}`, actor: CURRENT_MANAGER_NAME, by:'manager'});
  changeAgentStatus(a.id, 'Offline', 'manager', CURRENT_MANAGER_NAME, `on leave ${rangeTxt}`);
  document.getElementById('modalLeave').classList.remove('show');
  leaveModalAgentId = null;
  showToast(`${a.name} marked On Leave from ${fromDate} to ${toDate}`);
  renderTeamStatus();
  if(a.id === CURRENT_AGENT_ID) refreshHeaderStatus();
}
function endLeave(agentId){
  const a = AGENTS.find(x=>x.id===agentId);
  if(!a) return;
  a.onLeave = false;
  a.paused = false;
  a.leaveFrom = null; a.leaveFromTime = null; a.leaveTo = null; a.leaveToTime = null; a.leaveReason = null;
  a.log.unshift({ts: Date.now(), text: 'Leave ended by manager — ticket assignment resumed automatically', actor: CURRENT_MANAGER_NAME, by:'manager'});
  changeAgentStatus(agentId, 'Available', 'manager', CURRENT_MANAGER_NAME, 'returned from leave');
  showToast(`${a.name} returned from leave — assignment resumed`);
  renderTeamStatus();
  if(agentId === CURRENT_AGENT_ID) refreshHeaderStatus();
}
document.getElementById('modalLeave').addEventListener('click', e=>{
  if(e.target.id==='modalLeave') closeLeaveModal();
});
function openAgentLog(agentId){
  const a = AGENTS.find(x=>x.id===agentId);
  if(!a) return;
  document.getElementById('agentLogTitle').textContent = `${a.name} — activity log`;
  renderStatusLogModal(agentId, 'agentDurationGrid', 'agentLogList');
  document.getElementById('modalAgentLog').classList.add('show');
}

initAgentStatuses();

/* =========================================================
   PRE-APPROVED REPLY TEMPLATES (per channel)
========================================================= */
const TEMPLATES = [
  // Chat
  {id:'tpl1', channel:'Chat', title:'Greeting — opening', body:"Hi {{customer}}, thanks for reaching out! I'm pulling up your account now — one moment please."},
  {id:'tpl2', channel:'Chat', title:'Ask for more info', body:"Could you share a few more details (loan ID, screenshot, or date of the transaction) so I can look into this quickly?"},
  {id:'tpl3', channel:'Chat', title:'Investigating', body:"I've found your account and I'm reviewing the transaction history now — I'll update you shortly."},
  {id:'tpl4', channel:'Chat', title:'Resolved — closing', body:"This has been resolved on our end. Is there anything else I can help you with today?"},
  {id:'tpl5', channel:'Chat', title:'Repayment tenure options', body:"We currently offer 6, 9 and 12-month repayment tenures — you can change this anytime from Loan > Manage EMI in the app."},
  // WhatsApp
  {id:'tpl6', channel:'WhatsApp', title:'Greeting — opening', body:"Hi {{customer}}, sorry for the trouble — pulling up your loan account now."},
  {id:'tpl7', channel:'WhatsApp', title:'Refund initiated', body:"Confirmed the duplicate charge — a refund has been initiated and should reflect in 3–5 business days."},
  {id:'tpl8', channel:'WhatsApp', title:'KYC re-upload help', body:"Please re-upload your document in good lighting with all four corners visible — this usually resolves the blur rejection."},
  {id:'tpl9', channel:'WhatsApp', title:'Escalated to specialist team', body:"I've escalated this to our specialist team with priority — you'll hear back within 24 hours."},
  {id:'tpl10', channel:'WhatsApp', title:'Payment reminder', body:"Reminder: your EMI of ₹{{amount}} is due on {{date}}. Reply PAY to get a quick payment link."},
  // SMS
  {id:'tpl11', channel:'SMS', title:'Short acknowledgement', body:"Hi {{customer}}, we've received your query (Ref: {{ticket}}) and are looking into it. We'll update you shortly."},
  {id:'tpl12', channel:'SMS', title:'OTP / verification help', body:"For account verification issues, please ensure your registered mobile number is active and retry after 5 minutes."},
  {id:'tpl13', channel:'SMS', title:'Payment confirmation', body:"Your EMI payment has been received. Thank you for banking with Lenditt."},
  {id:'tpl14', channel:'SMS', title:'Escalation notice', body:"Your issue has been escalated (Ref: {{ticket}}). Our team will call you within 24 hours."},
  // Email
  {id:'tpl15', channel:'Email', title:'Formal acknowledgement', body:"Dear {{customer}},\n\nThank you for contacting Lenditt Support. We've logged your request under reference {{ticket}} and are reviewing it. We'll respond with an update within one business day.\n\nRegards,\nLenditt Customer Support"},
  {id:'tpl16', channel:'Email', title:'Refund confirmation', body:"Dear {{customer}},\n\nWe've confirmed the duplicate charge on your account and initiated a refund. Please allow 3–5 business days for it to reflect in your original payment method.\n\nRegards,\nLenditt Customer Support"},
  {id:'tpl17', channel:'Email', title:'KYC document request', body:"Dear {{customer}},\n\nTo proceed with your KYC verification, please re-upload a clear photo of your document with all four corners visible and no glare.\n\nRegards,\nLenditt Customer Support"},
  {id:'tpl18', channel:'Email', title:'Closing / resolution', body:"Dear {{customer}},\n\nWe're confirming that the issue reported under {{ticket}} has now been resolved. Please let us know if you have any further questions.\n\nRegards,\nLenditt Customer Support"},
];
function fillTemplate(body, t){
  return body.replace(/\{\{customer\}\}/g, t.customer).replace(/\{\{ticket\}\}/g, t.id).replace(/\{\{amount\}\}/g, '—').replace(/\{\{date\}\}/g, '—');
}

/* ---- Email composer configuration ----
   NOTE: "From" list below is a placeholder set of department outbound
   aliases — swap in the authorized admin email list once it's provided. */
const EMAIL_FROM_OPTIONS = [
  {email:'support@lenditt.com', dept:'Customer Support'},
  {email:'collections@lenditt.com', dept:'Collections'},
  {email:'grievance@lenditt.com', dept:'Grievance'},
];
const EMAIL_SIGNATURES = {
  'Collections': "Regards,\nChinmay\nCollections Team, Lenditt",
  'Grievance': "Regards,\nChinmay\nGrievance Team, Lenditt",
  'Customer Support': "Regards,\nCustomer Support Team, Lenditt",
};
function signatureForTicket(t){
  return EMAIL_SIGNATURES[t.queue] || EMAIL_SIGNATURES['Customer Support'];
}
function deptFromEmail(email){
  const o = EMAIL_FROM_OPTIONS.find(x=>x.email===email);
  return o ? o.dept : 'Customer Support';
}

const CUSTOMERS = [
  {name:'Amul Roy', phone:'+1 416 555 0101'},
  {name:'Advard', phone:'+1 647 555 0119'},
  {name:'Devansh Rao', phone:'+1 905 555 0134'},
  {name:'Vedant', phone:'+1 416 555 0177'},
  {name:'Arvin White', phone:'+1 437 555 0188'},
  {name:'Alisa', phone:'+1 416 555 0199'},
];

function daysAgo(n, h, m){ const d = new Date(); d.setDate(d.getDate()-n); d.setHours(h,m,0,0); return d; }

let TICKETS = [
  {id:'TCK-10231', subject:'EMI deducted twice this month', customer:'Amul Roy', phone:'+1 416 555 0101', email:'amul.roy@gmail.com', channel:'WhatsApp', priority:'High', status:'In Progress', queue:'Collections', department:'Collections', nbfcPartner:'Chinmay', source:'Chinmay', assignee:'a1', updated:'12m ago', slaMins:38, category:'EMI / Repayment', loanId:'LN-44018', loanStage:'EMI active', createdAt: daysAgo(0,10,2),
    thread:[
      {dir:'in', text:"Hi, my EMI got deducted twice this month for the same loan. Can you check?", chan:'WhatsApp', time:'10:02 AM'},
      {dir:'out', text:"Hi Amul, sorry for the trouble — pulling up your loan account now.", chan:'WhatsApp', time:'10:05 AM'},
      {dir:'in', text:"Thanks, reference should be on the app under transaction history.", chan:'WhatsApp', time:'10:06 AM'},
    ],
    activity:['Ticket created via WhatsApp — auto-routed to Collections','Auto-assigned to Riya Sen','Status changed to In Progress']},

  {id:'TCK-10232', subject:'KYC document re-upload not working', customer:'Advard', phone:'+1 647 555 0119', email:'advard@gmail.com', channel:'Email', priority:'Medium', status:'Open', queue:'Customer Support', department:'Customer Support', nbfcPartner:'Tapstart', source:'Lenditt', assignee:'a2', updated:'26m ago', slaMins:180, category:'KYC', loanId:'LN-50102', loanStage:'KYC pending', createdAt: daysAgo(0,9,40),
    thread:[
      {dir:'in', text:"I tried re-uploading my Aadhaar 3 times, the app keeps rejecting it as blurry.", chan:'Email', time:'9:40 AM'},
    ],
    activity:['Ticket created via Email','Assigned to Karan Mehta']},

  {id:'TCK-10233', subject:'Loan disbursal delayed beyond promised time', customer:'Devansh Rao', phone:'+1 905 555 0134', email:'devansh.rao@gmail.com', channel:'Call', priority:'High', status:'Escalated', queue:'Customer Support', department:'Customer Support', nbfcPartner:'Tapstart', source:'ONDC App', assignee:'a3', updated:'4m ago', slaMins:-22, category:'Loan Disbursal', createdAt: daysAgo(0,7,15),
    thread:[
      {dir:'in', text:"Called in — customer says approval came through 2 days ago but funds haven't arrived.", chan:'Call', time:'9:12 AM', call:true},
      {dir:'out', text:"Escalating to disbursal ops with account reference for priority processing.", chan:'Call', time:'9:20 AM'},
    ],
    activity:['Ticket created via inbound call','Call recording + summary attached','Escalated to Manager — SLA at risk','Priority raised to High']},

  {id:'TCK-10234', subject:'Wants to know repayment tenure options', customer:'Vedant', phone:'+1 416 555 0177', email:'vedant@gmail.com', channel:'Chat', priority:'Low', status:'New', queue:'Customer Support', department:'Customer Support', nbfcPartner:'Chinmay', source:'ONDC App', assignee:'a4', updated:'2m ago', slaMins:1420, category:'General Query', createdAt: daysAgo(0,11,25),
    thread:[
      {dir:'in', text:"Hey! Does Lenditt offer a 6-month repayment option or only 12?", chan:'Chat', time:'11:01 AM'},
    ],
    activity:['Ticket created via in-app chat','Auto-assigned to Farhan Ali']},

  {id:'TCK-10235', subject:'Complaint about collections call tone', customer:'Arvin White', phone:'+1 437 555 0188', email:'arvin.white@gmail.com', channel:'Call', priority:'High', status:'Waiting for Customer', queue:'Grievance', department:'Grievance', nbfcPartner:'Chinmay', source:'Chinmay', assignee:'a5', updated:'1h ago', slaMins:95, category:'Grievance', createdAt: daysAgo(0,8,0),
    thread:[
      {dir:'in', text:"I want to file a complaint about how I was spoken to on a collections call yesterday.", chan:'Call', time:'Yesterday, 4:32 PM', call:true},
      {dir:'out', text:"I'm very sorry to hear that. I've logged this as a formal grievance and I'm pulling the call recording to review.", chan:'Call', time:'Yesterday, 4:40 PM'},
      {dir:'note', text:"Call recording reviewed — flagging agent for QA coaching. Awaiting customer confirmation of resolution.", chan:'Internal', time:'Today, 9:15 AM'},
    ],
    activity:['Ticket created via inbound call','Routed to Grievance queue','Assigned to Priya Nair','Internal note added']},

  {id:'TCK-10236', subject:'Refund for double processing fee', customer:'Alisa', phone:'+1 416 555 0199', email:'alisa@gmail.com', channel:'WhatsApp', priority:'Medium', status:'Resolved', queue:'Customer Support', department:'Customer Support', nbfcPartner:'Lenditt', source:'Lenditt', assignee:'a2', updated:'3h ago', slaMins:600, category:'EMI / Repayment', createdAt: daysAgo(1,14,30),
    thread:[
      {dir:'in', text:"Processing fee was charged twice on my last loan. Please refund.", chan:'WhatsApp', time:'8:10 AM'},
      {dir:'out', text:"Confirmed the duplicate charge — refund of the extra fee has been initiated, should reflect in 3-5 business days.", chan:'WhatsApp', time:'8:44 AM'},
    ],
    activity:['Ticket created via WhatsApp','Assigned to Karan Mehta','Refund initiated','Status changed to Resolved']},

  {id:'TCK-10237', subject:'Duplicate: EMI deducted twice', customer:'Amul Roy', phone:'+1 416 555 0101', email:'amul.roy@gmail.com', channel:'Email', priority:'Medium', status:'Open', queue:'Collections', department:'Collections', nbfcPartner:'Chinmay', source:'Chinmay', assignee:'a1', updated:'8m ago', slaMins:150, category:'EMI / Repayment', loanId:'LN-44018', loanStage:'EMI active', createdAt: daysAgo(0,10,3),
    thread:[
      {dir:'in', text:"Following up by email in case WhatsApp doesn't reach the right team — double EMI deduction issue.", chan:'Email', time:'10:15 AM'},
    ],
    activity:['Ticket created via Email','Assigned to Riya Sen','Flagged as likely duplicate of TCK-10231']},

  {id:'TCK-10238', subject:'App crashes on loan application step 3', customer:'Advard', phone:'+1 647 555 0119', email:'advard@gmail.com', channel:'Chat', priority:'Low', status:'Hold', queue:'Customer Support', department:'Customer Support', nbfcPartner:'Tapstart', source:'ONDC App', assignee:'a4', updated:'50m ago', slaMins:800, category:'General Query', loanId:'LN-50102', loanStage:'KYC pending', createdAt: daysAgo(1,16,45),
    thread:[{dir:'in', text:"App keeps crashing when I try to submit my bank details. Using Android 14.", chan:'Chat', time:'9:55 AM'}],
    activity:['Ticket created via in-app chat','Assigned to Farhan Ali','On hold — pending engineering confirmation']},

  {id:'TCK-10239', subject:'WhatsApp follow-up on EMI mismatch', customer:'Amul Roy', phone:'+1 416 555 0101', email:'amul.roy@gmail.com', channel:'WhatsApp', priority:'Medium', status:'Open', queue:'Collections', department:'Collections', nbfcPartner:'Chinmay', source:'Chinmay', assignee:'a1', updated:'21m ago', slaMins:220, category:'Repayment', loanId:'LN-44018', loanStage:'EMI active', createdAt: daysAgo(0,8,45),
    thread:[{dir:'in', text:"Hi, I received a different EMI amount than expected on the WhatsApp confirmation sheet. Please clarify.", chan:'WhatsApp', time:'8:45 AM'}],
    activity:['Ticket created via WhatsApp','Assigned to Riya Sen','Customer requested payment clarification']},

  {id:'TCK-10240', subject:'Email query for loan status after missed payment', customer:'Amul Roy', phone:'+1 416 555 0101', email:'amul.roy@gmail.com', channel:'Email', priority:'Low', status:'New', queue:'Customer Support', department:'Customer Support', nbfcPartner:'Chinmay', source:'Lenditt', assignee:'a4', updated:'1h ago', slaMins:740, category:'General query', loanId:'LN-44018', loanStage:'EMI active', createdAt: daysAgo(1,11,30),
    thread:[{dir:'in', text:"Could you confirm if my missed payment will affect my loan stage or current EMI schedule?", chan:'Email', time:'11:30 AM'}],
    activity:['Ticket created via Email','Queued to Customer Support']},

  {id:'TCK-10241', subject:'Chat follow-up: wrong settlement message', customer:'Advard', phone:'+1 647 555 0119', email:'advard@gmail.com', channel:'Chat', priority:'Medium', status:'Open', queue:'Customer Support', department:'Customer Support', nbfcPartner:'Tapstart', source:'ONDC App', assignee:'a2', updated:'39m ago', slaMins:150, category:'App not working', loanId:'LN-50102', loanStage:'KYC pending', createdAt: daysAgo(0,6,20),
    thread:[{dir:'in', text:"I got a message saying my application was approved, but the app still shows KYC pending. Please check.", chan:'Chat', time:'6:20 AM'}],
    activity:['Ticket created via in-app chat','Assigned to Karan Mehta','Customer flagged inconsistent app status']},

  {id:'TCK-10242', subject:'Call complaint about repayment reminder timing', customer:'Amul Roy', phone:'+1 416 555 0101', email:'amul.roy@gmail.com', channel:'Call', priority:'High', status:'Waiting for Customer', queue:'Grievance', department:'Grievance', nbfcPartner:'Chinmay', source:'Chinmay', assignee:'a5', updated:'2h ago', slaMins:95, category:'Payment issue', loanId:'LN-44018', loanStage:'EMI active', createdAt: daysAgo(0,4,50),
    thread:[{dir:'in', text:"Called to complain that the repayment reminder was sent at 2 AM and the amount details were incorrect.", chan:'Call', time:'4:50 AM', call:true}],
    activity:['Inbound call received','Routed to Grievance queue','Awaiting customer confirmation']},
];

let selectedTicketId = null;
let currentRole = 'agent';
let replyMode = 'reply';
let replyChannel = 'Chat';
let mergeSelectedId = null;
let bulkSelectedIds = new Set();

const STATUSES = ['New','Open','Assigned','In Progress','Waiting for Customer','Hold','Escalated','Resolved','Closed','Reopened'];
function statusClass(s){ return 'status-' + s.replace(/[^a-zA-Z]/g,''); }
function chanClass(c){ return 'chan-' + c.toLowerCase(); }
function initials(name){ return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function agentName(id){ const a = AGENTS.find(x=>x.id===id); return a? a.name : '—'; }

/* =========================================================
   OUTER RAIL SWITCHING
========================================================= */
function switchRailItem(el, targetKey) {
  document.querySelectorAll('.left-rail .rail-item').forEach(item => item.classList.remove('active'));
  el.classList.add('active');

  const mainChat = document.getElementById('main-chat-console');
  const genericView = document.getElementById('generic-rail-view');

  if (targetKey === 'chat') {
    mainChat.style.display = 'grid';
    genericView.style.display = 'none';
    switchView('tickets');
  } else if (targetKey === 'home') {
    mainChat.style.display = 'grid';
    genericView.style.display = 'none';
    setRole('manager');
    switchView('dashboard');
  } else if (targetKey === 'tasks') {
    mainChat.style.display = 'grid';
    genericView.style.display = 'none';
    switchView('tickets');
    document.getElementById('fSearch').value = '';
    setStatusFilter('Open');
  } else if (targetKey === 'teams') {
    mainChat.style.display = 'grid';
    genericView.style.display = 'none';
    switchView('customers');
  } else {
    mainChat.style.display = 'none';
    genericView.style.display = 'flex';

    const iconsMap = {
      financials: '₹', broadcasts: '📣', security: '🛡️', accounts: '👤',
      branches: '🏢', reports: '📄', contacts: '📇', settings: '⚙️'
    };
    const titlesMap = {
      financials: 'Financials & EMI Records', broadcasts: 'Broadcasts & Campaigns',
      security: 'Security & Compliance Matrix', accounts: 'User Account Management',
      branches: 'Branches & Entity Settings', reports: 'System Reports & Audits',
      contacts: 'Contact Directory & CRM', settings: 'System Preferences'
    };
    const descMap = {
      financials: 'View loan disbursals, EMI schedules, repayment tracking and financial reconciliation logs.',
      broadcasts: 'Manage mass notifications, SMS alerts, WhatsApp campaigns and customer broadcasts.',
      security: 'Configure access permissions, RBI compliance audit logs and security policies.',
      accounts: 'Manage agent user profiles, authentication rules and credential settings.',
      branches: 'Overview of regional operational branches, call center routing and department structures.',
      reports: 'Generate and download deep compliance reports, ticket logs and customer SLA exports.',
      contacts: 'Full list of registered phone numbers, customer contacts and partner contacts.',
      settings: 'Configure platform dark mode, integration webhooks and automated workflow rules.'
    };

    document.getElementById('genericViewIcon').textContent = iconsMap[targetKey] || '⚙️';
    document.getElementById('genericViewTitle').textContent = titlesMap[targetKey] || 'Module Section';
    document.getElementById('genericViewDesc').textContent = descMap[targetKey] || 'Section settings and tools.';
  }
}

function returnToChatConsole() {
  const chatRailItem = document.getElementById('railItemChat');
  switchRailItem(chatRailItem, 'chat');
}

function handlePhoneSearch(val) {
  if(!val.trim()) return;
  const chatRailItem = document.getElementById('railItemChat');
  switchRailItem(chatRailItem, 'chat');
  switchView('tickets');
  document.getElementById('fSearch').value = val;
  renderTicketList();
}

/* =========================================================
   INNER CONSOLE NAV & VIEW SWITCHING
========================================================= */
function switchView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  document.querySelectorAll('.subnav-item').forEach(n=>n.classList.remove('active'));
  const item = document.querySelector(`.subnav-item[data-view="${name}"]`);
  if(item) item.classList.add('active');
  if(name==='dashboard') renderDashboard();
  if(name==='manageall') renderManageAll();
  if(name==='team') renderTeamStatus();
  if(name==='queues') renderQueues();
  if(name==='customers') renderCustomers();
}

function canBulkManage(){
  return currentRole === 'manager';
}
function setRole(role){
  currentRole = role;
  document.getElementById('roleAgentBtn').classList.toggle('active', role==='agent');
  document.getElementById('roleMgrBtn').classList.toggle('active', role==='manager');
  const mgrEls = ['mgrLabel','navDashboard','navManageAll','navTeam'];
  mgrEls.forEach(id=>document.getElementById(id).style.display = role==='manager' ? 'flex' : 'none');
  const bulkBtn = document.getElementById('bulkActionBtn');
  if(bulkBtn) bulkBtn.style.display = role === 'manager' ? 'inline-flex' : 'none';
  document.querySelector('.subnav-item[data-view="tickets"]').innerHTML = role==='manager' ? '<span class="ic">☰</span> My tickets' : '<span class="ic">☰</span> Tickets';
  if(role==='manager'){ switchView('dashboard'); } else { switchView('tickets'); }
  showToast(role==='manager' ? 'Switched to Manager view — full analytics unlocked' : 'Switched to Agent view');
}

/* =========================================================
   TICKET LIST
========================================================= */
function setStatusFilter(status){
  const sel = document.getElementById('fStatus');
  sel.value = status;
  updateSselLabel(sel);
  renderTicketList();
}

/* ---- Date range filter (shared by "My tickets" and "Manage all tickets") ---- */
function toDateInputValue(d){
  const p = n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
function quickDate(prefix, which, btn){
  const base = new Date();
  if(which==='yesterday') base.setDate(base.getDate()-1);
  const val = toDateInputValue(base);
  document.getElementById(prefix+'DateFrom').value = val;
  document.getElementById(prefix+'DateTo').value = val;
  document.querySelectorAll(`#${prefix}QuickDates button`).forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  prefix==='f' ? renderTicketList() : renderManageAll();
}
function onDateInputChange(prefix){
  document.querySelectorAll(`#${prefix}QuickDates button`).forEach(b=>b.classList.remove('active'));
  prefix==='f' ? renderTicketList() : renderManageAll();
}
function clearDateFilter(prefix){
  document.getElementById(prefix+'DateFrom').value = '';
  document.getElementById(prefix+'DateTo').value = '';
  document.querySelectorAll(`#${prefix}QuickDates button`).forEach(b=>b.classList.remove('active'));
  prefix==='f' ? renderTicketList() : renderManageAll();
}
function inDateRange(t, fromVal, toVal){
  if(!fromVal && !toVal) return true;
  if(!t.createdAt) return true;
  const d = toDateInputValue(t.createdAt);
  if(fromVal && d < fromVal) return false;
  if(toVal && d > toVal) return false;
  return true;
}

function renderTicketList(){
  const status = document.getElementById('fStatus').value;
  const pri = document.getElementById('fPriority').value;
  const chan = document.getElementById('fChannel').value;
  const queue = document.getElementById('fQueue').value;
  const search = document.getElementById('fSearch').value.toLowerCase();
  const dateFrom = document.getElementById('fDateFrom').value;
  const dateTo = document.getElementById('fDateTo').value;
  let rows = TICKETS.filter(t=>t.status!=='Merged');
  if(status) rows = rows.filter(t=>t.status===status);
  if(pri) rows = rows.filter(t=>t.priority===pri);
  if(chan) rows = rows.filter(t=>t.channel===chan);
  if(queue) rows = rows.filter(t=>t.queue===queue);
  if(search) rows = rows.filter(t=>t.id.toLowerCase().includes(search)||t.customer.toLowerCase().includes(search)||t.phone.toLowerCase().includes(search));
  rows = rows.filter(t=>inDateRange(t, dateFrom, dateTo));
  document.getElementById('ticketTableBody').innerHTML = rows.map(rowHtml).join('') || `<tr><td colspan="10" style="text-align:center;color:var(--ink-faint);padding:30px;">No tickets match these filters.</td></tr>`;
}

function slaLabel(mins){
  if(mins < 0) return `<span class="sla-txt sla-breach">Breached ${Math.abs(mins)}m</span>`;
  if(mins < 60) return `<span class="sla-txt sla-warn">${mins}m left</span>`;
  const h = Math.floor(mins/60), m = mins%60;
  return `<span class="sla-txt sla-ok">${h}h ${m}m left</span>`;
}

function rowHtml(t){
  const canBulk = canBulkManage();
  const chk = canBulk
    ? `<input type="checkbox" class="checkbox bulk-cb" data-id="${t.id}" onchange="toggleBulk('${t.id}',this.checked)">`
    : `<input type="checkbox" class="checkbox" disabled title="Bulk actions are limited to team leads and managers">`;
  return `<tr class="trow" onclick="openTicket('${t.id}')">
    <td onclick="event.stopPropagation()">${chk}</td>
    <td><div class="subj">${t.subject}</div><div class="subj-cust">${t.id}</div></td>
    <td>${t.customer}</td>
    <td><span class="chan-badge ${chanClass(t.channel)}">${t.channel}</span></td>
    <td><span class="pri-badge pri-${t.priority}">${t.priority}</span></td>
    <td><span class="status-badge ${statusClass(t.status)}">${t.status}</span></td>
    <td>${t.queue}</td>
    <td><span class="assignee-pill"><span class="mini-avatar">${initials(agentName(t.assignee))}</span>${agentName(t.assignee)}</span></td>
    <td>${slaLabel(t.slaMins)}</td>
    <td style="color:var(--ink-faint);">${t.updated}</td>
  </tr>`;
}

/* =========================================================
   MANAGE ALL (Manager)
========================================================= */
function renderManageAll(){
  const agentSel = document.getElementById('mfAgent');
  if(agentSel.options.length<=1){ AGENTS.forEach(a=>agentSel.innerHTML += `<option value="${a.id}">${a.name}</option>`); }
  const statusSel = document.getElementById('mfStatus');
  if(statusSel.options.length<=1){ STATUSES.forEach(s=>statusSel.innerHTML += `<option>${s}</option>`); }
  enhanceSearchSelect(agentSel);
  enhanceSearchSelect(statusSel);

  const agent = agentSel.value, status = statusSel.value, queue = document.getElementById('mfQueue').value;
  const dateFrom = document.getElementById('mfDateFrom').value;
  const dateTo = document.getElementById('mfDateTo').value;
  let rows = TICKETS.slice();
  if(agent) rows = rows.filter(t=>t.assignee===agent);
  if(status) rows = rows.filter(t=>t.status===status);
  if(queue) rows = rows.filter(t=>t.queue===queue);
  rows = rows.filter(t=>inDateRange(t, dateFrom, dateTo));
  document.getElementById('manageAllBody').innerHTML = rows.map(t=>{
    const base = rowHtml(t);
    return base.replace('<input type="checkbox" class="checkbox">', `<input type="checkbox" class="checkbox bulk-cb" data-id="${t.id}" onchange="toggleBulk('${t.id}',this.checked)">`);
  }).join('') || `<tr><td colspan="10" style="text-align:center;color:var(--ink-faint);padding:30px;">No tickets match.</td></tr>`;
}
function toggleAll(cb){
  document.querySelectorAll('.bulk-cb').forEach(el=>{ el.checked = cb.checked; toggleBulk(el.dataset.id, cb.checked); });
}
function toggleBulk(id, checked){ checked ? bulkSelectedIds.add(id) : bulkSelectedIds.delete(id); }
let bulkActionMode = 'agent';
function setBulkAction(mode){
  bulkActionMode = mode;
  document.querySelectorAll('.bulk-action-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bulkAction === mode);
  });
  document.getElementById('bulkPanelAgent').classList.toggle('show', mode === 'agent');
  document.getElementById('bulkPanelClose').classList.toggle('show', mode === 'close');
  document.getElementById('bulkPanelQueue').classList.toggle('show', mode === 'queue');
}
function bulkReassignOpen(){
  if(!canBulkManage()){
    showToast('Only team leads and managers can perform bulk actions.');
    return;
  }
  document.getElementById('bulkCount').textContent = `${bulkSelectedIds.size} ticket(s) selected.`;

  const agentSel = document.getElementById('bulkAgent');
  agentSel.innerHTML = AGENTS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  enhanceSearchSelect(agentSel);

  const queueSel = document.getElementById('bulkQueue');
  queueSel.value = 'Customer Support';

  setBulkAction('agent');

  if(bulkSelectedIds.size===0){ showToast('Select at least one ticket first'); return; }
  document.getElementById('modalBulk').classList.add('show');
}
function submitBulkReassign(){
  if(!canBulkManage()){ showToast('Only team leads and managers can perform bulk actions.'); return; }
  if(bulkSelectedIds.size===0){ showToast('Select at least one ticket first'); return; }

  let actionText = '';
  let changes = 0;

  if(bulkActionMode === 'agent'){
    const agentId = document.getElementById('bulkAgent').value;
    bulkSelectedIds.forEach(id=>{
      const t = TICKETS.find(x=>x.id===id);
      if(!t) return;
      const prevAgent = t.assignee;
      t.assignee = agentId;
      t.status = 'Assigned';
      t.activity.push(`Bulk reassign: ${agentName(prevAgent)} → ${agentName(agentId)} by manager`);
      changes++;
    });
    actionText = `reassigned to ${agentName(document.getElementById('bulkAgent').value)}`;
  } else if(bulkActionMode === 'close'){
    bulkSelectedIds.forEach(id=>{
      const t = TICKETS.find(x=>x.id===id);
      if(!t) return;
      const prevStatus = t.status;
      t.status = 'Closed';
      t.activity.push(`Bulk close: ${prevStatus} → Closed by manager`);
      changes++;
    });
    actionText = 'closed';
  } else {
    const queue = document.getElementById('bulkQueue').value;
    bulkSelectedIds.forEach(id=>{
      const t = TICKETS.find(x=>x.id===id);
      if(!t) return;
      const prevQueue = t.queue;
      t.queue = queue;
      t.activity.push(`Bulk transfer: ${prevQueue} → ${queue} by manager`);
      changes++;
    });
    actionText = `transferred to ${queue}`;
  }

  showToast(`${changes} ticket(s) ${actionText}`);
  bulkSelectedIds.clear();
  closeModal('modalBulk');
  renderManageAll();
  renderTicketList();
}

/* =========================================================
   QUEUES
========================================================= */
function renderQueues(){
  const queues = ['Customer Support','Collections','Grievance'];
  document.getElementById('queueCards').innerHTML = queues.map(q=>{
    const items = TICKETS.filter(t=>t.queue===q && t.status!=='Merged');
    const breached = items.filter(t=>t.slaMins<0).length;
    return `<div class="chart-card">
      <h3>${q}</h3>
      <div style="display:flex; gap:22px;">
        <div><div style="font-size:22px;font-weight:800;">${items.length}</div><div style="font-size:11.5px;color:var(--ink-faint);">Open tickets</div></div>
        <div><div style="font-size:22px;font-weight:800;color:${breached?'var(--red)':'var(--green)'};">${breached}</div><div style="font-size:11.5px;color:var(--ink-faint);">SLA breached</div></div>
      </div>
    </div>`;
  }).join('');
  const tbody = document.querySelector('#queuePerfTable tbody');
  tbody.innerHTML = queues.map(q=>{
    const items = TICKETS.filter(t=>t.queue===q && t.status!=='Merged');
    const breached = items.filter(t=>t.slaMins<0).length;
    const load = Math.min(100, Math.round(items.length/12*100));
    return `<tr><td><strong>${q}</strong></td><td>${items.length}</td><td style="color:${breached?'var(--red)':'var(--ink-soft)'};">${breached}</td><td>${18+Math.floor(Math.random()*10)}m</td>
      <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${load}%; background:${load>70?'var(--amber)':'var(--teal)'};"></div></div><span>${load}%</span></div></td></tr>`;
  }).join('');
}

/* =========================================================
   CUSTOMERS
========================================================= */
function renderCustomers(){
  document.getElementById('customerTableBody').innerHTML = CUSTOMERS.map(c=>{
    const tix = TICKETS.filter(t=>t.customer===c.name);
    const open = tix.filter(t=>!['Resolved','Closed','Merged'].includes(t.status)).length;
    const lastChan = tix.length ? tix[tix.length-1].channel : '—';
    const nps = 6 + Math.floor(Math.random()*5);
    return `<tr class="trow" onclick="switchView('tickets'); document.getElementById('fSearch').value='${c.name}'; renderTicketList();">
      <td><strong>${c.name}</strong></td><td style="color:var(--ink-faint);">${c.phone}</td>
      <td>${tix.length}</td><td>${open}</td>
      <td><span class="chan-badge ${chanClass(lastChan)}">${lastChan}</span></td>
      <td>${nps}/10</td></tr>`;
  }).join('');
}

/* =========================================================
   TICKET DETAIL
========================================================= */
function openTicket(id){
  selectedTicketId = id;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-detail').classList.add('active');
  const t = TICKETS.find(x=>x.id===id);
  const validChans = ['Chat','SMS','WhatsApp'];
  replyChannel = validChans.includes(t.channel) ? t.channel : 'Chat';
  renderDetailList();
  renderDetail();
}
function renderDetailList(){
  document.getElementById('detailList').innerHTML = TICKETS.filter(t=>t.status!=='Merged').map(t=>`
    <div class="dl-item ${t.id===selectedTicketId?'active':''}" onclick="openTicket('${t.id}')">
      <div class="dl-id">${t.id} · <span class="status-badge ${statusClass(t.status)}" style="font-size:9.5px;padding:1px 6px;">${t.status}</span></div>
      <div class="dl-subj">${t.subject}</div>
      <div class="dl-cust">${t.customer} · ${t.channel}</div>
    </div>`).join('');
}
function switchTab(tab){
  document.querySelectorAll('.conv-tab').forEach(x=>x.classList.remove('active'));
  document.querySelector(`.conv-tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('replyBox').style.display = tab==='thread' ? 'block':'none';
  renderConvBody(tab);
}
function renderDetail(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!t) return;
  document.getElementById('dTitle').textContent = t.subject;
  document.getElementById('dMeta').textContent = `${t.id} · ${t.customer} · ${t.phone} · opened via ${t.channel}`;
  const metaBox = document.getElementById('channelMetaValues');
  if(metaBox){
    metaBox.innerHTML = `<span>NBFC partner: ${t.nbfcPartner || '—'}</span><span>Source: ${t.source || '—'}</span>`;
  }
  renderConvBody('thread');
  document.querySelectorAll('.conv-tab').forEach(x=>x.classList.remove('active'));
  document.querySelector('.conv-tab[data-tab="thread"]').classList.add('active');
  document.getElementById('replyBox').style.display='block';
  document.getElementById('replyChannel').value = replyChannel;
  setReplyChannel(replyChannel);
  document.getElementById('noteToggle').checked = false;
  setReplyMode('reply');
  closeTemplates();
  renderProps(t);
}
function chanTagClass(chan){
  switch(chan){
    case 'Email': return 'chan-tag-email';
    case 'Chat': return 'chan-tag-chat';
    case 'WhatsApp': return 'chan-tag-whatsapp';
    case 'SMS': return 'chan-tag-sms';
    default: return 'chan-tag-internal';
  }
}
function chanOutClass(chan){
  switch(chan){
    case 'Email': return 'chan-out-email';
    case 'Chat': return 'chan-out-chat';
    case 'WhatsApp': return 'chan-out-whatsapp';
    case 'SMS': return 'chan-out-sms';
    default: return '';
  }
}

/* ---- Full date+time display for every message ---- */
function combineDateTime(createdAt, timeStr){
  const now = new Date();
  let base = createdAt ? new Date(createdAt) : new Date(now);
  let str = timeStr || '';
  if(/^Yesterday,/i.test(str)){ base = new Date(now); base.setDate(base.getDate()-1); str = str.replace(/^Yesterday,\s*/i,''); }
  else if(/^Today,/i.test(str)){ base = new Date(now); str = str.replace(/^Today,\s*/i,''); }
  const m = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if(!m) return base;
  let h = parseInt(m[1],10); const min = parseInt(m[2],10); const ap = m[3].toUpperCase();
  if(ap==='PM' && h!==12) h+=12;
  if(ap==='AM' && h===12) h=0;
  const d = new Date(base);
  d.setHours(h, min, 0, 0);
  return d;
}
function formatFullTimestamp(d){
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const h=d.getHours(); const displayH = h%12===0?12:h%12; const ap = h<12?'AM':'PM';
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${displayH}:${mm} ${ap}`;
}
function msgTimestamp(t, m){
  return formatFullTimestamp(m.ts ? new Date(m.ts) : combineDateTime(t.createdAt, m.time));
}
function statusTicks(status){
  if(status==='sending') return '<span class="tick tick-sending">Sending…</span>';
  if(status==='sent') return '<span class="tick tick-sent">✓</span>';
  if(status==='delivered') return '<span class="tick tick-delivered">✓✓</span>';
  if(status==='read') return '<span class="tick tick-read">✓✓</span>';
  return '';
}
function failureReason(chan){
  const reasons = {
    Email: 'Failed to send — recipient mailbox unreachable.',
    SMS: 'Failed to deliver — carrier rejected the number.',
    WhatsApp: 'Failed to deliver — recipient unreachable on WhatsApp.',
    Chat: 'Failed to send — connection lost.'
  };
  return reasons[chan] || 'Message failed to send.';
}

function addActivityEntry(ticket, text, meta = {}){
  ticket.activity = ticket.activity || [];
  ticket.activity.push(text);
  if(!meta || !meta.type) return;
  ticket.activityMeta = ticket.activityMeta || [];
  ticket.activityMeta.push({
    id: `${ticket.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    text,
    ...meta
  });
}

function undoTicketActivity(ticketId, entryId){
  const t = TICKETS.find(x=>x.id===ticketId);
  if(!t || !t.activityMeta) return;
  const entry = t.activityMeta.find(x=>x.id===entryId);
  if(!entry) return;

  if(entry.type === 'fieldChange'){
    const prev = entry.previousValue;
    t[entry.field] = prev;
    t.activity = t.activity.filter(a => a !== entry.text);
    t.activityMeta = t.activityMeta.filter(x => x.id !== entryId);
    showToast(`Reverted ${entry.field} to ${prev}`);
    renderDetail(); renderDetailList(); renderTicketList();
    return;
  }

  if(entry.type === 'merge'){
    unmergeTicket(entry.primaryId, entry.id);
    return;
  }
}

function unmergeTicket(primaryId, entryId){
  const primary = TICKETS.find(x=>x.id===primaryId);
  if(!primary || !primary.lastMergeSnapshot) return;

  const snapshot = primary.lastMergeSnapshot;
  primary.thread = JSON.parse(JSON.stringify(snapshot.beforeThread));
  primary.activity = Array.isArray(snapshot.beforeActivity) ? snapshot.beforeActivity.slice() : primary.activity;
  primary.activityMeta = Array.isArray(snapshot.beforeActivityMeta) ? snapshot.beforeActivityMeta.slice() : [];
  primary.status = snapshot.beforePrimaryStatus || primary.status;

  snapshot.mergedIds.forEach(id => {
    const merged = TICKETS.find(x=>x.id===id);
    if(!merged) return;
    merged.status = snapshot.beforeMergedStatus[id] || 'Open';
    merged.activity = Array.isArray(snapshot.beforeMergedActivity[id]) ? snapshot.beforeMergedActivity[id].slice() : merged.activity;
  });

  const highlightText = snapshot.mergeSummary || `Merged ${snapshot.mergedIds.join(', ')} into this ticket`;
  primary.activity.push(`Unmerged ${snapshot.mergedIds.join(', ')} from ${primary.id} — original ticket history restored`);
  primary.activityMeta = primary.activityMeta || [];
  primary.activityMeta.push({ id: `${primary.id}-unmerge-${Date.now()}`, text: `Unmerged ${snapshot.mergedIds.join(', ')} from ${primary.id} — original ticket history restored`, type: 'unmerge' });

  delete primary.lastMergeSnapshot;
  renderConvBody('activity');
  renderDetailList();
  renderTicketList();
  showToast(`Unmerged ${snapshot.mergedIds.length} ticket(s) from ${primary.id}`);
}

function renderConvBody(tab){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  const body = document.getElementById('convBody');
  if(tab==='activity'){
    const entries = (t.activityMeta && t.activityMeta.length) ? t.activityMeta : t.activity.map((text, index)=>({ id: `legacy-${index}`, text, type: 'generic' }));
    body.innerHTML = `<ul class="activity-log">${entries.map((entry, idx)=>{
      const normalized = normalizeActivityEntry(t, entry, idx);
      const undoMarkup = normalized.type === 'fieldChange' || normalized.type === 'merge'
        ? `<button class="tiny-btn" onclick="undoTicketActivity('${t.id}', '${normalized.id}')">${normalized.type === 'merge' ? 'Unmerge' : 'Undo'}</button>`
        : '';
      const extraMarkup = normalized.type === 'merge'
        ? `<button class="tiny-btn" onclick="unmergeTicket('${normalized.primaryId || t.id}', '${normalized.id}')">Check ticket</button>`
        : '';
      return `<li><span class="dot"></span><div style="flex:1;display:flex;flex-direction:column;gap:3px;"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;line-height:1.5;"><span>${normalized.text}</span>${undoMarkup || ''}${extraMarkup || ''}</div><div style="font-size:10px;color:var(--ink-faint);display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
        <span>${formatAuditStamp(normalized.ts)}</span>
        <span>Status: ${normalized.status || 'N/A'}</span>
        <span>By: ${normalized.actor || 'system'}</span>
        <span>Source: ${normalized.source || 'system'}</span>
      </div></div></li>`;
    }).join('')}</ul>`;
    return;
  }
  body.innerHTML = t.thread.map((m,idx)=>{
    if(m.call) return `<div class="call-log">📞 <b>${m.callMeta ? 'Outbound call' : 'Call recorded & summarized'}</b> — ${msgTimestamp(t,m)}
      ${m.callMeta ? `<div class="call-log-meta">Duration: ${m.callMeta.duration} · Agent: ${m.callMeta.agent} · Status: ${m.callMeta.status}</div>
      <div class="call-audio-player" title="Demo recording — playback illustrative only"><span class="cap-play">▶</span><span class="cap-bar"></span><span>${m.callMeta.duration}</span></div>` : ''}
      <br>"${m.text}"</div>`;
    const cls = m.dir==='out' ? `msg out ${chanOutClass(m.chan)}` : (m.dir==='note' ? 'msg note in' : 'msg in');
    const av = m.dir==='out' ? agentName(t.assignee).split(' ').map(w=>w[0]).join('') : t.customer.split(' ').map(w=>w[0]).join('');
    const isFailed = m.dir==='out' && m.status==='failed';
    const tsLabel = msgTimestamp(t, m);
    const ticks = m.dir==='out' ? statusTicks(m.status||'delivered') : '';
    const errorBlock = isFailed ? `<div class="msg-error">⚠ ${m.error||failureReason(m.chan)} <button class="retry-link" onclick="retryMessage('${t.id}', ${idx})">Retry</button></div>` : '';

    if(m.dir!=='note' && m.chan==='Email'){
      const isDraft = !!m.draft || m.status === 'draft';
      const draftBadge = isDraft ? `<div class="ec-head" style="color:var(--amber-dark);">✉ Draft email</div>` : `<div class="ec-head">✉ ${m.dir==='out'?'Email sent':'System email'}</div>`;
      const draftActions = isDraft
        ? `<div class="ec-actions">
            <button class="ec-link" onclick="viewEmail('${t.id}', ${idx})">👁 View</button>
            <button class="ec-link" onclick="openDraftForEdit('${t.id}', ${idx})">✎ Edit draft</button>
          </div>`
        : `<div class="ec-actions">
            <button class="ec-link" onclick="viewEmail('${t.id}', ${idx})">👁 View Email</button>
            <button class="ec-link" onclick="openEmailComposer()">↩ Reply</button>
          </div>`;
      const cardInner = `<div class="email-card" ${isDraft ? 'style="border-left-color:var(--amber-dark); background:var(--amber-tint);"' : ''}>
            ${draftBadge}
            <div class="ec-subject-lbl">Subject</div>
            <div class="ec-subject">${m.subject || t.subject}</div>
            ${isDraft ? '<div class="ec-subject-lbl" style="margin-bottom:7px; color:var(--amber-dark);">Not sent yet</div>' : ''}
            ${draftActions}
          </div>`;
      return `<div class="${cls}">
        <div class="mavatar">${av}</div>
        <div>
          ${isFailed ? `<div class="msg-row-fail"><span class="fail-badge" title="${m.error||failureReason(m.chan)}">!</span>${cardInner}</div>` : cardInner}
          <div class="meta-line"><span class="chan-tag ${chanTagClass(m.chan)}">${isDraft ? 'Draft' : m.chan}</span>${tsLabel}${ticks}</div>
          ${errorBlock}
        </div>
      </div>`;
    }
    const bubbleInner = `<div class="bubble">${m.text}</div>`;
    return `<div class="${cls}">
      <div class="mavatar">${av}</div>
      <div>
        ${isFailed ? `<div class="msg-row-fail"><span class="fail-badge" title="${m.error||failureReason(m.chan)}">!</span>${bubbleInner}</div>` : bubbleInner}
        <div class="meta-line"><span class="chan-tag ${chanTagClass(m.dir==='note'?'Internal':m.chan)}">${m.dir==='note'?'Internal note':m.chan}</span>${tsLabel}${ticks}</div>
        ${errorBlock}
      </div>
    </div>`;
  }).join('');
  body.scrollTop = body.scrollHeight;
}
function viewEmail(ticketId, msgIndex){
  const t = TICKETS.find(x=>x.id===ticketId);
  const m = t && t.thread[msgIndex];
  if(!t || !m) return;
  const dir = m.dir==='out' ? `From: ${m.from || EMAIL_FROM_OPTIONS[0].email} · To: ${m.to || t.email}` : `From: ${t.email} · To: Lenditt Support`;
  document.getElementById('viewEmailBody').innerHTML = `
    <div class="ve-row"><div class="ve-k">Direction</div><div class="ve-v">${m.dir==='out' ? 'Sent' : 'Received'}</div></div>
    <div class="ve-row"><div class="ve-k">Sender</div><div class="ve-v">${m.dir==='out' ? (m.from || EMAIL_FROM_OPTIONS[0].email) : t.email}</div></div>
    <div class="ve-row"><div class="ve-k">Recipient</div><div class="ve-v">${m.dir==='out' ? (m.to || t.email) : 'Lenditt Support'}</div></div>
    <div class="ve-row"><div class="ve-k">Subject</div><div class="ve-v">${m.subject || t.subject}</div></div>
    <div class="ve-row"><div class="ve-k">Timestamp</div><div class="ve-v">${msgTimestamp(t,m)}</div></div>
    <div class="ve-body-box">${m.bodyHtml || `<p>${m.text}</p>`}</div>
  `;
  document.getElementById('modalViewEmail').classList.add('show');
}
function retryMessage(ticketId, msgIndex){
  const t = TICKETS.find(x=>x.id===ticketId);
  const msg = t && t.thread[msgIndex];
  if(!msg) return;
  msg.status = 'sending';
  msg.error = null;
  renderConvBody('thread');
  simulateDelivery(t, msg);
}
function simulateDelivery(t, msg){
  setTimeout(()=>{
    const willFail = Math.random() < 0.12;
    if(willFail){
      msg.status = 'failed';
      msg.error = failureReason(msg.chan);
    } else {
      msg.status = 'delivered';
      if(msg.chan==='Chat' || msg.chan==='WhatsApp'){
        setTimeout(()=>{
          msg.status = 'read';
          if(selectedTicketId===t.id) renderConvBody('thread');
        }, 1800);
      }
    }
    if(selectedTicketId===t.id) renderConvBody('thread');
  }, 900);
}

/* =========================================================
   EMAIL COMPOSER
========================================================= */
function populateEmailFromOptions(){
  const sel = document.getElementById('ecFrom');
  sel.innerHTML = EMAIL_FROM_OPTIONS.map(o=>`<option value="${o.email}">${o.dept} — ${o.email}</option>`).join('');
  enhanceSearchSelect(sel);
}
function populateEmailToOptions(t){
  const sel = document.getElementById('ecTo');
  sel.innerHTML = `<option value="${t.email}">${t.customer} (primary) — ${t.email}</option>`;
  enhanceSearchSelect(sel);
}
function populateEmailTemplateOptions(){
  const sel = document.getElementById('ecTemplateSelect');
  const items = TEMPLATES.filter(tp=>tp.channel==='Email');
  sel.innerHTML = `<option value="">Select a template…</option>` + items.map(tp=>`<option value="${tp.id}">${tp.title}</option>`).join('');
  enhanceSearchSelect(sel);
}
function updateSignaturePreview(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  const dept = deptFromEmail(document.getElementById('ecFrom').value);
  document.getElementById('ecSignaturePreview').innerHTML = `<span class="ec-sig-label">Signature (auto-applied on send)</span>${(EMAIL_SIGNATURES[dept]||EMAIL_SIGNATURES['Customer Support']).replace(/\n/g,'<br>')}`;
}
let emailComposerDraftIndex = null;

function openDraftForEdit(ticketId, draftIndex){
  const t = TICKETS.find(x=>x.id===ticketId);
  if(!t || !t.thread[draftIndex]) return;
  emailComposerDraftIndex = draftIndex;
  openEmailComposer();
  const draft = t.thread[draftIndex];
  document.getElementById('ecDraftNotice').style.display = 'block';
  document.getElementById('ecFrom').value = draft.from || document.getElementById('ecFrom').value;
  document.getElementById('ecSubject').value = draft.subject || '';
  document.getElementById('ecBody').innerHTML = draft.bodyHtml || draft.text || '';
  updateSignaturePreview();
}

function openEmailComposer(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!t) return;
  populateEmailFromOptions();
  populateEmailToOptions(t);
  populateEmailTemplateOptions();
  const matchOpt = EMAIL_FROM_OPTIONS.find(o=>o.dept===t.queue);
  document.getElementById('ecFrom').value = matchOpt ? matchOpt.email : EMAIL_FROM_OPTIONS[0].email;
  document.getElementById('ecFrom').onchange = updateSignaturePreview;

  const draft = emailComposerDraftIndex !== null && t.thread[emailComposerDraftIndex] && t.thread[emailComposerDraftIndex].draft
    ? t.thread[emailComposerDraftIndex]
    : t.emailDraft;

  if(draft){
    document.getElementById('ecDraftNotice').style.display = 'block';
    document.getElementById('ecFrom').value = draft.from || document.getElementById('ecFrom').value;
    document.getElementById('ecSubject').value = draft.subject || '';
    document.getElementById('ecBody').innerHTML = draft.bodyHtml || draft.text || '';
  } else {
    document.getElementById('ecDraftNotice').style.display = 'none';
    document.getElementById('ecSubject').value = t.subject.startsWith('Re:') ? t.subject : `Re: ${t.subject}`;
    document.getElementById('ecBody').innerHTML = '';
  }
  updateSignaturePreview();
  document.getElementById('modalEmailCompose').classList.add('show');
}
function closeEmailComposer(){ emailComposerDraftIndex = null; document.getElementById('modalEmailCompose').classList.remove('show'); }
function discardEmail(){
  if(emailComposerDraftIndex !== null){
    const t = TICKETS.find(x=>x.id===selectedTicketId);
    if(t && t.thread[emailComposerDraftIndex] && t.thread[emailComposerDraftIndex].draft){
      t.thread.splice(emailComposerDraftIndex, 1);
      t.emailDraft = null;
      renderConvBody('thread');
    }
  }
  document.getElementById('ecSubject').value = '';
  document.getElementById('ecBody').innerHTML = '';
  closeEmailComposer();
}
function rteExec(cmd, val){
  document.getElementById('ecBody').focus();
  document.execCommand(cmd, false, val || null);
}
function useEmailTemplate(){
  const id = document.getElementById('ecTemplateSelect').value;
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!id || !t) return;
  const tp = TEMPLATES.find(x=>x.id===id);
  if(!tp) return;
  document.getElementById('ecBody').innerHTML = fillTemplate(tp.body, t).replace(/\n/g,'<br>');
}
function openAddTemplate(){
  document.getElementById('newTplTitle').value = '';
  document.getElementById('newTplBody').value = '';
  document.getElementById('modalAddTemplate').classList.add('show');
}
function saveNewEmailTemplate(){
  const title = document.getElementById('newTplTitle').value.trim();
  const body = document.getElementById('newTplBody').value.trim();
  if(!title || !body){ showToast('Please add a template name and body'); return; }
  const id = 'tplE' + Date.now();
  TEMPLATES.push({id, channel:'Email', title, body});
  populateEmailTemplateOptions();
  document.getElementById('ecTemplateSelect').value = id;
  closeModal('modalAddTemplate');
  showToast('Template saved');
}
function saveEmailDraft(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!t) return;
  const from = document.getElementById('ecFrom').value;
  const to = document.getElementById('ecTo').value;
  const subject = document.getElementById('ecSubject').value.trim();
  const bodyHtml = document.getElementById('ecBody').innerHTML.trim();
  if(!subject || !bodyHtml || bodyHtml==='<br>'){ showToast('Add a subject and message before saving the draft'); return; }

  const draft = {
    dir:'out', chan:'Email', draft:true, from, to, subject, bodyHtml,
    text: subject,
    time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    ts: new Date(),
    status:'draft',
    isDraft: true
  };

  if(emailComposerDraftIndex !== null && t.thread[emailComposerDraftIndex] && t.thread[emailComposerDraftIndex].draft){
    t.thread[emailComposerDraftIndex] = { ...t.thread[emailComposerDraftIndex], ...draft };
  } else {
    t.thread.push(draft);
  }

  t.emailDraft = { from, to, subject, bodyHtml };
  t.updated = 'just now';
  closeEmailComposer();
  renderConvBody('thread');
  renderDetailList();
  renderProps(t);
  showToast('Email draft saved');
}
function sendEmailFromComposer(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!t) return;
  const from = document.getElementById('ecFrom').value;
  const to = document.getElementById('ecTo').value;
  const subject = document.getElementById('ecSubject').value.trim();
  const bodyHtml = document.getElementById('ecBody').innerHTML.trim();
  if(!subject || !bodyHtml || bodyHtml==='<br>'){ showToast('Add a subject and message before sending'); return; }
  const sigHtml = signatureForTicket(t).replace(/\n/g,'<br>');
  const fullBodyHtml = `${bodyHtml}<br><br>${sigHtml}`;
  const now = new Date();
  const sentMsg = {
    dir:'out', chan:'Email', subject, from, to, bodyHtml: fullBodyHtml,
    text: subject, time: now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), ts: now, status:'sending'
  };

  if(emailComposerDraftIndex !== null && t.thread[emailComposerDraftIndex] && t.thread[emailComposerDraftIndex].draft){
    const target = t.thread[emailComposerDraftIndex];
    Object.assign(target, sentMsg, { draft:false, status:'sending', isDraft:false, time: sentMsg.time, ts: now, bodyHtml: fullBodyHtml, text: subject });
    t.emailDraft = null;
    t.activity.push(`Draft email sent to ${to}`);
  } else {
    t.thread.push(sentMsg);
    t.activity.push(`Email sent to ${to}`);
  }

  if(t.status==='New'||t.status==='Open') t.status='In Progress';
  t.updated = 'just now';
  simulateDelivery(t, emailComposerDraftIndex !== null && t.thread[emailComposerDraftIndex] && !t.thread[emailComposerDraftIndex].draft ? t.thread[emailComposerDraftIndex] : sentMsg);
  closeEmailComposer();
  renderConvBody('thread');
  renderDetailList();
  renderProps(t);
  showToast(`Email sent via ${deptFromEmail(from)}`);
}

/* =========================================================
   CLICK-TO-CALL
========================================================= */
let callTimer = null;
let callSeconds = 0;
let callConnected = false;
function openCallModal(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!t) return;
  callSeconds = 0;
  callConnected = false;
  document.getElementById('modalCall').classList.add('show');
  const initials = t.customer.split(' ').map(w=>w[0]).join('');
  document.getElementById('callModalBody').innerHTML = `<div class="call-body">
    <div class="call-avatar">${initials}</div>
    <div class="call-name">${t.customer}</div>
    <div class="call-status">📞 Dialing ${t.phone}…</div>
    <div class="call-actions"><button class="btn btn-danger btn-sm" onclick="cancelCallModal()">Cancel</button></div>
  </div>`;
  setTimeout(()=>{
    if(!document.getElementById('modalCall').classList.contains('show')) return;
    callConnected = true;
    document.getElementById('callModalBody').innerHTML = `<div class="call-body">
      <div class="call-avatar call-live">${initials}</div>
      <div class="call-name">${t.customer}</div>
      <div class="call-status">Connected</div>
      <div class="call-duration" id="callDuration">00:00</div>
      <div class="call-actions"><button class="btn btn-danger" onclick="endCall()">⏹ End call</button></div>
    </div>`;
    callTimer = setInterval(()=>{
      callSeconds++;
      const el = document.getElementById('callDuration');
      if(el){
        const mm = String(Math.floor(callSeconds/60)).padStart(2,'0');
        const ss = String(callSeconds%60).padStart(2,'0');
        el.textContent = `${mm}:${ss}`;
      }
    }, 1000);
  }, 1400);
}
function cancelCallModal(){
  clearInterval(callTimer);
  document.getElementById('modalCall').classList.remove('show');
}
function endCall(){
  clearInterval(callTimer);
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  document.getElementById('modalCall').classList.remove('show');
  if(!t || !callConnected) return;
  const dur = callSeconds;
  const durLabel = `${String(Math.floor(dur/60)).padStart(2,'0')}:${String(dur%60).padStart(2,'0')}`;
  const now = new Date();
  const agent = agentName(t.assignee);
  t.thread.push({
    dir:'out', call:true, chan:'Call', ts: now, time: now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    text: `Outbound call with ${t.customer} — duration ${durLabel}. Status: Completed. Agent: ${agent}.`,
    callMeta: { duration: durLabel, agent, status: 'Completed' }
  });
  t.activity.push(`Outbound call completed (${durLabel}) — logged by ${agent}`);
  t.updated = 'just now';
  renderConvBody('thread');
  renderDetailList();
  renderProps(t);
  showToast(`Call ended — ${durLabel} logged to thread`);
}
function shareFeedbackLink(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!t){ return; }
  if(currentRole !== 'manager'){
    showToast('Only managers can share the customer feedback link.');
    return;
  }

  const channel = ['WhatsApp','SMS','Chat'].includes(replyChannel) ? replyChannel : (t.channel || 'Chat');
  const ratingUrl = `https://feedback.lenditt.com/rate?ticket=${encodeURIComponent(t.id)}&customer=${encodeURIComponent(t.customer)}`;
  const message = `Hi ${t.customer}, we value your experience. Please rate your support from 1 to 5: ${ratingUrl}`;

  t.thread.push({
    dir: 'out',
    text: message,
    chan: channel,
    time: 'now',
    status: 'sent'
  });
  t.activity.push(`Manager shared feedback survey link (${channel})`);
  t.updated = 'just now';

  renderConvBody('thread');
  renderDetailList();
  renderProps(t);
  showToast('Customer feedback link sent to thread');
}

const DEPARTMENT_TAXONOMY = {
  'Customer Support': {
    categories: ['KYC'],
    subcategories: {
      'KYC': ['Document Re-upload', 'Aadhaar Update', 'PAN Update']
    }
  },
  'Collections': {
    categories: ['Repayment', 'ECS Charge'],
    subcategories: {
      'Repayment': ['Auto Debit related', 'Manual Payment Updation', 'Closure on time', 'Loan Foreclose', 'Extension', 'Waiver Link', 'Settlement'],
      'ECS Charge': ['ECS Related', 'ECS-Payment not updated', 'ECS-WaiverNOC Request', 'Foreclosure']
    }
  },
  'Grievance': {
    categories: ['Service complaint', 'Misleading collection call', 'Refund request', 'Resolution follow-up', 'Unfair practice', 'Other'],
    subcategories: {
      'Service complaint': ['Wrong promise', 'Poor communication', 'Processing issue', 'Other'],
      'Misleading collection call': ['Abusive language', 'Wrong amount quoted', 'Unscheduled call', 'Other'],
      'Refund request': ['Duplicate fee refund', 'Excess charge refund', 'Processing fee refund', 'Other'],
      'Resolution follow-up': ['Pending action', 'Status update request', 'Escalation review', 'Other'],
      'Unfair practice': ['Harassment', 'Unclear policy', 'Misrepresentation', 'Other'],
      'Other': ['Legal follow-up', 'Internal escalation', 'Other']
    }
  }
};

function getQueueCategoryOptions(queue, currentCategory){
  const options = DEPARTMENT_TAXONOMY[queue]?.categories || ['General query', 'Other'];
  return options.includes(currentCategory) ? options : options;
}

function getDepartmentCategoryOptions(department){
  return DEPARTMENT_TAXONOMY[department]?.categories || ['General query', 'Other'];
}

function getDepartmentSubCategoryOptions(department, category){
  const sub = DEPARTMENT_TAXONOMY[department]?.subcategories?.[category] || ['Other'];
  return sub;
}

function applyQueueCategoryDefault(queue, currentCategory){
  const options = DEPARTMENT_TAXONOMY[queue]?.categories || ['General query'];
  return options.includes(currentCategory) ? currentCategory : options[0];
}

function applySubCategoryDefault(department, category, currentSubCategory){
  const options = getDepartmentSubCategoryOptions(department, category);
  return options.includes(currentSubCategory) ? currentSubCategory : options[0];
}

function syncCreateTicketCategoryOptions(){
  const queueSel = document.getElementById('ctQueue');
  const categorySel = document.getElementById('ctCategory');
  if(!queueSel || !categorySel) return;
const options = DEPARTMENT_TAXONOMY[queueSel.value]?.categories || ['General query', 'Other'];
  const selected = options.includes(categorySel.value) ? categorySel.value : options[0];
  categorySel.innerHTML = options.map(opt => `<option value="${opt}" ${opt===selected?'selected':''}>${opt}</option>`).join('');
  if(categorySel.dataset.sselDone === '1'){ refreshSearchSelect(categorySel); }
}

function formatTicketCreatedStamp(ticket){
  if(!ticket || !ticket.createdAt) return '—';
  const d = new Date(ticket.createdAt);
  return `${d.toLocaleDateString([], {day:'2-digit', month:'short', year:'numeric'})} · ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
}
function formatAuditStamp(ts){
  if(!ts) return '—';
  const d = new Date(ts);
  if(Number.isNaN(d.getTime())) return ts;
  return `${d.toLocaleDateString([], {day:'2-digit', month:'short', year:'numeric'})} · ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
}
function normalizeActivityEntry(ticket, entry, index){
  if(typeof entry === 'string'){
    return {
      id: `legacy-${ticket.id}-${index}`,
      text: entry,
      ts: ticket.updatedAt || ticket.createdAt || new Date().toISOString(),
      status: ticket.status || 'N/A',
      actor: 'system',
      source: 'system',
      type: 'generic'
    };
  }
  return {
    id: entry.id || `audit-${ticket.id}-${index}`,
    text: entry.text || entry.action || '',
    ts: entry.ts || entry.timestamp || new Date().toISOString(),
    status: entry.status || ticket.status || 'N/A',
    actor: entry.actor || entry.by || 'system',
    source: entry.source || 'system',
    type: entry.type || 'generic',
    mode: entry.mode || 'manual',
    previousValue: entry.previousValue,
    field: entry.field,
    primaryId: entry.primaryId,
    mergedIds: entry.mergedIds || []
  };
}

function getRelatedTicketsForCustomer(ticket){
  if(!ticket) return [];
  return TICKETS.filter(item => item.customer === ticket.customer && item.id !== ticket.id && item.status !== 'Closed' && item.status !== 'Merged')
    .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function renderProps(t){
  const managerOnlyFeedback = currentRole === 'manager' ? `<button class="btn btn-ghost btn-sm" onclick="shareFeedbackLink()">⭐ Share feedback link</button>` : '';
  const department = t.department || t.queue || 'Customer Support';
  const categoryOptions = getDepartmentCategoryOptions(department);
  const selectedCategory = categoryOptions.includes(t.category) ? t.category : categoryOptions[0];
  const subCategoryOptions = getDepartmentSubCategoryOptions(department, selectedCategory);
  const selectedSubCategory = subCategoryOptions.includes(t.subCategory) ? t.subCategory : subCategoryOptions[0];
  const associatedTickets = getRelatedTicketsForCustomer(t);

  const assocHtml = associatedTickets.length
    ? `<table class="assoc-table">
        <thead>
          <tr>
            <th>Ticket id</th>
            <th>Loan stage</th>
            <th>Channel</th>
            <th>Created</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${associatedTickets.map(item => `
          <tr>
            <td><span class="ticket-pill">${item.id}</span></td>
            <td>${item.loanStage || '—'}</td>
            <td>${item.channel || '—'}</td>
            <td>${formatTicketCreatedStamp(item)}</td>
            <td><span class="status-pill">${item.status || 'Open'}</span></td>
          </tr>`).join('')}</tbody>
      </table>`
    : '<div style="font-size:11.5px;color:var(--ink-faint);padding-top:2px;">No related tickets for this customer.</div>';

  document.getElementById('propsPanel').innerHTML = `
    <h4>Ticket properties</h4>
    <div class="prop-row"><label>Status</label>
      <select onchange="updateTicketField('status', this.value)">${STATUSES.map(s=>`<option ${s===t.status?'selected':''}>${s}</option>`).join('')}</select>
    </div>
    <div class="prop-row"><label>Priority</label>
      <select onchange="updateTicketField('priority', this.value)">${['Low','Medium','High'].map(p=>`<option ${p===t.priority?'selected':''}>${p}</option>`).join('')}</select>
    </div>
    <div class="prop-row"><label>Department</label>
      <select onchange="updateTicketField('department', this.value); updateTicketField('queue', this.value); renderProps(TICKETS.find(x=>x.id===selectedTicketId));">${['Customer Support','Collections','Grievance'].map(d=>`<option ${d===department?'selected':''}>${d}</option>`).join('')}</select>
    </div>
    <div class="prop-row"><label>Category</label>
      <select onchange="updateTicketField('category', this.value); renderProps(TICKETS.find(x=>x.id===selectedTicketId));">${categoryOptions.map(c=>`<option ${c===selectedCategory?'selected':''}>${c}</option>`).join('')}</select>
    </div>
    <div class="prop-row"><label>Sub category</label>
      <select onchange="updateTicketField('subCategory', this.value); renderProps(TICKETS.find(x=>x.id===selectedTicketId));">${subCategoryOptions.map(c=>`<option ${c===selectedSubCategory?'selected':''}>${c}</option>`).join('')}</select>
    </div>

    <h4>SLA</h4>
    <div class="sla-box">
      <div>${t.priority} priority target</div>
      <div class="big ${t.slaMins<0?'sla-breach':(t.slaMins<60?'sla-warn':'sla-ok')}">${t.slaMins<0? 'Breached by '+Math.abs(t.slaMins)+'m' : t.slaMins+'m remaining'}</div>
    </div>

    <h4>Customer</h4>
    <div class="customer-card">
      <div class="cname">${t.customer}</div>
      <div class="crow"><span>Phone</span><span>${t.phone}</span></div>
      <div class="crow"><span>Loan ID</span><span>${t.loanId || '—'}</span></div>
      <div class="crow"><span>Loan stage</span><span>${t.loanStage || 'Not captured'}</span></div>
      <div class="crow"><span>Department</span><span>${department}</span></div>
      <div class="crow"><span>Total tickets</span><span>${TICKETS.filter(x=>x.customer===t.customer).length}</span></div>
      <div class="crow"><span>Preferred channel</span><span>${t.channel}</span></div>
    </div>

    <div class="associated-ticket-box">
      <div class="assoc-head">Other open tickets of this customer</div>
      ${assocHtml}
    </div>

    <h4>Quick actions</h4>
    <div class="action-grid">
      <button class="btn btn-ghost btn-sm" onclick="openMerge()">⇄ Merge</button>
      <button class="btn btn-ghost btn-sm" onclick="openEscalate()">▲ Escalate</button>
      <button class="btn btn-ghost btn-sm" onclick="openReassign()">↻ Reassign</button>
      <button class="btn btn-ghost btn-sm" onclick="closeTicket()">⏹ Close</button>
      ${managerOnlyFeedback}
    </div>
  `;
  enhanceAllSelects(document.getElementById('propsPanel'));
}
function updateTicketField(field, value){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!t) return;
  const old = t[field];
  t[field] = value;

  if(field === 'queue'){
    t.department = value;
    t.category = applyQueueCategoryDefault(value, t.category);
  }
  if(field === 'department'){
    t.queue = value;
    t.department = value;
    t.category = applyQueueCategoryDefault(value, t.category);
    t.subCategory = applySubCategoryDefault(value, t.category, t.subCategory);
  }
  if(field === 'category'){
    t.category = value;
    t.subCategory = applySubCategoryDefault(t.department || t.queue || 'Customer Support', value, t.subCategory);
  }
  if(field === 'subCategory'){
    t.subCategory = value;
  }

  const msg = `${field[0].toUpperCase()+field.slice(1)} changed from ${old || '—'} to ${value}`;
  addActivityEntry(t, msg, {
    type: 'fieldChange',
    field,
    previousValue: old,
    actor: currentRole === 'manager' ? 'Manager' : 'Agent',
    source: 'manual',
    status: t.status,
    mode: 'manual'
  });
  t.updated = 'just now';
  showToast(`Ticket ${field} updated to ${value}`);
  renderDetailList();
  renderProps(t);
}
function setReplyMode(mode){
  replyMode = mode;
  const label = document.getElementById('noteToggleLabel');
  const toggle = document.getElementById('noteToggle');
  toggle.checked = mode==='note';
  label.classList.toggle('on', mode==='note');
  updateReplyPlaceholder();
}
function setReplyChannel(chan){
  replyChannel = chan;
  const dot = document.getElementById('replyChanDot');
  dot.className = 'chan-dot ' + {Email:'chan-dot-email', Chat:'chan-dot-chat', WhatsApp:'chan-dot-whatsapp', SMS:'chan-dot-sms'}[chan];
  updateReplyPlaceholder();
  if(document.getElementById('templatePanel').classList.contains('show')) renderTemplateList();
}
function updateReplyPlaceholder(){
  document.getElementById('replyText').placeholder = replyMode==='reply'
    ? `Type a reply — it will send via ${replyChannel}…`
    : "Add an internal note — not visible to the customer…";
}

/* ---- Pre-approved templates ---- */
function toggleTemplates(e){
  if(e) e.stopPropagation();
  const panel = document.getElementById('templatePanel');
  const btn = document.getElementById('tplBtn');
  const show = !panel.classList.contains('show');
  panel.classList.toggle('show', show);
  btn.classList.toggle('open', show);
  if(show){
    document.getElementById('tplSearch').value = '';
    renderTemplateList();
    setTimeout(()=>document.getElementById('tplSearch').focus(), 10);
  }
}
function closeTemplates(){
  document.getElementById('templatePanel').classList.remove('show');
  document.getElementById('tplBtn').classList.remove('open');
}
document.addEventListener('click', (e)=>{
  const panel = document.getElementById('templatePanel');
  if(panel && panel.classList.contains('show') && !panel.contains(e.target) && e.target.id!=='tplBtn'){
    closeTemplates();
  }
});
function highlightMatch(text, q){
  if(!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if(i===-1) return text;
  return text.slice(0,i) + '<mark>' + text.slice(i,i+q.length) + '</mark>' + text.slice(i+q.length);
}

/* =========================================================
   UNIVERSAL SEARCHABLE DROPDOWN
   Wraps every native <select> with a searchable panel matching
   the Templates search UI, while the original <select> stays in
   the DOM (hidden) as the source of truth — existing value/
   onchange-based code keeps working unchanged.
========================================================= */
let __sselSeq = 0;
function enhanceSearchSelect(select){
  if(!select || select.tagName !== 'SELECT') return;
  if(select.dataset.sselDone==='1'){ refreshSearchSelect(select); return; }
  select.dataset.sselDone = '1';

  const wrap = document.createElement('div');
  wrap.className = 'ssel';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ssel-btn';
  btn.innerHTML = `<span class="ssel-btn-label"></span><span class="ssel-caret">▾</span>`;

  const panel = document.createElement('div');
  panel.className = 'ssel-panel';
  const pid = 'ssel_panel_' + (++__sselSeq);
  panel.id = pid;
  panel.innerHTML = `<input type="text" class="ssel-search" placeholder="Search…"><div class="ssel-list"></div>`;

  wrap.appendChild(btn);
  wrap.appendChild(panel);
  select.classList.add('ssel-native-hidden');
  select.parentNode.insertBefore(wrap, select.nextSibling);

  btn.addEventListener('click', (e)=>{
    e.stopPropagation();
    const isOpen = panel.classList.contains('show');
    document.querySelectorAll('.ssel-panel.show').forEach(p=>{ p.classList.remove('show'); const b=p.previousElementSibling; if(b) b.classList.remove('ssel-open'); });
    if(!isOpen){
      panel.classList.add('show');
      btn.classList.add('ssel-open');
      const search = panel.querySelector('.ssel-search');
      search.value = '';
      renderSselList(select, panel, '');
      setTimeout(()=>search.focus(), 10);
    }
  });
  panel.querySelector('.ssel-search').addEventListener('input', (e)=>renderSselList(select, panel, e.target.value));
  panel.addEventListener('click', e=>e.stopPropagation());

  updateSselLabel(select);
  renderSselList(select, panel, '');
}
function updateSselLabel(select){
  const wrap = select.nextElementSibling;
  if(!wrap || !wrap.classList.contains('ssel')) return;
  const label = wrap.querySelector('.ssel-btn-label');
  const opt = select.options[select.selectedIndex];
  label.textContent = opt ? opt.textContent : '';
  label.classList.toggle('ssel-placeholder', !opt || opt.value==='');
}
function renderSselList(select, panel, query){
  const list = panel.querySelector('.ssel-list');
  const q = (query||'').trim().toLowerCase();
  const opts = Array.from(select.options);
  const filtered = opts.filter(o=>!q || o.textContent.toLowerCase().includes(q));
  if(filtered.length===0){
    list.innerHTML = `<div class="ssel-empty">No matches for "${query}"</div>`;
    return;
  }
  list.innerHTML = filtered.map(o=>{
    const sel = o.value===select.value ? ' selected' : '';
    return `<div class="ssel-item${sel}" data-val="${String(o.value).replace(/"/g,'&quot;')}">${highlightMatch(o.textContent, query)}</div>`;
  }).join('');
  list.querySelectorAll('.ssel-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      select.value = item.dataset.val;
      select.dispatchEvent(new Event('change', {bubbles:true}));
      updateSselLabel(select);
      panel.classList.remove('show');
      const btn = panel.previousElementSibling;
      if(btn) btn.classList.remove('ssel-open');
    });
  });
}
function refreshSearchSelect(select){
  const wrap = select.nextElementSibling;
  if(!wrap || !wrap.classList.contains('ssel')) return;
  updateSselLabel(select);
  const panel = wrap.querySelector('.ssel-panel');
  const q = panel.querySelector('.ssel-search').value || '';
  renderSselList(select, panel, q);
}
function enhanceAllSelects(root){
  (root||document).querySelectorAll('select').forEach(enhanceSearchSelect);
}
document.addEventListener('click', ()=>{
  document.querySelectorAll('.ssel-panel.show').forEach(p=>{ p.classList.remove('show'); const b=p.previousElementSibling; if(b) b.classList.remove('ssel-open'); });
});

function renderTemplateList(){
  const q = document.getElementById('tplSearch').value.trim().toLowerCase();
  let items = TEMPLATES.filter(tp=>tp.channel===replyChannel);
  if(q) items = items.filter(tp=>tp.title.toLowerCase().includes(q) || tp.body.toLowerCase().includes(q));
  const list = document.getElementById('tplList');
  if(items.length===0){
    list.innerHTML = `<div class="tpl-empty">No ${replyChannel} templates match "${q}".</div>`;
    return;
  }
  list.innerHTML = items.map(tp=>`
    <div class="tpl-item" onclick="useTemplate('${tp.id}')">
      <div class="tpl-title">${highlightMatch(tp.title, q)}</div>
      <div class="tpl-preview">${highlightMatch(tp.body.replace(/\n/g,' '), q)}</div>
    </div>`).join('');
}
function useTemplate(id){
  const tp = TEMPLATES.find(x=>x.id===id);
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  if(!tp || !t) return;
  document.getElementById('replyText').value = fillTemplate(tp.body, t);
  closeTemplates();
  document.getElementById('replyText').focus();
}

function sendReply(){
  const text = document.getElementById('replyText').value.trim();
  if(!text) return;
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  if(replyMode==='note'){
    t.thread.push({dir:'note', text, chan:'Internal', time:timeLabel, ts: now});
    t.activity.push('Internal note added');
  } else {
    const msg = {dir:'out', text, chan:replyChannel, time:timeLabel, ts: now, status:'sending', subject: replyChannel==='Email' ? t.subject : undefined};
    t.thread.push(msg);
    t.activity.push(`Agent replied via ${replyChannel}`);
    if(t.status==='New'||t.status==='Open') t.status='In Progress';
    simulateDelivery(t, msg);
  }
  document.getElementById('replyText').value='';
  t.updated = 'just now';
  renderConvBody('thread');
  renderDetailList();
  renderProps(t);
  showToast(replyMode==='note' ? 'Internal note saved' : `Reply sent via ${replyChannel}`);
}
function resolveTicket(){ updateTicketField('status','Resolved'); }
function closeTicket(){ updateTicketField('status','Closed'); }

/* =========================================================
   CREATE TICKET
========================================================= */
function openCreateTicket(){
  document.getElementById('custList').innerHTML = CUSTOMERS.map(c=>`<option value="${c.name}">`).join('');
  const assigneeSel = document.getElementById('ctAssignee');
  assigneeSel.innerHTML = `<option value="">Auto-assign (skill-based)</option>` + AGENTS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  enhanceSearchSelect(assigneeSel);
  const queueSel = document.getElementById('ctQueue');
  const categorySel = document.getElementById('ctCategory');
  queueSel.value = 'Customer Support';
  syncCreateTicketCategoryOptions();
  queueSel.onchange = syncCreateTicketCategoryOptions;
  ['ctCustomer','ctSubject','ctDesc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('modalCreate').classList.add('show');
}
function submitCreateTicket(){
  const custInput = document.getElementById('ctCustomer').value.trim();
  const subject = document.getElementById('ctSubject').value.trim() || 'New customer request';
  if(!custInput){ showToast('Enter a customer name or phone to continue'); return; }
  const match = CUSTOMERS.find(c=>c.name.toLowerCase()===custInput.toLowerCase());
  const priority = document.getElementById('ctPriority').value;
  const assigneeVal = document.getElementById('ctAssignee').value || AGENTS[Math.floor(Math.random()*AGENTS.length)].id;
  const newId = 'TCK-' + (10239 + TICKETS.length);
  const slaTarget = priority==='High' ? 240 : priority==='Medium' ? 720 : 1440;
  const t = {
    id:newId, subject, customer: match? match.name : custInput, phone: match? match.phone : '—',
    channel: document.getElementById('ctChannel').value, priority, status:'New',
    queue: document.getElementById('ctQueue').value, assignee: assigneeVal, updated:'just now', slaMins:slaTarget, createdAt: new Date(),
    category: document.getElementById('ctCategory').value,
    thread:[{dir:'in', text: document.getElementById('ctDesc').value || '(No description provided)', chan: document.getElementById('ctChannel').value, time:'now'}],
    activity:['Ticket manually created by agent', `Assigned to ${agentName(assigneeVal)}`]
  };
  TICKETS.unshift(t);
  closeModal('modalCreate');
  showToast(`Ticket ${newId} created and assigned to ${agentName(assigneeVal)}`);
  renderTicketList();
  if(currentRole==='manager') renderManageAll();
}

/* =========================================================
   MERGE
========================================================= */
let mergePrimaryId = null;
let mergeIncludeIds = new Set();

/* Channel icon map for merge modal badges */
const MERGE_CHAN_ICON = {
  Email:     { icon: '✉', cls: 'merge-chan-email' },
  Chat:      { icon: '💬', cls: 'merge-chan-chat' },
  WhatsApp:  { icon: '📲', cls: 'merge-chan-whatsapp' },
  SMS:       { icon: '📱', cls: 'merge-chan-sms' },
  Call:      { icon: '📞', cls: 'merge-chan-call' },
};
function mergeChanBadge(chan){
  const c = MERGE_CHAN_ICON[chan] || { icon: '✉', cls: 'merge-chan-email' };
  return `<span class="merge-chan-badge ${c.cls}">${c.icon} ${chan}</span>`;
}
function mergeStatusBadge(status){
  const map = {
    Open:      'merge-status-open',
    'In Progress': 'merge-status-inprogress',
    Escalated: 'merge-status-escalated',
    Resolved:  'merge-status-resolved',
    Reopened:  'merge-status-reopened',
  };
  return `<span class="merge-status-pill ${map[status]||'merge-status-open'}">${status}</span>`;
}
function mergeDeptBadge(dept){
  return `<span class="merge-dept-pill">${dept}</span>`;
}

function openMerge(){
  const current = TICKETS.find(x=>x.id===selectedTicketId);
  if(!current) return;
  document.getElementById('mergeSearch').value = '';
  /* Pre-select current ticket as primary */
  mergePrimaryId = current.id;
  mergeIncludeIds = new Set();
  /* Update modal subtitle with customer name */
  const subtitle = document.getElementById('mergeCustomerSubtitle');
  if(subtitle) subtitle.textContent = `Customer: ${current.customer} · Loan: ${current.loanId || '—'}`;
  renderMergeResults();
  document.getElementById('modalMerge').classList.add('show');
}

function renderMergeResults(){
  const q = document.getElementById('mergeSearch').value.trim().toLowerCase();
  const current = TICKETS.find(x=>x.id===selectedTicketId);
  if(!current) return;

  /* All non-merged tickets for this customer, including current (for primary row) */
  let allSameCustomer = TICKETS.filter(x =>
    x.customer === current.customer &&
    x.status !== 'Merged'
  );

  /* Apply search filter */
  if(q){
    allSameCustomer = allSameCustomer.filter(x =>
      x.id.toLowerCase().includes(q) ||
      (x.subject||'').toLowerCase().includes(q) ||
      (x.department||x.queue||'').toLowerCase().includes(q) ||
      (x.channel||'').toLowerCase().includes(q) ||
      (x.loanId||'').toLowerCase().includes(q) ||
      (x.status||'').toLowerCase().includes(q)
    );
  }

  if(!allSameCustomer.length){
    document.getElementById('mergeResults').innerHTML =
      '<div class="merge-empty">No tickets found matching your search.</div>';
    document.getElementById('mergeConfirmBtn').disabled = true;
    return;
  }

  /* Group by department */
  const grouped = allSameCustomer.reduce((acc, ticket) => {
    const dept = ticket.department || ticket.queue || 'Customer Support';
    acc[dept] = acc[dept] || [];
    acc[dept].push(ticket);
    return acc;
  }, {});

  /* Summary counters for the header bar */
  const totalCount  = allSameCustomer.length;
  const deptCount   = Object.keys(grouped).length;
  const chanCount   = new Set(allSameCustomer.map(x=>x.channel)).size;
  const checkedCount = mergeIncludeIds.size;

  /* Build group HTML */
  const groupsHtml = Object.entries(grouped).map(([dept, tickets]) => `
    <div class="merge-dept-group">
      <div class="merge-dept-group-head">
        <span class="merge-dept-group-label">${dept}</span>
        <span class="merge-dept-count">${tickets.length} ticket${tickets.length!==1?'s':''}</span>
      </div>
      ${tickets.map(ticket => {
        const isCurrent  = ticket.id === current.id;
        const isPrimary  = ticket.id === mergePrimaryId;
        const isIncluded = mergeIncludeIds.has(ticket.id);
        const rowClass   = isCurrent ? 'merge-ticket-row merge-row-current' :
                           isPrimary  ? 'merge-ticket-row merge-row-primary'  :
                           isIncluded ? 'merge-ticket-row merge-row-selected'  :
                                        'merge-ticket-row';
        return `
          <div class="${rowClass}" id="mrow-${ticket.id}">
            <div class="merge-row-left">
              <!-- Checkbox (disabled & checked for current ticket) -->
              <label class="merge-cb-wrap" title="${isCurrent ? 'Current ticket — always included' : 'Include in merge'}">
                <input type="checkbox"
                  class="merge-cb"
                  data-id="${ticket.id}"
                  ${isIncluded || isCurrent ? 'checked' : ''}
                  ${isCurrent ? 'disabled' : ''}
                  onchange="toggleMergeCandidate('${ticket.id}', this.checked)">
              </label>
            </div>

            <div class="merge-row-body">
              <div class="merge-row-top">
                <span class="merge-ticket-id">${ticket.id}</span>
                ${isCurrent ? '<span class="merge-current-tag">Current ticket</span>' : ''}
                ${isPrimary && !isCurrent ? '<span class="merge-primary-tag">Primary</span>' : ''}
                ${mergeChanBadge(ticket.channel)}
                ${mergeDeptBadge(dept)}
              </div>
              <div class="merge-row-subject">${ticket.subject || '—'}</div>
              <div class="merge-row-meta">
                <span>Loan: <strong>${ticket.loanId || '—'}</strong></span>
                <span>·</span>
                <span>${ticket.loanStage || 'Stage unknown'}</span>
                <span>·</span>
                <span>Created: ${formatTicketCreatedStamp(ticket)}</span>
                <span>·</span>
                ${mergeStatusBadge(ticket.status)}
              </div>
            </div>

            <div class="merge-row-right">
              <label class="merge-primary-radio" title="Set as primary ticket (others will merge into this one)">
                <input type="radio"
                  name="mergePrimary"
                  data-id="${ticket.id}"
                  ${isPrimary ? 'checked' : ''}
                  onchange="selectPrimaryMerge('${ticket.id}')">
                <span class="merge-radio-label">Set primary</span>
              </label>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  /* Assemble full content */
  const nonCurrentSelected = Array.from(mergeIncludeIds).filter(id => id !== current.id).length;
  const canMerge = mergePrimaryId && nonCurrentSelected > 0;

  document.getElementById('mergeResults').innerHTML = `
    <div class="merge-summary-bar">
      <span>🎫 <strong>${totalCount}</strong> tickets</span>
      <span>·</span>
      <span>🏢 <strong>${deptCount}</strong> dept${deptCount!==1?'s':''}</span>
      <span>·</span>
      <span>📡 <strong>${chanCount}</strong> channel${chanCount!==1?'s':''}</span>
      ${checkedCount > 0 ? `<span class="merge-sel-count">· <strong>${checkedCount}</strong> selected</span>` : ''}
    </div>
    <div class="merge-primary-hint">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#3B6FA0" stroke-width="1.5"/><path d="M8 5v4M8 11v.5" stroke="#3B6FA0" stroke-width="1.5" stroke-linecap="round"/></svg>
      Select the <strong>primary ticket</strong> — all other checked tickets will be merged into it. The current ticket is pre-selected as primary.
    </div>
    ${groupsHtml}
  `;

  document.getElementById('mergeConfirmBtn').disabled = !canMerge;

  /* Sync radio buttons in DOM to match mergePrimaryId (re-render resets DOM) */
  document.querySelectorAll('input[name="mergePrimary"]').forEach(r => {
    r.checked = (r.dataset.id === mergePrimaryId);
  });
}

function selectPrimaryMerge(id){
  mergePrimaryId = id;
  /* Auto-check the primary ticket */
  mergeIncludeIds.add(id);
  renderMergeResults();
}

function toggleMergeCandidate(id, checked){
  const current = TICKETS.find(x=>x.id===selectedTicketId);
  if(current && id === current.id) return; /* current ticket is always included */
  if(checked){
    mergeIncludeIds.add(id);
    if(!mergePrimaryId) mergePrimaryId = id;
  } else {
    mergeIncludeIds.delete(id);
    /* If the deselected ticket was the primary, reset to current ticket */
    if(mergePrimaryId === id){
      mergePrimaryId = current ? current.id : null;
    }
  }
  renderMergeResults();
}

function submitMerge(){
  if(!mergePrimaryId){
    showToast('Choose a primary ticket to continue.');
    return;
  }
  const primary = TICKETS.find(x=>x.id===mergePrimaryId);
  if(!primary) {
    showToast('Primary ticket not found.');
    return;
  }

  const mergeIds = Array.from(mergeIncludeIds).filter(id => id !== primary.id);
  if(!mergeIds.length){
    showToast('Select at least one other ticket to merge into the primary.');
    return;
  }

  const snapshot = {
    beforeThread: JSON.parse(JSON.stringify(primary.thread)),
    beforeActivity: primary.activity.slice(),
    beforeActivityMeta: (primary.activityMeta || []).slice(),
    beforePrimaryStatus: primary.status,
    beforeMergedStatus: {},
    beforeMergedActivity: {},
    mergedIds: mergeIds.slice(),
    mergeSummary: `Merged ${mergeIds.join(', ')} into this ticket — unique conversation details preserved`
  };

  const seen = new Set(primary.thread.map(msg => `${msg.dir}|${(msg.text||'').trim().toLowerCase()}|${msg.chan}|${msg.time}`));
  let mergedCount = 0;

  for(const id of mergeIds){
    const secondary = TICKETS.find(x=>x.id===id);
    if(!secondary) continue;
    snapshot.beforeMergedStatus[id] = secondary.status;
    snapshot.beforeMergedActivity[id] = secondary.activity.slice();

    secondary.thread.forEach(msg => {
      const key = `${msg.dir}|${(msg.text||'').trim().toLowerCase()}|${msg.chan}|${msg.time}`;
      if(!seen.has(key)){
        primary.thread.push({ ...msg, mergedFrom: secondary.id });
        seen.add(key);
      }
    });

    (secondary.activity || []).forEach(entry => {
      if(!primary.activity.includes(entry)) primary.activity.push(entry);
    });

    const mergeText = `Merged ${secondary.id} into this ticket — unique conversation details preserved`;
    addActivityEntry(primary, mergeText, { type:'merge', primaryId: primary.id, mergedIds: mergeIds.slice(), mergedTicketId: secondary.id, snapshot });
    secondary.status = 'Merged';
    secondary.activity.push(`Merged into ${primary.id} by manager`);
    mergedCount += 1;
  }

  primary.lastMergeSnapshot = snapshot;
  closeModal('modalMerge');
  showToast(`${mergedCount} ticket(s) merged into ${primary.id}`);

  /* If primary differs from current view, switch to primary ticket */
  if(selectedTicketId !== primary.id){
    selectedTicketId = primary.id;
  }
  renderDetailList();
  renderConvBody('thread');
  renderTicketList();
  renderDetail();
}

/* =========================================================
   ESCALATE
========================================================= */
function openEscalate(){ document.getElementById('modalEscalate').classList.add('show'); }
function submitEscalate(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  const to = document.getElementById('escTo').value;
  const reason = document.getElementById('escReason').value;
  t.status='Escalated'; t.priority='High'; t.updated='just now';
  t.activity.push(`Escalated to ${to} — reason: ${reason}`);
  t.thread.push({dir:'note', text:`Escalated to ${to}. Reason: ${reason}. ${document.getElementById('escNotes').value||''}`.trim(), chan:'Internal', time:'now'});
  closeModal('modalEscalate');
  showToast(`Ticket escalated to ${to}`);
  renderDetail(); renderDetailList(); renderTicketList();
}

/* =========================================================
   REASSIGN
========================================================= */
function openReassign(){
  const sel = document.getElementById('reAgent');
  sel.innerHTML = AGENTS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  enhanceSearchSelect(sel);
  document.getElementById('modalReassign').classList.add('show');
}
function submitReassign(){
  const t = TICKETS.find(x=>x.id===selectedTicketId);
  const agentId = document.getElementById('reAgent').value;
  const queue = document.getElementById('reQueue').value;
  const reason = document.getElementById('reReason').value;
  t.assignee = agentId; t.queue = queue; t.updated='just now';
  t.activity.push(`Reassigned to ${agentName(agentId)} (${queue})${reason? ' — '+reason:''}`);
  closeModal('modalReassign');
  showToast(`Reassigned to ${agentName(agentId)}`);
  renderDetail(); renderDetailList(); renderTicketList();
}

/* =========================================================
   MODAL / TOAST HELPERS
========================================================= */
function closeModal(id){ document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.modal-overlay').forEach(ov=>ov.addEventListener('click', e=>{ if(e.target===ov) ov.classList.remove('show'); }));
let toastTimer;
function showToast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 2800);
}

/* =========================================================
   MANAGER DASHBOARD
========================================================= */
let chartsInit = {};
function renderDashboard(){
  const active = TICKETS.filter(t=>t.status!=='Merged');
  const open = active.filter(t=>!['Resolved','Closed'].includes(t.status)).length;
  const breached = active.filter(t=>t.slaMins<0).length;
  const resolvedToday = active.filter(t=>t.status==='Resolved').length;
  const escalated = active.filter(t=>t.status==='Escalated').length;
  const kpis = [
    {lbl:'Open tickets', val:open, delta:'+4 vs yesterday', up:false},
    {lbl:'SLA breach %', val: Math.round(breached/active.length*100)+'%', delta:breached+' breached', up:false},
    {lbl:'Avg handling time', val:'13m', delta:'−2m vs last week', up:true},
    {lbl:'First response', val:'4m', delta:'within target', up:true},
    {lbl:'NPS score', val:'62', delta:'+5 vs last month', up:true},
    {lbl:'Escalated', val:escalated, delta:'needs review', up:false},
  ];
  document.getElementById('kpiGrid').innerHTML = kpis.map(k=>`
    <div class="kpi-card"><div class="lbl">${k.lbl}</div><div class="val">${k.val}</div><div class="delta ${k.up?'up':'down'}">${k.delta}</div></div>`).join('');

  document.getElementById('agentPerfBody').innerHTML = AGENTS.map(a=>`
    <tr><td><span class="assignee-pill"><span class="mini-avatar">${initials(a.name)}</span>${a.name}</span></td>
    <td>${a.assigned}</td><td>${a.resolved}</td><td>${a.aht}</td>
    <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${a.sla}%; background:${a.sla>90?'var(--green)':a.sla>80?'var(--amber)':'var(--red)'};"></div></div><span>${a.sla}%</span></div></td>
    <td>${a.csat} / 5</td></tr>`).join('');

  const ctx = id => document.getElementById(id).getContext('2d');
  Object.values(chartsInit).forEach(c=>c && c.destroy && c.destroy());

  chartsInit.trend = new Chart(ctx('chartTrend'), {
    type:'line',
    data:{ labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets:[
        {label:'Created', data:[22,28,19,31,26,14,9], borderColor:'#3B6FA0', backgroundColor:'rgba(59,111,160,.08)', tension:.35, fill:true},
        {label:'Resolved', data:[19,24,21,27,29,17,11], borderColor:'#0F5C56', backgroundColor:'rgba(15,92,86,.10)', tension:.35, fill:true},
      ]},
    options:{ plugins:{legend:{position:'bottom', labels:{boxWidth:10,font:{size:11}}}}, scales:{y:{beginAtZero:true, grid:{color:'#EDEAE0'}}, x:{grid:{display:false}}} }
  });

  chartsInit.channel = new Chart(ctx('chartChannel'), {
    type:'doughnut',
    data:{ labels:['WhatsApp','Email','Chat','Call'], datasets:[{data:[38,22,26,14], backgroundColor:['#2C8A45','#3B6FA0','#0F5C56','#D98E3F']}] },
    options:{ plugins:{legend:{position:'bottom', labels:{boxWidth:10,font:{size:11}}}}, cutout:'62%' }
  });

  chartsInit.status = new Chart(ctx('chartStatus'), {
    type:'bar',
    data:{ labels:['New','Open','In Progress','Waiting','Hold','Escalated','Resolved'],
      datasets:[{data:[9,14,17,6,4,3,21], backgroundColor:'#0F5C56', borderRadius:5}] },
    options:{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, grid:{color:'#EDEAE0'}}, x:{grid:{display:false}}} }
  });

  chartsInit.sla = new Chart(ctx('chartSla'), {
    type:'bar',
    data:{ labels:['High','Medium','Low'],
      datasets:[{label:'Within SLA', data:[81,93,97], backgroundColor:'#0F5C56', borderRadius:5},
                {label:'Breached', data:[19,7,3], backgroundColor:'#B5453B', borderRadius:5}] },
    options:{ plugins:{legend:{position:'bottom', labels:{boxWidth:10,font:{size:11}}}}, scales:{x:{stacked:true, grid:{display:false}}, y:{stacked:true, beginAtZero:true, max:100, grid:{color:'#EDEAE0'}}} }
  });
}

/* =========================================================
   INIT
========================================================= */
renderTicketList();
refreshHeaderStatus();
enhanceAllSelects(document);
setInterval(()=>{
  refreshHeaderStatus();
  if(document.getElementById('view-team').classList.contains('active')) renderTeamStatus();
}, 30000);
