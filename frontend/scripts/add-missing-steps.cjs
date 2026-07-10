const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'features', 'onboarding', 'pages', 'OnboardingPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');
let count = 0;

// ===== 1. EXPAND DATA STATE with all missing fields =====
const oldState = `  const [data, setData] = useState({
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    tagline: "",
    description: "",
    websiteDescription: "",
    templateCode: "modern",`;

const newState = `  const [data, setData] = useState({
    schoolName: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    heroImageUrl2: "",
    tagline: "",
    description: "",
    websiteDescription: "",
    templateCode: "modern",
    websiteStats: {},
    websiteValues: [],
    // Contact info
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    // Academic
    educationalSystems: [],
    examType: "",
    examPassRate: "",
    ranking: "",
    rankingCity: "",
    yearFounded: "",
    // Classes
    classesConfig: [],
    // About photos
    aboutPhotos: [],`;

if (content.includes(oldState)) {
  content = content.replace(oldState, newState);
  count++;
  console.log('✓ Expanded data state with all fields');
} else {
  console.log('✗ Could not find data state');
}

// ===== 2. UPDATE upload state =====
const oldUpload = `  const [uploading, setUploading] = useState({
    logo: false,
    hero: false,
  });`;

const newUpload = `  const [uploading, setUploading] = useState({
    logo: false,
    hero: false,
    hero2: false,
    about: false,
  });
  const [aboutCaptionInput, setAboutCaptionInput] = useState("");
  const hero2InputRef = useRef(null);
  const aboutInputRef = useRef(null);`;

if (content.includes(oldUpload)) {
  content = content.replace(oldUpload, newUpload);
  count++;
  console.log('✓ Updated upload state with hero2/about refs');
}

// ===== 3. EXPAND loadData with all fields =====
const oldLoad = `      setData({
        primaryColor: result.primaryColor || "#085041",
        logoUrl: result.logoUrl || "",
        heroImageUrl: result.heroImageUrl || "",
        tagline: result.tagline || "",
        description: result.websiteDescription || "",
        templateCode: result.templateCode || "modern",`;

const newLoad = `      setData({
        schoolName: result.schoolName || user?.schoolName || "",
        primaryColor: result.primaryColor || "#085041",
        logoUrl: result.logoUrl || "",
        heroImageUrl: result.heroImageUrl || "",
        heroImageUrl2: result.heroImageUrl2 || "",
        tagline: result.tagline || "",
        description: result.websiteDescription || "",
        templateCode: result.templateCode || "modern",
        websiteStats: result.websiteStats || {},
        websiteValues: Array.isArray(result.websiteValues)
          ? result.websiteValues
          : [],
        // Contact info
        email: result.email || "",
        phone: result.phone || "",
        address: result.address || "",
        city: result.city || "",
        region: result.region || "",
        // Academic
        educationalSystems: result.educationalSystems || [],
        examType: result.examType || "",
        examPassRate: result.examPassRate || "",
        ranking: result.ranking || "",
        rankingCity: result.rankingCity || "",
        yearFounded: result.yearFounded || "",
        // Classes
        classesConfig: result.classesConfig || [],
        // About photos
        aboutPhotos: result.aboutPhotos || [],`;

if (content.includes(oldLoad)) {
  content = content.replace(oldLoad, newLoad);
  count++;
  console.log('✓ Expanded loadData with all fields');
}

// ===== 4. ADD handler functions after handleHeroUpload =====
const oldAfterHero = `  // Step 4: save and go to preview step
  const handleSave = async () => {`;

const newHandlers = `  const handleHero2Upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, hero2: true }));
    setError("");
    try {
      const result = await uploadMedia(file, "hero");
      if (result?.url) {
        setData((prev) => ({ ...prev, heroImageUrl2: result.url }));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error uploading secondary hero image");
    } finally {
      setUploading((prev) => ({ ...prev, hero2: false }));
    }
  };

  const handleAboutPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, about: true }));
    setError("");
    try {
      const result = await uploadMedia(file, "gallery");
      if (result?.url) {
        setData((prev) => ({
          ...prev,
          aboutPhotos: [...(prev.aboutPhotos || []), { url: result.url, caption: aboutCaptionInput || "" }],
        }));
        setAboutCaptionInput("");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error uploading about photo");
    } finally {
      setUploading((prev) => ({ ...prev, about: false }));
    }
  };

  const removeAboutPhoto = (idx) => {
    setData((prev) => ({
      ...prev,
      aboutPhotos: prev.aboutPhotos.filter((_, i) => i !== idx),
    }));
  };

  const handleEducationalSystemToggle = (system) => {
    setData((prev) => {
      const exists = prev.educationalSystems.includes(system);
      return {
        ...prev,
        educationalSystems: exists
          ? prev.educationalSystems.filter((s) => s !== system)
          : [...prev.educationalSystems, system],
      };
    });
  };

  const addClassConfig = () => {
    setData((prev) => ({
      ...prev,
      classesConfig: [
        ...prev.classesConfig,
        { level: "", name: "", desc: "", age: "" },
      ],
    }));
  };

  const updateClassConfig = (idx, field, value) => {
    setData((prev) => {
      const updated = [...prev.classesConfig];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, classesConfig: updated };
    });
  };

  const removeClassConfig = (idx) => {
    setData((prev) => ({
      ...prev,
      classesConfig: prev.classesConfig.filter((_, i) => i !== idx),
    }));
  };

  const useClassPresets = () => {
    setData((prev) => ({ ...prev, classesConfig: CLASS_LEVEL_PRESETS }));
  };

  // Step 4: save and go to preview step
  const handleSave = async () => {`;

if (content.includes(oldAfterHero)) {
  content = content.replace(oldAfterHero, newHandlers);
  count++;
  console.log('✓ Added handler functions');
} else {
  console.log('✗ Could not find insertion point after hero upload');
}

// ===== 5. UPDATE handleSave payload =====
const oldSavePayload = `    const payload = {
      tagline: data.tagline,
      websiteDescription: data.description,
      primaryColor,
      templateCode: data.templateCode,`;

const newSavePayload = `    const payload = {
      schoolName: data.schoolName,
      tagline: data.tagline,
      websiteDescription: data.description,
      primaryColor,
      templateCode: data.templateCode,
      websiteStats: data.websiteStats,
      websiteValues: data.websiteValues,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      region: data.region,
      educationalSystems: data.educationalSystems,
      examType: data.examType,
      examPassRate: data.examPassRate,
      ranking: data.ranking,
      rankingCity: data.rankingCity,
      yearFounded: data.yearFounded,
      classesConfig: data.classesConfig,
      aboutPhotos: data.aboutPhotos,
      heroImageUrl2: data.heroImageUrl2,`;

if (content.includes(oldSavePayload)) {
  content = content.replace(oldSavePayload, newSavePayload);
  count++;
  console.log('✓ Updated handleSave payload');
}

// ===== 6. FIND handlePublishAndGoLive payload =====
// Check if it has the full payload already
if (content.includes('handlePublishAndGoLive')) {
  const pubPayloadStart = content.indexOf('const payload = {', content.indexOf('handlePublishAndGoLive'));
  const pubPayloadEnd = content.indexOf('};', pubPayloadStart);
  if (pubPayloadStart !== -1) {
    const oldPubPayload = content.slice(pubPayloadStart, pubPayloadEnd + 2);
    if (!oldPubPayload.includes('schoolName:')) {
      const newPubPayload = `    const payload = {
      schoolName: data.schoolName,
      tagline: data.tagline,
      websiteDescription: data.description,
      primaryColor,
      templateCode: data.templateCode,
      websiteStats: data.websiteStats,
      websiteValues: data.websiteValues,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      region: data.region,
      educationalSystems: data.educationalSystems,
      examType: data.examType,
      examPassRate: data.examPassRate,
      ranking: data.ranking,
      rankingCity: data.rankingCity,
      yearFounded: data.yearFounded,
      classesConfig: data.classesConfig,
      aboutPhotos: data.aboutPhotos,
      heroImageUrl2: data.heroImageUrl2,`;
      content = content.replace(oldPubPayload, newPubPayload);
      count++;
      console.log('✓ Updated handlePublishAndGoLive payload');
    } else {
      console.log('! Publish payload already has full fields');
    }
  }
}

// ===== 7. ADD Academic step (step 5) for Modern template =====
const step4ContentEnd = content.indexOf('{/* ── STEP 7 — Review ── */}');
const step3ContactEnd = content.indexOf('{/* ── STEP 4 — Content');

if (step4ContentEnd !== -1 && step3ContactEnd !== -1) {
  // Find the end of step 4 content (the closing of step 4's fragment)
  // The step 4 section is between step 4 marker and step 7 marker
  // We need to insert after the step 4 closing )}
  
  // Find where step 4 ends - look for the pattern:
  // STEP 4 ... {step === 4 && (...) }
  // After the last closing div and button for step 4, before STEP 7
  
  // Find the last occurrence of ")}}" right before STEP 7
  const step4Section = content.slice(step3ContactEnd, step4ContentEnd);
  
  // Find the closing of step 4 section
  const step4Close = step4Section.lastIndexOf('          )}');
  if (step4Close !== -1) {
    const closingSection = step4Section.slice(step4Close);
    const afterClose = closingSection.indexOf('\n') + 1;
    const step4End = step3ContactEnd + step4Close + afterClose;
    
    const academicStep = `
          {/* ── STEP 5 — Academic info (Modern template only) ── */}
          {step === 5 && data.templateCode === 'modern' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <p className="text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: pc }}>
                  Academic info
                </p>
                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                  Academic credentials & achievements
                </h1>
                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                  Showcase your school's academic strengths on your website.
                </p>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-2">Educational systems</label>
                  <div className="flex flex-wrap gap-2">
                    {["Anglophone", "Francophone", "Bilingual", "International"].map((sys) => {
                      const selected = data.educationalSystems.includes(sys);
                      return (
                        <button key={sys} type="button" onClick={() => handleEducationalSystemToggle(sys)}
                          className={\`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all \${
                            selected ? "text-white border-transparent" : "text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 hover:border-primary-400"
                          }\`}
                          style={selected ? { backgroundColor: pc, borderColor: pc } : {}}>
                          {sys}{selected && <span className="ml-1.5">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Year founded</label>
                  <input name="yearFounded" type="text" value={data.yearFounded} onChange={handleChange}
                    placeholder="e.g. 1998" maxLength={4}
                    className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors max-w-[200px]" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Exam type</label>
                    <input name="examType" type="text" value={data.examType} onChange={handleChange}
                      placeholder="e.g. GCE"
                      className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Pass rate (%)</label>
                    <input name="examPassRate" type="text" value={data.examPassRate} onChange={handleChange}
                      placeholder="e.g. 94"
                      className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Ranking</label>
                    <input name="ranking" type="text" value={data.ranking} onChange={handleChange}
                      placeholder="e.g. Top 5"
                      className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">City</label>
                    <input name="rankingCity" type="text" value={data.rankingCity} onChange={handleChange}
                      placeholder="e.g. Douala"
                      className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button onClick={nextStep}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  style={{ backgroundColor: pc }}>
                  {t("continue", "Continue")}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 6 — Classes configuration (Modern template only) ── */}
          {step === 6 && data.templateCode === 'modern' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <p className="text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: pc }}>
                  Classes
                </p>
                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                  Your school's class structure
                </h1>
                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-5">
                  Define the levels, streams, and classes offered at your school.
                </p>

                {data.classesConfig.length === 0 && (
                  <button type="button" onClick={useClassPresets}
                    className="mb-5 px-4 py-2 rounded-lg text-[12px] font-medium border border-dashed border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400 hover:border-primary-400 hover:text-primary-600 transition-colors">
                    Use preset GCE structure (Form 1–Upper Sixth)
                  </button>
                )}

                {data.classesConfig.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {data.classesConfig.map((cls, idx) => (
                      <div key={idx} className="rounded-lg border border-surface-200 dark:border-surface-700 p-4 bg-surface-50 dark:bg-surface-800/50">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Class {idx + 1}</span>
                          <button type="button" onClick={() => removeClassConfig(idx)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 mb-2">
                          <input type="text" value={cls.level || ""} onChange={(e) => updateClassConfig(idx, "level", e.target.value)}
                            placeholder="Level (e.g. Junior)"
                            className="h-9 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-xs outline-none focus:border-primary-600 transition-colors" />
                          <input type="text" value={cls.name || ""} onChange={(e) => updateClassConfig(idx, "name", e.target.value)}
                            placeholder="Name (e.g. Form 1 & 2)"
                            className="h-9 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-xs outline-none focus:border-primary-600 transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <input type="text" value={cls.desc || ""} onChange={(e) => updateClassConfig(idx, "desc", e.target.value)}
                            placeholder="Description"
                            className="h-9 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-xs outline-none focus:border-primary-600 transition-colors" />
                          <input type="text" value={cls.age || ""} onChange={(e) => updateClassConfig(idx, "age", e.target.value)}
                            placeholder="Age (e.g. Ages 12–13)"
                            className="h-9 px-3 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-xs outline-none focus:border-primary-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" onClick={addClassConfig}
                  className="w-full h-11 px-4 rounded-lg border-2 border-dashed border-surface-200 dark:border-surface-600 text-surface-500 dark:text-surface-400 text-sm font-medium hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add a class / level
                </button>
              </div>

              <div className="flex gap-2.5">
                <button onClick={prevStep}
                  className="h-11 px-5 border-[1.5px] border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-medium rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t("back", "Back")}
                </button>
                <button onClick={nextStep}
                  className="flex-1 h-11 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  style={{ backgroundColor: pc }}>
                  {t("continue", "Continue")}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

`;
    
    content = content.slice(0, step4ContentEnd) + academicStep + content.slice(step4ContentEnd);
    count++;
    console.log('✓ Added Academic (step 5) and Classes (step 6) steps for Modern template');
  } else {
    console.log('✗ Could not find end of step 4');
  }
} else {
  console.log('✗ Could not find step boundaries');
}

// ===== 8. EXPAND REVIEW STEP with all fields =====
// Find the review step and add missing fields
const reviewSection = content.indexOf('{/* ── STEP 7 — Review ── */}');
if (reviewSection !== -1) {
  // Check if review already has contact/location fields
  if (!content.includes('data.email')) {
    // Replace the review content grid
    const reviewGridStart = content.indexOf('<div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">', reviewSection);
    const reviewGridEnd = content.indexOf('</div>\n                  </div>\n                </div>\n              </div>', reviewGridStart);
    
    if (reviewGridStart !== -1 && reviewGridEnd !== -1) {
      const oldReviewGrid = content.slice(reviewGridStart, reviewGridEnd);
      
      const newReviewGrid = `<div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div className="text-surface-500">Logo</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium">
                        {data.logoUrl ? "Uploaded" : "Using initials placeholder"}
                      </div>
                      <div className="text-surface-500">Cover image</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium">
                        {data.heroImageUrl ? "Uploaded" : "Not set"}
                      </div>
                      <div className="text-surface-500">Tagline</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium truncate">
                        {data.tagline || "\\u2014"}
                      </div>
                      <div className="text-surface-500">Primary colour</div>
                      <div className="flex items-center gap-2 text-surface-800 dark:text-surface-100 font-medium">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: pc }} />
                        {pc}
                      </div>
                      <div className="text-surface-500">Contact</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium text-xs">
                        {data.email || "\\u2014"} · {data.phone || "\\u2014"}
                      </div>
                      <div className="text-surface-500">Location</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium text-xs">
                        {[data.city, data.region].filter(Boolean).join(", ") || "\\u2014"}
                      </div>
                      <div className="text-surface-500">Year founded</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium">
                        {data.yearFounded || "\\u2014"}
                      </div>
                      {data.educationalSystems.length > 0 && (
                        <>
                          <div className="text-surface-500">Systems</div>
                          <div className="text-surface-800 dark:text-surface-100 font-medium text-xs">
                            {data.educationalSystems.join(", ")}
                          </div>
                        </>
                      )}
                      {(data.examType || data.examPassRate) && (
                        <>
                          <div className="text-surface-500">Exam</div>
                          <div className="text-surface-800 dark:text-surface-100 font-medium text-xs">
                            {data.examType || "\\u2014"} · {data.examPassRate ? \`\${data.examPassRate}% pass rate\` : ""}
                          </div>
                        </>
                      )}
                      {data.ranking && (
                        <>
                          <div className="text-surface-500">Ranking</div>
                          <div className="text-surface-800 dark:text-surface-100 font-medium text-xs">
                            {data.ranking}{data.rankingCity ? \` in \${data.rankingCity}\` : ""}
                          </div>
                        </>
                      )}
                      {data.classesConfig.length > 0 && (
                        <>
                          <div className="text-surface-500">Classes</div>
                          <div className="text-surface-800 dark:text-surface-100 font-medium text-xs">
                            {data.classesConfig.length} level{data.classesConfig.length > 1 ? "s" : ""} configured
                          </div>
                        </>
                      )}
                      <div className="text-surface-500">Template</div>
                      <div className="text-surface-800 dark:text-surface-100 font-medium">
                        {TEMPLATE_PREVIEWS[data.templateCode]?.name || data.templateCode}
                      </div>`;
      
      content = content.replace(oldReviewGrid, newReviewGrid);
      count++;
      console.log('✓ Expanded review step with all fields');
    } else {
      console.log('✗ Could not find review grid');
    }
  } else {
    console.log('! Review already has expanded fields');
  }
} else {
  console.log('✗ Could not find review step');
}

// ===== 9. EXPAND PREVIEW STEP (step 8) =====
const previewStep = content.indexOf('{/* ── STEP 8 — Preview & Publish ── */}');
if (previewStep !== -1) {
  // Check if preview already shows schoolName
  if (!content.includes('data.schoolName')) {
    // Find the school name display
    const schoolNameDisp = content.indexOf('{user?.schoolName', previewStep);
    if (schoolNameDisp !== -1) {
      content = content.replace('{user?.schoolName', '{data.schoolName || user?.schoolName');
      count++;
      console.log('✓ Updated preview step to show schoolName');
    }
  }
}

// ===== WRITE =====
fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n✓ Complete! Made ${count} changes. File size: ${content.length} chars`);

// Verify key elements
const checks = [
  ['schoolName in data state', content.includes('schoolName: ""')],
  ['heroImageUrl2 in state', content.includes('heroImageUrl2: ""')],
  ['handleHero2Upload', content.includes('handleHero2Upload')],
  ['addClassConfig', content.includes('addClassConfig')],
  ['handleEducationalSystemToggle', content.includes('handleEducationalSystemToggle')],
  ['aboutPhotos in state', content.includes('aboutPhotos: []')],
  ['STEP 5 — Academic', content.includes('STEP 5 — Academic')],
  ['STEP 6 — Classes', content.includes('STEP 6 — Classes')],
  ['Modern only in step 5', content.includes("templateCode === 'modern'")],
  ['Expanded payload', content.includes('schoolName: data.schoolName')],
];
checks.forEach(([name, pass]) => console.log(pass ? `✓ ${name}` : `✗ ${name}`));
