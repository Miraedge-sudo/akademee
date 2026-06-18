/**
 * Admin dashboard — loads school + user data from backend (tenant-scoped).
 */
const AkademeeDashboard = {
  async init() {
    await AkademeeConfig.load();
    AkademeeConfig.consumeAuthHash();

    const session = AkademeeConfig.getSession();
    if (!session) {
      const subdomain = AkademeeConfig.getSubdomainFromHost();
      window.location.href = subdomain
        ? AkademeeConfig.formatLoginUrl(subdomain, 'dashboard')
        : 'akademee_login.html';
      return;
    }

    const subdomain = AkademeeConfig.getSubdomainFromHost();
    if (subdomain && session.user.subdomain && subdomain !== session.user.subdomain) {
      alert('You are signed in to a different school.');
      await AkademeeConfig.logout();
      return;
    }

    await Promise.all([this.loadProfile(), this.loadSchoolData(), this.loadStudentStats()]);
    this.bindLogout();
  },

  authHeaders() {
    return AkademeeConfig.getAuthHeaders(AkademeeConfig.getSubdomainFromHost());
  },

  greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  },

  initials(firstName, lastName) {
    return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase() || 'AD';
  },

  async loadProfile() {
    const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/auth/me`, {
      headers: this.authHeaders(),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      await AkademeeConfig.logout();
      return;
    }

    const user = payload.data;
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const schoolName = user.school?.name || user.schoolName || 'Your school';

    const titleEl = document.getElementById('dash-greeting');
    if (titleEl) {
      titleEl.textContent = `${this.greeting()}, ${firstName || 'Admin'} 👋`;
    }

    const subEl = document.getElementById('dash-subtitle');
    if (subEl) {
      subEl.textContent = `Here's what's happening at ${schoolName} today.`;
    }

    document.querySelectorAll('.user-pill-name').forEach((el) => {
      el.textContent = fullName || 'Admin';
    });

    document.querySelectorAll('.user-pill-avatar').forEach((el) => {
      el.textContent = this.initials(firstName, lastName);
    });
  },

  async loadSchoolData() {
    const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/schools/onboarding`, {
      headers: this.authHeaders(),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) return;

    const school = payload.data;

    if (school.primaryColor) {
      AkademeeConfig.applyBrandColor(school.primaryColor);
    }

    const initials = (school.schoolName || 'SC')
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const nameEl = document.querySelector('.school-name');
    if (nameEl) nameEl.textContent = school.schoolName || 'School';

    const urlEl = document.querySelector('.school-url');
    if (urlEl && school.subdomain) {
      urlEl.textContent = `${school.subdomain}${AkademeeConfig.domainSuffix || ''}`;
    }

    document.querySelectorAll('.school-avatar').forEach((el) => {
      el.textContent = initials;
    });

    const statStudents = school.websiteStats?.studentsEnrolled;
    const progressNum = document.querySelector('.year-progress .progress-num');
    if (progressNum && statStudents) {
      progressNum.textContent = statStudents;
    }
  },

  async loadStudentStats() {
    const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/students?limit=1`, {
      headers: this.authHeaders(),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) return;

    const total = payload.data?.total ?? 0;

    document.querySelectorAll('[data-stat="students-total"]').forEach((el) => {
      el.textContent = total;
    });

    const navBadge = document.querySelector('.nav-item[href*="students"] .nav-badge');
    if (navBadge) navBadge.textContent = total;

    const addBtn = document.getElementById('dash-add-student');
    if (addBtn) {
      addBtn.onclick = () => {
        window.location.href = 'akademee_add_student_modal.html';
      };
    }
  },

  bindLogout() {
    const logoutLink = document.getElementById('logout-btn');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        AkademeeConfig.logout();
      });
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('dash-greeting') || document.querySelector('.school-badge')) {
    AkademeeDashboard.init();
  }
});

window.AkademeeDashboard = AkademeeDashboard;
