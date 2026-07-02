import { useState, useEffect } from "react";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const sections = ["about", "classes", "gallery", "contact"];

export default function PlayfulTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const pcl = hexToRgba(pc, 0.1);
  const pcm = hexToRgba(pc, 0.5);
  const pcd = hexToRgba(pc, 0.06);

  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");
  const initials = (s.schoolName || "SC").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("playful-visible"); });
    }, { threshold: 0.1 });
    const els = document.querySelectorAll(".playful-reveal");
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const stats = s.websiteStats || {};
  const statItems = [
    { num: stats.studentsEnrolled || 248, lbl: "Students", icon: "users" },
    { num: stats.teachers || 32, lbl: "Teachers", icon: "star" },
    { num: s.examPassRate ? `${s.examPassRate}%` : "94%", lbl: `${s.examType || "GCE"} Pass Rate`, icon: "trending" },
    { num: s.yearFounded || "1998", lbl: "Founded", icon: "calendar" },
  ];

  const values = s.websiteValues?.length > 0 ? s.websiteValues : [
    { label: "Excellence", description: "Highest academic standards" },
    { label: "Bilingual", description: "English & French instruction" },
    { label: "Community", description: "Family-centred environment" },
    { label: "Achievement", description: "Proven student success" },
  ];

  const classesConfig = s.classesConfig?.length > 0 ? s.classesConfig : [
    { level: "Junior", name: "Form 1 & 2", desc: "Foundation years", age: "Ages 12–13" },
    { level: "Junior", name: "Form 3 & 4", desc: "O/L preparation", age: "Ages 14–15" },
    { level: "O Level", name: "Form 5", desc: "GCE Ordinary Level", age: "Age 16" },
    { level: "A Level", name: "Lower Sixth", desc: "Advanced entry", age: "Age 17" },
    { level: "A Level", name: "Upper Sixth", desc: "GCE Advanced", age: "Age 18" },
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
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z",
    arrow: "M5 12h14M12 5l7 7-7 7",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    image: "M3 3h18v18H3zM21 15l-5-5-5 5-4-4-4 4",
    play: "M10 8l6 4-6 4V8z",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    trending: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
    sparkle: "M12 2l.5 4 3.5-2-.5 4 4-.5-2 3.5 4 .5-3.5 2 2 3.5-4-.5-.5 4-3.5-2-.5 4-3.5-2-.5 4-2-3.5-4 .5 2-3.5-4-.5 3.5-2-2-3.5 4 .5z",
  };

  const bgs = ["from-violet-400/20 via-transparent", "from-amber-300/15 via-transparent", "from-rose-300/15 via-transparent"];

  return (
    <div className="font-sans antialiased bg-[#faf9f7] text-[#1a1a1a] overflow-hidden" style={{ "--p": pc, "--pl": pcl, "--pm": pcm }}>
      <style>{`
        .playful-reveal { opacity: 0; transform: translateY(24px) scale(0.98); transition: opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1); }
        .playful-reveal.playful-visible { opacity: 1; transform: translateY(0) scale(1); }
        .playful-reveal-delay-1 { transition-delay: .1s; }
        .playful-reveal-delay-2 { transition-delay: .2s; }
        .playful-reveal-delay-3 { transition-delay: .3s; }
        @keyframes playful-float { 0%,100% { transform: translateY(0) rotate(0deg); } 25% { transform: translateY(-6px) rotate(1deg); } 75% { transform: translateY(4px) rotate(-1deg); } }
        @keyframes playful-wiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(3deg); } 75% { transform: rotate(-3deg); } }
        @keyframes playful-bounce-in { 0% { opacity: 0; transform: scale(0.3); } 50% { transform: scale(1.05); } 70% { transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes playful-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes playful-dance { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
      `}</style>

      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 shadow-lg shadow-black/5" : "bg-transparent"}`}
        style={{ backdropFilter: scrolled ? "blur(12px)" : "none" }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="flex items-center justify-between h-[68px]">
            <a href="#" className="flex items-center gap-2.5 no-underline group">
              <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110" style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}>
                {!s.logoUrl && <span className="text-sm font-bold text-white">{initials}</span>}
              </div>
              <div>
                <div className="text-[15px] font-semibold text-[#1a1a1a] leading-tight">{s.schoolName || "School"}</div>
                <div className="text-[11px] text-[#8a8a8a]">{location || s.city || "Campus"}</div>
              </div>
            </a>
            <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
              {sections.map(item => (
                <li key={item}>
                  <a href={`#${item}`} className="text-[14px] font-medium text-[#6a6a6a] px-3.5 py-2 rounded-xl no-underline transition-all duration-200 hover:text-[var(--p)] hover:bg-[var(--pl)]">{item.charAt(0).toUpperCase() + item.slice(1)}</a>
                </li>
              ))}
            </ul>
            <a href="/login" className="h-9 px-5 rounded-full text-[13px] font-semibold text-white no-underline inline-flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95" style={{ background: pc }}>
              <Icon path={paths.login} className="w-3.5 h-3.5" /> Portal
            </a>
            <button onClick={() => setMobileOpen(v => !v)} aria-label="Menu"
              className="md:hidden w-10 h-10 border-none bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[5px] rounded-xl">
              <span className="block w-5 h-[2.5px] bg-[#1a1a1a] rounded-full transition-all duration-200" style={{ transform: mobileOpen ? "rotate(45deg) translate(5px,5px)" : "" }} />
              <span className="block w-5 h-[2.5px] bg-[#1a1a1a] rounded-full transition-all duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span className="block w-5 h-[2.5px] bg-[#1a1a1a] rounded-full transition-all duration-200" style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px,-5px)" : "" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 bg-white/95 flex-col pt-20 px-5 pb-8 ${mobileOpen ? "flex" : "hidden"}`} style={{ backdropFilter: "blur(20px)" }}>
        {[...sections, "academics"].map(item => (
          <a key={item} href={`#${item === "academics" ? "about" : item}`} onClick={() => setMobileOpen(false)}
            className="text-[20px] font-semibold py-3.5 text-[#1a1a1a] border-b border-[#eee] no-underline">{item.charAt(0).toUpperCase() + item.slice(1)}</a>
        ))}
        <a href="/login" className="mt-6 h-12 flex items-center justify-center rounded-full text-[15px] font-semibold text-white no-underline" style={{ background: pc }}>Student Portal</a>
      </div>

      {/* HERO */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20" style={{ background: pc, filter: "blur(60px)", animation: "playful-float 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-10" style={{ background: pc, filter: "blur(50px)", animation: "playful-float 8s ease-in-out infinite reverse" }} />
          {s.heroImageUrl && <img src={s.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />}
        </div>
        <div className="relative z-10 max-w-[1100px] mx-auto px-5">
          <div className="flex flex-col items-center text-center pt-12 pb-8">
            {s.educationalSystems?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {s.educationalSystems.map(sys => (
                  <span key={sys} className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full" style={{ background: pcl, color: pc }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc }} />
                    {sys}
                  </span>
                ))}
              </div>
            )}
            <div className="w-20 h-20 rounded-3xl overflow-hidden mb-5 border-4 border-white shadow-xl" style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}>
              {!s.logoUrl && <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">{initials}</span>}
            </div>
            <h1 className="text-[clamp(36px,6vw,68px)] font-bold leading-[1.08] tracking-[-0.5px] mb-4 max-w-[800px]">
              Welcome to <span style={{ color: pc }}>{s.schoolName || "Your School"}</span>
            </h1>
            <p className="text-[clamp(16px,2vw,19px)] text-[#6a6a6a] leading-[1.7] mb-8 max-w-[540px]">
              {s.tagline || `${s.schoolName || "Our school"} inspires students to achieve academic excellence and personal growth in a supportive environment.`}
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <a href="#contact" className="inline-flex items-center gap-2 h-[52px] px-6 rounded-full text-[15px] font-semibold text-white no-underline transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg" style={{ background: pc, boxShadow: `0 8px 24px ${pcm}` }}>
                <Icon path={paths.phone} className="w-[18px] h-[18px]" /> Enrol now
              </a>
              <a href="#about" className="inline-flex items-center gap-2 h-[52px] px-6 rounded-full text-[15px] font-medium text-[#1a1a1a] no-underline border-2 transition-all duration-200 hover:border-[var(--p)] hover:text-[var(--p)]" style={{ borderColor: "#e0ddd8" }}>
                <Icon path={paths.play} className="w-[18px] h-[18px]" /> Explore
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-[1100px] mx-auto px-5 mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((stat, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border border-[#f0eeea] text-center hover:-translate-y-1 transition-all duration-200">
                <div className="text-[28px] font-bold" style={{ color: pc }}>{stat.num}</div>
                <div className="text-[12px] text-[#8a8a8a] font-medium mt-0.5">{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="playful-reveal py-20 max-md:py-14" id="about" data-section="about">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-md:gap-8 items-center">
            <div>
              <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pc }}>About us</p>
              <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.15] mb-5">
                Our story of <span className="inline-block" style={{ color: pc }}>growth</span>
              </h2>
              <p className="text-[16px] text-[#6a6a6a] leading-[1.8] mb-6">
                {s.websiteDescription || `${s.schoolName || "Our school"} is dedicated to providing a supportive, challenging environment where every student can thrive.`}
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#f0eeea] text-sm font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ background: pc }} />
                  Est. {s.yearFounded || "1998"}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#f0eeea] text-sm font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ background: pc }} />
                  {s.teachers || stats.teachers || 32} Teachers
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-[#f0eeea] text-sm font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ background: pc }} />
                  {s.studentsEnrolled || stats.studentsEnrolled || 248} Students
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-xl">
                {s.aboutPhotos && s.aboutPhotos.length > 0 ? (
                  <img src={s.aboutPhotos[0].url} alt={s.aboutPhotos[0].caption || ""} className="w-full h-full object-cover" />
                ) : s.heroImageUrl ? (
                  <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: pcl }}>
                    <Icon path={paths.image} className="w-12 h-12" style={{ color: pcm }} />
                  </div>
                )}
              </div>
              {s.aboutPhotos && s.aboutPhotos.length > 1 && (
                <div className="absolute -bottom-4 -left-4 w-2/5 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-xl" style={{ animation: "playful-dance 4s ease-in-out infinite" }}>
                  <img src={s.aboutPhotos[1].url} alt={s.aboutPhotos[1].caption || ""} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 max-md:py-14" style={{ background: "#fff" }}>
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pc }}>Our values</p>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.15]">What makes us <span className="inline-block" style={{ color: pc }}>special</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.slice(0, 4).map((v, i) => (
              <div key={i} className="playful-reveal group bg-[#faf9f7] rounded-3xl p-6 border border-[#f0eeea] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3" style={{ background: pcl }}>
                  <Icon path={paths.sparkle} className="w-5 h-5" style={{ color: pc }} />
                </div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">{v.label || v}</h3>
                <p className="text-[14px] text-[#8a8a8a] leading-relaxed">{v.description || v.desc || ""}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACADEMIC */}
      {(s.examType || s.examPassRate || s.ranking) && (
        <section className="playful-reveal py-20 max-md:py-14" id="academics" data-section="academics">
          <div className="max-w-[1100px] mx-auto px-5">
            <div className="text-center mb-12">
              <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pc }}>Our results</p>
              <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.15]">Academic <span className="inline-block" style={{ color: pc }}>achievements</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {s.examType && (
                <div className="bg-white rounded-3xl p-8 text-center border border-[#f0eeea] shadow-sm">
                  <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-2 text-[#8a8a8a]">Examination</p>
                  <p className="text-2xl font-bold text-[#1a1a1a]">{s.examType}</p>
                </div>
              )}
              {s.examPassRate && (
                <div className="rounded-3xl p-8 text-center border shadow-sm relative overflow-hidden" style={{ background: pcl, borderColor: pcm }}>
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ background: pc, filter: "blur(20px)", animation: "playful-float 4s ease-in-out infinite" }} />
                  <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-2 relative" style={{ color: pcm }}>Pass Rate</p>
                  <p className="text-5xl font-bold relative" style={{ color: pc }}>{s.examPassRate}%</p>
                </div>
              )}
              {s.ranking && (
                <div className="bg-white rounded-3xl p-8 text-center border border-[#f0eeea] shadow-sm">
                  <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-2 text-[#8a8a8a]">Ranking</p>
                  <p className="text-2xl font-bold text-[#1a1a1a]">{s.ranking}</p>
                  {s.rankingCity && <p className="text-[13px] text-[#8a8a8a] mt-1">in {s.rankingCity}</p>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CLASSES */}
      <section className="playful-reveal py-20 max-md:py-14" style={{ background: "#fff" }} id="classes" data-section="classes">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pc }}>Academics</p>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.15]">Our classes &amp; <span className="inline-block" style={{ color: pc }}>streams</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {classesConfig.map((cls, i) => (
              <div key={i} className="playful-reveal bg-[#faf9f7] rounded-3xl p-5 border border-[#f0eeea] transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <span className="inline-block text-[10px] font-semibold tracking-wider uppercase px-3 py-1 rounded-full mb-3" style={{ background: pcl, color: pc }}>{cls.level}</span>
                <h3 className="text-base font-semibold text-[#1a1a1a] mb-2">{cls.name}</h3>
                <p className="text-[12.5px] text-[#8a8a8a] leading-relaxed mb-3">{cls.desc}</p>
                <p className="text-[11px] font-medium" style={{ color: pcm }}>{cls.age}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="playful-reveal py-20 max-md:py-14" id="gallery" data-section="gallery">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pc }}>Gallery</p>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.15]">Life at {s.schoolName?.split(" ")[0] || "School"}</h2>
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {gallery.slice(0, 5).map((img, i) => (
                <div key={i} className={`relative rounded-3xl overflow-hidden group cursor-pointer ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`} style={{ minHeight: i === 0 ? "440px" : "200px" }}>
                  <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {img.caption && <p className="absolute bottom-3 left-3 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">{img.caption}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className={`rounded-3xl flex items-center justify-center ${i === 0 ? "md:col-span-2 md:row-span-2 min-h-[440px]" : "min-h-[200px]"}`} style={{ background: pcl }}>
                  <Icon path={paths.image} className="w-8 h-8" style={{ color: pcm }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="playful-reveal py-20 max-md:py-14 relative overflow-hidden" style={{ background: "#fff" }}>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-[0.04]" style={{ background: pc, filter: "blur(60px)" }} />
        <div className="relative max-w-[640px] mx-auto text-center px-5">
          <div className="flex justify-center gap-1 mb-5" style={{ animation: "playful-wiggle 3s ease-in-out infinite" }}>
            {[...Array(5)].map((_, i) => <span key={i} className="text-xl" style={{ color: pc }}>★</span>)}
          </div>
          <p className="text-[clamp(18px,2.5vw,24px)] font-normal leading-[1.6] text-[#4a4a4a] mb-8" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            &ldquo;{s.schoolName || "School"} gave my children not just an education, but the confidence and skills to succeed anywhere in the world.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold" style={{ background: pc, color: "#fff" }}>{initials}</div>
            <div className="text-left">
              <p className="text-[15px] font-semibold text-[#1a1a1a]">Parent</p>
              <p className="text-[13px] text-[#8a8a8a]">{s.schoolName || "School"} &middot; {location || "City"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="playful-reveal py-20 max-md:py-14" id="contact" data-section="contact">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-md:gap-8">
            <div>
              <p className="text-[11px] font-semibold tracking-[2px] uppercase mb-3" style={{ color: pc }}>Get in touch</p>
              <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.15] mb-5">We'd love to <span className="inline-block" style={{ color: pc }}>hear from you</span></h2>
              <p className="text-[16px] text-[#6a6a6a] leading-[1.7] mb-8 max-w-[420px]">Our admissions team is available Monday to Friday. We welcome families to visit and tour the campus.</p>
              <div className="flex flex-col gap-4">
                {[
                  { path: paths.pin, label: "Address", value: s.address || `${s.city || "City"}, ${s.region || "Region"}` },
                  { path: paths.phone, label: "Phone", value: s.phone || "+237 6XX XXX XXX" },
                  { path: paths.mail, label: "Email", value: s.email || "info@yourschool.cm" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 group">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110" style={{ background: pcl }}>
                      <Icon path={item.path} className="w-5 h-5" style={{ color: pc }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-wider uppercase text-[#8a8a8a] mb-0.5">{item.label}</p>
                      <p className="text-[15px] font-medium text-[#1a1a1a]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl min-h-[300px] flex items-center justify-center flex-col gap-3 border-2 border-dashed" style={{ background: pcl, borderColor: pcm }}>
              <Icon path={paths.pin} className="w-10 h-10" style={{ color: pc }} />
              <p className="text-[14px] font-medium" style={{ color: pcm }}>{s.schoolName || "School"} &middot; {location || "City"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#f0eeea]">
        <div className="max-w-[1100px] mx-auto px-5 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: pc }}>
                  <Icon path={paths.building} className="w-4 h-4 text-white" />
                </div>
                <span className="text-[16px] font-semibold text-[#1a1a1a]">{s.schoolName || "School"}</span>
              </div>
              <p className="text-[13px] text-[#8a8a8a] leading-relaxed">Shaping leaders since {s.yearFounded || "1998"}.</p>
            </div>
            {[
              { title: "Navigate", links: [{ label: "About", href: "#about" }, { label: "Classes", href: "#classes" }, { label: "Gallery", href: "#gallery" }, { label: "Contact", href: "#contact" }] },
              { title: "For Parents", links: [{ label: "Portal", href: "/login" }, { label: "Fees", href: "/login" }, { label: "Calendar", href: "#" }] },
              { title: "Academic", links: [{ label: "Curriculum", href: "#classes" }, { label: "Results", href: "#academics" }, { label: "Admissions", href: "#contact" }] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-[12px] font-semibold tracking-wider uppercase mb-4" style={{ color: pcm }}>{col.title}</p>
                <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                  {col.links.map((link, j) => (
                    <li key={j}><a href={link.href} className="text-[14px] text-[#8a8a8a] no-underline hover:text-[var(--p)] transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#f0eeea] pt-6 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
            <p className="text-[13px] text-[#8a8a8a]">&copy; {year} {s.schoolName || "School"}. All rights reserved.</p>
            <p className="text-[13px] text-[#8a8a8a]">Powered by <strong className="font-semibold" style={{ color: pc }}>Akademee</strong></p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#f0eeea] p-3 pb-[max(12px,env(safe-area-inset-bottom))] flex gap-2.5" style={{ backdropFilter: "blur(12px)" }}>
        <a href="/login" className="flex-1 h-12 flex items-center justify-center rounded-full text-[14px] font-semibold text-white no-underline shadow-lg" style={{ background: pc, boxShadow: `0 4px 12px ${pcm}` }}>Login</a>
        <a href="#contact" className="flex-1 h-12 flex items-center justify-center rounded-full text-[14px] font-medium text-[#1a1a1a] no-underline border-2 border-[#e0ddd8]">Contact</a>
      </div>
    </div>
  );
}
