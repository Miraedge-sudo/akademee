import { useState, useEffect } from "react";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const sections = ["about", "classes", "gallery", "contact"];

export default function PremiumTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const pcl = hexToRgba(pc, 0.08);
  const pcm = hexToRgba(pc, 0.4);

  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");
  const initials = (s.schoolName || "SC").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("premium-visible"); });
    }, { threshold: 0.1 });
    const els = document.querySelectorAll(".premium-reveal");
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const stats = s.websiteStats || {};
  const statItems = [
    { num: stats.studentsEnrolled || 248, lbl: "Students" },
    { num: stats.teachers || 32, lbl: "Faculty" },
    { num: s.examPassRate ? `${s.examPassRate}%` : "94%", lbl: `${s.examType || "GCE"} Pass Rate` },
    { num: s.yearFounded || "1998", lbl: "Founded" },
  ];

  const values = s.websiteValues?.length > 0 ? s.websiteValues : [
    { label: "Excellence", description: "Highest academic standards" },
    { label: "Bilingual", description: "English & French instruction" },
    { label: "Tradition", description: "Decades of proud heritage" },
    { label: "Community", description: "Family-centred environment" },
  ];

  const classesConfig = s.classesConfig?.length > 0 ? s.classesConfig : [
    { level: "Junior", name: "Form 1 & 2", desc: "Foundation years with core subjects.", age: "Ages 12–13" },
    { level: "Junior", name: "Form 3 & 4", desc: "O/L preparation, streams introduced.", age: "Ages 14–15" },
    { level: "O Level", name: "Form 5", desc: "GCE Ordinary Level examination.", age: "Age 16" },
    { level: "A Level", name: "Lower Sixth", desc: "Advanced Level entry.", age: "Age 17" },
    { level: "A Level", name: "Upper Sixth", desc: "GCE Advanced examination.", age: "Age 18" },
  ];

  const gallery = s.gallery?.length > 0 ? s.gallery : (s.aboutPhotos || []);

  const Icon = ({ path, className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5"}>
      <path d={path} />
    </svg>
  );

  const paths = {
    building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3",
    phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6.55-6.55 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.95a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    arrow: "M5 12h14M12 5l7 7-7 7",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    image: "M3 3h18v18H3zM21 15l-5-5-5 5-4-4-4 4",
    play: "M10 8l6 4-6 4V8z",
    quote: "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1v1c0 1 1 2 2 2zM18 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v2c0 1 1 2 2 2z",
    books: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
    clock: "M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zM12 6v6l4 2",
    openbook: "M12 6.5a6 6 0 0 1 6-6h4v16h-4a6 6 0 0 0-6 6M12 6.5a6 6 0 0 0-6-6H2v16h4a6 6 0 0 1 6 6",
  };

  return (
    <div className="font-sans antialiased bg-[#fcfaf7] text-[#2d2a24] overflow-hidden" style={{ "--p": pc, "--pl": pcl, "--pm": pcm, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        .premium-reveal { opacity: 0; transform: translateY(32px); transition: opacity .7s ease, transform .7s cubic-bezier(.2,.9,.3,1); }
        .premium-reveal.premium-visible { opacity: 1; transform: translateY(0); }
        .premium-reveal-delay-1 { transition-delay: .1s; }
        .premium-reveal-delay-2 { transition-delay: .2s; }
        .premium-reveal-delay-3 { transition-delay: .3s; }
        @keyframes premium-fade { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes premium-slide-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .premium-serif { font-family: 'Cormorant Garamond',Georgia,serif; }
        @keyframes premium-draw { 0% { width: 0; } 100% { width: 60px; } }
        .premium-line { animation: premium-draw .8s ease forwards; }
      `}</style>

      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#fcfaf7]/95 shadow-sm" : "bg-transparent"}`}
        style={{ backdropFilter: scrolled ? "blur(16px)" : "none" }}>
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="flex items-center justify-between h-[80px]">
            <a href="#" className="flex items-center gap-3 no-underline group">
              <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:shadow-lg" style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}>
                {!s.logoUrl && <span className="text-sm font-bold text-white tracking-wider">{initials}</span>}
              </div>
              <div>
                <div className="text-[17px] font-semibold text-[#2d2a24] leading-tight premium-serif">{s.schoolName || "School"}</div>
                <div className="text-[11px] text-[#9a948a] tracking-wide">{location || s.city || "Campus"}</div>
              </div>
            </a>
            <ul className="hidden md:flex items-center gap-0.5 list-none m-0 p-0">
              {sections.map(item => (
                <li key={item}>
                  <a href={`#${item}`} className="text-[13.5px] font-medium text-[#9a948a] px-4 py-2 rounded-lg no-underline transition-colors duration-200 hover:text-[#2d2a24] hover:bg-[#f0ede8]">{item.charAt(0).toUpperCase() + item.slice(1)}</a>
                </li>
              ))}
            </ul>
            <div className="hidden md:flex items-center gap-3">
              <a href="/login" className="text-[13.5px] font-medium text-[#9a948a] no-underline hover:text-[#2d2a24] transition-colors">Sign in</a>
              <a href="/login" className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white no-underline inline-flex items-center gap-1.5 transition-all duration-200 hover:opacity-90" style={{ background: pc }}>
                <Icon path={paths.login} className="w-3.5 h-3.5" /> Portal
              </a>
            </div>
            <button onClick={() => setMobileOpen(v => !v)} aria-label="Menu"
              className="md:hidden w-10 h-10 border-none bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[5px] rounded-lg">
              <span className="block w-5 h-px bg-[#2d2a24] transition-all duration-200" style={{ transform: mobileOpen ? "rotate(45deg) translate(5px,5px)" : "" }} />
              <span className="block w-5 h-px bg-[#2d2a24] transition-all duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span className="block w-5 h-px bg-[#2d2a24] transition-all duration-200" style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px,-5px)" : "" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 flex-col pt-24 px-8 pb-8 ${mobileOpen ? "flex" : "hidden"}`} style={{ background: "#fcfaf7" }}>
        {[...sections, "academics"].map(item => (
          <a key={item} href={`#${item === "academics" ? "about" : item}`} onClick={() => setMobileOpen(false)}
            className="premium-serif text-[28px] font-medium py-3.5 text-[#2d2a24] border-b border-[#e8e4de] no-underline">{item.charAt(0).toUpperCase() + item.slice(1)}</a>
        ))}
        <a href="/login" className="mt-6 h-12 flex items-center justify-center rounded-xl text-[15px] font-semibold text-white no-underline" style={{ background: pc }}>Student Portal</a>
      </div>

      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {s.heroImageUrl ? (
            <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover opacity-30" />
          ) : null}
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #fcfaf7 0%, ${hexToRgba(pc, 0.06)} 60%, #fcfaf7 100%)` }} />
        </div>
        <div className="relative z-10 w-full max-w-[1120px] mx-auto px-8 py-32">
          <div className="max-w-[640px]">
            {s.educationalSystems?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {s.educationalSystems.map(sys => (
                  <span key={sys} className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[2px] uppercase px-3.5 py-1.5" style={{ background: pcl, color: pc }}>
                    {sys}
                  </span>
                ))}
              </div>
            )}
            <div className="w-16 h-16 rounded-xl overflow-hidden mb-6" style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}>
              {!s.logoUrl && <span className="w-full h-full flex items-center justify-center text-lg font-bold text-white premium-serif">{initials}</span>}
            </div>
            <p className="text-[13px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4">{s.yearFounded ? `Est. ${s.yearFounded}` : ""}</p>
            <h1 className="premium-serif text-[clamp(42px,7vw,76px)] font-semibold leading-[1.05] tracking-[-0.5px] mb-6 text-[#2d2a24]">
              {s.schoolName || "Your School"}
            </h1>
            <p className="text-[17px] text-[#7a746a] leading-[1.8] mb-10 max-w-[480px]">
              {s.tagline || `${s.schoolName || "Our school"} provides world-class education through academic rigour, bilingual excellence, and a tradition of achievement.`}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <a href="#contact" className="inline-flex items-center gap-2.5 h-[54px] px-8 text-[14px] font-semibold text-white no-underline transition-all duration-200 hover:opacity-90" style={{ background: pc }}>
                Enrol now
              </a>
              <a href="#about" className="inline-flex items-center gap-2 h-[54px] px-6 text-[14px] font-medium text-[#2d2a24] no-underline transition-all duration-200 border-b-2 border-[#d8d4ce] hover:border-[var(--p)] hover:text-[var(--p)]">
                Discover our heritage <Icon path={paths.arrow} className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 mt-20 pt-12 border-t border-[#e8e4de]">
            {statItems.map((stat, i) => (
              <div key={i}>
                <div className="premium-serif text-[32px] font-semibold text-[#2d2a24] leading-none mb-1">{stat.num}</div>
                <div className="text-[11.5px] text-[#9a948a] tracking-wide">{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="premium-reveal py-28 max-md:py-16" id="about" data-section="about">
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-16 max-md:gap-10 items-center">
            <div>
              <p className="text-[11px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4">About us</p>
              <h2 className="premium-serif text-[clamp(30px,4vw,46px)] font-semibold leading-[1.12] mb-6">
                A tradition of <em className="italic" style={{ color: pc }}>excellence</em>
              </h2>
              <p className="text-[16px] text-[#7a746a] leading-[1.85] mb-8">
                {s.websiteDescription || `${s.schoolName || "Our school"} is dedicated to providing a supportive, challenging environment where every student can thrive and achieve their full potential.`}
              </p>
              <div className="flex flex-wrap gap-5">
                <div>
                  <p className="premium-serif text-2xl font-semibold text-[#2d2a24]">{s.examPassRate ? `${s.examPassRate}%` : "94%"}</p>
                  <p className="text-[12px] text-[#9a948a] tracking-wide">{s.examType || "GCE"} Pass Rate</p>
                </div>
                <div className="w-px bg-[#e8e4de]" />
                <div>
                  <p className="premium-serif text-2xl font-semibold text-[#2d2a24]">{s.ranking || "Top 5"}</p>
                  <p className="text-[12px] text-[#9a948a] tracking-wide">{s.rankingCity ? `in ${s.rankingCity}` : "Ranking"}</p>
                </div>
                <div className="w-px bg-[#e8e4de]" />
                <div>
                  <p className="premium-serif text-2xl font-semibold text-[#2d2a24]">{stats.teachers || 32}</p>
                  <p className="text-[12px] text-[#9a948a] tracking-wide">Faculty</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-sm overflow-hidden aspect-[3/4]" style={{ background: pcl }}>
                {s.aboutPhotos && s.aboutPhotos.length > 0 ? (
                  <img src={s.aboutPhotos[0].url} alt={s.aboutPhotos[0].caption || ""} className="w-full h-full object-cover" />
                ) : s.heroImageUrl ? (
                  <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon path={paths.image} className="w-12 h-12" style={{ color: pcm }} />
                  </div>
                )}
              </div>
              {s.aboutPhotos && s.aboutPhotos.length > 1 && (
                <div className="absolute -bottom-6 -right-6 w-2/5 aspect-[3/4] rounded-sm overflow-hidden shadow-2xl" style={{ background: pcl }}>
                  <img src={s.aboutPhotos[1].url} alt={s.aboutPhotos[1].caption || ""} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24 max-md:py-16" style={{ background: "#f5f2ed" }}>
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4">Our foundations</p>
            <h2 className="premium-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.12]">What we <em className="italic" style={{ color: pc }}>stand for</em></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.slice(0, 4).map((v, i) => (
              <div key={i} className="premium-reveal bg-[#fcfaf7] p-7 border border-[#e8e4de] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-default">
                <div className="w-10 h-10 flex items-center justify-center mb-5" style={{ color: pc }}>
                  <Icon path={paths.openbook} className="w-6 h-6" />
                </div>
                <h3 className="premium-serif text-xl font-semibold text-[#2d2a24] mb-2">{v.label || v}</h3>
                <p className="text-[14px] text-[#7a746a] leading-relaxed">{v.description || v.desc || ""}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACADEMIC */}
      {(s.examType || s.examPassRate || s.ranking) && (
        <section className="premium-reveal py-24 max-md:py-16" id="academics" data-section="academics">
          <div className="max-w-[1120px] mx-auto px-8">
            <div className="text-center mb-14">
              <p className="text-[11px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4">Achievements</p>
              <h2 className="premium-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.12]">Our academic <em className="italic" style={{ color: pc }}>record</em></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {s.examType && (
                <div className="bg-[#f5f2ed] p-8 text-center border border-[#e8e4de]">
                  <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-2">Examination</p>
                  <p className="premium-serif text-2xl font-semibold text-[#2d2a24]">{s.examType}</p>
                </div>
              )}
              {s.examPassRate && (
                <div className="p-8 text-center border" style={{ background: pcl, borderColor: pcm }}>
                  <p className="text-[10px] font-medium tracking-[3px] uppercase mb-2" style={{ color: pcm }}>Pass Rate</p>
                  <p className="premium-serif text-5xl font-semibold" style={{ color: pc }}>{s.examPassRate}%</p>
                </div>
              )}
              {s.ranking && (
                <div className="bg-[#f5f2ed] p-8 text-center border border-[#e8e4de]">
                  <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-2">Ranking</p>
                  <p className="premium-serif text-2xl font-semibold text-[#2d2a24]">{s.ranking}</p>
                  {s.rankingCity && <p className="text-[13px] text-[#9a948a] mt-1">in {s.rankingCity}</p>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CLASSES */}
      <section className="premium-reveal py-24 max-md:py-16" style={{ background: "#f5f2ed" }} id="classes" data-section="classes">
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4">Academics</p>
            <h2 className="premium-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.12]">Our classes &amp; <em className="italic" style={{ color: pc }}>streams</em></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {classesConfig.map((cls, i) => (
              <div key={i} className="premium-reveal bg-[#fcfaf7] p-6 border border-[#e8e4de] transition-all duration-200 hover:shadow-md">
                <span className="inline-block text-[10px] font-medium tracking-[2px] uppercase px-3 py-1 mb-4" style={{ background: pcl, color: pc }}>{cls.level}</span>
                <h3 className="premium-serif text-lg font-semibold text-[#2d2a24] mb-2">{cls.name}</h3>
                <p className="text-[13px] text-[#7a746a] leading-relaxed mb-3">{cls.desc}</p>
                <p className="text-[11px] font-medium" style={{ color: pcm }}>{cls.age}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="premium-reveal py-24 max-md:py-16" id="gallery" data-section="gallery">
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4">Gallery</p>
            <h2 className="premium-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.12]">Life at {s.schoolName?.split(" ")[0] || "School"}</h2>
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.slice(0, 5).map((img, i) => (
                <div key={i} className={`overflow-hidden group cursor-pointer ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                  style={{ minHeight: i === 0 ? "460px" : "220px" }}>
                  <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className={`flex items-center justify-center border border-[#e8e4de] ${i === 0 ? "md:col-span-2 md:row-span-2 min-h-[460px]" : "min-h-[220px]"}`} style={{ background: pcl }}>
                  <Icon path={paths.image} className="w-8 h-8" style={{ color: pcm }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="premium-reveal py-24 max-md:py-16 relative" style={{ background: "#f5f2ed" }}>
        <div className="relative max-w-[640px] mx-auto text-center px-8">
          <Icon path={paths.quote} className="w-10 h-10 mx-auto mb-6" style={{ color: pcm }} />
          <p className="premium-serif text-[clamp(20px,2.5vw,28px)] font-normal italic leading-[1.6] text-[#5a544a] mb-8">
            &ldquo;{s.schoolName || "School"} gave my children not just an education, but the confidence and skills to succeed anywhere in the world.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3.5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold premium-serif" style={{ background: pc, color: "#fff" }}>{initials}</div>
            <div className="text-left">
              <p className="premium-serif text-[16px] font-semibold text-[#2d2a24]">Parent</p>
              <p className="text-[13px] text-[#9a948a]">{s.schoolName || "School"} &middot; {location || "City"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="premium-reveal py-24 max-md:py-16" id="contact" data-section="contact">
        <div className="max-w-[1120px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-md:gap-10">
            <div>
              <p className="text-[11px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4">Visit us</p>
              <h2 className="premium-serif text-[clamp(28px,4vw,44px)] font-semibold leading-[1.12] mb-5">Come see our <em className="italic" style={{ color: pc }}>campus</em></h2>
              <p className="text-[16px] text-[#7a746a] leading-[1.7] mb-8 max-w-[420px]">Our admissions office is open Monday to Friday. We welcome prospective families to tour the campus and meet our faculty.</p>
              <div className="flex flex-col gap-5">
                {[
                  { path: paths.pin, label: "Address", value: s.address || `${s.city || "City"}, ${s.region || "Region"}` },
                  { path: paths.phone, label: "Phone", value: s.phone || "+237 6XX XXX XXX" },
                  { path: paths.mail, label: "Email", value: s.email || "info@yourschool.cm" },
                  { path: paths.clock, label: "Office Hours", value: "Mon – Fri · 7:30 AM – 4:00 PM" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ color: pc }}>
                      <Icon path={item.path} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium tracking-[2px] uppercase text-[#9a948a] mb-0.5">{item.label}</p>
                      <p className="text-[15px] font-medium text-[#2d2a24]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-h-[320px] flex items-center justify-center flex-col gap-3 border-2" style={{ background: pcl, borderColor: "#e8e4de" }}>
              <Icon path={paths.pin} className="w-10 h-10" style={{ color: pc }} />
              <p className="premium-serif text-[15px] font-medium" style={{ color: pcm }}>{s.schoolName || "School"} &middot; {location || "City"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e8e4de]" style={{ background: "#f5f2ed" }}>
        <div className="max-w-[1120px] mx-auto px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pc }}>
                  <Icon path={paths.building} className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="premium-serif text-[18px] font-semibold text-[#2d2a24]">{s.schoolName || "School"}</span>
              </div>
              <p className="text-[13px] text-[#9a948a] leading-relaxed">Shaping leaders since {s.yearFounded || "1998"}.</p>
            </div>
            {[
              { title: "Navigate", links: [{ label: "About", href: "#about" }, { label: "Classes", href: "#classes" }, { label: "Gallery", href: "#gallery" }, { label: "Contact", href: "#contact" }] },
              { title: "Portals", links: [{ label: "Student Portal", href: "/login" }, { label: "Parent Login", href: "/login" }] },
              { title: "Academic", links: [{ label: "Curriculum", href: "#classes" }, { label: "Results", href: "#academics" }, { label: "Fees", href: "#" }, { label: "Admissions", href: "#contact" }] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-[11px] font-medium tracking-[3px] uppercase mb-4" style={{ color: pcm }}>{col.title}</p>
                <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                  {col.links.map((link, j) => (
                    <li key={j}><a href={link.href} className="text-[14px] text-[#9a948a] no-underline hover:text-[#2d2a24] transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e8e4de] pt-6 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
            <p className="text-[13px] text-[#9a948a]">&copy; {year} {s.schoolName || "School"}. All rights reserved.</p>
            <p className="text-[13px] text-[#9a948a]">Managed with <strong className="font-semibold" style={{ color: pc }}>Akademee</strong></p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fcfaf7] border-t border-[#e8e4de] p-3 pb-[max(12px,env(safe-area-inset-bottom))] flex gap-2.5">
        <a href="/login" className="flex-1 h-12 flex items-center justify-center text-[14px] font-semibold text-white no-underline" style={{ background: pc }}>Portal</a>
        <a href="#contact" className="flex-1 h-12 flex items-center justify-center text-[14px] font-medium text-[#2d2a24] no-underline border border-[#d8d4ce]">Contact</a>
      </div>
    </div>
  );
}
