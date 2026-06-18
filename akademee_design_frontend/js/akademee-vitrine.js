/**
 * Load live school website data from the API (tenant-scoped by subdomain).
 * Applies onboarding content: stats, values, description, hero, logo, gallery.
 */
(function () {
  function setText(selector, value, root = document) {
    root.querySelectorAll(selector).forEach((el) => {
      if (value !== undefined && value !== null && value !== '') el.textContent = value;
    });
  }

  function applyPrimaryColor(color) {
    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) return;
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--gold', color);
    document.documentElement.style.setProperty('--sc', color);

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--primary-mid', `rgba(${r},${g},${b},0.6)`);
    document.documentElement.style.setProperty('--gold-light', `rgba(${r},${g},${b},0.75)`);
    document.documentElement.style.setProperty('--gold-muted', `rgba(${r},${g},${b},0.15)`);
  }

  function wirePortalLinks(urls) {
    const loginUrl = urls?.loginUrl || '#';
    const dashboardUrl = urls?.dashboardUrl || '#';
    document.querySelectorAll('a[href="/login"], a[href*="akademee_login"]').forEach((a) => {
      a.href = loginUrl;
    });
    document.querySelectorAll('a[href="/dashboard"], a[href*="akademee_layout"]').forEach((a) => {
      a.href = dashboardUrl;
    });
  }

  function applyStats(stats = {}) {
    const heroNums = document.querySelectorAll('.hero-stat-num');
    const heroLbls = document.querySelectorAll('.hero-stat-lbl');
    const bandNums = document.querySelectorAll('.stat-band-num');
    const statBoxNums = document.querySelectorAll('.stats-grid .stat-num, .stat-box .stat-num');

    const values = [
      { num: stats.studentsEnrolled, lbl: 'Students enrolled' },
      { num: stats.qualifiedTeachers, lbl: 'Qualified teachers' },
      { num: stats.gcePassRate ? `${stats.gcePassRate}%` : null, lbl: 'Pass rate' },
      { num: stats.yearsOfOperation, lbl: 'Years of operation' },
    ];

    values.forEach((item, i) => {
      if (heroNums[i] && item.num) heroNums[i].textContent = item.num;
      if (heroLbls[i] && item.lbl) heroLbls[i].textContent = item.lbl;
      if (bandNums[i] && item.num) bandNums[i].textContent = item.num;
      if (statBoxNums[i] && item.num) statBoxNums[i].textContent = item.num;
    });
  }

  function applyValues(values = []) {
    const cards = document.querySelectorAll('.value-card, .about-value-card, .pillar');
    values.slice(0, cards.length).forEach((v, i) => {
      const card = cards[i];
      if (!card) return;
      const title = card.querySelector('.value-title, .value-name, .pillar-name, h3');
      const desc = card.querySelector('.value-desc, .pillar-desc, p:not(.value-name):not(.pillar-name)');
      if (title) title.textContent = v.name;
      if (desc && !desc.classList.contains('value-name') && !desc.classList.contains('pillar-name')) {
        desc.textContent = v.description;
      }
    });
  }

  function applyGallery(gallery = []) {
    const items = document.querySelectorAll('.gallery-item, .gal-item');
    gallery.slice(0, items.length).forEach((g, i) => {
      const item = items[i];
      if (!item || !g.url) return;
      item.innerHTML = `<img src="${g.url}" alt="${g.caption || 'Gallery'}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;min-height:inherit"/>`;
    });
  }

  function applyAboutText(description) {
    if (!description) return;

    const aboutEl = document.querySelector(
      '[data-site="about-text"], .about-text, .about-desc, .about-body'
    );
    if (aboutEl) {
      aboutEl.textContent = description;
    }

    document.querySelectorAll('.about-body').forEach((el, i) => {
      if (i === 0) {
        el.textContent = description;
      } else {
        el.style.display = 'none';
      }
    });
  }

  function applyHeroContent(data) {
    const heroTitle = document.querySelector('[data-site="hero-title"], .hero-title');
    if (heroTitle && data.tagline) {
      heroTitle.innerHTML = data.tagline.replace(/\n/g, '<br>');
    }

    setText('[data-site="tagline"], .hero-desc, .hero-subtitle, .footer-desc', data.tagline || data.websiteDescription);

    const navSub = document.querySelector('.nav-school-sub');
    if (navSub) {
      const parts = [];
      if (data.yearFounded) parts.push(`Est. ${data.yearFounded}`);
      if (data.city) parts.push(data.city);
      if (parts.length) navSub.textContent = parts.join(' · ');
    }

    const galleryTitle = document.querySelector('#gallery .section-title-light, #gallery .section-title');
    if (galleryTitle && data.name) {
      galleryTitle.textContent = `Life at ${data.name.split(' ')[0]}`;
    }
  }

  function applyWebsiteData(data) {
    const location = [data.city, data.region].filter(Boolean).join(', ');
    const year = new Date().getFullYear();

    document.title = `${data.name}${location ? ` — ${location}` : ''}`;

    setText('[data-site="school-name"], .nav-school-name, .footer-logo-name, .footer-brand-name', data.name);
    setText('[data-site="location"], .nav-school-sub, .brand-sub', location);
    setText('[data-site="email"], .contact-value[data-site="email"], .contact-item-value[data-site="email"]', data.email);
    setText('[data-site="phone"], .contact-value[data-site="phone"], .contact-item-value[data-site="phone"]', data.phone);
    setText('[data-site="footer-copy"], .footer-copy', `© ${year} ${data.name}. All rights reserved.`);

    applyAboutText(data.websiteDescription);
    applyHeroContent(data);

    const yearEl = document.querySelector('.hero-img-tag, [data-site="year-founded"]');
    if (yearEl && data.yearFounded) {
      yearEl.textContent = `Est. ${data.yearFounded}`;
    }

    const mapLabel = document.querySelector('[data-site="map-label"], .map-box p');
    if (mapLabel) mapLabel.textContent = `${data.name}${location ? ` · ${location}` : ''}`;

    const address = document.querySelector('[data-site="address"], .contact-item-value[data-site="address"]');
    if (address && data.address) address.textContent = data.address;

    document.querySelectorAll('.contact-item').forEach((item) => {
      const label = item.querySelector('.contact-label, .contact-item-label')?.textContent?.toLowerCase() || '';
      const valueEl = item.querySelector('.contact-value, .contact-item-value');
      if (!valueEl || valueEl.hasAttribute('data-site')) return;
      if (label.includes('address') && data.address) valueEl.textContent = data.address;
      if (label.includes('phone') && data.phone) valueEl.textContent = data.phone;
      if (label.includes('email') && data.email) valueEl.textContent = data.email;
    });

    if (data.logoUrl) {
      document.querySelectorAll('.nav-logo-mark, .footer-logo-mark, .brand-mark').forEach((el) => {
        el.style.backgroundImage = `url(${data.logoUrl})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.innerHTML = '';
      });
    }

    if (data.heroImageUrl) {
      const heroImg = document.querySelector('.hero-img-main img, .hero-photo img, [data-site="hero-image"]');
      if (heroImg) {
        heroImg.src = data.heroImageUrl;
      } else {
        document.querySelectorAll('.hero-img-main, .about-img-main').forEach((container) => {
          container.innerHTML = `<img src="${data.heroImageUrl}" alt="${data.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"/>`;
        });
      }
    }

    applyPrimaryColor(data.primaryColor);
    applyStats(data.websiteStats);
    applyValues(data.websiteValues);
    applyGallery(data.gallery);
    wirePortalLinks(data.urls);

    if (data.websitePublished === false) {
      const banner = document.createElement('div');
      banner.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:9999;background:#854d0e;color:#fff;padding:10px;text-align:center;font:14px system-ui';
      banner.textContent = 'Preview mode — publish your site from onboarding to go live.';
      document.body.prepend(banner);
    }
  }

  function showLoadError(message) {
    const banner = document.createElement('div');
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;z-index:9999;background:#7f1d1d;color:#fff;padding:12px 16px;font:14px/1.4 system-ui;text-align:center';
    banner.textContent = message;
    document.body.prepend(banner);
  }

  async function loadSchoolWebsite() {
    if (!window.AkademeeConfig) {
      showLoadError('Akademee config failed to load.');
      return;
    }

    await AkademeeConfig.load();

    const params = new URLSearchParams(window.location.search);
    const subdomain = AkademeeConfig.getSubdomainFromHost() || params.get('subdomain');

    if (!subdomain) {
      showLoadError('Open from your school subdomain or add ?subdomain=your-school');
      return;
    }

    try {
      const response = await fetch(
        `${AkademeeConfig.apiBaseUrl}/api/website/public?subdomain=${encodeURIComponent(subdomain)}`,
        { headers: { 'X-School-Subdomain': subdomain } }
      );

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        showLoadError(payload.message || 'Could not load school website data.');
        return;
      }

      applyWebsiteData(payload.data);
    } catch (error) {
      console.error(error);
      showLoadError(`Cannot reach API at ${AkademeeConfig.apiBaseUrl}`);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSchoolWebsite);
  } else {
    loadSchoolWebsite();
  }
})();
