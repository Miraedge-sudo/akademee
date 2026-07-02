import { useState, useEffect } from "react";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const sections = ["about", "values", "classes", "gallery", "contact"];

export default function BoldTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const pcl = hexToRgba(pc, 0.12);
  const pcm = hexToRgba(pc, 0.5);
  const pcd = hexToRgba(pc, 0.08);

  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");
  const initials = (s.schoolName || "SC").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisibleSections((prev) => new Set(prev).add(e.target.dataset.section));
          e.target.classList.add("bold-visible");
        }
      });
    }, { threshold: 0.08 });
    const els = document.querySelectorAll(".bold-reveal");
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
    { num: stats.teachers || 32, lbl: "Teachers" },
    { num: s.examPassRate ? `${s.examPassRate}%` : "94%", lbl: `${s.examType || "GCE"} Pass Rate` },
    { num: s.yearFounded || "1998", lbl: "Founded" },
  ];

  const values = s.websiteValues?.length > 0 ? s.websiteValues : [
    { label: "Excellence", description: "Highest academic standards maintained across all year groups" },
    { label: "Bilingual", description: "English and French instruction throughout" },
    { label: "Community", description: "Welcoming family-centred environment" },
    { label: "Achievement", description: "Proven track record of student success" },
  ];

  const classesConfig = s.classesConfig?.length > 0 ? s.classesConfig : [
    { level: "Junior", name: "Form 1 & 2", desc: "Foundation years. Core subjects: English, French, Maths, Science.", age: "Ages 12–13" },
    { level: "Junior", name: "Form 3 & 4", desc: "GCE O/L preparation. Science and Arts streams.", age: "Ages 14–15" },
    { level: "O Level", name: "Form 5", desc: "GCE Ordinary Level examination year.", age: "Age 16" },
    { level: "A Level", name: "Lower Sixth", desc: "Advanced Level entry. Science, Arts and Commercial streams.", age: "Age 17" },
    { level: "A Level", name: "Upper Sixth", desc: "GCE Advanced Level examination.", age: "Age 18" },
  ];

  const gallery = s.gallery?.length > 0 ? s.gallery : (s.aboutPhotos || []);

  const Icon = ({ path, className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5"}>
      <path d={path} />
    </svg>
  );

  const paths = {
    building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13 12H3",
    phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6.55-6.55 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.95a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z",
    pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
    arrow: "M5 12h14M12 5l7 7-7 7",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    image: "M3 3h18v18H3zM21 15l-5-5-5 5-4-4-4 4",
    play: "M10 8l6 4-6 4V8z",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    quote: "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1v1c0 1 1 2 2 2zM18 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v2c0 1 1 2 2 2z",
    clock: "M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zM12 6v6l3.5 2.5",
  };

  return (
    <div className="font-sans antialiased bg-[#0a0a0a] text-white overflow-hidden" style={{ "--p": pc, "--pl": pcl, "--pm": pcm }}>
      <style>{`
        .bold-reveal { opacity: 0; transform: translateY(30px); transition: opacity .6s cubic-bezier(.2,.9,.3,1), transform .6s cubic-bezier(.2,.9,.3,1); }
        .bold-reveal.bold-visible { opacity: 1; transform: translateY(0); }
        .bold-reveal-delay-1 { transition-delay: .1s; }
        .bold-reveal-delay-2 { transition-delay: .2s; }
        .bold-reveal-delay-3 { transition-delay: .3s; }
        .bold-reveal-delay-4 { transition-delay: .4s; }
        .bold-gradient { background: linear-gradient(135deg, var(--p), transparent); }
        .bold-glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); }
        .bold-glow { box-shadow: 0 0 40px var(--pl); }
        @keyframes bold-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes bold-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes bold-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        @keyframes bold-border-draw { to { stroke-dashoffset: 0; } }
      `}</style>

      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bold-glass shadow-2xl" : "bg-transparent"}`}
        style={{ background: scrolled ? "rgba(10,10,10,0.85)" : "transparent" }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            <a href="#" className="flex items-center gap-3 no-underline group">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}>
                {!s.logoUrl && <span className="text-[13px] font-bold text-white">{initials}</span>}
              </div>
              <div className="hidden sm:block">
                <div className="text-[15px] font-semibold text-white leading-tight">{s.schoolName || "School Name"}</div>
                <div className="text-[11px] text-white/40">{location || s.city || "Campus"}</div>
              </div>
            </a>
            <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
              {sections.map(item => (
                <li key={item}>
                  <a href={`#${item}`} className="text-[13px] font-medium text-white/50 px-3.5 py-2 rounded-lg no-underline transition-all duration-200 hover:text-white hover:bg-white/5">
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
            <div className="hidden md:flex items-center gap-2.5">
              <a href="/login" className="h-9 px-4 rounded-xl text-[13px] font-medium text-white/70 no-underline inline-flex items-center transition-colors hover:text-white">
                Sign in
              </a>
              <a href="/login" className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white no-underline inline-flex items-center gap-1.5 transition-all duration-200 hover:brightness-110" style={{ background: pc }}>
                <Icon path={paths.login} className="w-3.5 h-3.5" /> Portal
              </a>
            </div>
            <button onClick={() => setMobileOpen(v => !v)} aria-label="Menu"
              className="md:hidden w-10 h-10 border-none bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[5px] rounded-lg">
              <span className="block w-5 h-[2px] bg-white rounded transition-all duration-200" style={{ transform: mobileOpen ? "rotate(45deg) translate(5px,5px)" : "" }} />
              <span className="block w-5 h-[2px] bg-white rounded transition-all duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span className="block w-5 h-[2px] bg-white rounded transition-all duration-200" style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px,-5px)" : "" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 flex-col pt-20 px-6 pb-8 ${mobileOpen ? "flex" : "hidden"}`} style={{ background: "#0a0a0a", backdropFilter: "blur(20px)" }}>
        {[...sections, "academics"].map(item => (
          <a key={item} href={`#${item}`} onClick={() => setMobileOpen(false)}
            className="text-[18px] font-medium py-3.5 text-white/70 border-b border-white/5 no-underline hover:text-white transition-colors">
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </a>
        ))}
        <div className="flex flex-col gap-2.5 mt-6">
          <a href="/login" className="h-12 flex items-center justify-center rounded-xl text-[15px] font-semibold text-white no-underline" style={{ background: pc }}>
            <Icon path={paths.login} className="w-4 h-4 mr-2" /> Student Portal
          </a>
        </div>
      </div>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {s.heroImageUrl ? (
            <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover opacity-40" />
          ) : s.heroImageUrl2 ? (
            <img src={s.heroImageUrl2} alt="" className="w-full h-full object-cover opacity-30" />
          ) : null}
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #0a0a0a 0%, ${hexToRgba(pc, 0.3)} 50%, #0a0a0a 100%)` }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 30% 40%, ${pc} 0%, transparent 60%)` }} />
        </div>
        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-32 max-md:py-24">
          <div className="max-w-[720px]">
            {s.educationalSystems?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {s.educationalSystems.map(sys => (
                  <span key={sys} className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full border" style={{ borderColor: pcm, color: pcm }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc }} />
                    {sys}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: pcm, background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}>
                {!s.logoUrl && <span className="w-full h-full flex items-center justify-center text-xl font-bold text-white">{initials}</span>}
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-[2px] uppercase text-white/40">{s.yearFounded ? `Est. ${s.yearFounded}` : ""}</div>
              </div>
            </div>
            <h1 className="text-[clamp(40px,7vw,80px)] font-bold leading-[1.05] tracking-[-1.5px] mb-5">
              {s.schoolName || "Your School"}
            </h1>
            <p className="text-[clamp(16px,2vw,20px)] text-white/60 leading-[1.7] mb-8 max-w-[560px]">
              {s.tagline || `${s.schoolName || "Our school"} provides world-class education through academic rigour, bilingual excellence, and a tradition of achievement.`}
            </p>
            <div className="flex items-center gap-3.5 flex-wrap">
              <a href="#contact" className="inline-flex items-center gap-2.5 h-[54px] px-7 rounded-xl text-[15px] font-semibold text-white no-underline transition-all duration-200 active:scale-[0.98] hover:brightness-110" style={{ background: pc }}>
                <Icon path={paths.phone} className="w-[18px] h-[18px]" /> Enrol now
              </a>
              <a href="#about" className="inline-flex items-center gap-2.5 h-[54px] px-6 rounded-xl text-[15px] font-medium text-white/80 no-underline transition-all duration-200 hover:text-white border border-white/10 hover:border-white/20">
                <Icon path={paths.play} className="w-[18px] h-[18px]" /> Discover more
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10" style={{ background: `linear-gradient(to top, #0a0a0a, transparent)` }}>
          <div className="max-w-[1200px] mx-auto px-6 pb-6 pt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {statItems.map((stat, i) => (
                <div key={i}>
                  <div className="font-display text-[28px] font-bold text-white leading-none mb-1">{stat.num}</div>
                  <div className="text-[12px] text-white/40 uppercase tracking-wider">{stat.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="bold-reveal py-24 max-md:py-16" id="about" data-section="about">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-md:gap-10 items-center">
            <div>
              <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pcm }}>About us</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.15] mb-5">
                A legacy of <em className="italic" style={{ color: pc }}>excellence</em>
              </h2>
              <p className="text-[16px] text-white/50 leading-[1.8] mb-6">
                {s.websiteDescription || `${s.schoolName || "Our school"} is dedicated to providing a supportive, challenging environment where every student can thrive and achieve their full potential.`}
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: s.examType || "GCE", desc: "Examination" },
                  { label: s.examPassRate ? `${s.examPassRate}%` : "94%", desc: "Pass Rate" },
                  { label: s.ranking || "Top 5", desc: s.rankingCity || "Ranking" },
                ].map((item, i) => (
                  <div key={i} className="bold-glass rounded-xl px-5 py-3.5 text-center min-w-[100px]">
                    <div className="text-lg font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5]">
                {s.aboutPhotos && s.aboutPhotos.length > 0 ? (
                  <img src={s.aboutPhotos[0].url} alt={s.aboutPhotos[0].caption || ""} className="w-full h-full object-cover" />
                ) : s.heroImageUrl ? (
                  <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: pcl }}>
                    <Icon path={paths.image} className="w-12 h-12 text-white/20" />
                  </div>
                )}
                {s.aboutPhotos && s.aboutPhotos.length > 1 && (
                  <div className="absolute -bottom-4 -right-4 w-1/2 aspect-[3/4] rounded-xl overflow-hidden border-4 border-[#0a0a0a] shadow-2xl">
                    <img src={s.aboutPhotos[1].url} alt={s.aboutPhotos[1].caption || ""} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24 max-md:py-16" style={{ background: "#0f0f0f" }} id="values" data-section="values">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pcm }}>Our values</p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.15]">What makes us <em className="italic" style={{ color: pc }}>different</em></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.slice(0, 4).map((v, i) => (
              <div key={i} className="bold-reveal group relative p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = pcm}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110" style={{ background: pcl }}>
                  <Icon path={paths.star} className="w-5 h-5" style={{ color: pc }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{v.label || v}</h3>
                <p className="text-[14px] text-white/40 leading-relaxed">{v.description || v.desc || ""}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACADEMIC ACHIEVEMENTS */}
      {(s.examType || s.examPassRate || s.ranking) && (
        <section className="bold-reveal py-24 max-md:py-16" id="academics" data-section="academics">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pcm }}>Achievements</p>
              <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.15]">Our academic <em className="italic" style={{ color: pc }}>record</em></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {s.examType && (
                <div className="bold-glass rounded-2xl p-8 text-center">
                  <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-2 text-white/30">Examination</p>
                  <p className="text-3xl font-bold text-white">{s.examType}</p>
                </div>
              )}
              {s.examPassRate && (
                <div className="bold-glass rounded-2xl p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${pc}, transparent)` }} />
                  <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-2 text-white/30 relative">Pass Rate</p>
                  <p className="text-5xl font-bold relative" style={{ color: pc }}>{s.examPassRate}%</p>
                </div>
              )}
              {s.ranking && (
                <div className="bold-glass rounded-2xl p-8 text-center">
                  <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-2 text-white/30">Ranking</p>
                  <p className="text-3xl font-bold text-white">{s.ranking}</p>
                  {s.rankingCity && <p className="text-[13px] text-white/30 mt-1">in {s.rankingCity}</p>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CLASSES */}
      <section className="bold-reveal py-24 max-md:py-16" style={{ background: "#0f0f0f" }} id="classes" data-section="classes">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pcm }}>Academics</p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.15]">Our classes &amp; <em className="italic" style={{ color: pc }}>streams</em></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {classesConfig.map((cls, i) => (
              <div key={i} className="bold-reveal group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = pcm; e.currentTarget.style.background = pcl; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                <span className="inline-block text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full mb-3" style={{ background: pcl, color: pc }}>{cls.level}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{cls.name}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed mb-3">{cls.desc}</p>
                <p className="text-[12px] font-medium" style={{ color: pcm }}>{cls.age}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="bold-reveal py-24 max-md:py-16" id="gallery" data-section="gallery">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pcm }}>Gallery</p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.15]">Life at {s.schoolName?.split(" ")[0] || "School"}</h2>
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gallery.slice(0, 5).map((img, i) => (
                <div key={i} className={`relative overflow-hidden rounded-2xl group cursor-pointer ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                  style={{ minHeight: i === 0 ? "480px" : "220px" }}>
                  <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {img.caption && <p className="absolute bottom-3 left-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">{img.caption}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className={`rounded-2xl flex items-center justify-center ${i === 0 ? "md:col-span-2 md:row-span-2 min-h-[480px]" : "min-h-[220px]"}`}
                  style={{ background: pcl }}>
                  <Icon path={paths.image} className="w-8 h-8 text-white/20" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bold-reveal py-24 max-md:py-16 relative overflow-hidden" style={{ background: "#0f0f0f" }}>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: pc, filter: "blur(80px)" }} />
        <div className="relative max-w-[700px] mx-auto text-center px-6">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => <span key={i} className="text-lg" style={{ color: pc }}>★</span>)}
          </div>
          <p className="text-[clamp(18px,2.5vw,26px)] font-light leading-[1.7] text-white/70 mb-8">
            &ldquo;{s.schoolName || "School"} gave my children not just an education, but the confidence and skills to succeed anywhere in the world.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: pc, color: "#fff" }}>{initials}</div>
            <div className="text-left">
              <p className="text-[15px] font-semibold text-white">Parent</p>
              <p className="text-[13px] text-white/40">{s.schoolName || "School"} &middot; {location || "City"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="bold-reveal py-24 max-md:py-16" id="contact" data-section="contact">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-md:gap-10">
            <div>
              <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pcm }}>Contact</p>
              <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.15] mb-5">Come visit our <em className="italic" style={{ color: pc }}>campus</em></h2>
              <p className="text-[16px] text-white/50 leading-[1.7] mb-8 max-w-[440px]">We welcome families to visit. Our admissions team is available Monday to Friday.</p>
              <div className="flex flex-col gap-5">
                {[
                  { path: paths.pin, label: "Address", value: s.address || `${s.city || "City"}, ${s.region || "Region"}` },
                  { path: paths.phone, label: "Phone", value: s.phone || "+237 6XX XXX XXX" },
                  { path: paths.mail, label: "Email", value: s.email || "info@yourschool.cm" },
                  { path: paths.clock, label: "Office Hours", value: "Mon – Fri · 7:30 AM – 4:00 PM" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 group">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110" style={{ background: pcl }}>
                      <Icon path={item.path} className="w-5 h-5" style={{ color: pc }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-wider uppercase text-white/30 mb-0.5">{item.label}</p>
                      <p className="text-[15px] text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center flex-col gap-3 border" style={{ background: pcl, borderColor: "rgba(255,255,255,0.06)" }}>
              <Icon path={paths.pin} className="w-10 h-10" style={{ color: pc }} />
              <p className="text-[14px] font-medium text-white/60">{s.schoolName || "School"} &middot; {location || "City"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#060606", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pc }}>
                  <Icon path={paths.building} className="w-4 h-4 text-white" />
                </div>
                <span className="text-[16px] font-semibold text-white">{s.schoolName || "School"}</span>
              </div>
              <p className="text-[13px] text-white/30 leading-relaxed">Shaping the leaders of tomorrow since {s.yearFounded || "1998"}.</p>
            </div>
            {[
              { title: "Navigate", links: [{ label: "About", href: "#about" }, { label: "Classes", href: "#classes" }, { label: "Gallery", href: "#gallery" }, { label: "Contact", href: "#contact" }] },
              { title: "Portals", links: [{ label: "Student Portal", href: "/login" }, { label: "Parent Login", href: "/login" }, { label: "Teacher Login", href: "/login" }] },
              { title: "Academic", links: [{ label: "Timetable", href: "#" }, { label: "Fees", href: "#" }, { label: "Results", href: "#" }, { label: "Admissions", href: "#" }] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-[12px] font-semibold tracking-wider uppercase mb-4" style={{ color: pcm }}>{col.title}</p>
                <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                  {col.links.map((link, j) => (
                    <li key={j}><a href={link.href} className="text-[14px] text-white/30 no-underline hover:text-white transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
            <p className="text-[13px] text-white/20">&copy; {year} {s.schoolName || "School"}. All rights reserved.</p>
            <p className="text-[13px] text-white/20">Managed with <strong className="font-semibold" style={{ color: pcm }}>Akademee</strong></p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 pb-[max(12px,env(safe-area-inset-bottom))] flex gap-2.5" style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/login" className="flex-1 h-12 flex items-center justify-center rounded-xl text-[14px] font-semibold text-white no-underline" style={{ background: pc }}>Student Portal</a>
        <a href="#contact" className="flex-1 h-12 flex items-center justify-center rounded-xl text-[14px] font-medium text-white/70 no-underline border border-white/10">Contact</a>
      </div>
    </div>
  );
}
