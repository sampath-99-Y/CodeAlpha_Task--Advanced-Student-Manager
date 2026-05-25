/* ══════════════════════════════════════════════════════════════════════
   GradeFlow v2 — app.js
   Subjects support, pre-loaded students, full CRUD, charts, reports
══════════════════════════════════════════════════════════════════════ */

// ── Seed Data ─────────────────────────────────────────────────────────
const SEED_SUBJECTS = [
  { id: 'MATH101', name: 'Mathematics',       icon: '📐', color: '#3B6FE8' },
  { id: 'SCI102',  name: 'Science',           icon: '🔬', color: '#0891B2' },
  { id: 'ENG103',  name: 'English',           icon: '📖', color: '#7C3AED' },
  { id: 'HIS104',  name: 'History',           icon: '🏛️', color: '#D97706' },
  { id: 'CS105',   name: 'Computer Science',  icon: '💻', color: '#059669' },
];

const SEED_STUDENTS = [
  { id: 'S001', name: 'Aarav Sharma',    grades: { MATH101:[88,92,85,90], SCI102:[91,87,93], ENG103:[78,82,80],  HIS104:[85,88],     CS105:[95,97,92] } },
  { id: 'S002', name: 'Priya Reddy',     grades: { MATH101:[72,68,75,70], SCI102:[80,77,82], ENG103:[90,93,88],  HIS104:[70,74],     CS105:[65,60,68] } },
  { id: 'S003', name: 'Rohan Mehta',     grades: { MATH101:[95,98,96,99], SCI102:[94,96,98], ENG103:[85,88,91],  HIS104:[92,95],     CS105:[99,100,97]} },
  { id: 'S004', name: 'Sneha Iyer',      grades: { MATH101:[55,60,52,58], SCI102:[62,65,60], ENG103:[70,68,72],  HIS104:[58,55],     CS105:[50,45,55] } },
  { id: 'S005', name: 'Kiran Patel',     grades: { MATH101:[80,83,78,82], SCI102:[75,79,77], ENG103:[88,84,86],  HIS104:[80,76],     CS105:[82,85,80] } },
  { id: 'S006', name: 'Divya Nair',      grades: { MATH101:[65,70,68,72], SCI102:[88,85,90], ENG103:[92,95,90],  HIS104:[88,91],     CS105:[75,78,72] } },
  { id: 'S007', name: 'Arjun Verma',     grades: { MATH101:[90,94,88,92], SCI102:[70,72,68], ENG103:[76,80,74],  HIS104:[65,68],     CS105:[91,94,89] } },
  { id: 'S008', name: 'Meera Krishnan',  grades: { MATH101:[78,75,80,77], SCI102:[83,86,80], ENG103:[95,97,93],  HIS104:[90,93],     CS105:[70,68,74] } },
];

// ── State ─────────────────────────────────────────────────────────────
let subjects = [];
let students  = [];

function save() {
  localStorage.setItem('gf2_subjects', JSON.stringify(subjects));
  localStorage.setItem('gf2_students', JSON.stringify(students));
}
function load() {
  try {
    const ss = localStorage.getItem('gf2_subjects');
    const st = localStorage.getItem('gf2_students');
    if (ss && st) { subjects = JSON.parse(ss); students = JSON.parse(st); return; }
  } catch(e) {}
  subjects = JSON.parse(JSON.stringify(SEED_SUBJECTS));
  students  = JSON.parse(JSON.stringify(SEED_STUDENTS));
  save();
}

// ── Grade Helpers ─────────────────────────────────────────────────────
const avg = arr => arr && arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
const hi  = arr => arr && arr.length ? Math.max(...arr) : null;
const lo  = arr => arr && arr.length ? Math.min(...arr) : null;

function letter(a) {
  if (a === null || a === undefined) return '—';
  if (a >= 90) return 'A';
  if (a >= 80) return 'B';
  if (a >= 70) return 'C';
  if (a >= 60) return 'D';
  return 'F';
}
function gradeColorClass(l) {
  return { A:'A', B:'B', C:'C', D:'D', F:'F', '—':'N' }[l] || 'N';
}
function gradeHex(l) {
  return { A:'#059669', B:'#3B6FE8', C:'#D97706', D:'#EA580C', F:'#DC2626', '—':'#B8C4D8' }[l] || '#B8C4D8';
}
const fmt = v => v === null || v === undefined ? '—' : v.toFixed(1);

function studentOverallAvg(s) {
  const all = Object.values(s.grades || {}).flat();
  return avg(all);
}
function studentSubjectAvg(s, subId) {
  const gs = (s.grades || {})[subId];
  return avg(gs);
}
function avatarColor(name) {
  const cols = ['#3B6FE8','#7C3AED','#0891B2','#D97706','#059669','#DC2626','#6366F1','#EA580C'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % cols.length;
  return cols[h];
}
function initials(name) {
  return name.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
}
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Navigation ────────────────────────────────────────────────────────
let currentPage = 'dashboard';
const pageSubs = {
  dashboard: 'Overview of all students & subjects',
  students:  'Manage student profiles',
  subjects:  'Manage subjects & view class performance',
  grades:    'Add & manage individual grades',
  report:    'Full printable summary report',
};
const topActions = {
  dashboard: { label: '+ Add Student', fn: ()=>openStudentModal() },
  students:  { label: '+ Add Student', fn: ()=>openStudentModal() },
  subjects:  { label: '+ Add Subject', fn: ()=>openSubjectModal() },
  grades:    { label: '+ Add Grade',   fn: ()=>{ const s=document.getElementById('gradeStudentSel').value, sub=document.getElementById('gradeSubjectSel').value; if(s&&sub)addGradeFromTop(s,sub); else toast('Select a student and subject first.','t-err'); } },
  report:    { label: '🖨 Print',       fn: ()=>window.print() },
};

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById('page-title').textContent = page.charAt(0).toUpperCase()+page.slice(1);
  document.getElementById('page-sub').textContent = pageSubs[page];
  const ta = topActions[page];
  const btn = document.getElementById('topbarAction');
  btn.textContent = ta.label;

  if (page==='dashboard') renderDashboard();
  if (page==='students')  renderStudents();
  if (page==='subjects')  renderSubjects();
  if (page==='grades')    { populateGradeDropdowns(); renderGradePanel(); }
  if (page==='report')    { populateReportFilter(); renderReport(); }
}
function topbarActionFn() { topActions[currentPage].fn(); }

// ── Toast ─────────────────────────────────────────────────────────────
let _tt;
function toast(msg, type='t-info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(_tt);
  _tt = setTimeout(()=>el.classList.remove('show'), 2800);
}

// ── Sidebar refresh ───────────────────────────────────────────────────
function refreshSidebar() {
  document.getElementById('sb-students').textContent = students.length;
  document.getElementById('sb-subjects').textContent = subjects.length;
  const wg = students.filter(s=>studentOverallAvg(s)!==null);
  if (!wg.length) {
    document.getElementById('sb-pass').textContent = '—';
    document.getElementById('sb-avg').textContent  = '—';
    return;
  }
  const pass = wg.filter(s=>studentOverallAvg(s)>=60).length;
  document.getElementById('sb-pass').textContent = Math.round(pass/wg.length*100)+'%';
  const ca = wg.reduce((a,s)=>a+studentOverallAvg(s),0)/wg.length;
  document.getElementById('sb-avg').textContent = ca.toFixed(1);
}

// ── Refresh All ───────────────────────────────────────────────────────
function refreshAll() {
  refreshSidebar();
  if (currentPage==='dashboard') renderDashboard();
  if (currentPage==='students')  renderStudents();
  if (currentPage==='subjects')  renderSubjects();
  if (currentPage==='grades')    { populateGradeDropdowns(); renderGradePanel(); }
  if (currentPage==='report')    { populateReportFilter(); renderReport(); }
}

// ══ DASHBOARD ═════════════════════════════════════════════════════════
function renderDashboard() {
  renderKPIs();
  populateChartSubjectFilter();
  renderBarChart();
  renderDonut();
  renderLeaderboard();
  renderSubjectAverages();
}

function renderKPIs() {
  const wg     = students.filter(s=>studentOverallAvg(s)!==null);
  const pass   = wg.filter(s=>studentOverallAvg(s)>=60).length;
  const fail   = wg.filter(s=>studentOverallAvg(s)<60).length;
  const ca     = wg.length ? (wg.reduce((a,s)=>a+studentOverallAvg(s),0)/wg.length).toFixed(1) : '—';
  document.getElementById('kpiStrip').innerHTML = `
    <div class="kpi-card k-blue">
      <div class="kpi-icon-wrap">👥</div>
      <div><div class="kpi-lbl">Total Students</div><div class="kpi-val">${students.length}</div></div>
    </div>
    <div class="kpi-card k-green">
      <div class="kpi-icon-wrap">✅</div>
      <div><div class="kpi-lbl">Passing</div><div class="kpi-val">${pass}</div></div>
    </div>
    <div class="kpi-card k-red">
      <div class="kpi-icon-wrap">⚠️</div>
      <div><div class="kpi-lbl">Failing</div><div class="kpi-val">${fail}</div></div>
    </div>
    <div class="kpi-card k-amber">
      <div class="kpi-icon-wrap">📊</div>
      <div><div class="kpi-lbl">Class Average</div><div class="kpi-val">${ca}</div></div>
    </div>`;
}

function populateChartSubjectFilter() {
  const sel = document.getElementById('chartSubjectFilter');
  const cur = sel.value;
  sel.innerHTML = '<option value="all">All Subjects</option>' +
    subjects.map(s=>`<option value="${s.id}"${s.id===cur?' selected':''}>${esc(s.name)}</option>`).join('');
}

function renderBarChart() {
  const area   = document.getElementById('barChartArea');
  const filter = document.getElementById('chartSubjectFilter')?.value || 'all';

  const ranked = [...students]
    .map(s => ({
      s,
      a: filter==='all' ? studentOverallAvg(s) : studentSubjectAvg(s, filter)
    }))
    .filter(x=>x.a!==null)
    .sort((a,b)=>b.a-a.a);

  if (!ranked.length) { area.innerHTML='<div class="bar-empty">No grade data yet.</div>'; return; }

  const maxH = 180;
  const maxVal = ranked[0].a;

  area.innerHTML = ranked.map(({s,a})=>{
    const l     = letter(a);
    const color = gradeHex(l);
    const hpct  = (a/100)*maxH;
    const first = s.name.split(' ')[0];
    return `
      <div class="bar-col" title="${esc(s.name)}: ${a.toFixed(1)}">
        <div class="bar-val-label">${a.toFixed(0)}</div>
        <div class="bar-fill-wrap" style="height:${maxH}px">
          <div class="bar-fill" style="height:${hpct}px;background:${color};margin-top:${maxH-hpct}px"></div>
        </div>
        <div class="bar-name">${esc(first)}</div>
      </div>`;
  }).join('');
}

function renderDonut() {
  const canvas = document.getElementById('donutCanvas');
  const legend = document.getElementById('donutLegend');
  const dhVal  = document.getElementById('dhVal');

  const dist = {A:0,B:0,C:0,D:0,F:0};
  students.forEach(s=>{
    const a = studentOverallAvg(s);
    if (a!==null) dist[letter(a)]++;
  });
  const total = Object.values(dist).reduce((a,b)=>a+b,0);

  const wg = students.filter(s=>studentOverallAvg(s)!==null);
  const ca = wg.length ? (wg.reduce((a,s)=>a+studentOverallAvg(s),0)/wg.length) : null;
  dhVal.textContent = ca ? ca.toFixed(1) : '—';

  legend.innerHTML = '';
  if (!total) { drawDonut(canvas,[], []); return; }

  const entries = Object.entries(dist).filter(([,v])=>v>0);
  const colors  = entries.map(([l])=>gradeHex(l));
  const vals    = entries.map(([,v])=>v);
  drawDonut(canvas, vals, colors);

  legend.innerHTML = entries.map(([l,v],i)=>`
    <div class="leg-item">
      <div class="leg-dot" style="background:${colors[i]}"></div>
      ${l}: ${v}
    </div>`).join('');
}

function drawDonut(canvas, vals, colors) {
  const dpr = window.devicePixelRatio||1;
  canvas.width = canvas.height = 160*dpr;
  canvas.style.width = canvas.style.height = '160px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  const cx=80,cy=80,R=72,r=52;
  ctx.clearRect(0,0,160,160);
  if (!vals.length) {
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.lineWidth=R-r; ctx.strokeStyle='#E8EFF9'; ctx.stroke();
    return;
  }
  const total = vals.reduce((a,b)=>a+b,0);
  let start = -Math.PI/2;
  vals.forEach((v,i)=>{
    const sweep = (v/total)*Math.PI*2;
    ctx.beginPath();
    ctx.arc(cx,cy,R,start,start+sweep);
    ctx.arc(cx,cy,r,start+sweep,start,true);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    start += sweep;
  });
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle='white'; ctx.fill();
}

function renderLeaderboard() {
  const el = document.getElementById('leaderboardList');
  const ranked = [...students]
    .filter(s=>studentOverallAvg(s)!==null)
    .sort((a,b)=>studentOverallAvg(b)-studentOverallAvg(a))
    .slice(0,6);
  if (!ranked.length) { el.innerHTML='<div class="empty-sm">No data yet.</div>'; return; }
  const medals = ['🥇','🥈','🥉'];
  el.innerHTML = '<div class="lb-list">' + ranked.map((s,i)=>{
    const a  = studentOverallAvg(s);
    const l  = letter(a);
    const cc = gradeColorClass(l);
    return `
      <div class="lb-row">
        <div class="lb-rank">${medals[i]||'#'+(i+1)}</div>
        <div class="lb-avatar" style="background:${avatarColor(s.name)}">${initials(s.name)}</div>
        <div style="flex:1;min-width:0">
          <div class="lb-name">${esc(s.name)}</div>
          <div class="lb-id">${esc(s.id)}</div>
        </div>
        <div class="lb-badge bg${cc}">${a.toFixed(1)}</div>
      </div>`;
  }).join('') + '</div>';
}

function renderSubjectAverages() {
  const el = document.getElementById('subjectAveragesList');
  if (!subjects.length) { el.innerHTML='<div class="empty-sm">No subjects yet.</div>'; return; }
  el.innerHTML = '<div class="sub-avg-list">' + subjects.map(sub=>{
    const all = students.flatMap(s=>(s.grades||{})[sub.id]||[]);
    const a   = avg(all);
    const pct = a ? a : 0;
    return `
      <div class="sub-avg-row">
        <div class="sub-avg-top">
          <span class="sub-avg-name">${sub.icon} ${esc(sub.name)}</span>
          <span class="sub-avg-val">${fmt(a)}</span>
        </div>
        <div class="sub-avg-bar">
          <div class="sub-avg-fill" style="width:${pct}%;background:${sub.color}"></div>
        </div>
      </div>`;
  }).join('') + '</div>';
}

// ══ STUDENTS PAGE ═════════════════════════════════════════════════════
function renderStudents() {
  const grid  = document.getElementById('studentGrid');
  const query = document.getElementById('stuSearch')?.value.toLowerCase() || '';
  const gf    = document.getElementById('stuFilterGrade')?.value || '';

  let list = students.filter(s=>
    s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
  );
  if (gf) list = list.filter(s=>letter(studentOverallAvg(s))===gf);

  if (!list.length) {
    grid.innerHTML = `<div class="empty-hero" style="grid-column:1/-1">${query||gf ? 'No students match your filter.' : 'No students yet.'}</div>`;
    return;
  }

  grid.innerHTML = list.map(s=>{
    const oa  = studentOverallAvg(s);
    const l   = letter(oa);
    const cc  = gradeColorClass(l);
    const hiV = hi(Object.values(s.grades||{}).flat());
    const loV = lo(Object.values(s.grades||{}).flat());

    const subChips = subjects.map(sub=>{
      const sa = studentSubjectAvg(s, sub.id);
      const sl = letter(sa);
      const sc = gradeColorClass(sl);
      return `<span class="sub-chip chip-${sc}" title="${esc(sub.name)}: ${fmt(sa)}">${sub.icon} ${esc(sub.name.split(' ')[0])}: ${fmt(sa)}</span>`;
    }).join('');

    return `
      <div class="stu-card">
        <div class="stu-card-top">
          <div class="stu-avatar" style="background:${avatarColor(s.name)}">${initials(s.name)}</div>
          <div class="stu-info">
            <div class="stu-name">${esc(s.name)}</div>
            <div class="stu-id">ID: ${esc(s.id)}</div>
          </div>
          <span class="stu-badge bg${cc}">${l}</span>
        </div>
        <div class="stu-stats">
          <div class="stu-stat">
            <div class="stu-stat-val g${cc}">${fmt(oa)}</div>
            <div class="stu-stat-lbl">Average</div>
          </div>
          <div class="stu-stat">
            <div class="stu-stat-val gA">${fmt(hiV)}</div>
            <div class="stu-stat-lbl">Highest</div>
          </div>
          <div class="stu-stat">
            <div class="stu-stat-val gF">${fmt(loV)}</div>
            <div class="stu-stat-lbl">Lowest</div>
          </div>
        </div>
        <div class="stu-subjects">${subChips || '<span style="color:var(--text4);font-size:12px;align-self:center">No grades yet</span>'}</div>
        <div class="stu-actions">
          <button class="btn btn-outline btn-sm" onclick="navigate('grades');setTimeout(()=>{document.getElementById('gradeStudentSel').value='${s.id}';renderGradePanel()},60)">+ Grades</button>
          <button class="btn btn-outline btn-sm" onclick="openStudentModal('${s.id}')">Edit</button>
          <button class="btn btn-danger  btn-sm" onclick="deleteStudent('${s.id}')">Remove</button>
        </div>
      </div>`;
  }).join('');
}

// ══ SUBJECTS PAGE ═════════════════════════════════════════════════════
function renderSubjects() {
  const grid  = document.getElementById('subjectsGrid');
  const query = document.getElementById('subSearch')?.value.toLowerCase() || '';
  const list  = subjects.filter(s=>s.name.toLowerCase().includes(query)||s.id.toLowerCase().includes(query));

  if (!list.length) {
    grid.innerHTML = `<div class="empty-hero" style="grid-column:1/-1">No subjects found.</div>`;
    return;
  }

  grid.innerHTML = list.map(sub=>{
    const allGrades = students.flatMap(s=>(s.grades||{})[sub.id]||[]);
    const a   = avg(allGrades);
    const l   = letter(a);
    const cc  = gradeColorClass(l);
    const hiV = hi(allGrades);
    const loV = lo(allGrades);

    const topStudents = [...students]
      .map(s=>({ s, a: studentSubjectAvg(s, sub.id) }))
      .filter(x=>x.a!==null)
      .sort((a,b)=>b.a-a.a)
      .slice(0,3);

    return `
      <div class="subj-card">
        <div class="subj-head">
          <div class="subj-icon" style="background:${sub.color}22;border:1.5px solid ${sub.color}44">${sub.icon}</div>
          <div>
            <div class="subj-title">${esc(sub.name)}</div>
            <div class="subj-code">${esc(sub.id)}</div>
          </div>
          <div class="subj-avg-badge bg${cc}">${fmt(a)}</div>
        </div>
        <div class="subj-stats">
          <div class="subj-stat">
            <div class="subj-stat-val gA">${fmt(hiV)}</div>
            <div class="subj-stat-lbl">Highest</div>
          </div>
          <div class="subj-stat">
            <div class="subj-stat-val gF">${fmt(loV)}</div>
            <div class="subj-stat-lbl">Lowest</div>
          </div>
          <div class="subj-stat">
            <div class="subj-stat-val" style="color:var(--text2)">${allGrades.length}</div>
            <div class="subj-stat-lbl">Entries</div>
          </div>
        </div>
        <div class="subj-top-list">
          ${topStudents.length ? topStudents.map((x,i)=>{
            const sl = letter(x.a);
            const sc = gradeColorClass(sl);
            return `<div class="subj-top-item">
              <span class="subj-top-rank">#${i+1}</span>
              <div class="subj-top-name">${esc(x.s.name)}</div>
              <span class="subj-top-score bg${sc}">${x.a.toFixed(1)}</span>
            </div>`;
          }).join('') : '<div style="color:var(--text4);font-size:12px">No grades yet</div>'}
        </div>
        <div class="subj-actions">
          <button class="btn btn-outline btn-sm" onclick="openSubjectModal('${sub.id}')">Edit</button>
          <button class="btn btn-danger  btn-sm" onclick="deleteSubject('${sub.id}')">Remove</button>
        </div>
      </div>`;
  }).join('');
}

// ══ GRADES PAGE ═══════════════════════════════════════════════════════
function populateGradeDropdowns() {
  const ss = document.getElementById('gradeStudentSel');
  const sb = document.getElementById('gradeSubjectSel');
  const sv = ss.value, bv = sb.value;
  ss.innerHTML = '<option value="">— Select Student —</option>' +
    students.map(s=>`<option value="${s.id}"${s.id===sv?' selected':''}>${esc(s.name)} (${s.id})</option>`).join('');
  sb.innerHTML = '<option value="">— Select Subject —</option>' +
    subjects.map(s=>`<option value="${s.id}"${s.id===bv?' selected':''}>${s.icon} ${esc(s.name)}</option>`).join('');
}

function renderGradePanel() {
  const sid  = document.getElementById('gradeStudentSel').value;
  const subId= document.getElementById('gradeSubjectSel').value;
  const area = document.getElementById('gradePanelArea');

  if (!sid || !subId) {
    area.innerHTML = '<div class="empty-hero">Select a student and subject above to manage grades.</div>';
    return;
  }

  const s   = students.find(x=>x.id===sid);
  const sub = subjects.find(x=>x.id===subId);
  if (!s || !sub) return;

  const grades = (s.grades||{})[subId] || [];
  const a      = avg(grades);
  const l      = letter(a);
  const cc     = gradeColorClass(l);

  area.innerHTML = `
    <div class="grade-layout">
      <div class="card grade-main-card">
        <div class="card-head">
          <div>
            <div class="card-title">${sub.icon} ${esc(sub.name)} — ${esc(s.name)}</div>
            <div class="card-sub">${grades.length} grade(s) recorded</div>
          </div>
          <span class="stu-badge bg${cc}">${l}</span>
        </div>

        <div class="mini-stats-grid">
          <div class="mini-stat-box"><div class="msb-val" style="color:var(--amber)">${fmt(a)}</div><div class="msb-lbl">Average</div></div>
          <div class="mini-stat-box"><div class="msb-val g${cc}">${l}</div><div class="msb-lbl">Letter</div></div>
          <div class="mini-stat-box"><div class="msb-val gA">${fmt(hi(grades))}</div><div class="msb-lbl">Highest</div></div>
          <div class="mini-stat-box"><div class="msb-val gF">${fmt(lo(grades))}</div><div class="msb-lbl">Lowest</div></div>
        </div>

        <div class="grade-tbl-wrap">
          ${grades.length ? `
          <table class="grade-tbl">
            <thead><tr>
              <th>#</th>
              <th>Score</th>
              <th>Letter</th>
              <th>Visual</th>
              <th>Status</th>
              <th></th>
            </tr></thead>
            <tbody>
              ${grades.map((g,i)=>{
                const gl  = letter(g);
                const gcc = gradeColorClass(gl);
                return `<tr>
                  <td style="color:var(--text3);font-weight:700">${i+1}</td>
                  <td style="font-family:'Fraunces',serif;font-size:17px;font-weight:900;color:${gradeHex(gl)}">${g.toFixed(1)}</td>
                  <td><span class="grade-ltr-badge bg${gcc}">${gl}</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="grade-prog-bar">
                        <div class="grade-prog-fill" style="width:${g}%;background:${gradeHex(gl)}"></div>
                      </div>
                      <span style="font-size:11px;color:var(--text3);font-weight:600">${g.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td><span class="pass-chip ${g>=60?'pass-yes':'pass-no'}">${g>=60?'PASS':'FAIL'}</span></td>
                  <td><button class="btn btn-danger btn-sm" onclick="removeGrade('${sid}','${subId}',${i})">✕</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>` : '<div class="empty-sm">No grades yet for this subject. Add one →</div>'}
        </div>
      </div>

      <div class="card grade-add-card">
        <div class="card-head"><div class="card-title">Add Grade</div></div>
        <div class="grade-input-form">
          <div class="grade-slider-preview">
            <div class="gsp-num" id="sliderNum">75</div>
            <div class="gsp-ltr g${gradeColorClass(letter(75))}" id="sliderLtr">${letter(75)} — ${75>=60?'PASS':'FAIL'}</div>
          </div>
          <input type="range" class="grade-slider" id="gradeSlider" min="0" max="100" value="75"
            oninput="syncSlider(this.value)"/>
          <div class="field-group">
            <label class="field-lbl">Or type score (0–100)</label>
            <input class="inp" type="number" id="gradeNumInput" min="0" max="100" value="75"
              oninput="syncSliderFromInput(this.value)"/>
          </div>
          <button class="btn btn-primary" onclick="addGrade('${sid}','${subId}')">Add Grade</button>
          <div style="background:var(--bg);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px">
            <div class="field-lbl" style="margin-bottom:8px">Grade Scale</div>
            <div style="display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--text2);font-weight:600">
              <div style="display:flex;justify-content:space-between"><span class="gA">A</span><span>90 – 100</span></div>
              <div style="display:flex;justify-content:space-between"><span class="gB">B</span><span>80 – 89</span></div>
              <div style="display:flex;justify-content:space-between"><span class="gC">C</span><span>70 – 79</span></div>
              <div style="display:flex;justify-content:space-between"><span class="gD">D</span><span>60 – 69</span></div>
              <div style="display:flex;justify-content:space-between"><span class="gF">F</span><span>0 – 59</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function syncSlider(val) {
  const v = Math.max(0, Math.min(100, Number(val)||0));
  document.getElementById('gradeNumInput').value = v;
  const l = letter(v);
  document.getElementById('sliderNum').textContent = v;
  const ltr = document.getElementById('sliderLtr');
  ltr.textContent = `${l} — ${v>=60?'PASS':'FAIL'}`;
  ltr.className = `gsp-ltr g${gradeColorClass(l)}`;
}
function syncSliderFromInput(val) {
  const v = Math.max(0, Math.min(100, Number(val)||0));
  document.getElementById('gradeSlider').value = v;
  syncSlider(v);
}

function addGrade(sid, subId) {
  const val = parseFloat(document.getElementById('gradeNumInput')?.value);
  if (isNaN(val)||val<0||val>100) { toast('Enter a valid score between 0 and 100.','t-err'); return; }
  const s = students.find(x=>x.id===sid);
  if (!s) return;
  if (!s.grades) s.grades = {};
  if (!s.grades[subId]) s.grades[subId] = [];
  s.grades[subId].push(parseFloat(val.toFixed(1)));
  save();
  toast(`Grade ${val.toFixed(1)} added!`, 't-ok');
  refreshAll();
  setTimeout(()=>{ document.getElementById('gradeStudentSel').value=sid; document.getElementById('gradeSubjectSel').value=subId; renderGradePanel(); }, 40);
}

function addGradeFromTop(sid, subId) {
  navigate('grades');
  setTimeout(()=>{
    document.getElementById('gradeStudentSel').value = sid;
    document.getElementById('gradeSubjectSel').value = subId;
    renderGradePanel();
  }, 60);
}

function removeGrade(sid, subId, idx) {
  const s = students.find(x=>x.id===sid);
  if (!s||!s.grades||!s.grades[subId]) return;
  s.grades[subId].splice(idx,1);
  save();
  toast('Grade removed.','t-info');
  refreshAll();
  setTimeout(()=>{ document.getElementById('gradeStudentSel').value=sid; document.getElementById('gradeSubjectSel').value=subId; renderGradePanel(); }, 40);
}

// ══ REPORT PAGE ═══════════════════════════════════════════════════════
function populateReportFilter() {
  const sel = document.getElementById('reportSubjectFilter');
  const cur = sel.value;
  sel.innerHTML = '<option value="all">All Subjects</option>' +
    subjects.map(s=>`<option value="${s.id}"${s.id===cur?' selected':''}>${s.icon} ${esc(s.name)}</option>`).join('');
}

function renderReport() {
  const area   = document.getElementById('reportArea');
  const filter = document.getElementById('reportSubjectFilter')?.value || 'all';

  if (!students.length) { area.innerHTML='<div class="empty-hero">No data to report.</div>'; return; }

  const getAvg = s => filter==='all' ? studentOverallAvg(s) : studentSubjectAvg(s, filter);
  const ranked = [...students].sort((a,b)=>(getAvg(b)||0)-(getAvg(a)||0));

  const wg    = students.filter(s=>getAvg(s)!==null);
  const ca    = wg.length ? wg.reduce((a,s)=>a+getAvg(s),0)/wg.length : null;
  const pass  = wg.filter(s=>getAvg(s)>=60).length;
  const fail  = wg.filter(s=>getAvg(s)<60).length;
  const top   = ranked.find(s=>getAvg(s)!==null);
  const bot   = [...ranked].reverse().find(s=>getAvg(s)!==null);

  // Per-subject columns
  const subCols = filter==='all' ? subjects : subjects.filter(s=>s.id===filter);

  area.innerHTML = `
    <div class="report-section">
      <div class="report-section-title">📊 Class Overview</div>
      <div class="report-kpi-row">
        <div class="report-kpi-box"><div class="rkb-val">${students.length}</div><div class="rkb-lbl">Total Students</div></div>
        <div class="report-kpi-box"><div class="rkb-val" style="color:var(--amber)">${fmt(ca)}</div><div class="rkb-lbl">Class Average</div></div>
        <div class="report-kpi-box"><div class="rkb-val" style="color:var(--green)">${pass}</div><div class="rkb-lbl">Passing</div></div>
        <div class="report-kpi-box"><div class="rkb-val" style="color:var(--red)">${fail}</div><div class="rkb-lbl">Failing</div></div>
        <div class="report-kpi-box"><div class="rkb-val" style="color:var(--green);font-size:14px">${top?esc(top.name):'—'}</div><div class="rkb-lbl">Top Student</div></div>
        <div class="report-kpi-box"><div class="rkb-val" style="color:var(--red);font-size:14px">${bot&&bot!==top?esc(bot.name):'—'}</div><div class="rkb-lbl">Needs Support</div></div>
      </div>
    </div>

    <div class="report-section">
      <div class="report-section-title">🏆 Student Rankings</div>
      <table class="report-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>ID</th>
            <th>Name</th>
            ${subCols.map(s=>`<th>${s.icon} ${esc(s.name)}</th>`).join('')}
            <th>Overall Avg</th>
            <th>Grade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${ranked.map((s,i)=>{
            const oa  = getAvg(s);
            const l   = letter(oa);
            const cc  = gradeColorClass(l);
            const pass= oa!==null && oa>=60;
            return `<tr>
              <td class="rank-cell">#${i+1}</td>
              <td style="color:var(--text3);font-weight:600;font-size:12px">${esc(s.id)}</td>
              <td class="name-cell">
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="lb-avatar" style="background:${avatarColor(s.name)};width:28px;height:28px;border-radius:7px;font-size:11px">${initials(s.name)}</div>
                  ${esc(s.name)}
                </div>
              </td>
              ${subCols.map(sub=>{
                const sa  = studentSubjectAvg(s, sub.id);
                const sl  = letter(sa);
                const scc = gradeColorClass(sl);
                return `<td><span class="grade-ltr-badge bg${scc}" style="font-size:12px">${fmt(sa)}</span></td>`;
              }).join('')}
              <td style="font-family:'Fraunces',serif;font-size:17px;font-weight:900;color:var(--amber)">${fmt(oa)}</td>
              <td><span class="grade-ltr-badge bg${cc}">${l}</span></td>
              <td><span class="pass-chip ${oa===null?'pass-na':pass?'pass-yes':'pass-no'}">${oa===null?'N/A':pass?'PASS':'FAIL'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// ══ MODALS ════════════════════════════════════════════════════════════
let _modalMode='', _modalId='';

function openStudentModal(id=null) {
  _modalMode='student'; _modalId=id;
  const s = id ? students.find(x=>x.id===id) : null;
  document.getElementById('modalTitle').textContent = id ? 'Edit Student' : 'Add New Student';
  document.getElementById('modalBody').innerHTML = `
    <div class="field-group">
      <label class="field-lbl">Full Name</label>
      <input class="inp" id="mf-name" placeholder="e.g. Aarav Sharma" value="${s?esc(s.name):''}"/>
    </div>
    <div class="field-group">
      <label class="field-lbl">Student ID</label>
      <input class="inp" id="mf-id" placeholder="e.g. S009" value="${s?esc(s.id):''}" ${id?'disabled':''}/>
    </div>
    <div id="mf-err" style="color:var(--red);font-size:12px;font-weight:600;min-height:16px"></div>`;
  document.getElementById('modalFoot').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveStudentModal()">Save Student</button>`;
  openModal();
  setTimeout(()=>document.getElementById('mf-name').focus(), 80);
}

function saveStudentModal() {
  const name = document.getElementById('mf-name').value.trim();
  const id   = _modalId || document.getElementById('mf-id').value.trim().toUpperCase();
  const err  = document.getElementById('mf-err');
  if (!name) { err.textContent='Name is required.'; return; }
  if (!id)   { err.textContent='ID is required.'; return; }
  if (!_modalId && students.find(s=>s.id===id)) { err.textContent=`ID "${id}" already exists.`; return; }
  if (_modalId) {
    const s = students.find(s=>s.id===_modalId);
    if (s) s.name = name;
    toast(`${name} updated!`, 't-ok');
  } else {
    students.push({ id, name, grades:{} });
    toast(`${name} added!`, 't-ok');
  }
  save(); closeModal(); refreshAll();
}

function openSubjectModal(id=null) {
  _modalMode='subject'; _modalId=id;
  const sub = id ? subjects.find(x=>x.id===id) : null;
  document.getElementById('modalTitle').textContent = id ? 'Edit Subject' : 'Add New Subject';
  document.getElementById('modalBody').innerHTML = `
    <div class="field-group">
      <label class="field-lbl">Subject Name</label>
      <input class="inp" id="mf-name" placeholder="e.g. Physics" value="${sub?esc(sub.name):''}"/>
    </div>
    <div class="field-group">
      <label class="field-lbl">Subject Code</label>
      <input class="inp" id="mf-id" placeholder="e.g. PHY201" value="${sub?esc(sub.id):''}" ${id?'disabled':''}/>
    </div>
    <div class="field-group">
      <label class="field-lbl">Icon (emoji)</label>
      <input class="inp" id="mf-icon" placeholder="e.g. ⚗️" value="${sub?sub.icon:'📚'}" style="font-size:20px"/>
    </div>
    <div id="mf-err" style="color:var(--red);font-size:12px;font-weight:600;min-height:16px"></div>`;
  document.getElementById('modalFoot').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveSubjectModal()">Save Subject</button>`;
  openModal();
  setTimeout(()=>document.getElementById('mf-name').focus(), 80);
}

function saveSubjectModal() {
  const name = document.getElementById('mf-name').value.trim();
  const id   = _modalId || document.getElementById('mf-id').value.trim().toUpperCase();
  const icon = document.getElementById('mf-icon').value.trim() || '📚';
  const err  = document.getElementById('mf-err');
  if (!name) { err.textContent='Name is required.'; return; }
  if (!id)   { err.textContent='Code is required.'; return; }
  if (!_modalId && subjects.find(s=>s.id===id)) { err.textContent=`Code "${id}" already exists.`; return; }
  const colors = ['#3B6FE8','#7C3AED','#0891B2','#D97706','#059669','#DC2626'];
  if (_modalId) {
    const s = subjects.find(s=>s.id===_modalId);
    if (s) { s.name=name; s.icon=icon; }
    toast(`${name} updated!`, 't-ok');
  } else {
    subjects.push({ id, name, icon, color: colors[subjects.length % colors.length] });
    toast(`${name} added!`, 't-ok');
  }
  save(); closeModal(); refreshAll();
}

function openModal() {
  document.getElementById('overlay').classList.add('open');
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('modal').classList.remove('open');
}

// ══ DELETE ════════════════════════════════════════════════════════════
function deleteStudent(id) {
  const s = students.find(x=>x.id===id);
  if (!s||!confirm(`Remove "${s.name}" and all their grades?`)) return;
  students = students.filter(x=>x.id!==id);
  save(); toast(`${s.name} removed.`,'t-info'); refreshAll();
}
function deleteSubject(id) {
  const sub = subjects.find(x=>x.id===id);
  if (!sub||!confirm(`Remove subject "${sub.name}"? This removes all grades for this subject.`)) return;
  subjects = subjects.filter(x=>x.id!==id);
  students.forEach(s=>{ if(s.grades) delete s.grades[id]; });
  save(); toast(`${sub.name} removed.`,'t-info'); refreshAll();
}

// ══ Keyboard ══════════════════════════════════════════════════════════
document.addEventListener('keydown', e=>{
  if (e.key==='Escape') closeModal();
  if (e.key==='Enter' && document.getElementById('modal').classList.contains('open')) {
    if (_modalMode==='student') saveStudentModal();
    if (_modalMode==='subject') saveSubjectModal();
  }
});

// ══ INIT ══════════════════════════════════════════════════════════════
load();
refreshSidebar();
navigate('dashboard');
