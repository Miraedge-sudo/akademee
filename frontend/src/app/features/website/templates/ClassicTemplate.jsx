import { useState, useEffect } from "react";

export default function ClassicTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".classic-reveal");
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("classic-visible"); });
    }, { threshold: 0.08 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const stats = s.websiteStats || {};
  const statItems = [
    { num: stats.studentsEnrolled || 248, lbl: "Students enrolled" },
    { num: stats.teachers || 32, lbl: "Qualified teachers" },
    { num: stats.gcePassRate ? `${stats.gcePassRate}%` : "94%", lbl: "GCE pass rate" },
    { num: stats.yearsOfOperation || s.yearFounded || 27, lbl: "Years of excellence" },
  ];

  const classes = [
    { level: "Junior", num: "1\u20132", name: "Form 1 & Form 2", desc: "Foundation years introducing the anglophone curriculum. Core subjects: English Language, French, Mathematics, Science, History & Geography.", age: "Ages 12\u201313", cls: "2 classes" },
    { level: "Junior", num: "3\u20134", name: "Form 3 & Form 4", desc: "GCE O/L preparation begins. Science and Arts streams introduced. Elective subjects added to core curriculum.", age: "Ages 14\u201315", cls: "2 classes" },
    { level: "O Level", num: "5", name: "Form 5 \u2014 GCE Ordinary Level", desc: "Examination year. Intensive preparation for the General Certificate of Education Ordinary Level.", age: "Age 16", cls: "1 class" },
    { level: "A Level", num: "L6", name: "Lower Sixth Form", desc: "Advanced Level entry year. Science, Arts and Commercial streams. Students select 3\u20134 principal subjects.", age: "Age 17", cls: "3 streams" },
    { level: "A Level", num: "U6", name: "Upper Sixth Form", desc: "GCE Advanced Level examination. University entrance preparation. Pastoral care and career guidance.", age: "Age 18", cls: "3 streams" },
  ];

  return (
    <div className="font-sans antialiased overflow-hidden" style={{ "--gold": pc, "--gold-light": pc+"BF", "--gold-muted": pc+"26", "--ink": "#1A1710", "--cream": "#FAF8F3", "--cream-dark": "#F0EBE0", "--border": pc+"33", "--gray": "#8A8470" }}>
      <style>{`
        .classic-reveal{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}
        .classic-reveal.classic-visible{opacity:1;transform:none}
        .classic-reveal-delay-1{transition-delay:.1s}
        .classic-reveal-delay-2{transition-delay:.2s}
        .classic-reveal-delay-3{transition-delay:.3s}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      `}</style><style dangerouslySetInnerHTML={{__html:"@keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)}}"}} />

      {/* NAV */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled?"py-3 shadow-[0_1px_0_var(--border)]":"py-5"}`}
        style={{ background: scrolled ? "rgba(26,23,16,0.97)" : "transparent", backdropFilter: scrolled ? "blur(10px)" : "none" }}>
        <div className="max-w-[1160px] mx-auto px-7">
          <div className="flex items-center justify-between gap-6">
            <ul className="hidden md:flex items-center gap-0 list-none m-0 p-0">
              {["About","Academics","Gallery"].map(item => (
                <li key={item}><a href={`#${item.toLowerCase()==="academics"?"classes":item.toLowerCase()}`}
                  className="text-[11.5px] font-medium tracking-[1.5px] uppercase no-underline px-4 py-2 relative text-white/70 hover:text-white transition-colors"
                  style={{ letterSpacing: "1.5px" }}>{item}</a></li>
              ))}
            </ul>
            <a href="#" className="flex flex-col items-center gap-1 no-underline">
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 flex-shrink-0 hover:scale-105 transition-transform"
                style={{ background: pc, borderColor: pc+"BF" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1A1710" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div className="text-center">
                <div className="text-[15px] font-semibold text-white leading-tight" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{s.schoolName||"School"}</div>
                <div className="text-[9.5px] tracking-[2px] uppercase mt-0.5" style={{ color: pc+"BF" }}>Est. {s.yearFounded||"1998"} &middot; {s.city||"Douala"}</div>
              </div>
            </a>
            <div className="hidden md:flex items-center gap-2.5">
              <a href="#contact" className="h-9 px-[18px] border rounded-sm text-[11px] font-medium tracking-[1.5px] uppercase no-underline inline-flex items-center transition-colors"
                style={{ borderColor: pc+"80", color: pc+"BF" }}
                onMouseOver={e => { e.target.style.background = pc+"26"; e.target.style.borderColor = pc }}
                onMouseOut={e => { e.target.style.background = "transparent"; e.target.style.borderColor = pc+"80" }}>
                Contact us
              </a>
              <a href="/login" className="h-9 px-[18px] rounded-sm text-[11px] font-semibold tracking-[1.5px] uppercase no-underline inline-flex items-center gap-1.5 transition-transform active:scale-[0.98]"
                style={{ background: pc, color: "#1A1710" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[13px] h-[13px]">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Student portal
              </a>
            </div>
            <button onClick={() => setMobileOpen(v=>!v)} aria-label="Menu"
              className="md:hidden w-10 h-10 border-none bg-transparent cursor-pointer flex flex-col items-end justify-center gap-[5px] rounded-sm">
              <span className="block h-[1.5px] bg-white rounded transition-all" style={{ width: mobileOpen?"24px":"24px", transform: mobileOpen?"rotate(45deg) translate(5px,5px)":"" }} />
              <span className="block h-[1.5px] bg-white rounded transition-all" style={{ width: mobileOpen?"24px":"18px", opacity: mobileOpen?0:1 }} />
              <span className="block h-[1.5px] bg-white rounded transition-all" style={{ width: mobileOpen?"24px":"24px", transform: mobileOpen?"rotate(-45deg) translate(5px,-5px)":"" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className={`fixed inset-0 z-40 flex-col pt-[100px] px-8 pb-10 ${mobileOpen?"flex":"hidden"}`} style={{ background: "#1A1710" }}>
        {["About","Academics","Gallery","Contact"].map(item => (
          <a key={item} href={`#${item.toLowerCase()==="academics"?"classes":item.toLowerCase()}`} onClick={()=>setMobileOpen(false)}
            className="text-[28px] italic py-3 border-b border-[var(--border)] text-white/80 hover:text-[var(--gold-light)] transition-colors no-underline"
            style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{item}</a>
        ))}
        <div className="flex flex-col gap-2.5 mt-8">
          <a href="/login" className="h-[52px] flex items-center justify-center rounded-sm text-[12px] font-semibold tracking-[1.5px] uppercase no-underline" style={{ background: pc, color: "#1A1710" }}>Student portal</a>
          <a href="#contact" className="h-[52px] flex items-center justify-center rounded-sm text-[12px] font-medium tracking-[1.5px] uppercase no-underline border" style={{ borderColor: pc+"80", color: pc+"BF" }}>Contact us</a>
        </div>
      </div>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0" style={{
          background: `linear-gradient(to bottom,rgba(10,9,6,0.72) 0%,rgba(10,9,6,0.55) 40%,rgba(10,9,6,0.78) 80%,rgba(10,9,6,0.92) 100%),linear-gradient(135deg,#2A2510 0%,#1A1608 30%,#0A0904 60%,#1E1C0E 100%)`
        }} />
        <div className="absolute inset-0 z-[1] opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, ${pc} 0%, transparent 50%),radial-gradient(circle at 75% 75%, ${pc} 0%, transparent 50%)`
        }} />
        <div className="absolute inset-[40px] z-[2] pointer-events-none border" style={{ borderColor: pc+"33" }}>
          <div className="absolute inset-[8px] border" style={{ borderColor: pc+"1A" }} />
        </div>
        {["tl","tr","bl","br"].map(corner => (
          <div key={corner} className={`absolute w-8 h-8 z-[3] ${corner.includes("t")?"top-8":"bottom-8"} ${corner.includes("l")?"left-8":"right-8"}`}
            style={{ borderTop: corner.includes("t")?"2px solid "+pc:"none", borderLeft: corner.includes("l")?"2px solid "+pc:"none", borderRight: corner.includes("r")?"2px solid "+pc:"none", borderBottom: corner.includes("b")?"2px solid "+pc:"none" }} />
        ))}
        <div className="relative z-[4] text-center px-6 py-20 max-w-[860px] mx-auto" style={{ paddingTop: "120px", paddingBottom: "160px" }}>
          <div className="inline-flex items-center gap-2.5 border px-5 py-[7px] mb-7 text-[10px] font-medium tracking-[2.5px] uppercase" style={{ borderColor: pc+"59", color: pc+"BF" }}>
            <span className="w-1 h-1 rounded-full" style={{ background: pc }} />
            Anglophone &middot; Bilingual &middot; Excellence
            <span className="w-1 h-1 rounded-full" style={{ background: pc }} />
          </div>
          <h1 className="text-[clamp(46px,8vw,88px)] font-bold text-white leading-[1.05] tracking-[-0.5px] mb-2"
            style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            {s.schoolName?.split(" ")[0]||"Grace Bilingual"}<br />
            <span className="italic font-normal block text-[0.85em]" style={{ color: pc+"BF" }}>{s.schoolName?.split(" ").slice(1).join(" ")||"Academy"}</span>
          </h1>
          <div className="flex items-center gap-4 mx-auto my-6 w-fit">
            <div className="w-[60px] h-px opacity-50" style={{ background: pc }} />
            <div className="w-2 h-2 rotate-45 flex-shrink-0" style={{ background: pc }} />
            <div className="w-[60px] h-px opacity-50" style={{ background: pc }} />
          </div>
          <p className="text-[clamp(14px,1.8vw,17px)] font-light tracking-[0.8px] text-white/60 leading-[1.8] max-w-[560px] mx-auto mb-9">
            {s.tagline || `${s.schoolName||"Our school"} provides world-class education through academic rigour, bilingual excellence, and a tradition of achievement.`}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="#contact" className="h-[54px] px-9 rounded-sm text-[11.5px] font-semibold tracking-[2px] uppercase no-underline inline-flex items-center gap-2.5 active:scale-[0.98] transition-transform"
              style={{ background: pc, color: "#1A1710" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.95a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Enrol now
            </a>
            <a href="#about" className="h-[54px] px-9 rounded-sm text-[11.5px] font-medium tracking-[2px] uppercase no-underline inline-flex items-center gap-2.5 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.8)" }}>
              Discover our heritage
            </a>
          </div>
        </div>
        {/* Stats strip */}
        <div className="absolute bottom-0 left-0 right-0 z-[4] backdrop-blur border-t" style={{ background: pc+"14", borderColor: pc+"33" }}>
          <div className="max-w-[1160px] mx-auto grid grid-cols-2 md:grid-cols-4">
            {statItems.map((stat,i) => (
              <div key={i} className="py-[22px] px-7 text-center max-md:py-4 max-md:px-5" style={{ borderRight: i<3 ? `1px solid ${pc+"26"}` : "none" }}>
                <div className="text-[36px] max-md:text-[28px] font-bold leading-none mb-1" style={{ color: pc+"BF", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{stat.num}</div>
                <div className="text-[10px] font-medium tracking-[1.5px] uppercase text-white/45">{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-[110px] left-1/2 -translate-x-1/2 z-[4] flex flex-col items-center gap-1.5 max-md:hidden" style={{ animation: "bounce 2s ease-in-out infinite" }}>
          <span className="text-[9px] tracking-[2px] uppercase text-white/30">Scroll</span>
          <svg viewBox="0 0 24 24" fill="none" stroke={pc+"80"} strokeWidth="1.5" strokeLinecap="round" className="w-[18px] h-[18px]">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ background: pc }}>
        <div className="py-3 overflow-hidden border-y" style={{ borderColor: pc+"BF" }}>
          <div className="flex whitespace-nowrap" style={{ animation: "marquee 30s linear infinite" }}>
            {[...Array(2)].flatMap(() => ["Academic Excellence","Bilingual Education","GCE Ordinary Level","GCE Advanced Level","Est. 1998","94% Pass Rate","Top 5 in Douala"]).map((item,i) => (
              <div key={i} className="flex items-center gap-3.5 px-7 text-[10.5px] font-semibold tracking-[2px] uppercase flex-shrink-0" style={{ color: "#1A1710" }}>
                {item}
                <span className="text-[16px] opacity-35" style={{ color: "#1A1710" }}>&#10022;</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ABOUT */}
      <section className="classic-reveal py-[110px]" style={{ background: "#FAF8F3" }} id="about">
        <div className="max-w-[1160px] mx-auto px-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[90px] max-md:gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-medium tracking-[2.5px] uppercase" style={{ color: pc }}>Our heritage</span>
                <div className="flex-1 h-px opacity-50" style={{ background: pc+"BF" }} />
              </div>
              <h2 className="text-[clamp(30px,4vw,48px)] font-semibold leading-[1.15] mb-5" style={{ color: "#1A1710", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
                A legacy built on<br /><em className="italic" style={{ color: pc }}>discipline &amp; vision</em>
              </h2>
              <p className="text-[15px] font-light leading-[1.85] mb-4" style={{ color: "#4A4535" }}>
                Founded in {s.yearFounded||"1998"}, {s.schoolName||"our school"} has grown from a small institution to one of the most respected secondary schools. For over two decades, we have upheld a singular commitment: delivering world-class education through bilingual instruction, rigorous academics, and the development of character.
              </p>
              <div className="my-7 py-5 px-6 border-l-[3px]" style={{ background: pc+"0D", borderColor: pc }}>
                <p className="text-[20px] italic leading-[1.5]" style={{ color: "#2E2B22", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
                  &ldquo;We do not simply teach subjects — we shape citizens who will lead Cameroon and the world.&rdquo;
                </p>
                <cite className="text-[12px] not-italic mt-2 block" style={{ color: "#8A8470" }}>— The Principal, {s.schoolName||"School"}</cite>
              </div>
              <p className="text-[15px] font-light leading-[1.85]" style={{ color: "#4A4535" }}>
                Our {stats.teachers||32} qualified educators bring expertise across sciences, arts, and commercial streams, guiding students through GCE examinations.
              </p>
            </div>
            <div className="relative max-md:hidden">
              <div className="relative p-4 border" style={{ borderColor: pc+"33" }}>
                <div className="absolute -inset-2 pointer-events-none border" style={{ borderColor: pc+"1A" }} />
                <div className="aspect-[4/5] flex items-center justify-center flex-col gap-2.5"
                  style={{ background: `linear-gradient(135deg,#2A2510,#1A1608)` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={pc+"33"} strokeWidth="1.2" strokeLinecap="round" className="w-12 h-12">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <span className="text-[11px] tracking-[1px]" style={{ color: pc+"33" }}>School photo</span>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 p-5 shadow-lg" style={{ background: pc }}>
                <div className="text-[40px] font-bold leading-none" style={{ color: "#1A1710", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>A+</div>
                <div className="text-[10px] tracking-[1.5px] uppercase mt-1" style={{ color: "#1A1710A6" }}>GCE Results 2025</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="classic-reveal py-[90px]" style={{ background: "#1A1710" }} id="classes">
        <div className="max-w-[1160px] mx-auto px-7">
          <div className="text-center mb-[60px]">
            <div className="flex items-center gap-3 justify-center mb-4">
              <span className="text-[10px] font-medium tracking-[2.5px] uppercase" style={{ color: pc+"BF" }}>Our foundations</span>
              <div className="w-8 h-px opacity-50" style={{ background: pc+"BF" }} />
            </div>
            <h2 className="text-[clamp(28px,4vw,44px)] font-semibold text-white leading-[1.2]" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
              What makes us <em className="italic" style={{ color: pc+"BF" }}>exceptional</em>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: pc+"26" }}>
            {[
              {num:"01",icon:"shield",name:"Excellence",desc:"Highest academic standards maintained across all year groups, from Form 1 through Upper Sixth."},
              {num:"02",icon:"globe",name:"Bilingualism",desc:"English and French instruction throughout — preparing students for a truly globalised world."},
              {num:"03",icon:"users",name:"Community",desc:"A welcoming, family-centred school where every student is known, supported, and celebrated."},
              {num:"04",icon:"star",name:"Achievement",desc:"94% GCE pass rate, top 5 school in Douala — a proven track record of student success."},
            ].map((p,i) => (
              <div key={i} className="p-9 max-md:p-7 relative overflow-hidden group transition-colors" style={{ background: "#2E2B22" }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 transition-transform origin-left duration-300 scale-x-0 group-hover:scale-x-100" style={{ background: pc }} />
                <div className="text-[52px] font-bold leading-none mb-4 transition-colors" style={{ color: pc+"1F", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{p.num}</div>
                <div className="w-[42px] h-[42px] flex items-center justify-center mb-4 border" style={{ borderColor: pc+"40" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={pc} strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5">
                    {p.icon==="shield"&&<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                    {p.icon==="globe"&&<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}
                    {p.icon==="users"&&<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                    {p.icon==="star"&&<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}
                  </svg>
                </div>
                <div className="text-[20px] font-semibold text-white mb-2.5" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{p.name}</div>
                <div className="text-[13.5px] font-light leading-[1.65] text-white/45">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="classic-reveal" style={{ background: "#F0EBE0" }}>
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderLeft: `1px solid ${pc+"33"}` }}>
          {statItems.map((stat,i) => (
            <div key={i} className="py-14 px-9 text-center max-md:py-10 max-md:px-6 relative group" style={{ borderRight: `1px solid ${pc+"33"}`, borderBottom: `1px solid ${pc+"33"}` }}>
              <div className="font-display text-[clamp(40px,5vw,64px)] font-bold leading-none mb-2" style={{ color: "#1A1710", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{stat.num}</div>
              <div className="text-[10.5px] font-medium tracking-[2px] uppercase" style={{ color: "#8A8470" }}>{stat.lbl}</div>
              <div className="w-6 h-px mx-auto mt-2.5 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:scale-x-150" style={{ background: pc }} />
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <section className="classic-reveal" style={{ background: "#1A1710" }} id="gallery">
        <div className="py-20 px-7 text-center max-w-[1160px] mx-auto">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-8 h-px opacity-50" style={{ background: pc+"BF" }} />
            <span className="text-[10px] font-medium tracking-[2.5px] uppercase" style={{ color: pc+"BF" }}>Campus life</span>
            <div className="w-8 h-px opacity-50" style={{ background: pc+"BF" }} />
          </div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-semibold text-white leading-[1.2]" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            Life at {s.schoolName?.split(" ")[0]||"School"}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-[280px_280px] gap-[2px]">
          {["Campus entrance","The library","Our students","Graduation day","Sports day"].map((label,i) => (
            <div key={i} className="relative overflow-hidden cursor-pointer group"
              style={{ gridRow: i===0?"1/3":"", gridColumn: i===0?"1":"" }}>
              <div className="w-full h-full flex items-center justify-center flex-col gap-2.5"
                style={{ background: `linear-gradient(135deg,#1A1608,#2A2010)` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={pc+"2E"} strokeWidth="1.2" strokeLinecap="round" className="w-8 h-8">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-[10px] tracking-[1.5px] uppercase" style={{ color: pc+"2E" }}>{label}</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#1A1710B3" }}>
                <span className="text-[18px] italic" style={{ color: pc+"BF", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="classic-reveal relative overflow-hidden py-[110px]" style={{ background: "#F0EBE0" }}>
        <div className="absolute top-[-60px] left-5 text-[480px] font-bold leading-none pointer-events-none opacity-5" style={{ color: pc, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>&#8220;</div>
        <div className="relative max-w-[740px] mx-auto text-center px-7">
          <div className="flex justify-center gap-1.5 mb-6">
            {[...Array(5)].map((_,i) => <span key={i} className="text-[16px]" style={{ color: pc }}>&#9733;</span>)}
          </div>
          <p className="text-[clamp(20px,3vw,28px)] italic leading-[1.6] mb-8 font-normal" style={{ color: "#1A1710", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            &ldquo;{s.schoolName||"School"} gave my children not just an education, but the confidence and skills to succeed anywhere in the world.&rdquo;
          </p>
          <div className="w-10 h-px mx-auto mb-6" style={{ background: pc }} />
          <div className="flex items-center justify-center gap-3.5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold" style={{ background: pc, color: "#1A1710", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>SC</div>
            <div className="text-left">
              <div className="text-[15px] font-medium" style={{ color: "#1A1710", fontFamily: "'Cormorant Garamond',Georgia,serif" }}>Parent</div>
              <div className="text-[11px] tracking-[0.5px] mt-0.5" style={{ color: "#8A8470" }}>{s.schoolName||"School"} &middot; {s.city||"Douala"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="classic-reveal" style={{ background: "#1A1710" }} id="contact">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
          <div className="py-20 px-[60px] max-md:px-7 flex flex-col justify-center" style={{ borderRight: `1px solid ${pc+"26"}` }}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-medium tracking-[2.5px] uppercase" style={{ color: pc }}>Visit us</span>
              <div className="flex-1 h-px opacity-50" style={{ background: pc+"BF" }} />
            </div>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-semibold text-white leading-[1.15] mb-2.5" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
              Come visit our <em className="italic" style={{ color: pc+"BF" }}>campus</em>
            </h2>
            <p className="text-[14px] font-light leading-[1.7] mb-10 max-w-[400px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Our admissions office is open Monday to Friday. We welcome prospective families to tour the campus.
            </p>
            <div className="flex flex-col gap-[22px]">
              {[
                {d:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',label:"Address",value:s.address||`${s.city||"Douala"}, ${s.region||"Littoral Region"}`},
                {d:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.95a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',label:"Phone",value:s.phone||"+237 6XX XXX XXX"},
                {d:'<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',label:"Email",value:s.email||"info@yourschool.cm"},
              ].map((item,i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="w-[38px] h-[38px] flex items-center justify-center flex-shrink-0 border" style={{ borderColor: pc+"4D" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={pc} strokeWidth="1.8" strokeLinecap="round" className="w-[17px] h-[17px]" dangerouslySetInnerHTML={{ __html: item.d }} />
                  </div>
                  <div>
                    <div className="text-[10px] font-medium tracking-[1.5px] uppercase mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{item.label}</div>
                    <div className="text-[14.5px] font-light" style={{ color: "rgba(255,255,255,0.75)" }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center flex-col gap-4 p-10" style={{ background: `linear-gradient(135deg,${pc+"0F"},${pc+"05"})` }}>
            <div className="w-full max-w-[380px] aspect-[4/3] flex items-center justify-center flex-col gap-2.5 border" style={{ borderColor: pc+"33", background: "rgba(26,23,16,0.5)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={pc+"4D"} strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p className="text-[12px] tracking-[1px] uppercase" style={{ color: pc+"4D" }}>{s.schoolName||"School"} &middot; {s.city||"Douala"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0A0906FA" }}>
        <div className="py-[70px] pb-12" style={{ borderTop: `1px solid ${pc+"1F"}` }}>
          <div className="max-w-[1160px] mx-auto px-7">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[52px] max-md:gap-8">
              <div>
                <div className="text-[22px] font-semibold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{s.schoolName||"School"}</div>
                <div className="text-[10px] tracking-[2px] uppercase mb-3.5" style={{ color: pc }}>Est. {s.yearFounded||"1998"} &middot; {s.city||"Douala"}</div>
                <div className="w-8 h-px mb-4 opacity-40" style={{ background: pc }} />
                <p className="text-[13.5px] font-light leading-[1.7] max-w-[260px]" style={{ color: "rgba(255,255,255,0.35)" }}>Shaping leaders through academic rigour, bilingual excellence, and a tradition of achievement.</p>
              </div>
              {[
                {title:"Navigate",links:["About → #about","Academics → #classes","Gallery → #gallery","Contact → #contact"].map(l=>({label:l.split("→")[0].trim(),href:l.split("→")[1].trim()}))},
                {title:"Portals",links:["Student portal → /login","Parent login → /login","Teacher login → /login","Administration → /login"].map(l=>({label:l.split("→")[0].trim(),href:l.split("→")[1].trim()}))},
                {title:"Academic",links:["Timetable → #","Fees structure → #","GCE results → #","Admissions → #"].map(l=>({label:l.split("→")[0].trim(),href:l.split("→")[1].trim()}))},
              ].map((col,i) => (
                <div key={i}>
                  <p className="text-[10px] font-semibold tracking-[2px] uppercase mb-[18px]" style={{ color: pc }}>{col.title}</p>
                  <ul className="list-none flex flex-col gap-[11px] p-0 m-0">
                    {col.links.map((link,j) => (
                      <li key={j}><a href={link.href} className="text-[13.5px] font-light no-underline transition-colors hover:text-[var(--gold-light)]" style={{ color: "rgba(255,255,255,0.4)" }}>{link.label}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t py-5" style={{ borderColor: pc+"1A" }}>
          <div className="max-w-[1160px] mx-auto px-7 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
            <p className="text-[12px] font-light" style={{ color: "rgba(255,255,255,0.2)" }}>&copy; {year} {s.schoolName||"School"}. All rights reserved.</p>
            <div className="text-[11.5px] flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              Managed with <strong style={{ color: pc, fontWeight: 500 }}>Akademee</strong> &middot; akademee.cm
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex gap-2.5 p-[10px] pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur border-t" style={{ background: "#1A1710FA", borderColor: pc+"33" }}>
        <a href="/login" className="flex-1 h-[46px] flex items-center justify-center rounded-sm text-[11px] font-semibold tracking-[1.5px] uppercase no-underline" style={{ background: pc, color: "#1A1710" }}>Student portal</a>
        <a href="#contact" className="flex-1 h-[46px] flex items-center justify-center rounded-sm text-[11px] font-medium tracking-[1.5px] uppercase no-underline border" style={{ borderColor: pc+"80", color: pc+"BF" }}>Contact us</a>
      </div>
    </div>
  );
}
