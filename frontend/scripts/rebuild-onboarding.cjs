const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'features', 'onboarding', 'pages', 'OnboardingPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// ==========================================
// STEP 1: Replace STEPS with ALL_STEPS + TEMPLATE_VISIBLE_STEPS
// ==========================================
const oldStepsConst = `const STEPS = [
  { num: 1, key: "identity" },
  { num: 2, key: "content" },
  { num: 3, key: "template" },
  { num: 4, key: "review" },
  { num: 5, key: "publish" },
];`;

const newStepsConst = `const ALL_STEPS = [
  { num: 1, key: "identity" },
  { num: 2, key: "template" },
  { num: 3, key: "contact" },
  { num: 4, key: "content" },
  { num: 5, key: "academic" },
  { num: 6, key: "classes" },
  { num: 7, key: "review" },
  { num: 8, key: "publish" },
];

const TEMPLATE_VISIBLE_STEPS = {
  classic: [1, 2, 3, 4, 7, 8],
  modern: [1, 2, 3, 4, 5, 6, 7, 8],
  minimal: [1, 2, 3, 4, 7, 8],
};`;

if (content.includes(oldStepsConst)) {
  content = content.replace(oldStepsConst, newStepsConst);
  console.log('✓ Replaced STEPS with ALL_STEPS + TEMPLATE_VISIBLE_STEPS');
} else {
  console.log('✗ Could not find old STEPS constant');
}

// ==========================================
// STEP 2: Add COLOR_PRESETS after TEMPLATE_PREVIEWS if not present
// ==========================================
if (!content.includes('COLOR_PRESETS')) {
  const templatePreviewsEnd = content.indexOf('const CLASS_LEVEL_PRESETS');
  if (templatePreviewsEnd !== -1) {
    const colorPresets = `
const COLOR_PRESETS = [
  "#085041",
  "#1E40AF",
  "#7C3AED",
  "#B91C1C",
  "#B45309",
  "#0F766E",
  "#1D4ED8",
  "#047857",
  "#9D174D",
  "#374151",
];

`;
    content = content.slice(0, templatePreviewsEnd) + colorPresets + content.slice(templatePreviewsEnd);
    console.log('✓ Added COLOR_PRESETS');
  }
}

// ==========================================
// STEP 3: Add CLASS_LEVEL_PRESETS if not present
// ==========================================
if (!content.includes('CLASS_LEVEL_PRESETS')) {
  const sectionIconPos = content.indexOf('function SectionIcon');
  if (sectionIconPos !== -1) {
    const classPresets = `
const CLASS_LEVEL_PRESETS = [
  { level: "Junior", name: "Form 1 & 2", desc: "Foundation years. Core subjects: English, French, Maths, Science, History.", age: "Ages 12–13" },
  { level: "Junior", name: "Form 3 & 4", desc: "GCE O/L preparation begins. Science and Arts streams introduced.", age: "Ages 14–15" },
  { level: "O Level", name: "Form 5", desc: "GCE Ordinary Level examination year. Intensive exam preparation.", age: "Age 16" },
  { level: "A Level", name: "Lower Sixth", desc: "Advanced Level entry. Science, Arts and Commercial streams.", age: "Age 17" },
  { level: "A Level", name: "Upper Sixth", desc: "GCE Advanced Level examination. University entrance preparation.", age: "Age 18" },
];

`;
    content = content.slice(0, sectionIconPos) + classPresets + content.slice(sectionIconPos);
    console.log('✓ Added CLASS_LEVEL_PRESETS');
  }
}

// ==========================================
// STEP 4: Update sidebar to use visibleSteps
// ==========================================
content = content.replace('{STEPS.map((s) => {', '{visibleSteps.map((s) => {');
console.log('✓ Updated sidebar to use visibleSteps');

// ==========================================
// STEP 5: Update progress bar to use totalVisibleSteps
// ==========================================
content = content.replace(
  '{t("stepLabel", "Step")} {step} {t("of", "of")} 5',
  '{t("stepLabel", "Step")} {step} {t("of", "of")} {totalVisibleSteps}'
);

content = content.replace(
  '<span>{Math.round((step / 5) * 100)}%</span>',
  '<span>{totalVisibleSteps > 0 ? Math.round((visibleSteps.findIndex(s => s.num === step) + 1) / totalVisibleSteps * 100) : 0}%</span>'
);

content = content.replace(
  `style={{ width: \`\${(step / 5) * 100}%\`, backgroundColor: pc }}`,
  `style={{ width: \`\${totalVisibleSteps > 0 ? Math.round((visibleSteps.findIndex(s => s.num === step) + 1) / totalVisibleSteps * 100) : 0}%\`, backgroundColor: pc }}`
);

console.log('✓ Updated progress bar to use dynamic steps');

// ==========================================
// STEP 6: Update skip button
// ==========================================
content = content.replace(
  '{step < 4\n                ? `${t("skipForNow", "Skip for now")} →`\n                : t("skipForNow", "Skip for now")}',
  '{step < totalVisibleSteps\n                ? `${t("skipForNow", "Skip for now")} →`\n                : t("skipForNow", "Skip for now")}'
);
console.log('✓ Updated skip button');

// ==========================================
// STEP 7: Add dynamic visibleSteps computation and template clamping after data state
// ==========================================
const afterDataState = 'aboutPhotos: [],\n  });\n\n  useEffect(() => {\n    loadData();\n  }, []);';

const dynamicStepsCode = `aboutPhotos: [],
  });

  // Compute visible steps based on selected template
  const visibleSteps = ALL_STEPS.filter(s =>
    (TEMPLATE_VISIBLE_STEPS[data.templateCode] || TEMPLATE_VISIBLE_STEPS.modern).includes(s.num)
  );
  const totalVisibleSteps = visibleSteps.length;

  // Clamp step when template changes
  useEffect(() => {
    setStep((s) => {
      const allowed = TEMPLATE_VISIBLE_STEPS[data.templateCode] || TEMPLATE_VISIBLE_STEPS.modern;
      if (!allowed.includes(s)) {
        const valid = allowed.filter(n => n <= s);
        return valid.length > 0 ? valid[valid.length - 1] : allowed[0];
      }
      return s;
    });
  }, [data.templateCode]);

  useEffect(() => {
    loadData();
  }, []);`;

if (content.includes(afterDataState)) {
  content = content.replace(afterDataState, dynamicStepsCode);
  console.log('✓ Added dynamic step computation and template clamping');
} else {
  console.log('✗ Could not find data state hook');
}

// ==========================================
// STEP 8: Add visibleSteps title map for sidebar
// ==========================================
content = content.replace(
  `{STEPS.map((s) => {`,
  `{visibleSteps.map((s) => {`
);
// Already replaced above

// ==========================================
// STEP 9: Add schoolName to state and loadData
// ==========================================
// Add schoolName to data state initialization
if (content.includes('const [data, setData] = useState({\n    primaryColor:')) {
  // Already has schoolName in the committed version - check
  if (!content.includes('schoolName:')) {
    content = content.replace(
      'const [data, setData] = useState({',
      `const [data, setData] = useState({
    schoolName: "",`
    );
    console.log('✓ Added schoolName to data state');
  }
}

// ==========================================
// STEP 10: Update step rendering sections
// ==========================================

// Step 2 was "Content" - now it should be "Template"
const oldStep2 = `{/* ── STEP 2 — Content (Tagline + Description + Hero) ── */}`;
const newStep2 = `{/* ── STEP 2 — Template ── */}`;
if (content.includes(oldStep2)) {
  // We need to swap: old step 3 (template) becomes step 2, old step 2 (content) becomes step 4
  // Get the boundaries
  const step2Start = content.indexOf(oldStep2);
  const step3Start = content.indexOf('{/* ── STEP 3 — Template ── */}');
  const step4Start = content.indexOf('{/* ── STEP 4 — Review & Finish ── */}');
  
  if (step2Start !== -1 && step3Start !== -1 && step4Start !== -1) {
    // Extract sections
    const contentSection = content.slice(step2Start, step3Start);
    const templateSection = content.slice(step3Start, step4Start);
    
    // Create new step 2 (template)
    const newTemplateSection = templateSection
      .replace('{/* ── STEP 3 — Template ── */}\n          {step === 3', '{/* ── STEP 2 — Template ── */}\n          {step === 2');
    
    // Create new step 3 (contact) - new section to be added
    const contactSection = `
          {/* ── STEP 3 — Contact info ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
                <p
                  className="text-[11px] font-semibold tracking-wide uppercase mb-1.5"
                  style={{ color: pc }}
                >
                  {t("steps.contact.title", "Contact info")}
                </p>
                <h1 className="font-display text-[26px] font-medium text-surface-800 dark:text-surface-100 mb-1.5">
                  {t("contact.heading", "How can people reach you?")}
                </h1>
                <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
                  Your contact details will appear on your campus website.
                </p>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Email address</label>
                  <input name="email" type="email" value={data.email} onChange={handleChange}
                    placeholder="info@yourschool.cm"
                    className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors" />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Phone number</label>
                  <input name="phone" type="tel" value={data.phone} onChange={handleChange}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors" />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Street address</label>
                  <textarea name="address" rows={2} value={data.address} onChange={handleChange}
                    placeholder="123 Education Avenue"
                    className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">City</label>
                    <input name="city" type="text" value={data.city} onChange={handleChange}
                      placeholder="Douala"
                      className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Region</label>
                    <input name="region" type="text" value={data.region} onChange={handleChange}
                      placeholder="Littoral"
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

`;
    
    // Create new step 4 (content) from the old content section
    const newContentSection = contentSection
      .replace('{/* ── STEP 2 — Content (Tagline + Description + Hero) ── */}\n          {step === 2', '{/* ── STEP 4 — Content (tagline, description, hero, media) ── */}\n          {step === 4');
    
    // Rebuild: before step 2 + new template section + contact section + new content section + after step 4
    content = content.slice(0, step2Start) + newTemplateSection + contactSection + newContentSection + content.slice(step4Start);
    console.log('✓ Reordered steps: 2=Template, 3=Contact, 4=Content');
  } else {
    console.log('✗ Could not find step boundaries');
  }
}

// ==========================================
// STEP 11: Update nextStep/prevStep/skip
// ==========================================
const oldNav = `  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const skip = () => (step < 5 ? nextStep() : navigate("/dashboard"));`;

const newNav = `  const nextStep = () => {
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
  };`;

if (content.includes(oldNav)) {
  content = content.replace(oldNav, newNav);
  console.log('✓ Updated navigation functions');
} else {
  console.log('✗ Could not find old navigation functions');
}

// ==========================================
// STEP 12: Update step rendering to be template-aware
// ==========================================
// Update step comment numbering
content = content.replace(
  '{/* ── STEP 3 — Template ── */}',
  '{/* ── STEP 2 — Template ── */}'
);

// Update step 4 (was Review) to step 7
content = content.replace(
  '{/* ── STEP 4 — Review & Finish ── */}\n          {step === 4',
  '{/* ── STEP 7 — Review ── */}\n          {step === 7'
);

// Update step 5 (was Publish) to step 8
content = content.replace(
  '{/* ── STEP 5 — Preview & Publish ── */}\n          {step === 5',
  '{/* ── STEP 8 — Preview & Publish ── */}\n          {step === 8'
);

console.log('✓ Updated step number comments');

// ==========================================
// STEP 13: Write result
// ==========================================
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✓ File written successfully!');
console.log('File size:', content.length, 'chars');

// ==========================================
// VERIFICATION
// ==========================================
let vContent = fs.readFileSync(filePath, 'utf8');
let issues = [];

if (!vContent.includes('ALL_STEPS')) issues.push('ALL_STEPS missing');
if (!vContent.includes('TEMPLATE_VISIBLE_STEPS')) issues.push('TEMPLATE_VISIBLE_STEPS missing');
if (!vContent.includes('visibleSteps.map')) issues.push('visibleSteps.map missing');
if (!vContent.includes('totalVisibleSteps')) issues.push('totalVisibleSteps missing');
if (!vContent.includes('allowed.indexOf(s)')) issues.push('dynamic navigation missing');
if (!vContent.includes('STEP 2 — Template')) issues.push('Step 2 Template missing');
if (!vContent.includes('STEP 3 — Contact info')) issues.push('Step 3 Contact missing');
if (!vContent.includes('STEP 4 — Content')) issues.push('Step 4 Content missing');
if (vContent.includes('STEP 5')) issues.push('Step 5 exists but may need checking');

if (issues.length > 0) {
  console.log('\n⚠ Issues found:', issues.join(', '));
} else {
  console.log('\n✓ All verifications passed!');
}
