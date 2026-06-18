/**
 * Students module — CRUD via API; list is scoped to the authenticated school's tenant.
 */
const AkademeeStudents = {
  students: [],
  editingId: null,

  async init() {
    await AkademeeConfig.load();
    AkademeeConfig.consumeAuthHash();

    const session = AkademeeConfig.getSession();
    if (!session) {
      window.location.href = 'akademee_login.html?redirect=dashboard';
      return;
    }
    await this.loadStudents();
  },

  authHeaders() {
    return AkademeeConfig.getAuthHeaders(AkademeeConfig.getSubdomainFromHost());
  },

  async loadStudents() {
    try {
      const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/students?limit=100`, {
        headers: this.authHeaders(),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load students');
      }
      this.students = (payload.data?.students || []).map((s) => this.mapStudent(s));
      this.render();
      this.updateCount(payload.data?.total || this.students.length);
    } catch (error) {
      console.error(error);
      this.students = [];
      this.render();
    }
  },

  mapStudent(s) {
    const feeMap = {
      paid: 'Active',
      partial: 'Pending fees',
      unpaid: 'Unpaid',
      overdue: 'Unpaid',
      pending: 'Pending fees',
    };
    const colors = ['av-teal', 'av-blue', 'av-pink', 'av-amber', 'av-purple'];
    const color = colors[s.fullName.length % colors.length];

    return {
      id: s.studentNumber || s.id,
      uuid: s.id,
      name: s.fullName,
      class: s.className || '—',
      dob: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      enrolled: s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      status: feeMap[s.feeStatus] || 'Active',
      av: s.initials || 'ST',
      color,
      raw: s,
    };
  },

  updateCount(total) {
    const el = document.querySelector('.page-count');
    if (el) el.textContent = `${total} students · loaded from your school`;
  },

  statusBadge(s) {
    if (s === 'Active') return '<span class="badge badge-active">Active</span>';
    if (s === 'Pending fees') return '<span class="badge badge-warning">Pending fees</span>';
    if (s === 'Unpaid') return '<span class="badge badge-danger">Unpaid</span>';
    return `<span class="badge badge-gray">${s}</span>`;
  },

  render() {
    const list = this.filtered();
    const tbody = document.getElementById('table-body');
    const cards = document.getElementById('cards-list');
    if (!tbody) return;

    tbody.innerHTML = list.length
      ? list.map((s) => `
    <tr>
      <td><div class="student-cell"><div class="av ${s.color}">${s.av}</div><div><div class="s-name">${s.name}</div><div class="s-id">${s.id}</div></div></div></td>
      <td>${s.class}</td>
      <td class="col-hide-tablet" style="color:var(--gray-400)">${s.dob}</td>
      <td>${this.statusBadge(s.status)}</td>
      <td class="col-hide-tablet" style="color:var(--gray-400)">${s.enrolled}</td>
      <td><div class="row-actions" style="justify-content:flex-end">
        <button class="row-btn" title="Delete" onclick="AkademeeStudents.remove('${s.uuid}')">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div></td>
    </tr>`).join('')
      : `<tr><td colspan="6"><div class="empty-state"><div class="empty-title">No students found</div></div></td></tr>`;

    if (cards) {
      cards.innerHTML = list.length
        ? list.map((s) => `
    <a class="student-card" href="#">
      <div class="card-av ${s.color}">${s.av}</div>
      <div class="card-body"><div class="card-name">${s.name}</div><div class="card-meta"><span>${s.id}</span><span class="card-meta-sep">·</span><span>${s.class}</span></div></div>
      <div class="card-right">${this.statusBadge(s.status)}</div>
    </a>`).join('')
        : `<div class="empty-state"><div class="empty-title">No students found</div></div>`;
    }

    const pag = document.getElementById('pag-info');
    if (pag) pag.textContent = `Showing 1–${Math.min(list.length, 100)} of ${list.length}`;
  },

  filtered() {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase();
    const cl = document.getElementById('class-filter')?.value || '';
    const st = document.getElementById('status-filter')?.value || '';
    return this.students.filter(
      (s) =>
        (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) &&
        (!cl || s.class === cl) &&
        (!st || s.status === st)
    );
  },

  filterStudents() {
    this.render();
  },

  async create(payload) {
    const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/students`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Could not create student');
    }
    return data.data;
  },

  async remove(id) {
    if (!confirm('Delete this student?')) return;
    const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/students/${id}`, {
      method: 'DELETE',
      headers: this.authHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      alert(data.message || 'Delete failed');
      return;
    }
    await this.loadStudents();
  },

  feeStatusFromUi(uiStatus) {
    if (uiStatus === 'paid') return 'paid';
    if (uiStatus === 'unpaid') return 'unpaid';
    return 'partial';
  },
};

window.AkademeeStudents = AkademeeStudents;
