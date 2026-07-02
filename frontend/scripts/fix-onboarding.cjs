const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'features', 'onboarding', 'pages', 'OnboardingPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// === CHANGE 1: Sidebar STEPS → visibleSteps ===
content = content.replace('{STEPS.map((s) => {', '{visibleSteps.map((s) => {');

// === CHANGE 2: Progress bar "Step X of 8" → dynamic ===
content = content.replace(
  '{t("stepLabel", "Step")} {step} {t("of", "of")} 8',
  '{t("stepLabel", "Step")} {step} {t("of", "of")} {totalVisibleSteps}'
);

// === CHANGE 3: Progress percentage (step / 8) → dynamic ===
content = content.replace(
  '<span>{Math.round((step / 8) * 100)}%</span>',
  '<span>{totalVisibleSteps > 0 ? Math.round((visibleSteps.findIndex(s => s.num === step) + 1) / totalVisibleSteps * 100) : 0}%</span>'
);

// === CHANGE 4: Progress bar width ===
content = content.replace(
  `style={{ width: \`\${(step / 8) * 100}%\`, backgroundColor: pc }}`,
  `style={{ width: \`\${totalVisibleSteps > 0 ? Math.round((visibleSteps.findIndex(s => s.num === step) + 1) / totalVisibleSteps * 100) : 0}%\`, backgroundColor: pc }}`
);

// === CHANGE 5: Skip button step < 7 → step < totalVisibleSteps ===
content = content.replace(
  '{step < 7\n                ? `${t("skipForNow", "Skip for now")} →`\n                : t("skipForNow", "Skip for now")}',
  '{step < totalVisibleSteps\n                ? `${t("skipForNow", "Skip for now")} →`\n                : t("skipForNow", "Skip for now")}'
);

// === CHANGE 6: nextStep, prevStep, skip functions ===
content = content.replace(
  `  const nextStep = () => setStep((s) => Math.min(s + 1, 8));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const skip = () => (step < 8 ? nextStep() : navigate("/dashboard"));`,
  `  const nextStep = () => {
    setStep((s) => {
      const allowed = TEMPLATE_VISIBLE_STEPS[data.templateCode] || TEMPLATE_VISIBLE_STEPS.modern;
      const currentIdx = allowed.indexOf(s);
      return currentIdx < allowed.length - 1 ? allowed[currentIdx + 1] : s;
    });
  };
  const prevStep = () => {
    setStep((s) => {
      const allowed = TEMPLATE_VISIBLE_STEPS[data.templateCode] || TEMPLATE_VISIBLE_STEPS.modern;
      const currentIdx = allowed.indexOf(s);
      return currentIdx > 0 ? allowed[currentIdx - 1] : s;
    });
  };
  const skip = () => {
    const allowed = TEMPLATE_VISIBLE_STEPS[data.templateCode] || TEMPLATE_VISIBLE_STEPS.modern;
    const last = allowed[allowed.length - 1];
    if (step < last) {
      setStep((s) => {
        const idx = allowed.indexOf(s);
        return idx < allowed.length - 1 ? allowed[idx + 1] : s;
      });
    } else {
      navigate("/dashboard");
    }
  };`
);

// === CHANGE 7: Move template from step 6 to step 2 ===
// Strategy: swap the content of step 2 and step 6 sections
// Step 2 is: ── STEP 2 — Contact info ...
// Step 6 is: ── STEP 6 — Template ...
// We need to swap their step numbers so step 2 = template and step 3 = contact

// Find step 2 (contact) section
const step2Start = content.indexOf('{/* ── STEP 2 — Contact info');
const step2End = content.indexOf('{/* ── STEP 3 — Content');
if (step2Start === -1 || step2End === -1) {
  console.error('Could not find step markers');
  process.exit(1);
}
const step2Content = content.slice(step2Start, step2End);

// Find step 6 (template) section
const step6Start = content.indexOf('{/* ── STEP 6 — Template');
const step6End = content.indexOf('{/* ── STEP 7 — Review');
if (step6Start === -1 || step6End === -1) {
  console.error('Could not find step 6 markers');
  process.exit(1);
}
const step6Content = content.slice(step6Start, step6End);

// Swap: put template content at step 2, put contact content at step 3
const newStep2 = step6Content
  .replace('{/* ── STEP 6 — Template ── */}\n          {step === 6', '{/* ── STEP 2 — Template ── */}\n          {step === 2');

const newStep3 = step2Content
  .replace('{/* ── STEP 2 — Contact info (Email, Phone, Address, City, Region) ── */}\n          {step === 2', '{/* ── STEP 3 — Contact info ── */}\n          {step === 3');

// Now put it all together
content = content.slice(0, step2Start) + newStep2 + content.slice(step2End, step6Start) + newStep3 + content.slice(step6End);

// === CHANGE 8: Make step 4 (content) template-aware ===
// Currently step 3 is Content with tagline + description + hero + hero2 + about photos
// We need to show different fields based on template
// First, let's update the comment for step 4

// Step 4 content is currently step 4 = Academic (but we just swapped, so now step 4 is...)
// Actually after the swap: step 2 = template, step 3 = contact, step 4 = content (was step 3)
// Let me update step content section comment
content = content.replace(
  '{/* ── STEP 3 — Contact info ── */}',
  '{/* ── STEP 3 — Contact info ── */}'
);

// The content section (now step 4, was originally step 3) needs template-aware fields
// For Classic: tagline, description (no hero2, no about photos, but with year founded)
// For Modern: description, hero, hero2, about photos, values
// For Minimal: tagline, description, hero, values

// I'll wrap the template-specific fields with conditional rendering
// Replace hero2 section
content = content.replace(
  `                {/* Secondary hero image (hero2) */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("content.hero2Label", "Secondary hero image")}
                  </label>
                  <p className="text-[11px] text-surface-400 mb-3">
                    {t("content.hero2Specs", "Used as a background layer behind the main hero (Modern template). Optional.")}
                  </p>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="onb-hero2-upload"
                      className="flex-shrink-0 w-28 aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                    >
                      {data.heroImageUrl2 ? (
                        <img
                          src={data.heroImageUrl2}
                          alt="Hero 2"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 p-2">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            className="w-5 h-5 text-surface-400"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[10px] text-surface-400 text-center">
                            {uploading.hero2
                              ? t("hero.uploading", "Uploading...")
                              : t("content.hero2Cta", "Add image")}
                          </span>
                        </div>
                      )}
                      <input
                        ref={hero2InputRef}
                        id="onb-hero2-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleHero2Upload}
                        className="hidden"
                      />
                    </label>
                    {data.heroImageUrl2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({ ...prev, heroImageUrl2: "" }))
                        }
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        {t("Remove")}
                      </button>
                    )}
                  </div>
                </div>`,
  `                {/* Secondary hero image (hero2) - Modern template only */}
                {data.templateCode === 'modern' && (
                <div className="mb-6">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("content.hero2Label", "Secondary hero image")}
                  </label>
                  <p className="text-[11px] text-surface-400 mb-3">
                    {t("content.hero2Specs", "Used as a background layer behind the main hero (Modern template). Optional.")}
                  </p>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="onb-hero2-upload"
                      className="flex-shrink-0 w-28 aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                    >
                      {data.heroImageUrl2 ? (
                        <img
                          src={data.heroImageUrl2}
                          alt="Hero 2"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 p-2">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            className="w-5 h-5 text-surface-400"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[10px] text-surface-400 text-center">
                            {uploading.hero2
                              ? t("hero.uploading", "Uploading...")
                              : t("content.hero2Cta", "Add image")}
                          </span>
                        </div>
                      )}
                      <input
                        ref={hero2InputRef}
                        id="onb-hero2-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleHero2Upload}
                        className="hidden"
                      />
                    </label>
                    {data.heroImageUrl2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setData((prev) => ({ ...prev, heroImageUrl2: "" }))
                        }
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        {t("Remove")}
                      </button>
                    )}
                  </div>
                </div>
                )}`
);

// Wrap about photos section for Modern only
content = content.replace(
  `                {/* About photos */}
                <div>
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("content.aboutPhotosLabel", "About us photos")}
                  </label>
                  <p className="text-[11px] text-surface-400 mb-3">
                    {t("content.aboutPhotosSpecs", "Photos for the About section (max 2). Optional.")}
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <label
                      htmlFor="onb-about-upload"
                      className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                    >
                      {uploading.about ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-surface-300 border-t-surface-600 animate-spin" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            className="w-5 h-5 text-surface-400"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[9px] text-surface-400">Add</span>
                        </div>
                      )}
                      <input
                        ref={aboutInputRef}
                        id="onb-about-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAboutPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={aboutCaptionInput}
                      onChange={(e) => setAboutCaptionInput(e.target.value)}
                      placeholder={t("content.aboutCaption", "Optional caption...")}
                      className="flex-1 h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors"
                    />
                  </div>
                  {data.aboutPhotos && data.aboutPhotos.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {data.aboutPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={photo.url}
                            alt={photo.caption || "About"}
                            className="w-20 h-20 object-cover rounded-lg border border-surface-200 dark:border-surface-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeAboutPhoto(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                          >
                            ×
                          </button>
                          {photo.caption && (
                            <p className="text-[10px] text-surface-400 mt-0.5 truncate max-w-[80px]">
                              {photo.caption}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>`,
  `                {/* About photos - Modern template only */}
                {data.templateCode === 'modern' && (
                <div>
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    {t("content.aboutPhotosLabel", "About us photos")}
                  </label>
                  <p className="text-[11px] text-surface-400 mb-3">
                    {t("content.aboutPhotosSpecs", "Photos for the About section (max 2). Optional.")}
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <label
                      htmlFor="onb-about-upload"
                      className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors"
                    >
                      {uploading.about ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-surface-300 border-t-surface-600 animate-spin" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            className="w-5 h-5 text-surface-400"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[9px] text-surface-400">Add</span>
                        </div>
                      )}
                      <input
                        ref={aboutInputRef}
                        id="onb-about-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAboutPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={aboutCaptionInput}
                      onChange={(e) => setAboutCaptionInput(e.target.value)}
                      placeholder={t("content.aboutCaption", "Optional caption...")}
                      className="flex-1 h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors"
                    />
                  </div>
                  {data.aboutPhotos && data.aboutPhotos.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {data.aboutPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={photo.url}
                            alt={photo.caption || "About"}
                            className="w-20 h-20 object-cover rounded-lg border border-surface-200 dark:border-surface-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeAboutPhoto(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                          >
                            ×
                          </button>
                          {photo.caption && (
                            <p className="text-[10px] text-surface-400 mt-0.5 truncate max-w-[80px]">
                              {photo.caption}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}`
);

// === CHANGE 9: Wrap academic step (step 5) for Modern only ===
content = content.replace(
  `          {/* ── STEP 4 — Academic info (Educational systems, Exam, Ranking, Year founded) ── */}\n          {step === 4 && (`,
  `          {/* ── STEP 5 — Academic info (Modern template only) ── */}\n          {step === 5 && data.templateCode === 'modern' && (`
);

// === CHANGE 10: Wrap classes step (step 6) for Modern only ===
content = content.replace(
  `          {/* ── STEP 5 — Classes configuration ── */}\n          {step === 5 && (`,
  `          {/* ── STEP 6 — Classes configuration (Modern template only) ── */}\n          {step === 6 && data.templateCode === 'modern' && (`
);

// === CHANGE 11: Update step comment for content (now step 4) ===
content = content.replace(
  `          {/* ── STEP 3 — Contact info ── */}\n          {step === 3 && (`,
  `          {/* ── STEP 3 — Contact info ── */}\n          {step === 3 && (`
);
// That's already correct. Let me update the old step 3 (now step 4) section
content = content.replace(
  `          {/* ── STEP 3 — Content (Tagline + Description + Hero + Hero2 + About Photos) ── */}`,
  `          {/* ── STEP 4 — Content (tagline, description, hero, media) ── */}`
);
content = content.replace(
  `{step === 3 && (\n            <div className="space-y-6">\n              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">\n                <p\n                  className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"\n                  style={{ color: pc }}\n                >\n                  {t("steps.hero.title", "Content")}\n                </p>\n                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">\n                  {t("content.heading", "Present your school")}\n                </h1>\n                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">\n                  {t(\n                    "content.subtitle",\n                    "Tell visitors about your school and add visual media.",\n                  )}\n                </p>`,
  `{step === 4 && (\n            <div className="space-y-6">\n              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">\n                <p\n                  className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"\n                  style={{ color: pc }}\n                >\n                  {t("steps.hero.title", "Content")}\n                </p>\n                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">\n                  {t("content.heading", "Present your school")}\n                </h1>\n                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">\n                  {t(\n                    "content.subtitle",\n                    "Tell visitors about your school and add visual media.",\n                  )}\n                </p>`
);

fs.writeFileSync(filePath, content, 'utf8');

// Verify
let check = fs.readFileSync(filePath, 'utf8');
let issues = [];

if (!check.includes('visibleSteps.map((s)')) issues.push('visibleSteps.map not found');
if (!check.includes('totalVisibleSteps')) issues.push('totalVisibleSteps not found');
if (!check.includes('allowed.indexOf')) issues.push('nextStep dynamic not found');
if (!check.includes('step < totalVisibleSteps')) issues.push('skip dynamic not found');

const step2Template = check.indexOf('{/* ── STEP 2 — Template');
const step3Contact = check.indexOf('{/* ── STEP 3 — Contact info');
const step4Content = check.indexOf('{/* ── STEP 4 — Content');
const step5Academic = check.indexOf('{/* ── STEP 5 — Academic');
const step6Classes = check.indexOf('{/* ── STEP 6 — Classes');
const step7Review = check.indexOf('{/* ── STEP 7 — Review');

if (step2Template === -1) issues.push('Step 2 Template not found');
if (step3Contact === -1) issues.push('Step 3 Contact not found');
if (step4Content === -1) issues.push('Step 4 Content not found');
if (step5Academic !== -1 && step5Academic > step7Review) issues.push('Step 5 Academic after Step 7 Review');

console.log('File size:', check.length);
if (issues.length > 0) {
  console.log('ISSUES:', issues.join(', '));
} else {
  console.log('All changes verified successfully!');
}
