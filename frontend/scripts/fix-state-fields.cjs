const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'features', 'onboarding', 'pages', 'OnboardingPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');
let count = 0;

// 1. Fix data state - add all missing fields
// Current state
const oldState = `  const [data, setData] = useState({
    tagline: "",
    description: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    templateCode: "modern",
    websiteStats: {},
    websiteValues: [],
  });`;

const newState = `  const [data, setData] = useState({
    schoolName: "",
    tagline: "",
    description: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    heroImageUrl2: "",
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
    aboutPhotos: [],
  });`;

if (content.includes(oldState)) {
  content = content.replace(oldState, newState);
  count++;
  console.log('✓ Fixed data state with all fields');
} else {
  console.log('✗ Could not find data state (trying different pattern)');
  // Try pattern without websiteStats/websiteValues
  const altState = `  const [data, setData] = useState({
    tagline: "",
    description: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    templateCode: "modern",`;
  if (content.includes(altState)) {
    content = content.replace(altState, `  const [data, setData] = useState({
    schoolName: "",
    tagline: "",
    description: "",
    primaryColor: "#085041",
    logoUrl: "",
    heroImageUrl: "",
    heroImageUrl2: "",
    templateCode: "modern",`);
    count++;
    console.log('✓ Added schoolName and heroImageUrl2 to data state');
  }
}

// 2. Fix loadData - add all missing fields
const oldLoad = `      setData({
        tagline: result.tagline || "",
        description: result.websiteDescription || "",
        primaryColor: result.primaryColor || "#085041",
        logoUrl: result.logoUrl || "",
        heroImageUrl: result.heroImageUrl || "",
        templateCode: result.templateCode || "modern",
        websiteStats: result.websiteStats || {},
        websiteValues: Array.isArray(result.websiteValues)
          ? result.websiteValues
          : [],

      });`;

const newLoad = `      setData({
        schoolName: result.schoolName || user?.schoolName || "",
        tagline: result.tagline || "",
        description: result.websiteDescription || "",
        primaryColor: result.primaryColor || "#085041",
        logoUrl: result.logoUrl || "",
        heroImageUrl: result.heroImageUrl || "",
        heroImageUrl2: result.heroImageUrl2 || "",
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
        aboutPhotos: result.aboutPhotos || [],
      });`;

if (content.includes(oldLoad)) {
  content = content.replace(oldLoad, newLoad);
  count++;
  console.log('✓ Fixed loadData with all fields');
} else {
  console.log('✗ Could not find loadData');
}

// 3. Fix upload state
const oldUpload = `  const [uploading, setUploading] = useState({ logo: false, hero: false });
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);`;

const newUpload = `  const [uploading, setUploading] = useState({
    logo: false,
    hero: false,
    hero2: false,
    about: false,
  });
  const [aboutCaptionInput, setAboutCaptionInput] = useState("");
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);
  const hero2InputRef = useRef(null);
  const aboutInputRef = useRef(null);`;

if (content.includes(oldUpload)) {
  content = content.replace(oldUpload, newUpload);
  count++;
  console.log('✓ Fixed upload state with hero2/about refs');
} else {
  console.log('✗ Could not find upload state');
}

// 4. Ensure templateValue section exists (for COLOR_PRESETS in step 1)
// Add schoolName field to step 1 if not already there
const step1Section = content.indexOf('{/* ── STEP 1 — Identity (Logo + Color) ── */}');
if (step1Section !== -1 && !content.includes('schoolName"', step1Section)) {
  // Find a good spot to add schoolName - before the logo section
  const logoSection = content.indexOf('Upload your logo, or', step1Section);
  if (logoSection !== -1) {
    const schoolNameField = `
                {/* School name */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">School name</label>
                  <input name="schoolName" type="text" value={data.schoolName} onChange={handleChange}
                    placeholder="e.g. Grace Bilingual Academy"
                    className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors" />
                </div>

`;
    // Insert before the logo section
    const insertBefore = content.indexOf('Upload your logo, or', step1Section);
    if (insertBefore !== -1) {
      // Find the parent div - insert after the subtitle
      const subtitleEnd = content.lastIndexOf('</p>', insertBefore);
      if (subtitleEnd !== -1) {
        content = content.slice(0, subtitleEnd + 4) + schoolNameField + content.slice(subtitleEnd + 4);
        count++;
        console.log('✓ Added school name field to step 1');
      }
    }
  }
}

// 5. Add email, phone, address, city, region fields to step 3 (Contact)
const step3Section = content.indexOf('{/* ── STEP 3 — Contact info ── */}');
if (step3Section !== -1) {
  // Check if step 3 has the fields
  const afterHeader = content.indexOf('will appear on your campus website.', step3Section);
  if (afterHeader !== -1 && !content.includes('name="email"', step3Section)) {
    const contactFields = `
                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Email address</label>
                  <input name="email" type="email" value={data.email} onChange={handleChange}
                    placeholder="info@yourschool.cm"
                    className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors" />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Phone number</label>
                  <input name="phone" type="tel" value={data.phone} onChange={handleChange}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors" />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Street address</label>
                  <textarea name="address" rows={2} value={data.address} onChange={handleChange}
                    placeholder="123 Education Avenue"
                    className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">City</label>
                    <input name="city" type="text" value={data.city} onChange={handleChange}
                      placeholder="Douala"
                      className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">Region</label>
                    <input name="region" type="text" value={data.region} onChange={handleChange}
                      placeholder="Littoral"
                      className="w-full h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors" />
                  </div>
                </div>`;

    // Insert after the subtitle
    const subtitleEnd2 = content.indexOf('</p>', afterHeader) + 4;
    content = content.slice(0, subtitleEnd2) + '\n' + contactFields + content.slice(subtitleEnd2);
    count++;
    console.log('✓ Added contact fields to step 3');
  } else if (content.includes('name="email"', step3Section)) {
    console.log('! Contact fields already in step 3');
  }
}

// 6. Add heroImageUrl2 to step 4 (Content) - already has from build script
// Check and add hero2 section
const step4Section = content.indexOf('{/* ── STEP 4 — Content');
if (step4Section !== -1 && !content.includes('heroImageUrl2', step4Section)) {
  console.log('! heroImageUrl2 missing from step 4');
}

// 7. Check if step 1 has schoolName field
if (content.includes('name="schoolName"')) {
  console.log('✓ School name input in step 1');
} else {
  console.log('✗ School name input missing from step 1');
}

// Write
fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n✓ Complete! Made ${count} changes.`);

// Verify
const check = fs.readFileSync(filePath, 'utf8');
const items = [
  ['schoolName: ""', 'schoolName in state'],
  ['heroImageUrl2: ""', 'heroImageUrl2 in state'],
  ['email: ""', 'email in state'],
  ['phone: ""', 'phone in state'],
  ['aboutPhotos: []', 'aboutPhotos in state'],
  ['classesConfig: []', 'classesConfig in state'],
  ['handleHero2Upload', 'handleHero2Upload function'],
  ['name="schoolName"', 'schoolName input field'],
];
items.forEach(([pattern, name]) => {
  console.log(check.includes(pattern) ? `✓ ${name}` : `✗ ${name}`);
});
