import { useEffect } from "react";

export default function MinimalTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");

  useEffect(() => {
    const els = document.querySelectorAll(".minimal-reveal");
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("minimal-visible"); });
    }, { threshold: 0.1 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const stats = s.websiteStats || {};
  const statItems = [
    { num: stats.studentsEnrolled || "\u2014", lbl: "Students" },
    { num: stats.teachers || "\u2014", lbl: "Teachers" },
    { num: stats.gcePassRate ? `${stats.gcePassRate}%` : "\u2014", lbl: "Pass rate" },
    { num: stats.yearsOfOperation || s.yearFounded || "\u2014", lbl: "Years" },
  ];

  const values = s.websiteValues?.length > 0 ? s.websiteValues : [
    { label: "Excellence" },
    { label: "Community" },
    { label: "Achievement" },
    { label: "Integrity" },
  ];

  return (
    <div className="font-sans antialiased text-[#1a1f1b] bg-white" style={{ "--p": pc, "--ps": pc+"15" }}>
      <style>{`
        .minimal-reveal{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}
        .minimal-reveal.minimal-visible{opacity:1;transform:none}
      `}</style>

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderColor: "#e8ebe6" }}>
        <div className="max-w-[1080px] mx-auto" style={{ padding: "0 20px" }}>
          <div className="flex items-center justify-between h-[72px] gap-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[10px] flex-shrink-0" style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover` : pc }} />
              <div className="min-w-0">
                <div className="text-[22px] font-semibold leading-tight truncate" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{s.schoolName || "School Name"}</div>
                <div className="text-[11px] uppercase tracking-[0.04em]" style={{ color: "#6e7a70" }}>{location || s.city || "City"}</div>
              </div>
            </div>
            <ul className="hidden md:flex gap-7 list-none m-0 p-0">
              {["About","Values","Gallery","Contact"].map(item => (
                <li key={item}><a href={`#${item.toLowerCase()}`} className="text-[14px] font-medium no-underline transition-colors hover:text-[var(--p)]" style={{ color: "#6e7a70" }}>{item}</a></li>
              ))}
            </ul>
            <a href="/login" className="h-10 px-5 rounded-full text-[13px] font-semibold text-white no-underline inline-flex items-center transition-all hover:brightness-110" style={{ background: pc }}>
              School Portal
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="py-[88px] pb-[72px]" style={{ background: "linear-gradient(180deg,#fafbf9 0%,#fff 100%)" }}>
        <div className="max-w-[1080px] mx-auto" style={{ padding: "0 20px" }}>
          <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-12 max-md:gap-8 items-center">
            <div>
              <span className="inline-block text-[11px] font-semibold tracking-[0.12em] uppercase mb-[18px]" style={{ color: pc }}>
                Est. {s.yearFounded || "\u2014"}
              </span>
              <h1 className="font-display text-[clamp(42px,5.5vw,64px)] font-semibold leading-[1.05] tracking-[-0.02em] mb-5 max-w-[12ch]"
                style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
                {s.tagline || "Education with purpose"}
              </h1>
              <p className="text-[17px] max-w-[46ch] mb-8" style={{ color: "#6e7a70" }}>
                {s.websiteDescription || `${s.schoolName||"Our school"} inspires students to achieve academic excellence and personal growth in a supportive environment.`}
              </p>
              <div className="flex gap-3 flex-wrap">
                <a href="#contact" className="h-[46px] px-[22px] rounded-full text-[14px] font-semibold text-white no-underline inline-flex items-center" style={{ background: pc }}>
                  Enquire today
                </a>
                <a href="/login" className="h-[46px] px-[22px] rounded-full text-[14px] font-semibold no-underline inline-flex items-center" style={{ border: "1.5px solid #e8ebe6", background: "#fff", color: "#1a1f1b" }}>
                  Parent portal
                </a>
              </div>
            </div>
            <div className="rounded-[24px] overflow-hidden aspect-[4/5] max-h-[560px]" style={{ background: pc+"15", boxShadow: `0 24px 60px ${pc+"1F"}` }}>
              {s.heroImageUrl ? (
                <img src={s.heroImageUrl} alt={s.schoolName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: pc+"15" }} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-14 border-y" style={{ borderColor: "#e8ebe6" }}>
        <div className="max-w-[1080px] mx-auto" style={{ padding: "0 20px" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {statItems.map((stat,i) => (
              <div key={i}>
                <div className="font-display text-[42px] font-bold leading-none mb-1.5" style={{ color: pc, fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{stat.num}</div>
                <div className="text-[12px] uppercase tracking-[0.08em]" style={{ color: "#6e7a70" }}>{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT + VALUES */}
      <section className="py-[88px]" id="about">
        <div className="max-w-[1080px] mx-auto" style={{ padding: "0 20px" }}>
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: pc }}>About us</p>
          <h2 className="font-display text-[clamp(32px,4vw,44px)] font-semibold mb-5 max-w-[18ch]" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            A school built on excellence and community
          </h2>
          <p className="text-[17px] max-w-[62ch] leading-[1.8]" style={{ color: "#6e7a70" }}>
            {s.websiteDescription || `${s.schoolName||"Our school"} is dedicated to providing a supportive, challenging environment where every student can thrive.`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px] mt-10">
            {values.slice(0,4).map((v,i) => (
              <div key={i} className="p-6 border rounded-[16px] transition-all hover:-translate-y-[2px]" style={{ borderColor: "#e8ebe6", background: "#fafbf9" }}>
                <div className="text-[22px] font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{v.label||v}</div>
                <div className="text-[14px] leading-[1.65]" style={{ color: "#6e7a70" }}>{v.description||v.desc||""}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-[88px]" style={{ background: "#fafbf9" }} id="gallery">
        <div className="max-w-[1080px] mx-auto" style={{ padding: "0 20px" }}>
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: pc }}>Campus life</p>
            <h2 className="font-display text-[clamp(32px,4vw,44px)] font-semibold" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
              Moments that define our school
            </h2>
          </div>
          {(s.gallery && s.gallery.length > 0) ? (
            <div className="grid grid-cols-12 gap-3.5">
              {s.gallery.slice(0,6).map((g,i) => (
                <div key={i} className="rounded-[16px] overflow-hidden min-h-[180px]"
                  style={{ gridColumn: i===0?"span 7":i===1||i===2?"span 5":"span 4", gridRow: i===0?"span 2":"span 1", minHeight: i===0?"360px":"180px" }}>
                  <img src={g.url} alt={g.caption||""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-3.5">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="rounded-[16px] overflow-hidden bg-white min-h-[180px] border" style={{
                  borderColor: "#e8ebe6",
                  gridColumn: i===0?"span 7":i===1||i===2?"span 5":"span 4",
                  gridRow: i===0?"span 2":"span 1",
                  minHeight: i===0?"360px":"180px",
                  background: `linear-gradient(135deg, ${pc}${10+i*5} 0%, ${pc}${20+i*5} 100%)`
                }} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-[72px]" id="contact">
        <div className="max-w-[1080px] mx-auto" style={{ padding: "0 20px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {label:"Email",value:s.email||"info@yourschool.cm"},
              {label:"Phone",value:s.phone||"+237 6XX XXX XXX"},
              {label:"Address",value:s.address||`${s.city||"City"}, ${s.region||"Region"}`},
            ].map((item,i) => (
              <div key={i} className="p-6 rounded-[16px] border" style={{ borderColor: "#e8ebe6", background: "#fafbf9" }}>
                <h3 className="text-[12px] uppercase tracking-[0.08em] mb-2" style={{ color: "#6e7a70" }}>{item.label}</h3>
                <p className="text-[15px] font-medium text-[#1a1f1b]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-7 border-t text-center text-[13px]" style={{ borderColor: "#e8ebe6", color: "#6e7a70" }}>
        <div className="max-w-[1080px] mx-auto" style={{ padding: "0 20px" }}>
          &copy; {year} {s.schoolName||"School"}. Managed with <strong style={{ color: pc }}>Akademee</strong>
        </div>
      </footer>
    </div>
  );
}
