import { useState, useEffect, useRef, useCallback } from "react";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const SECTIONS = ["about", "classes", "gallery", "announcements", "testimonials", "enrol", "contact"];
const CLASS_LEVELS = ["All", "Junior", "Senior", "O Level", "A Level"];

// ──────────────────────────── Reusable sub-components ────────────────────────────

import { FiHome, FiLogIn, FiPhone, FiMail, FiMapPin, FiArrowRight, FiStar, FiUsers, FiImage, FiPlay, FiCalendar, FiMessageCircle, FiClock, FiChevronLeft, FiChevronRight, FiX, FiSearch, FiCrosshair, FiHeart, FiEdit3 } from "react-icons/fi";
import EnrollmentForm from "../components/EnrollmentForm";
import WebsiteAnnouncements from "../components/WebsiteAnnouncements";
import { useScrollProgress, ScrollProgressBar, BackToTopButton } from "../hooks/useScrollProgress.jsx";
import { useCursorGlow } from "../hooks/useCursorGlow.jsx";
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
  quote: FiMessageCircle,
  clock: FiClock,
  chevronLeft: FiChevronLeft,
  chevronRight: FiChevronRight,
  x: FiX,
  search: FiSearch,
  target: FiCrosshair,
  heart: FiHeart,
};

const PATHS = Object.fromEntries(Object.keys(PATH_TO_ICON).map(k => [k, k]));

const Icon = ({ path, className, style }) => {
  const IconComp = PATH_TO_ICON[path];
  return IconComp ? <IconComp className={className || "w-5 h-5"} style={style} /> : null;
};

// ──────────────────────── ScrollReveal hook ────────────────────────

function useScrollReveal(threshold = 0.08) {
  const [visible, setVisible] = useState(new Set());

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible((prev) => new Set(prev).add(e.target.dataset.reveal));
            e.target.classList.add("bold-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold }
    );

    const els = document.querySelectorAll("[data-reveal]");
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [threshold]);

  return visible;
}

// ──────────────────────── AnimatedCounter ────────────────────────

function AnimatedCounter({ end, suffix = "", duration = 2000 }) {
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

          function frame(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * num));
            if (progress < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
          obs.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ──────────────────────── MagneticButton ────────────────────────

function MagneticButton({ children, href, className, style }) {
  const ref = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "";
  }, []);

  return (
    <a
      ref={ref}
      href={href}
      className={`inline-flex items-center gap-2.5 no-underline transition-transform duration-200 ${className || ""}`}
      style={{ willChange: "transform", ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </a>
  );
}

// ──────────────────────── Lightbox ────────────────────────

function Lightbox({ images, index, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  if (!images[index]) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.95)" }}
      onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center border-none bg-white/10 rounded-full cursor-pointer text-white hover:bg-white/20 transition-colors z-10">
        <Icon path={PATHS.x} className="w-5 h-5" />
      </button>
      <img
        src={images[index].url}
        alt={images[index].caption || ""}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {images[index].caption && (
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
          {images[index].caption}
        </p>
      )}
    </div>
  );
}

// ──────────────────────── Main Template ────────────────────────

export default function BoldTemplate({ school }) {
  const s = school || {};
  const pc = s.primaryColor || "#085041";
  const pcl = hexToRgba(pc, 0.12);
  const pcm = hexToRgba(pc, 0.5);

  const year = new Date().getFullYear();
  const location = [s.city, s.region].filter(Boolean).join(", ");
  const schoolName = s.name || s.schoolName || "School Name";
  const schoolShort = schoolName.split(" ")[0];
  const initials = schoolName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  // State
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeClassLevel, setActiveClassLevel] = useState("All");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [parallaxOffset, setParallaxOffset] = useState(0);

  // Interactive hooks
  const { progress, showBackToTop } = useScrollProgress(300);
  const { CursorGlow } = useCursorGlow(pc, 500, 0.04);
  const activeSection = useActiveSection(SECTIONS, 100);
  const { lang, isBilingual, toggleLang, t } = useWebsiteLanguage(s.educationalSystems);
  const { isDark, ThemeToggle } = useWebsiteTheme("dark");

  // Scroll handler
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      setParallaxOffset(window.scrollY * 0.3);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mouse tracker for parallax
  useEffect(() => {
    const onMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  // Body scroll lock for mobile menu & lightbox
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Re-initialize scroll reveals after render
  useScrollReveal();

  // Data
  const stats = s.websiteStats || {};
  const statItems = [
    { end: stats.studentsEnrolled || 248, label: t(TRANSLATIONS.classes.students), icon: PATHS.users },
    { end: stats.teachers || 32, label: t(TRANSLATIONS.about.faculty), icon: PATHS.star },
    { end: s.examPassRate ? parseInt(s.examPassRate) : 94, suffix: "%", label: `${s.examType || "GCE"} ${t(TRANSLATIONS.about.passRate)}`, icon: PATHS.target },
    { end: s.yearFounded ? parseInt(s.yearFounded) : 1998, label: t(TRANSLATIONS.about.founded), icon: PATHS.calendar },
  ];

  const values = s.websiteValues?.length > 0 ? s.websiteValues : [
    { label: "Academic Excellence", description: "Rigorous curriculum delivered by highly qualified faculty across all disciplines" },
    { label: "Bilingual Mastery", description: "Complete English and French instruction preparing students for global opportunities" },
    { label: "Character Formation", description: "Values-driven education that builds integrity, leadership, and responsibility" },
    { label: "Community Spirit", description: "Welcoming environment where every student belongs and thrives" },
  ];

  const classesConfig = s.classesConfig?.length > 0 ? s.classesConfig : [
    { level: "Junior", name: "Form 1 & 2", desc: "Foundation years building core competencies across all subjects with dedicated form tutors.", age: "Ages 12–13", icon: PATHS.search },
    { level: "Junior", name: "Form 3", desc: "Pre-GCE introduction with expanded subject choices and career guidance.", age: "Ages 14–15", icon: PATHS.search },
    { level: "O Level", name: "Form 4 & 5", desc: "GCE O-Level programme with sciences, arts, and commercial streams available.", age: "Ages 15–17", icon: PATHS.heart },
    { level: "A Level", name: "Lower Sixth", desc: "Advanced Level year one — specialised study in chosen A-Level subjects.", age: "Ages 17–18", icon: PATHS.heart },
    { level: "A Level", name: "Upper Sixth", desc: "Final year culminating in GCE A-Level examinations and university placement.", age: "Ages 18–19", icon: PATHS.target },
  ];

  const filteredClasses = activeClassLevel === "All"
    ? classesConfig
    : classesConfig.filter((c) => c.level === activeClassLevel);

  const gallery = s.gallery?.length > 0 ? s.gallery : (s.aboutPhotos || []);

  const testimonials = [
    { quote: "This school gave my children not just an education, but the confidence and skills to succeed anywhere in the world. The bilingual programme is exceptional.", author: "Parent", role: `$                  {schoolName} Parent` },
    { quote: "The teachers here genuinely care about each student. My son has grown tremendously both academically and personally since joining.", author: "Parent", role: `Current Parent` },
    { quote: "I was well prepared for university thanks to the rigorous A-Level programme and the personal mentorship I received.", author: "Alumnus", role: `Class of ${(parseInt(s.yearFounded) || 2020) + 5}` },
  ];

  const contactItems = [
    { icon: PATHS.pin, label: t(TRANSLATIONS.contact.address), value: s.address || `${s.city || "City"}, ${s.region || "Region"}` },
    { icon: PATHS.phone, label: t(TRANSLATIONS.contact.phone), value: s.phone || "+237 6XX XXX XXX" },
    { icon: PATHS.mail, label: t(TRANSLATIONS.contact.email), value: s.email || "info@yourschool.cm" },
    { icon: PATHS.clock, label: t(TRANSLATIONS.contact.hours), value: "Mon – Fri · 7:30 AM – 4:00 PM" },
  ];

  return (      <div className={`font-sans antialiased overflow-x-hidden relative ${!isDark ? "website-light" : ""}`} style={{ "--p": pc, "--pl": pcl, "--pm": pcm, background: isDark ? "#080808" : "#f5f5f0", color: isDark ? "white" : "#1a1a1a" }}>
      <CursorGlow />
      <ScrollProgressBar progress={progress} color={pc} />
      <style>{`
        /* ─── Scroll reveals ─── */
        [data-reveal] { opacity: 0; transform: translateY(40px); transition: opacity .7s cubic-bezier(.2,.9,.3,1), transform .7s cubic-bezier(.2,.9,.3,1); }
        [data-reveal].bold-visible { opacity: 1; transform: translateY(0); }
        [data-reveal].bold-visible-delay-1 { transition-delay: .1s; }
        [data-reveal].bold-visible-delay-2 { transition-delay: .2s; }
        [data-reveal].bold-visible-delay-3 { transition-delay: .3s; }

        /* ─── Glassmorphism ─── */
        .bold-glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.06); }

        /* ─── Keyframes ─── */
        @keyframes bold-float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes bold-pulse { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        @keyframes bold-glow { 0%,100% { box-shadow: 0 0 20px var(--pl); } 50% { box-shadow: 0 0 40px var(--pm); } }
        @keyframes bold-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes bold-border-draw { to { stroke-dashoffset: 0; } }
        @keyframes bold-scale-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }

        /* ─── Light mode overrides ─── */
        .website-light { --bg-card: #ffffff; --bg-section: #f0efea; --text-primary: #1a1a1a; --text-secondary: #6a6a6a; --border-light: #e0ddd8; }
        .website-light .bold-glass { background: rgba(255,255,255,0.8); backdrop-filter: blur(24px); border-color: rgba(0,0,0,0.06); }
        .website-light .text-white\/40 { color: rgba(26,26,26,0.4) !important; }
        .website-light .text-white\/50 { color: rgba(26,26,26,0.5) !important; }
        .website-light .text-white\/45 { color: rgba(26,26,26,0.45) !important; }
        .website-light .text-white\/70 { color: rgba(26,26,26,0.7) !important; }
        .website-light .text-white\/80 { color: rgba(26,26,26,0.8) !important; }
        .website-light .text-white\/30 { color: rgba(26,26,26,0.3) !important; }
        .website-light .border-white\/10 { border-color: rgba(0,0,0,0.08) !important; }
        .website-light .border-white\/5 { border-color: rgba(0,0,0,0.05) !important; }
        .website-light .bg-white\/5 { background: rgba(0,0,0,0.03) !important; }
        .website-light .bg-white\/10 { background: rgba(0,0,0,0.05) !important; }
        .website-light .hover\:bg-white\/5:hover { background: rgba(0,0,0,0.03) !important; }
        .website-light .hover\:bg-white\/10:hover { background: rgba(0,0,0,0.05) !important; }
        .website-light .hover\:text-white:hover { color: #1a1a1a !important; }
        .website-light .bg-\[\#0d0d0d\] { background: #f0efea !important; }
        .website-light .bg-\[\#030303\] { background: #e8e7e2 !important; }
        
        /* ─── Tab active indicator ─── */
        .tab-active { background: var(--p) !important; color: #fff !important; }

        /* ─── Carousel ─── */
        .testimonial-enter { opacity: 0; transform: translateX(30px); }
        .testimonial-active { opacity: 1; transform: translateX(0); transition: all .5s cubic-bezier(.2,.9,.3,1); }

        /* ─── Disable global scrollbar override to avoid leaking into host page styles ─── */
      `}</style>

      {/* ════════════════ NAVIGATION ════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bold-glass shadow-2xl" : "bg-transparent"}`}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 no-underline group">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}>
                {!s.logoUrl && <span className="text-[13px] font-bold text-white">{initials}</span>}
              </div>
              <div className="hidden sm:block">
                <div className="text-[15px] font-semibold text-white leading-tight">            {schoolName}</div>
                <div className="text-[11px] text-white/40">{location || s.city || "Campus"}</div>
              </div>
            </a>

            {/* Desktop Nav */}
            <ul className="hidden md:flex items-center gap-0.5 list-none m-0 p-0">
              {SECTIONS.map((item) => {
                const isActive = activeSection === item;
                return (
                  <li key={item}>
                    <a
                      href={`#${item}`}
                      className={`text-[13px] font-medium px-3.5 py-2 rounded-lg no-underline transition-all duration-200 ${
                        isActive
                          ? "text-white bg-white/10"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {t(TRANSLATIONS.nav[item] || { en: item.charAt(0).toUpperCase() + item.slice(1), fr: item.charAt(0).toUpperCase() + item.slice(1) })}
                      {isActive && (
                        <span className="inline-block w-1 h-1 rounded-full ml-1.5" style={{ background: pc }} />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              <ThemeToggle variant="dark" />
              <LanguageToggle lang={lang} isBilingual={isBilingual} onToggle={toggleLang} variant="dark" />
              <a href="/login" className="h-9 px-4 rounded-xl text-[13px] font-medium text-white/70 no-underline inline-flex items-center transition-colors hover:text-white">
                {t(TRANSLATIONS.nav.signIn)}
              </a>
              <a href="/login" className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white no-underline inline-flex items-center gap-1.5 transition-all duration-200 hover:brightness-110" style={{ background: pc }}>
                <Icon path={PATHS.login} className="w-3.5 h-3.5" /> {t(TRANSLATIONS.nav.portal)}
              </a>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden w-10 h-10 border-none bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[5px] rounded-lg"
            >
              <span className="block w-5 h-[2px] bg-white rounded transition-all duration-200" style={{ transform: mobileOpen ? "rotate(45deg) translate(5px,5px)" : "" }} />
              <span className="block w-5 h-[2px] bg-white rounded transition-all duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
              <span className="block w-5 h-[2px] bg-white rounded transition-all duration-200" style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px,-5px)" : "" }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 flex-col pt-20 px-6 pb-8 ${mobileOpen ? "flex" : "hidden"}`} style={{ background: "rgba(8,8,8,0.98)", backdropFilter: "blur(24px)" }}>
        {[...SECTIONS, "academics"].map((item) => (
          <a
            key={item}
            href={`#${item}`}
            onClick={() => setMobileOpen(false)}
            className="text-[20px] font-medium py-3.5 text-white/70 border-b border-white/5 no-underline hover:text-white transition-colors"
          >
            {t(TRANSLATIONS.nav[item] || { en: item.charAt(0).toUpperCase() + item.slice(1), fr: item.charAt(0).toUpperCase() + item.slice(1) })}
          </a>
        ))}
        <div className="flex flex-col gap-2.5 mt-6">
          <a href="/login" className="h-12 flex items-center justify-center rounded-xl text-[15px] font-semibold text-white no-underline" style={{ background: pc }}>
            <Icon path={PATHS.login} className="w-4 h-4 mr-2" /> {t(TRANSLATIONS.nav.studentPortal)}
          </a>
        </div>
      </div>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 z-0">
          {s.heroImageUrl ? (
            <img
              src={s.heroImageUrl}
              alt=""
              className="w-full h-full object-cover opacity-35"
              style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
            />
          ) : s.heroImageUrl2 ? (
            <img
              src={s.heroImageUrl2}
              alt=""
              className="w-full h-full object-cover opacity-25"
              style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
            />
          ) : null}
          {/* Gradient overlays */}
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, #080808 0%, ${hexToRgba(pc, 0.25)} 50%, #080808 100%)` }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${pc} 0%, transparent 60%)` }} />
          {/* Animated glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.06]" style={{ background: pc, filter: "blur(100px)", animation: "bold-pulse 8s ease-in-out infinite" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full pt-32 pb-48 max-md:pb-36">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="max-w-[800px]">
              {s.educationalSystems?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6" data-reveal>
                  {s.educationalSystems.map((sys) => (
                    <span
                      key={sys}
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[2px] uppercase px-3 py-1.5 rounded-full border"
                      style={{ borderColor: pcm, color: pcm }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc }} />
                      {sys}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6" data-reveal>
                <div
                  className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2"
                  style={{ borderColor: pcm, background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : pc }}
                >
                  {!s.logoUrl && <span className="w-full h-full flex items-center justify-center text-xl font-bold text-white">{initials}</span>}
                </div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[2px] uppercase text-white/40">{s.yearFounded ? `Est. ${s.yearFounded}` : ""}</div>
                  {s.tagline && <div className="text-[13px] text-white/30 mt-0.5">{s.tagline}</div>}
                </div>
              </div>

              <h1 className="text-[clamp(44px,7vw,88px)] font-bold leading-[1.02] tracking-[-2px] mb-6" data-reveal>
                {schoolName}
              </h1>

              <p className="text-[clamp(17px,2vw,21px)] text-white/50 leading-[1.7] mb-10 max-w-[600px]" data-reveal>
                {s.websiteDescription
                  ? s.websiteDescription.slice(0, 200)
                  : `${s.schoolName || "Our school"} provides world-class education through academic rigour, bilingual excellence, and a tradition of achievement that prepares students for global success.`
                }
              </p>

              <div className="flex items-center gap-4 flex-wrap" data-reveal>
                <MagneticButton
                  href="#contact"
                  className="h-[56px] px-8 rounded-xl text-[15px] font-semibold text-white active:scale-[0.97] hover:brightness-110 shadow-xl"
                  style={{ background: pc, boxShadow: `0 8px 32px ${hexToRgba(pc, 0.35)}` }}
                >
                  <Icon path={PATHS.phone} className="w-[18px] h-[18px]" />
                  {t(TRANSLATIONS.hero.enrolNow)}
                </MagneticButton>
                <MagneticButton
                  href="#about"
                  className="h-[56px] px-7 rounded-xl text-[15px] font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20"
                >
                  <Icon path={PATHS.play} className="w-[18px] h-[18px]" />
                  {t(TRANSLATIONS.hero.discover)}
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10" style={{ background: "linear-gradient(to top, #080808, transparent)" }}>
          <div className="max-w-[1280px] mx-auto px-6 pb-8 pt-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-md:gap-4">
              {statItems.map((stat, i) => (
                <div key={i} className="border-l border-white/10 pl-5 max-md:border-l-0 max-md:pl-0 max-md:border-t max-md:pt-4" data-reveal>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon path={stat.icon} className="w-4 h-4" style={{ color: pc }} />
                    <div className="text-[clamp(26px,3vw,36px)] font-bold text-white leading-none">
                      <AnimatedCounter end={stat.end} suffix={stat.suffix || ""} />
                    </div>
                  </div>
                  <div className="text-[12px] text-white/40 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ ABOUT ════════════════ */}
      <section className="py-28 max-md:py-16" id="about">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-md:gap-10 items-center">
            <div>
              <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-3" style={{ color: pc }} data-reveal>{t(TRANSLATIONS.about.aboutUs)}</p>
              <h2 className="text-[clamp(30px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.5px] mb-6" data-reveal>
                {t(TRANSLATIONS.bold.legacy)} <br /><em className="italic" style={{ color: pc }}>{t(TRANSLATIONS.bold.excellence)}</em>
              </h2>
              <p className="text-[16px] text-white/45 leading-[1.8] mb-8" data-reveal>
                {s.websiteDescription || `${s.schoolName || "Our school"} is dedicated to providing a supportive, challenging environment where every student can thrive and achieve their full potential. Our approach combines academic rigour with personal development.`}
              </p>

              {/* Key facts */}
              <div className="flex flex-wrap gap-3" data-reveal>
                {[
                  { value: s.examType || "GCE", label: t(TRANSLATIONS.about.examination) },
                  { value: s.examPassRate ? `${s.examPassRate}%` : "94%", label: t(TRANSLATIONS.about.passRate) },
                  { value: s.ranking || "Top 5", label: s.rankingCity || t(TRANSLATIONS.about.ranking) },
                ].map((item, i) => (
                  <div key={i} className="bold-glass rounded-xl px-5 py-3.5 text-center min-w-[110px] transition-all duration-200 hover:brightness-125" style={{ animation: i === 0 ? `bold-glow 4s ease-in-out ${i}s infinite` : "none" }}>
                    <div className="text-lg font-bold text-white">{item.value}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image collage */}
            <div className="relative" data-reveal>
              <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-2xl">
                {s.aboutPhotos && s.aboutPhotos.length > 0 ? (
                  <img src={s.aboutPhotos[0].url} alt={s.aboutPhotos[0].caption || ""} className="w-full h-full object-cover" />
                ) : s.heroImageUrl ? (
                  <img src={s.heroImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: pcl }}>
                    <Icon path={PATHS.image} className="w-16 h-16 text-white/20" />
                  </div>
                )}
                {/* Gradient overlay on image */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,8,8,0.6), transparent)" }} />
              </div>
              {s.aboutPhotos && s.aboutPhotos.length > 1 && (
                <div className="absolute -bottom-5 -right-5 w-2/5 aspect-[3/4] rounded-xl overflow-hidden border-4 border-[#080808] shadow-2xl" style={{ animation: "bold-float 6s ease-in-out infinite" }}>
                  <img src={s.aboutPhotos[1].url} alt={s.aboutPhotos[1].caption || ""} className="w-full h-full object-cover" />
                </div>
              )}
              {/* Decorative element */}
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-10" style={{ background: pc, filter: "blur(40px)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ VALUES ════════════════ */}
      <section className="py-28 max-md:py-16 relative overflow-hidden" style={{ background: isDark ? "#0d0d0d" : "#f0efea" }}>
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: pc, filter: "blur(100px)" }} />
        <div className="relative max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: pc }} data-reveal>{t(TRANSLATIONS.values.ourValues)}</p>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1]" data-reveal>
              {t(TRANSLATIONS.values.whatMakesUs)} <span className="italic" style={{ color: pc }}>{t(TRANSLATIONS.values.different)}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.slice(0, 4).map((v, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = pcm;
                  e.currentTarget.style.background = hexToRgba(pc, 0.06);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
                data-reveal
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110" style={{ background: pcl }}>
                  <Icon path={PATHS.star} className="w-5 h-5" style={{ color: pc }} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{v.label || v}</h3>
                <p className="text-[14px] text-white/40 leading-relaxed">{v.description || v.desc || ""}</p>
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 30px ${hexToRgba(pc, 0.05)}` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ ACHIEVEMENTS ════════════════ */}
      {(s.examType || s.examPassRate || s.ranking) && (
        <section className="py-28 max-md:py-16" id="academics">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: pc }} data-reveal>{t(TRANSLATIONS.about.ourRecord)}</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1]" data-reveal>
                {t(TRANSLATIONS.about.ourAcademic)} <span className="italic" style={{ color: pc }}>{t(TRANSLATIONS.achievements.record)}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {s.examType && (
                <div className="bold-glass rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-1" data-reveal>
                  <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-2 text-white/30">{t(TRANSLATIONS.about.examination)}</p>
                  <p className="text-3xl font-bold text-white">{s.examType}</p>
                  <div className="mt-4 w-full h-1 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: "100%", background: pc, opacity: 0.5 }} />
                  </div>
                </div>
              )}
              {s.examPassRate && (
                <div className="rounded-2xl p-10 text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ background: pcl, border: `1px solid ${pcm}` }} data-reveal>
                  <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${pc}, transparent)`, animation: "bold-pulse 5s ease-in-out infinite" }} />
                  <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-2 relative" style={{ color: pcm }}>{t(TRANSLATIONS.about.passRate)}</p>
                  <p className="text-6xl font-bold relative" style={{ color: pc }}>{s.examPassRate}%</p>
                  <div className="mt-4 w-full h-1.5 rounded-full bg-white/5 relative">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(parseInt(s.examPassRate) || 94, 100)}%`, background: pc }} />
                  </div>
                </div>
              )}
              {s.ranking && (
                <div className="bold-glass rounded-2xl p-10 text-center transition-all duration-300 hover:-translate-y-1" data-reveal>
                  <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-2 text-white/30">{t(TRANSLATIONS.about.ranking)}</p>
                  <p className="text-3xl font-bold text-white">{s.ranking}</p>
                  {s.rankingCity && <p className="text-[13px] text-white/30 mt-1">{t(TRANSLATIONS.about.inRanking)} {s.rankingCity}</p>}
                  <div className="mt-4 w-full h-1 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: "85%", background: pc, opacity: 0.5 }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ CLASSES ════════════════ */}
      <section className="py-28 max-md:py-16" style={{ background: isDark ? "#0d0d0d" : "#f0efea" }} id="classes">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: pc }} data-reveal>{t(TRANSLATIONS.classes.academics)}</p>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1]" data-reveal>
              {t(TRANSLATIONS.classes.ourClasses)} <span className="italic" style={{ color: pc }}>{t(TRANSLATIONS.classes.streams)}</span>
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap" data-reveal>
            {CLASS_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setActiveClassLevel(level)}
                className={`px-5 py-2.5 rounded-xl text-[12px] font-semibold tracking-wider uppercase border-none cursor-pointer transition-all duration-200 ${
                  activeClassLevel === level ? "tab-active" : "text-white/40 bg-white/5 hover:bg-white/10 hover:text-white/70"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredClasses.map((cls, i) => (
              <div
                key={i}
                className="group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = pcm; e.currentTarget.style.background = pcl; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                data-reveal
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-block text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full" style={{ background: pcl, color: pc }}>
                    {cls.level}
                  </span>
                  <Icon path={PATHS.search} className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{cls.name}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed mb-3">{cls.desc}</p>
                <p className="text-[12px] font-medium" style={{ color: pcm }}>{cls.age}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ ANNOUNCEMENTS ════════════════ */}
      <WebsiteAnnouncements
        school={school}
        variant="bold"
        primaryColor={pc}
        t={t}
        TRANSLATIONS={TRANSLATIONS}
        theme={{ isDark }}
      />

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section className="py-28 max-md:py-16 relative overflow-hidden" id="testimonials">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: pc, filter: "blur(120px)" }} />
        <div className="relative max-w-[800px] mx-auto px-6 text-center">
          <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: pc }} data-reveal>{t(TRANSLATIONS.testimonials.testimonials)}</p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] mb-12" data-reveal>
            {t(TRANSLATIONS.testimonials.whatPeopleSay)} <span className="italic" style={{ color: pc }}>{t(TRANSLATIONS.values.different)}</span>
          </h2>

          {/* Carousel */}
          <div className="relative min-h-[200px] flex items-center justify-center">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`transition-all duration-500 absolute w-full ${
                  i === testimonialIdx ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
                }`}
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, si) => (
                    <span key={si} className="text-lg" style={{ color: pc }}>★</span>
                  ))}
                </div>
                <p className="text-[clamp(18px,2.5vw,24px)] font-light leading-[1.7] text-white/70 mb-8">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: pc }}>
                    {t.author[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-semibold text-white">{t.author}</p>
                    <p className="text-[13px] text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Nav */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                className="w-2.5 h-2.5 rounded-full border-none cursor-pointer transition-all duration-300"
                style={{
                  background: i === testimonialIdx ? pc : "rgba(255,255,255,0.15)",
                  transform: i === testimonialIdx ? "scale(1.3)" : "scale(1)",
                }}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>

          {/* Prev/Next */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
            >
              <Icon path={PATHS.chevronLeft} className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTestimonialIdx((i) => (i + 1) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
            >
              <Icon path={PATHS.chevronRight} className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════ GALLERY ════════════════ */}
      <section className="py-28 max-md:py-16" style={{ background: isDark ? "#0d0d0d" : "#f0efea" }} id="gallery">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-4" style={{ color: pc }} data-reveal>{t(TRANSLATIONS.gallery.gallery)}</p>
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1]" data-reveal>
              {t(TRANSLATIONS.gallery.lifeAt)} {schoolShort || "School"}
            </h2>
          </div>

          {gallery.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {gallery.slice(0, 5).map((img, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden rounded-2xl group cursor-pointer ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
                    style={{ maxHeight: i === 0 ? "min(340px, 40vw)" : "min(170px, 25vw)" }}
                    onClick={() => setLightboxIdx(i)}
                    data-reveal
                  >
                    <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                        <Icon path={PATHS.search} className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    {img.caption && (
                      <p className="absolute bottom-2 left-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">{img.caption}</p>
                    )}
                  </div>
                ))}
              </div>

              {gallery.length > 5 && (
                <div className="text-center mt-8" data-reveal>
                  <button className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-[13px] font-medium text-white/60 no-underline border border-white/10 hover:text-white hover:border-white/30 transition-all cursor-pointer bg-transparent">
                    {t(TRANSLATIONS.gallery.viewAll)} {gallery.length} {t(TRANSLATIONS.gallery.photos)} <Icon path={PATHS.arrow} className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div
                  key={i}
                  className={`rounded-2xl flex items-center justify-center ${i === 0 ? "md:col-span-2 md:row-span-2 min-h-[480px]" : "min-h-[220px]"}`}
                  style={{ background: pcl }}
                >
                  <Icon path={PATHS.image} className="w-8 h-8 text-white/20" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox images={gallery.length > 0 ? gallery : []} index={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* ════════════════ ENROLMENT FORM ════════════════ */}
      <section className="py-28 max-md:py-16" style={{ background: isDark ? "#0d0d0d" : "#f0efea" }} id="enrol">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-md:gap-10 items-start">
            <div>
              <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-3" style={{ color: pc }} data-reveal>{t(TRANSLATIONS.enrolment.enrolment)}</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] mb-5" data-reveal>
                {t(TRANSLATIONS.enrolment.apply)} <span className="italic" style={{ color: pc }}>{t(TRANSLATIONS.enrolment.admission)}</span>
              </h2>
              <p className="text-[16px] text-white/45 leading-[1.7] mb-8 max-w-[440px]" data-reveal>
                {t(TRANSLATIONS.bold.quickResponseDesc)}
              </p>
              <div className="flex flex-col gap-4" data-reveal>
                {[
                  { label: t(TRANSLATIONS.bold.quickResponse), desc: t(TRANSLATIONS.bold.quickResponseDesc) },
                  { label: t(TRANSLATIONS.bold.campusTour), desc: t(TRANSLATIONS.bold.campusTourDesc) },
                  { label: t(TRANSLATIONS.bold.noObligation), desc: t(TRANSLATIONS.bold.noObligationDesc) },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:scale-110" style={{ background: pcl }}>
                      <FiEdit3 className="w-4 h-4" style={{ color: pc }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-white">{item.label}</p>
                      <p className="text-[13px] text-white/40">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative" data-reveal>
              <div className="bold-glass rounded-2xl p-8" style={{ borderColor: pcm }}>
                <EnrollmentForm
                  variant="dark"
                  primaryColor={pc}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ CTA ════════════════ */}
      <section className="py-28 max-md:py-16 relative overflow-hidden text-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${pc} 0%, transparent 60%)` }} />
        </div>
        <div className="relative z-10 max-w-[600px] mx-auto px-6">
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] mb-5" data-reveal>
            {t(TRANSLATIONS.cta.readyToJoin)} <span className="italic" style={{ color: pc }}>{schoolShort || t(TRANSLATIONS.cta.us)}</span>?
          </h2>
          <p className="text-[16px] text-white/45 leading-[1.7] mb-8" data-reveal>
            {t(TRANSLATIONS.enrolment.contactAdmissions)}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap" data-reveal>
            <MagneticButton
              href="#contact"
              className="h-[54px] px-8 rounded-xl text-[15px] font-semibold text-white"
              style={{ background: pc }}
            >
              <Icon path={PATHS.phone} className="w-[18px] h-[18px]" /> {t(TRANSLATIONS.enrolment.contactAdmissions)}
            </MagneticButton>
            <MagneticButton
              href="/login"
              className="h-[54px] px-7 rounded-xl text-[15px] font-medium text-white/70 hover:text-white border border-white/10"
            >
              <Icon path={PATHS.login} className="w-[18px] h-[18px]" /> {t(TRANSLATIONS.nav.studentPortal)}
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ════════════════ CONTACT ════════════════ */}
      <section className="py-28 max-md:py-16" style={{ background: isDark ? "#0d0d0d" : "#f0efea" }} id="contact">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-md:gap-10">
            <div>
              <p className="text-[10px] font-semibold tracking-[3px] uppercase mb-3" style={{ color: pc }} data-reveal>{t(TRANSLATIONS.contact.contact)}</p>
              <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] mb-5" data-reveal>
                {t(TRANSLATIONS.contact.visitCampus)}</h2>
              <p className="text-[16px] text-white/45 leading-[1.7] mb-8 max-w-[440px]" data-reveal>
                {t(TRANSLATIONS.contact.getInTouch)}
              </p>
              <div className="flex flex-col gap-5">
                {contactItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5 group" data-reveal>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110" style={{ background: pcl }}>
                      <Icon path={item.icon} className="w-5 h-5" style={{ color: pc }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mb-0.5">{item.label}</p>
                      <p className="text-[15px] text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="rounded-2xl overflow-hidden min-h-[350px] flex items-center justify-center flex-col gap-4 border transition-all duration-300 hover:border-white/20"
              style={{ background: pcl, borderColor: "rgba(255,255,255,0.06)" }}
              data-reveal
            >
              <Icon path={PATHS.pin} className="w-12 h-12" style={{ color: pc }} />
              <p className="text-[16px] font-medium text-white/70">{schoolName}</p>
              <p className="text-[13px] text-white/40">{location || "City, Region"}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(s.address || `${s.city || ""} ${s.region || ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-[12px] font-medium text-white no-underline transition-all duration-200 hover:brightness-110 mt-2"
                style={{ background: pc }}
              >
                <Icon path={PATHS.pin} className="w-3.5 h-3.5" /> {t(TRANSLATIONS.contact.openInMaps)}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer style={{ background: isDark ? "#030303" : "#e8e7e2", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1280px] mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: pc }}>
                  <Icon path={PATHS.building} className="w-4 h-4 text-white" />
                </div>
                <span className="text-[16px] font-semibold text-white">{schoolName}</span>
              </div>
              <p className="text-[13px] text-white/30 leading-relaxed">{t(TRANSLATIONS.footer.shaping)} {s.yearFounded || "1998"}.</p>
            </div>

            {/* Nav columns */}
            {[
              { title: t(TRANSLATIONS.footer.navigate), links: [{ label: t(TRANSLATIONS.nav.about), href: "#about" }, { label: t(TRANSLATIONS.nav.classes), href: "#classes" }, { label: t(TRANSLATIONS.nav.gallery), href: "#gallery" }, { label: t(TRANSLATIONS.nav.contact), href: "#contact" }] },
              { title: t(TRANSLATIONS.footer.portals), links: [{ label: t(TRANSLATIONS.nav.studentPortal), href: "/login" }, { label: t(TRANSLATIONS.nav.parentPortal), href: "/login" }, { label: t(TRANSLATIONS.nav.teacherLogin), href: "/login" }] },
              { title: t(TRANSLATIONS.footer.academic), links: [{ label: t(TRANSLATIONS.footer.results), href: "#academics" }, { label: t(TRANSLATIONS.footer.curriculum), href: "#classes" }, { label: t(TRANSLATIONS.footer.fees), href: "#" }, { label: t(TRANSLATIONS.footer.admissions), href: "#contact" }] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-[11px] font-semibold tracking-wider uppercase mb-4" style={{ color: pcm }}>{col.title}</p>
                <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                  {col.links.map((link, j) => (
                    <li key={j}><a href={link.href} className="text-[14px] text-white/30 no-underline hover:text-white transition-colors">{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom */}
          <div className="border-t border-white/5 pt-6 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
            <p className="text-[13px] text-white/20">&copy; {year} {schoolName}. {t(TRANSLATIONS.footer.rights)}</p>
            <p className="text-[13px] text-white/20">{t(TRANSLATIONS.footer.poweredBy)} <strong className="font-semibold" style={{ color: pcm }}>Akademee</strong></p>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 pb-[max(12px,env(safe-area-inset-bottom))] flex gap-2.5" style={{ background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <a href="/login" className="flex-1 h-12 flex items-center justify-center rounded-xl text-[14px] font-semibold text-white no-underline" style={{ background: pc }}>{t(TRANSLATIONS.nav.studentPortal)}</a>
        <a href="#contact" className="flex-1 h-12 flex items-center justify-center rounded-xl text-[14px] font-medium text-white/70 no-underline border border-white/10">{t(TRANSLATIONS.nav.contact)}</a>
      </div>

      {/* Back to top */}
      <BackToTopButton show={showBackToTop} color={pc} variant="dark" />
    </div>
  );
}
