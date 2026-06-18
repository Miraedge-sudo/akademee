/**

 * Onboarding wizard — loads and saves per-school website data via backend API.

 * Requires verified email + JWT session on the school subdomain.

 */

const AkademeeOnboarding = {

  state: {

    templateCode: 'modern',

    gallery: [],

  },



  async init() {

    await AkademeeConfig.load();

    AkademeeConfig.consumeAuthHash();



    const session = AkademeeConfig.getSession();

    if (!session) {

      const subdomain = AkademeeConfig.getSubdomainFromHost();

      window.location.href = subdomain

        ? AkademeeConfig.formatLoginUrl(subdomain, 'onboarding')

        : '../akademee_register_v2.html';

      return;

    }



    try {

      const subdomain = AkademeeConfig.getSubdomainFromHost();

      const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/schools/onboarding`, {

        headers: AkademeeConfig.getAuthHeaders(subdomain),

      });

      const payload = await response.json();



      if (!response.ok || !payload.success) {

        throw new Error(payload.message || 'Could not load onboarding data');

      }



      this.applyLoadedData(payload.data);

    } catch (error) {

      console.error(error);

      alert('Could not load your school profile. Please sign in again.');

      const subdomain = AkademeeConfig.getSubdomainFromHost();

      window.location.href = subdomain

        ? AkademeeConfig.formatLoginUrl(subdomain, 'onboarding')

        : '../akademee_register_v2.html';

      return;

    }



    this.bindFields();

  },



  applyLoadedData(data) {

    this.state.templateCode = data.templateCode || 'modern';

    this.setValue('sname', data.schoolName);

    this.setValue('fcity', data.city);

    this.setValue('fregion', data.region);

    this.setValue('ftagline', data.tagline);

    this.setValue('fyear', data.yearFounded);

    this.setValue('fdesc', data.websiteDescription);

    this.setValue('faddress', data.address);

    this.setValue('fphone', data.phone);

    this.setValue('femail', data.email);



    if (data.primaryColor) {

      applyColor(data.primaryColor);

    }



    if (data.templateCode) {

      selTpl(data.templateCode);

    }



    const stats = data.websiteStats || {};

    this.setValue('stat-students', stats.studentsEnrolled);

    this.setValue('stat-teachers', stats.qualifiedTeachers);

    this.setValue('stat-pass', stats.gcePassRate);

    this.setValue('stat-years', stats.yearsOfOperation);



    const valueInputs = document.querySelectorAll('.val-name-inp');

    const descInputs = document.querySelectorAll('.val-desc-inp');

    (data.websiteValues || []).forEach((v, i) => {

      if (valueInputs[i]) valueInputs[i].value = v.name || '';

      if (descInputs[i]) descInputs[i].value = v.description || '';

    });



    if (data.subdomain) {

      const suffix = AkademeeConfig.domainSuffix || '.lvh.me:3000';

      const host = `${data.subdomain}${suffix.startsWith('.') ? suffix : '.' + suffix}`;

      document.getElementById('purl').textContent = host;

      document.getElementById('purlbar').textContent = host;

    }



    if (data.urls?.loginUrl) {

      const loginLink = document.getElementById('onboard-login-link');

      if (loginLink) loginLink.href = data.urls.loginUrl;

    }



    if (data.logoUrl) {

      const logoAv = document.getElementById('logo-av');

      if (logoAv) {

        logoAv.style.backgroundImage = `url(${data.logoUrl})`;

        logoAv.style.backgroundSize = 'cover';

        logoAv.style.backgroundPosition = 'center';

        logoAv.textContent = '';

      }

    }



    if (data.heroImageUrl) {

      this.renderHeroPreview(data.heroImageUrl);

    }



    this.state.gallery = data.gallery || [];

    this.renderGallerySlots();



    onNameInput();

  },



  setValue(id, value) {

    const el = document.getElementById(id);

    if (el && value) el.value = value;

  },



  bindFields() {

    document.getElementById('logo-file')?.addEventListener('change', (e) => this.uploadMedia(e, 'logo'));

    document.getElementById('hero-file')?.addEventListener('change', (e) => this.uploadMedia(e, 'hero'));

    document.getElementById('gallery-file')?.addEventListener('change', (e) => this.uploadMedia(e, 'gallery'));



    document.querySelectorAll('.photo-grid .photo-slot:not(.hero)').forEach((slot, index) => {

      slot.addEventListener('click', () => {

        const input = document.getElementById('gallery-file');

        if (!input) return;

        input.onchange = (e) => this.uploadMedia(e, 'gallery', index);

        input.click();

      });

    });

  },



  renderHeroPreview(url) {

    const heroSlot = document.querySelector('.photo-slot.hero');

    if (!heroSlot || !url) return;

    heroSlot.style.backgroundImage = `url(${url})`;

    heroSlot.style.backgroundSize = 'cover';

    heroSlot.style.backgroundPosition = 'center';

    heroSlot.querySelectorAll('.slot-icon, .slot-lbl, .slot-sub').forEach((el) => {

      el.style.display = 'none';

    });

  },



  renderGallerySlots() {

    const slots = document.querySelectorAll('.photo-grid .photo-slot:not(.hero)');

    slots.forEach((slot, i) => {

      const item = this.state.gallery[i];

      if (!item?.url) {

        slot.style.backgroundImage = '';

        slot.querySelectorAll('.slot-icon, .slot-lbl, .slot-sub').forEach((el) => {

          el.style.display = '';

        });

        return;

      }

      slot.style.backgroundImage = `url(${item.url})`;

      slot.style.backgroundSize = 'cover';

      slot.style.backgroundPosition = 'center';

      slot.querySelectorAll('.slot-icon, .slot-lbl, .slot-sub').forEach((el) => {

        el.style.display = 'none';

      });

    });

  },



  collectPayload(publish = false) {

    const valueNames = [...document.querySelectorAll('.val-name-inp')];

    const valueDescs = [...document.querySelectorAll('.val-desc-inp')];

    const websiteValues = valueNames

      .map((input, i) => ({

        name: input.value.trim(),

        description: valueDescs[i]?.value.trim() || '',

      }))

      .filter((v) => v.name);



    return {

      schoolName: document.getElementById('sname')?.value.trim(),

      city: document.getElementById('fcity')?.value.trim(),

      region: document.getElementById('fregion')?.value.trim(),

      tagline: document.getElementById('ftagline')?.value.trim(),

      yearFounded: document.getElementById('fyear')?.value.trim(),

      primaryColor: document.getElementById('chex')?.value,

      templateCode: this.state.templateCode,

      websiteDescription: document.getElementById('fdesc')?.value.trim(),

      address: document.getElementById('faddress')?.value.trim(),

      phone: document.getElementById('fphone')?.value.trim(),

      email: document.getElementById('femail')?.value.trim(),

      websiteStats: {

        studentsEnrolled: document.getElementById('stat-students')?.value.trim(),

        qualifiedTeachers: document.getElementById('stat-teachers')?.value.trim(),

        gcePassRate: document.getElementById('stat-pass')?.value.trim(),

        yearsOfOperation: document.getElementById('stat-years')?.value.trim(),

      },

      websiteValues,

      onboardingCompleted: publish,

      websitePublished: publish,

    };

  },



  async saveStep() {

    const subdomain = AkademeeConfig.getSubdomainFromHost();

    const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/schools/onboarding`, {

      method: 'PUT',

      headers: AkademeeConfig.getAuthHeaders(subdomain),

      body: JSON.stringify(this.collectPayload(false)),

    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {

      throw new Error(payload.message || 'Save failed');

    }

    return payload.data;

  },



  async uploadMedia(event, mediaType, slotIndex = null) {

    const files =

      mediaType === 'gallery'

        ? [...(event.target.files || [])]

        : [event.target.files?.[0]].filter(Boolean);



    if (!files.length) return;



    const subdomain = AkademeeConfig.getSubdomainFromHost();

    const uploadBtn = document.querySelector('[onclick*="gallery-file"]');

    if (uploadBtn && mediaType === 'gallery') {

      uploadBtn.disabled = true;

      uploadBtn.textContent = 'Uploading…';

    }



    try {

      for (let i = 0; i < files.length; i++) {

        const file = files[i];

        const form = new FormData();

        form.append('file', file);
        form.append('mediaType', mediaType);
        if (mediaType === 'gallery' && slotIndex !== null && slotIndex !== undefined) {
          form.append('sortOrder', String(slotIndex + i));
        }



        const headers = AkademeeConfig.getAuthHeaders(subdomain);

        delete headers['Content-Type'];



        const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/schools/onboarding/media`, {

          method: 'POST',

          headers,

          body: form,

        });



        const payload = await response.json();

        if (!response.ok || !payload.success) {

          throw new Error(payload.message || 'Upload failed. Configure Cloudinary in backend .env');

        }



        if (mediaType === 'logo' && payload.data?.url) {

          const logoAv = document.getElementById('logo-av');

          if (logoAv) {

            logoAv.style.backgroundImage = `url(${payload.data.url})`;

            logoAv.style.backgroundSize = 'cover';

            logoAv.style.backgroundPosition = 'center';

            logoAv.textContent = '';

          }

        } else if (mediaType === 'hero' && payload.data?.url) {

          this.renderHeroPreview(payload.data.url);

        } else if (mediaType === 'gallery' && payload.data?.url) {

          const targetIndex =

            slotIndex !== null && slotIndex !== undefined

              ? slotIndex + i

              : this.state.gallery.length;

          this.state.gallery[targetIndex] = {

            id: payload.data.media_id,

            url: payload.data.url,

            caption: payload.data.caption,

          };

        }

      }



      if (mediaType === 'gallery') {

        this.renderGallerySlots();

      }

    } catch (error) {

      alert(error.message);

    } finally {

      if (uploadBtn && mediaType === 'gallery') {

        uploadBtn.disabled = false;

        uploadBtn.textContent = 'Upload gallery photos';

      }

      event.target.value = '';

    }

  },



  async publish() {

    const b = document.getElementById('pbtn');

    b.innerHTML = 'Publishing...';

    b.disabled = true;



    try {

      const subdomain = AkademeeConfig.getSubdomainFromHost();

      const response = await fetch(`${AkademeeConfig.apiBaseUrl}/api/schools/onboarding`, {

        method: 'PUT',

        headers: AkademeeConfig.getAuthHeaders(subdomain),

        body: JSON.stringify(this.collectPayload(true)),

      });

      const payload = await response.json();



      if (!response.ok || !payload.success) {

        throw new Error(payload.message || 'Publish failed');

      }



      b.innerHTML = 'Website published! Opening your landing page…';

      const websiteUrl = payload.data?.urls?.websiteUrl;



      setTimeout(() => {

        if (websiteUrl) {

          window.location.href = websiteUrl;

        }

      }, 1500);

    } catch (error) {

      alert(error.message);

      b.disabled = false;

      b.innerHTML = 'Publish my campus website';

    }

  },

};



function doPublish() {

  AkademeeOnboarding.publish();

}



document.addEventListener('DOMContentLoaded', () => {

  AkademeeOnboarding.init();

});


