/**
 * Akademee shared frontend config — loads domain settings from backend.
 * Session is transferred across subdomains via URL hash after registration.
 */
const AkademeeConfig = {
  apiBaseUrl: 'http://localhost:5000',
  domainSuffix: '.lvh.me:3000',
  protocol: 'http',
  tenantDomain: 'lvh.me',
  frontendPort: '3000',

  templatePages: {
    modern: '/pages/akademee_vitrine_modern.html',
    classic: '/pages/akademee_vitrine_classic.html',
    minimal: '/pages/akademee_vitrine_minimal.html',
  },

  async load() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/config/domains`);
      const payload = await response.json();
      if (payload.success && payload.data) {
        Object.assign(this, payload.data);
        this.apiBaseUrl = payload.data.apiBaseUrl || this.apiBaseUrl;
        if (payload.data.templatePages) {
          this.templatePages = payload.data.templatePages;
        }
      }
    } catch (error) {
      console.warn('Using default Akademee domain config', error);
    }
    return this;
  },

  getSubdomainFromHost() {
    const hostname = window.location.hostname.toLowerCase();
    const devDomain = this.tenantDomain || 'lvh.me';
    const patterns = [
      new RegExp(`^([a-z0-9-]+)\\.${devDomain.replace('.', '\\.')}$`),
      new RegExp(`^([a-z0-9-]+)\\.akademee\\.com$`),
      new RegExp(`^([a-z0-9-]+)\\.akademee\\.cm$`),
    ];

    for (const pattern of patterns) {
      const match = hostname.match(pattern);
      if (match && !['www', 'api', 'app', 'admin'].includes(match[1])) {
        return match[1];
      }
    }
    return null;
  },

  formatCampusUrl(subdomain) {
    return `${this.protocol || 'http'}://${subdomain}${this.domainSuffix}`;
  },

  formatWebsiteUrl(subdomain, templateCode = 'modern') {
    const page = this.templatePages?.[templateCode] || this.templatePages?.modern || '/pages/akademee_vitrine_modern.html';
    return `${this.formatCampusUrl(subdomain)}${page}`;
  },

  formatDashboardUrl(subdomain) {
    return `${this.formatCampusUrl(subdomain)}/pages/akademee_layout.html`;
  },

  formatLoginUrl(subdomain, redirect) {
    const base = `${this.formatCampusUrl(subdomain)}/pages/akademee_login.html`;
    return redirect ? `${base}?redirect=${encodeURIComponent(redirect)}` : base;
  },

  applyDomainSuffix() {
    document.querySelectorAll('[data-domain-suffix]').forEach((el) => {
      el.textContent = this.domainSuffix;
    });
  },

  applyBrandColor(color) {
    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) return;

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const root = document.documentElement;
    root.style.setProperty('--teal-900', color);
    root.style.setProperty('--teal-800', color);
    root.style.setProperty('--teal-700', color);
    root.style.setProperty('--teal-600', color);
    root.style.setProperty('--teal-50', `rgba(${r},${g},${b},0.08)`);
    root.style.setProperty('--teal-100', `rgba(${r},${g},${b},0.15)`);
    root.style.setProperty('--teal-200', `rgba(${r},${g},${b},0.35)`);
    root.style.setProperty('--teal-400', `rgba(${r},${g},${b},0.65)`);
    root.style.setProperty('--sc', color);
    root.style.setProperty('--primary', color);
  },

  saveSession(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getSession() {
    const token = localStorage.getItem('authToken');
    const userRaw = localStorage.getItem('user');
    if (!token || !userRaw) return null;
    try {
      return { token, user: JSON.parse(userRaw) };
    } catch {
      return null;
    }
  },

  /** Transfer JWT to school subdomain via URL hash (localStorage is per-origin). */
  appendSessionHash(url, result) {
    if (!result?.token || !result?.user) return url;
    const user = encodeURIComponent(JSON.stringify(result.user));
    const hash = `token=${encodeURIComponent(result.token)}&user=${user}`;
    const base = url.split('#')[0];
    return `${base}#${hash}`;
  },

  /** Read session from hash after cross-subdomain redirect; cleans URL. */
  consumeAuthHash() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return false;

    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const userRaw = params.get('user');

    if (!token || !userRaw) return false;

    try {
      this.saveSession(token, JSON.parse(decodeURIComponent(userRaw)));
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return true;
    } catch (error) {
      console.error('Failed to restore session from hash', error);
      return false;
    }
  },

  getAuthHeaders(subdomain) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (subdomain) {
      headers['X-School-Subdomain'] = subdomain;
    }
    return headers;
  },

  redirectTo(url, result) {
    window.location.href = this.appendSessionHash(url, result);
  },

  redirectToDashboard(result) {
    const dashboardUrl =
      result?.dashboardUrl ||
      result?.urls?.dashboardUrl ||
      this.formatDashboardUrl(result?.user?.subdomain || result?.subdomain);
    this.redirectTo(dashboardUrl, result);
  },

  redirectToOnboarding(result) {
    const onboardingUrl =
      result?.onboardingUrl ||
      result?.urls?.onboardingUrl ||
      `${this.formatCampusUrl(result?.subdomain || result?.user?.subdomain)}/pages/akademee_onboarding_v2.html`;
    this.redirectTo(onboardingUrl, result);
  },

  redirectToVerifyEmail(result) {
    const verifyUrl =
      result?.verifyEmailUrl ||
      result?.urls?.verifyEmailUrl ||
      `${this.formatCampusUrl(result?.subdomain || result?.user?.subdomain)}/pages/akademee_verify_email.html`;
    this.redirectTo(verifyUrl, result);
  },

  async resolveLandingUrl(subdomain) {
    if (!subdomain) return '../pages/akademee_login.html';

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/website/public?subdomain=${encodeURIComponent(subdomain)}`,
        { headers: { 'X-School-Subdomain': subdomain } }
      );
      const payload = await response.json();
      if (payload.success && payload.data?.urls?.websiteUrl) {
        return payload.data.urls.websiteUrl;
      }
    } catch (error) {
      console.warn('Could not resolve landing URL from API', error);
    }

    const session = this.getSession();
    const templateCode =
      session?.user?.templateCode ||
      session?.user?.school?.templateCode ||
      'modern';
    return this.formatWebsiteUrl(subdomain, templateCode);
  },

  async logout() {
    const subdomain = this.getSubdomainFromHost();
    const landingUrl = await this.resolveLandingUrl(subdomain);
    const token = localStorage.getItem('authToken');

    if (token) {
      try {
        await fetch(`${this.apiBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders(subdomain),
        });
      } catch (error) {
        console.warn('Logout API call failed', error);
      }
    }

    this.clearSession();
    window.location.href = landingUrl;
  },
};

window.AkademeeConfig = AkademeeConfig;
