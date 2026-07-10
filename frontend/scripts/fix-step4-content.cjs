const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'features', 'onboarding', 'pages', 'OnboardingPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find step 4 section and add hero2 and about photos after the hero image section
const step4Start = content.indexOf('{/* ── STEP 4 — Content');
const step5Start = content.indexOf('{/* ── STEP 5 — Academic');

if (step4Start === -1 || step5Start === -1) {
  console.error('Could not find step boundaries');
  process.exit(1);
}

const step4Content = content.slice(step4Start, step5Start);

// Check what's already in step 4
const hasHero2 = step4Content.includes('hero2Label');
const hasAboutPhotos = step4Content.includes('aboutPhotosLabel');

if (!hasHero2 || !hasAboutPhotos) {
  // Find the end of the hero image section by finding the last Remove button for hero
  const heroRemoveIdx = step4Content.lastIndexOf('{t("Remove")}');
  if (heroRemoveIdx !== -1) {
    // Find the end of the hero section (after the Remove button's parent div closes)
    const afterHeroRemove = heroRemoveIdx + '{t("Remove")}'.length;
    const heroSectionEnd = step4Content.indexOf('</div>', afterHeroRemove);
    
    if (heroSectionEnd !== -1) {
      const insertAfter = heroSectionEnd + 6; // after </div>
      
      const mediaSections = `
                {/* Secondary hero image (hero2) - Modern template only */}
                {data.templateCode === 'modern' && (
                <div className="mb-6">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                    Secondary hero image
                  </label>
                  <p className="text-[11px] text-surface-400 mb-3">
                    Used as a background layer behind the main hero (Modern template). Optional.
                  </p>
                  <div className="flex items-center gap-4">
                    <label htmlFor="onb-hero2-upload" className="flex-shrink-0 w-28 aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors">
                      {data.heroImageUrl2 ? (
                        <img src={data.heroImageUrl2} alt="Hero 2" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 p-2">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 text-surface-400">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[10px] text-surface-400 text-center">
                            {uploading.hero2 ? "Uploading..." : "Add image"}
                          </span>
                        </div>
                      )}
                      <input ref={hero2InputRef} id="onb-hero2-upload" type="file" accept="image/*" onChange={handleHero2Upload} className="hidden" />
                    </label>
                    {data.heroImageUrl2 && (
                      <button type="button" onClick={() => setData((prev) => ({ ...prev, heroImageUrl2: "" }))}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline">Remove</button>
                    )}
                  </div>
                </div>
                )}

                {/* About photos - Modern template only */}
                {data.templateCode === 'modern' && (
                <div className="mb-6">
                  <label className="block text-xs font-medium text-surface-600 dark:text-surface-300 mb-1.5">About us photos</label>
                  <p className="text-[11px] text-surface-400 mb-3">Photos for the About section (max 2). Optional.</p>
                  <div className="flex items-center gap-3 mb-3">
                    <label htmlFor="onb-about-upload" className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-600 cursor-pointer hover:border-primary-400 transition-colors">
                      {uploading.about ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full border-2 border-surface-300 border-t-surface-600 animate-spin" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 text-surface-400">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="text-[9px] text-surface-400">Add</span>
                        </div>
                      )}
                      <input ref={aboutInputRef} id="onb-about-upload" type="file" accept="image/*" onChange={handleAboutPhotoUpload} className="hidden" />
                    </label>
                    <input type="text" value={aboutCaptionInput} onChange={(e) => setAboutCaptionInput(e.target.value)}
                      placeholder="Optional caption..."
                      className="flex-1 h-11 px-3.5 rounded-lg border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800 transition-colors" />
                  </div>
                  {data.aboutPhotos && data.aboutPhotos.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                      {data.aboutPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img src={photo.url} alt={photo.caption || "About"} className="w-20 h-20 object-cover rounded-lg border border-surface-200 dark:border-surface-600" />
                          <button type="button" onClick={() => removeAboutPhoto(idx)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold">×</button>
                          {photo.caption && <p className="text-[10px] text-surface-400 mt-0.5 truncate max-w-[80px]">{photo.caption}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}
`;
      
      // Insert the hero2 and about photos sections
      const beforeInsert = step4Start + insertAfter;
      content = content.slice(0, beforeInsert) + mediaSections + content.slice(beforeInsert);
      console.log('✓ Added hero2 and about photos sections to step 4');
    } else {
      console.error('Could not find hero section end');
    }
  } else {
    console.error('Could not find hero Remove button');
  }
} else {
  console.log('! hero2 and about photos already in step 4');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('File written. Size:', content.length);

// Verify
const check = fs.readFileSync(filePath, 'utf8');
if (check.includes('hero2Label')) console.log('✓ hero2 section confirmed');
if (check.includes('aboutPhotosLabel')) console.log('✓ about photos section confirmed');
