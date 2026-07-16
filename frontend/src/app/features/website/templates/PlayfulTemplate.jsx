import { useState, useEffect, useRef, useCallback } from "react";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SECTIONS = ["about", "classes", "gallery", "announcements", "enrol", "contact"];

// ──────────────────── Icons ────────────────────

import { FiHome, FiLogIn, FiPhone, FiMail, FiMapPin, FiArrowRight, FiStar, FiUsers, FiImage, FiPlay, FiCalendar, FiClock, FiChevronDown, FiHeart, FiSmile, FiEdit3, FiAward, FiBook, FiBookOpen, FiCamera, FiClipboard, FiCrosshair, FiInfo, FiTrendingUp, FiDollarSign, FiBarChart2, FiFeather, FiMessageCircle } from "react-icons/fi";
import EnrollmentForm from "../components/EnrollmentForm";
import WebsiteAnnouncements from "../components/WebsiteAnnouncements";
import { useScrollProgress, ScrollProgressBar, BackToTopButton } from "../hooks/useScrollProgress.jsx";
import { useActiveSection } from "../hooks/useActiveSection.jsx";
import { useWebsiteLanguage, LanguageToggle } from "../hooks/useWebsiteLanguage.jsx";
import { useWebsiteTheme } from "../hooks/useWebsiteTheme.jsx";
import { TRANSLATIONS } from "../hooks/websiteTranslations.js";

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
  calendar: FiCalendar,
  sparkle: FiStar,
  smile: FiSmile,
  chevronDown: FiChevronDown,
  heart: FiHeart,
  clock: FiClock,
  award: FiAward,
  book: FiBook,
  bookOpen: FiBookOpen,
  camera: FiCamera,
  clipboard: FiClipboard,
  crosshair: FiCrosshair,
  info: FiInfo,
  trendingUp: FiTrendingUp,
  dollarSign: FiDollarSign,
  barChart: FiBarChart2,
  feather: FiFeather,
  messageCircle: FiMessageCircle,
  edit3: FiEdit3,
};

const PATHS = Object.fromEntries(Object.keys(PATH_TO_ICON).map(k => [k, k]));

const Icon = ({ path, className, style }) => {
  const IconComp = PATH_TO_ICON[path];
  return IconComp ? <IconComp className={className || "w-5 h-5"} style={style} /> : null;
};

// ──────────────────── Floating Shape Decorations ────────────────────

const SHAPES = [
  { type: "circle", size: 60, x: "5%", y: "15%", duration: 7, delay: 0 },
  { type: "circle", size: 40, x: "90%", y: "25%", duration: 9, delay: 1 },
  { type: "square", size: 50, x: "10%", y: "60%", duration: 8, delay: 2 },
  { type: "circle", size: 30, x: "85%", y: "70%", duration: 6, delay: 0.5 },
  { type: "triangle", size: 45, x: "50%", y: "10%", duration: 10, delay: 1.5 },
  { type: "circle", size: 25, x: "95%", y: "45%", duration: 7, delay: 0.8 },
];

function FloatingShapes({ color }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {SHAPES.map((shape, i) => (
        <div
          key={i}
          className="absolute opacity-[0.07]"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
            background: shape.type === "circle" ? color : "none",
            borderRadius: shape.type === "circle" ? "50%" : shape.type === "square" ? "8px" : "0",
            border: shape.type !== "circle" ? `2px solid ${color}` : "none",
            clipPath: shape.type === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : "none",
            animation: `playful-float ${shape.duration}s ease-in-out ${shape.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ──────────────────── Scroll Reveal Hook ────────────────────

function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("playful-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    const els = document.querySelectorAll("[data-reveal-p]");
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ──────────────────── Tilt Card ────────────────────

function TiltCard({ children, className, style }) {
  const ref = useRef(null);

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  }, []);

  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "";
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: "transform", transition: "transform 0.15s ease-out", ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
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
          const duration = 1500;

          function frame(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
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

export default function PlayfulTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const pcl = hexToRgba(pc, 0.1);
  const pcm = hexToRgba(pc, 0.5);

  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");
  const schoolName = s.name || s.schoolName || "School Name";
  const schoolShort = schoolName.split(" ")[0];
  const initials = schoolName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedClass, setExpandedClass] = useState(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const galleryRef = useRef(null);

  // Interactive hooks
  const { progress, showBackToTop } = useScrollProgress(300);
  const activeSection = useActiveSection(SECTIONS, 80);
  const { lang, isBilingual, toggleLang, t } = useWebsiteLanguage(s.educationalSystems);
  const { isDark, ThemeToggle } = useWebsiteTheme("light");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useScrollReveal();

  const gallery = s.gallery?.length > 0 ? s.gallery : (s.aboutPhotos || []);

  // Scroll gallery carousel when galleryIdx changes
  useEffect(() => {
    if (galleryRef.current && gallery.length > 0) {
      const container = galleryRef.current;
      const child = container.children[galleryIdx];
      if (child) {
        child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      }
    }
  }, [galleryIdx, gallery.length]);

  const stats = s.websiteStats || {};
  const statItems = [
    { end: stats.studentsEnrolled || 248, label: t(TRANSLATIONS.playful.happyStudents), icon: PATHS.users },
    { end: stats.teachers || 32, label: t(TRANSLATIONS.playful.amazingTeachers), icon: PATHS.heart },
    { end: s.examPassRate ? parseInt(s.examPassRate) : 94, suffix: "%", label: `${s.examType || "GCE"} ${t(TRANSLATIONS.playful.success)}`, icon: PATHS.star },
  ];

  const values = s.websiteValues?.length > 0 ? s.websiteValues : [
    { label: "Excellence", description: "We aim high and achieve together", icon: PATHS.star },
    { label: "Bilingual", description: "English & French, side by side", icon: PATHS.messageCircle },
    { label: "Community", description: "Like a big happy family", icon: PATHS.users },
    { label: "Achievement", description: "Every student shines bright", icon: PATHS.award },
  ];

  const classesConfig = s.classesConfig?.length > 0 ? s.classesConfig : [
    { level: "Junior", name: "Form 1 & 2", desc: "Foundation years. Core subjects: English, French, Maths, Science.", age: "Ages 12–13", details: "Students explore a broad curriculum with dedicated form tutors. Emphasis on building confidence, curiosity, and strong foundations in all core subjects." },
    { level: "Junior", name: "Form 3 & 4", desc: "O/L preparation with stream choices.", age: "Ages 14–15", details: "Students begin preparing for the GCE O-Level examination. Science and Arts streams are introduced, allowing students to follow their interests." },
    { level: "O Level", name: "Form 5", desc: "GCE Ordinary Level exam year.", age: "Age 16", details: "The culmination of the O-Level programme. Intensive exam preparation with mock examinations, revision sessions, and individual mentorship." },
    { level: "A Level", name: "Lower Sixth", desc: "Advanced Level entry year.", age: "Age 17", details: "First year of the A-Level programme. Students specialise in 3-4 subjects of their choice, with guidance from subject specialists." },
    { level: "A Level", name: "Upper Sixth", desc: "GCE Advanced Level exam.", age: "Age 18", details: "Final year. Students complete their A-Level curriculum and sit for the national examinations. University application guidance is provided." },
  ];

  const testimonials = [
    { quote: "This school is absolutely amazing! My children wake up excited every morning. The bilingual programme is top-notch!", author: "Sarah M.", role: "Parent", rating: 5 },
    { quote: "The teachers are so caring and dedicated. I've seen my son grow in confidence and academic ability beyond what I imagined.", author: "John K.", role: "Parent", rating: 5 },
    { quote: "I made lifelong friends here and received an education that prepared me perfectly for university. Forever grateful!", author: "Amanda L.", role: "Alumna", rating: 5 },
    { quote: "The best decision we ever made was enrolling our daughter here. The sense of community is unmatched.", author: "David & Rose", role: "Parents", rating: 5 },
  ];

  const contactItems = [
    { icon: PATHS.pin, label: t(TRANSLATIONS.contact.address), value: s.address || `${s.city || "City"}, ${s.region || "Region"}` },
    { icon: PATHS.phone, label: t(TRANSLATIONS.contact.phone), value: s.phone || "+237 6XX XXX XXX" },
    { icon: PATHS.mail, label: t(TRANSLATIONS.contact.email), value: s.email || "info@yourschool.cm" },
    { icon: PATHS.clock, label: t(TRANSLATIONS.contact.hours), value: "Mon – Fri · 7:30 AM – 4:00 PM" },
  ];

  return (
    <div className={`font-sans antialiased overflow-x-hidden ${isDark ? "website-dark dark" : ""}`} style={{ "--p": pc, "--pl": pcl, "--pm": pcm, background: isDark ? "#1a1a1a" : "#faf9f7", color: isDark ? "#d4d0c8" : "#1a1a1a" }}>
      <ScrollProgressBar progress={progress} color={pc} />
      <style>{`
        /* ─── Scroll reveals ─── */
        [data-reveal-p] { opacity: 0; transform: translateY(30px) scale(0.97); transition: opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1); }
        [data-reveal-p].playful-visible { opacity: 1; transform: translateY(0) scale(1); }
        [data-reveal-p].delay-1 { transition-delay: .1s; }
        [data-reveal-p].delay-2 { transition-delay: .2s; }
        [data-reveal-p].delay-3 { transition-delay: .3s; }
        [data-reveal-p].delay-4 { transition-delay: .4s; }

        /* ─── Animations ─── */
        @keyframes playful-float { 0%,100% { transform: translateY(0) rotate(0deg); } 33% { transform: translateY(-8px) rotate(2deg); } 66% { transform: translateY(5px) rotate(-1deg); } }
        @keyframes playful-wiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(5deg); } 75% { transform: rotate(-3deg); } }
        @keyframes playful-bounce-in { 0% { opacity: 0; transform: scale(0.3) translateY(20px); } 50% { transform: scale(1.05) translateY(-5px); } 70% { transform: scale(0.95); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes playful-pop { 0% { opacity: 0; transform: scale(0.5); } 70% { transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes playful-dance { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-5px) rotate(2deg); } }
        @keyframes playful-pulse-glow { 0%,100% { box-shadow: 0 0 0 0 var(--pl); } 50% { box-shadow: 0 0 20px 5px var(--pl); } }
        @keyframes playful-slide-up { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes playful-spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* ─── Accordion ─── */
        .accordion-content { overflow: hidden; max-height: 0; transition: max-height .4s cubic-bezier(.22,1,.36,1), opacity .3s ease; opacity: 0; }
        .accordion-content.open { max-height: 300px; opacity: 1; }

        /* ─── Carousel ─── */
        .gallery-carousel { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
        .gallery-carousel > * { scroll-snap-align: start; }

        /* ─── Bouncy buttons ─── */
        .playful-btn { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
        .playful-btn:hover { transform: scale(1.05); }
        .playful-btn:active { transform: scale(0.95); }

        /* ─── Ripple effect ─── */
        .playful-card { transition: all .3s cubic-bezier(.22,1,.36,1); }
        .playful-card:hover { transform: translateY(-4px) scale(1.01); }

        /* ─── Dark mode overrides ─── */
        .website-dark { --bg-card: #2a2a2a; --bg-section: #222222; --text-primary: #d4d0c8; --text-secondary: #8a8a8a; --border-color: #3a3a3a; }
        .website-dark .bg-white { background-color: #2a2a2a !important; }
        .website-dark .bg-\[\#faf9f7\] { background-color: #2a2a2a !important; }
        .website-dark .text-\[\#1a1a1a\] { color: #d4d0c8 !important; }
        .website-dark .text-\[\#4a4a4a\] { color: #b0aca4 !important; }
        .website-dark .text-\[\#6a6a6a\] { color: #9a948a !important; }
        .website-dark .text-\[\#8a8a8a\] { color: #7a746a !important; }
        .website-dark .border-\[\#f0eeea\] { border-color: #3a3a3a !important; }
        .website-dark .border-\[\#e0ddd8\] { border-color: #444444 !important; }
        .website-dark .border-\[\#eee\] { border-color: #3a3a3a !important; }
        .website-dark .bg-\[\#fff\] { background: #222222 !important; }
        .website-dark .bg-white\/90 { background-color: rgba(42,42,42,0.9) !important; }
        .website-dark .bg-white\/95 { background-color: rgba(42,42,42,0.95) !important; }
        .website-dark .border-white { border-color: #3a3a3a !important; }
        .website-dark .hover\:border-\[var\(--p\)\]:hover { border-color: var(--p) !important; }
        .website-dark .shadow-md, .website-dark .shadow-sm, .website-dark .shadow-xl, .website-dark .shadow-lg { box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important; }
        .website-dark .bg-\[\#1a1a1a\] { background: #d4d0c8 !important; }
      `}</style>

      {/* ════════════════ NAVIGATION ════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-lg shadow-black/5" : "bg-transparent"
        }`}
        style={{ background: scrolled ? (isDark ? "rgba(42,42,42,0.92)" : "rgba(250,249,247,0.92)") : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none" }}
      >
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex items-center justify-between h-[72px]">
            <a href="#" className="flex items-center gap-3 no-underline group">
              <div
                className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}
              >
                {!s.logoUrl && <span className="text-sm font-bold text-white">{initials}</span>}
              </div>
              <div>
                <div className="text-[16px] font-bold text-[#1a1a1a] leading-tight">{schoolName}</div>
                <div className="text-[11px] text-[#8a8a8a]">{location || s.city || "Campus"}</div>
              </div>
            </a>

            <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
              {SECTIONS.map((item) => {
                const isActive = activeSection === item;
                return (
                  <li key={item}>
                    <a
                      href={`#${item}`}
                      className={`text-[14px] font-semibold px-3.5 py-2 rounded-xl no-underline transition-all duration-200 ${
                        isActive
                          ? "text-[var(--p)] bg-[var(--pl)]"
                          : "text-[#6a6a6a] hover:text-[var(--p)] hover:bg-[var(--pl)]"
                      }`}
                    >
                      {t(TRANSLATIONS.nav[item] || { en: item.charAt(0).toUpperCase() + item.slice(1), fr: item.charAt(0).toUpperCase() + item.slice(1) })}
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle variant="light" />
              <LanguageToggle lang={lang} isBilingual={isBilingual} onToggle={toggleLang} variant="light" />
              <a
                href="/login"
                className="playful-btn h-9 px-5 rounded-full text-[13px] font-bold text-white no-underline inline-flex items-center gap-1.5 shadow-md"
                style={{ background: pc, boxShadow: `0 4px 12px ${pcm}` }}
              >
                <Icon path={PATHS.login} className="w-3.5 h-3.5" /> {t(TRANSLATIONS.nav.portal)}
              </a>
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden w-10 h-10 border-2 border-[#e0ddd8] bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[5px] rounded-2xl"
            >
              <span className="block w-5 h-[2.5px] bg-[#1a1a1a] rounded-full transition-all duration-200" style={{ transform: mobileOpen ? "rotate(45deg) translate(5px,5px)" : "" }} />
              <span className="block w-5 h-[2.5px] bg-[#1a1a1a] rounded-full transition-all duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span className="block w-5 h-[2.5px] bg-[#1a1a1a] rounded-full transition-all duration-200" style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px,-5px)" : "" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 flex-col pt-20 px-5 pb-8 ${mobileOpen ? "flex" : "hidden"}`}
        style={{ background: isDark ? "rgba(42,42,42,0.97)" : "rgba(250,249,247,0.97)", backdropFilter: "blur(24px)" }}
      >
        {[...SECTIONS, "testimonials"].map((item) => (
          <a
            key={item}
            href={`#${item}`}
            onClick={() => setMobileOpen(false)}
            className="text-[22px] font-bold py-3.5 text-[#1a1a1a] border-b-2 border-[#eee] no-underline transition-all hover:text-[var(--p)]"
          >
            {t(TRANSLATIONS.nav[item] || { en: item.charAt(0).toUpperCase() + item.slice(1), fr: item.charAt(0).toUpperCase() + item.slice(1) })}
          </a>
        ))}
        <a
          href="/login"
          className="playful-btn mt-6 h-12 flex items-center justify-center rounded-full text-[16px] font-bold text-white no-underline shadow-lg"
          style={{ background: pc }}
        >
          <Icon path={PATHS.login} className="w-5 h-5 mr-2" /> {t(TRANSLATIONS.nav.studentPortal)}
        </a>
      </div>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative pt-28 pb-20 max-md:pt-24 max-md:pb-16 overflow-hidden">
        <FloatingShapes color={pc} />

        {/* Background gradient blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-15" style={{ background: pc, filter: "blur(70px)", animation: "playful-float 8s ease-in-out infinite" }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: pc, filter: "blur(60px)", animation: "playful-float 10s ease-in-out infinite reverse" }} />

        {s.heroImageUrl && (
          <img src={s.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}

        <div className="relative z-10 max-w-[1200px] mx-auto px-5">
          <div className="flex flex-col items-center text-center pt-8">
            {/* Badge */}
            {s.educationalSystems?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 justify-center" data-reveal-p>
                {s.educationalSystems.map((sys) => (
                  <span
                    key={sys}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full"
                    style={{ background: pcl, color: pc }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc }} />
                    {sys}
                  </span>
                ))}
              </div>
            )}

            {/* Logo */}
            <div
              className="w-24 h-24 rounded-[32px] overflow-hidden mb-6 border-4 border-white shadow-xl"
              style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc, animation: "playful-pop 0.6s cubic-bezier(.34,1.56,.64,1)" }}
            >
              {!s.logoUrl && <span className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">{initials}</span>}
            </div>

            <h1 className="text-[clamp(38px,6vw,72px)] font-bold leading-[1.08] tracking-[-0.5px] mb-4 max-w-[800px]" data-reveal-p>
              {t(TRANSLATIONS.playful.welcomeTo)} <span style={{ color: pc }}>{schoolName}</span> <Icon path={PATHS.smile} className="w-8 h-8 inline-block" style={{ color: pc }} />
            </h1>

            <p className="text-[clamp(16px,2vw,20px)] text-[#6a6a6a] leading-[1.7] mb-8 max-w-[560px]" data-reveal-p>
              {s.tagline || `${s.schoolName || "Our school"} is a warm, welcoming community where every child is inspired to learn, grow, and shine bright!`}
            </p>

            <div className="flex items-center gap-3 flex-wrap justify-center" data-reveal-p>
              <a
                href="#contact"
                className="playful-btn inline-flex items-center gap-2 h-[54px] px-7 rounded-full text-[15px] font-bold text-white no-underline shadow-xl"
                style={{ background: pc, boxShadow: `0 8px 28px ${pcm}` }}
              >
                <Icon path={PATHS.phone} className="w-[18px] h-[18px]" /> {t(TRANSLATIONS.hero.enrolNow)}
              </a>
              <a
                href="#about"
                className="playful-btn inline-flex items-center gap-2 h-[54px] px-7 rounded-full text-[15px] font-bold text-[#1a1a1a] no-underline border-2 transition-all"
                style={{ borderColor: "#e0ddd8" }}
              >
                <Icon path={PATHS.play} className="w-[18px] h-[18px]" /> {t(TRANSLATIONS.hero.explore)}
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 mt-14">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statItems.map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 shadow-md border-2 border-[#f0eeea] text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ animation: `playful-slide-up 0.5s ${0.2 + i * 0.15}s both` }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: pcl }}>
                  <Icon path={stat.icon} className="w-6 h-6" style={{ color: pc }} />
                </div>
                <div className="text-[30px] font-bold" style={{ color: pc }}>
                  <AnimatedCounter end={stat.end} suffix={stat.suffix || ""} />
                </div>
                <div className="text-[13px] text-[#8a8a8a] font-semibold mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ ABOUT ════════════════ */}
      <section className="py-24 max-md:py-16 relative" id="about">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 max-md:gap-8 items-center">
            <div>
              <p className="inline-block text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4" style={{ background: pcl, color: pc }} data-reveal-p>
                <Icon path={PATHS.book} className="w-3.5 h-3.5 inline-block mr-1" /> {t(TRANSLATIONS.about.aboutUs)}
              </p>
              <h2 className="text-[clamp(30px,4vw,44px)] font-bold leading-[1.12] mb-5" data-reveal-p>
                {t(TRANSLATIONS.about.ourStory)}</h2>
              <p className="text-[16px] text-[#6a6a6a] leading-[1.8] mb-6" data-reveal-p>
                {s.websiteDescription || `${s.schoolName || "Our school"} is a vibrant learning community where every student is known, valued, and supported to reach their full potential.`}
              </p>
              <div className="flex flex-wrap gap-3" data-reveal-p>
                {[
                  { icon: PATHS.calendar, label: t(TRANSLATIONS.about.founded), value: s.yearFounded || "1998" },
                  { icon: PATHS.users, label: t(TRANSLATIONS.about.faculty), value: stats.teachers || 32 },
                  { icon: PATHS.crosshair, label: t(TRANSLATIONS.about.passRate), value: `${s.examPassRate || 94}%` },
                ].map((item, i) => (
                  <div key={i} className="inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border-2 border-[#f0eeea] text-sm font-semibold transition-all hover:border-[var(--p)] hover:shadow-md">
                    <Icon path={item.icon} className="w-5 h-5" />
                    <span>{item.value}</span>
                    <span className="text-[#8a8a8a] font-normal">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative" data-reveal-p>
              <div className="relative rounded-[32px] overflow-hidden aspect-[4/5] shadow-2xl">
                {s.aboutPhotos && s.aboutPhotos.length > 0 ? (
                  <img src={s.aboutPhotos[0].url} alt={s.aboutPhotos[0].caption || ""} className="w-full h-full object-cover" />
                ) : s.heroImageUrl ? (
                  <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: pcl }}>
                    <Icon path={PATHS.camera} className="w-12 h-12" />
                  </div>
                )}
              </div>
              {s.aboutPhotos && s.aboutPhotos.length > 1 && (
                <div
                  className="absolute -bottom-4 -left-4 w-2/5 aspect-square rounded-[24px] overflow-hidden border-4 border-white shadow-2xl"
                  style={{ animation: "playful-dance 5s ease-in-out infinite" }}
                >
                  <img src={s.aboutPhotos[1].url} alt={s.aboutPhotos[1].caption || ""} className="w-full h-full object-cover" />
                </div>
              )}
              {/* Decorative */}
              <div className="absolute -top-6 -right-6 opacity-20" style={{ animation: "playful-float 6s ease-in-out infinite" }}><Icon path={PATHS.star} className="w-8 h-8" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ VALUES ════════════════ */}
      <section className="py-24 max-md:py-16 bg-white" style={{ background: isDark ? "#2a2a2a" : "#fff" }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-14">              <p className="inline-block text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4" style={{ background: pcl, color: pc }} data-reveal-p>
                <Icon path={PATHS.star} className="w-3.5 h-3.5 inline-block mr-1" /> {t(TRANSLATIONS.values.ourValues)}
              </p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.12]" data-reveal-p>
              {t(TRANSLATIONS.values.whatMakesUs)} <span className="inline-block" style={{ color: pc }}>{t(TRANSLATIONS.values.special)}</span> <Icon path={PATHS.star} className="w-5 h-5 inline-block" style={{ color: pc }} />
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.slice(0, 4).map((v, i) => (
              <TiltCard
                key={i}
                className="playful-card bg-[#faf9f7] rounded-[28px] p-7 border-2 border-[#f0eeea] cursor-default"
                data-reveal-p
              >
                <div
                  className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-5 transition-all duration-200"
                  style={{ background: pcl }}
                >
                  <Icon path={v.icon || PATHS.star} className="w-6 h-6" style={{ color: pc }} />
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">{v.label || v}</h3>
                <p className="text-[14px] text-[#8a8a8a] leading-relaxed">{v.description || v.desc || ""}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ ACADEMIC ACHIEVEMENTS ════════════════ */}
      {(s.examType || s.examPassRate || s.ranking) && (
        <section className="py-24 max-md:py-16 relative" id="academics">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="text-center mb-14">
              <p className="inline-block text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4" style={{ background: pcl, color: pc }} data-reveal-p>
                <Icon path={PATHS.award} className="w-3.5 h-3.5 inline-block mr-1" /> {t(TRANSLATIONS.achievements.achievements)}
              </p>
              <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.12]" data-reveal-p>
                {t(TRANSLATIONS.playful.weRock)} <span className="inline-block" style={{ color: pc }}>{t(TRANSLATIONS.classes.academics)}</span> <Icon path={PATHS.trendingUp} className="w-5 h-5 inline-block" />
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {s.examType && (
                <div className="bg-white rounded-[28px] p-8 text-center border-2 border-[#f0eeea] shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl" data-reveal-p>
                  <Icon path={PATHS.clipboard} className="w-10 h-10 mx-auto mb-3" />
                  <p className="text-[11px] font-bold tracking-[2px] uppercase mb-2 text-[#8a8a8a]">{t(TRANSLATIONS.about.examination)}</p>
                  <p className="text-2xl font-bold text-[#1a1a1a]">{s.examType}</p>
                </div>
              )}
              {s.examPassRate && (
                <div className="rounded-[28px] p-8 text-center border-2 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden" style={{ background: pcl, borderColor: pcm }} data-reveal-p>
                  <div className="absolute top-4 right-4 opacity-30" style={{ animation: "playful-wiggle 3s ease-in-out infinite" }}><Icon path={PATHS.star} className="w-8 h-8" /></div>
                  <Icon path={PATHS.crosshair} className="w-10 h-10 mx-auto mb-3" />
                  <p className="text-[11px] font-bold tracking-[2px] uppercase mb-2" style={{ color: pcm }}>{t(TRANSLATIONS.about.passRate)}</p>
                  <p className="text-5xl font-bold" style={{ color: pc }}>{s.examPassRate}%</p>
                </div>
              )}
              {s.ranking && (
                <div className="bg-white rounded-[28px] p-8 text-center border-2 border-[#f0eeea] shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl" data-reveal-p>
                  <Icon path={PATHS.award} className="w-10 h-10 mx-auto mb-3" />
                  <p className="text-[11px] font-bold tracking-[2px] uppercase mb-2 text-[#8a8a8a]">{t(TRANSLATIONS.about.ranking)}</p>
                  <p className="text-2xl font-bold text-[#1a1a1a]">{s.ranking}</p>
                  {s.rankingCity && <p className="text-[13px] text-[#8a8a8a] mt-1">{t(TRANSLATIONS.about.inRanking)} {s.rankingCity}</p>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ CLASSES (Accordion) ════════════════ */}
      <section className="py-24 max-md:py-16" style={{ background: isDark ? "#2a2a2a" : "#fff" }} id="classes">
        <div className="max-w-[800px] mx-auto px-5">
          <div className="text-center mb-14">              <p className="inline-block text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4" style={{ background: pcl, color: pc }} data-reveal-p>
                <Icon path={PATHS.bookOpen} className="w-3.5 h-3.5 inline-block mr-1" /> {t(TRANSLATIONS.classes.academics)}
              </p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.12]" data-reveal-p>
              {t(TRANSLATIONS.classes.ourClasses)} <span className="inline-block" style={{ color: pc }}>{t(TRANSLATIONS.classes.streams)}</span>
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {classesConfig.map((cls, i) => (
              <div
                key={i}
                className="bg-[#faf9f7] rounded-[24px] border-2 border-[#f0eeea] overflow-hidden transition-all duration-200 hover:shadow-md"
                data-reveal-p
              >
                <button
                  onClick={() => setExpandedClass(expandedClass === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 bg-transparent border-none cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg" style={{ background: pcl }}>
                      {cls.level.split(" ")[0]}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[#1a1a1a]">{cls.name}</h3>
                      <p className="text-[12px] text-[#8a8a8a] font-medium">{cls.age}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200" style={{ background: pcl, transform: expandedClass === i ? "rotate(180deg)" : "" }}>
                    <Icon path={PATHS.chevronDown} className="w-4 h-4" style={{ color: pc }} />
                  </div>
                </button>
                <div className={`accordion-content ${expandedClass === i ? "open" : ""}`}>
                  <p className="px-5 pb-5 text-[14px] text-[#6a6a6a] leading-relaxed border-t-2 border-[#f0eeea] pt-4">{cls.details || cls.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ GALLERY (Carousel) ════════════════ */}
      <section className="py-24 max-md:py-16" id="gallery">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-14">              <p className="inline-block text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4" style={{ background: pcl, color: pc }} data-reveal-p>
                <Icon path={PATHS.camera} className="w-3.5 h-3.5 inline-block mr-1" /> {t(TRANSLATIONS.gallery.gallery)}
              </p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.12]" data-reveal-p>
              {t(TRANSLATIONS.gallery.lifeAt)} {schoolShort || "School"} <Icon path={PATHS.feather} className="w-5 h-5 inline-block" />
            </h2>
          </div>

          {gallery.length > 0 ? (
            <>
              <div className="relative rounded-[32px] overflow-hidden shadow-xl bg-white" data-reveal-p>
                <div
                  ref={galleryRef}
                  className="gallery-carousel flex overflow-x-auto snap-x gap-0"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {gallery.map((img, i) => (
                    <div key={i} className="min-w-full flex-shrink-0 relative" style={{ height: "min(380px, 50vh)", overflow: "hidden" }}>
                      <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover" style={{ background: pcl }} />
                      {img.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                          <p className="text-white font-semibold text-sm">{img.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Nav buttons */}
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={() => setGalleryIdx((i) => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg border-none cursor-pointer flex items-center justify-center text-[#1a1a1a] hover:bg-white transition-all z-10"
                    >
                      <Icon path={PATHS.arrow} className="w-5 h-5 rotate-180" />
                    </button>
                    <button
                      onClick={() => setGalleryIdx((i) => (i + 1) % gallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 shadow-lg border-none cursor-pointer flex items-center justify-center text-[#1a1a1a] hover:bg-white transition-all z-10"
                    >
                      <Icon path={PATHS.arrow} className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex justify-center gap-2 mt-4" data-reveal-p>
                  {gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIdx(i)}
                      className="w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0"
                      style={{
                        borderColor: i === galleryIdx ? pc : "transparent",
                        opacity: i === galleryIdx ? 1 : 0.5,
                      }}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="rounded-[28px] min-h-[200px] flex items-center justify-center bg-white border-2 border-[#f0eeea]" style={{ animation: `playful-float ${5 + i}s ease-in-out ${i * 0.3}s infinite` }}>
                  <Icon path={PATHS.camera} className="w-8 h-8 opacity-30" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════ ANNOUNCEMENTS ════════════════ */}
      <WebsiteAnnouncements
        school={school}
        variant="playful"
        primaryColor={pc}
        t={t}
        TRANSLATIONS={TRANSLATIONS}
        theme={{ isDark }}
      />

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section className="py-24 max-md:py-16 relative overflow-hidden" style={{ background: isDark ? "#2a2a2a" : "#fff" }} id="testimonials">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-[0.05]" style={{ background: pc, filter: "blur(70px)" }} />
        <div className="absolute bottom-10 right-10 opacity-[0.04]" style={{ animation: "playful-float 7s ease-in-out infinite" }}><Icon path={PATHS.messageCircle} className="w-12 h-12" /></div>

        <div className="relative max-w-[700px] mx-auto px-5 text-center">
          <p className="inline-block text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4" style={{ background: pcl, color: pc }} data-reveal-p>
            <Icon path={PATHS.messageCircle} className="w-3.5 h-3.5 inline-block mr-1" /> {t(TRANSLATIONS.testimonials.testimonials)}
          </p>
          <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.12] mb-10" data-reveal-p>
            {t(TRANSLATIONS.testimonials.whatCommunitySays)} <Icon path={PATHS.heart} className="w-5 h-5 inline-block" style={{ color: pc }} />
          </h2>

          <div className="relative min-h-[220px]">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`transition-all duration-500 absolute w-full ${
                  i === testimonialIdx
                    ? "opacity-100 translate-x-0 scale-100"
                    : "opacity-0 translate-x-10 scale-95 pointer-events-none"
                }`}
              >
                <div className="flex justify-center gap-1 mb-5" style={{ animation: "playful-wiggle 3s ease-in-out infinite" }}>
                  {[...Array(t.rating)].map((_, si) => (
                    <span key={si} className="text-2xl" style={{ color: pc }}>★</span>
                  ))}
                </div>
                <p className="text-[clamp(18px,2.5vw,24px)] font-bold leading-[1.6] text-[#4a4a4a] mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-[18px] flex items-center justify-center text-lg font-bold text-white shadow-lg" style={{ background: pc }}>
                    {t.author[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-[16px] font-bold text-[#1a1a1a]">{t.author}</p>
                    <p className="text-[13px] text-[#8a8a8a] font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                className="w-3 h-3 rounded-full border-none cursor-pointer transition-all duration-300"
                style={{
                  background: i === testimonialIdx ? pc : "#e0ddd8",
                  transform: i === testimonialIdx ? "scale(1.4)" : "scale(1)",
                }}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ ENROLMENT FORM ════════════════ */}
      <section className="py-24 max-md:py-16" style={{ background: isDark ? "#2a2a2a" : "#fff" }} id="enrol">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-12">              <p className="inline-block text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4" style={{ background: pcl, color: pc }} data-reveal-p>
                <Icon path={PATHS.edit3} className="w-3.5 h-3.5 inline-block mr-1" /> {t(TRANSLATIONS.enrolment.enrolment)}
              </p>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.12]" data-reveal-p>
              {t(TRANSLATIONS.enrolment.joinUs)} <span className="inline-block" style={{ color: pc }}>{t(TRANSLATIONS.enrolment.schoolFamily)}</span> <Icon path={PATHS.book} className="w-5 h-5 inline-block" />
            </h2>
            <p className="text-[15px] text-[#6a6a6a] max-w-[500px] mx-auto mt-3" data-reveal-p>
              {t(TRANSLATIONS.playful.weWouldLove)} {schoolShort || t(TRANSLATIONS.enrolment.schoolFamily)}! {t(TRANSLATIONS.playful.ourFriendly)}
            </p>
          </div>
          <div className="max-w-[640px] mx-auto" data-reveal-p>
            <div className="bg-[#faf9f7] rounded-[32px] p-8 border-2 border-[#f0eeea] shadow-sm">
              <EnrollmentForm
                variant="light"
                primaryColor={pc}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ CONTACT ════════════════ */}
      <section className="py-24 max-md:py-16" id="contact">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 max-md:gap-8">
            <div>
              <p className="inline-block text-[11px] font-bold tracking-[2px] uppercase px-4 py-1.5 rounded-full mb-4" style={{ background: pcl, color: pc }} data-reveal-p>
                <Icon path={PATHS.phone} className="w-3.5 h-3.5 inline-block mr-1" /> {t(TRANSLATIONS.contact.getInTouch)}
              </p>
              <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.12] mb-5" data-reveal-p>
                {t(TRANSLATIONS.contact.visitUs)} <Icon path={PATHS.messageCircle} className="w-5 h-5 inline-block" style={{ color: pc }} />
              </h2>
              <p className="text-[16px] text-[#6a6a6a] leading-[1.7] mb-8 max-w-[420px]" data-reveal-p>
                {t(TRANSLATIONS.playful.ourFriendly)}
              </p>
              <div className="flex flex-col gap-4">
                {contactItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group" data-reveal-p>
                    <div className="w-12 h-12 rounded-[18px] flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3" style={{ background: pcl }}>
                      <Icon path={item.icon} className="w-6 h-6" style={{ color: pc }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold tracking-wider uppercase text-[#8a8a8a] mb-0.5">{item.label}</p>
                      <p className="text-[15px] font-semibold text-[#1a1a1a]">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="rounded-[32px] min-h-[350px] flex items-center justify-center flex-col gap-4 border-2 border-dashed transition-all duration-200 hover:border-solid"
              style={{ background: pcl, borderColor: pcm }}
              data-reveal-p
            >
              <Icon path={PATHS.pin} className="w-12 h-12" style={{ color: pcm, animation: "playful-float 5s ease-in-out infinite" }} />
              <p className="text-[16px] font-bold" style={{ color: pcm }}>{schoolName}</p>
              <p className="text-[13px] text-[#8a8a8a]">{location || "City, Region"}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(s.address || `${s.city || ""} ${s.region || ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="playful-btn inline-flex items-center gap-2 h-10 px-6 rounded-full text-[12px] font-bold text-white no-underline mt-2 shadow-md"
                style={{ background: pc }}
              >
                <Icon path={PATHS.pin} className="w-3.5 h-3.5" /> {t(TRANSLATIONS.contact.openInMaps)}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t-2 border-[#f0eeea]" style={{ background: isDark ? "#1a1a1a" : "#fff" }}>
        <div className="max-w-[1200px] mx-auto px-5 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: pc }}>
                  <Icon path={PATHS.building} className="w-4 h-4 text-white" />
                </div>
                <span className="text-[18px] font-bold text-[#1a1a1a]">{schoolName}</span>
              </div>
              <p className="text-[13px] text-[#8a8a8a] leading-relaxed">{t(TRANSLATIONS.footer.shaping)} {s.yearFounded || "1998"} <Icon path={PATHS.star} className="w-3 h-3 inline-block" /></p>
            </div>
            {[
              { title: t(TRANSLATIONS.footer.navigate), links: [{ label: t(TRANSLATIONS.nav.about), href: "#about" }, { label: t(TRANSLATIONS.nav.classes), href: "#classes" }, { label: t(TRANSLATIONS.nav.gallery), href: "#gallery" }, { label: t(TRANSLATIONS.nav.contact), href: "#contact" }] },
              { title: t(TRANSLATIONS.footer.forYou), links: [{ label: t(TRANSLATIONS.nav.studentPortal), href: "/login" }, { label: t(TRANSLATIONS.nav.parentPortal), href: "/login" }, { label: t(TRANSLATIONS.footer.fees), href: "#" }] },
              { title: t(TRANSLATIONS.footer.info), links: [{ label: t(TRANSLATIONS.footer.results), href: "#academics" }, { label: t(TRANSLATIONS.footer.admissions), href: "#contact" }, { label: t(TRANSLATIONS.footer.calendar), href: "#" }] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-[12px] font-bold tracking-wider uppercase mb-4" style={{ color: pcm }}>{col.title}</p>
                <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                  {col.links.map((link, j) => (
                    <li key={j}><a href={link.href} className="text-[14px] font-medium text-[#8a8a8a] no-underline hover:text-[var(--p)] transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-[#f0eeea] pt-6 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
            <p className="text-[13px] text-[#8a8a8a]">&copy; {year} {schoolName}. {t(TRANSLATIONS.footer.rights)}</p>
            <p className="text-[13px] text-[#8a8a8a]">{t(TRANSLATIONS.footer.madeWith)} <Icon path={PATHS.heart} className="w-3 h-3 inline-block" style={{ color: pc }} /> {t(TRANSLATIONS.footer.by)} <strong className="font-semibold" style={{ color: pc }}>Akademee</strong></p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#f0eeea] p-3 pb-[max(12px,env(safe-area-inset-bottom))] flex gap-2.5" style={{ background: isDark ? "rgba(42,42,42,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" }}>
        <a
          href="/login"
          className="playful-btn flex-1 h-12 flex items-center justify-center rounded-full text-[14px] font-bold text-white no-underline shadow-lg"
          style={{ background: pc, boxShadow: `0 4px 16px ${pcm}` }}
        >
          <Icon path={PATHS.login} className="w-4 h-4" /> {t(TRANSLATIONS.nav.signIn)}
        </a>
        <a href="#contact" className="playful-btn flex-1 h-12 flex items-center justify-center rounded-full text-[14px] font-bold text-[#1a1a1a] no-underline border-2 border-[#e0ddd8]">
          <Icon path={PATHS.phone} className="w-4 h-4" /> {t(TRANSLATIONS.nav.contact)}
        </a>
      </div>

      {/* Back to top */}
      <BackToTopButton show={showBackToTop} color={pc} variant="light" />
    </div>
  );
}
