import { useState, useEffect, useRef } from "react";
import { FiHome, FiLogIn, FiPhone, FiMail, FiMapPin, FiArrowRight, FiStar, FiUsers, FiImage, FiPlay, FiMessageCircle, FiBookOpen, FiClock, FiFeather, FiAward } from "react-icons/fi";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SECTIONS = ["about", "classes", "gallery", "contact"];

// ──────────────────── Icons ────────────────────

const PATH_TO_ICON = {
  building: FiHome,
  login: FiLogIn,
  phone: FiPhone,
  mail: FiMail,
  pin: FiMapPin,
  arrow: FiArrowRight,
  star: FiStar,
  users: FiUsers,
  image: FiImage,
  play: FiPlay,
  quote: FiMessageCircle,
  books: FiBookOpen,
  clock: FiClock,
  openbook: FiBookOpen,
  leaf: FiFeather,
  award: FiAward,
};

const PATHS = Object.fromEntries(Object.keys(PATH_TO_ICON).map(k => [k, k]));

const Icon = ({ path, className, style }) => {
  const IconComp = PATH_TO_ICON[path];
  return IconComp ? <IconComp className={className || "w-5 h-5"} style={style} /> : null;
};

// ──────────────────── Scroll Reveal ────────────────────

function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("premium-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    const els = document.querySelectorAll("[data-reveal-pr]");
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ──────────────────── Animated Counter ────────────────────

function AnimatedCounter({ end, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const num = parseInt(end) || 0;
          const duration = 2200;

          function frame(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            setCount(Math.round(eased * num));
            if (p < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
          obs.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ──────────────────── Main Template ────────────────────

export default function PremiumTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const pcl = hexToRgba(pc, 0.06);
  const pcm = hexToRgba(pc, 0.35);

  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");
  const initials = (s.schoolName || "SC").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useScrollReveal();

  const stats = s.websiteStats || {};
  const statItems = [
    { end: stats.studentsEnrolled || 248, label: "Students" },
    { end: stats.teachers || 32, label: "Faculty" },
    { end: s.examPassRate ? parseInt(s.examPassRate) : 94, suffix: "%", label: `${s.examType || "GCE"} Pass Rate` },
    { end: s.yearFounded ? parseInt(s.yearFounded) : 1998, label: "Founded" },
  ];

  const values = s.websiteValues?.length > 0 ? s.websiteValues : [
    { label: "Excellence", description: "The highest academic standards, cultivated through rigour, curiosity, and a passion for learning that extends beyond the classroom." },
    { label: "Bilingual", description: "Complete fluency in English and French, opening doors to universities and careers across the globe." },
    { label: "Tradition", description: "Decades of proud heritage, building upon the foundations laid by generations of scholars and educators." },
    { label: "Community", description: "A warm, inclusive environment where every member is valued, supported, and inspired to contribute." },
  ];

  const classesConfig = s.classesConfig?.length > 0 ? s.classesConfig : [
    { level: "Junior", name: "Form 1 & 2", desc: "Foundation years building core academic competencies.", age: "Ages 12\u201313", highlights: "English, French, Mathematics, Science, History, Geography, ICT, Physical Education, Creative Arts" },
    { level: "Junior", name: "Form 3", desc: "Pre-GCE introduction with expanded subject choices.", age: "Ages 14\u201315", highlights: "Core subjects + Introduction to Sciences, Arts, and Commercial streams" },
    { level: "O Level", name: "Form 4 & 5", desc: "GCE O-Level programme across multiple streams.", age: "Ages 15\u201317", highlights: "Sciences (Biology, Chemistry, Physics), Arts (Literature, History, French), Commercial (Accounting, Economics)" },
    { level: "A Level", name: "Lower Sixth", desc: "Advanced Level specialisation.", age: "Ages 17\u201318", highlights: "3\u20134 A-Level subjects selected from Sciences, Arts, or Commercial pathways" },
    { level: "A Level", name: "Upper Sixth", desc: "GCE A-Level culmination.", age: "Ages 18\u201319", highlights: "Final examinations, university applications, career guidance, and graduation" },
  ];

  const milestones = [
    { year: s.yearFounded || "1998", title: "Founded", desc: "Established with a vision to provide world-class bilingual education." },
    { year: "2005", title: "First GCE Cohort", desc: "First batch of students sat for the GCE examinations with outstanding results." },
    { year: "2012", title: "Bilingual Excellence", desc: "Recognised as a leading bilingual institution in the region." },
    { year: "2018", title: "Top Ranking", desc: "Achieved top ranking in regional academic performance tables." },
    { year: String(year), title: "Present Day", desc: "Continuing our legacy of excellence, innovation, and community impact." },
  ];

  const gallery = s.gallery?.length > 0 ? s.gallery : (s.aboutPhotos || []);

  const contactItems = [
    { icon: PATHS.pin, label: "Address", value: s.address || `${s.city || "City"}, ${s.region || "Region"}` },
    { icon: PATHS.phone, label: "Telephone", value: s.phone || "+237 6XX XXX XXX" },
    { icon: PATHS.mail, label: "Email", value: s.email || "info@yourschool.cm" },
    { icon: PATHS.clock, label: "Office Hours", value: "Monday \u2013 Friday \u00b7 7:30 AM \u2013 4:00 PM" },
  ];

  return (
    <div className="antialiased bg-[#fcfaf7] text-[#2d2a24] overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif", "--p": pc, "--pl": pcl, "--pm": pcm }}>
      <style>{`
        /* ─── Fonts ─── */
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }

        /* ─── Scroll Reveals ─── */
        [data-reveal-pr] { opacity: 0; transform: translateY(28px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.9,.3,1); }
        [data-reveal-pr].premium-visible { opacity: 1; transform: translateY(0); }
        [data-reveal-pr].delay-1 { transition-delay: .15s; }
        [data-reveal-pr].delay-2 { transition-delay: .3s; }
        [data-reveal-pr].delay-3 { transition-delay: .45s; }
        [data-reveal-pr].delay-4 { transition-delay: .6s; }

        /* ─── Animations ─── */
        @keyframes premium-fade-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes premium-draw-line { 0% { width: 0; } 100% { width: 48px; } }
        @keyframes premium-float-subtle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes premium-reveal-content { 0% { opacity: 0; clip-path: inset(0 0 100% 0); } 100% { opacity: 1; clip-path: inset(0 0 0 0); } }
        
        /* ─── Decorative line ─── */
        .premium-line { height: 1px; background: var(--p); }

        /* ─── Hover ─── */
        .premium-hover-link { position: relative; }
        .premium-hover-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: var(--p); transition: width .4s ease; }
        .premium-hover-link:hover::after { width: 100%; }

        /* ─── Milestone ─── */
        .milestone-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--p); border: 3px solid #fcfaf7; box-shadow: 0 0 0 1px rgba(45,42,36,0.1); transition: all .3s ease; }
        .milestone-dot:hover { transform: scale(1.3); background: #2d2a24; }
      `}</style>

      {/* ════════════════ NAVIGATION ════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-[#fcfaf7]/90 shadow-sm" : "bg-transparent"
        }`}
        style={{ backdropFilter: scrolled ? "blur(20px)" : "none" }}
      >
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="flex items-center justify-between h-[80px]">
            <a href="#" className="flex items-center gap-3 no-underline group">
              <div
                className="w-10 h-10 overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc, borderRadius: "2px" }}
              >
                {!s.logoUrl && <span className="text-sm font-bold text-white tracking-wider serif">{initials}</span>}
              </div>
              <div>
                <div className="serif text-[17px] font-semibold text-[#2d2a24] leading-tight">{s.schoolName || "School"}</div>
                <div className="text-[10px] text-[#9a948a] tracking-wide uppercase">{location || s.city || "Campus"}</div>
              </div>
            </a>

            <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
              {SECTIONS.map((item) => (
                <li key={item}>
                  <a
                    href={`#${item}`}
                    className="text-[12.5px] font-medium text-[#9a948a] px-4 py-2 no-underline transition-colors duration-200 hover:text-[#2d2a24] premium-hover-link"
                  >
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </a>
                </li>
              ))}
            </ul>

            <div className="hidden md:flex items-center gap-4">
              <a href="/login" className="text-[12.5px] font-medium text-[#9a948a] no-underline hover:text-[#2d2a24] transition-colors premium-hover-link">Sign in</a>
              <a
                href="/login"
                className="h-9 px-5 text-[12px] font-semibold text-white no-underline inline-flex items-center gap-1.5 transition-all duration-200 hover:opacity-90"
                style={{ background: pc, borderRadius: "2px" }}
              >
                <Icon path={PATHS.login} className="w-3 h-3" /> Portal
              </a>
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden w-10 h-10 border border-[#ddd8d0] bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[5px]"
              style={{ borderRadius: "2px" }}
            >
              <span className="block w-5 h-px bg-[#2d2a24] transition-all duration-200" style={{ transform: mobileOpen ? "rotate(45deg) translate(5px,5px)" : "" }} />
              <span className="block w-5 h-px bg-[#2d2a24] transition-all duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span className="block w-5 h-px bg-[#2d2a24] transition-all duration-200" style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px,-5px)" : "" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 flex-col pt-24 px-8 pb-8 ${mobileOpen ? "flex" : "hidden"}`} style={{ background: "#fcfaf7" }}>
        {[...SECTIONS, "heritage", "testimonials"].map((item) => (
          <a
            key={item}
            href={`#${item}`}
            onClick={() => setMobileOpen(false)}
            className="serif text-[26px] font-medium py-3.5 text-[#2d2a24] border-b border-[#e8e4de] no-underline hover:text-[var(--p)] transition-colors"
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </a>
        ))}
        <a
          href="/login"
          className="mt-6 h-12 flex items-center justify-center text-[14px] font-semibold text-white no-underline"
          style={{ background: pc, borderRadius: "2px" }}
        >
          Student Portal
        </a>
      </div>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {s.heroImageUrl ? (
            <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover opacity-25" />
          ) : null}
          <div className="absolute inset-0" style={{ background: `linear-gradient(170deg, #fcfaf7 0%, ${hexToRgba(pc, 0.05)} 50%, #fcfaf7 100%)` }} />
          {s.heroImageUrl2 && (
            <div className="absolute bottom-0 right-0 w-1/3 h-2/3 opacity-10" style={{
              backgroundImage: `url(${s.heroImageUrl2})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              maskImage: "linear-gradient(to left, black, transparent)",
              WebkitMaskImage: "linear-gradient(to left, black, transparent)",
            }} />
          )}
        </div>

        <div className="relative z-10 w-full pt-32 pb-24">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="max-w-[680px]">
              {s.educationalSystems?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6" data-reveal-pr>
                  {s.educationalSystems.map((sys) => (
                    <span
                      key={sys}
                      className="inline-flex items-center text-[10px] font-medium tracking-[2px] uppercase px-3 py-1"
                      style={{ background: pcl, color: pc, borderRadius: "2px" }}
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-6" data-reveal-pr>
                <div className="w-14 h-14 overflow-hidden mb-5" style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc, borderRadius: "2px" }}>
                  {!s.logoUrl && <span className="w-full h-full flex items-center justify-center text-lg font-bold text-white serif">{initials}</span>}
                </div>
                <p className="text-[11px] font-medium tracking-[3px] uppercase text-[#9a948a]">{s.yearFounded ? `Est. ${s.yearFounded}` : ""}</p>
              </div>

              <h1 className="serif text-[clamp(44px,7vw,80px)] font-semibold leading-[1.02] tracking-[-0.5px] mb-6 text-[#2d2a24]" data-reveal-pr>
                {s.schoolName || "Your School"}
              </h1>

              <p className="text-[16px] text-[#7a746a] leading-[1.85] mb-10 max-w-[500px]" data-reveal-pr>
                {s.tagline || `${s.schoolName || "Our school"} provides world-class education through academic rigour, bilingual excellence, and a tradition of achievement.`}
              </p>

              <div className="flex items-center gap-5 flex-wrap" data-reveal-pr>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2.5 h-[50px] px-7 text-[13px] font-semibold text-white no-underline transition-all duration-200 hover:opacity-90"
                  style={{ background: pc, borderRadius: "2px" }}
                >
                  Enrolment enquiries
                </a>
                <a
                  href="#about"
                  className="inline-flex items-center gap-1.5 h-[50px] text-[13px] font-medium text-[#2d2a24] no-underline transition-all duration-200 premium-hover-link"
                >
                  Discover our heritage <Icon path={PATHS.arrow} className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-6 mt-20 pt-10 border-t border-[#e8e4de]" data-reveal-pr>
              {statItems.map((stat, i) => (
                <div key={i}>
                  <div className="serif text-[30px] font-semibold text-[#2d2a24] leading-none mb-1">
                    <AnimatedCounter end={stat.end} suffix={stat.suffix || ""} />
                  </div>
                  <div className="text-[11px] text-[#9a948a] tracking-wide uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ ABOUT ════════════════ */}
      <section className="py-32 max-md:py-20" id="about">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 max-md:gap-10 items-center">
            <div>
              <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4" data-reveal-pr>About us</p>
              <h2 className="serif text-[clamp(32px,4vw,50px)] font-semibold leading-[1.1] mb-6" data-reveal-pr>
                A tradition of <em className="italic" style={{ color: pc }}>excellence</em>
              </h2>
              <div className="w-12 h-px premium-line mb-6" data-reveal-pr />
              <p className="text-[15px] text-[#7a746a] leading-[1.85] mb-8" data-reveal-pr>
                {s.websiteDescription || `${s.schoolName || "Our school"} is dedicated to providing a supportive, challenging environment where every student can thrive and achieve their full potential. Our approach combines academic rigour with personal development.`}
              </p>

              <div className="flex flex-wrap gap-6" data-reveal-pr>
                <div>
                  <p className="serif text-2xl font-semibold text-[#2d2a24]">{s.examPassRate ? `${s.examPassRate}%` : "94%"}</p>
                  <p className="text-[11px] text-[#9a948a] tracking-wide uppercase">{s.examType || "GCE"} Pass Rate</p>
                </div>
                <div className="w-px bg-[#e8e4de]" />
                <div>
                  <p className="serif text-2xl font-semibold text-[#2d2a24]">{s.ranking || "Top 5"}</p>
                  <p className="text-[11px] text-[#9a948a] tracking-wide uppercase">{s.rankingCity ? `in ${s.rankingCity}` : "Regional Ranking"}</p>
                </div>
                <div className="w-px bg-[#e8e4de]" />
                <div>
                  <p className="serif text-2xl font-semibold text-[#2d2a24]">{stats.teachers || 32}</p>
                  <p className="text-[11px] text-[#9a948a] tracking-wide uppercase">Faculty</p>
                </div>
              </div>
            </div>

            <div className="relative" data-reveal-pr>
              <div className="relative overflow-hidden" style={{ borderRadius: "2px", aspectRatio: "3/4", background: pcl }}>
                {s.aboutPhotos && s.aboutPhotos.length > 0 ? (
                  <img src={s.aboutPhotos[0].url} alt={s.aboutPhotos[0].caption || ""} className="w-full h-full object-cover" />
                ) : s.heroImageUrl ? (
                  <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon path={PATHS.image} className="w-12 h-12" style={{ color: pcm }} />
                  </div>
                )}
              </div>
              {s.aboutPhotos && s.aboutPhotos.length > 1 && (
                <div className="absolute -bottom-6 -right-6 w-2/5 aspect-[3/4] overflow-hidden shadow-2xl" style={{ borderRadius: "2px", animation: "premium-float-subtle 6s ease-in-out infinite" }}>
                  <img src={s.aboutPhotos[1].url} alt={s.aboutPhotos[1].caption || ""} className="w-full h-full object-cover" />
                </div>
              )}
              {/* Decorative */}
              <div className="absolute top-6 left-6 w-24 h-24 border border-[#e8e4de] -z-10" style={{ borderRadius: "2px" }} />
            </div>
          </div>

          {/* Pull Quote */}
          <div className="mt-20 max-w-[700px] mx-auto text-center" data-reveal-pr>
            <div className="w-10 h-px premium-line mx-auto mb-6" />
            <p className="serif text-[clamp(18px,2.5vw,26px)] italic leading-[1.6] text-[#5a544a]">
              "Education is not the filling of a pail, but the lighting of a fire \u2014 and at {s.schoolName || "our school"}, we light that fire in every student."
            </p>
            <div className="w-10 h-px premium-line mx-auto mt-6" />
          </div>
        </div>
      </section>

      {/* ════════════════ VALUES ════════════════ */}
      <section className="py-32 max-md:py-20" style={{ background: "#f5f2ed" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4" data-reveal-pr>Our foundations</p>
            <h2 className="serif text-[clamp(28px,4vw,46px)] font-semibold leading-[1.1]" data-reveal-pr>
              What we <em className="italic" style={{ color: pc }}>stand for</em>
            </h2>
            <div className="w-12 h-px premium-line mx-auto mt-4" data-reveal-pr />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.slice(0, 4).map((v, i) => (
              <div
                key={i}
                className="bg-[#fcfaf7] p-8 border border-[#e8e4de] transition-all duration-500 hover:shadow-lg cursor-default"
                style={{ borderRadius: "2px" }}
                data-reveal-pr
              >
                <div className="w-10 h-10 flex items-center justify-center mb-6" style={{ color: pc }}>
                  <Icon path={PATHS.openbook} className="w-6 h-6" />
                </div>
                <h3 className="serif text-xl font-semibold text-[#2d2a24] mb-3">{v.label || v}</h3>
                <p className="text-[13.5px] text-[#7a746a] leading-relaxed">{v.description || v.desc || ""}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ HERITAGE TIMELINE ════════════════ */}
      <section className="py-32 max-md:py-20" id="heritage">
        <div className="max-w-[900px] mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4" data-reveal-pr>Our heritage</p>
            <h2 className="serif text-[clamp(28px,4vw,46px)] font-semibold leading-[1.1]" data-reveal-pr>
              A journey through <em className="italic" style={{ color: pc }}>time</em>
            </h2>
            <div className="w-12 h-px premium-line mx-auto mt-4" data-reveal-pr />
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-[#e8e4de] transform md:-translate-x-px" />

            {milestones.map((m, i) => (
              <div
                key={i}
                className={`relative flex flex-col md:flex-row items-start gap-6 md:gap-10 mb-12 last:mb-0 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
                data-reveal-pr
              >
                {/* Content */}
                <div className={`flex-1 ${i % 2 === 0 ? "md:text-right" : "md:text-left"} pl-8 md:pl-0`}>
                  <p className="serif text-3xl font-semibold mb-1" style={{ color: pc }}>{m.year}</p>
                  <h3 className="serif text-xl font-semibold text-[#2d2a24] mb-2">{m.title}</h3>
                  <p className="text-[14px] text-[#7a746a] leading-relaxed">{m.desc}</p>
                </div>

                {/* Dot */}
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-1">
                  <div className="milestone-dot" />
                </div>

                {/* Spacer for alternating */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ ACADEMIC ACHIEVEMENTS ════════════════ */}
      {(s.examType || s.examPassRate || s.ranking) && (
        <section className="py-32 max-md:py-20" style={{ background: "#f5f2ed" }} id="academics">
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="text-center mb-16">
              <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4" data-reveal-pr>Achievements</p>
              <h2 className="serif text-[clamp(28px,4vw,46px)] font-semibold leading-[1.1]" data-reveal-pr>
                Our academic <em className="italic" style={{ color: pc }}>record</em>
              </h2>
              <div className="w-12 h-px premium-line mx-auto mt-4" data-reveal-pr />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {s.examType && (
                <div className="bg-[#fcfaf7] p-10 text-center border border-[#e8e4de] transition-all duration-300 hover:shadow-md" style={{ borderRadius: "2px" }} data-reveal-pr>
                  <Icon path={PATHS.award} className="w-8 h-8 mx-auto mb-4" style={{ color: pc }} />
                  <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-2">Examination</p>
                  <p className="serif text-2xl font-semibold text-[#2d2a24]">{s.examType}</p>
                </div>
              )}
              {s.examPassRate && (
                <div className="p-10 text-center border" style={{ background: pcl, borderColor: pcm, borderRadius: "2px" }} data-reveal-pr>
                  <Icon path={PATHS.star} className="w-8 h-8 mx-auto mb-4" style={{ color: pc }} />
                  <p className="text-[10px] font-medium tracking-[3px] uppercase mb-2" style={{ color: pcm }}>Pass Rate</p>
                  <p className="serif text-5xl font-semibold" style={{ color: pc }}>{s.examPassRate}%</p>
                </div>
              )}
              {s.ranking && (
                <div className="bg-[#fcfaf7] p-10 text-center border border-[#e8e4de] transition-all duration-300 hover:shadow-md" style={{ borderRadius: "2px" }} data-reveal-pr>
                  <Icon path={PATHS.award} className="w-8 h-8 mx-auto mb-4" style={{ color: pc }} />
                  <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-2">Ranking</p>
                  <p className="serif text-2xl font-semibold text-[#2d2a24]">{s.ranking}</p>
                  {s.rankingCity && <p className="text-[12px] text-[#9a948a] mt-1">in {s.rankingCity}</p>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ CLASSES ════════════════ */}
      <section className="py-32 max-md:py-20" id="classes">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4" data-reveal-pr>Academics</p>
            <h2 className="serif text-[clamp(28px,4vw,46px)] font-semibold leading-[1.1]" data-reveal-pr>
              Our classes & <em className="italic" style={{ color: pc }}>streams</em>
            </h2>
            <div className="w-12 h-px premium-line mx-auto mt-4" data-reveal-pr />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classesConfig.map((cls, i) => (
              <div
                key={i}
                className="bg-[#f5f2ed] p-7 border border-[#e8e4de] transition-all duration-300 hover:shadow-md"
                style={{ borderRadius: "2px" }}
                data-reveal-pr
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-medium tracking-[2px] uppercase px-3 py-1" style={{ background: pcl, color: pc, borderRadius: "2px" }}>
                    {cls.level}
                  </span>
                  <span className="text-[11px] text-[#9a948a]">{cls.age}</span>
                </div>
                <h3 className="serif text-lg font-semibold text-[#2d2a24] mb-2">{cls.name}</h3>
                <p className="text-[13px] text-[#7a746a] leading-relaxed mb-3">{cls.desc}</p>
                <p className="text-[11px] text-[#9a948a] leading-relaxed">{cls.highlights}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ TESTIMONIAL ════════════════ */}
      <section className="py-32 max-md:py-20 relative" style={{ background: "#f5f2ed" }} id="testimonials">
        <div className="relative max-w-[680px] mx-auto px-8 text-center">
          <Icon path={PATHS.quote} className="w-10 h-10 mx-auto mb-6" style={{ color: pcm }} data-reveal-pr />
          <p className="serif text-[clamp(20px,2.5vw,30px)] font-normal italic leading-[1.6] text-[#5a544a] mb-8" data-reveal-pr>
            &ldquo;{s.schoolName || "School"} gave my children not just an education, but the confidence and skills to succeed anywhere in the world. The bilingual programme is truly exceptional.&rdquo;
          </p>
          <div className="w-12 h-px premium-line mx-auto mb-6" data-reveal-pr />
          <div className="flex items-center justify-center gap-3.5" data-reveal-pr>
            <div
              className="w-12 h-12 flex items-center justify-center text-sm font-bold serif text-white"
              style={{ background: pc, borderRadius: "50%" }}
            >
              {initials}
            </div>
            <div className="text-left">
              <p className="serif text-[16px] font-semibold text-[#2d2a24]">Parent</p>
              <p className="text-[12px] text-[#9a948a]">{s.schoolName || "School"} \u00b7 {location || "City"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ GALLERY ════════════════ */}
      <section className="py-32 max-md:py-20" id="gallery">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4" data-reveal-pr>Gallery</p>
            <h2 className="serif text-[clamp(28px,4vw,46px)] font-semibold leading-[1.1]" data-reveal-pr>
              Life at {s.schoolName?.split(" ")[0] || "School"}
            </h2>
            <div className="w-12 h-px premium-line mx-auto mt-4" data-reveal-pr />
          </div>

          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.slice(0, 5).map((img, i) => (
                <div
                  key={i}
                  className={`overflow-hidden group cursor-pointer ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                  style={{ borderRadius: "2px", minHeight: i === 0 ? "480px" : "220px" }}
                  data-reveal-pr
                >
                  <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center border border-[#e8e4de] ${i === 0 ? "md:col-span-2 md:row-span-2 min-h-[480px]" : "min-h-[220px]"}`}
                  style={{ background: pcl, borderRadius: "2px" }}
                >
                  <Icon path={PATHS.image} className="w-8 h-8" style={{ color: pcm }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════ CONTACT ════════════════ */}
      <section className="py-32 max-md:py-20" style={{ background: "#f5f2ed" }} id="contact">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-md:gap-10">
            <div>
              <p className="text-[10px] font-medium tracking-[3px] uppercase text-[#9a948a] mb-4" data-reveal-pr>Visit us</p>
              <h2 className="serif text-[clamp(28px,4vw,46px)] font-semibold leading-[1.1] mb-5" data-reveal-pr>
                We welcome <em className="italic" style={{ color: pc }}>you</em>
              </h2>
              <div className="w-12 h-px premium-line mb-6" data-reveal-pr />
              <p className="text-[15px] text-[#7a746a] leading-[1.7] mb-8 max-w-[420px]" data-reveal-pr>
                Our admissions office is open Monday to Friday. We welcome prospective families to tour the campus and meet our faculty.
              </p>
              <div className="flex flex-col gap-5">
                {contactItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group" data-reveal-pr>
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110" style={{ color: pc }}>
                      <Icon path={item.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium tracking-[2px] uppercase text-[#9a948a] mb-0.5">{item.label}</p>
                      <p className="serif text-[16px] font-medium text-[#2d2a24]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="min-h-[350px] flex items-center justify-center flex-col gap-4 border-2"
              style={{ background: pcl, borderColor: "#e8e4de", borderRadius: "2px" }}
              data-reveal-pr
            >
              <Icon path={PATHS.pin} className="w-10 h-10" style={{ color: pc }} />
              <p className="serif text-[16px] font-medium" style={{ color: pcm }}>{s.schoolName || "School"}</p>
              <p className="text-[13px] text-[#9a948a]">{location || "City, Region"}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(s.address || `${s.city || ""} ${s.region || ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-9 px-5 text-[11px] font-medium text-white no-underline transition-all duration-200 hover:opacity-90 mt-2"
                style={{ background: pc, borderRadius: "2px" }}
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-[#e8e4de]" style={{ background: "#fcfaf7" }}>
        <div className="max-w-[1200px] mx-auto px-8 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: pc, borderRadius: "2px" }}>
                  <Icon path={PATHS.building} className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="serif text-[18px] font-semibold text-[#2d2a24]">{s.schoolName || "School"}</span>
              </div>
              <p className="text-[13px] text-[#9a948a] leading-relaxed">Shaping leaders since {s.yearFounded || "1998"}.</p>
            </div>
            {[
              { title: "Navigate", links: [{ label: "About", href: "#about" }, { label: "Classes", href: "#classes" }, { label: "Gallery", href: "#gallery" }, { label: "Contact", href: "#contact" }] },
              { title: "Portals", links: [{ label: "Student Portal", href: "/login" }, { label: "Parent Portal", href: "/login" }] },
              { title: "Academic", links: [{ label: "Curriculum", href: "#classes" }, { label: "Results", href: "#academics" }, { label: "Admissions", href: "#contact" }] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-[10px] font-medium tracking-[3px] uppercase mb-4" style={{ color: pcm }}>{col.title}</p>
                <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                  {col.links.map((link, j) => (
                    <li key={j}><a href={link.href} className="text-[13.5px] text-[#9a948a] no-underline hover:text-[#2d2a24] transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e8e4de] pt-6 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
            <p className="text-[12px] text-[#9a948a]">&copy; {year} {s.schoolName || "School"}. All rights reserved.</p>
            <p className="text-[12px] text-[#9a948a]">Managed with <strong className="font-semibold" style={{ color: pc }}>Akademee</strong></p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fcfaf7] border-t border-[#e8e4de] p-3 pb-[max(12px,env(safe-area-inset-bottom))] flex gap-2.5">
        <a
          href="/login"
          className="flex-1 h-12 flex items-center justify-center text-[13px] font-semibold text-white no-underline"
          style={{ background: pc, borderRadius: "2px" }}
        >
          Portal
        </a>
        <a
          href="#contact"
          className="flex-1 h-12 flex items-center justify-center text-[13px] font-medium text-[#2d2a24] no-underline border border-[#d8d4ce]"
          style={{ borderRadius: "2px" }}
        >
          Contact
        </a>
      </div>
    </div>
  );
}
