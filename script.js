/* =========================================================
   MOCK DATA & APPLICATION STATE
========================================================= */
const AGENTS = [
  { id: 'a1', name: 'Asma Vohra', assigned: 14, resolved: 9, aht: '11m', sla: 96, csat: 4.7 },
  { id: 'a2', name: 'Thor Odinson', assigned: 11, resolved: 7, aht: '14m', sla: 88, csat: 4.4 },
  { id: 'a3', name: 'Loki Odinson', assigned: 9, resolved: 8, aht: '9m', sla: 99, csat: 4.9 },
  { id: 'a4', name: 'jahnvi Darji', assigned: 16, resolved: 10, aht: '18m', sla: 79, csat: 4.1 },
  { id: 'a5', name: 'Priya Patel', assigned: 6, resolved: 6, aht: '8m', sla: 100, csat: 4.8 },
  { id: 'a6', name: 'Adam Black', assigned: 14, resolved: 9, aht: '11m', sla: 96, csat: 4.7 },
  { id: 'a7', name: 'Aditya Roy', assigned: 11, resolved: 7, aht: '14m', sla: 88, csat: 4.4 },
  { id: 'a8', name: 'Arwin Elves', assigned: 9, resolved: 8, aht: '9m', sla: 99, csat: 4.9 },
  { id: 'a9', name: 'Amrin Ali', assigned: 16, resolved: 10, aht: '18m', sla: 79, csat: 4.1 },
  { id: 'a10', name: 'Alex Mac', assigned: 6, resolved: 6, aht: '18m', sla: 100, csat: 4.8 },
];

const DEPT_AGENTS = {
  "Support": ["a2", "a4"],
  "Collection": ["a1"],
  "Legal Related": ["a3", "a8"],
  "Grievance": ["a5"]
};
let DEPT_CHANNEL_CAPACITIES = {
  "Support": { WhatsApp: 10, Email: 20, Chat: 10, Call: 3 },
  "Collection": { WhatsApp: 10, Email: 20, Chat: 10, Call: 3 },
  "Legal Related": { WhatsApp: 10, Email: 20, Chat: 10, Call: 3 },
  "Grievance": { WhatsApp: 10, Email: 20, Chat: 10, Call: 3 }
};

// Initialize default skills for agents
const defaultSkills = [
  { channels: ['WhatsApp', 'Email'], languages: ['English', 'Hindi'] },
  { channels: ['Email', 'Chat'], languages: ['English', 'Marathi'] },
  { channels: ['Chat', 'Call'], languages: ['English', 'Gujarati'] },
  { channels: ['Call', 'WhatsApp'], languages: ['English', 'Hindi'] },
  { channels: ['WhatsApp', 'Chat'], languages: ['English', 'Marathi'] }
];
AGENTS.forEach((a, i) => {
  const s = defaultSkills[i % defaultSkills.length];
  a.skills = {
    channels: [...s.channels],
    languages: [...s.languages]
  };
  a.capacities = {
    WhatsApp: 10,
    Email: 20,
    Chat: 10,
    Call: 3
  };
});

let ASSIGNMENT_RULES = [
  {
    id: 'r1',
    name: 'High Priority Email Routing',
    skill: 'Email',
    agents: ['a2', 'a4'],
    startDate: '2026-08-08',
    startTime: '09:00',
    endDate: '2026-08-15',
    endTime: '18:00',
    priority: 'High',
    status: 'Active'
  },
  {
    id: 'r2',
    name: 'Weekend WhatsApp Support',
    skill: 'WhatsApp',
    agents: ['a1', 'a5'],
    startDate: '2026-08-08',
    startTime: '00:00',
    endDate: '2026-08-31',
    endTime: '23:59',
    priority: 'Medium',
    status: 'Active'
  }
];

let CHANNEL_ASSIGNMENTS = [
  {
    id: 'ca_1',
    dept: 'Support',
    agentId: 'a2',
    agentName: 'Emma Watson',
    channel: 'Email',
    startDate: '2026-08-10',
    startTime: '09:00',
    endDate: '2026-08-20',
    endTime: '18:00',
    status: 'Active'
  }
];

function getAgentQueues(agentId) {
  const queues = [];
  for (const [dept, ids] of Object.entries(DEPT_AGENTS)) {
    if (ids.includes(agentId)) {
      queues.push(dept);
    }
  }
  return queues.join(', ') || 'General';
}

function getActiveTicketCountForAgent(agentId) {
  return TICKETS.filter(t => t.assignee === agentId && t.status !== 'Closed' && t.status !== 'Resolved' && t.status !== 'Merged').length;
}

function getActiveTicketCountForAgentAndChannel(agentId, channel) {
  return TICKETS.filter(t => t.assignee === agentId && t.channel === channel && t.status !== 'Closed' && t.status !== 'Resolved' && t.status !== 'Merged').length;
}

function getAgentChannelCapacity(agentId, channel) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a) return 10;

  // 1. Check if individual agent capacity override is set
  if (a.capacities && a.capacities[channel] !== undefined) {
    return parseInt(a.capacities[channel]);
  }

  // 2. If not, inherit from the agent's department capacity
  const depts = getAgentQueues(agentId).split(', ');
  if (depts.length > 0 && depts[0] !== 'General') {
    const firstDept = depts[0];
    if (DEPT_CHANNEL_CAPACITIES[firstDept] && DEPT_CHANNEL_CAPACITIES[firstDept][channel] !== undefined) {
      return parseInt(DEPT_CHANNEL_CAPACITIES[firstDept][channel]);
    }
  }

  // 3. Fallback defaults
  return channel === 'Call' ? 3 : channel === 'Email' ? 20 : 10;
}

function agentHasChannelCapacity(agentId, channel) {
  const activeCount = getActiveTicketCountForAgentAndChannel(agentId, channel);
  const maxCap = getAgentChannelCapacity(agentId, channel);
  return activeCount < maxCap;
}

const DEPT_CAT_SUBCAT = {
  "Support": {
    "KYC Verification": ["Under process", "OTP not received", "OTP-Greyed out", "Other-3rd Party Error"],
    "Declined Profile": ["Analyst Decline", "Cibil Decline", "System decline", "User decline", "Ineligible Salary"],
    "Salary verification": ["Under process", "Employment Details", "Salary Slip", "Invalid Bank statement", "Pending Bank Statement", "BS Uploading Error"],
    "Profile Untraceable": ["Unregistered Email", "NC on Phone"],
    "Disbursement Pending": ["Amount Not Credited", "Account Blocked"],
    "Registration": ["Basic Details"],
    "Loan Offer": ["Tenure / EMI Schedule", "Offer Amount Limit", "High Rate of Interest", "New Loan Eligibility", "Processing fee"],
    "Loan Enquiry": ["Tenure / EMI Schedule", "Auto Debit related", "Repayment related"],
    "E-Mandate": ["Unable to process E-mandate", "Under process", "Bank Change", "Other-3rd Party Error"],
    "Final Verification": ["Under process", "ECS/Overdue Proof"],
    "E-Sign": ["Unable to process E-Sign", "Other-3rd Party Error"],
    "Notification": ["Promotional Msgs."],
    "Change mobile no": ["Inactive Number"],
    "Cool-off Removal": ["Bad Cibil", "Latest Salary - NA", "Others"],
    "Cibil Updation": ["CFL-Dependency", "CX to File Dispute", "Waiver Payment"],
    "Insurance": ["Insurance Claim", "Insurance Cancellation"],
    "Refund/Credit": ["Refund Request", "Credit Note"],
    "Loan cancellation": ["Loan cancellation"],
    "NOC": ["Settled-NOC", "Closure-NOC"],
    "Delete account": ["Delete account"]
  },
  "Collection": {
    "Repayment": ["Auto Debit related", "Manual Payment Updation", "Closure on time", "Loan Foreclose", "Extension", "Waiver Link", "Settlement", "Remove Settlement", "3rd Party Contact"],
    "ECS Charge": ["ECS Related", "ECS-Payment not updated", "ECS-Waiver"],
    "Reference calling": ["CX to share proof", "CFL to Validate"]
  },
  "Legal Related": {
    "Settlement": ["Extension"],
    "Single-Debt Contacts": ["Settlement/Extension - Other 3rd Party"],
    "Cyber - Frozen Lien": ["Cyber - Frozen Lien"],
    "Legal Case Information": ["Legal Case Information"],
    "Legal Notice": ["Legal Notice"]
  },
  "Grievance": {
    "Repayment Extension": ["Repayment Extension"],
    "Settlement": ["Settlement"],
    "Cibil Updation": ["Cibil Updation"],
    "Collection Related": ["Collection Related"],
    "Legal Related": ["Legal Related"],
    "Harassment": ["Harassment"],
    "Lending Process": ["Lending Process"],
    "Refund": ["Refund"],
    "Auto debit": ["Auto debit"],
    "Repayment": ["Repayment"],
    "Multiple EMI Deduction": ["Multiple EMI Deduction"],
    "Loan related": ["Loan Offer", "Loan Enquiry", "Loan Decline", "Loan Cancelation"],
    "Charges Related": ["Charges Related"],
    "Foreclosure": ["Foreclosure"],
    "Reference Call": ["Reference Call"]
  }
};

function getDepartmentForCategory(category) {
  for (const [dept, cats] of Object.entries(DEPT_CAT_SUBCAT)) {
    if (cats[category]) return dept;
  }
  return 'Support'; // default fallback
}

function getActiveTicketCountForDeptAndChannel(dept, channel) {
  return TICKETS.filter(t => (t.department === dept || t.queue === dept) && t.channel === channel && t.status !== 'Closed' && t.status !== 'Resolved' && t.status !== 'Merged').length;
}

function deptHasChannelCapacity(dept, channel) {
  const activeCount = getActiveTicketCountForDeptAndChannel(dept, channel);
  const caps = DEPT_CHANNEL_CAPACITIES[dept] || { WhatsApp: 10, Email: 20, Chat: 10, Call: 3 };
  const maxCap = caps[channel] !== undefined ? parseInt(caps[channel]) : (channel === 'Call' ? 3 : channel === 'Email' ? 20 : 10);
  return activeCount < maxCap;
}

function findSkillBasedAssignee(channel, category, priority, language) {
  const now = new Date();
  const dept = getDepartmentForCategory(category);
  const isDeptFull = !deptHasChannelCapacity(dept, channel);

  // A. Check for Active Manager Channel-wise Assignments
  const activeChannelAssignments = CHANNEL_ASSIGNMENTS.filter(ca => {
    if (ca.status !== 'Active') return false;
    if (ca.channel !== channel) return false;

    const start = new Date(`${ca.startDate}T${ca.startTime}:00`);
    const end = new Date(`${ca.endDate}T${ca.endTime}:00`);
    return now >= start && now <= end;
  });

  if (activeChannelAssignments.length > 0) {
    const assignedAgentIds = activeChannelAssignments.map(ca => ca.agentId);
    let caEligible = AGENTS.filter(a => assignedAgentIds.includes(a.id));

    // Filter agents based on availability + channel skill + language skill + capacity + department capacity
    let filtered = caEligible.filter(a => {
      if (a.status !== 'Available' || a.paused || a.onLeave) return false;
      if (!agentHasChannelCapacity(a.id, channel)) return false;
      if (isDeptFull && getAgentQueues(a.id).includes(dept)) return false;
      const hasChannel = a.skills && a.skills.channels.includes(channel);
      const hasLanguage = a.skills && a.skills.languages.includes(language);
      return hasChannel && hasLanguage;
    });

    if (filtered.length === 0) {
      filtered = caEligible.filter(a => {
        if (a.paused || a.onLeave) return false;
        if (!agentHasChannelCapacity(a.id, channel)) return false;
        if (isDeptFull && getAgentQueues(a.id).includes(dept)) return false;
        const hasChannel = a.skills && a.skills.channels.includes(channel);
        const hasLanguage = a.skills && a.skills.languages.includes(language);
        return hasChannel && hasLanguage;
      });
    }

    if (filtered.length === 0) {
      filtered = caEligible.filter(a => {
        if (a.paused || a.onLeave) return false;
        if (!agentHasChannelCapacity(a.id, channel)) return false;
        if (isDeptFull && getAgentQueues(a.id).includes(dept)) return false;
        return a.skills && a.skills.channels.includes(channel);
      });
    }

    // Fallback if all assigned agents are at capacity or dept is full
    if (filtered.length === 0) {
      filtered = caEligible.filter(a => {
        if (a.paused || a.onLeave) return false;
        return a.skills && a.skills.channels.includes(channel);
      });
    }

    if (filtered.length > 0) {
      filtered.sort((a, b) => a.assigned - b.assigned);
      return filtered[0].id;
    }
  }

  // 1. Find active rules matching this ticket's channel
  const matchingRules = ASSIGNMENT_RULES.filter(r => {
    if (r.status !== 'Active') return false;
    if (r.skill !== channel) return false;

    const startStr = `${r.startDate}T${r.startTime}:00`;
    const endStr = `${r.endDate}T${r.endTime}:00`;
    const start = new Date(startStr);
    const end = new Date(endStr);

    return now >= start && now <= end;
  });

  let eligibleAgents = [];

  if (matchingRules.length > 0) {
    matchingRules.sort((a, b) => {
      if (a.priority === priority && b.priority !== priority) return -1;
      if (a.priority !== priority && b.priority === priority) return 1;
      return 0;
    });
    const rule = matchingRules[0];
    eligibleAgents = AGENTS.filter(a => rule.agents.includes(a.id));
  } else {
    eligibleAgents = [...AGENTS];
  }

  // 2. Filter agents based on availability + channel skill + language skill + capacity + department capacity
  let filtered = eligibleAgents.filter(a => {
    if (a.status !== 'Available' || a.paused || a.onLeave) return false;
    if (!agentHasChannelCapacity(a.id, channel)) return false;
    if (isDeptFull && getAgentQueues(a.id).includes(dept)) return false;

    const hasChannel = a.skills && a.skills.channels.includes(channel);
    const hasLanguage = a.skills && a.skills.languages.includes(language);
    return hasChannel && hasLanguage;
  });

  // If no available agents match channel + language + capacity + dept capacity, relax availability check
  if (filtered.length === 0) {
    filtered = eligibleAgents.filter(a => {
      if (a.paused || a.onLeave) return false;
      if (!agentHasChannelCapacity(a.id, channel)) return false;
      if (isDeptFull && getAgentQueues(a.id).includes(dept)) return false;
      const hasChannel = a.skills && a.skills.channels.includes(channel);
      const hasLanguage = a.skills && a.skills.languages.includes(language);
      return hasChannel && hasLanguage;
    });
  }

  // If still nothing, relax language check
  if (filtered.length === 0) {
    filtered = eligibleAgents.filter(a => {
      if (a.paused || a.onLeave) return false;
      if (!agentHasChannelCapacity(a.id, channel)) return false;
      if (isDeptFull && getAgentQueues(a.id).includes(dept)) return false;
      return a.skills && a.skills.channels.includes(channel);
    });
  }

  // If still nothing, relax department capacity constraint
  if (filtered.length === 0) {
    filtered = eligibleAgents.filter(a => {
      if (a.paused || a.onLeave) return false;
      if (!agentHasChannelCapacity(a.id, channel)) return false;
      return a.skills && a.skills.channels.includes(channel);
    });
  }

  // If still empty, fallback to agents regardless of capacity to prevent starvation
  if (filtered.length === 0) {
    filtered = eligibleAgents.filter(a => {
      if (a.paused || a.onLeave) return false;
      return a.skills && a.skills.channels.includes(channel);
    });
  }

  // If still empty, fallback to first eligible agent
  if (filtered.length === 0) {
    return eligibleAgents.length > 0 ? eligibleAgents[0].id : null;
  }

  // Sort by workload (assigned count) to balance capacity
  filtered.sort((a, b) => a.assigned - b.assigned);
  return filtered[0].id;
}

/* =========================================================
   AGENT STATUS CONTROL & ACTIVITY LOGGING
========================================================= */
const STATUS_OPTIONS = ['Available', 'Break', 'Meeting', 'Training', 'Offline'];
const STATUS_COLOR = { Available: '#22C55E', Break: '#D98E3F', Meeting: '#6C4FB6', Training: '#3B6FA0', Offline: '#94A3B8' };
const CURRENT_AGENT_ID = 'a1';
const CURRENT_MANAGER_NAME = 'Manager';

function statusDotClass(s) { return 'dot-' + s.replace(/[^a-zA-Z]/g, ''); }
function agentStatClass(s) { return 'astat-' + s.replace(/[^a-zA-Z]/g, ''); }

function fmtLogTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
function fmtDuration(mins) {
  mins = Math.max(0, Math.round(mins));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function initAgentStatuses() {
  const now = Date.now();
  const seed = [
    { status: 'Available', minsAgo: 46 },
    { status: 'Break', minsAgo: 9 },
    { status: 'Meeting', minsAgo: 18 },
    { status: 'Training', minsAgo: 63 },
    { status: 'Available', minsAgo: 5 },
  ];
  AGENTS.forEach((a, i) => {
    const s = seed[i % seed.length];
    const startTs = now - s.minsAgo * 60000;
    a.status = s.status;
    a.statusSince = startTs;
    a.paused = false;
    a.onLeave = false;
    a.leaveFrom = null; a.leaveFromTime = null; a.leaveTo = null; a.leaveToTime = null; a.leaveReason = null;
    a.durations = { Available: 0, Break: 0, Meeting: 0, Training: 0, Offline: 0 };
    a.log = [{ ts: startTs, text: `Shift started — status set to ${s.status}`, actor: a.name, by: 'agent' }];
  });
}

/* Records the elapsed time in the outgoing status, switches to the new one, and writes a timestamped log entry. */
function changeAgentStatus(agentId, newStatus, actorType, actorName, note) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a) return null;
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

function liveDurations(a) {
  const now = Date.now();
  const live = Object.assign({}, a.durations);
  live[a.status] = (live[a.status] || 0) + (now - a.statusSince) / 60000;
  return live;
}

function renderStatusLogModal(agentId, gridId, listId) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a) return;
  const live = liveDurations(a);
  document.getElementById(gridId).innerHTML = STATUS_OPTIONS.map(s => `
    <div class="duration-card">
      <div class="dc-lbl"><span class="status-dot-lg" style="background:${STATUS_COLOR[s]};"></span>${s}</div>
      <div class="dc-val">${fmtDuration(live[s] || 0)}</div>
    </div>`).join('');
  document.getElementById(listId).innerHTML = a.log.map(e => `
    <div class="log-row"><div class="log-time">${fmtLogTime(e.ts)}</div><div class="log-text">${e.text}</div></div>
  `).join('') || `<div style="color:var(--ink-faint);font-size:12px;padding:10px 0;">No activity logged yet.</div>`;
}

/* ---------- Self-service (agent) ---------- */
let statusDropdownOpen = false;
function buildStatusOptionsList() {
  const me = AGENTS.find(a => a.id === CURRENT_AGENT_ID);
  document.getElementById('statusOptionsList').innerHTML = STATUS_OPTIONS.map(s => `
    <div class="sd-opt ${s === me.status ? 'active' : ''}" onclick="setMyStatus('${s}')">
      <span class="status-dot-lg" style="background:${STATUS_COLOR[s]};"></span> ${s}
    </div>`).join('');
}
function toggleStatusDropdown(e) {
  if (e) e.stopPropagation();
  statusDropdownOpen = !statusDropdownOpen;
  if (statusDropdownOpen) buildStatusOptionsList();
  document.getElementById('statusDropdownMenu').classList.toggle('show', statusDropdownOpen);
}
document.addEventListener('click', e => {
  const btn = document.getElementById('statusPillBtn');
  const menu = document.getElementById('statusDropdownMenu');
  if (statusDropdownOpen && btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
    statusDropdownOpen = false;
    menu.classList.remove('show');
  }
});
function setMyStatus(newStatus) {
  const me = AGENTS.find(a => a.id === CURRENT_AGENT_ID);
  changeAgentStatus(me.id, newStatus, 'agent', me.name);
  refreshHeaderStatus();
  statusDropdownOpen = false;
  document.getElementById('statusDropdownMenu').classList.remove('show');
  showToast(`Status set to ${newStatus} — incoming tickets will route accordingly`);
  if (document.getElementById('view-team').classList.contains('active')) renderTeamStatus();
}
function openMyStatusLog() {
  statusDropdownOpen = false;
  document.getElementById('statusDropdownMenu').classList.remove('show');
  renderStatusLogModal(CURRENT_AGENT_ID, 'myDurationGrid', 'myLogList');
  document.getElementById('modalMyLog').classList.add('show');
}
function refreshHeaderStatus() {
  const me = AGENTS.find(a => a.id === CURRENT_AGENT_ID);
  if (!me) return;
  document.getElementById('headerAvatarInitials').textContent = initials(me.name);
  document.getElementById('statusPillLabel').textContent = me.status;
  document.getElementById('headerStatusDot').style.background = STATUS_COLOR[me.status];
}

/* ---------- Team management (manager) ---------- */
function fmtLeaveRange(a) {
  if (!a.leaveFrom || !a.leaveTo) return '';
  const dOpts = { month: 'short', day: 'numeric' };
  const tOpts = { hour: '2-digit', minute: '2-digit' };
  const f = new Date(a.leaveFrom + 'T' + (a.leaveFromTime || '00:00'));
  const t = new Date(a.leaveTo + 'T' + (a.leaveToTime || '00:00'));
  const fTxt = f.toLocaleDateString([], dOpts) + (a.leaveFromTime ? ' ' + f.toLocaleTimeString([], tOpts) : '');
  const tTxt = t.toLocaleDateString([], dOpts) + (a.leaveToTime ? ' ' + t.toLocaleTimeString([], tOpts) : '');
  return `${fTxt} \u2192 ${tTxt}`;
}
function renderTeamStatus() {
  const table = document.getElementById('teamStatusTable');
  if (!table) {
    const body = document.getElementById('teamStatusBody');
    if (!body) return;
    body.innerHTML = AGENTS.map(a => {
      const live = liveDurations(a);
      const activeCount = getActiveTicketCountForAgent(a.id);

      let hasBreachedCapacity = false;
      let isCloseToCapacity = false;
      ['WhatsApp', 'Email', 'Chat', 'Call'].forEach(ch => {
        const count = getActiveTicketCountForAgentAndChannel(a.id, ch);
        const max = getAgentChannelCapacity(a.id, ch);
        if (count >= max) {
          hasBreachedCapacity = true;
        } else if (count >= max * 0.8) {
          isCloseToCapacity = true;
        }
      });

      let dotColor = '#22C55E';
      if (hasBreachedCapacity) {
        dotColor = '#EF4444';
      } else if (isCloseToCapacity) {
        dotColor = '#F59E0B';
      }

      const capacityHtml = `
        <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 2px; font-size: 10.5px; color: var(--ink-soft); line-height: 1.3;">
          <div style="display: flex; align-items: center; gap: 4px; font-weight: 600; margin-bottom: 2px;">
            <span style="background:${dotColor}; display:inline-block; width:7px; height:7px; border-radius:50%;"></span>
            <span>Status check</span>
          </div>
          <span>WhatsApp: <b>${getActiveTicketCountForAgentAndChannel(a.id, 'WhatsApp')}</b> / ${getAgentChannelCapacity(a.id, 'WhatsApp')}</span>
          <span>Email: <b>${getActiveTicketCountForAgentAndChannel(a.id, 'Email')}</b> / ${getAgentChannelCapacity(a.id, 'Email')}</span>
          <span>Chat: <b>${getActiveTicketCountForAgentAndChannel(a.id, 'Chat')}</b> / ${getAgentChannelCapacity(a.id, 'Chat')}</span>
          <span>Call: <b>${getActiveTicketCountForAgentAndChannel(a.id, 'Call')}</b> / ${getAgentChannelCapacity(a.id, 'Call')}</span>
        </div>
      `;
      const queuesStr = getAgentQueues(a.id);
      const skillsStr = (a.skills ? `Ch: ${a.skills.channels.join(', ')} | Lg: ${a.skills.languages.join(', ')}` : 'None');

      const now = new Date();
      const activeMgrChans = CHANNEL_ASSIGNMENTS.filter(ca => {
        if (ca.agentId !== a.id || ca.status !== 'Active') return false;
        const start = new Date(`${ca.startDate}T${ca.startTime}:00`);
        const end = new Date(`${ca.endDate}T${ca.endTime}:00`);
        return now >= start && now <= end;
      }).map(ca => ca.channel);
      const combinedChans = Array.from(new Set([...activeMgrChans, ...(a.skills ? a.skills.channels : [])]));
      const activeChansStr = combinedChans.length > 0 ? combinedChans.join(', ') : 'None';

      return `<tr>
        <td><span class="assignee-pill"><span class="mini-avatar">${initials(a.name)}</span>${a.name}</span></td>
        <td>
          <select class="team-status-select" onchange="managerChangeStatus('${a.id}', this.value)">
            ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td style="color:var(--ink-faint); font-size: 11.5px;">${fmtLogTime(a.statusSince)}</td>
        <td>${fmtDuration(live[a.status] || 0)}</td>
        <td>
          <div style="font-weight: 700; color: var(--ink); font-size: 13px;">${activeCount} Active Cases</div>
        </td>
        <td>${capacityHtml}</td>
        <td>${queuesStr}</td>
        <td><span class="status-badge" style="background:var(--purple-tint); color:var(--purple); border: 1px solid var(--purple-badge);">${skillsStr}</span></td>
        <td><span class="status-badge" style="background:#E2E8F0; color:#475569; border: 1px solid var(--line); font-size: 11px;">${activeChansStr}</span></td>
        <td><label class="mini-toggle" style="${a.onLeave ? 'opacity:.55;' : ''}"><input type="checkbox" ${a.paused ? 'checked' : ''} ${a.onLeave ? 'disabled title="Automatically paused while on leave"' : ''} onchange="togglePauseAssignment('${a.id}', this.checked)"> Paused</label></td>
        <td><label class="mini-toggle"><input type="checkbox" ${a.onLeave ? 'checked' : ''} onchange="handleLeaveCheckbox('${a.id}', this.checked)"> On leave</label>${a.onLeave ? `<div style="font-size:10px;color:var(--ink-faint);margin-top:2px;">${fmtLeaveRange(a)}</div>` : ''}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="openAgentLog('${a.id}')">View log</button></td>
      </tr>`;
    }).join('');
    enhanceAllSelects(body);
    return;
  }

  const sort = (typeof sortState !== 'undefined' && sortState.team) ? sortState.team : { field: null, asc: true };
  let list = [...AGENTS];
  if (sort.field && typeof sortArray !== 'undefined') {
    sortArray(list, sort.field, sort.asc);
  }

  table.innerHTML = `
    <thead><tr>
      <th class="sortable-header" onclick="toggleSort('team', 'name', 'renderTeamStatus')">Agent${typeof sortIcon !== 'undefined' ? sortIcon('team', 'name') : ''}</th>
      <th class="sortable-header" onclick="toggleSort('team', 'status', 'renderTeamStatus')">Status${typeof sortIcon !== 'undefined' ? sortIcon('team', 'status') : ''}</th>
      <th class="sortable-header" onclick="toggleSort('team', 'statusSince', 'renderTeamStatus')">Since${typeof sortIcon !== 'undefined' ? sortIcon('team', 'statusSince') : ''}</th>
      <th>Time in status today</th>
      <th>Workload</th>
      <th>Primary Capacity</th>
      <th>Assigned Queues</th>
      <th>Skills</th>
      <th>Active Channels</th>
      <th class="sortable-header" onclick="toggleSort('team', 'paused', 'renderTeamStatus')">Assignment${typeof sortIcon !== 'undefined' ? sortIcon('team', 'paused') : ''}</th>
      <th class="sortable-header" onclick="toggleSort('team', 'onLeave', 'renderTeamStatus')">Leave${typeof sortIcon !== 'undefined' ? sortIcon('team', 'onLeave') : ''}</th>
      <th style="width:160px; text-align: right;">Actions</th>
    </tr></thead>
    <tbody id="teamStatusBody">
      ${list.map(a => {
    const live = liveDurations(a);
    const activeCount = getActiveTicketCountForAgent(a.id);

    let hasBreachedCapacity = false;
    let isCloseToCapacity = false;
    ['WhatsApp', 'Email', 'Chat', 'Call'].forEach(ch => {
      const count = getActiveTicketCountForAgentAndChannel(a.id, ch);
      const max = getAgentChannelCapacity(a.id, ch);
      if (count >= max) {
        hasBreachedCapacity = true;
      } else if (count >= max * 0.8) {
        isCloseToCapacity = true;
      }
    });

    let dotColor = '#22C55E';
    if (hasBreachedCapacity) {
      dotColor = '#EF4444';
    } else if (isCloseToCapacity) {
      dotColor = '#F59E0B';
    }

    const capacityHtml = `
          <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 2px; font-size: 10.5px; color: var(--ink-soft); line-height: 1.3;">
            <div style="display: flex; align-items: center; gap: 4px; font-weight: 600; margin-bottom: 2px;">
              <span style="background:${dotColor}; display:inline-block; width:7px; height:7px; border-radius:50%;"></span>
              <span>Status check</span>
            </div>
            <span>WhatsApp: <b>${getActiveTicketCountForAgentAndChannel(a.id, 'WhatsApp')}</b> / ${getAgentChannelCapacity(a.id, 'WhatsApp')}</span>
            <span>Email: <b>${getActiveTicketCountForAgentAndChannel(a.id, 'Email')}</b> / ${getAgentChannelCapacity(a.id, 'Email')}</span>
            <span>Chat: <b>${getActiveTicketCountForAgentAndChannel(a.id, 'Chat')}</b> / ${getAgentChannelCapacity(a.id, 'Chat')}</span>
            <span>Call: <b>${getActiveTicketCountForAgentAndChannel(a.id, 'Call')}</b> / ${getAgentChannelCapacity(a.id, 'Call')}</span>
          </div>
        `;

    const queuesStr = getAgentQueues(a.id);
    const skillsStr = (a.skills ? `Ch: ${a.skills.channels.join(', ')} | Lg: ${a.skills.languages.join(', ')}` : 'None');

    const now = new Date();
    const activeMgrChans = CHANNEL_ASSIGNMENTS.filter(ca => {
      if (ca.agentId !== a.id || ca.status !== 'Active') return false;
      const start = new Date(`${ca.startDate}T${ca.startTime}:00`);
      const end = new Date(`${ca.endDate}T${ca.endTime}:00`);
      return now >= start && now <= end;
    }).map(ca => ca.channel);
    const combinedChans = Array.from(new Set([...activeMgrChans, ...(a.skills ? a.skills.channels : [])]));
    const activeChansStr = combinedChans.length > 0 ? combinedChans.join(', ') : 'None';

    return `<tr>
          <td><span class="assignee-pill"><span class="mini-avatar">${initials(a.name)}</span>${a.name}</span></td>
          <td>
            <select class="team-status-select" onchange="managerChangeStatus('${a.id}', this.value)">
              ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
          <td style="color:var(--ink-faint); font-size: 11.5px;">${fmtLogTime(a.statusSince)}</td>
          <td>${fmtDuration(live[a.status] || 0)}</td>
          <td>
            <div style="font-weight: 700; color: var(--ink); font-size: 13px;">${activeCount} Active Cases</div>
          </td>
          <td>${capacityHtml}</td>
          <td style="font-size: 12px; color: var(--ink-soft);">${queuesStr}</td>
          <td><span class="status-badge" style="background:var(--purple-tint); color:var(--purple); border: 1px solid var(--purple-badge); font-size: 11px; white-space: normal; max-width: 250px; display: inline-block;">${skillsStr}</span></td>
          <td><span class="status-badge" style="background:#E2E8F0; color:#475569; border: 1px solid var(--line); font-size: 11px; white-space: normal; max-width: 200px; display: inline-block;">${activeChansStr}</span></td>
          <td><label class="mini-toggle" style="${a.onLeave ? 'opacity:.55;' : ''}"><input type="checkbox" ${a.paused ? 'checked' : ''} ${a.onLeave ? 'disabled title="Automatically paused while on leave"' : ''} onchange="togglePauseAssignment('${a.id}', this.checked)"> Paused</label></td>
          <td><label class="mini-toggle"><input type="checkbox" ${a.onLeave ? 'checked' : ''} onchange="handleLeaveCheckbox('${a.id}', this.checked)"> On leave</label>${a.onLeave ? `<div style="font-size:10px;color:var(--ink-faint);margin-top:2px;">${fmtLeaveRange(a)}</div>` : ''}</td>
          <td style="white-space: nowrap; text-align: right;"><button class="btn btn-ghost btn-sm" onclick="openEditSkillsModal('${a.id}')" style="margin-right:4px;">Edit skills</button><button class="btn btn-ghost btn-sm" onclick="openAgentLog('${a.id}')">View log</button></td>
        </tr>`;
  }).join('')}
    </tbody>
  `;
  enhanceAllSelects(table.querySelector('tbody'));
}

function renderAssignmentRules() {
  const body = document.getElementById('assignmentRulesBody');
  if (!body) return;

  const allRules = [
    ...ASSIGNMENT_RULES.map(r => ({ ...r, type: 'skill' })),
    ...CHANNEL_ASSIGNMENTS.map(ca => ({
      id: ca.id,
      name: `Channel assignment: ${ca.agentName}`,
      skill: ca.channel,
      agents: [ca.agentId],
      startDate: ca.startDate,
      startTime: ca.startTime,
      endDate: ca.endDate,
      endTime: ca.endTime,
      priority: 'Medium',
      status: ca.status,
      type: 'channel',
      dept: ca.dept
    }))
  ];

  if (allRules.length === 0) {
    body.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--ink-faint);padding:20px;">No assignment or routing rules configured.</td></tr>`;
    return;
  }

  const now = new Date();

  body.innerHTML = allRules.map(r => {
    let agentsNames = "";
    if (r.type === 'skill') {
      agentsNames = r.agents.map(aid => {
        const a = AGENTS.find(x => x.id === aid);
        return a ? a.name : aid;
      }).join(', ');
    } else {
      const a = AGENTS.find(x => x.id === r.agents[0]);
      agentsNames = a ? `${a.name} (${r.dept})` : r.agents[0];
    }

    const start = new Date(`${r.startDate}T${r.startTime}:00`);
    const end = new Date(`${r.endDate}T${r.endTime}:00`);

    let currentStatus = r.status;
    if (r.status === 'Active' && (now < start || now > end)) {
      currentStatus = now > end ? 'Expired' : 'Scheduled';
    }

    let statusClass = 'status-badge status-Resolved'; // green/Active
    if (currentStatus === 'Paused') statusClass = 'status-badge status-Closed'; // grey
    else if (currentStatus === 'Expired') statusClass = 'status-badge status-Closed'; // grey
    else if (currentStatus === 'Scheduled') statusClass = 'status-badge status-Open'; // blue

    const activePeriod = `${r.startDate} ${r.startTime} to ${r.endDate} ${r.endTime}`;
    const statusBtnText = r.status === 'Active' ? 'Pause' : 'Activate';

    const typeBadge = r.type === 'skill'
      ? `<span class="status-badge" style="background:var(--purple-tint); color:var(--purple); border: 1px solid var(--purple-badge); font-size:10px; padding: 2px 6px;">Skill Routing</span>`
      : `<span class="status-badge" style="background:#E2E8F0; color:#475569; border: 1px solid var(--line); font-size:10px; padding: 2px 6px;">Channel Assignment</span>`;

    const toggleAction = r.type === 'skill' ? `toggleRuleStatus('${r.id}')` : `toggleChannelAssignmentStatus('${r.id}')`;
    const deleteAction = r.type === 'skill' ? `deleteRule('${r.id}')` : `deleteChannelAssignment('${r.id}')`;

    return `
      <tr>
        <td>${typeBadge}</td>
        <td style="font-weight: 600; color: #0F172A;">${r.name}</td>
        <td><span class="chan-badge chan-badge-${r.skill.toLowerCase()}" style="background:#E2E8F0; color:#475569; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${r.skill}</span></td>
        <td>${agentsNames}</td>
        <td><span class="pri-badge pri-${r.priority}">${r.priority}</span></td>
        <td style="font-size:12px; color:var(--ink-soft);">${activePeriod}</td>
        <td><span class="${statusClass}">${currentStatus}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-ghost btn-sm" onclick="${toggleAction}" style="margin-right: 4px;" ${currentStatus === 'Expired' ? 'disabled' : ''}>${statusBtnText}</button>
          <button class="btn btn-ghost btn-sm" onclick="${deleteAction}" style="color: var(--red);">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddRuleModal() {
  const skillSelect = document.getElementById('ruleSkill');
  if (skillSelect) {
    skillSelect.innerHTML = '<option value="">Select Category</option>';
    const categories = [];
    if (typeof DEPT_CAT_SUBCAT !== 'undefined') {
      Object.values(DEPT_CAT_SUBCAT).forEach(catObj => {
        Object.keys(catObj).forEach(c => {
          if (!categories.includes(c)) categories.push(c);
        });
      });
    } else {
      categories.push('KYC Verification', 'Disbursement Pending', 'Repayment related', 'Auto Debit related', 'General Query');
    }
    categories.forEach(c => {
      skillSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
  }

  const agentSelect = document.getElementById('ruleAgents');
  if (agentSelect) {
    agentSelect.innerHTML = '';
    AGENTS.forEach(a => {
      agentSelect.innerHTML += `<option value="${a.id}">${a.name}</option>`;
    });
  }

  document.getElementById('ruleName').value = '';
  document.getElementById('rulePriority').value = 'Medium';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('ruleStartDate').value = today;
  document.getElementById('ruleEndDate').value = today;
  document.getElementById('ruleStartTime').value = '09:00';
  document.getElementById('ruleEndTime').value = '18:00';

  const modal = document.getElementById('modalAddRule');
  modal.classList.add('show');
  enhanceAllSelects(modal);
}

function saveAssignmentRule() {
  const name = document.getElementById('ruleName').value.trim();
  const skill = document.getElementById('ruleSkill').value;
  const priority = document.getElementById('rulePriority').value;
  const startD = document.getElementById('ruleStartDate').value;
  const startT = document.getElementById('ruleStartTime').value;
  const endD = document.getElementById('ruleEndDate').value;
  const endT = document.getElementById('ruleEndTime').value;

  const agentSelect = document.getElementById('ruleAgents');
  const selectedAgents = Array.from(agentSelect.selectedOptions).map(o => o.value);

  if (!name || !skill || selectedAgents.length === 0 || !startD || !startT || !endD || !endT) {
    showToast('Please fill in all fields and select at least one agent.');
    return;
  }

  const newRule = {
    id: 'r_' + Date.now(),
    name,
    skill,
    agents: selectedAgents,
    startDate: startD,
    startTime: startT,
    endDate: endD,
    endTime: endT,
    priority,
    status: 'Active'
  };

  ASSIGNMENT_RULES.push(newRule);
  closeModal('modalAddRule');
  showToast('Skill-based routing rule created successfully.');
  renderTeamStatus();
  renderAssignmentRules();
}

function toggleRuleStatus(id) {
  const r = ASSIGNMENT_RULES.find(x => x.id === id);
  if (r) {
    r.status = r.status === 'Active' ? 'Paused' : 'Active';
    showToast(`Rule "${r.name}" has been ${r.status.toLowerCase()}.`);
    renderAssignmentRules();
    renderTeamStatus();
  }
}

function deleteRule(id) {
  const idx = ASSIGNMENT_RULES.findIndex(x => x.id === id);
  if (idx > -1) {
    const r = ASSIGNMENT_RULES[idx];
    ASSIGNMENT_RULES.splice(idx, 1);
    showToast(`Rule "${r.name}" deleted.`);
    renderAssignmentRules();
    renderTeamStatus();
  }
}
function managerChangeStatus(agentId, newStatus) {
  const a = changeAgentStatus(agentId, newStatus, 'manager', CURRENT_MANAGER_NAME, 'manual override');
  showToast(`${a.name}'s status set to ${newStatus} by manager`);
  renderTeamStatus();
  if (agentId === CURRENT_AGENT_ID) refreshHeaderStatus();
}
function togglePauseAssignment(agentId, checked) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a || a.onLeave) return;
  a.paused = checked;
  a.log.unshift({ ts: Date.now(), text: checked ? 'Ticket assignment paused by manager' : 'Ticket assignment resumed by manager', actor: CURRENT_MANAGER_NAME, by: 'manager' });
  showToast(`${a.name}'s ticket assignment ${checked ? 'paused' : 'resumed'}`);
  renderTeamStatus();
}
let leaveModalAgentId = null;
function handleLeaveCheckbox(agentId, checked) {
  if (checked) openLeaveModal(agentId);
  else endLeave(agentId);
}
function openLeaveModal(agentId) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a) return;
  leaveModalAgentId = agentId;
  document.getElementById('leaveAgentInfo').textContent = `Scheduling leave for ${a.name} — ticket assignment will be automatically paused for the leave period.`;
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('leaveFromDate').value = a.leaveFrom || today;
  document.getElementById('leaveFromTime').value = a.leaveFromTime || '09:00';
  document.getElementById('leaveToDate').value = a.leaveTo || today;
  document.getElementById('leaveToTime').value = a.leaveToTime || '18:00';
  document.getElementById('leaveReasonInput').value = a.leaveReason || '';
  document.getElementById('modalLeave').classList.add('show');
}
function closeLeaveModal() {
  document.getElementById('modalLeave').classList.remove('show');
  leaveModalAgentId = null;
  renderTeamStatus();
}
function submitLeaveForm() {
  const a = AGENTS.find(x => x.id === leaveModalAgentId);
  if (!a) return;
  const fromDate = document.getElementById('leaveFromDate').value;
  const fromTime = document.getElementById('leaveFromTime').value;
  const toDate = document.getElementById('leaveToDate').value;
  const toTime = document.getElementById('leaveToTime').value;
  const reason = document.getElementById('leaveReasonInput').value.trim();
  if (!fromDate || !toDate) { showToast('Select both a from and to date to continue'); return; }
  if (new Date(toDate + 'T' + (toTime || '00:00')) < new Date(fromDate + 'T' + (fromTime || '00:00'))) {
    showToast('Leave end must be after the start'); return;
  }
  a.onLeave = true;
  a.paused = true;
  a.leaveFrom = fromDate; a.leaveFromTime = fromTime;
  a.leaveTo = toDate; a.leaveToTime = toTime;
  a.leaveReason = reason;
  const rangeTxt = fmtLeaveRange(a);
  a.log.unshift({ ts: Date.now(), text: `Ticket assignment automatically paused — On Leave (${rangeTxt})${reason ? ' — ' + reason : ''}`, actor: CURRENT_MANAGER_NAME, by: 'manager' });
  changeAgentStatus(a.id, 'Offline', 'manager', CURRENT_MANAGER_NAME, `on leave ${rangeTxt}`);
  document.getElementById('modalLeave').classList.remove('show');
  leaveModalAgentId = null;
  showToast(`${a.name} marked On Leave from ${fromDate} to ${toDate}`);
  renderTeamStatus();
  if (a.id === CURRENT_AGENT_ID) refreshHeaderStatus();
}
function endLeave(agentId) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a) return;
  a.onLeave = false;
  a.paused = false;
  a.leaveFrom = null; a.leaveFromTime = null; a.leaveTo = null; a.leaveToTime = null; a.leaveReason = null;
  a.log.unshift({ ts: Date.now(), text: 'Leave ended by manager — ticket assignment resumed automatically', actor: CURRENT_MANAGER_NAME, by: 'manager' });
  changeAgentStatus(agentId, 'Available', 'manager', CURRENT_MANAGER_NAME, 'returned from leave');
  showToast(`${a.name} returned from leave — assignment resumed`);
  renderTeamStatus();
  if (agentId === CURRENT_AGENT_ID) refreshHeaderStatus();
}
document.getElementById('modalLeave').addEventListener('click', e => {
  if (e.target.id === 'modalLeave') closeLeaveModal();
});
function openAgentLog(agentId) {
  const a = AGENTS.find(x => x.id === agentId);
  if (!a) return;
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
  { id: 'tpl1', channel: 'Chat', title: 'Greeting — opening', body: "Hi {{customer}}, thanks for reaching out! I'm pulling up your account now — one moment please." },
  { id: 'tpl2', channel: 'Chat', title: 'Ask for more info', body: "Could you share a few more details (loan ID, screenshot, or date of the transaction) so I can look into this quickly?" },
  { id: 'tpl3', channel: 'Chat', title: 'Investigating', body: "I've found your account and I'm reviewing the transaction history now — I'll update you shortly." },
  { id: 'tpl4', channel: 'Chat', title: 'Resolved — closing', body: "This has been resolved on our end. Is there anything else I can help you with today?" },
  { id: 'tpl5', channel: 'Chat', title: 'Repayment tenure options', body: "We currently offer 6, 9 and 12-month repayment tenures — you can change this anytime from Loan > Manage EMI in the app." },
  // WhatsApp
  { id: 'tpl6', channel: 'WhatsApp', title: 'Greeting — opening', body: "Hi {{customer}}, sorry for the trouble — pulling up your loan account now." },
  { id: 'tpl7', channel: 'WhatsApp', title: 'Refund initiated', body: "Confirmed the duplicate charge — a refund has been initiated and should reflect in 3–5 business days." },
  { id: 'tpl8', channel: 'WhatsApp', title: 'KYC re-upload help', body: "Please re-upload your document in good lighting with all four corners visible — this usually resolves the blur rejection." },
  { id: 'tpl9', channel: 'WhatsApp', title: 'Escalated to specialist team', body: "I've escalated this to our specialist team with priority — you'll hear back within 24 hours." },
  { id: 'tpl10', channel: 'WhatsApp', title: 'Payment reminder', body: "Reminder: your EMI of ₹{{amount}} is due on {{date}}. Reply PAY to get a quick payment link." },
  // SMS
  { id: 'tpl11', channel: 'SMS', title: 'Short acknowledgement', body: "Hi {{customer}}, we've received your query (Ref: {{ticket}}) and are looking into it. We'll update you shortly." },
  { id: 'tpl12', channel: 'SMS', title: 'OTP / verification help', body: "For account verification issues, please ensure your registered mobile number is active and retry after 5 minutes." },
  { id: 'tpl13', channel: 'SMS', title: 'Payment confirmation', body: "Your EMI payment has been received. Thank you for banking with Lenditt." },
  { id: 'tpl14', channel: 'SMS', title: 'Escalation notice', body: "Your issue has been escalated (Ref: {{ticket}}). Our team will call you within 24 hours." },
  // Email
  { id: 'tpl15', channel: 'Email', title: 'Formal acknowledgement', body: "Dear {{customer}},\n\nThank you for contacting Lenditt Support. We've logged your request under reference {{ticket}} and are reviewing it. We'll respond with an update within one business day.\n\nRegards,\nLenditt Customer Support" },
  { id: 'tpl16', channel: 'Email', title: 'Refund confirmation', body: "Dear {{customer}},\n\nWe've confirmed the duplicate charge on your account and initiated a refund. Please allow 3–5 business days for it to reflect in your original payment method.\n\nRegards,\nLenditt Customer Support" },
  { id: 'tpl17', channel: 'Email', title: 'KYC document request', body: "Dear {{customer}},\n\nTo proceed with your KYC verification, please re-upload a clear photo of your document with all four corners visible and no glare.\n\nRegards,\nLenditt Customer Support" },
  { id: 'tpl18', channel: 'Email', title: 'Closing / resolution', body: "Dear {{customer}},\n\nWe're confirming that the issue reported under {{ticket}} has now been resolved. Please let us know if you have any further questions.\n\nRegards,\nLenditt Customer Support" },
];
function fillTemplate(body, t) {
  return body.replace(/\{\{customer\}\}/g, t.customer).replace(/\{\{ticket\}\}/g, t.id).replace(/\{\{amount\}\}/g, '—').replace(/\{\{date\}\}/g, '—');
}

/* ---- Email composer configuration ----
   NOTE: "From" list below is a placeholder set of department outbound
   aliases — swap in the authorized admin email list once it's provided. */
const LENDITT_LOGO_SVG = `<svg viewBox="0 0 135 34" height="28" style="vertical-align:middle; display:inline-block;" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="13" height="13" rx="3.5" fill="#FF5A60" /><rect x="9" y="12" width="13" height="13" rx="3.5" fill="#00C0D4" /><text x="30" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="21" fill="#1B2A6B" letter-spacing="-0.5">Lenditt</text><circle cx="107" cy="11" r="4" stroke="#1B2A6B" stroke-width="0.9" fill="none" /><text x="105.2" y="13.2" font-family="Arial, sans-serif" font-size="5.5" font-weight="bold" fill="#1B2A6B">R</text></svg>`;

const CHINMAY_LOGO_SVG = `<svg viewBox="0 0 160 34" height="26" style="vertical-align:middle; display:inline-block;" xmlns="http://www.w3.org/2000/svg"><g transform="translate(1, 2)"><path d="M15 1 A 12 12 0 1 0 22 21 L 17 18 A 6 6 0 1 1 15 6 L 22 6 L 22 1 Z" fill="#9E1B22" /><rect x="7" y="10" width="14" height="2.5" fill="#FFFFFF" /></g><text x="32" y="15" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12.5" fill="#111827" letter-spacing="0.8">CHINMAY</text><text x="32" y="25" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="7.5" fill="#4B5563" letter-spacing="1">FINLEASE LIMITED</text></svg>`;

const EMAIL_FROM_OPTIONS = [
  {
    id: 'supp_lenditt',
    email: 'support@lenditt.com',
    dept: 'Support',
    company: 'Lenditt',
    signature: `<div class="email-sig-block" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: #000000; margin-top: 14px;">
  <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 6px;">
    <span style="font-size: 14px; font-weight: 700; color: #000000;">Support Team</span>
    ${LENDITT_LOGO_SVG}
  </div>
  <div style="width: 220px; height: 2px; background-color: #E53935; margin: 4px 0 8px 0;"></div>
  <div style="margin-bottom: 3px;">
    <a href="http://www.lenditt.com/" target="_blank" style="color: #0066CC; font-weight: 700; text-decoration: underline;">www.lenditt.com</a>
  </div>
  <div>
    <span style="color: #0066CC;">Email- </span><a href="mailto:Support@lenditt.com" style="color: #0066CC; text-decoration: underline;">Support@lenditt.com</a>
  </div>
</div>`
  },
  {
    id: 'coll_lenditt',
    email: 'collections@lenditt.com',
    dept: 'Collection',
    company: 'Lenditt',
    signature: `<div class="email-sig-block" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: #000000; margin-top: 14px;">
  <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 6px;">
    <span style="font-size: 14px; font-weight: 700; color: #000000;">Collections Team</span>
    ${LENDITT_LOGO_SVG}
  </div>
  <div style="width: 220px; height: 2px; background-color: #E53935; margin: 4px 0 8px 0;"></div>
  <div style="margin-bottom: 3px;">
    <a href="http://www.lenditt.com/" target="_blank" style="color: #0066CC; font-weight: 700; text-decoration: underline;">www.lenditt.com</a>
  </div>
  <div>
    <span style="color: #0066CC;">Email- </span><a href="mailto:collections@lenditt.com" style="color: #0066CC; text-decoration: underline;">collections@lenditt.com</a>
  </div>
</div>`
  },
  {
    id: 'coll_chinmay',
    email: 'collections@chinmayfinlease.com',
    dept: 'Collection',
    company: 'Chinmay Finlease',
    signature: `<div class="email-sig-block" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: #000000; margin-top: 14px;">
  <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 6px;">
    <span style="font-size: 14px; font-weight: 700; color: #000000;">Collections Team</span>
    ${CHINMAY_LOGO_SVG}
  </div>
  <div style="width: 220px; height: 2px; background-color: #E53935; margin: 4px 0 8px 0;"></div>
  <div style="font-weight: 700; color: #000000; margin-bottom: 4px;">Chinmay Finlease Limited</div>
  <div style="margin-bottom: 4px;">
    <span style="color: #000000;">E: </span><a href="mailto:collections@chinmayfinlease.com" style="color: #0066CC; text-decoration: underline;">collections@chinmayfinlease.com</a>
  </div>
  <div>
    <a href="http://www.chinmayfinlease.com/" target="_blank" style="color: #0066CC; text-decoration: underline;">www.chinmayfinlease.com</a>
  </div>
</div>`
  },
  {
    id: 'legal_chinmay',
    email: 'legal@chinmayfinlease.com',
    dept: 'Legal Related',
    company: 'Chinmay Finlease',
    signature: `<div class="email-sig-block" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: #000000; margin-top: 14px;">
  <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 6px;">
    <span style="font-size: 14px; font-weight: 700; color: #000000;">Legal Team</span>
    ${CHINMAY_LOGO_SVG}
  </div>
  <div style="width: 220px; height: 2px; background-color: #E53935; margin: 4px 0 8px 0;"></div>
  <div style="font-weight: 700; color: #000000; margin-bottom: 4px;">Chinmay Finlease Limited</div>
  <div style="margin-bottom: 4px;">
    <span style="color: #000000;">E: </span><a href="mailto:legal@chinmayfinlease.com" style="color: #0066CC; text-decoration: underline;">legal@chinmayfinlease.com</a>
  </div>
  <div>
    <a href="http://www.chinmayfinlease.com/" target="_blank" style="color: #0066CC; text-decoration: underline;">www.chinmayfinlease.com</a>
  </div>
</div>`
  },
  {
    id: 'supp_chinmay',
    email: 'support@chinmayfinlease.com',
    dept: 'Support',
    company: 'Chinmay Finlease',
    signature: `<div class="email-sig-block" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: #000000; margin-top: 14px;">
  <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 6px;">
    <span style="font-size: 14px; font-weight: 700; color: #000000;">Support Team</span>
    ${CHINMAY_LOGO_SVG}
  </div>
  <div style="width: 220px; height: 2px; background-color: #E53935; margin: 4px 0 8px 0;"></div>
  <div style="font-weight: 700; color: #000000; margin-bottom: 4px;">Chinmay Finlease Limited</div>
  <div style="margin-bottom: 4px;">
    <span style="color: #000000;">E: </span><a href="mailto:Support@chinmayfinlease.com" style="color: #0066CC; text-decoration: underline;">Support@chinmayfinlease.com</a>
  </div>
  <div>
    <a href="http://www.chinmayfinlease.com/" target="_blank" style="color: #0066CC; text-decoration: underline;">www.chinmayfinlease.com</a>
  </div>
</div>`
  }
];

function getSignatureForFromEmail(fromEmail) {
  const found = EMAIL_FROM_OPTIONS.find(o => o.email.toLowerCase() === (fromEmail || '').toLowerCase());
  return found ? found.signature : EMAIL_FROM_OPTIONS[0].signature;
}

function signatureForTicket(t, fromEmail) {
  if (fromEmail) return getSignatureForFromEmail(fromEmail);
  const dept = (t.department || t.queue || 'Support');
  const match = EMAIL_FROM_OPTIONS.find(o => o.dept.toLowerCase() === dept.toLowerCase()) || EMAIL_FROM_OPTIONS[0];
  return match.signature;
}

function deptFromEmail(email) {
  const o = EMAIL_FROM_OPTIONS.find(x => x.email.toLowerCase() === (email || '').toLowerCase());
  return o ? o.email : 'support@lenditt.com';
}

const CUSTOMERS = [
  { name: 'Amul Roy', phone: '+1 416 555 0101' },
  { name: 'Advard', phone: '+1 647 555 0119' },
  { name: 'Devansh Rao', phone: '+1 905 555 0134' },
  { name: 'Vedant', phone: '+1 416 555 0177' },
  { name: 'Arvin White', phone: '+1 437 555 0188' },
  { name: 'Alisa', phone: '+1 416 555 0199' },
];

function daysAgo(n, h, m) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d; }

let TICKETS = [
  {
    id: 'TCK-10231', subject: 'EMI deducted twice this month', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'WhatsApp', priority: 'High', status: 'Assigned', queue: 'Collections', department: 'Collections', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a1', updated: '12m ago', slaMins: 38, category: 'EMI / Repayment', loanId: 'LN-44018', loanStage: 'EMI active', createdAt: daysAgo(0, 10, 2),
    thread: [
      { dir: 'in', text: "Hi, my EMI got deducted twice this month for the same loan. Can you check?", chan: 'WhatsApp', time: '10:02 AM' },
      { dir: 'out', text: "Hi Amul, sorry for the trouble — pulling up your loan account now.", chan: 'WhatsApp', time: '10:05 AM' },
      { dir: 'in', text: "Thanks, reference should be on the app under transaction history.", chan: 'WhatsApp', time: '10:06 AM' },
    ],
    activity: ['Ticket created via WhatsApp — auto-routed to Collections', 'Auto-assigned to Riya Sen', 'Status set to Assigned']
  },

  {
    id: 'TCK-10232', subject: 'KYC document re-upload not working', customer: 'Advard', phone: '+1 647 555 0119', email: 'advard@gmail.com', channel: 'Email', priority: 'Medium', status: 'Assigned', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Tapstart', source: 'Lenditt', assignee: 'a2', updated: '26m ago', slaMins: 180, category: 'KYC', loanId: 'LN-50102', loanStage: 'KYC pending', createdAt: daysAgo(0, 9, 40),
    thread: [
      { dir: 'in', text: "I tried re-uploading my Aadhaar 3 times, the app keeps rejecting it as blurry.", chan: 'Email', time: '9:40 AM' },
    ],
    activity: ['Ticket created via Email', 'Assigned to Karan Mehta']
  },

  {
    id: 'TCK-10233', subject: 'Loan disbursal delayed beyond promised time', customer: 'Devansh Rao', phone: '+1 905 555 0134', email: 'devansh.rao@gmail.com', channel: 'Call', priority: 'High', status: 'Escalated', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Tapstart', source: 'ONDC App', assignee: 'a3', updated: '4m ago', slaMins: -22, category: 'Loan Disbursal', createdAt: daysAgo(0, 7, 15),
    thread: [
      { dir: 'in', text: "Called in — customer says approval came through 2 days ago but funds haven't arrived.", chan: 'Call', time: '9:12 AM', call: true },
      { dir: 'out', text: "Escalating to disbursal ops with account reference for priority processing.", chan: 'Call', time: '9:20 AM' },
    ],
    activity: ['Ticket created via inbound call', 'Call recording + summary attached', 'Escalated to Manager — SLA at risk', 'Priority raised to High']
  },

  {
    id: 'TCK-10234', subject: 'Wants to know repayment tenure options', customer: 'Vedant', phone: '+1 416 555 0177', email: 'vedant@gmail.com', channel: 'Chat', priority: 'Low', status: 'unassigned', queue: 'Customer Support', department: 'Customer Support', intraDepartment: 'Sales', nbfcPartner: 'Chinmay', source: 'ONDC App', assignee: '', updated: '2m ago', slaMins: 1420, category: 'General Query', createdAt: daysAgo(0, 11, 25),
    thread: [
      { dir: 'in', text: "Hey! Does Lenditt offer a 6-month repayment option or only 12?", chan: 'Chat', time: '11:01 AM' },
    ],
    activity: ['Ticket created via in-app chat', 'Unassigned query in queue', 'Intra department set to Sales — SLA & FRT calculations stopped']
  },

  {
    id: 'TCK-10235', subject: 'Complaint about collections call tone', customer: 'Arvin White', phone: '+1 437 555 0188', email: 'arvin.white@gmail.com', channel: 'Call', priority: 'High', status: 'Waiting from customer', queue: 'Grievance', department: 'Grievance', intraDepartment: 'None', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a5', updated: '1h ago', slaMins: 95, category: 'Grievance', createdAt: daysAgo(0, 8, 0),
    thread: [
      { dir: 'in', text: "I want to file a complaint about how I was spoken to on a collections call yesterday.", chan: 'Call', time: 'Yesterday, 4:32 PM', call: true },
      { dir: 'out', text: "I'm very sorry to hear that. I've logged this as a formal grievance and I'm pulling the call recording to review.", chan: 'Call', time: 'Yesterday, 4:40 PM' },
      { dir: 'note', text: "Call recording reviewed — flagging agent for QA coaching. Awaiting customer confirmation of resolution.", chan: 'Internal', time: 'Today, 9:15 AM' },
    ],
    activity: ['Ticket created via inbound call', 'Routed to Grievance queue', 'Assigned to Priya Nair', 'Internal note added']
  },

  {
    id: 'TCK-10236', subject: 'Refund for double processing fee', customer: 'Alisa', phone: '+1 416 555 0199', email: 'alisa@gmail.com', channel: 'WhatsApp', priority: 'Medium', status: 'Resolved', queue: 'Customer Support', department: 'Customer Support', intraDepartment: 'None', nbfcPartner: 'Lenditt', source: 'Lenditt', assignee: 'a2', updated: '3h ago', slaMins: 600, category: 'EMI / Repayment', createdAt: daysAgo(1, 14, 30),
    thread: [
      { dir: 'in', text: "Processing fee was charged twice on my last loan. Please refund.", chan: 'WhatsApp', time: '8:10 AM' },
      { dir: 'out', text: "Confirmed the duplicate charge — refund of the extra fee has been initiated, should reflect in 3-5 business days.", chan: 'WhatsApp', time: '8:44 AM' },
    ],
    activity: ['Ticket created via WhatsApp', 'Assigned to Karan Mehta', 'Refund initiated', 'Status changed to Resolved']
  },

  {
    id: 'TCK-10237', subject: 'Duplicate: EMI deducted twice', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', cc: 'accounts@chinmayfinlease.com', channel: 'Email', priority: 'Medium', status: 'Reopened', queue: 'Collections', department: 'Collections', intraDepartment: 'Collection', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a1', updated: '8m ago', slaMins: 150, category: 'EMI / Repayment', loanId: 'LN-44018', loanStage: 'EMI active', createdAt: daysAgo(0, 10, 3),
    thread: [
      { dir: 'in', text: "Following up by email in case WhatsApp doesn't reach the right team — double EMI deduction issue.", cc: 'accounts@chinmayfinlease.com', chan: 'Email', time: '10:15 AM' },
    ],
    activity: ['Ticket created via Email', 'Assigned to Riya Sen', 'Flagged as likely duplicate of TCK-10231', 'Intra department set to Collection — SLA & FRT calculations stopped']
  },

  {
    id: 'TCK-10238', subject: 'App crashes on loan application step 3', customer: 'Advard', phone: '+1 647 555 0119', email: 'advard@gmail.com', channel: 'Chat', priority: 'Low', status: 'Hold', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Tapstart', source: 'ONDC App', assignee: 'a4', updated: '50m ago', slaMins: 800, category: 'General Query', loanId: 'LN-50102', loanStage: 'KYC pending', createdAt: daysAgo(1, 16, 45),
    thread: [{ dir: 'in', text: "App keeps crashing when I try to submit my bank details. Using Android 14.", chan: 'Chat', time: '9:55 AM' }],
    activity: ['Ticket created via in-app chat', 'Assigned to Farhan Ali', 'On hold — pending engineering confirmation']
  },

  {
    id: 'TCK-10239', subject: 'WhatsApp follow-up on EMI mismatch', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'WhatsApp', priority: 'Medium', status: 'Assigned', queue: 'Collections', department: 'Collections', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a1', updated: '21m ago', slaMins: 220, category: 'Repayment', loanId: 'LN-44018', loanStage: 'EMI active', createdAt: daysAgo(0, 8, 45),
    thread: [{ dir: 'in', text: "Hi, I received a different EMI amount than expected on the WhatsApp confirmation sheet. Please clarify.", chan: 'WhatsApp', time: '8:45 AM' }],
    activity: ['Ticket created via WhatsApp', 'Assigned to Riya Sen', 'Customer requested payment clarification']
  },

  {
    id: 'TCK-10240', subject: 'Email query for loan status after missed payment', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'Email', priority: 'Low', status: 'unassigned', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Chinmay', source: 'Lenditt', assignee: '', updated: '1h ago', slaMins: 740, category: 'General query', loanId: 'LN-44018', loanStage: 'EMI active', createdAt: daysAgo(1, 11, 30),
    thread: [{ dir: 'in', text: "Could you confirm if my missed payment will affect my loan stage or current EMI schedule?", chan: 'Email', time: '11:30 AM' }],
    activity: ['Ticket created via Email', 'Queued to Customer Support']
  },

  {
    id: 'TCK-10241', subject: 'Chat follow-up: wrong settlement message', customer: 'Advard', phone: '+1 647 555 0119', email: 'advard@gmail.com', channel: 'Chat', priority: 'Medium', status: 'Assigned', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Tapstart', source: 'ONDC App', assignee: 'a2', updated: '39m ago', slaMins: 150, category: 'App not working', loanId: 'LN-50102', loanStage: 'KYC pending', createdAt: daysAgo(0, 6, 20),
    thread: [{ dir: 'in', text: "I got a message saying my application was approved, but the app still shows KYC pending. Please check.", chan: 'Chat', time: '6:20 AM' }],
    activity: ['Ticket created via in-app chat', 'Assigned to Karan Mehta', 'Customer flagged inconsistent app status']
  },

  {
    id: 'TCK-10242', subject: 'Call complaint about repayment reminder timing', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'Call', priority: 'High', status: 'Waiting from customer', queue: 'Grievance', department: 'Grievance', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a5', updated: '2h ago', slaMins: 95, category: 'Payment issue', loanId: 'LN-44018', loanStage: 'EMI active', createdAt: daysAgo(0, 4, 50),
    thread: [{ dir: 'in', text: "Called to complain that the repayment reminder was sent at 2 AM and the amount details were incorrect.", chan: 'Call', time: '4:50 AM', call: true }],
    activity: ['Inbound call received', 'Routed to Grievance queue', 'Awaiting customer confirmation']
  },

  {
    id: 'TCK-10274', subject: 'Pre-EMI calculation dispute', customer: 'Ramesh Kumar', phone: '+91 98765 43210', email: 'ramesh.k@gmail.com', channel: 'Email', priority: 'High', status: 'Assigned', queue: 'Collection', department: 'Collection', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a1', updated: '1h ago', slaMins: 40, createdAt: daysAgo(0, 9, 0),
    thread: [{ dir: 'in', text: "My pre-EMI interest was calculated at 30 days instead of 28. Please correct.", chan: 'Email', time: '9:00 AM' }],
    activity: ['Ticket created via Email', 'Assigned to Riya Sen']
  },
  {
    id: 'TCK-10275', subject: 'Unable to sign loan agreement via DigiLocker', customer: 'Sanjay Dutt', phone: '+91 98765 43211', email: 'sanjay.d@gmail.com', channel: 'WhatsApp', priority: 'Medium', status: 'Assigned', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Tapstart', source: 'Lenditt', assignee: 'a2', updated: '45m ago', slaMins: 220, createdAt: daysAgo(0, 10, 0),
    thread: [{ dir: 'in', text: "DigiLocker redirect fails with error code 502 Bad Gateway.", chan: 'WhatsApp', time: '10:00 AM' }],
    activity: ['Ticket created via WhatsApp', 'Assigned to Emma Watson']
  },
  {
    id: 'TCK-10276', subject: 'Interest rate mismatched in welcome letter', customer: 'Kareena Kapoor', phone: '+91 98765 43212', email: 'kareena.k@gmail.com', channel: 'Call', priority: 'High', status: 'Escalated', queue: 'Grievance', department: 'Grievance', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a5', updated: '15m ago', slaMins: -10, createdAt: daysAgo(0, 8, 0),
    thread: [{ dir: 'in', text: "Welcome letter shows 18% p.a. instead of the agreed 16% p.a. sanction.", chan: 'Call', time: '8:00 AM', call: true }],
    activity: ['Ticket created via Call', 'Escalated to Grievance Team']
  },
  {
    id: 'TCK-10277', subject: 'Refund status of failed autopay transaction', customer: 'Saif Ali', phone: '+91 98765 43213', email: 'saif.a@gmail.com', channel: 'Chat', priority: 'Low', status: 'unassigned', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Tapstart', source: 'ONDC App', assignee: '', updated: '5m ago', slaMins: 1400, createdAt: daysAgo(0, 11, 15),
    thread: [{ dir: 'in', text: "Autopay failed but amount was debited from my bank. When will it refund?", chan: 'Chat', time: '11:15 AM' }],
    activity: ['Ticket created via Chat', 'Unassigned query in queue']
  },
  {
    id: 'TCK-10278', subject: 'Duplicate EMI inquiry from WhatsApp', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'WhatsApp', priority: 'Medium', status: 'Merge', queue: 'Collections', department: 'Collections', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a1', updated: '20m ago', slaMins: 100, createdAt: daysAgo(0, 10, 4),
    thread: [{ dir: 'in', text: "Just wanted to make sure someone saw my earlier screenshot.", chan: 'WhatsApp', time: '10:18 AM', mergedFrom: 'TCK-10278' }],
    activity: ['Ticket created via WhatsApp', 'Merged into TCK-10231 by agent']
  },
  {
    id: 'TCK-10280', subject: 'CIBIL report show active status for closed loan', customer: 'Ranbir Kapoor', phone: '+91 98765 43216', email: 'ranbir.k@gmail.com', channel: 'WhatsApp', priority: 'High', status: 'Assigned', queue: 'Grievance', department: 'Grievance', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a5', updated: '30m ago', slaMins: 60, createdAt: daysAgo(0, 10, 15),
    thread: [{ dir: 'in', text: "Loan shows active on my CIBIL statement despite full payment in May. Please update.", chan: 'WhatsApp', time: '10:15 AM' }],
    activity: ['Ticket created via WhatsApp', 'Assigned to Priya Nair', 'Verification in progress']
  },
  {
    id: 'TCK-10281', subject: 'Incorrect late payment surcharge calculation', customer: 'Alia Bhatt', phone: '+91 98765 43217', email: 'alia.b@gmail.com', channel: 'Email', priority: 'Medium', status: 'Assigned', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Lenditt', source: 'Lenditt', assignee: 'a2', updated: '2h ago', slaMins: 180, createdAt: daysAgo(0, 9, 30),
    thread: [{ dir: 'in', text: "I was charged late fee of Rs 500 instead of Rs 250 as per the schedule.", chan: 'Email', time: '9:30 AM' }],
    activity: ['Ticket created via Email', 'Assigned to Emma Watson']
  },
  {
    id: 'TCK-10282', subject: 'Clarification on arbitration summons received', customer: 'Ranveer Singh', phone: '+91 98765 43218', email: 'ranveer.s@gmail.com', channel: 'Call', priority: 'High', status: 'Assigned', queue: 'Legal Related', department: 'Legal Related', nbfcPartner: 'Tapstart', source: 'ONDC App', assignee: 'a3', updated: '1h ago', slaMins: 120, createdAt: daysAgo(0, 10, 30),
    thread: [{ dir: 'in', text: "Arbitration notice received. Seeking legal cell contact detail.", chan: 'Call', time: '10:30 AM', call: true }],
    activity: ['Ticket created via Call', 'Assigned to Ananya Iyer']
  },
  {
    id: 'TCK-10283', subject: 'Auto-debit setup verification delay', customer: 'Deepika Padukone', phone: '+91 98765 43219', email: 'deepika.p@gmail.com', channel: 'Chat', priority: 'Low', status: 'unassigned', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Lenditt', source: 'Lenditt', assignee: '', updated: '8m ago', slaMins: 1410, createdAt: daysAgo(0, 11, 0),
    thread: [{ dir: 'in', text: "E-mandate registration shows pending for last 48 hours. Can I pay manually?", chan: 'Chat', time: '11:00 AM' }],
    activity: ['Ticket created via Chat', 'Unassigned query in queue']
  },
  {
    id: 'TCK-10284', subject: 'Loan foreclosure penalty waiver request', customer: 'Vicky Kaushal', phone: '+91 98765 43220', email: 'vicky.k@gmail.com', channel: 'WhatsApp', priority: 'Medium', status: 'Waiting from customer', queue: 'Collection', department: 'Collection', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a1', updated: '3h ago', slaMins: 400, createdAt: daysAgo(1, 9, 15),
    thread: [
      { dir: 'in', text: "Please waive the 2% foreclosure charges. I am ready to close my loan today.", chan: 'WhatsApp', time: 'Yesterday, 9:15 AM' },
      { dir: 'out', text: "We can offer a 50% waiver on foreclosure charges. Please confirm to generate payment link.", chan: 'WhatsApp', time: 'Yesterday, 10:30 AM' }
    ],
    activity: ['Ticket created via WhatsApp', 'Assigned to Riya Sen', 'Waiver terms shared']
  },
  {
    id: 'TCK-10285', subject: 'Interest computation detail documentation request', customer: 'Anushka Sharma', phone: '+91 98765 43221', email: 'anushka.s@gmail.com', channel: 'Email', priority: 'Low', status: 'Resolved', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Lenditt', source: 'Lenditt', assignee: 'a2', updated: '1d ago', slaMins: 900, createdAt: daysAgo(2, 14, 30),
    thread: [
      { dir: 'in', text: "Need day-count calculation statement sheet for interest billing audit.", chan: 'Email', time: '2 days ago' },
      { dir: 'out', text: "Dear Anushka, please find the attached interest computation spreadsheet.", chan: 'Email', time: 'Yesterday' }
    ],
    activity: ['Ticket created via Email', 'Spreadsheet shared with customer', 'Status changed to Resolved']
  },
  {
    id: 'TCK-10286', subject: 'Notice details clarification loan LN-7718', customer: 'Virat Kohli', phone: '+91 98765 43222', email: 'virat.k@gmail.com', channel: 'Call', priority: 'High', status: 'Resolved', queue: 'Legal Related', department: 'Legal Related', nbfcPartner: 'Tapstart', source: 'ONDC App', assignee: 'a3', updated: '2d ago', slaMins: 240, createdAt: daysAgo(2, 10, 0),
    thread: [
      { dir: 'in', text: "Received demand notice for EMI bounced on 5th. Bounced due to bank holiday.", chan: 'Call', time: '2 days ago', call: true },
      { dir: 'out', text: "Hi Virat, late charges waived as payment went through next working day. Record cleared.", chan: 'Email', time: 'Yesterday' }
    ],
    activity: ['Ticket created via Call', 'Assigned to Ananya Iyer', 'Surcharge reversed', 'Status changed to Resolved']
  },
  {
    id: 'TCK-10287', subject: 'App loading error during bank statement fetch', customer: 'KL Rahul', phone: '+91 98765 43223', email: 'kl.rahul@gmail.com', channel: 'Chat', priority: 'Medium', status: 'Closed', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Lenditt', source: 'Lenditt', assignee: 'a4', updated: '4d ago', slaMins: 720, createdAt: daysAgo(4, 9, 40),
    thread: [
      { dir: 'in', text: "Perfios netbanking statement verification times out on last page.", chan: 'Chat', time: '4 days ago' },
      { dir: 'out', text: "Hi Rahul, please try uploading PDF statement instead of netbanking log-in.", chan: 'Chat', time: '4 days ago' },
      { dir: 'in', text: "PDF verification went through successfully. Offer approved. Thanks!", chan: 'Chat', time: '4 days ago' }
    ],
    activity: ['Ticket created via Chat', 'Assigned to Farhan Ali', 'Perfios workaround shared', 'Status changed to Closed']
  },
  {
    id: 'TCK-10288', subject: 'Grievance dispute on recovery executive behavior', customer: 'Hardik Pandya', phone: '+91 98765 43224', email: 'hardik.p@gmail.com', channel: 'Email', priority: 'High', status: 'Closed', queue: 'Grievance', department: 'Grievance', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a5', updated: '5d ago', slaMins: 720, createdAt: daysAgo(5, 8, 30),
    thread: [
      { dir: 'in', text: "Agent visited my office without prior info and spoke rudely to reception.", chan: 'Email', time: '5 days ago' },
      { dir: 'out', text: "Dear Hardik, we have initiated formal disciplinary check against the agency representative. Very sorry for this behavior.", chan: 'Email', time: '4 days ago' },
      { dir: 'in', text: "Thanks for prompt action. Hope this does not repeat.", chan: 'Email', time: '4 days ago' }
    ],
    activity: ['Ticket created via Email', 'Assigned to Priya Nair', 'QA escalation logged', 'Agency penalised', 'Status changed to Closed']
  },
  {
    id: 'TCK-10289', subject: 'Incorrect ECS bounce charge recovery', customer: 'Jasprit Bumrah', phone: '+91 98765 43225', email: 'jasprit.b@gmail.com', channel: 'WhatsApp', priority: 'Medium', status: 'Closed', queue: 'Collection', department: 'Collection', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a1', updated: '3d ago', slaMins: 720, createdAt: daysAgo(3, 10, 30),
    thread: [
      { dir: 'in', text: "ECS bounced twice but was cleared on first call. Why two bounce charges?", chan: 'WhatsApp', time: '3 days ago' },
      { dir: 'out', text: "Hi Jasprit, bank triggered the bounce twice due to presentation limit. We have reversed one charge.", chan: 'WhatsApp', time: '3 days ago' },
      { dir: 'in', text: "Great, received the credit back.", chan: 'WhatsApp', time: '3 days ago' }
    ],
    activity: ['Ticket created via WhatsApp', 'Assigned to Riya Sen', 'Reversal processed', 'Status changed to Closed']
  },
  {
    id: 'TCK-10290', subject: 'Settlement terms extension request LN-2019', customer: 'Rohit Sharma', phone: '+91 98765 43226', email: 'rohit.s@gmail.com', channel: 'Call', priority: 'High', status: 'Resolved', queue: 'Legal Related', department: 'Legal Related', nbfcPartner: 'Tapstart', source: 'ONDC App', assignee: 'a3', updated: '1d ago', slaMins: 300, createdAt: daysAgo(2, 11, 15),
    thread: [
      { dir: 'in', text: "Requesting 7 days grace to pay the settled lump sum amount of Rs 25,000.", chan: 'Call', time: '2 days ago', call: true },
      { dir: 'out', text: "Dear Rohit, extension approved by legal lead. New payment deadline is 15th Aug.", chan: 'Email', time: 'Yesterday' }
    ],
    activity: ['Ticket created via Call', 'Assigned to Ananya Iyer', 'Settlement extension logged', 'Status changed to Resolved']
  },
  {
    id: 'TCK-10291', subject: 'App payment gate failure during repayment', customer: 'Shikhar Dhawan', phone: '+91 98765 43227', email: 'shikhar.d@gmail.com', channel: 'Chat', priority: 'Low', status: 'Closed', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Lenditt', source: 'Lenditt', assignee: 'a2', updated: '3d ago', slaMins: 1440, createdAt: daysAgo(3, 11, 45),
    thread: [
      { dir: 'in', text: "Razropay gateway crashes on checkout page. Balance was deducted but loan shows overdue.", chan: 'Chat', time: '3 days ago' },
      { dir: 'out', text: "Hi Shikhar, transaction has been manually reconciled and payment credit has been applied.", chan: 'Chat', time: '3 days ago' },
      { dir: 'in', text: "Awesome! Statement updated now.", chan: 'Chat', time: '3 days ago' }
    ],
    activity: ['Ticket created via Chat', 'Assigned to Emma Watson', 'Payment reconciled', 'Status changed to Closed']
  },
  {
    id: 'TCK-10292', subject: 'Legal notice timeline verification request', customer: 'Yuzvendra Chahal', phone: '+91 98765 43228', email: 'yuzi.c@gmail.com', channel: 'Email', priority: 'Medium', status: 'Closed', queue: 'Legal Related', department: 'Legal Related', nbfcPartner: 'Tapstart', source: 'ONDC App', assignee: 'a3', updated: '5d ago', slaMins: 720, createdAt: daysAgo(5, 9, 0),
    thread: [
      { dir: 'in', text: "Need confirmation of active notice letter details for case file clearance.", chan: 'Email', time: '5 days ago' },
      { dir: 'out', text: "Hi Yuzvendra, details confirm case withdrawal scheduled for next court hearing date.", chan: 'Email', time: '5 days ago' }
    ],
    activity: ['Ticket created via Email', 'Assigned to Ananya Iyer', 'Timelines confirmed', 'Status changed to Closed']
  },
  {
    id: 'TCK-10293', subject: 'Excess interest surcharge refund query', customer: 'Rishabh Pant', phone: '+91 98765 43229', email: 'rishabh.p@gmail.com', channel: 'WhatsApp', priority: 'High', status: 'Resolved', queue: 'Grievance', department: 'Grievance', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a5', updated: '1d ago', slaMins: 120, createdAt: daysAgo(1, 10, 0),
    thread: [
      { dir: 'in', text: "I was charged interest during system outage window. Please refund.", chan: 'WhatsApp', time: 'Yesterday, 10:00 AM' },
      { dir: 'out', text: "Hi Rishabh, confirmed the billing issue. We have reversed the extra interest charge.", chan: 'WhatsApp', time: 'Yesterday, 4:00 PM' }
    ],
    activity: ['Ticket created via WhatsApp', 'Assigned to Priya Nair', 'System outage interest reversed', 'Status changed to Resolved']
  },
  {
    id: 'TCK-10294', subject: 'Loan application basic details verification delay', customer: 'Shreyas Iyer', phone: '+91 98765 43230', email: 'shreyas.i@gmail.com', channel: 'Chat', priority: 'Low', status: 'Closed', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Lenditt', source: 'Lenditt', assignee: 'a4', updated: '4d ago', slaMins: 1440, createdAt: daysAgo(4, 10, 30),
    thread: [
      { dir: 'in', text: "Basic profile shows under review for 3 days. What is pending?", chan: 'Chat', time: '4 days ago' },
      { dir: 'out', text: "Hi Shreyas, profile has been approved. You can now proceed to select loan tenure.", chan: 'Chat', time: '4 days ago' }
    ],
    activity: ['Ticket created via Chat', 'Assigned to Farhan Ali', 'Verification completed', 'Status changed to Closed']
  },
  {
    id: 'TCK-10295', subject: 'NOC soft copy dispatch pending', customer: 'Ravindra Jadeja', phone: '+91 98765 43231', email: 'ravindra.j@gmail.com', channel: 'Email', priority: 'Medium', status: 'Closed', queue: 'Collection', department: 'Collection', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a1', updated: '1d ago', slaMins: 720, createdAt: daysAgo(2, 11, 0),
    thread: [
      { dir: 'in', text: "Request soft copy of NOC statement. Need it to apply for new credit card.", chan: 'Email', time: '2 days ago' },
      { dir: 'out', text: "Hi Ravindra, soft copy NOC has been sent. Original hard copy will arrive in 5 working days.", chan: 'Email', time: 'Yesterday' }
    ],
    activity: ['Ticket created via Email', 'Assigned to Riya Sen', 'NOC copy generated and sent', 'Status changed to Closed']
  },
  {
    id: 'TCK-10296', subject: 'Dispute on settlement schedule rate', customer: 'Mohammed Shami', phone: '+91 98765 43232', email: 'shami.m@gmail.com', channel: 'Call', priority: 'High', status: 'Closed', queue: 'Grievance', department: 'Grievance', nbfcPartner: 'Chinmay', source: 'Chinmay', assignee: 'a5', updated: '2d ago', slaMins: 240, createdAt: daysAgo(2, 14, 0),
    thread: [
      { dir: 'in', text: "Offered settlement rate is 50% principal, but collection executive demands 60%. Please verify.", chan: 'Call', time: '2 days ago', call: true },
      { dir: 'out', text: "Dear Mohammed, we have confirmed the 50% settlement rate. Revised clearance link shared.", chan: 'Email', time: 'Yesterday' }
    ],
    activity: ['Ticket created via Call', 'Assigned to Priya Nair', 'Dispute reviewed', 'Correct settlement rate applied', 'Status changed to Closed']
  },
  {
    id: 'TCK-10297', subject: 'Aadhaar signature verification failed error', customer: 'Ishant Sharma', phone: '+91 98765 43233', email: 'ishant.s@gmail.com', channel: 'Chat', priority: 'Low', status: 'Closed', queue: 'Customer Support', department: 'Customer Support', nbfcPartner: 'Lenditt', source: 'Lenditt', assignee: 'a2', updated: '3d ago', slaMins: 1440, createdAt: daysAgo(3, 15, 0),
    thread: [
      { dir: 'in', text: "Getting error: Aadhaar digital signature validation failed on submit.", chan: 'Chat', time: '3 days ago' },
      { dir: 'out', text: "Hi Ishant, NSDL backend signature was refreshed. Please re-sign now.", chan: 'Chat', time: '3 days ago' }
    ],
    activity: ['Ticket created via Chat', 'Assigned to Emma Watson']
  },
  {
    id: 'TCK-10298', subject: 'Legal desk case clearance reference number', customer: 'Umesh Yadav', phone: '+91 98765 43234', email: 'umesh.y@gmail.com', channel: 'Email', priority: 'Medium', status: 'Closed', queue: 'Legal Related', department: 'Legal Related', category: 'Legal Case Information', subCategory: 'Legal Case Information', assignee: 'a3', updated: '4d ago', slaMins: 720, createdAt: daysAgo(4, 16, 0),
    thread: [
      { dir: 'in', text: "Need legal case clearance reference code for court presentation.", chan: 'Email', time: '4 days ago' },
      { dir: 'out', text: "Hi Umesh, clearance code reference is CC-49204-MUM. Discharged officially.", chan: 'Email', time: '3 days ago' }
    ],
    activity: ['Ticket created via Email', 'Assigned to Ananya Iyer', 'Reference code shared', 'Status changed to Closed']
  },
  {
    id: 'TCK-10299', subject: 'Unable to link Aadhaar with loan account', customer: 'Sunil Gavaskar', phone: '+91 98765 43235', email: 'sunil.g@gmail.com', channel: 'WhatsApp', priority: 'High', status: 'unassigned', queue: 'Support', department: 'Support', category: 'KYC Verification', subCategory: 'Aadhaar Linking', assignee: '', updated: '2m ago', slaMins: -10, createdAt: daysAgo(0, 0, 15),
    thread: [
      { dir: 'in', text: "I am trying to link my Aadhaar card to my loan account, but getting OTP failure error continuously. Please help.", chan: 'WhatsApp', time: '15m ago', unread: true }
    ],
    activity: ['Ticket created via WhatsApp', 'Unassigned in Support queue']
  },
  {
    id: 'TCK-10300', subject: 'Repayment auto-debit failure penalty dispute', customer: 'Sachin Tendulkar', phone: '+91 98765 43236', email: 'sachin.t@gmail.com', channel: 'Chat', priority: 'Medium', status: 'Assigned', queue: 'Collection', department: 'Collection', category: 'Repayment', subCategory: 'Auto Debit related', assignee: 'a1', updated: '15m ago', slaMins: -30, createdAt: daysAgo(0, 0, 45),
    thread: [
      { dir: 'in', text: "My bank account had sufficient balance, but your auto debit failed and I was charged a penalty of Rs 500. This is incorrect.", chan: 'Chat', time: '45m ago', unread: true }
    ],
    activity: ['Ticket created via Chat', 'Assigned to Riya Sen']
  },
  {
    id: 'TCK-10301', subject: 'Foreclosure notice clarification request', customer: 'Rahul Dravid', phone: '+91 98765 43237', email: 'rahul.d@gmail.com', channel: 'Email', priority: 'High', status: 'Assigned', queue: 'Legal Related', department: 'Legal Related', category: 'Legal Case Information', subCategory: 'Legal Case Information', assignee: 'a3', updated: '30m ago', slaMins: 45, createdAt: daysAgo(0, 1, 10),
    thread: [
      { dir: 'in', text: "Received foreclosure warning letter LN-3910. I have already cleared all outstanding EMIs. Kindly clarify.", chan: 'Email', time: '1h 10m ago' },
      { dir: 'out', text: "Dear Rahul, we are verifying your payment logs with our bank portal. Please give us 2 hours.", chan: 'Email', time: '45m ago' }
    ],
    activity: ['Ticket created via Email', 'Assigned to Ananya Iyer', 'Under review']
  },
  {
    id: 'TCK-10302', subject: 'Dispute on recovery executive calling hours', customer: 'Sourav Ganguly', phone: '+91 98765 43238', email: 'sourav.g@gmail.com', channel: 'Call', priority: 'Low', status: 'Resolved', queue: 'Grievance', department: 'Grievance', category: 'Collection Related', subCategory: 'Collection Related', assignee: 'a5', updated: '1d ago', slaMins: -120, createdAt: daysAgo(1, 4, 0),
    thread: [
      { dir: 'in', text: "Recovery executive called me at 9:30 PM. RBI guidelines state calls are only allowed between 8 AM and 7 PM. I want to log a formal complaint.", chan: 'Call', time: '1d ago', call: true },
      { dir: 'out', text: "Dear Sourav, we sincerely apologize. The executive has been warned and your account is tagged as DNC.", chan: 'Email', time: '1d ago' }
    ],
    activity: ['Ticket created via Call', 'Assigned to Priya Nair', 'DNC flag activated', 'Status changed to Resolved']
  },
  {
    id: 'TCK-10303', subject: 'Incorrect welcome letter loan terms', customer: 'VVS Laxman', phone: '+91 98765 43239', email: 'vvs.l@gmail.com', channel: 'SMS', priority: 'Medium', status: 'Closed', queue: 'Support', department: 'Support', category: 'Loan Offer', subCategory: 'Tenure / EMI Schedule', assignee: 'a2', updated: '2d ago', slaMins: 360, createdAt: daysAgo(2, 5, 0),
    thread: [
      { dir: 'in', text: "Welcome letter shows interest rate as 14.5% instead of the agreed 13.5%. Please correct this document.", chan: 'SMS', time: '2d ago' },
      { dir: 'out', text: "Hi VVS, interest rate welcome letter has been corrected to 13.5% and resent to your email.", chan: 'SMS', time: '2d ago' }
    ],
    activity: ['Ticket created via SMS', 'Assigned to Farhan Ali', 'Correction verified', 'Status changed to Closed']
  },
  {
    id: 'TCK-10211', subject: 'Interest Rate Queries & Prepayment Option', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'Email', priority: 'Low', status: 'Closed', queue: 'Support', department: 'Support', category: 'Loan Offer', subCategory: 'Tenure / EMI Schedule', assignee: 'a2', updated: '5d ago', slaMins: 480, createdAt: daysAgo(5, 14, 30),
    thread: [
      { dir: 'in', text: "Hello team, I recently took a loan (LN-44018) from Chinmay Finlease. I would like to know if there are any charges if I prepay the loan amount early?", chan: 'Email', time: '2:30 PM' },
      { dir: 'out', text: "Hello Amul, thank you for writing to us. For early prepayment/foreclosure of loans, there are zero charges after 3 successful EMI payments. Before that, a nominal 2% charge applies on the outstanding principal.", chan: 'Email', time: '3:15 PM' },
      { dir: 'in', text: "Got it! Thanks. What is the current outstanding principal? Can you check?", chan: 'Email', time: '4:00 PM' },
      { dir: 'out', text: "The current outstanding principal is Rs 45,000. Your next EMI is due on Sept 1st.", chan: 'Email', time: '4:20 PM' },
      { dir: 'in', text: "Thanks for the details. I will prepay next month. You can close this query.", chan: 'Email', time: '5:00 PM' },
      { dir: 'out', text: "Thank you for choosing Lenditt, Amul! Closing this ticket now. Have a nice day.", chan: 'Email', time: '5:15 PM' }
    ],
    activity: ['Ticket created via Email', 'Assigned to Emma Watson', 'Prepayment terms shared', 'Outstanding balance verified', 'Status changed to Closed']
  },
  {
    id: 'TCK-10215', subject: 'Address update request in KYC', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'Chat', priority: 'Medium', status: 'Closed', queue: 'Support', department: 'Support', category: 'KYC Verification', subCategory: 'Address mismatch', assignee: 'a4', updated: '3d ago', slaMins: 360, createdAt: daysAgo(3, 11, 10),
    thread: [
      { dir: 'in', text: "Hi, I moved to a new apartment in Mumbai and need to update my billing address for the active loan.", chan: 'Chat', time: '11:10 AM' },
      { dir: 'out', text: "Hello Amul, I can help you with that. Please share a copy of your new Aadhaar card or rent agreement for verification.", chan: 'Chat', time: '11:15 AM' },
      { dir: 'in', text: "Sure, uploading my new Aadhaar card PDF.", chan: 'Chat', time: '11:20 AM', attachments: [{ name: 'Aadhaar_Mumbai_New.pdf', size: '420 KB', type: 'pdf' }] },
      { dir: 'out', text: "Thank you, Amul. I have verified the address (A-402, Sea Breeze, Mumbai) and updated it in our system. It will reflect in your profile shortly.", chan: 'Chat', time: '11:45 AM' },
      { dir: 'in', text: "Thanks a lot for the quick support! Appreciate it.", chan: 'Chat', time: '11:50 AM' },
      { dir: 'out', text: "You're welcome! Resolved. Please rate our service when prompted.", chan: 'Chat', time: '11:55 AM' }
    ],
    activity: ['Ticket created via Chat', 'Assigned to Farhan Ali', 'Aadhaar file received and verified', 'Address updated in LMS', 'Status changed to Closed']
  },
  {
    id: 'TCK-10304', subject: 'Repayment schedule mismatch on dashboard', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'Chat', priority: 'Medium', status: 'unassigned', queue: 'Support', department: 'Support', category: 'Loan Offer', subCategory: 'Tenure / EMI Schedule', assignee: '', updated: '5m ago', slaMins: 120, createdAt: daysAgo(0, 11, 45),
    thread: [
      { dir: 'in', text: "My active loan details on the dashboard show my next EMI date as Sept 5th, but my bank NACH shows auto debit on Sept 1st. Please clarify which one is correct.", chan: 'Chat', time: '11:45 AM' }
    ],
    activity: ['Ticket created via Chat', 'Unassigned query in Support queue']
  },
  {
    id: 'TCK-10305', subject: 'Delay in NOC document dispatch', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'SMS', priority: 'Low', status: 'Assigned', queue: 'Support', department: 'Support', category: 'NOC Related', subCategory: 'NOC Not Received', assignee: 'a2', updated: '15m ago', slaMins: 480, createdAt: daysAgo(0, 11, 30),
    thread: [
      { dir: 'in', text: "I closed my previous loan LN-3910 two weeks ago. When will I receive the No Objection Certificate (NOC) on my email?", chan: 'SMS', time: '11:30 AM' }
    ],
    activity: ['Ticket created via SMS', 'Assigned to Emma Watson']
  },
  {
    id: 'TCK-10306', subject: 'Legal notice query regarding penalty charges', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'Call', priority: 'High', status: 'Escalated', queue: 'Legal Related', department: 'Legal Related', category: 'Legal Case Information', subCategory: 'Legal Case Information', assignee: 'a3', updated: '30m ago', slaMins: -15, createdAt: daysAgo(0, 10, 0),
    thread: [
      { dir: 'in', text: "Customer called inquiring about penalty charges listed in the system message. Says it does not match the agreement term sheet.", chan: 'Call', time: '10:00 AM', call: true }
    ],
    activity: ['Ticket created via inbound call', 'Assigned to Ananya Iyer', 'Escalated to legal manager']
  },
  {
    id: 'TCK-10307', subject: 'Double processing fee deduction complaint', customer: 'Amul Roy', phone: '+1 416 555 0101', email: 'amul.roy@gmail.com', channel: 'Email', priority: 'High', status: 'Assigned', queue: 'Grievance', department: 'Grievance', category: 'Refund/Credit', subCategory: 'Refund Request', assignee: 'a5', updated: '45m ago', slaMins: 90, createdAt: daysAgo(0, 9, 30),
    thread: [
      { dir: 'in', text: "I noticed my bank statement shows two deductions for processing fees on my loan application. I want a refund of the duplicate amount immediately.", chan: 'Email', time: '9:30 AM' }
    ],
    activity: ['Ticket created via Email', 'Routed to Grievance queue', 'Assigned to Priya Nair']
  }
];

function getCustomerPhoto(name) {
  const photos = {
    'Amul Roy': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    'Ariel Elves': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    'Advard': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    'Nisha Verma': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    'Deepika Padukone': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    'Sachin Tendulkar': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
    'Rahul Dravid': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    'Sourav Ganguly': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120',
    'Sunil Gavaskar': 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=120',
    'VVS Laxman': 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=120'
  };
  return photos[name] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
}

function openCustomerProfile(name) {
  window.open(`customer_profile.html?customer=${encodeURIComponent(name)}`, '_blank');
}

let filterSlaBreachedOnly = false;
let managerFilterSlaBreachedOnly = false;
let slaSortMode = 'none'; // 'none', 'asc', 'desc'

function toggleSlaSort() {
  if (slaSortMode === 'none') {
    slaSortMode = 'asc';
  } else if (slaSortMode === 'asc') {
    slaSortMode = 'desc';
  } else {
    slaSortMode = 'none';
  }
  updateSlaSortUI();
  renderDetailList();
}

function updateSlaSortUI() {
  const btn = document.getElementById('dlSlaSortBtn');
  const icon = document.getElementById('dlSlaSortIcon');
  if (!btn || !icon) return;

  if (slaSortMode === 'asc') {
    btn.style.borderColor = 'var(--red)';
    btn.style.color = 'var(--red)';
    btn.style.background = 'var(--red-tint)';
    icon.innerHTML = '▲';
  } else if (slaSortMode === 'desc') {
    btn.style.borderColor = 'var(--blue)';
    btn.style.color = 'var(--blue)';
    btn.style.background = 'var(--blue-tint)';
    icon.innerHTML = '▼';
  } else {
    btn.style.borderColor = 'var(--line)';
    btn.style.color = 'var(--ink-soft)';
    btn.style.background = '#fff';
    icon.innerHTML = '↕';
  }
}

function toggleMessageReadState(ticketId, msgIndex) {
  const t = TICKETS.find(x => x.id === ticketId);
  if (!t) return;
  const m = t.thread[msgIndex];
  if (!m) return;
  m.unread = !m.unread;
  renderConvBody('thread');
  renderDetailList();
}

function updateHeaderSlaBadge() {
  const breachedCount = TICKETS.filter(t => t.slaMins < 0 && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const container = document.getElementById('headerSlaBreachBadge');
  if (!container) return;
  if (breachedCount > 0) {
    container.innerHTML = `
      <div class="header-sla-alert" onclick="triggerSlaBreachedFilter()">
        <span class="warning-icon">⚠️</span>
        <span class="alert-text">SLA Breached: <b>${breachedCount}</b> ${breachedCount === 1 ? 'ticket' : 'tickets'}</span>
      </div>
    `;
    container.style.display = 'flex';
  } else {
    container.style.display = 'none';
  }
}

function triggerSlaBreachedFilter() {
  if (currentRole === 'manager') {
    managerFilterSlaBreachedOnly = true;
    switchView('manageall');
    renderManageAll();
  } else {
    filterSlaBreachedOnly = true;
    const breached = TICKETS.filter(t => t.slaMins < 0 && t.status !== 'Resolved' && t.status !== 'Closed');
    if (breached.length > 0) {
      openTicket(breached[0].id);
    } else {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-detail').classList.add('active');
      renderDetailList();
    }
  }
}

function clearSlaBreachedFilter() {
  filterSlaBreachedOnly = false;
  renderDetailList();
}

function clearManagerSlaBreachedFilter() {
  managerFilterSlaBreachedOnly = false;
  renderManageAll();
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function getDateLabel(d) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return "Today";
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}

let selectedTicketId = null;
let activeConvChannels = ['Email', 'Chat', 'WhatsApp', 'SMS'];
function toggleConvChannel(chan) {
  const idx = activeConvChannels.indexOf(chan);
  if (idx > -1) {
    activeConvChannels.splice(idx, 1);
  } else {
    activeConvChannels.push(chan);
  }
  updateConvChannelUI();
  renderConvBody('thread');
}
function updateConvChannelUI() {
  const items = document.querySelectorAll('#channelLabels .cl-item');
  items.forEach(item => {
    const text = item.textContent.trim();
    if (activeConvChannels.includes(text)) {
      item.classList.add('selected');
      item.classList.remove('deselected');
    } else {
      item.classList.remove('selected');
      item.classList.add('deselected');
    }
  });
}
function toggleFullHistory(checked) {
  const el = document.getElementById('fullHistToggle');
  if (el) el.checked = checked;
  renderConvBody('thread');
}
let currentRole = 'agent';
let replyMode = 'reply';
let replyChannel = 'Chat';
let mergeSelectedId = null;
let bulkSelectedIds = new Set();

const STATUSES = ['unassigned', 'Assigned', 'Waiting from customer', 'Junk', 'Merge', 'Hold', 'Escalated', 'Resolved', 'Closed', 'Reopened'];
function fmtDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  const date = d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date} at ${time}`;
}

function getTicketClosedDate(t) {
  if (t.status !== 'Closed' && t.status !== 'Resolved') return null;
  if (t.thread && t.thread.length > 0) {
    const lastMsg = t.thread[t.thread.length - 1];
    const lastMsgDate = lastMsg.ts ? new Date(lastMsg.ts) : combineDateTime(t.createdAt, lastMsg.time);
    return new Date(lastMsgDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours after last message
  }
  return new Date(t.createdAt.getTime() + 24 * 60 * 60 * 1000); // 1 day after creation
}

function statusClass(s) { return 'status-' + s.replace(/[^a-zA-Z]/g, ''); }
function chanClass(c) { return 'chan-' + c.toLowerCase(); }
function initials(name) { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function agentName(id) { const a = AGENTS.find(x => x.id === id); return a ? a.name : '—'; }

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

    const extraContainer = document.getElementById('genericViewExtra');
    if (extraContainer) {
      if (targetKey === 'reports') {
        extraContainer.style.display = 'flex';
        extraContainer.innerHTML = `
          <div class="doc-card" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:24px; width:340px; text-align:left; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.025); transition:all 0.2s ease-in-out; display:flex; flex-direction:column; justify-content:space-between; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="background:#E7F1EF; color:#0F5C56; width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:bold;">
                  📄
                </div>
                <div>
                  <h4 style="margin:0; font-size:16px; font-weight:700; color:#1C2321;">BRD Document</h4>
                  <span style="font-size:11px; color:#8A938D; font-weight:600;">Microsoft Word (DOCX)</span>
                </div>
              </div>
              <p style="margin:0; font-size:13px; color:#5B655F; line-height:1.5;">Business Requirements Document outlining project objectives, stakeholders, user personas, in-scope & out-of-scope features, and SLA parameters.</p>
            </div>
            <a href="BRD.docx" download="BRD.docx" style="background:#0F5C56; color:#FFFFFF; text-decoration:none; text-align:center; padding:10px 16px; border-radius:8px; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; transition: background 0.15s;" onmouseover="this.style.background='#0A3E3A'" onmouseout="this.style.background='#0F5C56'">
              📥 Download BRD.docx
            </a>
          </div>
          <div class="doc-card" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:24px; width:340px; text-align:left; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.025); transition:all 0.2s ease-in-out; display:flex; flex-direction:column; justify-content:space-between; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <div style="background:#EEF2FF; color:#4F46E5; width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:bold;">
                  ⚙️
                </div>
                <div>
                  <h4 style="margin:0; font-size:16px; font-weight:700; color:#1C2321;">FRD Document</h4>
                  <span style="font-size:11px; color:#8A938D; font-weight:600;">Microsoft Word (DOCX)</span>
                </div>
              </div>
              <p style="margin:0; font-size:13px; color:#5B655F; line-height:1.5;">Functional Requirements Document detailing technical console design, interface mock specifications, use cases, API data models, and schemas.</p>
            </div>
            <a href="FRD.docx" download="FRD.docx" style="background:#4F46E5; color:#FFFFFF; text-decoration:none; text-align:center; padding:10px 16px; border-radius:8px; font-weight:600; font-size:13px; display:flex; align-items:center; justify-content:center; gap:8px; transition: background 0.15s;" onmouseover="this.style.background='#3730A3'" onmouseout="this.style.background='#4F46E5'">
              📥 Download FRD.docx
            </a>
          </div>
        `;
      } else {
        extraContainer.style.display = 'none';
        extraContainer.innerHTML = '';
      }
    }
  }
}

function returnToChatConsole() {
  const chatRailItem = document.getElementById('railItemChat');
  switchRailItem(chatRailItem, 'chat');
}

function handlePhoneSearch(val) {
  if (!val.trim()) return;
  const chatRailItem = document.getElementById('railItemChat');
  switchRailItem(chatRailItem, 'chat');
  switchView('tickets');
  document.getElementById('fSearch').value = val;
  renderTicketList();
}

/* =========================================================
   INNER CONSOLE NAV & VIEW SWITCHING
========================================================= */
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.subnav-item').forEach(n => n.classList.remove('active'));
  const highlightName = (name === 'kpi-report') ? 'kpi' : name;
  const item = document.querySelector(`.subnav-item[data-view="${highlightName}"]`);
  if (item) item.classList.add('active');
  if (name === 'dashboard') renderDashboard();
  if (name === 'manageall') renderManageAll();
  if (name === 'team') { renderTeamStatus(); renderAssignmentRules(); }
  if (name === 'kpi') filterKpi();
  if (name === 'queues') renderQueues();
  if (name === 'customers') renderCustomers();
}

function canBulkManage() {
  return true;
}
function setRole(role) {
  currentRole = role;
  document.getElementById('roleAgentBtn').classList.toggle('active', role === 'agent');
  document.getElementById('roleMgrBtn').classList.toggle('active', role === 'manager');
  const mgrEls = ['mgrLabel', 'navDashboard', 'navTeam'];
  mgrEls.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = role === 'manager' ? 'flex' : 'none';
  });
  const navManageAll = document.getElementById('navManageAll');
  if (navManageAll) navManageAll.style.display = 'flex';
  const bulkBtn = document.getElementById('bulkActionBtn');
  if (bulkBtn) bulkBtn.style.display = 'inline-flex';
  const agentBulkBtn = document.getElementById('agentBulkActionBtn');
  if (agentBulkBtn) agentBulkBtn.style.display = 'inline-flex';
  document.querySelector('.subnav-item[data-view="tickets"]').innerHTML = '<span class="ic">☰</span> My tickets';
  if (role === 'manager') { switchView('dashboard'); } else { switchView('tickets'); }
  showToast(role === 'manager' ? 'Switched to Manager view — full analytics unlocked' : 'Switched to Agent view');
}

/* =========================================================
   TICKET LIST
========================================================= */
function setStatusFilter(status) {
  const sel = document.getElementById('fStatus');
  sel.value = status;
  updateSselLabel(sel);
  renderTicketList();
}

/* ---- Date range filter (shared by "My tickets" and "All tickets") ---- */
function toDateInputValue(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function quickDate(prefix, which, btn) {
  const base = new Date();
  if (which === 'yesterday') base.setDate(base.getDate() - 1);
  const val = toDateInputValue(base);
  document.getElementById(prefix + 'DateFrom').value = val;
  document.getElementById(prefix + 'DateTo').value = val;
  document.querySelectorAll(`#${prefix}QuickDates button`).forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  prefix === 'f' ? renderTicketList() : renderManageAll();
}
function onDateInputChange(prefix) {
  document.querySelectorAll(`#${prefix}QuickDates button`).forEach(b => b.classList.remove('active'));
  prefix === 'f' ? renderTicketList() : renderManageAll();
}
function clearDateFilter(prefix) {
  document.getElementById(prefix + 'DateFrom').value = '';
  document.getElementById(prefix + 'DateTo').value = '';
  document.querySelectorAll(`#${prefix}QuickDates button`).forEach(b => b.classList.remove('active'));
  prefix === 'f' ? renderTicketList() : renderManageAll();
}
function inDateRange(t, fromVal, toVal) {
  if (!fromVal && !toVal) return true;
  if (!t.createdAt) return true;
  const d = toDateInputValue(t.createdAt);
  if (fromVal && d < fromVal) return false;
  if (toVal && d > toVal) return false;
  return true;
}

function renderTicketList() {
  const statuses = getSelectedValues('fStatus');
  const pris = getSelectedValues('fPriority');
  const chans = getSelectedValues('fChannel');
  const queues = getSelectedValues('fQueue');
  const search = document.getElementById('fSearch').value.toLowerCase();
  const dateFrom = document.getElementById('fDateFrom').value;
  const dateTo = document.getElementById('fDateTo').value;
  let rows = TICKETS.filter(t => t.status !== 'Merged');
  if (statuses.length > 0) rows = rows.filter(t => statuses.includes(t.status));
  if (pris.length > 0) rows = rows.filter(t => pris.includes(t.priority));
  if (chans.length > 0) rows = rows.filter(t => chans.includes(t.channel));
  if (queues.length > 0) rows = rows.filter(t => queues.includes(t.queue));
  if (search) rows = rows.filter(t => t.id.toLowerCase().includes(search) || t.customer.toLowerCase().includes(search) || t.phone.toLowerCase().includes(search));
  rows = rows.filter(t => inDateRange(t, dateFrom, dateTo));
  document.getElementById('ticketTableBody').innerHTML = rows.map(rowHtml).join('') || `<tr><td colspan="10" style="text-align:center;color:var(--ink-faint);padding:30px;">No tickets match these filters.</td></tr>`;
}

function slaLabel(mins, status) {
  const isClosedOrResolved = status === 'Resolved' || status === 'Closed';
  if (isClosedOrResolved) {
    return `<span style="color:var(--ink-faint); font-size:10px; font-weight:700; background:#F1F5F9; padding:2px 6px; border-radius:4px; border: 1px solid #E2E8F0;">Completed</span>`;
  }
  if (mins < 0) {
    return `<span style="color:var(--red); font-size:10px; font-weight:700; background:var(--red-tint); padding:2px 6px; border-radius:4px; border: 1.5px solid rgba(220, 38, 38, 0.25); display:inline-block; animation: pulse-sla 1.5s infinite;">⚠️ -${Math.abs(mins)}m</span>`;
  }
  if (mins < 60) {
    return `<span style="color:var(--amber); font-size:10px; font-weight:700; background:var(--amber-tint); padding:2px 6px; border-radius:4px; border: 1.5px solid rgba(217, 119, 6, 0.25); display:inline-block;">⏱️ ${mins}m left</span>`;
  }
  const h = Math.floor(mins / 60), m = mins % 60;
  return `<span style="color:var(--teal); font-size:10px; font-weight:700; background:var(--teal-tint); padding:2px 6px; border-radius:4px; border: 1.5px solid rgba(13, 148, 136, 0.25); display:inline-block;">⏱️ ${h}h ${m}m</span>`;
}

function rowHtml(t) {
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
    <td>${slaLabel(t.slaMins, t.status)}</td>
    <td style="color:var(--ink-faint);">${t.updated}</td>
  </tr>`;
}

/* =========================================================
   MANAGE ALL (Manager)
========================================================= */
function renderManageAll() {
  const agentSel = document.getElementById('mfAgent');
  if (agentSel.options.length <= 1) { AGENTS.forEach(a => agentSel.innerHTML += `<option value="${a.id}">${a.name}</option>`); }
  const statusSel = document.getElementById('mfStatus');
  if (statusSel.options.length <= 1) { STATUSES.forEach(s => statusSel.innerHTML += `<option>${s}</option>`); }
  enhanceSearchSelect(agentSel);
  enhanceSearchSelect(statusSel);

  const agents = getSelectedValues(agentSel);
  const statuses = getSelectedValues(statusSel);
  const depts = getSelectedValues('mfQueue');
  const chans = getSelectedValues('mfChannel');
  const cats = getSelectedValues('mfCategory');
  const subCats = getSelectedValues('mfSubCategory');
  const dateFrom = document.getElementById('mfDateFrom').value;
  const dateTo = document.getElementById('mfDateTo').value;
  const search = document.getElementById('mfSearch') ? document.getElementById('mfSearch').value.toLowerCase() : '';
  let rows = TICKETS.slice();

  const bannerPlaceholder = document.getElementById('manageAllSlaBannerPlaceholder');
  if (managerFilterSlaBreachedOnly) {
    rows = rows.filter(t => t.slaMins < 0 && t.status !== 'Resolved' && t.status !== 'Closed');
    if (bannerPlaceholder) {
      bannerPlaceholder.innerHTML = `
        <div style="background:var(--red-tint); border:1px solid rgba(181, 69, 59, 0.3); color:var(--red); padding:10px 14px; border-radius:6px; margin-bottom:12px; font-size:13.5px; font-weight:700; display:flex; align-items:center; justify-content:space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <span>⚠️ Showing SLA Breached Tickets Only (Manager View)</span>
          <button onclick="clearManagerSlaBreachedFilter()" style="background:none; border:none; color:var(--red); text-decoration:underline; font-weight:700; cursor:pointer; font-size:12px; margin-left:auto; padding:0;">Show All</button>
        </div>
      `;
    }
  } else {
    if (bannerPlaceholder) bannerPlaceholder.innerHTML = '';
    if (agents.length > 0) rows = rows.filter(t => agents.includes(t.assignee));
    if (statuses.length > 0) rows = rows.filter(t => statuses.includes(t.status));
    if (depts.length > 0) rows = rows.filter(t => depts.includes(t.department));
    if (chans.length > 0) rows = rows.filter(t => chans.includes(t.channel));
    if (cats.length > 0) rows = rows.filter(t => cats.includes(t.category));
    if (subCats.length > 0) rows = rows.filter(t => subCats.includes(t.subCategory));
    if (search) rows = rows.filter(t => t.id.toLowerCase().includes(search) || t.customer.toLowerCase().includes(search) || t.phone.toLowerCase().includes(search));
    rows = rows.filter(t => inDateRange(t, dateFrom, dateTo));
  }
  document.getElementById('manageAllBody').innerHTML = rows.map(t => {
    const base = rowHtml(t);
    return base.replace('<input type="checkbox" class="checkbox">', `<input type="checkbox" class="checkbox bulk-cb" data-id="${t.id}" onchange="toggleBulk('${t.id}',this.checked)">`);
  }).join('') || `<tr><td colspan="10" style="text-align:center;color:var(--ink-faint);padding:30px;">No tickets match.</td></tr>`;
}
function toggleAll(cb) {
  document.querySelectorAll('.bulk-cb').forEach(el => { el.checked = cb.checked; toggleBulk(el.dataset.id, cb.checked); });
}
function toggleBulk(id, checked) { checked ? bulkSelectedIds.add(id) : bulkSelectedIds.delete(id); }
let bulkActionMode = 'agent';
function setBulkAction(mode) {
  bulkActionMode = mode;
  document.querySelectorAll('.bulk-action-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bulkAction === mode);
  });
  const panels = ['bulkPanelAgent', 'bulkPanelStatus', 'bulkPanelQueue', 'bulkPanelArchive', 'bulkPanelDelete'];
  panels.forEach(pId => {
    const el = document.getElementById(pId);
    if (el) el.classList.toggle('show', pId === 'bulkPanel' + mode.charAt(0).toUpperCase() + mode.slice(1));
  });

  const submitBtn = document.getElementById('bulkSubmitBtn');
  if (submitBtn) {
    if (mode === 'delete') {
      submitBtn.textContent = 'Delete selected';
      submitBtn.className = 'btn btn-danger';
      submitBtn.style.background = 'var(--red)';
      submitBtn.style.color = '#fff';
      submitBtn.style.borderColor = 'var(--red)';
    } else if (mode === 'archive') {
      submitBtn.textContent = 'Archive selected';
      submitBtn.className = 'btn btn-primary';
      submitBtn.style.background = '';
      submitBtn.style.color = '';
      submitBtn.style.borderColor = '';
    } else {
      submitBtn.textContent = 'Apply to selected';
      submitBtn.className = 'btn btn-primary';
      submitBtn.style.background = '';
      submitBtn.style.color = '';
      submitBtn.style.borderColor = '';
    }
  }
}

function resetBulkModal() {
  document.getElementById('bulkAgent').value = '';
  document.getElementById('bulkStatus').value = '';
  document.getElementById('bulkQueue').value = '';
  enhanceAllSelects(document.getElementById('modalBulk'));
  setBulkAction('agent');
  showToast('Bulk action options reset');
}

function bulkReassignOpen() {
  document.getElementById('bulkCount').textContent = `${bulkSelectedIds.size} ticket(s) selected.`;

  const agentSel = document.getElementById('bulkAgent');
  agentSel.innerHTML = `<option value="">-- Select Agent --</option>` + AGENTS.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

  const queueSel = document.getElementById('bulkQueue');
  queueSel.innerHTML = `<option value="">-- Select Department --</option>
    <option value="Support">Support</option>
    <option value="Collection">Collection</option>
    <option value="Legal Related">Legal Related</option>
    <option value="Grievance">Grievance</option>`;

  document.getElementById('bulkStatus').value = '';
  agentSel.value = '';
  queueSel.value = '';

  enhanceAllSelects(document.getElementById('modalBulk'));
  setBulkAction('agent');

  if (bulkSelectedIds.size === 0) { showToast('Select at least one ticket first'); return; }
  document.getElementById('modalBulk').classList.add('show');
}

function submitBulkReassign() {
  if (bulkSelectedIds.size === 0) { showToast('Select at least one ticket first'); return; }

  let actionText = '';
  let changes = 0;

  if (bulkActionMode === 'agent') {
    const agentId = document.getElementById('bulkAgent').value;
    if (!agentId) {
      showToast('Please select an agent first');
      return;
    }
    bulkSelectedIds.forEach(id => {
      const t = TICKETS.find(x => x.id === id);
      if (!t) return;
      const prevAgent = t.assignee;
      t.assignee = agentId;
      t.status = 'Assigned';
      addLog(t, `Bulk reassign: ${agentName(prevAgent)} → ${agentName(agentId)}`, { type: 'assign', by: currentRole, actor: currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID), undoable: true, snapshot: { field: 'assignee', oldValue: prevAgent } });
      changes++;
    });
    actionText = `reassigned to ${agentName(agentId)}`;
  } else if (bulkActionMode === 'status') {
    const newStatus = document.getElementById('bulkStatus').value;
    if (!newStatus) {
      showToast('Please select a ticket status first');
      return;
    }
    bulkSelectedIds.forEach(id => {
      const t = TICKETS.find(x => x.id === id);
      if (!t) return;
      const prevStatus = t.status;
      t.status = newStatus;
      addLog(t, `Bulk status update: ${prevStatus} → ${newStatus}`, { type: 'status', by: currentRole, actor: currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID), undoable: true, snapshot: { field: 'status', oldValue: prevStatus } });
      changes++;
    });
    actionText = `updated to ${newStatus}`;
  } else if (bulkActionMode === 'queue') {
    const queue = document.getElementById('bulkQueue').value;
    if (!queue) {
      showToast('Please select a department first');
      return;
    }
    bulkSelectedIds.forEach(id => {
      const t = TICKETS.find(x => x.id === id);
      if (!t) return;
      const prevQueue = t.department || t.queue;
      t.department = queue;
      t.queue = queue;
      addLog(t, `Bulk transfer: ${prevQueue} → ${queue}`, { type: 'field', by: currentRole, actor: currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID), undoable: true, snapshot: { field: 'department', oldValue: prevQueue } });
      changes++;
    });
    actionText = `transferred to ${queue}`;
  } else if (bulkActionMode === 'archive') {
    bulkSelectedIds.forEach(id => {
      const t = TICKETS.find(x => x.id === id);
      if (!t) return;
      const prevStatus = t.status;
      t.status = 'Archived';
      addLog(t, `Bulk archive: ${prevStatus} → Archived`, { type: 'status', by: currentRole, actor: currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID), undoable: true, snapshot: { field: 'status', oldValue: prevStatus } });
      changes++;
    });
    actionText = `archived`;
  } else if (bulkActionMode === 'delete') {
    const idsToDelete = Array.from(bulkSelectedIds);
    idsToDelete.forEach(id => {
      const idx = TICKETS.findIndex(x => x.id === id);
      if (idx !== -1) {
        TICKETS.splice(idx, 1);
        changes++;
      }
    });
    actionText = `deleted`;
  }

  showToast(`${changes} ticket(s) ${actionText}`);
  bulkSelectedIds.clear();
  closeModal('modalBulk');
  renderManageAll();
  renderTicketList();
  if (typeof updateBreakdownBanner === 'function') {
    const depts = typeof getSelectedValues === 'function' ? getSelectedValues('mfQueue') : [];
    updateBreakdownBanner(depts);
  }
}

/* =========================================================
   QUEUES
========================================================= */
function renderQueues() {
  if (typeof updateBreakdownBanner === 'function') updateBreakdownBanner('q', []);
  const queues = ['Support', 'Collection', 'Legal Related', 'Grievance'];
  const cards = document.getElementById('queueCards');
  if (cards) {
    cards.innerHTML = queues.map(q => {
      const items = TICKETS.filter(t => (t.department === q || t.queue === q) && t.status !== 'Merged' && t.status !== 'Closed' && t.status !== 'Resolved');
      const breached = items.filter(t => t.slaMins < 0).length;
      const maxCap = DEPT_CAPACITIES[q] || 50;
      return `<div class="chart-card">
        <h3>${q}</h3>
        <div style="display:flex; gap:22px;">
          <div><div style="font-size:22px;font-weight:800;">${items.length} <span style="font-size:14px;font-weight:600;color:var(--ink-faint);">/ ${maxCap}</span></div><div style="font-size:11.5px;color:var(--ink-faint);">Active tickets</div></div>
          <div><div style="font-size:22px;font-weight:800;color:${breached ? 'var(--red)' : 'var(--green)'};">${breached}</div><div style="font-size:11.5px;color:var(--ink-faint);">SLA breached</div></div>
        </div>
      </div>`;
    }).join('');
  }
  const tbody = document.querySelector('#queuePerfTable tbody');
  if (tbody) {
    tbody.innerHTML = queues.map(q => {
      const items = TICKETS.filter(t => (t.department === q || t.queue === q) && t.status !== 'Merged' && t.status !== 'Closed' && t.status !== 'Resolved');
      const breached = items.filter(t => t.slaMins < 0).length;
      const maxCap = DEPT_CAPACITIES[q] || 50;
      const load = Math.min(100, Math.round(items.length / maxCap * 100));
      return `<tr><td><strong>${q}</strong></td><td><b>${items.length}</b> <span style="color:var(--ink-faint); font-size:11px;">/ ${maxCap}</span></td><td style="color:${breached ? 'var(--red)' : 'var(--ink-soft)'};">${breached}</td><td>${18 + Math.floor(Math.random() * 10)}m</td>
        <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${load}%; background:${load > 80 ? 'var(--red)' : load > 50 ? 'var(--amber)' : 'var(--teal)'};"></div></div><span>${load}%</span></div></td></tr>`;
    }).join('');
  }
}

/* =========================================================
   CUSTOMERS
========================================================= */
function renderCustomers() {
  document.getElementById('customerTableBody').innerHTML = CUSTOMERS.map(c => {
    const tix = TICKETS.filter(t => t.customer === c.name);
    const open = tix.filter(t => !['Resolved', 'Closed', 'Merged'].includes(t.status)).length;
    const lastChan = tix.length ? tix[tix.length - 1].channel : '—';
    const nps = 6 + Math.floor(Math.random() * 5);
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
function openTicket(id) {
  selectedTicketId = id;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-detail').classList.add('active');
  const t = TICKETS.find(x => x.id === id);
  const validChans = ['Chat', 'SMS', 'WhatsApp'];
  replyChannel = validChans.includes(t.channel) ? t.channel : 'Chat';
  renderDetailList();
  renderDetail();
}
function renderDetailList() {
  const container = document.getElementById('detailListItems') || document.getElementById('detailList');
  if (!container) return;

  let filtered = TICKETS.filter(t => t.status !== 'Merged');

  let bannerHtml = '';
  const bannerPlaceholder = document.getElementById('dlSlaBannerPlaceholder');
  if (filterSlaBreachedOnly) {
    filtered = filtered.filter(t => t.slaMins < 0 && t.status !== 'Resolved' && t.status !== 'Closed');
    bannerHtml = `
      <div style="background:var(--red-tint); border:1px solid rgba(181, 69, 59, 0.3); color:var(--red); padding:8px 12px; border-radius:6px; margin: 8px 10px 4px 10px; font-size:11.5px; font-weight:700; display:flex; align-items:center; justify-content:space-between; gap:6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <span>⚠️ SLA Breached Only</span>
        <button onclick="clearSlaBreachedFilter()" style="background:none; border:none; color:var(--red); text-decoration:underline; font-weight:700; cursor:pointer; font-size:11px; margin-left:auto; padding:0;">Show All</button>
      </div>
    `;
  }
  if (bannerPlaceholder) {
    bannerPlaceholder.innerHTML = bannerHtml;
  }

  // If filterSlaBreachedOnly is false, apply normal drop-down filters
  if (!filterSlaBreachedOnly) {
    const fStatusEl = document.getElementById('dlFilterStatus');
    const fChannelEl = document.getElementById('dlFilterChannel');
    const fPriorityEl = document.getElementById('dlFilterPriority');

    const statusVal = fStatusEl ? fStatusEl.value : 'Reopened';
    const channelVal = fChannelEl ? fChannelEl.value : '';
    const priorityVal = fPriorityEl ? fPriorityEl.value : '';

    if (statusVal) filtered = filtered.filter(t => t.status === statusVal);
    if (channelVal) filtered = filtered.filter(t => t.channel === channelVal);
    if (priorityVal) filtered = filtered.filter(t => t.priority === priorityVal);
  }

  // Apply SLA sorting if active
  if (slaSortMode === 'asc') {
    filtered.sort((a, b) => a.slaMins - b.slaMins);
  } else if (slaSortMode === 'desc') {
    filtered.sort((a, b) => b.slaMins - a.slaMins);
  }

  // Update header SLA warning badge count
  updateHeaderSlaBadge();

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--ink-faint); font-size:12px;">No tickets match filters</div>`;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const hasUnread = t.thread && t.thread.some(m => m.dir === 'in' && m.dir !== 'note' && m.unread);
    const unreadDot = hasUnread ? `<span class="unread-dot-badge" style="background:#2563EB; width:8px; height:8px; border-radius:50%; display:inline-block; margin-left:6px; vertical-align:middle;" title="Unread messages"></span>` : '';

    const isClosedOrResolved = t.status === 'Resolved' || t.status === 'Closed';
    let slaBadge = '';
    if (!isClosedOrResolved) {
      if (t.slaMins < 0) {
        slaBadge = `<span class="sla-badge-mini" style="background:var(--red-tint); color:var(--red); border:1.5px solid rgba(220, 38, 38, 0.25); font-size:8px; padding:1px 4px; border-radius:3px; font-weight:700; margin-left:4px; vertical-align:middle; display:inline-block; animation: pulse-sla 1.5s infinite;">⚠️ -${Math.abs(t.slaMins)}m</span>`;
      } else {
        slaBadge = `<span class="sla-badge-mini" style="background:var(--teal-tint); color:var(--teal); border:1.5px solid rgba(13, 148, 136, 0.25); font-size:8px; padding:1px 4px; border-radius:3px; font-weight:700; margin-left:4px; vertical-align:middle; display:inline-block;">⏱️ ${t.slaMins}m</span>`;
      }
    }

    return `
      <div class="dl-item ${t.id === selectedTicketId ? 'active' : ''}" onclick="openTicket('${t.id}')">
        <div class="dl-id">${t.id} · <span class="status-badge ${statusClass(t.status)}" style="font-size:9.5px;padding:1px 6px;">${t.status}</span>${unreadDot}${slaBadge}</div>
        <div class="dl-subj">${t.subject}</div>
        <div class="dl-cust">${t.customer} · ${t.channel}</div>
      </div>`;
  }).join('');
}
let currentActiveTab = 'thread';
function switchTab(tab) {
  currentActiveTab = tab;
  document.querySelectorAll('.conv-tab').forEach(x => x.classList.remove('active'));
  const targetTab = document.querySelector(`.conv-tab[data-tab="${tab}"]`);
  if (targetTab) targetTab.classList.add('active');
  document.getElementById('replyBox').style.display = (tab === 'thread' || tab === 'files') ? 'block' : 'none';
  renderConvBody(tab);
}
function renderDetail() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  document.getElementById('dTitle').textContent = t.subject;
  const label = t.creationType === 'manual' ? 'MANUALLY CREATED' : 'SYSTEM GENERATED';
  const customerPhotoUrl = getCustomerPhoto(t.customer);

  const avatarImg = document.getElementById('headerCustomerAvatar');
  const nameEl = document.getElementById('headerCustomerName');
  const phoneEl = document.getElementById('headerCustomerPhone');
  const chanEl = document.getElementById('headerTicketChannel');
  const idEl = document.getElementById('headerTicketId');
  const creationBadge = document.getElementById('headerCreationBadge');

  if (avatarImg) {
    avatarImg.src = customerPhotoUrl;
    avatarImg.onclick = () => openCustomerProfile(t.customer);
  }
  if (nameEl) {
    nameEl.textContent = t.customer;
    nameEl.onclick = () => openCustomerProfile(t.customer);
  }
  if (phoneEl) {
    phoneEl.textContent = t.phone;
  }
  if (chanEl) {
    chanEl.textContent = `opened via ${t.channel}`;
  }
  if (idEl) {
    idEl.textContent = t.id;
  }
  if (creationBadge) {
    creationBadge.textContent = label;
    creationBadge.className = `creation-badge badge-${t.creationType || 'system'}`;
    creationBadge.style.fontSize = '8.5px';
    creationBadge.style.fontWeight = '800';
    creationBadge.style.padding = '2px 6px';
    creationBadge.style.borderRadius = '4px';
  }

  // Render NBFC partner, source, and SLA Breached badge dynamically
  let badgesHtml = '';
  if (t.nbfcPartner) {
    badgesHtml += `<span class="nbfc-partner-badge">NBFC partner: ${t.nbfcPartner}</span>`;
  } else {
    badgesHtml += `<span class="nbfc-partner-badge">NBFC partner: Chinmay</span>`;
  }
  if (t.source) {
    badgesHtml += `<span class="nbfc-source-badge">Source: ${t.source}</span>`;
  } else {
    badgesHtml += `<span class="nbfc-source-badge">Source: Chinmay</span>`;
  }
  if (t.slaMins < 0 && t.status !== 'Resolved' && t.status !== 'Closed') {
    badgesHtml += `<span class="sla-breached-badge" style="background:var(--red); color:#fff; font-weight:700; font-size:9.5px; padding:3px 8px; border-radius:4px; animation: pulse-sla 1.5s infinite;">⚠️ SLA BREACHED</span>`;
  }
  const badgeContainer = document.getElementById('headerMetaBadges');
  if (badgeContainer) badgeContainer.innerHTML = badgesHtml;

  const metaBox = document.getElementById('channelMetaValues');
  if (metaBox) {
    metaBox.innerHTML = `<span>NBFC partner: ${t.nbfcPartner || '—'}</span><span>Source: ${t.source || '—'}</span>`;
  }
  activeConvChannels = ['Email', 'Chat', 'WhatsApp', 'SMS'];
  updateConvChannelUI();
  const fht = document.getElementById('fullHistToggle');
  if (fht) fht.checked = false;
  renderConvBody('thread');
  document.querySelectorAll('.conv-tab').forEach(x => x.classList.remove('active'));
  document.querySelector('.conv-tab[data-tab="thread"]').classList.add('active');
  document.getElementById('replyBox').style.display = 'block';
  document.getElementById('replyChannel').value = replyChannel;
  setReplyChannel(replyChannel);
  document.getElementById('noteToggle').checked = false;
  setReplyMode('reply');
  closeTemplates();
  updateFilesTabCount(t);
  renderProps(t);
}
function chanTagClass(chan) {
  switch (chan) {
    case 'Email': return 'chan-tag-email';
    case 'Chat': return 'chan-tag-chat';
    case 'WhatsApp': return 'chan-tag-whatsapp';
    case 'SMS': return 'chan-tag-sms';
    default: return 'chan-tag-internal';
  }
}
function chanOutClass(chan) {
  switch (chan) {
    case 'Email': return 'chan-out-email';
    case 'Chat': return 'chan-out-chat';
    case 'WhatsApp': return 'chan-out-whatsapp';
    case 'SMS': return 'chan-out-sms';
    default: return '';
  }
}

/* ---- Full date+time display for every message ---- */
function combineDateTime(createdAt, timeStr) {
  const now = new Date();
  let base = createdAt ? new Date(createdAt) : new Date(now);
  let str = timeStr || '';
  if (/^Yesterday,/i.test(str)) { base = new Date(now); base.setDate(base.getDate() - 1); str = str.replace(/^Yesterday,\s*/i, ''); }
  else if (/^Today,/i.test(str)) { base = new Date(now); str = str.replace(/^Today,\s*/i, ''); }
  const m = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return base;
  let h = parseInt(m[1], 10); const min = parseInt(m[2], 10); const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  const d = new Date(base);
  d.setHours(h, min, 0, 0);
  return d;
}
function formatFullTimestamp(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = d.getHours(); const displayH = h % 12 === 0 ? 12 : h % 12; const ap = h < 12 ? 'AM' : 'PM';
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${displayH}:${mm} ${ap}`;
}
function msgTimestamp(t, m) {
  return formatFullTimestamp(m.ts ? new Date(m.ts) : combineDateTime(t.createdAt, m.time));
}
function statusTicks(status) {
  if (status === 'sending') return '<span class="tick tick-sending">Sending…</span>';
  if (status === 'sent') return '<span class="tick tick-sent">✓</span>';
  if (status === 'delivered') return '<span class="tick tick-delivered">✓✓</span>';
  if (status === 'read') return '<span class="tick tick-read">✓✓</span>';
  return '';
}
function failureReason(chan) {
  const reasons = {
    Email: 'Failed to send — recipient mailbox unreachable.',
    SMS: 'Failed to deliver — carrier rejected the number.',
    WhatsApp: 'Failed to deliver — recipient unreachable on WhatsApp.',
    Chat: 'Failed to send — connection lost.'
  };
  return reasons[chan] || 'Message failed to send.';
}

function addActivityEntry(ticket, text, meta = {}) {
  ticket.activity = ticket.activity || [];
  ticket.activity.push(text);
  if (!meta || !meta.type) return;
  ticket.activityMeta = ticket.activityMeta || [];
  ticket.activityMeta.push({
    id: `${ticket.id}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    text,
    ...meta
  });
}

function undoTicketActivity(ticketId, entryId) {
  const t = TICKETS.find(x => x.id === ticketId);
  if (!t || !t.activityMeta) return;
  const entry = t.activityMeta.find(x => x.id === entryId);
  if (!entry) return;

  if (entry.type === 'fieldChange') {
    const prev = entry.previousValue;
    t[entry.field] = prev;
    t.activity = t.activity.filter(a => a !== entry.text);
    t.activityMeta = t.activityMeta.filter(x => x.id !== entryId);
    showToast(`Reverted ${entry.field} to ${prev}`);
    renderDetail(); renderDetailList(); renderTicketList();
    return;
  }

  if (entry.type === 'merge') {
    unmergeTicket(entry.primaryId, entry.id);
    return;
  }
}

function unmergeTicket(primaryId, entryId) {
  const primary = TICKETS.find(x => x.id === primaryId);
  if (!primary || !primary.lastMergeSnapshot) return;

  const snapshot = primary.lastMergeSnapshot;
  primary.thread = JSON.parse(JSON.stringify(snapshot.beforeThread));
  primary.activity = Array.isArray(snapshot.beforeActivity) ? snapshot.beforeActivity.slice() : primary.activity;
  primary.activityMeta = Array.isArray(snapshot.beforeActivityMeta) ? snapshot.beforeActivityMeta.slice() : [];
  primary.status = snapshot.beforePrimaryStatus || primary.status;

  snapshot.mergedIds.forEach(id => {
    const merged = TICKETS.find(x => x.id === id);
    if (!merged) return;
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

function renderConvBody(tab) {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  const body = document.getElementById('convBody');
  if (tab === 'files') {
    renderFilesTab(t);
    return;
  }
  if (tab === 'activity') {
    const entries = (t.activityMeta && t.activityMeta.length) ? t.activityMeta : t.activity.map((text, index) => ({ id: `legacy-${index}`, text, type: 'generic' }));
    body.innerHTML = `<ul class="activity-log">${entries.map((entry, idx) => {
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

  if (tab === 'unified') {
    const custTickets = TICKETS.filter(x => x.customer.toLowerCase() === t.customer.toLowerCase());
    let allMessages = [];
    custTickets.forEach(ticket => {
      ticket.thread.forEach((m, idx) => {
        const msgDate = m.ts ? new Date(m.ts) : combineDateTime(ticket.createdAt, m.time);
        allMessages.push({
          msg: m,
          idx: idx,
          date: msgDate,
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          ticketStatus: ticket.status
        });
      });
    });

    allMessages.sort((a, b) => a.date - b.date);

    if (allMessages.length === 0) {
      body.innerHTML = `<div style="text-align:center; padding:40px; color:var(--ink-faint); font-size:13px;">📭 No conversation history found for this customer.</div>`;
      return;
    }

    const totalTickets = custTickets.length;
    let header = `<div style="background:linear-gradient(135deg,#0D9488 0%,#0E7490 100%); color:#fff; padding:12px 18px; border-radius:8px; margin-bottom:18px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
      <div><b>📋 Customer Omnichannel Journey</b><br><span style="opacity:0.85;">${t.customer} · ${totalTickets} ticket${totalTickets > 1 ? 's' : ''} · All channels combined</span></div>
      <div style="font-size:11px; opacity:0.75;">Sorted chronologically</div>
    </div>`;

    let lastDateLabel = null;
    body.innerHTML = header + allMessages.map(item => {
      const m = item.msg;
      const ticketId = item.ticketId;
      const ticketStatus = item.ticketStatus;
      const ticketSubject = item.ticketSubject;

      const currentDateLabel = getDateLabel(item.date);
      let dateDividerHtml = '';
      if (currentDateLabel !== lastDateLabel) {
        lastDateLabel = currentDateLabel;
        dateDividerHtml = `<div class="date-divider"><span>${currentDateLabel}</span></div>`;
      }

      const ticketContextHtml = `
        <div style="font-size: 10px; color: var(--ink-soft); margin-bottom: 4px; padding: 2px 6px; background: #F1F5F9; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px;">
          <span>Ticket: <b>${ticketId}</b> (${ticketStatus})</span>
          <span style="color: var(--ink-faint);">·</span>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${ticketSubject}</span>
        </div>
      `;

      if (m.call) return dateDividerHtml + `<div class="call-log">
        ${ticketContextHtml}<br>
        📞 <b>${m.callMeta ? 'Outbound call' : 'Call recorded & summarized'}</b> — ${msgTimestamp(t, m)}
        ${m.callMeta ? `<div class="call-log-meta">Duration: ${m.callMeta.duration} · Agent: ${m.callMeta.agent} · Status: ${m.callMeta.status}</div>
        <div class="call-audio-player" title="Demo recording — playback illustrative only"><span class="cap-play">▶</span><span class="cap-bar"></span><span>${m.callMeta.duration}</span></div>` : ''}
        <br>"${m.text}"
      </div>`;

      const isUnread = m.dir === 'in' && m.dir !== 'note' && m.unread;
      const cls = m.dir === 'out' ? `msg out ${chanOutClass(m.chan)}` : (m.dir === 'note' ? 'msg note out' : `msg in${isUnread ? ' unread-msg' : ''}`);
      const av = (m.dir === 'out' || m.dir === 'note') ? agentName(t.assignee).split(' ').map(w => w[0]).join('') : t.customer.split(' ').map(w => w[0]).join('');
      const isFailed = m.dir === 'out' && m.status === 'failed';
      const tsLabel = msgTimestamp(t, m);
      const ticks = m.dir === 'out' ? statusTicks(m.status || 'delivered') : '';
      const errorBlock = isFailed ? `<div class="msg-error">⚠ ${m.error || failureReason(m.chan)}</div>` : '';

      if (m.dir !== 'note' && m.chan === 'Email') {
        const isDraft = !!m.draft || m.status === 'draft';
        const draftBadge = isDraft ? `<div class="ec-head" style="color:var(--amber-dark);">✉ Draft email</div>` : `<div class="ec-head">✉ ${m.dir === 'out' ? 'Email sent' : 'System email'}</div>`;
        const cardInner = `<div class="email-card" ${isDraft ? 'style="border-left-color:var(--amber-dark); background:var(--amber-tint);"' : ''}>
              ${ticketContextHtml}
              ${draftBadge}
              <div class="ec-subject-lbl">Subject</div>
              <div class="ec-subject">${m.subject || t.subject}</div>
            </div>`;
        return dateDividerHtml + `<div class="${cls}">
          <div class="mavatar">${av}</div>
          <div>
            ${isFailed ? `<div class="msg-row-fail"><span class="fail-badge">!</span>${cardInner}</div>` : cardInner}
            <div class="meta-line"><span class="chan-tag ${chanTagClass(m.chan)}">${isDraft ? 'Draft' : m.chan}</span>${tsLabel}${ticks}</div>
            ${errorBlock}
          </div>
        </div>`;
      }

      const bubbleInner = `<div class="bubble">${ticketContextHtml}<div>${m.text}</div></div>`;
      return dateDividerHtml + `<div class="${cls}">
        <div class="mavatar">${av}</div>
        <div>
          ${isFailed ? `<div class="msg-row-fail"><span class="fail-badge">!</span>${bubbleInner}</div>` : bubbleInner}
          <div class="meta-line"><span class="chan-tag ${chanTagClass(m.dir === 'note' ? 'Internal' : m.chan)}">${m.dir === 'note' ? 'Internal note' : m.chan}</span>${tsLabel}${ticks}</div>
          ${errorBlock}
        </div>
      </div>`;
    }).join('');
    body.scrollTop = body.scrollHeight;
    return;
  }

  const fullHistToggle = document.getElementById('fullHistToggle');
  const showFullHist = fullHistToggle ? fullHistToggle.checked : false;

  let itemsToRender = [];

  if (showFullHist) {
    // Gather all tickets of the customer
    const custTickets = TICKETS.filter(x => x.customer.toLowerCase() === t.customer.toLowerCase());

    custTickets.forEach(ticket => {
      // 1. Created event
      itemsToRender.push({
        isEvent: true,
        type: 'created',
        date: new Date(ticket.createdAt),
        ticketId: ticket.id,
        ticketObj: ticket
      });

      // 2. Closed/Resolved event (if resolved or closed)
      if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        itemsToRender.push({
          isEvent: true,
          type: 'closed',
          date: getTicketClosedDate(ticket),
          ticketId: ticket.id,
          ticketObj: ticket
        });
      }

      // 3. Thread messages
      ticket.thread.forEach((m, idx) => {
        const isInternalOrCall = m.dir === 'note' || m.chan === 'Call' || m.chan === 'Internal';
        if (!isInternalOrCall && !activeConvChannels.includes(m.chan)) {
          return;
        }
        const msgDate = m.ts ? new Date(m.ts) : combineDateTime(ticket.createdAt, m.time);
        itemsToRender.push({
          isEvent: false,
          msg: m,
          idx: idx,
          date: msgDate,
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          ticketStatus: ticket.status,
          ticketObj: ticket
        });
      });
    });

    // Sort chronologically by date.
    // If dates are identical, sort: created event (0) < message (1) < closed event (2)
    itemsToRender.sort((a, b) => {
      const aTime = a.date.getTime();
      const bTime = b.date.getTime();
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      const aPrio = a.isEvent && a.type === 'created' ? 0 : (a.isEvent && a.type === 'closed' ? 2 : 1);
      const bPrio = b.isEvent && b.type === 'created' ? 0 : (b.isEvent && b.type === 'closed' ? 2 : 1);
      return aPrio - bPrio;
    });

  } else {
    // Normal view: only current ticket
    // 1. Created event
    itemsToRender.push({
      isEvent: true,
      type: 'created',
      date: new Date(t.createdAt),
      ticketId: t.id,
      ticketObj: t
    });

    // 2. Closed/Resolved event (if resolved or closed)
    if (t.status === 'Resolved' || t.status === 'Closed') {
      itemsToRender.push({
        isEvent: true,
        type: 'closed',
        date: getTicketClosedDate(t),
        ticketId: t.id,
        ticketObj: t
      });
    }

    // 3. Current ticket's messages
    t.thread.forEach((m, idx) => {
      const isInternalOrCall = m.dir === 'note' || m.chan === 'Call' || m.chan === 'Internal';
      if (!isInternalOrCall && !activeConvChannels.includes(m.chan)) {
        return;
      }
      const msgDate = m.ts ? new Date(m.ts) : combineDateTime(t.createdAt, m.time);
      itemsToRender.push({
        isEvent: false,
        msg: m,
        idx: idx,
        date: msgDate,
        ticketId: t.id,
        ticketSubject: t.subject,
        ticketStatus: t.status,
        ticketObj: t
      });
    });

    // Sort chronologically by date
    itemsToRender.sort((a, b) => {
      const aTime = a.date.getTime();
      const bTime = b.date.getTime();
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      const aPrio = a.isEvent && a.type === 'created' ? 0 : (a.isEvent && a.type === 'closed' ? 2 : 1);
      const bPrio = b.isEvent && b.type === 'created' ? 0 : (b.isEvent && b.type === 'closed' ? 2 : 1);
      return aPrio - bPrio;
    });
  }

  let lastDateLabel = null;
  let html = '';

  html += itemsToRender.map((item, idx) => {
    const currentDateLabel = getDateLabel(item.date);
    let dateDividerHtml = '';
    if (currentDateLabel !== lastDateLabel) {
      lastDateLabel = currentDateLabel;
      dateDividerHtml = `<div class="date-divider"><span>${currentDateLabel}</span></div>`;
    }

    if (item.isEvent) {
      const isCurrent = item.ticketId === selectedTicketId;
      const badgeStyle = isCurrent
        ? 'border: 1.5px solid var(--teal); background: var(--teal-tint); color: var(--teal-dark); font-weight: 700;'
        : 'border: 1px solid var(--line); background: var(--panel); color: var(--ink-soft);';

      if (item.type === 'created') {
        return dateDividerHtml + `<div class="system-event-divider" style="margin: 20px 0 12px; display: flex; justify-content: center;">
          <span onclick="openTicket('${item.ticketId}')" style="cursor: pointer; padding: 4px 12px; border-radius: 20px; font-size: 11px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s; ${badgeStyle}">
            🚀 Ticket Created · <b style="text-decoration: underline;">${item.ticketId}</b> · ${fmtDateTime(item.date)} via ${item.ticketObj.channel}
          </span>
        </div>`;
      } else if (item.type === 'closed') {
        return dateDividerHtml + `<div class="system-event-divider" style="margin: 12px 0 20px; display: flex; justify-content: center;">
          <span onclick="openTicket('${item.ticketId}')" style="cursor: pointer; padding: 4px 12px; border-radius: 20px; font-size: 11px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s; ${badgeStyle}">
            ✅ Ticket ${item.ticketObj.status} · <b style="text-decoration: underline;">${item.ticketId}</b> · ${fmtDateTime(item.date)}
          </span>
        </div>`;
      }
      return '';
    }

    const m = item.msg;
    const tId = item.ticketId;
    const isUnread = m.dir === 'in' && m.dir !== 'note' && m.unread;
    const readToggle = (m.dir === 'in' && m.dir !== 'note')
      ? (m.unread
        ? `<span class="msg-read-toggle" onclick="toggleMessageReadState('${tId}', ${item.idx})" style="color:var(--blue); font-size:10.5px; cursor:pointer; margin-left:8px; font-weight:700;">🔵 Mark read</span>`
        : `<span class="msg-read-toggle" onclick="toggleMessageReadState('${tId}', ${item.idx})" style="color:var(--ink-faint); font-size:10.5px; cursor:pointer; margin-left:8px;">Mark unread</span>`)
      : '';

    if (m.call) {
      const ticketContextHtml = showFullHist
        ? `<div style="font-size: 10px; color: var(--ink-soft); margin-bottom: 4px; padding: 2px 6px; background: #F1F5F9; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;" onclick="openTicket('${tId}')">Ticket: <b>${tId}</b></div><br>`
        : '';
      return dateDividerHtml + `<div class="call-log">
        ${ticketContextHtml}
        📞 <b>${m.callMeta ? 'Outbound call' : 'Call recorded & summarized'}</b> — ${msgTimestamp(item.ticketObj, m)}
        ${m.callMeta ? `<div class="call-log-meta">Duration: ${m.callMeta.duration} · Agent: ${m.callMeta.agent} · Status: ${m.callMeta.status}</div>
        <div class="call-audio-player" title="Demo recording — playback illustrative only"><span class="cap-play">▶</span><span class="cap-bar"></span><span>${m.callMeta.duration}</span></div>` : ''}
        <br>"${formatMessageText(m.text)}"
      </div>`;
    }

    const isAgent = m.dir === 'out' || m.dir === 'note';
    const cls = m.dir === 'out' ? `msg out ${chanOutClass(m.chan)}` : (m.dir === 'note' ? 'msg note out' : `msg in${isUnread ? ' unread-msg' : ''}`);
    const av = isAgent ? agentName(item.ticketObj.assignee).split(' ').map(w => w[0]).join('') : item.ticketObj.customer.split(' ').map(w => w[0]).join('');
    const isFailed = m.dir === 'out' && m.status === 'failed';
    const tsLabel = msgTimestamp(item.ticketObj, m);
    const ticks = m.dir === 'out' ? statusTicks(m.status || 'delivered') : '';
    const errorBlock = isFailed ? `<div class="msg-error">⚠ ${m.error || failureReason(m.chan)} <button class="retry-link" onclick="retryMessage('${tId}', ${item.idx})">Retry</button></div>` : '';

    let attachHtml = '';
    if (m.attachments && m.attachments.length > 0) {
      attachHtml = `<div class="msg-attachments-list">
        ${m.attachments.map(att => `
          <div class="msg-attachment-item">
            <div class="att-left">
              <span class="att-file-icon">${getFileIcon(att.name)}</span>
              <div class="att-meta">
                <div class="att-name" title="${att.name}">${att.name}</div>
                <div class="att-size">${att.size || '180 KB'}</div>
              </div>
            </div>
            <div class="att-actions">
              <button type="button" class="att-btn att-preview-btn" onclick="previewAttachment('${att.name}', '${att.url || ''}', '${att.type || ''}')">👁 Preview</button>
              <button type="button" class="att-btn att-download-btn" onclick="downloadAttachment('${att.name}', '${att.url || ''}')">📥 Download</button>
            </div>
          </div>
        `).join('')}
      </div>`;
    }

    // Add a clean interactive ticket badge next to channel tag if showFullHist is true
    const ticketTag = showFullHist
      ? `<span onclick="openTicket('${tId}')" style="cursor: pointer; font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-right: 6px; display: inline-flex; align-items: center; border: 1px solid ${tId === selectedTicketId ? 'var(--teal)' : 'var(--line)'}; background: ${tId === selectedTicketId ? 'var(--teal-tint)' : 'var(--panel)'}; color: ${tId === selectedTicketId ? 'var(--teal-dark)' : 'var(--ink-soft)'};" title="Click to view ticket details">${tId}</span>`
      : '';

    if (m.dir !== 'note' && m.chan === 'Email') {
      const cardInner = `<div class="email-card">
            <div class="ec-head">✉ ${m.dir === 'out' ? 'Email sent' : 'System email'}</div>
            <div class="ec-subject-lbl">Subject</div>
            <div class="ec-subject">${m.subject || item.ticketObj.subject}</div>
            <div class="ec-actions">
              <button class="ec-link" onclick="viewEmail('${tId}', ${item.idx})">👁 View Email</button>
              <button class="ec-link" onclick="openEmailComposer(false)">↩ Reply</button>
              <button class="ec-link" onclick="openEmailComposer(true)">↩↩ Reply All</button>
            </div>
          </div>`;
      return dateDividerHtml + `<div class="${cls}">
        <div class="mavatar">${av}</div>
        <div>
          ${isFailed ? `<div class="msg-row-fail"><span class="fail-badge" title="${m.error || failureReason(m.chan)}">!</span>${cardInner}</div>` : cardInner}
          ${attachHtml}
          <div class="meta-line">${ticketTag}<span class="chan-tag ${chanTagClass(m.chan)}">${m.chan}</span>${tsLabel}${ticks}${readToggle}</div>
          ${errorBlock}
        </div>
      </div>`;
    }

    const bubbleInner = `<div class="bubble">${formatMessageText(m.text)}</div>`;
    return dateDividerHtml + `<div class="${cls}">
      <div class="mavatar">${av}</div>
      <div>
        ${isFailed ? `<div class="msg-row-fail"><span class="fail-badge" title="${m.error || failureReason(m.chan)}">!</span>${bubbleInner}</div>` : bubbleInner}
        ${attachHtml}
        <div class="meta-line">${ticketTag}<span class="chan-tag ${chanTagClass(m.dir === 'note' ? 'Internal' : m.chan)}">${m.dir === 'note' ? 'Internal note' : m.chan}</span>${tsLabel}${ticks}${readToggle}</div>
        ${errorBlock}
      </div>
    </div>`;
  }).join('');

  if (t.emailDraft && activeConvChannels.includes('Email') && !showFullHist) {
    const d = t.emailDraft;
    const bodySnippet = d.bodyHtml ? d.bodyHtml.replace(/<[^>]+>/g, '').trim().slice(0, 150) : '(Empty body)';
    const attCount = d.attachments ? d.attachments.length : 0;
    const draftCardHtml = `
      <div class="msg out" style="margin-bottom:16px;">
        <div class="mavatar" style="background:#D98E3F;">📝</div>
        <div style="flex:1; max-width:480px;">
          <div class="email-draft-card">
            <div class="ed-head">
              <span>📝 Draft Email Saved</span>
              <span class="draft-badge">DRAFT</span>
            </div>
            <div class="ed-sub-lbl">Subject</div>
            <div class="ed-subject">${d.subject || '(No subject)'}</div>
            <div class="ed-body-preview">${bodySnippet}${bodySnippet.length >= 150 ? '…' : ''}</div>
            ${attCount ? `<div class="ed-att-count">📎 ${attCount} attachment(s) included</div>` : ''}
            <div class="ed-actions">
              <button type="button" class="btn btn-primary btn-sm" onclick="openEmailComposer()">✏ Edit Draft</button>
              <button type="button" class="btn btn-ghost btn-sm" onclick="discardTicketDraft()">🗑 Discard Draft</button>
            </div>
          </div>
          <div class="meta-line"><span class="chan-tag chan-tag-email">Draft Email</span>Saved in draft — click Edit to review &amp; send</div>
        </div>
      </div>
    `;
    html += draftCardHtml;
  }

  body.innerHTML = html;
  body.scrollTop = body.scrollHeight;
}

/* =========================================================
   FILES REPOSITORY & MANAGEMENT TAB LOGIC
========================================================= */
let filesSearchQuery = '';
let filesSenderFilter = 'all'; // 'all', 'customer', 'agent'
let filesTypeFilter = 'all';   // 'all', 'pdf', 'image', 'doc', 'sheet'
let filesSortMode = 'newest';  // 'newest', 'oldest', 'name_asc', 'size_desc'
let filesViewLayout = 'grid';  // 'grid', 'table'

function getTicketFiles(t) {
  if (!t) return [];
  const filesList = [];

  // 1. Extract attachments from thread messages
  if (Array.isArray(t.thread)) {
    t.thread.forEach((msg, msgIdx) => {
      if (Array.isArray(msg.attachments)) {
        msg.attachments.forEach((att, attIdx) => {
          const isCustomer = msg.dir === 'in';
          const senderName = isCustomer ? t.customer : (msg.dir === 'note' ? (msg.actor || 'Internal Note') : agentName(t.assignee));
          const senderRole = isCustomer ? 'Customer' : (msg.dir === 'note' ? 'Internal Note' : 'Agent');
          const fileDate = msg.ts ? new Date(msg.ts) : combineDateTime(t.createdAt, msg.time);
          const fileKey = `thread_${msgIdx}_${attIdx}`;

          filesList.push({
            key: fileKey,
            name: att.name || 'Attachment',
            size: att.size || '180 KB',
            type: att.type || (att.name && att.name.toLowerCase().endsWith('.pdf') ? 'pdf' : (att.name && (att.name.toLowerCase().endsWith('.png') || att.name.toLowerCase().endsWith('.jpg') || att.name.toLowerCase().endsWith('.jpeg')) ? 'image' : 'document')),
            url: att.url || '',
            senderName,
            senderRole,
            isCustomer,
            channel: msg.chan || t.channel || 'WhatsApp',
            date: fileDate,
            dateFormatted: formatFullTimestamp(fileDate),
            msgIndex: msgIdx,
            attIndex: attIdx,
            source: 'thread'
          });
        });
      }
    });
  }

  // 2. Extract direct ticket.files (e.g. uploaded via Files tab)
  if (Array.isArray(t.files)) {
    t.files.forEach((f, fIdx) => {
      const fileDate = f.date ? new Date(f.date) : new Date(t.createdAt);
      const fileKey = `direct_${fIdx}`;
      filesList.push({
        key: fileKey,
        name: f.name || 'Document',
        size: f.size || '220 KB',
        type: f.type || (f.name && f.name.toLowerCase().endsWith('.pdf') ? 'pdf' : (f.name && (f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg')) ? 'image' : 'document')),
        url: f.url || '',
        senderName: f.senderName || (currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID)),
        senderRole: f.senderRole || (currentRole === 'manager' ? 'Manager' : 'Agent'),
        isCustomer: !!f.isCustomer,
        channel: f.channel || 'Direct Upload',
        date: fileDate,
        dateFormatted: formatFullTimestamp(fileDate),
        fileIndex: fIdx,
        source: 'direct'
      });
    });
  }

  return filesList;
}

function updateFilesTabCount(t) {
  const el = document.getElementById('filesTabCount');
  if (!el) return;
  if (!t) {
    el.textContent = '';
    return;
  }
  const files = getTicketFiles(t);
  el.textContent = files.length > 0 ? `(${files.length})` : '';
}

function setFilesViewLayout(layout) {
  filesViewLayout = layout;
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (t) renderFilesTab(t);
}

function onFilesSearchChange(val) {
  filesSearchQuery = (val || '').trim().toLowerCase();
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (t) renderFilesTab(t);
}

function onFilesSenderFilterChange(val) {
  filesSenderFilter = val;
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (t) renderFilesTab(t);
}

function onFilesTypeFilterChange(val) {
  filesTypeFilter = val;
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (t) renderFilesTab(t);
}

function onFilesSortChange(val) {
  filesSortMode = val;
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (t) renderFilesTab(t);
}

function resetFilesFilters() {
  filesSearchQuery = '';
  filesSenderFilter = 'all';
  filesTypeFilter = 'all';
  filesSortMode = 'newest';
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (t) renderFilesTab(t);
}

function parseBytes(sizeStr) {
  if (!sizeStr) return 0;
  const str = String(sizeStr).trim().toUpperCase();
  if (str.endsWith('MB')) return parseFloat(str) * 1024 * 1024;
  if (str.endsWith('KB')) return parseFloat(str) * 1024;
  if (str.endsWith('B')) return parseFloat(str);
  return parseFloat(str) || 0;
}

function renderFilesTab(t) {
  const body = document.getElementById('convBody');
  if (!body || !t) return;

  const allFiles = getTicketFiles(t);
  const custCount = allFiles.filter(f => f.isCustomer).length;
  const agentCount = allFiles.filter(f => !f.isCustomer).length;

  // Apply Search Filter
  let filtered = allFiles.filter(f => {
    if (filesSearchQuery) {
      const matchName = f.name.toLowerCase().includes(filesSearchQuery);
      const matchSender = f.senderName.toLowerCase().includes(filesSearchQuery);
      const matchChan = f.channel.toLowerCase().includes(filesSearchQuery);
      if (!matchName && !matchSender && !matchChan) return false;
    }
    if (filesSenderFilter === 'customer' && !f.isCustomer) return false;
    if (filesSenderFilter === 'agent' && f.isCustomer) return false;

    if (filesTypeFilter !== 'all') {
      const lowerName = f.name.toLowerCase();
      if (filesTypeFilter === 'pdf' && !lowerName.endsWith('.pdf')) return false;
      if (filesTypeFilter === 'image' && !(lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.webp') || lowerName.endsWith('.gif'))) return false;
      if (filesTypeFilter === 'doc' && !(lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerName.endsWith('.txt'))) return false;
      if (filesTypeFilter === 'sheet' && !(lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv'))) return false;
    }
    return true;
  });

  // Apply Sorting
  filtered.sort((a, b) => {
    if (filesSortMode === 'newest') return b.date.getTime() - a.date.getTime();
    if (filesSortMode === 'oldest') return a.date.getTime() - b.date.getTime();
    if (filesSortMode === 'name_asc') return a.name.localeCompare(b.name);
    if (filesSortMode === 'size_desc') return parseBytes(b.size) - parseBytes(a.size);
    return 0;
  });

  updateFilesTabCount(t);

  // Render Files UI Layout
  let html = `
    <div class="files-wrap">
      <!-- 1. Top Summary Bar -->
      <div class="files-summary-bar">
        <div class="files-summary-stats">
          <span class="files-stat-pill stat-total">📁 ${allFiles.length} Total Attachment${allFiles.length === 1 ? '' : 's'}</span>
          <span class="files-stat-pill stat-customer">👤 ${custCount} from Customer</span>
          <span class="files-stat-pill stat-agent">🎧 ${agentCount} from Agent / Team</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn btn-primary btn-sm" onclick="triggerFilesTabUpload()" style="display:inline-flex; align-items:center; gap:5px; font-weight:700;">
            <span>＋</span> Upload File
          </button>
          <input type="file" id="filesTabFileInput" multiple style="display:none;" onchange="handleFilesTabUpload(event)">
        </div>
      </div>

      <!-- 2. Search, Filter & Sort Toolbar -->
      <div class="files-toolbar">
        <div class="files-search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search files by name, sender…" value="${filesSearchQuery}" oninput="onFilesSearchChange(this.value)">
          ${filesSearchQuery ? `<span style="cursor:pointer; color:var(--ink-faint);" onclick="onFilesSearchChange('')">&times;</span>` : ''}
        </div>

        <div class="files-filter-group">
          <select onchange="onFilesSenderFilterChange(this.value)" title="Filter by Sender">
            <option value="all" ${filesSenderFilter === 'all' ? 'selected' : ''}>All Senders</option>
            <option value="customer" ${filesSenderFilter === 'customer' ? 'selected' : ''}>Customer (${custCount})</option>
            <option value="agent" ${filesSenderFilter === 'agent' ? 'selected' : ''}>Agent / Staff (${agentCount})</option>
          </select>

          <select onchange="onFilesTypeFilterChange(this.value)" title="Filter by File Type">
            <option value="all" ${filesTypeFilter === 'all' ? 'selected' : ''}>All Types</option>
            <option value="pdf" ${filesTypeFilter === 'pdf' ? 'selected' : ''}>📄 PDF Documents</option>
            <option value="image" ${filesTypeFilter === 'image' ? 'selected' : ''}>🖼️ Images &amp; Screenshots</option>
            <option value="doc" ${filesTypeFilter === 'doc' ? 'selected' : ''}>📝 Word / Text Docs</option>
            <option value="sheet" ${filesTypeFilter === 'sheet' ? 'selected' : ''}>📊 Excel / Spreadsheets</option>
          </select>

          <select onchange="onFilesSortChange(this.value)" title="Sort Files">
            <option value="newest" ${filesSortMode === 'newest' ? 'selected' : ''}>Date &amp; Time (Newest first)</option>
            <option value="oldest" ${filesSortMode === 'oldest' ? 'selected' : ''}>Date &amp; Time (Oldest first)</option>
            <option value="name_asc" ${filesSortMode === 'name_asc' ? 'selected' : ''}>File Name (A → Z)</option>
            <option value="size_desc" ${filesSortMode === 'size_desc' ? 'selected' : ''}>File Size (Largest)</option>
          </select>

          <div class="files-view-toggle">
            <button type="button" class="files-vbtn ${filesViewLayout === 'grid' ? 'active' : ''}" onclick="setFilesViewLayout('grid')" title="Grid View">⊞ Grid</button>
            <button type="button" class="files-vbtn ${filesViewLayout === 'table' ? 'active' : ''}" onclick="setFilesViewLayout('table')" title="Table View">☰ List</button>
          </div>
        </div>
      </div>
  `;

  // 3. Files Content / Empty State
  if (filtered.length === 0) {
    if (allFiles.length === 0) {
      html += `
        <div style="background:#FFFFFF; border:1px solid var(--line); border-radius:10px; padding:48px 24px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size:48px; margin-bottom:12px;">📁</div>
          <div style="font-size:16px; font-weight:700; color:var(--ink); margin-bottom:6px;">No files shared yet in this ticket</div>
          <div style="font-size:12.5px; color:var(--ink-soft); max-width:440px; margin:0 auto 20px; line-height:1.5;">
            Attachments sent by both customer and agent via WhatsApp, Email, Live Chat, or direct upload will be archived and organized here with exact timestamps.
          </div>
          <button type="button" class="btn btn-primary" onclick="triggerFilesTabUpload()">＋ Upload First File</button>
        </div>
      `;
    } else {
      html += `
        <div style="background:#FFFFFF; border:1px solid var(--line); border-radius:10px; padding:36px 20px; text-align:center;">
          <div style="font-size:32px; margin-bottom:8px;">🔍</div>
          <div style="font-size:14px; font-weight:700; color:var(--ink); margin-bottom:4px;">No files matching your filters</div>
          <div style="font-size:12px; color:var(--ink-soft); margin-bottom:14px;">Try searching for a different keyword or resetting filters.</div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="resetFilesFilters()">↺ Reset Filters</button>
        </div>
      `;
    }
  } else if (filesViewLayout === 'grid') {
    html += `<div class="files-grid-view">`;
    filtered.forEach(file => {
      const senderCls = file.isCustomer ? 'file-sender-cust' : 'file-sender-agent';
      const senderIcon = file.isCustomer ? '👤' : '🎧';
      html += `
        <div class="file-item-card">
          <div class="file-card-header">
            <div class="file-type-icon-box">${getFileIcon(file.name)}</div>
            <div class="file-card-info">
              <div class="file-card-filename" title="${file.name}" onclick="previewAttachment('${file.name}', '${file.url}', '${file.type}')">${file.name}</div>
              <div class="file-card-meta-line">
                <span class="file-sender-tag ${senderCls}">${senderIcon} ${file.senderName} (${file.senderRole})</span>
              </div>
            </div>
          </div>

          <div class="file-card-date-row">
            <span>🕒 ${file.dateFormatted}</span>
            <span style="font-weight:700; color:var(--ink);">${file.size}</span>
          </div>
          <div style="font-size:10.5px; color:var(--ink-faint); display:flex; justify-content:space-between; align-items:center;">
            <span>Source: <b>${file.channel}</b></span>
            <span class="chan-tag ${chanTagClass(file.channel)}" style="font-size:9px; padding:1px 5px;">${file.channel}</span>
          </div>

          <div class="file-card-actions">
            <button type="button" class="file-btn-act file-btn-preview" onclick="previewAttachment('${file.name}', '${file.url}', '${file.type}')">👁 Preview</button>
            <button type="button" class="file-btn-act" onclick="downloadAttachment('${file.name}', '${file.url}')">📥 Download</button>
            <button type="button" class="file-btn-act file-btn-del" onclick="deleteTicketFile('${t.id}', '${file.key}', '${file.name}', '${file.source}', ${file.msgIndex ?? -1}, ${file.attIndex ?? -1}, ${file.fileIndex ?? -1})" title="Delete this attachment">🗑</button>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  } else {
    // Table View
    html += `
      <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; overflow-x:auto; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
        <table class="files-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Shared By</th>
              <th>Channel / Source</th>
              <th>Date &amp; Timestamp</th>
              <th>Size</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;
    filtered.forEach(file => {
      const senderCls = file.isCustomer ? 'file-sender-cust' : 'file-sender-agent';
      const senderIcon = file.isCustomer ? '👤' : '🎧';
      html += `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">${getFileIcon(file.name)}</span>
              <div>
                <div style="font-weight:700; color:var(--ink); cursor:pointer;" onclick="previewAttachment('${file.name}', '${file.url}', '${file.type}')">${file.name}</div>
                <div style="font-size:10.5px; color:var(--ink-faint); text-transform:uppercase;">${file.type}</div>
              </div>
            </div>
          </td>
          <td><span class="file-sender-tag ${senderCls}">${senderIcon} ${file.senderName} (${file.senderRole})</span></td>
          <td><span class="chan-tag ${chanTagClass(file.channel)}" style="font-size:10px; padding:2px 6px;">${file.channel}</span></td>
          <td style="color:var(--ink-soft); font-size:11.5px; white-space:nowrap;">🕒 ${file.dateFormatted}</td>
          <td style="font-weight:600; color:var(--ink); font-size:11.5px;">${file.size}</td>
          <td style="text-align:right; white-space:nowrap;">
            <button type="button" class="btn btn-ghost btn-sm" style="padding:2px 7px; font-size:11px;" onclick="previewAttachment('${file.name}', '${file.url}', '${file.type}')">👁 Preview</button>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:2px 7px; font-size:11px; margin-left:4px;" onclick="downloadAttachment('${file.name}', '${file.url}')">📥 Download</button>
            <button type="button" class="btn btn-ghost btn-sm" style="padding:2px 7px; font-size:11px; margin-left:4px; color:var(--red);" onclick="deleteTicketFile('${t.id}', '${file.key}', '${file.name}', '${file.source}', ${file.msgIndex ?? -1}, ${file.attIndex ?? -1}, ${file.fileIndex ?? -1})" title="Delete attachment">🗑</button>
          </td>
        </tr>
      `;
    });
    html += `</tbody></table></div>`;
  }

  // 4. Drag & Drop Upload Zone at bottom
  html += `
      <div class="files-dropzone" id="filesDropZone" onclick="triggerFilesTabUpload()" ondragover="handleFilesDragOver(event)" ondragleave="handleFilesDragLeave(event)" ondrop="handleFilesDrop(event)">
        <div style="font-size:28px; margin-bottom:6px;">📤</div>
        <div style="font-size:13px; font-weight:700; color:var(--ink);">Click or drag &amp; drop files here to attach to this ticket</div>
        <div style="font-size:11px; color:var(--ink-faint); margin-top:2px;">Supports PDF, PNG, JPG, Word, Excel, CSV (up to 25 MB) · Automatically timestamped and stored in repository</div>
      </div>
    </div>
  `;

  body.innerHTML = html;
}

function triggerFilesTabUpload() {
  const input = document.getElementById('filesTabFileInput');
  if (input) input.click();
}

function handleFilesDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = document.getElementById('filesDropZone');
  if (dz) dz.classList.add('dragover');
}

function handleFilesDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = document.getElementById('filesDropZone');
  if (dz) dz.classList.remove('dragover');
}

function handleFilesDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const dz = document.getElementById('filesDropZone');
  if (dz) dz.classList.remove('dragover');
  const dt = event.dataTransfer;
  if (dt && dt.files && dt.files.length) {
    processUploadedFiles(Array.from(dt.files));
  }
}

function handleFilesTabUpload(event) {
  const files = Array.from(event.target.files || []);
  if (files.length) {
    processUploadedFiles(files);
  }
  event.target.value = '';
}

function processUploadedFiles(files) {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t || !files.length) return;
  t.files = t.files || [];
  const actor = currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID);
  const now = new Date();

  files.forEach(f => {
    const fileRecord = {
      name: f.name,
      size: fmtFileSize(f.size),
      type: f.type || (f.name.endsWith('.pdf') ? 'pdf' : (f.name.match(/\.(png|jpg|jpeg|webp)$/i) ? 'image' : 'document')),
      url: URL.createObjectURL(f),
      senderName: actor,
      senderRole: currentRole === 'manager' ? 'Manager' : 'Agent',
      isCustomer: false,
      channel: 'Direct Upload',
      date: now,
      fileObj: f
    };
    t.files.push(fileRecord);
    addLog(t, `File "${f.name}" (${fileRecord.size}) uploaded to ticket repository by ${actor}`, {
      type: 'field',
      by: currentRole,
      actor: actor,
      undoable: false
    });
  });

  t.updated = 'just now';
  updateFilesTabCount(t);
  renderFilesTab(t);
  renderDetailList();
  showToast(`Uploaded ${files.length} file(s) to repository`);
}

function deleteTicketFile(ticketId, fileKey, fileName, source, msgIndex, attIndex, fileIndex) {
  const t = TICKETS.find(x => x.id === ticketId);
  if (!t) return;
  if (!confirm(`Are you sure you want to delete "${fileName}" from this ticket?`)) return;

  const actor = currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID);

  if (source === 'thread' && msgIndex >= 0 && attIndex >= 0 && t.thread && t.thread[msgIndex] && t.thread[msgIndex].attachments) {
    t.thread[msgIndex].attachments.splice(attIndex, 1);
  } else if (source === 'direct' && fileIndex >= 0 && t.files && t.files[fileIndex]) {
    t.files.splice(fileIndex, 1);
  } else if (t.files) {
    t.files = t.files.filter(f => f.name !== fileName);
  }

  addLog(t, `File "${fileName}" deleted from ticket repository by ${actor}`, {
    type: 'field',
    by: currentRole,
    actor: actor,
    undoable: false
  });

  t.updated = 'just now';
  updateFilesTabCount(t);
  renderFilesTab(t);
  renderDetailList();
  showToast(`File "${fileName}" removed`);
}
function viewEmail(ticketId, msgIndex) {
  const t = TICKETS.find(x => x.id === ticketId);
  const m = t && t.thread[msgIndex];
  if (!t || !m) return;
  const senderVal = m.dir === 'out' ? (m.from || EMAIL_FROM_OPTIONS[0].email) : (m.from || t.email);
  const recipientVal = m.dir === 'out' ? (m.to || t.email) : 'Lenditt Support';
  document.getElementById('viewEmailBody').innerHTML = `
    <div class="ve-row"><div class="ve-k">Direction</div><div class="ve-v">${m.dir === 'out' ? 'Sent' : 'Received'}</div></div>
    <div class="ve-row"><div class="ve-k">Sender</div><div class="ve-v">${senderVal}</div></div>
    <div class="ve-row"><div class="ve-k">To</div><div class="ve-v">${recipientVal}</div></div>
    ${m.cc ? `<div class="ve-row"><div class="ve-k">Cc</div><div class="ve-v">${m.cc}</div></div>` : ''}
    <div class="ve-row"><div class="ve-k">Subject</div><div class="ve-v">${m.subject || t.subject}</div></div>
    <div class="ve-row"><div class="ve-k">Timestamp</div><div class="ve-v">${msgTimestamp(t, m)}</div></div>
    <div class="ve-body-box">${formatMessageText(m.bodyHtml || m.text)}</div>
  `;
  document.getElementById('modalViewEmail').classList.add('show');
}
function retryMessage(ticketId, msgIndex) {
  const t = TICKETS.find(x => x.id === ticketId);
  const msg = t && t.thread[msgIndex];
  if (!msg) return;
  msg.status = 'sending';
  msg.error = null;
  renderConvBody('thread');
  simulateDelivery(t, msg);
}
function simulateDelivery(t, msg) {
  setTimeout(() => {
    const willFail = Math.random() < 0.12;
    if (willFail) {
      msg.status = 'failed';
      msg.error = failureReason(msg.chan);
    } else {
      msg.status = 'delivered';
      if (msg.chan === 'Chat' || msg.chan === 'WhatsApp') {
        setTimeout(() => {
          msg.status = 'read';
          if (selectedTicketId === t.id) renderConvBody('thread');
        }, 1800);
      }
    }
    if (selectedTicketId === t.id) renderConvBody('thread');
  }, 900);
}

/* =========================================================
   EMAIL COMPOSER (TO, CC, REPLY ALL, SIGNATURES & DRAFTS)
========================================================= */
let ecToRecipients = [];
let ecCcRecipients = [];

// Quick suggested CC escalation contacts
const EC_SUGGESTED_CC = [
  { name: 'Collections Lead', email: 'collections.mgr@lenditt.com' },
  { name: 'Support Supervisor', email: 'support.lead@lenditt.com' },
  { name: 'Grievance Officer', email: 'grievance@lenditt.com' },
  { name: 'Disbursal Ops', email: 'disbursals@lenditt.com' },
  { name: 'Legal Team', email: 'legal@chinmayfinlease.com' }
];

function populateEmailFromOptions(selectedEmail) {
  const sel = document.getElementById('ecFrom');
  if (!sel) return;
  sel.innerHTML = EMAIL_FROM_OPTIONS.map(o => `<option value="${o.email}" ${selectedEmail && selectedEmail.toLowerCase() === o.email.toLowerCase() ? 'selected' : ''}>${o.email}</option>`).join('');
  enhanceSearchSelect(sel);
}

function handleEmailFromChange() {
  updateSignaturePreview();
}

function populateEmailTemplateOptions() {
  const sel = document.getElementById('ecTemplateSelect');
  const items = TEMPLATES.filter(tp => tp.channel === 'Email');
  sel.innerHTML = `<option value="">Select a template…</option>` + items.map(tp => `<option value="${tp.id}">${tp.title}</option>`).join('');
  enhanceSearchSelect(sel);
}

function updateSignaturePreview() {
  const sel = document.getElementById('ecFrom');
  const fromEmail = sel ? sel.value : (EMAIL_FROM_OPTIONS[0] ? EMAIL_FROM_OPTIONS[0].email : '');
  const sig = getSignatureForFromEmail(fromEmail);
  const previewEl = document.getElementById('ecSignaturePreview');
  if (previewEl) {
    previewEl.innerHTML = `<span class="ec-sig-label">Signature (auto-applied on send)</span>${sig}`;
  }
}

function focusRecipientInput(inputId) {
  const inp = document.getElementById(inputId);
  if (inp) inp.focus();
}

function toggleCcField() {
  const row = document.getElementById('ecCcRow');
  const btn = document.getElementById('btnToggleCc');
  if (!row) return;
  if (row.style.display === 'none' || !row.style.display) {
    row.style.display = 'block';
    if (btn) btn.style.display = 'none';
    renderCcSuggestions();
    focusRecipientInput('ecCcInput');
  } else {
    row.style.display = 'none';
    if (btn) btn.style.display = 'inline';
  }
}

function hideCcField() {
  const row = document.getElementById('ecCcRow');
  const btn = document.getElementById('btnToggleCc');
  if (row) row.style.display = 'none';
  if (btn) btn.style.display = 'inline';
}

function renderCcSuggestions() {
  const suggContainer = document.getElementById('ecCcSuggestions');
  if (!suggContainer) return;
  suggContainer.innerHTML = `
    <span class="ec-sugg-label">Quick Add CC:</span>
    ${EC_SUGGESTED_CC.map(s => `
      <button type="button" class="ec-sugg-chip" onclick="addSuggestedCc('${s.email}', '${s.name}', event)">
        <span>+</span> <b>${s.name}</b> <span style="opacity:0.8;">(${s.email})</span>
      </button>
    `).join('')}
  `;
}

function getThreadCcEmails(t) {
  const ccs = new Set();
  if (!t) return [];
  if (t.cc) {
    t.cc.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(e => ccs.add(e.toLowerCase()));
  }
  if (t.emailCc) {
    t.emailCc.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(e => ccs.add(e.toLowerCase()));
  }
  if (Array.isArray(t.thread)) {
    t.thread.forEach(m => {
      if (m.cc) {
        m.cc.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(e => ccs.add(e.toLowerCase()));
      }
      if (Array.isArray(m.ccRecipients)) {
        m.ccRecipients.forEach(r => {
          const em = typeof r === 'string' ? r : (r && r.email);
          if (em) ccs.add(em.trim().toLowerCase());
        });
      }
    });
  }
  if (t.email) ccs.delete(t.email.toLowerCase());
  EMAIL_FROM_OPTIONS.forEach(opt => {
    if (opt.email) ccs.delete(opt.email.toLowerCase());
  });
  return Array.from(ccs);
}

function addSuggestedCc(email, name, event) {
  if (event) event.stopPropagation();
  if (!ecCcRecipients.some(r => r.email.toLowerCase() === email.toLowerCase())) {
    ecCcRecipients.push({ email: email });
    renderCcChips();
  }
  focusRecipientInput('ecCcInput');
}

function renderToChips() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  const container = document.getElementById('ecToChips');
  if (!container) return;

  container.innerHTML = ecToRecipients.map((rec, i) => `
    <div class="recipient-chip" id="toChip_${i}" title="${rec.email}">
      <span class="rc-email">${rec.email}</span>
      <button type="button" class="rc-action-btn" onclick="startEditRecipient('to', ${i}, event)" title="Edit email">✏️</button>
      <button type="button" class="rc-action-btn rc-del" onclick="removeRecipient('to', ${i}, event)" title="Remove email">✕</button>
    </div>
  `).join('');

  const hintSpan = document.getElementById('ecToRegisteredHint');
  const restoreBtn = document.getElementById('btnRestoreRegisteredTo');
  if (hintSpan) {
    hintSpan.style.display = ecToRecipients.length === 0 ? 'inline' : 'none';
  }
  if (restoreBtn) {
    const hasDefault = t && ecToRecipients.some(r => r.email.toLowerCase() === t.email.toLowerCase());
    restoreBtn.style.display = hasDefault ? 'none' : 'inline';
    if (t) restoreBtn.textContent = `↩ Add ${t.email}`;
  }
}

function renderCcChips() {
  const container = document.getElementById('ecCcChips');
  if (!container) return;

  container.innerHTML = ecCcRecipients.map((rec, i) => `
    <div class="recipient-chip recipient-chip-cc" id="ccChip_${i}" title="${rec.email}">
      <span class="rc-email">${rec.email}</span>
      <button type="button" class="rc-action-btn" onclick="startEditRecipient('cc', ${i}, event)" title="Edit email">✏️</button>
      <button type="button" class="rc-action-btn rc-del" onclick="removeRecipient('cc', ${i}, event)" title="Remove email">✕</button>
    </div>
  `).join('');
}

function removeRecipient(type, index, event) {
  if (event) event.stopPropagation();
  if (type === 'to') {
    ecToRecipients.splice(index, 1);
    renderToChips();
    focusRecipientInput('ecToInput');
  } else {
    ecCcRecipients.splice(index, 1);
    renderCcChips();
    focusRecipientInput('ecCcInput');
  }
}

function restoreRegisteredTo() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  if (!ecToRecipients.some(r => r.email.toLowerCase() === t.email.toLowerCase())) {
    ecToRecipients.unshift({ email: t.email });
  }
  renderToChips();
  focusRecipientInput('ecToInput');
}

function startEditRecipient(type, index, event) {
  if (event) event.stopPropagation();
  const list = type === 'to' ? ecToRecipients : ecCcRecipients;
  const chipEl = document.getElementById(`${type}Chip_${index}`);
  if (!chipEl || !list[index]) return;

  const currentEmail = list[index].email;
  chipEl.innerHTML = `
    <input type="text" class="rc-inline-edit" value="${currentEmail}" id="inlineEdit_${type}_${index}">
    <button type="button" class="rc-action-btn" style="color:var(--teal); font-weight:700;" onclick="saveEditRecipient('${type}', ${index}, event)">✓</button>
    <button type="button" class="rc-action-btn" onclick="${type === 'to' ? 'renderToChips()' : 'renderCcChips()'}" title="Cancel">✕</button>
  `;
  const inp = document.getElementById(`inlineEdit_${type}_${index}`);
  if (inp) {
    inp.focus();
    inp.select();
    inp.onkeydown = function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEditRecipient(type, index, e);
      } else if (e.key === 'Escape') {
        if (type === 'to') renderToChips(); else renderCcChips();
      }
    };
    inp.onblur = function (e) {
      setTimeout(() => {
        saveEditRecipient(type, index, e);
      }, 150);
    };
  }
}

function saveEditRecipient(type, index, event) {
  if (event && event.stopPropagation) event.stopPropagation();
  const inp = document.getElementById(`inlineEdit_${type}_${index}`);
  if (!inp) return;
  const val = inp.value.trim();
  const list = type === 'to' ? ecToRecipients : ecCcRecipients;

  if (val && val.includes('@')) {
    list[index] = { email: val };
  } else if (!val) {
    list.splice(index, 1);
  }
  if (type === 'to') renderToChips(); else renderCcChips();
}

function handleRecipientKeydown(event, type) {
  if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab' || event.key === ';') {
    event.preventDefault();
    commitRecipientInput(type);
  } else if (event.key === 'Backspace') {
    const inputEl = document.getElementById(type === 'to' ? 'ecToInput' : 'ecCcInput');
    const list = type === 'to' ? ecToRecipients : ecCcRecipients;
    if (inputEl && inputEl.value === '' && list.length > 0) {
      list.pop();
      if (type === 'to') renderToChips(); else renderCcChips();
    }
  }
}

function handleRecipientBlur(type) {
  commitRecipientInput(type);
}

function commitRecipientInput(type) {
  const inputEl = document.getElementById(type === 'to' ? 'ecToInput' : 'ecCcInput');
  if (!inputEl) return;
  const raw = inputEl.value.trim().replace(/^[,;\s]+|[,;\s]+$/g, '');
  if (!raw) return;

  const emails = raw.split(/[,;\s]+/).filter(e => e.length > 0);

  emails.forEach(item => {
    let email = item;
    const match = item.match(/^(.*?)[<](.*?)[>]$/);
    if (match) {
      email = match[2].trim();
    }
    if (email.includes('@')) {
      const list = type === 'to' ? ecToRecipients : ecCcRecipients;
      if (!list.some(r => r.email.toLowerCase() === email.toLowerCase())) {
        list.push({ email: email });
      }
    } else {
      showToast(`Please enter a valid email address (${item})`);
    }
  });

  inputEl.value = '';
  if (type === 'to') renderToChips(); else renderCcChips();
}

function openEmailComposer(isReplyAll = false) {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;

  // 1. Populate From options matching ticket queue/department
  const matchOpt = EMAIL_FROM_OPTIONS.find(o => o.dept.toLowerCase() === (t.department || t.queue || '').toLowerCase()) || EMAIL_FROM_OPTIONS[0];
  populateEmailFromOptions(matchOpt.email);
  populateEmailTemplateOptions();

  // 2. Setup Recipients (To & Cc)
  const draft = t.emailDraft;
  if (draft) {
    document.getElementById('ecDraftNotice').style.display = 'block';
    if (draft.from) populateEmailFromOptions(draft.from);
    document.getElementById('ecSubject').value = draft.subject || '';
    document.getElementById('ecBody').innerHTML = draft.bodyHtml || '';
    ecAttachments = draft.attachments ? [...draft.attachments] : [];

    // Parse draft To
    ecToRecipients = [];
    if (Array.isArray(draft.toRecipients) && draft.toRecipients.length > 0) {
      ecToRecipients = draft.toRecipients.map(r => ({ email: typeof r === 'string' ? r : r.email }));
    } else if (draft.to) {
      const toArr = draft.to.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      ecToRecipients = toArr.map(e => ({ email: e }));
    } else {
      ecToRecipients = [{ email: t.email }];
    }

    // Parse draft CC or auto-merge thread CCs
    ecCcRecipients = [];
    if (Array.isArray(draft.ccRecipients) && draft.ccRecipients.length > 0) {
      ecCcRecipients = draft.ccRecipients.map(r => ({ email: typeof r === 'string' ? r : r.email }));
    } else if (draft.cc) {
      const ccArr = draft.cc.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      ecCcRecipients = ccArr.map(e => ({ email: e }));
    }

    // Automatically include any CC from customer or agent side in thread
    const threadCcs = getThreadCcEmails(t);
    threadCcs.forEach(em => {
      if (!ecCcRecipients.some(r => r.email.toLowerCase() === em.toLowerCase()) &&
        !ecToRecipients.some(r => r.email.toLowerCase() === em.toLowerCase())) {
        ecCcRecipients.push({ email: em });
      }
    });

    if (ecCcRecipients.length > 0 || isReplyAll) {
      document.getElementById('ecCcRow').style.display = 'block';
      const btn = document.getElementById('btnToggleCc');
      if (btn) btn.style.display = 'none';
      renderCcSuggestions();
    } else {
      hideCcField();
    }
  } else {
    document.getElementById('ecDraftNotice').style.display = 'none';
    document.getElementById('ecSubject').value = t.subject.startsWith('Re:') ? t.subject : `Re: ${t.subject}`;
    document.getElementById('ecBody').innerHTML = '';
    ecAttachments = [];

    // Default To is just the email address
    ecToRecipients = [{ email: t.email }];

    // Automatically retrieve and include any CC from customer side or agent side in thread
    ecCcRecipients = [];
    const threadCcs = getThreadCcEmails(t);
    threadCcs.forEach(em => {
      if (!ecCcRecipients.some(r => r.email.toLowerCase() === em.toLowerCase()) &&
        !ecToRecipients.some(r => r.email.toLowerCase() === em.toLowerCase())) {
        ecCcRecipients.push({ email: em });
      }
    });

    // If there are CC emails in thread OR isReplyAll is true, automatically show CC row
    if (ecCcRecipients.length > 0 || isReplyAll) {
      document.getElementById('ecCcRow').style.display = 'block';
      const btn = document.getElementById('btnToggleCc');
      if (btn) btn.style.display = 'none';
      renderCcSuggestions();
    } else {
      hideCcField();
    }
  }

  renderToChips();
  renderCcChips();
  renderEmailAttachChips();
  updateSignaturePreview();
  document.getElementById('modalEmailCompose').classList.add('show');

  if (isReplyAll) {
    focusRecipientInput('ecCcInput');
  }
}
function closeEmailComposer() { document.getElementById('modalEmailCompose').classList.remove('show'); }
function discardEmail() {
  document.getElementById('ecSubject').value = '';
  document.getElementById('ecBody').innerHTML = '';
  ecAttachments = [];
  ecToRecipients = [];
  ecCcRecipients = [];
  renderEmailAttachChips();
  closeEmailComposer();
}
function rteExec(cmd, val) {
  document.getElementById('ecBody').focus();
  document.execCommand(cmd, false, val || null);
}
function useEmailTemplate() {
  const id = document.getElementById('ecTemplateSelect').value;
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!id || !t) return;
  const tp = TEMPLATES.find(x => x.id === id);
  if (!tp) return;
  document.getElementById('ecBody').innerHTML = fillTemplate(tp.body, t).replace(/\n/g, '<br>');
}
function openAddTemplate() {
  document.getElementById('newTplTitle').value = '';
  document.getElementById('newTplBody').value = '';
  document.getElementById('modalAddTemplate').classList.add('show');
}
function saveNewEmailTemplate() {
  const title = document.getElementById('newTplTitle').value.trim();
  const body = document.getElementById('newTplBody').value.trim();
  if (!title || !body) { showToast('Please add a template name and body'); return; }
  const id = 'tplE' + Date.now();
  TEMPLATES.push({ id, channel: 'Email', title, body });
  populateEmailTemplateOptions();
  document.getElementById('ecTemplateSelect').value = id;
  closeModal('modalAddTemplate');
  showToast('Template saved');
}
function saveEmailDraft() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;

  commitRecipientInput('to');
  commitRecipientInput('cc');

  const from = document.getElementById('ecFrom').value;
  const toStr = ecToRecipients.map(r => r.email).join(', ');
  const ccStr = ecCcRecipients.map(r => r.email).join(', ');
  const subject = document.getElementById('ecSubject').value;
  const bodyHtml = document.getElementById('ecBody').innerHTML;

  t.emailDraft = {
    from: from,
    to: toStr,
    cc: ccStr,
    toRecipients: [...ecToRecipients],
    ccRecipients: [...ecCcRecipients],
    subject: subject,
    bodyHtml: bodyHtml,
    attachments: [...ecAttachments],
    savedAt: new Date()
  };
  closeEmailComposer();
  renderConvBody('thread');
  showToast('Email draft saved — viewable in ticket thread');
}
function discardTicketDraft() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  t.emailDraft = null;
  ecAttachments = [];
  ecToRecipients = [];
  ecCcRecipients = [];
  renderEmailAttachChips();
  renderConvBody('thread');
  showToast('Email draft discarded');
}
function sendEmailFromComposer() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;

  commitRecipientInput('to');
  commitRecipientInput('cc');

  if (ecToRecipients.length === 0) {
    showToast('Please add at least one recipient in the To field');
    focusRecipientInput('ecToInput');
    return;
  }

  const from = document.getElementById('ecFrom').value;
  const toStr = ecToRecipients.map(r => r.email).join(', ');
  const ccStr = ecCcRecipients.map(r => r.email).join(', ');
  const subject = document.getElementById('ecSubject').value.trim();
  const bodyHtml = document.getElementById('ecBody').innerHTML.trim();

  if (!subject || !bodyHtml || bodyHtml === '<br>') { showToast('Add a subject and message before sending'); return; }

  const sigHtml = getSignatureForFromEmail(from);
  const fullBodyHtml = `${bodyHtml}<br><br>${sigHtml}`;
  const now = new Date();

  const msg = {
    dir: 'out', chan: 'Email', subject, from, to: toStr, cc: ccStr,
    toRecipients: [...ecToRecipients], ccRecipients: [...ecCcRecipients],
    bodyHtml: fullBodyHtml,
    text: subject, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), ts: now, status: 'sending',
    attachments: [...ecAttachments]
  };
  t.thread.push(msg);
  t.emailDraft = null;
  ecAttachments = [];
  ecToRecipients = [];
  ecCcRecipients = [];
  renderEmailAttachChips();

  const logMsg = `Email sent to ${toStr}${ccStr ? ` (Cc: ${ccStr})` : ''}${msg.attachments.length ? ` with ${msg.attachments.length} attachment(s)` : ''}`;
  addLog(t, logMsg, { type: 'message', by: currentRole, actor: agentName(CURRENT_AGENT_ID), undoable: false });

  if (t.status === 'unassigned') t.status = 'Assigned';
  t.updated = 'just now';
  simulateDelivery(t, msg);
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
function openCallModal() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  callSeconds = 0;
  callConnected = false;
  document.getElementById('modalCall').classList.add('show');
  const initials = t.customer.split(' ').map(w => w[0]).join('');
  document.getElementById('callModalBody').innerHTML = `<div class="call-body">
    <div class="call-avatar">${initials}</div>
    <div class="call-name">${t.customer}</div>
    <div class="call-status">📞 Dialing ${t.phone}…</div>
    <div class="call-actions"><button class="btn btn-danger btn-sm" onclick="cancelCallModal()">Cancel</button></div>
  </div>`;
  setTimeout(() => {
    if (!document.getElementById('modalCall').classList.contains('show')) return;
    callConnected = true;
    document.getElementById('callModalBody').innerHTML = `<div class="call-body">
      <div class="call-avatar call-live">${initials}</div>
      <div class="call-name">${t.customer}</div>
      <div class="call-status">Connected</div>
      <div class="call-duration" id="callDuration">00:00</div>
      <div class="call-actions"><button class="btn btn-danger" onclick="endCall()">⏹ End call</button></div>
    </div>`;
    callTimer = setInterval(() => {
      callSeconds++;
      const el = document.getElementById('callDuration');
      if (el) {
        const mm = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        const ss = String(callSeconds % 60).padStart(2, '0');
        el.textContent = `${mm}:${ss}`;
      }
    }, 1000);
  }, 1400);
}
function cancelCallModal() {
  clearInterval(callTimer);
  document.getElementById('modalCall').classList.remove('show');
}
function endCall() {
  clearInterval(callTimer);
  const t = TICKETS.find(x => x.id === selectedTicketId);
  document.getElementById('modalCall').classList.remove('show');
  if (!t || !callConnected) return;
  const dur = callSeconds;
  const durLabel = `${String(Math.floor(dur / 60)).padStart(2, '0')}:${String(dur % 60).padStart(2, '0')}`;
  const now = new Date();
  const agent = agentName(t.assignee);
  t.thread.push({
    dir: 'out', call: true, chan: 'Call', ts: now, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
function shareFeedbackLink() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) { return; }
  if (currentRole !== 'manager') {
    showToast('Only managers can share the customer feedback link.');
    return;
  }

  const channel = ['WhatsApp', 'SMS', 'Chat'].includes(replyChannel) ? replyChannel : (t.channel || 'Chat');
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

function sendReply() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  const replyInput = document.getElementById('replyText');
  const text = replyInput ? replyInput.value.trim() : '';

  if (!text && replyAttachments.length === 0) {
    showToast('Please enter a message or attach a file to send');
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isNote = replyMode === 'note';
  const chan = ['WhatsApp', 'SMS', 'Chat'].includes(replyChannel) ? replyChannel : (t.channel || 'Chat');
  const actor = currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID);

  const newMsg = {
    dir: isNote ? 'note' : 'out',
    chan: isNote ? 'Internal' : chan,
    text: text || (replyAttachments.length ? `[Sent ${replyAttachments.length} attachment(s)]` : ''),
    time: timeStr,
    ts: now,
    actor: actor,
    status: 'sending',
    attachments: replyAttachments.length ? [...replyAttachments] : []
  };

  t.thread = t.thread || [];
  t.thread.push(newMsg);

  if (replyInput) replyInput.value = '';
  replyAttachments = [];
  renderReplyAttachChips();

  const attText = newMsg.attachments.length ? ` with ${newMsg.attachments.length} attachment(s)` : '';
  const logText = isNote
    ? `Internal note added by ${actor}${attText}`
    : `Reply sent via ${chan} by ${actor}${attText}`;
  addLog(t, logText, {
    type: 'message',
    by: currentRole,
    actor: actor,
    undoable: false
  });

  if (t.status === 'unassigned') t.status = 'Assigned';
  t.updated = 'just now';

  simulateDelivery(t, newMsg);
  renderConvBody(currentActiveTab || 'thread');
  renderDetailList();
  renderProps(t);
  updateFilesTabCount(t);
  showToast(isNote ? 'Internal note added' : `Reply sent via ${chan}`);
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

function getQueueCategoryOptions(queue, currentCategory) {
  const options = DEPARTMENT_TAXONOMY[queue]?.categories || ['General query', 'Other'];
  return options.includes(currentCategory) ? options : options;
}

function getDepartmentCategoryOptions(department) {
  return DEPARTMENT_TAXONOMY[department]?.categories || ['General query', 'Other'];
}

function getDepartmentSubCategoryOptions(department, category) {
  const sub = DEPARTMENT_TAXONOMY[department]?.subcategories?.[category] || ['Other'];
  return sub;
}

function applyQueueCategoryDefault(queue, currentCategory) {
  const options = DEPARTMENT_TAXONOMY[queue]?.categories || ['General query'];
  return options.includes(currentCategory) ? currentCategory : options[0];
}

function applySubCategoryDefault(department, category, currentSubCategory) {
  const options = getDepartmentSubCategoryOptions(department, category);
  return options.includes(currentSubCategory) ? currentSubCategory : options[0];
}

function syncCreateTicketCategoryOptions() {
  const queueSel = document.getElementById('ctQueue');
  const categorySel = document.getElementById('ctCategory');
  if (!queueSel || !categorySel) return;
  const options = DEPARTMENT_TAXONOMY[queueSel.value]?.categories || ['General query', 'Other'];
  const selected = options.includes(categorySel.value) ? categorySel.value : options[0];
  categorySel.innerHTML = options.map(opt => `<option value="${opt}" ${opt === selected ? 'selected' : ''}>${opt}</option>`).join('');
  if (categorySel.dataset.sselDone === '1') { refreshSearchSelect(categorySel); }
}

function formatTicketCreatedStamp(ticket) {
  if (!ticket || !ticket.createdAt) return '—';
  const d = new Date(ticket.createdAt);
  return `${d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
function formatAuditStamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return `${d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
function normalizeActivityEntry(ticket, entry, index) {
  if (typeof entry === 'string') {
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

function getRelatedTicketsForCustomer(ticket) {
  if (!ticket) return [];
  return TICKETS.filter(item => item.customer === ticket.customer && item.id !== ticket.id && item.status !== 'Closed' && item.status !== 'Resolved' && item.status !== 'Merge' && item.status !== 'Merged' && item.status !== 'Junk')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

let isOtherTicketsExpanded = false;

function toggleOtherTicketsExpand() {
  isOtherTicketsExpanded = !isOtherTicketsExpanded;
  const shell = document.querySelector('.detail-shell');
  if (shell) {
    shell.classList.toggle('expand-other-tix', isOtherTicketsExpanded);
  }
  const currentTicket = TICKETS.find(x => x.id === selectedTicketId);
  if (currentTicket) renderProps(currentTicket);
}

function getFrtInfo(t) {
  let targetMins = 15;
  if (t.priority === 'High') targetMins = 15;
  else if (t.priority === 'Medium') targetMins = 30;
  else targetMins = 60;

  if (t.intraDepartment && t.intraDepartment !== 'None' && t.intraDepartment !== 'none') {
    return {
      status: 'Stopped',
      statusText: `Stopped (${t.intraDepartment})`,
      badgeClass: 'sla-stopped',
      targetText: `${targetMins}m target`,
      timeStr: `Stopped for ${t.intraDepartment} intra-dept`,
      achieved: false,
      frtMins: 0,
      stopped: true
    };
  }

  const firstReply = (t.thread || []).find(m => m.dir === 'out');

  if (firstReply) {
    let frtAchievedMins = 8;
    if (t.priority === 'High') frtAchievedMins = Math.min(12, Math.max(3, (t.id.charCodeAt(t.id.length - 1) % 10) + 4));
    else if (t.priority === 'Medium') frtAchievedMins = Math.min(25, Math.max(8, (t.id.charCodeAt(t.id.length - 1) % 15) + 8));
    else frtAchievedMins = Math.min(45, Math.max(15, (t.id.charCodeAt(t.id.length - 1) % 20) + 15));

    return {
      status: 'Achieved',
      statusText: `${frtAchievedMins}m (Met Target)`,
      badgeClass: 'sla-ok',
      targetText: `${targetMins}m target`,
      timeStr: firstReply.time || '10:05 AM',
      achieved: true,
      frtMins: frtAchievedMins
    };
  } else {
    const now = new Date();
    const created = t.createdAt ? new Date(t.createdAt) : now;
    const elapsedMins = Math.max(0, Math.floor((now - created) / 60000));
    const remainingMins = targetMins - elapsedMins;
    const isBreached = remainingMins < 0;

    return {
      status: 'Pending',
      statusText: isBreached ? `Breached by ${Math.abs(remainingMins)}m` : `${remainingMins}m remaining`,
      badgeClass: isBreached ? 'sla-breach' : (remainingMins < 10 ? 'sla-warn' : 'sla-ok'),
      targetText: `${targetMins}m target`,
      timeStr: 'Awaiting first agent reply',
      achieved: false,
      frtMins: remainingMins
    };
  }
}

function renderProps(t) {
  const managerOnlyFeedback = currentRole === 'manager' ? `<button class="btn btn-ghost btn-sm" onclick="shareFeedbackLink()">⭐ Share feedback link</button>` : '';

  const dept = t.department || t.queue || 'Support';
  const allowedAgentIds = DEPT_AGENTS[dept] || [];
  let allowedAgents = AGENTS.filter(a => allowedAgentIds.includes(a.id));

  if (t.assignee && !allowedAgentIds.includes(t.assignee)) {
    const currentAssigneeObj = AGENTS.find(a => a.id === t.assignee);
    if (currentAssigneeObj) {
      allowedAgents = [currentAssigneeObj, ...allowedAgents];
    }
  }

  let availableCategories = [];
  if (typeof DEPT_CAT_SUBCAT !== 'undefined' && DEPT_CAT_SUBCAT[dept]) {
    availableCategories = Object.keys(DEPT_CAT_SUBCAT[dept]);
  } else if (typeof DEPT_CAT_SUBCAT !== 'undefined') {
    Object.values(DEPT_CAT_SUBCAT).forEach(catObj => {
      Object.keys(catObj).forEach(c => {
        if (!availableCategories.includes(c)) availableCategories.push(c);
      });
    });
  }
  if (t.category && !availableCategories.includes(t.category)) {
    availableCategories.unshift(t.category);
  }

  let availableSubCats = [];
  if (typeof DEPT_CAT_SUBCAT !== 'undefined' && dept && t.category && DEPT_CAT_SUBCAT[dept] && DEPT_CAT_SUBCAT[dept][t.category]) {
    availableSubCats = DEPT_CAT_SUBCAT[dept][t.category];
  } else if (typeof DEPT_CAT_SUBCAT !== 'undefined' && t.category) {
    Object.values(DEPT_CAT_SUBCAT).forEach(catObj => {
      if (catObj[t.category]) {
        catObj[t.category].forEach(sc => {
          if (!availableSubCats.includes(sc)) availableSubCats.push(sc);
        });
      }
    });
  }
  if (t.subCategory && !availableSubCats.includes(t.subCategory)) {
    availableSubCats.unshift(t.subCategory);
  }

  const associatedTickets = getRelatedTicketsForCustomer(t);
  const frt = getFrtInfo(t);
  const isIntraDept = t.intraDepartment && t.intraDepartment !== 'None' && t.intraDepartment !== 'none';
  const otherTicketsCount = associatedTickets.length;

  const shell = document.querySelector('.detail-shell');
  if (shell) {
    shell.classList.toggle('expand-other-tix', isOtherTicketsExpanded);
  }

  const assocHtml = associatedTickets.length
    ? `<table class="other-tix-table ${isOtherTicketsExpanded ? 'other-tix-table-expanded' : ''}">
        <thead>
          <tr>
            <th>Ticket id</th>
            ${isOtherTicketsExpanded ? '<th>Subject</th>' : ''}
            <th>Loan stage</th>
            <th>Dept</th>
            <th>Channel</th>
            <th>Created</th>
            <th>Status</th>
            ${isOtherTicketsExpanded ? '<th style="text-align:center;">Action</th>' : ''}
          </tr>
        </thead>
        <tbody>${associatedTickets.map(item => `
          <tr class="other-tix-row" onclick="openTicket('${item.id}')">
            <td><a href="?ticket=${item.id}" target="_blank" class="tix-link-btn" onclick="event.preventDefault(); openTicketInNewTab('${item.id}')">${item.id} ↗</a></td>
            ${isOtherTicketsExpanded ? `<td style="font-weight:600; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.subject || '—'}</td>` : ''}
            <td>${item.loanStage || '—'}</td>
            <td><span class="dept-pill" style="font-size:9.5px; padding:1px 5px;">${item.department || item.queue || 'Support'}</span></td>
            <td>${item.channel || '—'}</td>
            <td>${formatTicketCreatedStamp(item)}</td>
            <td><span class="status-badge ${statusClass(item.status)}" style="font-size:9.5px; padding:1px 5px;">${item.status || 'Open'}</span></td>
            ${isOtherTicketsExpanded ? `<td style="text-align:center;"><button class="btn btn-ghost btn-sm" style="padding:1px 6px; font-size:10px;" onclick="event.stopPropagation(); openTicket('${item.id}')">View</button></td>` : ''}
          </tr>`).join('')}</tbody>
      </table>`
    : '<div style="font-size:11.5px;color:var(--ink-faint);padding:10px 0;text-align:center;">No related tickets for this customer.</div>';

  document.getElementById('propsPanel').innerHTML = `
    <!-- 1. Ticket properties -->
    <h4 style="margin-top:0;">Ticket properties</h4>
    <div class="prop-row"><label>Status</label>
      <select onchange="updateTicketField('status', this.value)">${STATUSES.map(s => `<option ${s === t.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
    </div>
    <div class="prop-row"><label>Priority</label>
      <select onchange="updateTicketField('priority', this.value)">${['Low', 'Medium', 'High'].map(p => `<option ${p === t.priority ? 'selected' : ''}>${p}</option>`).join('')}</select>
    </div>
    <div class="prop-row"><label>Department</label>
      <select onchange="updateTicketField('department', this.value)">${['Support', 'Collection', 'Legal Related', 'Grievance'].map(d => `<option ${d === (t.department || t.queue) ? 'selected' : ''}>${d}</option>`).join('')}</select>
    </div>
    <div class="prop-row"><label>Assignee</label>
      <select onchange="updateTicketField('assignee', this.value)">
        <option value="">— Unassigned —</option>
        ${allowedAgents.map(a => `<option value="${a.id}" ${t.assignee === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
      </select>
    </div>
    <div class="prop-row"><label>Intra department</label>
      <select id="propIntraDepartment" onchange="updateTicketField('intraDepartment', this.value)">
        <option value="None" ${(!t.intraDepartment || t.intraDepartment === 'None') ? 'selected' : ''}>None</option>
        <option value="Sales" ${t.intraDepartment === 'Sales' ? 'selected' : ''}>Sales</option>
        <option value="Collection" ${t.intraDepartment === 'Collection' ? 'selected' : ''}>Collection</option>
      </select>
    </div>
    <div class="prop-row"><label>Category</label>
      <select id="propCategory" onchange="onPropCategoryChange(this.value)">
        <option value="">— Select Category —</option>
        ${availableCategories.map(c => `<option value="${c}" ${c === t.category ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="prop-row"><label>Sub category</label>
      <select id="propSubCategory" onchange="updateTicketField('subCategory', this.value)">
        <option value="">— Select Sub Category —</option>
        ${availableSubCats.map(sc => `<option value="${sc}" ${sc === t.subCategory ? 'selected' : ''}>${sc}</option>`).join('')}
      </select>
    </div>

    <!-- 2. Ticket actions -->
    <h4>Ticket actions</h4>
    <div class="action-grid">
      <button class="btn btn-ghost btn-sm" onclick="openMerge()">⇄ Merge</button>
      <button class="btn btn-ghost btn-sm" onclick="openEscalate()">▲ Escalate</button>
      <button class="btn btn-ghost btn-sm" onclick="openReassign()">↻ Reassign</button>
      <button class="btn btn-ghost btn-sm" onclick="closeTicket()">⏹ Close</button>
      <button class="btn btn-ghost btn-sm" onclick="archiveCurrentTicket()" title="Archive this ticket">📦 Archive</button>
      <button class="btn btn-ghost btn-sm" onclick="deleteCurrentTicket()" style="color:var(--red);" title="Delete this ticket">🗑 Delete</button>
      ${managerOnlyFeedback}
    </div>

    <!-- 3. SLA -->
    <h4>SLA</h4>
    ${isIntraDept ? `
    <div class="sla-box" style="border-left: 3px solid #4F46E5; background: #EEF2FF;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>${t.priority} priority target</div>
        <span style="font-size:9.5px; font-weight:700; color:#4F46E5; text-transform:uppercase;">Resolution SLA</span>
      </div>
      <div class="big" style="color:#4F46E5; font-size:16px;">⏸️ SLA Stopped (${t.intraDepartment})</div>
    </div>
    <div style="margin-top: 8px; font-size: 11px; display: flex; flex-direction: column; gap: 6px; padding: 10px; background: var(--panel); border-radius: 6px; border: 1px solid var(--line-soft);">
      <div style="display:flex; justify-content:space-between;"><span>Intra-dept Status:</span><b style="color:#4F46E5;">SLA calculations stopped</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Created:</span><b>${fmtDateTime(t.createdAt)}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Closed:</span><b>${(t.status === 'Closed' || t.status === 'Resolved') ? fmtDateTime(getTicketClosedDate(t)) : '—'}</b></div>
    </div>
    ` : `
    <div class="sla-box">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>${t.priority} priority target</div>
        <span style="font-size:9.5px; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">Resolution SLA</span>
      </div>
      <div class="big ${t.slaMins < 0 ? 'sla-breach' : (t.slaMins < 60 ? 'sla-warn' : 'sla-ok')}">${t.slaMins < 0 ? 'Breached by ' + Math.abs(t.slaMins) + 'm' : t.slaMins + 'm remaining'}</div>
    </div>
    <div style="margin-top: 8px; font-size: 11px; display: flex; flex-direction: column; gap: 6px; padding: 10px; background: var(--panel); border-radius: 6px; border: 1px solid var(--line-soft);">
      <div style="display:flex; justify-content:space-between;"><span>Created:</span><b>${fmtDateTime(t.createdAt)}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Closed:</span><b>${(t.status === 'Closed' || t.status === 'Resolved') ? fmtDateTime(getTicketClosedDate(t)) : '—'}</b></div>
    </div>
    `}

    <!-- 4. FRT -->
    <h4>FRT</h4>
    ${isIntraDept ? `
    <div class="sla-box" style="border-left: 3px solid #4F46E5; background: #EEF2FF;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>${frt.targetText}</div>
        <span style="font-size:9.5px; font-weight:700; color:#4F46E5; text-transform:uppercase;">First Response</span>
      </div>
      <div class="big" style="color:#4F46E5; font-size:16px;">⏸️ FRT Stopped (${t.intraDepartment})</div>
    </div>
    <div style="margin-top: 8px; font-size: 11px; display: flex; flex-direction: column; gap: 6px; padding: 10px; background: var(--panel); border-radius: 6px; border: 1px solid var(--line-soft);">
      <div style="display:flex; justify-content:space-between;"><span>FRT Target:</span><b>${frt.targetText}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>Status:</span><b style="color:#4F46E5;">Stopped for ${t.intraDepartment} intra-dept</b></div>
    </div>
    ` : `
    <div class="sla-box">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>${frt.targetText}</div>
        <span style="font-size:9.5px; font-weight:700; color:var(--ink-faint); text-transform:uppercase;">First Response</span>
      </div>
      <div class="big ${frt.badgeClass}">${frt.statusText}</div>
    </div>
    <div style="margin-top: 8px; font-size: 11px; display: flex; flex-direction: column; gap: 6px; padding: 10px; background: var(--panel); border-radius: 6px; border: 1px solid var(--line-soft);">
      <div style="display:flex; justify-content:space-between;"><span>FRT Target:</span><b>${frt.targetText}</b></div>
      <div style="display:flex; justify-content:space-between;"><span>${frt.achieved ? 'First response at:' : 'Status:'}</span><b>${frt.timeStr}</b></div>
    </div>
    `}

    <!-- 5. Customer Details -->
    <h4>Customer Details</h4>
    <div class="customer-card">
      <div class="cname" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;" onclick="openCustomerProfile('${t.customer}')" title="Click to view Customer Profile">
        <span>${t.customer}</span>
        <span style="font-size:10px; font-weight:600; color:var(--teal); text-decoration:underline;">Profile ↗</span>
      </div>
      <div class="crow"><span>Phone</span><span>${t.phone}</span></div>
      <div class="crow"><span>Loan ID</span><span>${t.loanId || '—'}</span></div>
      <div class="crow"><span>Loan stage</span><span>${t.loanStage || 'Not captured'}</span></div>
      <div class="crow"><span>Department</span><span>${dept}</span></div>
      <div class="crow"><span>Total tickets</span><span>${TICKETS.filter(x => x.customer === t.customer).length}</span></div>
      <div class="crow"><span>Preferred channel</span><span>${t.channel}</span></div>
    </div>

    <!-- 6. OTHER OPEN TICKETS OF THIS CUSTOMER -->
    <div class="other-tix-header-row">
      <div style="display:flex; align-items:center; gap:6px;">
        <h4>OTHER OPEN TICKETS OF THIS CUSTOMER</h4>
        ${otherTicketsCount > 0 ? `<span class="count-badge-subtle">${otherTicketsCount}</span>` : ''}
      </div>
      <div class="other-tix-ctrls">
        <button class="btn-tix-expand ${isOtherTicketsExpanded ? 'active-expanded' : ''}" onclick="toggleOtherTicketsExpand()" title="${isOtherTicketsExpanded ? 'Minimize back to sidebar as it is right now' : 'Expand to see other tickets properly'}">
          <span>${isOtherTicketsExpanded ? '⤡ Minimize' : '⤢ Expand'}</span>
        </button>
      </div>
    </div>
    <div class="other-tix-wrap ${isOtherTicketsExpanded ? 'other-tix-expanded-wrap' : ''}">
      ${assocHtml}
    </div>
  `;
  enhanceAllSelects(document.getElementById('propsPanel'));
}

function updateTicketField(field, value) {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  const old = t[field];
  if (old === value) return;
  t[field] = value;

  if (field === 'intraDepartment') {
    const isStopped = value === 'Sales' || value === 'Collection';
    const actor = currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID);
    const logMsg = isStopped
      ? `Intra department set to ${value} (Owner & Dept preserved) — SLA & FRT calculations stopped`
      : `Intra department cleared (${old || 'None'} → None) — SLA & FRT calculations resumed`;
    addLog(t, logMsg, {
      type: 'field',
      by: currentRole,
      actor,
      undoable: true,
      snapshot: { field: 'intraDepartment', oldValue: old || 'None' }
    });
    showToast(`Intra department updated to ${value}`);
    renderDetailList();
    renderProps(t);
    if (typeof renderTicketList === 'function') renderTicketList();
    if (typeof renderManageAll === 'function') renderManageAll();
    return;
  }

  if (field === 'queue') {
    t.department = value;
  }
  if (field === 'department') {
    t.queue = value;
    t.department = value;
    if (typeof DEPT_CAT_SUBCAT !== 'undefined' && DEPT_CAT_SUBCAT[value]) {
      const validCats = Object.keys(DEPT_CAT_SUBCAT[value]);
      if (!validCats.includes(t.category) && validCats.length > 0) {
        t.category = validCats[0];
        const validSubCats = DEPT_CAT_SUBCAT[value][t.category] || [];
        t.subCategory = validSubCats.length > 0 ? validSubCats[0] : '';
      }
    }
  }
  if (field === 'category') {
    t.category = value;
  }
  if (field === 'subCategory') {
    t.subCategory = value;
  }

  const fieldLabel = { status: 'Status', priority: 'Priority', assignee: 'Assignee', department: 'Department', category: 'Category', subCategory: 'Sub category', channel: 'Channel', intraDepartment: 'Intra department' }[field] || field;
  const oldLabel = field === 'assignee' ? agentName(old) : (old || '—');
  const newLabel = field === 'assignee' ? agentName(value) : value;
  const actor = currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID);

  addLog(t, `${fieldLabel} changed: ${oldLabel} → ${newLabel}`, {
    type: 'field',
    by: currentRole,
    actor,
    undoable: true,
    snapshot: { field, oldValue: old }
  });

  t.updated = 'just now';
  showToast(`Ticket ${fieldLabel} updated to ${newLabel}`);
  renderDetailList();
  renderProps(t);
  if (typeof renderTicketList === 'function') renderTicketList();
  if (typeof renderManageAll === 'function') renderManageAll();
}

function onPropCategoryChange(newCat) {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  const oldCat = t.category;
  if (oldCat === newCat) return;
  t.category = newCat;

  const dept = t.department || t.queue || 'Support';
  let availableSubCats = [];
  if (typeof DEPT_CAT_SUBCAT !== 'undefined' && dept && newCat && DEPT_CAT_SUBCAT[dept] && DEPT_CAT_SUBCAT[dept][newCat]) {
    availableSubCats = DEPT_CAT_SUBCAT[dept][newCat];
  } else if (typeof DEPT_CAT_SUBCAT !== 'undefined' && newCat) {
    Object.values(DEPT_CAT_SUBCAT).forEach(obj => {
      if (obj[newCat]) {
        obj[newCat].forEach(sc => {
          if (!availableSubCats.includes(sc)) availableSubCats.push(sc);
        });
      }
    });
  }

  if (availableSubCats.length > 0 && !availableSubCats.includes(t.subCategory)) {
    t.subCategory = availableSubCats[0];
  }

  const actor = currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID);
  addLog(t, `Category changed: ${oldCat || '—'} → ${newCat}${t.subCategory ? ` (Sub category: ${t.subCategory})` : ''}`, {
    type: 'field',
    by: currentRole,
    actor,
    undoable: true,
    snapshot: { field: 'category', oldValue: oldCat }
  });

  showToast(`Category updated to ${newCat}`);
  renderDetailList();
  renderProps(t);
}

function archiveCurrentTicket() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  if (confirm(`Are you sure you want to archive ticket ${t.id}?`)) {
    const prevStatus = t.status;
    t.status = 'Archived';
    t.updated = 'just now';
    const actor = currentRole === 'manager' ? 'Manager' : agentName(CURRENT_AGENT_ID);
    addLog(t, `Ticket archived: ${prevStatus} → Archived by ${actor}`, {
      type: 'status', by: currentRole, actor, undoable: true, snapshot: { field: 'status', oldValue: prevStatus }
    });
    showToast(`Ticket ${t.id} archived`);
    renderDetailList();
    renderProps(t);
    renderTicketList();
    renderManageAll();
  }
}

function deleteCurrentTicket() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!t) return;
  if (confirm(`Are you sure you want to delete ticket ${t.id}? This will permanently remove the ticket.`)) {
    const id = t.id;
    const idx = TICKETS.findIndex(x => x.id === id);
    if (idx !== -1) {
      TICKETS.splice(idx, 1);
    }
    showToast(`Ticket ${id} deleted successfully`);
    const remaining = TICKETS.filter(x => x.status !== 'Merged' && x.status !== 'Closed' && x.status !== 'Archived');
    if (remaining.length > 0) {
      openTicket(remaining[0].id);
    } else if (TICKETS.length > 0) {
      openTicket(TICKETS[0].id);
    } else {
      switchView('tickets');
    }
    renderTicketList();
    renderManageAll();
  }
}
function setReplyMode(mode) {
  replyMode = mode;
  const label = document.getElementById('noteToggleLabel');
  const toggle = document.getElementById('noteToggle');
  toggle.checked = mode === 'note';
  label.classList.toggle('on', mode === 'note');
  updateReplyPlaceholder();
  const replyText = document.getElementById('replyText');
  if (replyText) {
    replyText.classList.toggle('internal-active', mode === 'note');
  }
}
function setReplyChannel(chan) {
  replyChannel = chan;
  const dot = document.getElementById('replyChanDot');
  dot.className = 'chan-dot ' + { Email: 'chan-dot-email', Chat: 'chan-dot-chat', WhatsApp: 'chan-dot-whatsapp', SMS: 'chan-dot-sms' }[chan];
  updateReplyPlaceholder();
  if (document.getElementById('templatePanel').classList.contains('show')) renderTemplateList();
}
function updateReplyPlaceholder() {
  document.getElementById('replyText').placeholder = replyMode === 'reply'
    ? `Type a reply — it will send via ${replyChannel}…`
    : "Add an internal note — not visible to the customer…";
}

/* ---- Pre-approved templates ---- */
function toggleTemplates(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('templatePanel');
  const btn = document.getElementById('tplBtn');
  const show = !panel.classList.contains('show');
  panel.classList.toggle('show', show);
  btn.classList.toggle('open', show);
  if (show) {
    document.getElementById('tplSearch').value = '';
    renderTemplateList();
    setTimeout(() => document.getElementById('tplSearch').focus(), 10);
  }
}
function closeTemplates() {
  document.getElementById('templatePanel').classList.remove('show');
  document.getElementById('tplBtn').classList.remove('open');
}
document.addEventListener('click', (e) => {
  const panel = document.getElementById('templatePanel');
  if (panel && panel.classList.contains('show') && !panel.contains(e.target) && e.target.id !== 'tplBtn') {
    closeTemplates();
  }
});
function highlightMatch(text, q) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return text.slice(0, i) + '<mark>' + text.slice(i, i + q.length) + '</mark>' + text.slice(i + q.length);
}

/* =========================================================
   UNIVERSAL SEARCHABLE DROPDOWN
   Wraps every native <select> with a searchable panel matching
   the Templates search UI, while the original <select> stays in
   the DOM (hidden) as the source of truth — existing value/
   onchange-based code keeps working unchanged.
========================================================= */
let __sselSeq = 0;

function isMultipleSelect(select) {
  return select.multiple || [
    'fStatus', 'fPriority', 'fChannel', 'fQueue', 'fCategory', 'fSubCategory',
    'mfAgent', 'mfStatus', 'mfQueue', 'mfCategory', 'mfSubCategory',
    'kpiFilterCreated', 'kpiFilterDept', 'kpiFilterNBFC', 'kpiFilterClosed', 'kpiFilterTeammate',
    'kpiReportFilterStatus', 'kpiReportFilterChannel', 'kpiReportFilterPriority'
  ].includes(select.id);
}

function getSelectedValues(selectIdOrElement) {
  const select = typeof selectIdOrElement === 'string' ? document.getElementById(selectIdOrElement) : selectIdOrElement;
  if (!select) return [];
  if (select.selectedValues) {
    return select.selectedValues.filter(v => v !== "" && String(v).toLowerCase() !== "all");
  }
  const val = select.value;
  return (val && String(val).toLowerCase() !== "all") ? [val] : [];
}

function enhanceSearchSelect(select) {
  if (!select || select.tagName !== 'SELECT') return;
  if (select.classList.contains('no-enhance')) return;
  if (select.dataset.sselDone === '1') { refreshSearchSelect(select); return; }
  select.dataset.sselDone = '1';

  const wrap = document.createElement('div');
  wrap.className = 'ssel';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ssel-btn';
  btn.innerHTML = `<span class="ssel-btn-label"></span><span class="ssel-badge" style="display:none;"></span><span class="ssel-caret">▾</span>`;

  const panel = document.createElement('div');
  panel.className = 'ssel-panel';
  const pid = 'ssel_panel_' + (++__sselSeq);
  panel.id = pid;
  panel.innerHTML = `
    <div class="ssel-search-wrap">
      <input type="text" class="ssel-search" placeholder="Search…">
      <span class="ssel-search-clear">&times;</span>
    </div>
    <div class="ssel-list"></div>
  `;

  wrap.appendChild(btn);
  wrap.appendChild(panel);
  select.classList.add('ssel-native-hidden');
  select.parentNode.insertBefore(wrap, select.nextSibling);

  const searchInput = panel.querySelector('.ssel-search');
  const clearBtn = panel.querySelector('.ssel-search-clear');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.contains('show');
    document.querySelectorAll('.ssel-panel.show').forEach(p => { p.classList.remove('show'); const b = p.previousElementSibling; if (b) b.classList.remove('ssel-open'); });
    if (!isOpen) {
      panel.classList.add('show');
      btn.classList.add('ssel-open');
      searchInput.value = '';
      clearBtn.style.display = 'none';
      renderSselList(select, panel, '');

      // Dynamic positioning based on screen space:
      const rect = btn.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = viewportHeight - rect.bottom;

      // Let's assume maximum height of panel is 280px (margin/padding + max 220px list + search box)
      if (spaceBelow < 280 && rect.top > spaceBelow) {
        panel.style.top = 'auto';
        panel.style.bottom = 'calc(100% + 4px)';
        panel.classList.add('ssel-open-up');
      } else {
        panel.style.top = 'calc(100% + 4px)';
        panel.style.bottom = 'auto';
        panel.classList.remove('ssel-open-up');
      }

      setTimeout(() => searchInput.focus(), 10);
    }
  });

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearBtn.style.display = val ? 'inline-block' : 'none';
    renderSselList(select, panel, val);
  });

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchInput.focus();
    renderSselList(select, panel, '');
  });

  panel.addEventListener('click', e => e.stopPropagation());

  const isMultiple = isMultipleSelect(select);
  if (!select.selectedValues) {
    if (isMultiple) {
      const isAllVal = (val) => val === "" || String(val).toLowerCase() === "all";
      const defaultOpt = Array.from(select.options).find(o => isAllVal(o.value)) || select.options[0];
      select.selectedValues = defaultOpt ? [defaultOpt.value] : [""];
    } else {
      select.selectedValues = [select.value];
    }
  }

  updateSselLabel(select);
  renderSselList(select, panel, '');
}

function updateSselLabel(select) {
  const wrap = select.nextElementSibling;
  if (!wrap || !wrap.classList.contains('ssel')) return;
  const label = wrap.querySelector('.ssel-btn-label');
  const badge = wrap.querySelector('.ssel-badge');

  const isAllVal = (val) => val === "" || String(val).toLowerCase() === "all";

  const isMultiple = isMultipleSelect(select);

  if (!select.selectedValues) {
    if (isMultiple) {
      const defaultOpt = Array.from(select.options).find(o => isAllVal(o.value)) || select.options[0];
      select.selectedValues = defaultOpt ? [defaultOpt.value] : [""];
    } else {
      select.selectedValues = [select.value];
    }
  }

  if (!isMultiple) {
    const selectedOpt = Array.from(select.options).find(o => select.selectedValues.includes(o.value)) || select.options[0];
    label.textContent = selectedOpt ? selectedOpt.textContent : '';
    label.classList.remove('ssel-placeholder');
    if (badge) badge.style.display = 'none';
  } else {
    const selectedOpts = Array.from(select.options).filter(o => !isAllVal(o.value) && select.selectedValues.includes(o.value));
    const count = selectedOpts.length;
    const totalNonAll = Array.from(select.options).filter(o => !isAllVal(o.value)).length;

    const isAllSelected = select.selectedValues.some(isAllVal) || count === totalNonAll || count === 0;

    if (isAllSelected) {
      const allOpt = Array.from(select.options).find(o => isAllVal(o.value)) || select.options[0];
      label.textContent = allOpt ? allOpt.textContent : 'All';
      label.classList.add('ssel-placeholder');
      if (badge) badge.style.display = 'none';
    } else {
      label.classList.remove('ssel-placeholder');
      if (badge) {
        badge.style.display = 'inline-flex';
        badge.textContent = count;
      }
      const names = selectedOpts.map(o => o.textContent);
      if (names.length <= 2) {
        label.textContent = names.join(', ');
      } else {
        label.textContent = `${count} selected`;
      }
    }
  }
}

function renderSselList(select, panel, query) {
  const list = panel.querySelector('.ssel-list');
  const q = (query || '').trim().toLowerCase();
  const opts = Array.from(select.options);
  const filtered = opts.filter(o => !q || o.textContent.toLowerCase().includes(q));
  if (filtered.length === 0) {
    list.innerHTML = `<div class="ssel-empty">No matches for "${query}"</div>`;
    return;
  }

  const isAllVal = (val) => val === "" || String(val).toLowerCase() === "all";
  const isMultiple = isMultipleSelect(select);

  if (!select.selectedValues) {
    if (isMultiple) {
      const defaultOpt = Array.from(select.options).find(o => isAllVal(o.value)) || select.options[0];
      select.selectedValues = defaultOpt ? [defaultOpt.value] : [""];
    } else {
      select.selectedValues = [select.value];
    }
  }

  const selectedVals = select.selectedValues;
  const sorted = filtered.slice().sort((a, b) => {
    // Keep "All" always at the very top (first position)
    if (isAllVal(a.value)) return -1;
    if (isAllVal(b.value)) return 1;

    const aSel = selectedVals.includes(a.value);
    const bSel = selectedVals.includes(b.value);
    if (aSel && !bSel) return -1;
    if (!aSel && bSel) return 1;
    return opts.indexOf(a) - opts.indexOf(b);
  });

  list.innerHTML = sorted.map(o => {
    const sel = selectedVals.includes(o.value) ? ' selected' : '';
    return `<div class="ssel-item${sel}" data-val="${String(o.value).replace(/"/g, '&quot;')}">${highlightMatch(o.textContent, query)}</div>`;
  }).join('');

  list.querySelectorAll('.ssel-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = item.dataset.val;

      if (!isMultiple) {
        select.selectedValues = [val];
        select.value = val;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        updateSselLabel(select);
        panel.classList.remove('show');
        const btn = panel.previousElementSibling;
        if (btn) btn.classList.remove('ssel-open');
        return;
      }

      const allOpt = Array.from(select.options).find(o => isAllVal(o.value));
      const allVal = allOpt ? allOpt.value : "";

      const isClickedAll = isAllVal(val);

      if (isClickedAll) {
        const isAllCurrentlySelected = select.selectedValues.some(isAllVal) || (select.selectedValues.length >= Array.from(select.options).length - 1);
        if (isAllCurrentlySelected) {
          // Deselect all
          select.selectedValues = [];
        } else {
          // Select all options
          select.selectedValues = Array.from(select.options).map(o => o.value);
        }
      } else {
        // Toggle individual selection
        let currentSel = select.selectedValues.filter(v => !isAllVal(v));
        const idx = currentSel.indexOf(val);
        if (idx > -1) {
          currentSel.splice(idx, 1);
        } else {
          currentSel.push(val);
        }

        // If we selected all individual options, automatically select "All" too
        const nonAllVals = Array.from(select.options).filter(o => !isAllVal(o.value)).map(o => o.value);
        const allSelected = nonAllVals.every(v => currentSel.includes(v));
        if (allSelected && allOpt) {
          if (!currentSel.includes(allVal)) currentSel.push(allVal);
        } else if (allOpt) {
          // Otherwise, make sure "All" is not in currentSel
          currentSel = currentSel.filter(v => !isAllVal(v));
        }
        select.selectedValues = currentSel;
      }

      select.value = select.selectedValues.includes(allVal) ? allVal : (select.selectedValues[0] || "");
      select.dispatchEvent(new Event('change', { bubbles: true }));
      updateSselLabel(select);

      // Reset/clear the search box when an option is selected
      const search = panel.querySelector('.ssel-search');
      if (search) search.value = '';
      const clearBtn = panel.querySelector('.ssel-search-clear');
      if (clearBtn) clearBtn.style.display = 'none';

      // Re-render list with query reset to empty
      renderSselList(select, panel, '');
    });
  });
}

function refreshSearchSelect(select) {
  const wrap = select.nextElementSibling;
  if (!wrap || !wrap.classList.contains('ssel')) return;

  const isMultiple = isMultipleSelect(select);
  if (!isMultiple) {
    select.selectedValues = [select.value];
  } else {
    if (select.value === "") {
      select.selectedValues = [""];
    }
  }

  updateSselLabel(select);
  const panel = wrap.querySelector('.ssel-panel');
  const q = panel.querySelector('.ssel-search').value || '';
  renderSselList(select, panel, q);
}
function enhanceAllSelects(root) {
  (root || document).querySelectorAll('select').forEach(enhanceSearchSelect);
}
document.addEventListener('click', () => {
  document.querySelectorAll('.ssel-panel.show').forEach(p => { p.classList.remove('show'); const b = p.previousElementSibling; if (b) b.classList.remove('ssel-open'); });
});

function renderTemplateList() {
  const q = document.getElementById('tplSearch').value.trim().toLowerCase();
  let items = TEMPLATES.filter(tp => tp.channel === replyChannel);
  if (q) items = items.filter(tp => tp.title.toLowerCase().includes(q) || tp.body.toLowerCase().includes(q));
  const list = document.getElementById('tplList');
  if (items.length === 0) {
    list.innerHTML = `<div class="tpl-empty">No ${replyChannel} templates match "${q}".</div>`;
    return;
  }
  list.innerHTML = items.map(tp => `
    <div class="tpl-item" onclick="useTemplate('${tp.id}')">
      <div class="tpl-title">${highlightMatch(tp.title, q)}</div>
      <div class="tpl-preview">${highlightMatch(tp.body.replace(/\n/g, ' '), q)}</div>
    </div>`).join('');
}
function useTemplate(id) {
  const tp = TEMPLATES.find(x => x.id === id);
  const t = TICKETS.find(x => x.id === selectedTicketId);
  if (!tp || !t) return;
  document.getElementById('replyText').value = fillTemplate(tp.body, t);
  closeTemplates();
  document.getElementById('replyText').focus();
}

function sendReply() {
  const text = document.getElementById('replyText').value.trim();
  if (!text) return;
  const t = TICKETS.find(x => x.id === selectedTicketId);
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (replyMode === 'note') {
    t.thread.push({ dir: 'note', text, chan: 'Internal', time: timeLabel, ts: now });
    t.activity.push('Internal note added');
  } else {
    const msg = { dir: 'out', text, chan: replyChannel, time: timeLabel, ts: now, status: 'sending', subject: replyChannel === 'Email' ? t.subject : undefined };
    t.thread.push(msg);
    t.activity.push(`Agent replied via ${replyChannel}`);
    if (t.status === 'unassigned') t.status = 'Assigned';
    simulateDelivery(t, msg);
  }
  document.getElementById('replyText').value = '';
  t.updated = 'just now';
  renderConvBody('thread');
  renderDetailList();
  renderProps(t);
  showToast(replyMode === 'note' ? 'Internal note saved' : `Reply sent via ${replyChannel}`);
}
function resolveTicket() { updateTicketField('status', 'Resolved'); }
function closeTicket() { updateTicketField('status', 'Closed'); }

/* =========================================================
   CREATE TICKET
========================================================= */
function openCreateTicket() {
  document.getElementById('custList').innerHTML = CUSTOMERS.map(c => `<option value="${c.name}">`).join('');
  const assigneeSel = document.getElementById('ctAssignee');
  assigneeSel.innerHTML = `<option value="">Auto-assign (skill-based)</option>` + AGENTS.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  enhanceSearchSelect(assigneeSel);

  if (typeof onDepartmentChange === 'function') {
    onDepartmentChange('ct');
  }

  ['ctCustomer', 'ctSubject', 'ctDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('modalCreate').classList.add('show');
}

function submitCreateTicket() {
  const custInput = document.getElementById('ctCustomer').value.trim();
  const subject = document.getElementById('ctSubject').value.trim() || 'New customer request';
  if (!custInput) { showToast('Enter a customer name or phone to continue'); return; }
  const match = CUSTOMERS.find(c => c.name.toLowerCase() === custInput.toLowerCase());
  const priority = document.getElementById('ctPriority').value;
  const deptVal = document.getElementById('ctQueue').value || 'Support';
  const catVal = document.getElementById('ctCategory').value || 'General Query';
  const chanVal = document.getElementById('ctChannel').value;
  const langVal = document.getElementById('ctLanguage') ? document.getElementById('ctLanguage').value : 'English';

  let assigneeVal = document.getElementById('ctAssignee').value;
  if (!assigneeVal) {
    assigneeVal = findSkillBasedAssignee(chanVal, catVal, priority, langVal);
    if (!assigneeVal) {
      const allowedAgentIds = DEPT_AGENTS[deptVal] || [];
      if (allowedAgentIds.length > 0) {
        assigneeVal = allowedAgentIds[Math.floor(Math.random() * allowedAgentIds.length)];
      } else {
        assigneeVal = AGENTS[Math.floor(Math.random() * AGENTS.length)].id;
      }
    }
  }

  const assignedAgent = AGENTS.find(a => a.id === assigneeVal);
  if (assignedAgent) {
    assignedAgent.assigned = (assignedAgent.assigned || 0) + 1;
  }

  const newId = 'TCK-' + (10239 + TICKETS.length);
  const slaTarget = priority === 'High' ? 240 : priority === 'Medium' ? 720 : 1440;
  const t = {
    id: newId, subject, customer: match ? match.name : custInput, phone: match ? match.phone : '-',
    channel: chanVal, priority, status: 'New',
    queue: deptVal, assignee: assigneeVal, updated: 'just now', slaMins: slaTarget, createdAt: new Date(),
    category: catVal,
    language: langVal,
    thread: [{ dir: 'in', text: document.getElementById('ctDesc').value || '(No description provided)', chan: chanVal, time: 'now' }],
    activity: ['Ticket manually created by agent', `Assigned to ${agentName(assigneeVal)}`]
  };
  TICKETS.unshift(t);
  closeModal('modalCreate');
  showToast(`Ticket ${newId} created and assigned to ${agentName(assigneeVal)}`);
  renderTicketList();
  if (typeof currentRole !== 'undefined' && currentRole === 'manager') renderManageAll();
}

/* =========================================================
   MERGE
========================================================= */
let mergePrimaryId = null;
let mergeIncludeIds = new Set();

/* Channel icon map for merge modal badges */
const MERGE_CHAN_ICON = {
  Email: { icon: '✉', cls: 'merge-chan-email' },
  Chat: { icon: '💬', cls: 'merge-chan-chat' },
  WhatsApp: { icon: '📲', cls: 'merge-chan-whatsapp' },
  SMS: { icon: '📱', cls: 'merge-chan-sms' },
  Call: { icon: '📞', cls: 'merge-chan-call' },
};
function mergeChanBadge(chan) {
  const c = MERGE_CHAN_ICON[chan] || { icon: '✉', cls: 'merge-chan-email' };
  return `<span class="merge-chan-badge ${c.cls}">${c.icon} ${chan}</span>`;
}
function mergeStatusBadge(status) {
  const map = {
    unassigned: 'merge-status-unassigned',
    Unassigned: 'merge-status-unassigned',
    Assigned: 'merge-status-assigned',
    'Waiting from customer': 'merge-status-waiting',
    'Waiting for Customer': 'merge-status-waiting',
    Junk: 'merge-status-junk',
    Merge: 'merge-status-merge',
    Merged: 'merge-status-merge',
    Hold: 'merge-status-hold',
    Escalated: 'merge-status-escalated',
    Resolved: 'merge-status-resolved',
    Closed: 'merge-status-closed',
    Reopened: 'merge-status-reopened',
  };
  return `<span class="merge-status-pill ${map[status] || 'merge-status-assigned'}">${status}</span>`;
}
function mergeDeptBadge(dept) {
  return `<span class="merge-dept-pill">${dept}</span>`;
}

function openMerge() {
  const current = TICKETS.find(x => x.id === selectedTicketId);
  if (!current) return;
  document.getElementById('mergeSearch').value = '';
  /* Pre-select current ticket as primary */
  mergePrimaryId = current.id;
  mergeIncludeIds = new Set();
  /* Update modal subtitle with customer name */
  const subtitle = document.getElementById('mergeCustomerSubtitle');
  if (subtitle) subtitle.textContent = `Customer: ${current.customer} · Loan: ${current.loanId || '—'}`;
  renderMergeResults();
  document.getElementById('modalMerge').classList.add('show');
}

function renderMergeResults() {
  const q = document.getElementById('mergeSearch').value.trim().toLowerCase();
  const current = TICKETS.find(x => x.id === selectedTicketId);
  if (!current) return;

  /* All non-merged tickets for this customer, including current (for primary row) */
  let allSameCustomer = TICKETS.filter(x =>
    x.customer === current.customer &&
    x.status !== 'Merged'
  );

  /* Apply search filter */
  if (q) {
    allSameCustomer = allSameCustomer.filter(x =>
      x.id.toLowerCase().includes(q) ||
      (x.subject || '').toLowerCase().includes(q) ||
      (x.department || x.queue || '').toLowerCase().includes(q) ||
      (x.channel || '').toLowerCase().includes(q) ||
      (x.loanId || '').toLowerCase().includes(q) ||
      (x.status || '').toLowerCase().includes(q)
    );
  }

  if (!allSameCustomer.length) {
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
  const totalCount = allSameCustomer.length;
  const deptCount = Object.keys(grouped).length;
  const chanCount = new Set(allSameCustomer.map(x => x.channel)).size;
  const checkedCount = mergeIncludeIds.size;

  /* Build group HTML */
  const groupsHtml = Object.entries(grouped).map(([dept, tickets]) => `
    <div class="merge-dept-group">
      <div class="merge-dept-group-head">
        <span class="merge-dept-group-label">${dept}</span>
        <span class="merge-dept-count">${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}</span>
      </div>
      ${tickets.map(ticket => {
    const isCurrent = ticket.id === current.id;
    const isPrimary = ticket.id === mergePrimaryId;
    const isIncluded = mergeIncludeIds.has(ticket.id);
    const rowClass = isCurrent ? 'merge-ticket-row merge-row-current' :
      isPrimary ? 'merge-ticket-row merge-row-primary' :
        isIncluded ? 'merge-ticket-row merge-row-selected' :
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
      <span>🏢 <strong>${deptCount}</strong> dept${deptCount !== 1 ? 's' : ''}</span>
      <span>·</span>
      <span>📡 <strong>${chanCount}</strong> channel${chanCount !== 1 ? 's' : ''}</span>
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

function selectPrimaryMerge(id) {
  mergePrimaryId = id;
  /* Auto-check the primary ticket */
  mergeIncludeIds.add(id);
  renderMergeResults();
}

function toggleMergeCandidate(id, checked) {
  const current = TICKETS.find(x => x.id === selectedTicketId);
  if (current && id === current.id) return; /* current ticket is always included */
  if (checked) {
    mergeIncludeIds.add(id);
    if (!mergePrimaryId) mergePrimaryId = id;
  } else {
    mergeIncludeIds.delete(id);
    /* If the deselected ticket was the primary, reset to current ticket */
    if (mergePrimaryId === id) {
      mergePrimaryId = current ? current.id : null;
    }
  }
  renderMergeResults();
}

function submitMerge() {
  if (!mergePrimaryId) {
    showToast('Choose a primary ticket to continue.');
    return;
  }
  const primary = TICKETS.find(x => x.id === mergePrimaryId);
  if (!primary) {
    showToast('Primary ticket not found.');
    return;
  }

  const mergeIds = Array.from(mergeIncludeIds).filter(id => id !== primary.id);
  if (!mergeIds.length) {
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

  const seen = new Set(primary.thread.map(msg => `${msg.dir}|${(msg.text || '').trim().toLowerCase()}|${msg.chan}|${msg.time}`));
  let mergedCount = 0;

  for (const id of mergeIds) {
    const secondary = TICKETS.find(x => x.id === id);
    if (!secondary) continue;
    snapshot.beforeMergedStatus[id] = secondary.status;
    snapshot.beforeMergedActivity[id] = secondary.activity.slice();

    secondary.thread.forEach(msg => {
      const key = `${msg.dir}|${(msg.text || '').trim().toLowerCase()}|${msg.chan}|${msg.time}`;
      if (!seen.has(key)) {
        primary.thread.push({ ...msg, mergedFrom: secondary.id });
        seen.add(key);
      }
    });

    (secondary.activity || []).forEach(entry => {
      if (!primary.activity.includes(entry)) primary.activity.push(entry);
    });

    const mergeText = `Merged ${secondary.id} into this ticket — unique conversation details preserved`;
    addActivityEntry(primary, mergeText, { type: 'merge', primaryId: primary.id, mergedIds: mergeIds.slice(), mergedTicketId: secondary.id, snapshot });
    secondary.status = 'Merged';
    secondary.activity.push(`Merged into ${primary.id} by manager`);
    mergedCount += 1;
  }

  primary.lastMergeSnapshot = snapshot;
  closeModal('modalMerge');
  showToast(`${mergedCount} ticket(s) merged into ${primary.id}`);

  /* If primary differs from current view, switch to primary ticket */
  if (selectedTicketId !== primary.id) {
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
function openEscalate() { document.getElementById('modalEscalate').classList.add('show'); }
function submitEscalate() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  const to = document.getElementById('escTo').value;
  const reason = document.getElementById('escReason').value;
  t.status = 'Escalated'; t.priority = 'High'; t.updated = 'just now';
  t.activity.push(`Escalated to ${to} — reason: ${reason}`);
  t.thread.push({ dir: 'note', text: `Escalated to ${to}. Reason: ${reason}. ${document.getElementById('escNotes').value || ''}`.trim(), chan: 'Internal', time: 'now' });
  closeModal('modalEscalate');
  showToast(`Ticket escalated to ${to}`);
  renderDetail(); renderDetailList(); renderTicketList();
}

/* =========================================================
   REASSIGN
========================================================= */
function openReassign() {
  const sel = document.getElementById('reAgent');
  sel.innerHTML = AGENTS.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  enhanceSearchSelect(sel);
  document.getElementById('modalReassign').classList.add('show');
}
function submitReassign() {
  const t = TICKETS.find(x => x.id === selectedTicketId);
  const agentId = document.getElementById('reAgent').value;
  const queue = document.getElementById('reQueue').value;
  const reason = document.getElementById('reReason').value;
  t.assignee = agentId; t.queue = queue; t.updated = 'just now';
  t.activity.push(`Reassigned to ${agentName(agentId)} (${queue})${reason ? ' — ' + reason : ''}`);
  closeModal('modalReassign');
  showToast(`Reassigned to ${agentName(agentId)}`);
  renderDetail(); renderDetailList(); renderTicketList();
}

/* =========================================================
   MODAL / TOAST HELPERS
========================================================= */
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.modal-overlay').forEach(ov => ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('show'); }));
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* =========================================================
   MANAGER DASHBOARD
========================================================= */
let chartsInit = {};
function renderDashboard() {
  const active = TICKETS.filter(t => t.status !== 'Merged');
  const open = active.filter(t => !['Resolved', 'Closed'].includes(t.status)).length;
  const breached = active.filter(t => t.slaMins < 0).length;
  const resolvedToday = active.filter(t => t.status === 'Resolved').length;
  const escalated = active.filter(t => t.status === 'Escalated').length;
  const kpis = [
    { lbl: 'Open tickets', val: open, delta: '+4 vs yesterday', up: false },
    { lbl: 'SLA breach %', val: Math.round(breached / active.length * 100) + '%', delta: breached + ' breached', up: false },
    { lbl: 'Avg handling time', val: '13m', delta: '−2m vs last week', up: true },
    { lbl: 'First response', val: '4m', delta: 'within target', up: true },
    { lbl: 'NPS score', val: '62', delta: '+5 vs last month', up: true },
    { lbl: 'Escalated', val: escalated, delta: 'needs review', up: false },
  ];
  document.getElementById('kpiGrid').innerHTML = kpis.map(k => `
    <div class="kpi-card"><div class="lbl">${k.lbl}</div><div class="val">${k.val}</div><div class="delta ${k.up ? 'up' : 'down'}">${k.delta}</div></div>`).join('');

  document.getElementById('agentPerfBody').innerHTML = AGENTS.map(a => `
    <tr><td><span class="assignee-pill"><span class="mini-avatar">${initials(a.name)}</span>${a.name}</span></td>
    <td>${a.assigned}</td><td>${a.resolved}</td><td>${a.aht}</td>
    <td><div class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${a.sla}%; background:${a.sla > 90 ? 'var(--green)' : a.sla > 80 ? 'var(--amber)' : 'var(--red)'};"></div></div><span>${a.sla}%</span></div></td>
    <td>${a.csat} / 5</td></tr>`).join('');

  const ctx = id => document.getElementById(id).getContext('2d');
  Object.values(chartsInit).forEach(c => c && c.destroy && c.destroy());

  chartsInit.trend = new Chart(ctx('chartTrend'), {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        { label: 'Created', data: [22, 28, 19, 31, 26, 14, 9], borderColor: '#3B6FA0', backgroundColor: 'rgba(59,111,160,.08)', tension: .35, fill: true },
        { label: 'Resolved', data: [19, 24, 21, 27, 29, 17, 11], borderColor: '#0F5C56', backgroundColor: 'rgba(15,92,86,.10)', tension: .35, fill: true },
      ]
    },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } }, scales: { y: { beginAtZero: true, grid: { color: '#EDEAE0' } }, x: { grid: { display: false } } } }
  });

  chartsInit.channel = new Chart(ctx('chartChannel'), {
    type: 'doughnut',
    data: { labels: ['WhatsApp', 'Email', 'Chat', 'Call'], datasets: [{ data: [38, 22, 26, 14], backgroundColor: ['#2C8A45', '#3B6FA0', '#0F5C56', '#D98E3F'] }] },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } }, cutout: '62%' }
  });

  const stLabels = ['unassigned', 'Assigned', 'Waiting from customer', 'Junk', 'Merge', 'Hold', 'Escalated', 'Resolved', 'Closed', 'Reopened'];
  const stCounts = stLabels.map(s => TICKETS.filter(t => (t.status || '').toLowerCase() === s.toLowerCase()).length);
  chartsInit.status = new Chart(ctx('chartStatus'), {
    type: 'bar',
    data: {
      labels: stLabels,
      datasets: [{ data: stCounts, backgroundColor: '#0F5C56', borderRadius: 5 }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#EDEAE0' } }, x: { grid: { display: false } } } }
  });

  chartsInit.sla = new Chart(ctx('chartSla'), {
    type: 'bar',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{ label: 'Within SLA', data: [81, 93, 97], backgroundColor: '#0F5C56', borderRadius: 5 },
      { label: 'Breached', data: [19, 7, 3], backgroundColor: '#B5453B', borderRadius: 5 }]
    },
    options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, max: 100, grid: { color: '#EDEAE0' } } } }
  });
}

/* =========================================================
   INIT
========================================================= */
renderTicketList();
refreshHeaderStatus();
enhanceAllSelects(document);
function getCustomerNbfc(customerName) {
  if (!customerName) return 'Others';
  const hash = customerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  if (hash % 5 === 0) return 'TAPADIYA CAPITAL PRIVATE';
  return 'Chinmay Finlease Limited';
}

function renderDonutChart(elementId, data, totalVal) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let accumulatedAngle = 0;

  let svgContent = `<svg width="100" height="100" viewBox="0 0 100 100" style="transform: rotate(-90deg); flex-shrink:0;">`;

  if (total === 0) {
    svgContent += `<circle cx="50" cy="50" r="38" fill="none" stroke="#334155" stroke-width="10" />`;
  } else {
    data.forEach(item => {
      const percentage = item.value / total;
      const angle = percentage * 360;
      const circumference = 2 * Math.PI * 38;
      const strokeLength = percentage * circumference;
      const strokeOffset = circumference - (accumulatedAngle / 360 * circumference);

      svgContent += `
        <circle cx="50" cy="50" r="38" fill="none" stroke="${item.color}" stroke-width="10"
                stroke-dasharray="${strokeLength} ${circumference}"
                stroke-dashoffset="${strokeOffset}" />
      `;
      accumulatedAngle += angle;
    });
  }

  svgContent += `
    <circle cx="50" cy="50" r="30" fill="#1A233D" />
    <text x="50" y="50" fill="#F8FAFC" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="central" style="transform: rotate(90deg); transform-origin: 50px 50px;">${totalVal}</text>
  </svg>`;

  let legendHtml = `<div style="display: flex; align-items: center; gap: 14px; width: 100%;">`;
  legendHtml += `<div>${svgContent}</div>`;
  legendHtml += `<div style="font-size: 11px; color: #94A3B8; display: flex; flex-direction: column; gap: 4px; overflow: hidden; text-overflow: ellipsis;">`;
  data.forEach(item => {
    legendHtml += `
      <div style="display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${item.color}; flex-shrink:0;"></span>
        <span style="overflow: hidden; text-overflow: ellipsis; max-width: 130px;" title="${item.label}">${item.label}: <strong>${item.value}</strong></span>
      </div>
    `;
  });
  legendHtml += `</div></div>`;

  el.innerHTML = legendHtml;
}

function renderHorizontalBarChart(elementId, data, maxVal = 20) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (data.length === 0) {
    el.innerHTML = `<div style="color: #64748B; font-size: 11px; text-align: center; padding-top: 30px;">No data</div>`;
    return;
  }

  let html = '';
  data.forEach(item => {
    const widthPct = Math.max(5, Math.min(100, (item.value / maxVal) * 100));
    html += `
      <div style="margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #E2E8F0; margin-bottom: 2px;">
          <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 140px;" title="${item.label}">${item.label}</span>
          <span style="font-weight: 700; color: #94A3B8;">${item.value}</span>
        </div>
        <div style="width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden;">
          <div style="width: ${widthPct}%; height: 100%; background: #FDE047; border-radius: 3px;"></div>
        </div>
      </div>
    `;
  });
  el.innerHTML = html;
}

function renderVerticalBarChart(elementId, data, maxVal = 3) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (data.length === 0) {
    el.innerHTML = `<div style="color: #64748B; font-size: 11px; text-align: center; padding-top: 30px;">No data</div>`;
    return;
  }

  let html = '';
  data.forEach(item => {
    const heightPct = Math.max(10, Math.min(100, (item.value / maxVal) * 100));
    html += `
      <div style="display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end;">
        <div style="font-size: 9px; font-weight: 700; color: #FDE047; margin-bottom: 2px;">${item.value.toFixed(2)}h</div>
        <div style="width: 16px; height: ${heightPct}%; background: #FDE047; border-radius: 3px 3px 0 0;"></div>
        <div style="font-size: 9px; color: #94A3B8; margin-top: 4px; text-align: center; width: 44px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.label}">${item.label}</div>
      </div>
    `;
  });
  el.innerHTML = html;
}

function filterKpi() {
  const createdFilter = getSelectedValues('kpiFilterCreated');
  const deptFilter = getSelectedValues('kpiFilterDept');
  const nbfcFilter = getSelectedValues('kpiFilterNBFC');
  const closedFilter = getSelectedValues('kpiFilterClosed');
  const teammateFilter = getSelectedValues('kpiFilterTeammate');

  let tix = [...TICKETS];

  if (deptFilter.length > 0) {
    tix = tix.filter(t => deptFilter.includes(t.department));
  }

  if (nbfcFilter.length > 0) {
    tix = tix.filter(t => nbfcFilter.includes(getCustomerNbfc(t.customer)));
  }

  if (teammateFilter.length > 0) {
    tix = tix.filter(t => teammateFilter.includes(t.assignee));
  }

  if (closedFilter.length > 0) {
    tix = tix.filter(t => {
      if (closedFilter.includes('Today') && (t.status === 'Resolved' || t.status === 'Closed')) return true;
      if (closedFilter.includes('Yesterday') && (t.status === 'Resolved' || t.status === 'Closed') && t.id.charCodeAt(t.id.length - 1) % 2 === 0) return true;
      return false;
    });
  }

  if (createdFilter.length > 0) {
    const todayStr = new Date().toDateString();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    tix = tix.filter(t => {
      const tDate = new Date(t.createdAt || new Date());
      if (createdFilter.includes('Today') && tDate.toDateString() === todayStr) return true;
      if (createdFilter.includes('Yesterday') && tDate.toDateString() === yesterdayStr) return true;
      if (createdFilter.includes('This Week') && tDate >= oneWeekAgo) return true;
      return false;
    });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  document.getElementById('kpiAsOfTime').textContent = `As of ${dateStr}, ${timeStr} • Viewing as Network view`;
  document.querySelectorAll('.kpi-time').forEach(el => el.textContent = `As of ${dateStr}, ${timeStr}`);

  let avgFrt = 0.73;
  if (deptFilter.includes('Support')) avgFrt = 0.65;
  if (deptFilter.includes('Collection')) avgFrt = 0.85;
  document.getElementById('valAvgFrt').textContent = avgFrt.toFixed(2);

  const uniqueCusts = new Set(tix.map(t => t.customer)).size || 78;
  document.getElementById('valUniqueCases').textContent = uniqueCusts;

  let contactCount = tix.reduce((sum, t) => sum + (t.thread ? t.thread.length : 1), 0) || 116;
  document.getElementById('valContactCount').textContent = contactCount;

  let reopens = tix.filter(t => t.activity && t.activity.some(a => a.toLowerCase().includes('reopen'))).length || 23;
  document.getElementById('valReopenCount').textContent = reopens;

  let totalSlaEligible = tix.length || 127;
  let violatedSla = tix.filter(t => t.slaMins < 0).length;
  let slaPct = totalSlaEligible > 0 ? ((totalSlaEligible - violatedSla) / totalSlaEligible * 100) : 97.4;
  if (slaPct > 100) slaPct = 100;
  document.getElementById('valSlaAdherence').textContent = slaPct.toFixed(1) + '%';

  // Channel-Wise SLA
  const channels = ['Email', 'Phone', 'WhatsApp', 'App'];
  let totalCasesAll = 0;
  let totalAdheredAll = 0;

  let chanHtml = channels.map(c => {
    let cTix = tix.filter(t => t.channel === c || (c === 'Phone' && t.channel === 'Call') || (c === 'App' && t.channel === 'Chat'));
    let totalC = cTix.length || (c === 'Email' ? 41 : c === 'Phone' ? 31 : c === 'WhatsApp' ? 34 : 21);
    let breachedC = cTix.filter(t => t.slaMins < 0).length || (c === 'Email' ? 7 : 0);
    let adheredC = totalC - breachedC;
    let adherencePct = totalC > 0 ? (adheredC / totalC * 100) : (c === 'Email' ? 82.00 : 100.00);

    totalCasesAll += totalC;
    totalAdheredAll += adheredC;

    return `
      <tr>
        <td style="padding: 6px 4px;">${c}</td>
        <td style="padding: 6px 4px;">0</td>
        <td style="padding: 6px 4px;">${totalC}</td>
        <td style="padding: 6px 4px; text-align: right; color: ${adherencePct >= 90 ? '#10B981' : '#F59E0B'}; font-weight: 700;">${adherencePct.toFixed(2)}%</td>
      </tr>
    `;
  }).join('');

  let totalAdherenceAllPct = totalCasesAll > 0 ? (totalAdheredAll / totalCasesAll * 100) : 87.40;
  chanHtml += `
    <tr style="border-top: 1px solid #475569; font-weight: 700; color: #F8FAFC;">
      <td style="padding: 6px 4px;">Total</td>
      <td style="padding: 6px 4px;">0</td>
      <td style="padding: 6px 4px;">${totalCasesAll}</td>
      <td style="padding: 6px 4px; text-align: right; color: #10B981;">${totalAdherenceAllPct.toFixed(2)}%</td>
    </tr>
  `;
  document.getElementById('tblChannelSla').innerHTML = chanHtml;

  renderDonutChart('donutChatNps', [
    { value: 2, color: '#10B981', label: 'Promoter (9-10)' },
    { value: 1, color: '#EF4444', label: 'Detractor (0-6)' }
  ], '40%');

  renderDonutChart('donutEmailNps', [
    { value: 1, color: '#10B981', label: 'Promoter' },
    { value: 2, color: '#EF4444', label: 'Detractor' }
  ], '20%');

  const tapadiaCount = tix.filter(t => getCustomerNbfc(t.customer) === 'TAPADIYA CAPITAL PRIVATE').length || 4;
  const chinmayCount = tix.filter(t => getCustomerNbfc(t.customer) === 'Chinmay Finlease Limited').length || 11;
  const otherCount = uniqueCusts - tapadiaCount - chinmayCount || 63;
  renderDonutChart('donutNbfc', [
    { value: chinmayCount, color: '#8B5CF6', label: 'Chinmay Finlease' },
    { value: tapadiaCount, color: '#EC4899', label: 'Tapadia Capital' },
    { value: Math.max(0, otherCount), color: '#3B82F6', label: 'Others' }
  ], uniqueCusts);

  const requestCount = tix.filter(t => t.category !== 'Dispute' && t.category !== 'Declined Profile').length || 161;
  const complaintCount = tix.filter(t => t.category === 'Dispute' || t.category === 'Declined Profile').length || 6;
  const totalClass = requestCount + complaintCount;
  document.getElementById('tblClassification').innerHTML = `
    <tr>
      <td style="padding: 6px 4px;">Complaint</td>
      <td style="padding: 6px 4px;">${complaintCount}</td>
      <td style="padding: 6px 4px; text-align: right;">${(complaintCount / totalClass * 100).toFixed(2)}%</td>
    </tr>
    <tr>
      <td style="padding: 6px 4px;">Request</td>
      <td style="padding: 6px 4px;">${requestCount}</td>
      <td style="padding: 6px 4px; text-align: right;">${(requestCount / totalClass * 100).toFixed(2)}%</td>
    </tr>
    <tr style="border-top: 1px solid #475569; font-weight: 700; color: #F8FAFC;">
      <td style="padding: 6px 4px;">Total</td>
      <td style="padding: 6px 4px;">${totalClass}</td>
      <td style="padding: 6px 4px; text-align: right;">100.00%</td>
    </tr>
  `;

  renderVerticalBarChart('chartAvgFrtByAgent', [
    { label: 'Asma V.', value: 0.63 },
    { label: 'Thor O.', value: 0.62 },
    { label: 'Loki O.', value: 0.21 },
    { label: 'Jahnvi D.', value: 2.12 }
  ], 2.5);

  renderHorizontalBarChart('chartUniqueCustomerTeam', [
    { label: 'Kiran Shah', value: 19 },
    { label: 'Pushpa Singh', value: 11 },
    { label: 'Chat Support', value: 4 },
    { label: 'Mitesh Panchal', value: 2 },
    { label: 'Shreya Chhetri', value: 2 },
    { label: 'Sujoy Banerjee', value: 1 }
  ], 20);

  renderHorizontalBarChart('chartClosedCaseCategory', [
    { label: 'Salary verification', value: 23 },
    { label: 'Declined Profile', value: 18 },
    { label: 'E-Mandate', value: 13 },
    { label: 'Notification', value: 8 },
    { label: 'Disbursement Pending', value: 6 }
  ], 25);

  renderHorizontalBarChart('chartCloseCaseSubCategory', [
    { label: 'Settlement', value: 13 },
    { label: 'Referral', value: 12 },
    { label: 'Repayment', value: 4 },
    { label: 'Manual Payment', value: 3 },
    { label: 'Waiver Link', value: 2 }
  ], 15);

  document.getElementById('tblAgentwiseChatNps').innerHTML = `
    <tr>
      <td style="padding: 6px 4px; font-weight: 600;">Kiran Shah</td>
      <td style="padding: 6px 4px;">WhatsApp</td>
      <td style="padding: 6px 4px;">7</td>
      <td style="padding: 6px 4px; text-align: right; font-weight: 700; color: #10B981;">42.86%</td>
    </tr>
    <tr>
      <td style="padding: 6px 4px; font-weight: 600;">Sujoy Banerjee</td>
      <td style="padding: 6px 4px;">WhatsApp</td>
      <td style="padding: 6px 4px;">2</td>
      <td style="padding: 6px 4px; text-align: right; font-weight: 700; color: #10B981;">50.00%</td>
    </tr>
    <tr style="border-top: 1px solid #475569; font-weight: 700; color: #F8FAFC;">
      <td style="padding: 6px 4px;">Total</td>
      <td style="padding: 6px 4px;">-</td>
      <td style="padding: 6px 4px;">9</td>
      <td style="padding: 6px 4px; text-align: right; color: #10B981;">44.44%</td>
    </tr>
  `;

  document.getElementById('tblAgentwiseEmailNps').innerHTML = `
    <tr>
      <td style="padding: 6px 4px; font-weight: 600;">Kiran Shah</td>
      <td style="padding: 6px 4px;">20</td>
      <td style="padding: 6px 4px; text-align: right; font-weight: 700; color: #EF4444;">20.00%</td>
    </tr>
    <tr style="border-top: 1px solid #475569; font-weight: 700; color: #F8FAFC;">
      <td style="padding: 6px 4px;">Total</td>
      <td style="padding: 6px 4px;">20</td>
      <td style="padding: 6px 4px; text-align: right; color: #EF4444;">20.00%</td>
    </tr>
  `;

  document.getElementById('tblTeammatePerformanceChannel').innerHTML = `
    <tr>
      <td style="padding: 8px 6px; font-weight: 600;">Kiran Shah</td>
      <td style="padding: 8px 6px;">Email</td>
      <td style="padding: 8px 6px;">0.63</td>
      <td style="padding: 8px 6px; text-align: right;">13</td>
    </tr>
    <tr>
      <td style="padding: 8px 6px; font-weight: 600;">Mitesh Panchal</td>
      <td style="padding: 8px 6px;">Email</td>
      <td style="padding: 8px 6px;">0.62</td>
      <td style="padding: 8px 6px; text-align: right;">13</td>
    </tr>
    <tr>
      <td style="padding: 8px 6px; font-weight: 600;">Pushpa Singh</td>
      <td style="padding: 8px 6px;">Email</td>
      <td style="padding: 8px 6px;">0.62</td>
      <td style="padding: 8px 6px; text-align: right;">11</td>
    </tr>
    <tr>
      <td style="padding: 8px 6px; font-weight: 600;">Chat Support</td>
      <td style="padding: 8px 6px;">Chat</td>
      <td style="padding: 8px 6px;">0.21</td>
      <td style="padding: 8px 6px; text-align: right;">7</td>
    </tr>
    <tr style="border-top: 1px solid #475569; font-weight: 700; color: #F8FAFC;">
      <td style="padding: 8px 6px;">Total</td>
      <td style="padding: 8px 6px;">-</td>
      <td style="padding: 8px 6px;">0.73</td>
      <td style="padding: 8px 6px; text-align: right;">56</td>
    </tr>
  `;

  document.getElementById('tblSlaAdherenceAgentChannel').innerHTML = `
    <tr>
      <td style="padding: 8px 6px; font-weight: 600;">Chat Support</td>
      <td style="padding: 8px 6px;">App</td>
      <td style="padding: 8px 6px;">0</td>
      <td style="padding: 8px 6px;">3</td>
      <td style="padding: 8px 6px; text-align: right; color: #10B981; font-weight: 700;">100%</td>
    </tr>
    <tr>
      <td style="padding: 8px 6px; font-weight: 600;">Kiran Shah</td>
      <td style="padding: 8px 6px;">Email</td>
      <td style="padding: 8px 6px;">3</td>
      <td style="padding: 8px 6px;">20</td>
      <td style="padding: 8px 6px; text-align: right; color: #F59E0B; font-weight: 700;">85%</td>
    </tr>
    <tr>
      <td style="padding: 8px 6px; font-weight: 600;">Kiran Shah</td>
      <td style="padding: 8px 6px;">WhatsApp</td>
      <td style="padding: 8px 6px;">0</td>
      <td style="padding: 8px 6px;">7</td>
      <td style="padding: 8px 6px; text-align: right; color: #10B981; font-weight: 700;">100%</td>
    </tr>
    <tr>
      <td style="padding: 8px 6px; font-weight: 600;">Mitesh Panchal</td>
      <td style="padding: 8px 6px;">Email</td>
      <td style="padding: 8px 6px;">0</td>
      <td style="padding: 8px 6px;">12</td>
      <td style="padding: 8px 6px; text-align: right; color: #10B981; font-weight: 700;">100%</td>
    </tr>
    <tr style="border-top: 1px solid #475569; font-weight: 700; color: #F8FAFC;">
      <td style="padding: 8px 6px;">Total</td>
      <td style="padding: 8px 6px;">-</td>
      <td style="padding: 8px 6px;">3</td>
      <td style="padding: 8px 6px;">56</td>
      <td style="padding: 8px 6px; text-align: right; color: #10B981; font-weight: 700;">94.6%</td>
    </tr>
  `;
}

let currentKpiReportType = '';
let kpiReportFilteredData = [];

function openKpiReport(reportType) {
  currentKpiReportType = reportType;

  // Clear any existing filters in the report view page
  document.getElementById('kpiReportSearch').value = '';
  document.getElementById('kpiReportFilterStatus').value = 'All';
  document.getElementById('kpiReportFilterChannel').value = 'All';
  document.getElementById('kpiReportFilterPriority').value = 'All';

  updateKpiReportPage();
  switchView('kpi-report');
}

function updateKpiReportPage() {
  const titleEl = document.getElementById('kpiReportPageTitle');
  const subEl = document.getElementById('kpiReportPageSub');
  const headEl = document.getElementById('kpiReportPageHead');
  const bodyEl = document.getElementById('kpiReportPageBody');
  const countEl = document.getElementById('kpiReportPageCount');
  const filterSummaryEl = document.getElementById('kpiReportPageActiveFilters');

  if (!titleEl || !subEl || !headEl || !bodyEl || !countEl) return;

  // Let's filter tickets using the active KPI dashboard filters first!
  const createdFilter = document.getElementById('kpiFilterCreated').value;
  const deptFilter = document.getElementById('kpiFilterDept').value;
  const nbfcFilter = document.getElementById('kpiFilterNBFC').value;
  const closedFilter = document.getElementById('kpiFilterClosed').value;

  let tix = [...TICKETS];
  if (deptFilter !== 'All') tix = tix.filter(t => t.department === deptFilter);
  if (nbfcFilter !== 'All') tix = tix.filter(t => getCustomerNbfc(t.customer) === nbfcFilter);
  if (closedFilter === 'Today') {
    tix = tix.filter(t => t.status === 'Resolved' || t.status === 'Closed');
  } else if (closedFilter === 'Yesterday') {
    tix = tix.filter(t => (t.status === 'Resolved' || t.status === 'Closed') && t.id.charCodeAt(t.id.length - 1) % 2 === 0);
  }

  // Now apply the report page filters:
  const searchVal = document.getElementById('kpiReportSearch').value.toLowerCase();
  const statusVal = document.getElementById('kpiReportFilterStatus').value;
  const chanVal = document.getElementById('kpiReportFilterChannel').value;
  const priorityVal = document.getElementById('kpiReportFilterPriority').value;

  if (searchVal) {
    tix = tix.filter(t =>
      t.id.toLowerCase().includes(searchVal) ||
      t.customer.toLowerCase().includes(searchVal) ||
      t.subject.toLowerCase().includes(searchVal)
    );
  }
  if (statusVal !== 'All') {
    tix = tix.filter(t => t.status === statusVal);
  }
  if (chanVal !== 'All') {
    tix = tix.filter(t => t.channel === chanVal || (chanVal === 'Call' && t.channel === 'Call') || (chanVal === 'Chat' && t.channel === 'Chat'));
  }
  if (priorityVal !== 'All') {
    tix = tix.filter(t => t.priority === priorityVal);
  }

  kpiReportFilteredData = tix;

  let title = '';
  let sub = '';
  let headers = '';
  let rows = '';

  switch (currentKpiReportType) {
    case 'avg_frt':
      title = 'Agent Average Response Time Report';
      sub = 'Calculates average response times in business hours for each agent based on their closed cases.';
      headers = `<tr><th>Agent Name</th><th>Assigned Cases</th><th>Average FRT</th><th>CSAT Rating</th></tr>`;

      const frtData = [
        { name: 'Asma Vohra', cases: 14, frt: 0.63, csat: 4.4 },
        { name: 'Thor Odinson', cases: 11, frt: 0.62, csat: 4.5 },
        { name: 'Loki Odinson', cases: 9, frt: 0.21, csat: 4.9 },
        { name: 'jahnvi Darji', cases: 16, frt: 2.12, csat: 4.1 }
      ];
      rows = frtData.map(d => `
        <tr>
          <td><span class="assignee-pill"><span class="mini-avatar">${initials(d.name)}</span>${d.name}</span></td>
          <td>${d.cases}</td>
          <td style="font-weight: 700; color: var(--red);">${d.frt}h</td>
          <td>⭐ ${d.csat}</td>
        </tr>
      `).join('');
      break;

    case 'unique_cases':
      title = 'Unique Customer Cases Report';
      sub = 'Lists all unique customer cases currently tracked, filtered by active selection criteria.';
      headers = `<tr><th>Ticket ID</th><th>Customer</th><th>Subject</th><th>Channel</th><th>Priority</th><th>Status</th><th>NBFC Partner</th></tr>`;

      rows = tix.map(t => `
        <tr>
          <td><strong>${t.id}</strong></td>
          <td>${t.customer}</td>
          <td>${t.subject}</td>
          <td><span class="status-badge ${chanClass(t.channel)}">${t.channel}</span></td>
          <td><span class="status-badge ${t.priority === 'High' ? 'status-open' : t.priority === 'Medium' ? 'status-pending' : 'status-resolved'}">${t.priority}</span></td>
          <td><span class="status-badge ${statusClass(t.status)}">${t.status}</span></td>
          <td>${getCustomerNbfc(t.customer)}</td>
        </tr>
      `).join('');
      break;

    case 'contact_count':
      title = 'Total Contact Count Detail Report';
      sub = 'Displays message threads and contact interactions for each customer ticket.';
      headers = `<tr><th>Ticket ID</th><th>Customer</th><th>Subject</th><th>Channel</th><th>Status</th><th>Total Interactions</th></tr>`;

      rows = tix.map(t => `
        <tr>
          <td><strong>${t.id}</strong></td>
          <td>${t.customer}</td>
          <td>${t.subject}</td>
          <td><span class="status-badge ${chanClass(t.channel)}">${t.channel}</span></td>
          <td><span class="status-badge ${statusClass(t.status)}">${t.status}</span></td>
          <td style="font-weight: 700; color: var(--teal);">${t.thread ? t.thread.length : 1} messages</td>
        </tr>
      `).join('');
      break;

    case 'sla_adherence':
      title = 'SLA Adherence Report';
      sub = 'Lists tickets showing priority level, SLA remaining duration, and adherence status.';
      headers = `<tr><th>Ticket ID</th><th>Subject</th><th>Priority</th><th>SLA Status</th><th>Remaining Time</th><th>Assignee</th></tr>`;

      rows = tix.map(t => {
        const isBreached = t.slaMins < 0;
        return `
          <tr>
            <td><strong>${t.id}</strong></td>
            <td>${t.subject}</td>
            <td><span class="status-badge ${t.priority === 'High' ? 'status-open' : t.priority === 'Medium' ? 'status-pending' : 'status-resolved'}">${t.priority}</span></td>
            <td><span class="status-badge ${isBreached ? 'status-Closed' : 'status-Resolved'}">${isBreached ? 'Breached' : 'Adhered'}</span></td>
            <td style="font-weight: 700; color: ${isBreached ? 'var(--red)' : 'var(--green)'};">${t.slaMins} mins</td>
            <td>${agentName(t.assignee)}</td>
          </tr>
        `;
      }).join('');
      break;

    case 'reopen_count':
      title = 'Reopen Case Count Report';
      sub = 'Lists tickets that have been reopened after initial resolution.';
      headers = `<tr><th>Ticket ID</th><th>Subject</th><th>Department</th><th>Status</th><th>Assignee</th></tr>`;

      const reopenedTix = tix.filter(t => t.activity && t.activity.some(a => a.toLowerCase().includes('reopen')));
      if (reopenedTix.length === 0) {
        rows = `<tr><td colspan="5" style="text-align: center; color: var(--ink-faint); padding: 20px;">No reopened tickets found for the active filter.</td></tr>`;
      } else {
        rows = reopenedTix.map(t => `
          <tr>
            <td><strong>${t.id}</strong></td>
            <td>${t.subject}</td>
            <td>${t.department}</td>
            <td><span class="status-badge ${statusClass(t.status)}">${t.status}</span></td>
            <td>${agentName(t.assignee)}</td>
          </tr>
        `).join('');
      }
      break;

    case 'chat_feedback':
      title = 'Chat NPS & Customer Feedback Report';
      sub = 'Displays Net Promoter Score (NPS) surveys completed by customers after WhatsApp or Chat sessions.';
      headers = `<tr><th>Ticket ID</th><th>Customer</th><th>Channel</th><th>NPS Rating</th><th>NPS Classification</th></tr>`;

      const chatFeedbacks = [
        { id: 'TCK-10221', customer: 'Priya Sharma', channel: 'WhatsApp', rating: 9, class: 'Promoter (9-10)' },
        { id: 'TCK-10224', customer: 'Rohan Mehta', channel: 'Chat', rating: 3, class: 'Detractor (0-6)' },
        { id: 'TCK-10227', customer: 'Amit Patel', channel: 'WhatsApp', rating: 10, class: 'Promoter (9-10)' }
      ];
      rows = chatFeedbacks.map(f => `
        <tr>
          <td><strong>${f.id}</strong></td>
          <td>${f.customer}</td>
          <td>${f.channel}</td>
          <td style="font-weight: 700; color: var(--purple);">⭐ ${f.rating} / 10</td>
          <td><span class="status-badge ${f.rating >= 9 ? 'status-Resolved' : 'status-Closed'}">${f.class}</span></td>
        </tr>
      `).join('');
      break;

    case 'email_nps':
      title = 'Email NPS & Customer Survey Report';
      sub = 'Displays Net Promoter Score (NPS) surveys completed by customers after Email interactions.';
      headers = `<tr><th>Ticket ID</th><th>Customer</th><th>Channel</th><th>NPS Rating</th><th>NPS Classification</th></tr>`;

      const emailFeedbacks = [
        { id: 'TCK-10219', customer: 'Sunita Rao', channel: 'Email', rating: 2, class: 'Detractor (0-6)' },
        { id: 'TCK-10225', customer: 'Vikram Singh', channel: 'Email', rating: 8, class: 'Passive (7-8)' },
        { id: 'TCK-10232', customer: 'Neha Gupta', channel: 'Email', rating: 9, class: 'Promoter (9-10)' }
      ];
      rows = emailFeedbacks.map(f => `
        <tr>
          <td><strong>${f.id}</strong></td>
          <td>${f.customer}</td>
          <td>${f.channel}</td>
          <td style="font-weight: 700; color: var(--purple);">⭐ ${f.rating} / 10</td>
          <td><span class="status-badge ${f.rating >= 9 ? 'status-Resolved' : f.rating >= 7 ? 'status-pending' : 'status-Closed'}">${f.class}</span></td>
        </tr>
      `).join('');
      break;

    case 'nbfc_cases':
      title = 'NBFC Partner Unique Customer Cases Distribution';
      sub = 'Displays case distribution broken down by the lending NBFC partner.';
      headers = `<tr><th>NBFC Partner</th><th>Unique Cases Count</th><th>Percentage</th></tr>`;

      const nbfcData = [
        { name: 'Chinmay Finlease Limited', count: tix.filter(t => getCustomerNbfc(t.customer) === 'Chinmay Finlease Limited').length || 11, color: '#8B5CF6' },
        { name: 'TAPADIYA CAPITAL PRIVATE', count: tix.filter(t => getCustomerNbfc(t.customer) === 'TAPADIYA CAPITAL PRIVATE').length || 4, color: '#EC4899' },
        { name: 'Others / Unassigned', count: Math.max(0, tix.length - 15) || 63, color: '#3B82F6' }
      ];
      const totalNbfc = nbfcData.reduce((s, i) => s + i.count, 0);
      rows = nbfcData.map(d => `
        <tr>
          <td><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${d.color}; margin-right:8px;"></span>${d.name}</td>
          <td style="font-weight: 700;">${d.count}</td>
          <td>${totalNbfc > 0 ? (d.count / totalNbfc * 100).toFixed(2) : '0'}%</td>
        </tr>
      `).join('');
      break;

    case 'case_classification':
      title = 'Classification of Case Report';
      sub = 'Lists volume of cases categorized under Requests vs. Complaints.';
      headers = `<tr><th>Classification</th><th>Record Count</th><th>Percentage</th></tr>`;

      const reqCount = tix.filter(t => t.category !== 'Dispute' && t.category !== 'Declined Profile').length || 161;
      const compCount = tix.filter(t => t.category === 'Dispute' || t.category === 'Declined Profile').length || 6;
      const totalCls = reqCount + compCount;

      rows = `
        <tr>
          <td><strong>Request</strong></td>
          <td>${reqCount}</td>
          <td>${(reqCount / totalCls * 100).toFixed(2)}%</td>
        </tr>
        <tr>
          <td><strong>Complaint</strong></td>
          <td>${compCount}</td>
          <td>${(compCount / totalCls * 100).toFixed(2)}%</td>
        </tr>
      `;
      break;

    case 'channel_sla':
      title = 'Channel-Wise SLA Adherence Report';
      sub = 'Calculates SLA breaches and adherence rate across communication channels.';
      headers = `<tr><th>Channel</th><th>Cases Breached</th><th>Total Cases</th><th>Adherence %</th></tr>`;

      const chanData = ['Email', 'Phone', 'WhatsApp', 'App'].map(c => {
        const cTix = tix.filter(t => t.channel === c || (c === 'Phone' && t.channel === 'Call') || (c === 'App' && t.channel === 'Chat'));
        const total = cTix.length || (c === 'Email' ? 41 : c === 'Phone' ? 31 : c === 'WhatsApp' ? 34 : 21);
        const breached = cTix.filter(t => t.slaMins < 0).length || (c === 'Email' ? 7 : 0);
        return { channel: c, breached, total, pct: total > 0 ? ((total - breached) / total * 100) : 100 };
      });
      rows = chanData.map(d => `
        <tr>
          <td><strong>${d.channel}</strong></td>
          <td>${d.breached}</td>
          <td>${d.total}</td>
          <td style="font-weight: 700; color: ${d.pct >= 90 ? 'var(--green)' : 'var(--orange)'};">${d.pct.toFixed(2)}%</td>
        </tr>
      `).join('');
      break;

    default:
      title = 'KPI Report Details';
      sub = 'Detailed records representing the selected KPI metrics.';
      headers = `<tr><th>Ticket ID</th><th>Customer</th><th>Subject</th><th>Department</th><th>Status</th></tr>`;
      rows = tix.slice(0, 10).map(t => `
        <tr>
          <td><strong>${t.id}</strong></td>
          <td>${t.customer}</td>
          <td>${t.subject}</td>
          <td>${t.department}</td>
          <td>${t.status}</td>
        </tr>
      `).join('');
  }

  titleEl.textContent = title;
  subEl.textContent = sub;
  headEl.innerHTML = headers;
  bodyEl.innerHTML = rows || `<tr><td colspan="10" style="text-align: center; color: var(--ink-soft); padding: 30px;">No matching records found for active filters.</td></tr>`;
  countEl.textContent = `Showing ${tix.length} matching records`;
  filterSummaryEl.textContent = `Dashboard Filters: Dept=${deptFilter}, NBFC=${nbfcFilter}, Closed=${closedFilter} | Active Report Filters: Search="${searchVal || 'None'}", Status=${statusVal}, Channel=${chanVal}, Priority=${priorityVal}`;
}

function exportKpiReportToCSV() {
  if (!kpiReportFilteredData || kpiReportFilteredData.length === 0) {
    showToast('No records to export');
    return;
  }
  let csv = 'Ticket ID,Customer,Subject,Channel,Priority,Status,Department\n';
  kpiReportFilteredData.forEach(t => {
    csv += `"${t.id}","${t.customer.replace(/"/g, '""')}","${t.subject.replace(/"/g, '""')}","${t.channel}","${t.priority}","${t.status}","${t.department}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${currentKpiReportType}_report_export.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Report CSV file exported successfully.');
}

function refreshKpiData() {
  filterKpi();
  showToast('KPI Dashboard data re-calculated successfully.');
}

/* ---------- Channelwise Agent Assignments ---------- */
function renderChannelAssignments() {
  const body = document.getElementById('channelAssignmentsBody');
  if (!body) return;

  if (CHANNEL_ASSIGNMENTS.length === 0) {
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--ink-faint);padding:20px;">No channel-wise assignments configured.</td></tr>`;
    return;
  }

  const now = new Date();

  body.innerHTML = CHANNEL_ASSIGNMENTS.map(ca => {
    const start = new Date(`${ca.startDate}T${ca.startTime}:00`);
    const end = new Date(`${ca.endDate}T${ca.endTime}:00`);

    let currentStatus = ca.status;
    if (ca.status === 'Active' && (now < start || now > end)) {
      currentStatus = now > end ? 'Expired' : 'Scheduled';
    }

    let statusClass = 'status-badge status-Resolved'; // green/Active
    if (currentStatus === 'Paused') statusClass = 'status-badge status-Closed'; // grey
    else if (currentStatus === 'Expired') statusClass = 'status-badge status-Closed'; // grey
    else if (currentStatus === 'Scheduled') statusClass = 'status-badge status-Open'; // blue

    const activePeriod = `${ca.startDate} ${ca.startTime} to ${ca.endDate} ${ca.endTime}`;
    const statusBtnText = ca.status === 'Active' ? 'Pause' : 'Activate';

    return `
      <tr>
        <td style="font-weight: 600; color: #0F172A;">${ca.agentName}</td>
        <td>${ca.dept}</td>
        <td><span class="chan-badge chan-badge-${ca.channel.toLowerCase()}" style="background:#E2E8F0; color:#475569; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${ca.channel}</span></td>
        <td style="font-size:12px; color:var(--ink-soft);">${activePeriod}</td>
        <td><span class="${statusClass}">${currentStatus}</span></td>
        <td style="text-align: right;">
          <button class="btn btn-ghost btn-sm" onclick="toggleChannelAssignmentStatus('${ca.id}')" style="margin-right: 4px;" ${currentStatus === 'Expired' ? 'disabled' : ''}>${statusBtnText}</button>
          <button class="btn btn-ghost btn-sm" onclick="deleteChannelAssignment('${ca.id}')" style="color: var(--red);">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddChannelAssignmentModal() {
  // Populate department dropdown
  const deptSelect = document.getElementById('caDept');
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">Select Department</option>' +
      Object.keys(DEPT_AGENTS).map(d => `<option value="${d}">${d}</option>`).join('');
  }

  // Reset agent dropdown
  const agentSelect = document.getElementById('caAgent');
  if (agentSelect) {
    agentSelect.innerHTML = '<option value="">Select Agent</option>';
  }

  document.getElementById('caChannel').value = '';

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('caStartDate').value = today;
  document.getElementById('caEndDate').value = today;
  document.getElementById('caStartTime').value = '09:00';
  document.getElementById('caEndTime').value = '18:00';

  // Open modal
  const modal = document.getElementById('modalAddChannelAssignment');
  modal.classList.add('show');

  // Enhance selects inside modal
  enhanceAllSelects(modal);
}

function onCaDeptChange() {
  const dept = document.getElementById('caDept').value;
  const agentSelect = document.getElementById('caAgent');
  if (!agentSelect) return;

  if (!dept) {
    agentSelect.innerHTML = '<option value="">Select Agent</option>';
  } else {
    const agentIds = DEPT_AGENTS[dept] || [];
    agentSelect.innerHTML = '<option value="">Select Agent</option>' +
      AGENTS.filter(a => agentIds.includes(a.id)).map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  }

  // Trigger enhance select updates
  refreshSearchSelect(agentSelect);
}

function resetChannelAssignmentForm() {
  document.getElementById('caDept').value = '';
  if (document.getElementById('caDept').selectedValues) {
    document.getElementById('caDept').selectedValues = [''];
  }
  refreshSearchSelect(document.getElementById('caDept'));

  const agentSelect = document.getElementById('caAgent');
  agentSelect.innerHTML = '<option value="">Select Agent</option>';
  if (agentSelect.selectedValues) {
    agentSelect.selectedValues = [''];
  }
  refreshSearchSelect(agentSelect);

  document.getElementById('caChannel').value = '';
  if (document.getElementById('caChannel').selectedValues) {
    document.getElementById('caChannel').selectedValues = [''];
  }
  refreshSearchSelect(document.getElementById('caChannel'));

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('caStartDate').value = today;
  document.getElementById('caEndDate').value = today;
  document.getElementById('caStartTime').value = '09:00';
  document.getElementById('caEndTime').value = '18:00';

  showToast('Form reset successfully.');
}

function saveChannelAssignment() {
  const dept = document.getElementById('caDept').value;
  const agentId = document.getElementById('caAgent').value;
  const channel = document.getElementById('caChannel').value;
  const startDate = document.getElementById('caStartDate').value;
  const startTime = document.getElementById('caStartTime').value;
  const endDate = document.getElementById('caEndDate').value;
  const endTime = document.getElementById('caEndTime').value;

  if (!dept || !agentId || !channel || !startDate || !startTime || !endDate || !endTime) {
    showToast('Please fill in all fields.');
    return;
  }

  const start = new Date(`${startDate}T${startTime}:00`);
  const end = new Date(`${endDate}T${endTime}:00`);
  if (start >= end) {
    showToast('Start date & time must be before end date & time.');
    return;
  }

  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) {
    showToast('Selected agent not found.');
    return;
  }

  // Validate if the agent has the selected channel skill
  const hasSkill = agent.skills && agent.skills.channels.includes(channel);
  if (!hasSkill) {
    showToast(`Validation Warning: ${agent.name} does not have the ${channel} skill set! Please configure this skill first.`);
    return;
  }

  const newAssignment = {
    id: 'ca_' + Date.now(),
    dept,
    agentId,
    agentName: agent.name,
    channel,
    startDate,
    startTime,
    endDate,
    endTime,
    status: 'Active'
  };

  CHANNEL_ASSIGNMENTS.push(newAssignment);
  closeModal('modalAddChannelAssignment');
  showToast('Channel-wise agent assignment created successfully.');

  // Update views
  renderTeamStatus();
  renderChannelAssignments();
}

function toggleChannelAssignmentStatus(id) {
  const ca = CHANNEL_ASSIGNMENTS.find(x => x.id === id);
  if (ca) {
    ca.status = ca.status === 'Active' ? 'Paused' : 'Active';
    showToast(`Assignment for ${ca.agentName} has been ${ca.status.toLowerCase()}.`);
    renderChannelAssignments();
    renderTeamStatus();
  }
}

function deleteChannelAssignment(id) {
  const idx = CHANNEL_ASSIGNMENTS.findIndex(x => x.id === id);
  if (idx > -1) {
    const ca = CHANNEL_ASSIGNMENTS[idx];
    CHANNEL_ASSIGNMENTS.splice(idx, 1);
    showToast(`Assignment for ${ca.agentName} deleted.`);
    renderChannelAssignments();
    renderTeamStatus();
  }
}

let statusDropdownOpen = false;
let channelDropdownOpen = false;

function toggleChannelDropdown(e) {
  if (e) e.stopPropagation();
  channelDropdownOpen = !channelDropdownOpen;
  if (channelDropdownOpen) {
    buildChannelOptionsList();
    statusDropdownOpen = false;
    const sMenu = document.getElementById('statusDropdownMenu');
    if (sMenu) sMenu.classList.remove('show');
  }
  document.getElementById('channelDropdownMenu').classList.toggle('show', channelDropdownOpen);
}

function buildChannelOptionsList() {
  const me = AGENTS.find(a => a.id === CURRENT_AGENT_ID);
  if (!me) return;
  const list = document.getElementById('channelOptionsList');
  if (!list) return;

  const channels = ['Email', 'WhatsApp', 'Chat', 'Call'];
  list.innerHTML = channels.map(ch => {
    const hasSkill = me.skills && me.skills.channels.includes(ch);
    return `
      <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--ink); margin: 4px 0;">
        <input type="checkbox" name="activeChan" value="${ch}" ${hasSkill ? 'checked' : ''} onchange="toggleAgentChannel('${ch}', this.checked)">
        <span>${ch}</span>
      </label>
    `;
  }).join('');
}

function toggleAgentChannel(channel, checked) {
  const me = AGENTS.find(a => a.id === CURRENT_AGENT_ID);
  if (!me) return;

  if (!me.skills) me.skills = { channels: [], languages: [] };

  const idx = me.skills.channels.indexOf(channel);
  if (checked && idx === -1) {
    me.skills.channels.push(channel);
    me.log.unshift({
      ts: Date.now(),
      text: `Added active channel: ${channel} (self-reassign to manage workload)`,
      actor: me.name,
      by: 'agent'
    });
    showToast(`You have reassigned yourself to the ${channel} channel.`);
  } else if (!checked && idx > -1) {
    me.skills.channels.splice(idx, 1);
    me.log.unshift({
      ts: Date.now(),
      text: `Removed active channel: ${channel} (self-reassign to manage workload)`,
      actor: me.name,
      by: 'agent'
    });
    showToast(`You have stopped receiving tickets from the ${channel} channel.`);
  }

  refreshHeaderStatus();
  if (document.getElementById('view-team').classList.contains('active')) renderTeamStatus();
}

function refreshHeaderStatus() {
  const me = AGENTS.find(a => a.id === CURRENT_AGENT_ID);
  if (!me) return;
  document.getElementById('headerAvatarInitials').textContent = initials(me.name);
  document.getElementById('statusPillLabel').textContent = me.status;
  document.getElementById('headerStatusDot').style.background = STATUS_COLOR[me.status];

  const channelPillLabel = document.getElementById('channelPillLabel');
  if (channelPillLabel) {
    const activeChans = (me.skills && me.skills.channels.length > 0) ? me.skills.channels.join(', ') : 'None';
    channelPillLabel.textContent = `Channels: ${activeChans}`;
  }
}

setInterval(() => {
  refreshHeaderStatus();
  if (document.getElementById('view-team').classList.contains('active')) renderTeamStatus();
}, 30000);
