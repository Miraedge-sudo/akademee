import { useState, useEffect } from "react";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ModernTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const primaryMid = hexToRgba(pc, 0.6);
  const primaryLight = hexToRgba(pc, 0.08);
  const primaryText = hexToRgba(pc, 0.75);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");
  const initials = (s.schoolName || "SC").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".modern-reveal");
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("modern-visible"); });
    }, { threshold: 0.08 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const stats = s.websiteStats || {};
  const examType = s.examType || 'GCE';
  const examPassRate = s.examPassRate || '94%';
  const statItems = [
    { num: stats.studentsEnrolled || 248, lbl: "Students enrolled" },
    { num: stats.teachers || 32, lbl: "Qualified teachers" },
    { num: examPassRate, lbl: `${examType} pass rate 2025` },
    { num: stats.yearsOfOperation || s.yearFounded || 27, lbl: "Years of excellence" },
  ];

  const values = s.websiteValues?.length > 0 ? s.websiteValues : [
    { label: "Excellence", description: "Highest academic standards in every subject" },
    { label: "Community", description: "A welcoming family-centred environment" },
    { label: "Bilingual", description: "English & French instruction throughout" },
    { label: "Achievement", description: "94% GCE pass rate, consistently top results" },
  ];

  const classesConfig = s.classesConfig?.length > 0 ? s.classesConfig : [
    {level:"Junior",name:"Form 1 & 2",desc:"Foundation years. Core subjects: English, French, Maths, Science, History.",age:"Ages 12–13"},
    {level:"Junior",name:"Form 3 & 4",desc:"GCE O/L preparation begins. Science and Arts streams introduced.",age:"Ages 14–15"},
    {level:"O Level",name:"Form 5",desc:"GCE Ordinary Level examination year. Intensive exam preparation.",age:"Age 16"},
    {level:"A Level",name:"Lower Sixth",desc:"Advanced Level entry. Science, Arts and Commercial streams.",age:"Age 17"},
    {level:"A Level",name:"Upper Sixth",desc:"GCE Advanced Level examination. University entrance preparation.",age:"Age 18"},
  ];

  const gallery = s.gallery || [];

  const S = ({ d, className, color }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5"} dangerouslySetInnerHTML={{ __html: d }} />
  );

  const I = {
    building: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.95a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    play: '<polygon points="10 8 16 12 10 16 10 8"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    grad: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    books: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  };

  return (
    <div className="font-sans text-[#2A3029] bg-white antialiased overflow-hidden" style={{ "--p": pc, "--pm": primaryMid, "--pl": primaryLight, "--pt": primaryText }}>
      <style>{`.modern-reveal{opacity:0;transform:translateY(24px);transition:opacity .55s ease,transform .55s ease}.modern-reveal.modern-visible{opacity:1;transform:translateY(0)}`}</style>

      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-shadow ${scrolled?"shadow-lg":""}`}
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="flex items-center h-[68px] gap-8">
            <a href="#" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
              <div className="w-[38px] h-[38px] rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}>
                {!s.logoUrl && <S d={I.building} className="w-5 h-5" color={primaryText} />}
              </div>
              <div>
                <div className="text-[17px] font-display font-medium text-[#181C19] leading-tight">{s.schoolName || "School Name"}</div>
                <div className="text-[11px] text-[#9BA59C]">{location || s.city || "Campus"}</div>
              </div>
            </a>
            <ul className="hidden md:flex items-center gap-1 flex-1 justify-center list-none m-0 p-0">
              {["About","Classes","Gallery","Contact"].map(item => (
                <li key={item}><a href={`#${item.toLowerCase()}`} className="text-[14px] font-medium text-[#5C665E] px-3.5 py-2 rounded-md no-underline transition-colors hover:text-[var(--p)]">{item}</a></li>
              ))}
            </ul>
            <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
              <a href="/login" className="h-[38px] px-[18px] border-[1.5px] rounded-xl text-[13.5px] font-medium no-underline inline-flex items-center" style={{ borderColor: pc, color: pc }}>Parent login</a>
              <a href="/login" className="h-[38px] px-[18px] rounded-xl text-[13.5px] font-medium text-white no-underline inline-flex items-center gap-1.5" style={{ background: pc }}>
                <S d={I.login} className="w-[15px] h-[15px]" color="white" /> Student portal
              </a>
            </div>
            <button onClick={() => setMobileOpen(v => !v)} aria-label="Menu"
              className="md:hidden w-10 h-10 border-none bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[5px] rounded-md ml-auto">
              <span className="block w-[22px] h-[2px] bg-[#2A3029] rounded transition-all duration-200" style={{ transform: mobileOpen ? "rotate(45deg) translate(5px,5px)" : "" }} />
              <span className="block w-[22px] h-[2px] bg-[#2A3029] rounded transition-all duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span className="block w-[22px] h-[2px] bg-[#2A3029] rounded transition-all duration-200" style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px,-5px)" : "" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-40 bg-white pt-[68px] px-6 pb-5 flex-col gap-1 border-t border-[#EEF0EC] ${mobileOpen?"flex":"hidden"}`}>
        {["About","Classes","Gallery","Contact"].map(item => (
          <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileOpen(false)}
            className="text-[16px] font-medium text-[#2A3029] py-3.5 px-3 rounded-xl no-underline border-b border-[#EEF0EC] hover:text-[var(--p)]">{item}</a>
        ))}
        <div className="flex flex-col gap-2.5 mt-4">
          <a href="/login" className="h-12 flex items-center justify-center rounded-xl text-[15px] font-semibold text-white no-underline" style={{ background: pc }}>Student portal</a>
          <a href="/login" className="h-12 flex items-center justify-center rounded-xl text-[15px] font-medium no-underline border-[1.5px]" style={{ borderColor: pc, color: pc }}>Parent login</a>
        </div>
      </div>

      {/* HERO */}
      <section className="pt-[68px] min-h-screen flex items-center bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[52%] h-full z-0 max-md:hidden" style={{ background: pc, clipPath: "polygon(8% 0%,100% 0%,100% 100%,0% 100%)" }} />
        <div className="relative z-10 w-full max-w-[1140px] mx-auto px-6 py-20 max-md:py-12 max-md:text-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] max-md:gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-wider uppercase mb-5" style={{ background: primaryLight, color: pc }}>
                <span className="w-[6px] h-[6px] rounded-full" style={{ background: primaryMid }} />
                Anglophone &middot; Bilingual &middot; Excellence
              </div>
              <h1 className="font-display text-[clamp(36px,5vw,58px)] font-bold text-[#2A3029] leading-[1.12] mb-5">
                Shaping the leaders<br />of <em className="italic" style={{ color: primaryMid }}>tomorrow</em>,<br />today.
              </h1>
              <p className="text-[16px] text-[#5C665E] leading-[1.7] mb-8 max-w-[440px] max-md:mx-auto">
                {s.websiteDescription || `${s.schoolName||"Our school"} provides world-class education preparing students for a global future.`}
              </p>
              <div className="flex items-center gap-3.5 flex-wrap max-md:justify-center">
                <a href="#contact" className="h-[52px] px-7 rounded-xl text-[15px] font-semibold text-white no-underline inline-flex items-center gap-2.5 active:scale-[0.98]" style={{ background: pc }}>
                  <S d={I.phone} className="w-[18px] h-[18px]" color="white" /> Enrol now
                </a>
                <a href="#about" className="h-[52px] px-6 rounded-xl text-[15px] font-medium no-underline inline-flex items-center gap-2.5" style={{ border: "1.5px solid #D8DBD5", color: "#2A3029" }}>
                  <S d={I.play} className="w-[18px] h-[18px]" /> Discover our school
                </a>
              </div>
              <div className="flex gap-7 mt-11 pt-8 border-t border-[#EEF0EC] max-md:justify-center max-md:flex-wrap max-md:gap-5">
                {statItems.slice(0,3).map((stat,i) => (
                  <div key={i}>
                    <div className="font-display text-[32px] font-bold text-[#2A3029] leading-none">{stat.num}</div>
                    <div className="text-[13px] text-[#9BA59C] mt-1">{stat.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-full max-w-[460px] aspect-[4/5] rounded-[28px] overflow-hidden relative">
                {/* Background image (hero2) */}
                {s.heroImageUrl2 ? (
                  <img src={s.heroImageUrl2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                ) : (
                  <div className="absolute inset-0 w-full h-full"
                    style={{ background: `linear-gradient(135deg,${primaryMid} 0%,${pc} 40%,#04342C 100%)` }} />
                )}
                {/* Foreground image (hero) */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {s.heroImageUrl ? (
                    <img src={s.heroImageUrl} alt={s.schoolName} className="w-[85%] h-[85%] object-cover rounded-[20px] shadow-2xl" />
                  ) : (
                    <div className="w-[85%] h-[85%] flex flex-col items-center justify-center gap-3 rounded-[20px]"
                      style={{ background: `linear-gradient(135deg,${pc},${primaryMid})` }}>
                      <S d={I.building} className="w-16 h-16 opacity-30" color="white" />
                      <span className="text-[13px] text-white/40">School photo</span>
                    </div>
                  )}
                </div>
              </div>
              {s.ranking && (
                <div className="absolute -bottom-4 -left-5 bg-white rounded-xl p-3.5 pr-[18px] shadow-[0-8px_32px_rgba(0,0,0,0.12)] flex items-center gap-3 max-md:hidden">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: primaryLight }}>
                    <S d={I.grad} className="w-5 h-5" color={pc} />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#2A3029]">{s.ranking}</div>
                    <div className="text-[11.5px] text-[#9BA59C]">{s.rankingCity ? `Schools in ${s.rankingCity}` : 'Schools in your city'}</div>
                  </div>
                </div>
              )}
              {s.yearFounded && (
                <div className="absolute top-5 -right-4 rounded-xl px-4 py-2.5 text-[13px] font-semibold shadow-lg max-md:top-auto max-md:bottom-3 max-md:right-3" style={{ background: pc, color: primaryText }}>
                  Est. {s.yearFounded}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="modern-reveal" style={{ background: pc }}>
        <div className="max-w-[1140px] mx-auto px-6 py-[60px] max-md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-md:gap-8 text-center">
            {statItems.map((stat,i) => (
              <div key={i}>
                <div className="font-display text-[48px] max-md:text-[36px] font-bold text-white leading-none mb-2">{stat.num}</div>
                <div className="text-[14px] text-white/80 font-medium">{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="modern-reveal py-[100px] max-md:py-[72px]" style={{ background: "#F7F8F6" }} id="about">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-md:gap-12 items-center">
            <div>
              <div className="text-[11.5px] font-semibold tracking-[1px] uppercase mb-3" style={{ color: primaryMid }}>About us</div>
              <h2 className="font-display text-[clamp(28px,4vw,42px)] font-bold text-[#2A3029] leading-[1.2] mb-4">A legacy of academic excellence in Cameroon</h2>
              <p className="text-[16px] text-[#5C665E] leading-[1.75] max-w-[560px]">
                {s.websiteDescription || `${s.schoolName||"Our school"} is one of the most respected institutions, combining rigorous academic standards with a nurturing environment.`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-9">
                {values.slice(0,4).map((v,i) => (
                  <div key={i} className="bg-white border border-[#EEF0EC] rounded-xl p-[18px] transition-colors hover:border-[var(--p)]">
                    <div className="w-[38px] h-[38px] rounded-md flex items-center justify-center mb-3" style={{ background: primaryLight }}>
                      <S d={I.star} className="w-[19px] h-[19px]" color={pc} />
                    </div>
                    <div className="text-[14px] font-semibold text-[#2A3029] mb-1">{v.label||v}</div>
                    <div className="text-[12.5px] text-[#9BA59C] leading-relaxed">{v.description||v.desc||""}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[520px] max-md:hidden">
              <div className="absolute top-0 left-0 w-[62%] aspect-[4/3] rounded-[20px] overflow-hidden"
                style={{ background: s.heroImageUrl ? "transparent" : pc }}>
                {s.heroImageUrl ? <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg,${pc},${primaryMid})` }}>
                    <S d={I.books} className="w-10 h-10 opacity-25" color="white" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-[54%] aspect-[3/4] rounded-[20px] overflow-hidden" style={{ background: primaryMid }}>
                {s.aboutPhotos && s.aboutPhotos.length > 1 ? (
                  <img src={s.aboutPhotos[1].url} alt="" className="w-full h-full object-cover" />
                ) : s.aboutPhotos && s.aboutPhotos.length > 0 ? (
                  <img src={s.aboutPhotos[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <S d={I.users} className="w-10 h-10 opacity-25" color="white" />
                  </div>
                )}
              </div>
              <div className="absolute top-1/2 -right-2 -translate-y-1/2 bg-white rounded-xl px-5 py-4 shadow-[0_8px_28px_rgba(0,0,0,0.1)] text-center z-10">
                <div className="font-display text-[36px] font-bold leading-none" style={{ color: pc }}>{examPassRate}</div>
                <div className="text-[12px] text-[#9BA59C] mt-1">{examType} results 2025</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLASSES */}
      <section className="modern-reveal py-[100px] max-md:py-[72px] bg-white" id="classes">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="flex items-end justify-between mb-12 gap-5 max-md:flex-col max-md:items-start">
            <div>
              <div className="text-[11.5px] font-semibold tracking-[1px] uppercase mb-3" style={{ color: primaryMid }}>Academics</div>
              <h2 className="font-display text-[clamp(28px,4vw,42px)] font-bold text-[#2A3029] leading-[1.2]">Our classes &amp; levels</h2>
            </div>
            <a href="#" className="text-[14px] font-medium no-underline flex items-center gap-1.5 whitespace-nowrap" style={{ color: primaryMid }}>
              Full programme <S d={I.arrow} className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {classesConfig.map((cls,i) => (
              <div key={i} className="border-[1.5px] border-[#EEF0EC] rounded-[20px] p-6 cursor-pointer bg-white transition-all hover:border-[var(--p)] hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(8,80,65,0.08)]">
                <div className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-[0.5px] mb-3.5" style={{ background: primaryLight, color: pc }}>{cls.level}</div>
                <div className="font-display text-xl font-medium text-[#2A3029] mb-2">{cls.name}</div>
                <div className="text-[13px] text-[#9BA59C] leading-relaxed mb-4">{cls.desc}</div>
                <div className="flex items-center gap-3 text-[12.5px] text-[#5C665E]">
                  <S d={I.users} className="w-[13px] h-[13px]" /> {cls.age}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="modern-reveal py-[100px] max-md:py-[72px]" style={{ background: "#F7F8F6" }} id="gallery">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-[11.5px] font-semibold tracking-[1px] uppercase mb-3" style={{ color: primaryMid }}>Gallery</div>
            <h2 className="font-display text-[clamp(28px,4vw,42px)] font-bold text-[#2A3029] leading-[1.2]">Life at {s.schoolName?.split(" ")[0]||"our school"}</h2>
            <p className="text-[16px] text-[#5C665E] leading-[1.75] max-w-[560px] mx-auto mt-2">A glimpse into our vibrant school community, classrooms, and campus.</p>
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 md:grid-rows-[240px_240px] gap-3.5">
              {gallery.slice(0,5).map((g,i) => (
                <div key={i} className="rounded-[20px] overflow-hidden transition-transform hover:scale-[1.01]"
                  style={{ gridColumn: i===0?"1":i===3?"3":"", gridRow: i===0?"1/3":i===3?"1/3":"" }}>
                  <img src={g.url} alt={g.caption||""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 md:grid-rows-[240px_240px] gap-3.5">
              {["Campus entrance","Classroom","Students","Sports day","Graduation"].map((label,n) => (
                <div key={n} className="rounded-[20px] overflow-hidden transition-transform hover:scale-[1.01]"
                  style={{ gridColumn: n===0?"1":n===3?"3":"", gridRow: n===0?"1/3":n===3?"1/3":"",
                    background: `linear-gradient(135deg,${pc},${primaryMid})`, opacity: 1-(n+1)*0.12 }}>
                  <div className="w-full h-full flex items-center justify-center flex-col gap-2">
                    <S d={I.image} className="w-9 h-9 opacity-25" color="white" />
                    <span className="text-[12px] text-white/30">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="modern-reveal relative overflow-hidden" style={{ background: pc }}>
        <div className="absolute top-[-40px] left-10 font-display text-[320px] font-bold text-white/5 leading-none pointer-events-none">&ldquo;</div>
        <div className="relative max-w-[760px] mx-auto text-center py-[100px] max-md:py-[72px] px-6">
          <p className="font-display text-[clamp(20px,3vw,28px)] italic font-normal text-white leading-[1.55] mb-8">
            &ldquo;{s.schoolName||"Our school"} gave my children not just an education, but the confidence and skills to succeed anywhere in the world.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3.5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-semibold" style={{ background: primaryMid, color: primaryText }}>
              {initials||"SC"}
            </div>
            <div className="text-left">
              <div className="text-[15px] font-semibold text-white">Parent</div>
              <div className="text-[13px] opacity-70" style={{ color: primaryText }}>{s.schoolName||"School"} &middot; Douala</div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="modern-reveal py-[100px] max-md:py-[72px] bg-white" id="contact">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-20 max-md:gap-12 items-start">
            <div>
              <div className="text-[11.5px] font-semibold tracking-[1px] uppercase mb-3" style={{ color: primaryMid }}>Contact us</div>
              <h2 className="font-display text-[clamp(28px,4vw,42px)] font-bold text-[#2A3029] leading-[1.2] mb-4">Come visit our campus</h2>
              <p className="text-[16px] text-[#5C665E] leading-[1.75] max-w-[400px]">We welcome families to visit. Our admissions team is available Monday to Friday.</p>
              <div className="mt-8 flex flex-col gap-5">
                {[
                  {d:I.pin,label:"Address",value:s.address||`${s.city||"Douala"}, ${s.region||"Littoral Region"}`},
                  {d:I.phone,label:"Phone",value:s.phone||"+237 6XX XXX XXX"},
                  {d:I.mail,label:"Email",value:s.email||"info@yourschool.cm"},
                  {d:I.clock,label:"Office hours",value:"Mon \u2013 Fri \u00b7 7:30 AM \u2013 4:00 PM"},
                ].map((item,i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className="w-[42px] h-[42px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: primaryLight }}>
                      <S d={item.d} className="w-5 h-5" color={pc} />
                    </div>
                    <div>
                      <div className="text-[12px] text-[#9BA59C] font-medium uppercase tracking-[0.5px] mb-1">{item.label}</div>
                      <div className="text-[15px] text-[#2A3029] font-medium">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[20px] overflow-hidden aspect-[16/10] flex items-center justify-center flex-col gap-3 border-[1.5px]"
              style={{ background: primaryLight, borderColor: primaryText }}>
              <S d={I.pin} className="w-10 h-10" color={pc} />
              <p className="text-[14px] font-medium" style={{ color: pc }}>{s.schoolName||"School"} &middot; {location||"City"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#181C19" }}>
        <div className="max-w-[1140px] mx-auto px-6 pt-[60px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-md:gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-[34px] h-[34px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: primaryMid }}>
                  <S d={I.building} className="w-[17px] h-[17px]" color="white" />
                </div>
                <span className="font-display text-[17px] text-white">{s.schoolName||"School"}</span>
              </div>
              <p className="text-[14px] text-[#6B7280] leading-relaxed max-w-[280px]">Shaping the leaders of tomorrow since {s.yearFounded||"1998"}.</p>
            </div>
            {[
              {title:"Quick links",links:["About","Classes","Gallery","Contact"].map(l=>({label:l,href:`#${l.toLowerCase()}`}))},
              {title:"Portals",links:["Student portal","Parent login","Teacher login","Admin dashboard"].map(l=>({label:l,href:"/login"}))},
              {title:"Academic",links:["Timetable","Fees structure","GCE results","Admissions"].map(l=>({label:l,href:"#"}))},
            ].map((col,i) => (
              <div key={i}>
                <p className="text-[13px] font-semibold text-white tracking-[0.3px] mb-4">{col.title}</p>
                <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                  {col.links.map((link,j) => (
                    <li key={j}><a href={link.href} className="text-[14px] text-[#6B7280] no-underline hover:text-[var(--pt)] transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] py-5 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
            <p className="text-[13px] text-[#4B5563]">&copy; {year} {s.schoolName||"School"}. All rights reserved.</p>
            <div className="inline-flex items-center gap-1.5 text-[12.5px] text-[#4B5563] bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/[0.06]">
              Managed with <strong className="font-semibold" style={{ color: primaryText }}>Akademee</strong> &middot; akademee.cm
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EEF0EC] p-3 pb-[max(12px,env(safe-area-inset-bottom))] flex gap-2.5">
        <a href="/login" className="flex-1 h-[46px] flex items-center justify-center rounded-xl text-[14.5px] font-semibold text-white no-underline" style={{ background: pc }}>Student portal</a>
        <a href="#contact" className="flex-1 h-[46px] flex items-center justify-center rounded-xl text-[14.5px] font-medium no-underline border-[1.5px]" style={{ borderColor: pc, color: pc }}>Contact us</a>
      </div>
    </div>
  );
}
