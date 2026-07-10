const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'features', 'onboarding', 'pages', 'OnboardingPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// === 1. Fix nextStep, prevStep, skip functions ===
const oldNav = `  const nextStep = () => setStep((s) => Math.min(s + 1, 8));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const skip = () => (step < 8 ? nextStep() : navigate("/dashboard"));`;

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
  changes++;
  console.log('✓ Fixed nextStep/prevStep/skip functions');
} else {
  console.log('✗ Could not find nextStep function');
}

// === 2. Swap step 2 (contact) and step 6 (template) ===
// Find step 2 section (contact)
const step2StartMarker = '{/* ── STEP 2 — Contact info (Email, Phone, Address, City, Region) ── */}';
const step3StartMarker = '{/* ── STEP 3 — Contact info ── */}';
const step4StartMarker = '{/* ── STEP 4 — Content';
const step6StartMarker = '{/* ── STEP 6 — Template ── */}';
const step7StartMarker = '{/* ── STEP 7 — Review ── */}';

// We need to find the boundaries. Let me check what markers exist.
// From grep: Step 1 (identity), Step 2 (contact), Step 4 (content), Step 4 (academic), Step 5 (classes), Step 6 (template), Step 7 (review), Step 8 (publish)
// Step 3 doesn't exist anymore because the old script changed it
// Step 4 appears twice: once for content and once for academic

// Let me find exact indices
const step2Idx = content.indexOf(step2StartMarker);
const step4ContentIdx = content.indexOf(step4StartMarker);
const step6Idx = content.indexOf(step6StartMarker);
const step7Idx = content.indexOf(step7StartMarker);

console.log('Step 2 at:', step2Idx);
console.log('Step 4 (content) at:', step4ContentIdx);
console.log('Step 6 at:', step6Idx);
console.log('Step 7 at:', step7Idx);

if (step2Idx !== -1 && step4ContentIdx !== -1 && step6Idx !== -1 && step7Idx !== -1) {
  // Extract the content of each section
  const step2Section = content.slice(step2Idx, step4ContentIdx);
  const step6Section = content.slice(step6Idx, step7Idx);
  
  console.log('Step2 section length:', step2Section.length);
  console.log('Step6 section length:', step6Section.length);
  
  // Create new step 2 (template) from step 6 content
  const newStep2 = step6Section
    .replace('{/* ── STEP 6 — Template ── */}\n          {step === 6', '{/* ── STEP 2 — Template ── */}\n          {step === 2');
  
  // Create new step 3 (contact) from step 2 content  
  const newStep3 = step2Section
    .replace('{/* ── STEP 2 — Contact info (Email, Phone, Address, City, Region) ── */}\n          {step === 2', '{/* ── STEP 3 — Contact info ── */}\n          {step === 3');
  
  // Rebuild the file: everything before step 2 + new step 2 + everything between step 2 and step 6 + new step 3 + everything after step 6
  content = content.slice(0, step2Idx) + newStep2 + content.slice(step4ContentIdx, step6Idx) + newStep3 + content.slice(step7Idx);
  changes++;
  console.log('✓ Swapped step 2 (now Template) and step 3 (now Contact)');
} else {
  console.log('✗ Could not find step boundaries for swapping');
}

// === 3. Fix step 4 (content) comment ===
const oldStep4Content = '{/* ── STEP 4 — Content (tagline, description, hero, media) ── */}';
if (content.includes(oldStep4Content)) {
  // Already correct from previous script
  console.log('✓ Step 4 content already labeled');
}

// === 4. Make academic step conditional for Modern only ===
// Find the academic section
const academicMarker = '{/* ── STEP 4 — Academic info (Educational systems, Exam, Ranking, Year founded) ── */}';
if (content.includes(academicMarker)) {
  content = content.replace(
    academicMarker + '\n          {step === 4',
    '{/* ── STEP 5 — Academic info (Modern only) ── */}\n          {step === 5 && data.templateCode === \'modern\''
  );
  changes++;
  console.log('✓ Made academic step conditional for Modern only');
} else {
  // Maybe it was already renamed?
  const altAcademic = '{/* ── STEP 5 — Academic';
  if (content.includes(altAcademic)) {
    console.log('! Academic step already renamed');
  } else {
    console.log('✗ Could not find academic step');
  }
}

// === 5. Make classes step conditional for Modern only ===
const classesMarker = '{/* ── STEP 5 — Classes configuration ── */}';
if (content.includes(classesMarker)) {
  content = content.replace(
    classesMarker + '\n          {step === 5',
    '{/* ── STEP 6 — Classes configuration (Modern only) ── */}\n          {step === 6 && data.templateCode === \'modern\''
  );
  changes++;
  console.log('✓ Made classes step conditional for Modern only');
} else {
  console.log('✗ Could not find classes step');
}

// === 6. Fix the Hero2 and About photos sections (already wrapped from first script) ===
if (content.includes("data.templateCode === 'modern' && (\n                <div className=\"mb-6\">\n                  <label className=\"block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5\">\n                    {t(\"content.hero2Label\"")) {
  console.log('✓ Hero2 already wrapped for Modern only');
} else {
  console.log('! Hero2 wrapping may need attention');
}

if (content.includes("data.templateCode === 'modern' && (\n                <div>\n                  <label className=\"block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5\">\n                    {t(\"content.aboutPhotosLabel\"")) {
  console.log('✓ About photos already wrapped for Modern only');
} else {
  console.log('! About photos wrapping may need attention');
}

// Write result
fs.writeFileSync(filePath, content, 'utf8');
console.log('\nDone! Made', changes, 'changes');
console.log('File size:', content.length);
