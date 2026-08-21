import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiFileText,
  FiGlobe,
  FiMapPin,
  FiMessageCircle,
  FiShield,
  FiSmartphone,
  FiUserCheck,
} from "react-icons/fi";
import ThemeLangToggles from "../../layout/ThemeLangToggles";
import { useBrandLogo } from "../../core/hooks/useBrandLogo";
import { useTheme } from "../../core/hooks/useTheme";
import Seo, { SITE_URL } from "../../components/seo/Seo";

// ── Photos libres (Wikimedia Commons, CC BY-SA 4.0) : vrais élèves camerounais ──
// WikiChallenge African Schools 2021 – Cameroon (écoles numériques)
const PHOTO_CLASSROOM =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/WikiChallenge_African_Schools_2021_Cameroon_05.jpg/1920px-WikiChallenge_African_Schools_2021_Cameroon_05.jpg";
const PHOTO_STUDENTS =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/WikiChallenge_African_Schools_2021_Cameroon_16.jpg/1920px-WikiChallenge_African_Schools_2021_Cameroon_16.jpg";
const PHOTO_PORTRAIT_1 =
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces&q=80";
const PHOTO_PORTRAIT_2 =
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces&q=80";
const PHOTO_PORTRAIT_3 =
  "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=200&h=200&fit=crop&crop=faces&q=80";

const WHATSAPP_URL = "https://wa.me/237676514428";

// ── Motif africain (kente / wax) en SVG ──
function KentePattern({ className = "" }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
      aria-hidden="true"
    >
      <defs>
        <pattern id="kente" width="64" height="64" patternUnits="userSpaceOnUse">
          <path
            d="M32 4 L60 32 L32 60 L4 32 Z"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <path
            d="M32 18 L46 32 L32 46 L18 32 Z"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="1"
          />
          <rect x="0" y="0" width="8" height="64" fill="currentColor" fillOpacity="0.08" />
          <rect x="56" y="0" width="8" height="64" fill="currentColor" fillOpacity="0.08" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kente)" />
    </svg>
  );
}

// ── Petit badge de section ──
function SectionBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-full border border-amber-300/60 dark:border-amber-700/60 uppercase tracking-wide">
      {children}
    </span>
  );
}

// ── Mockup produit (aperçu du dashboard Akademee, 100% CSS) ──
function DashboardMockup({ isFr }) {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-white/10 bg-white dark:bg-surface-900 shadow-2xl shadow-black/30 overflow-hidden">
        {/* Barre de navigateur */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <div className="ml-3 flex-1 h-6 rounded-lg bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-600 flex items-center px-3 text-[10px] text-surface-400 truncate">
            graceacademy.akademee.cm/dashboard
          </div>
        </div>
        <div className="grid grid-cols-[74px_1fr]">
          {/* Sidebar */}
          <div className="bg-emerald-950 dark:bg-emerald-950 p-2.5 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-100">
              Ak
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full ${i === 0 ? "bg-amber-400 w-10" : "bg-white/20 w-8"}`}
              />
            ))}
          </div>
          {/* Contenu */}
          <div className="p-3.5 space-y-3 bg-surface-50 dark:bg-surface-900">
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "320", l: isFr ? "Élèves" : "Students" },
                { v: "94%", l: isFr ? "Réussite" : "Pass rate" },
                { v: "1,2 M", l: "FCFA" },
              ].map((s, i) => (
                <div key={i} className="rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-2">
                  <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{s.v}</div>
                  <div className="text-[9px] text-surface-400">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-2.5">
              <div className="text-[9px] font-bold text-surface-500 mb-1.5 uppercase tracking-wide">
                {isFr ? "Recettes mensuelles" : "Monthly revenue"}
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {[35, 50, 42, 65, 58, 80, 72, 95].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${i === 7 ? "bg-amber-400" : i % 2 ? "bg-emerald-600/70" : "bg-emerald-800/70"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700">
              {[
                { n: isFr ? "Bulletin – 6ème A" : "Report card – Form 1A", s: "PDF ✓" },
                { n: isFr ? "Paiement reçu" : "Payment received", s: "180 000 FCFA" },
                { n: isFr ? "Absences – Tle C" : "Attendance – Upper 6th", s: "2" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-[10px] font-semibold text-surface-700 dark:text-surface-200 truncate">{row.n}</span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{row.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cartes flottantes */}
      <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 px-4 py-3 flex items-center gap-3 animate-float z-10">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <FiCheckCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-surface-800 dark:text-surface-100">
            {isFr ? "Bulletin généré" : "Report card ready"}
          </p>
          <p className="text-[10px] text-surface-400">PDF • {isFr ? "en 3 secondes" : "in 3 seconds"}</p>
        </div>
      </div>
      <div
        className="absolute -top-5 -right-3 sm:-right-6 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 px-4 py-3 flex items-center gap-3 animate-float z-10"
        style={{ animationDelay: "1s" }}
      >
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <FiCreditCard className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-surface-800 dark:text-surface-100">
            {isFr ? "Paiement reçu" : "Payment received"}
          </p>
          <p className="text-[10px] text-surface-400">MTN MoMo • 180 000 FCFA</p>
        </div>
      </div>
    </div>
  );
}

const faqs = [
  {
    qEn: "How does the subdomain work?",
    qFr: "Comment fonctionne le sous-domaine ?",
    aEn:
      "Each school gets its own subdomain like graceacademy.akademee.cm hosting a public website and dashboards in a fully isolated tenant.",
    aFr:
      "Chaque école reçoit son propre sous-domaine (ex : graceacademy.akademee.cm) avec un site public et des tableaux de bord dans un environnement totalement isolé.",
  },
  {
    qEn: "Can I import my existing student data?",
    qFr: "Puis-je importer mes données élèves existantes ?",
    aEn:
      "Yes. Upload an Excel or CSV file and Akademee maps the columns automatically for students, classes, and grades.",
    aFr:
      "Oui. Importez un fichier Excel ou CSV et Akademee associe automatiquement les colonnes pour les élèves, les classes et les notes.",
  },
  {
    qEn: "Does Akademee support both Anglophone and Francophone systems?",
    qFr: "Akademee gère-t-il les systèmes anglophone et francophone ?",
    aEn:
      "Akademee handles GCE-style sequences, Francophone semesters and the University LMD module, with the full interface in English and French.",
    aFr:
      "Akademee gère les séquences de type GCE, les semestres francophones et le module Universitaire LMD, avec toute l'interface en français et en anglais.",
  },
  {
    qEn: "Can I pay with Mobile Money?",
    qFr: "Puis-je payer avec Mobile Money ?",
    aEn:
      "Yes — MTN Mobile Money, Orange Money and bank transfer are accepted for your annual subscription.",
    aFr:
      "Oui — MTN Mobile Money, Orange Money et virement bancaire sont acceptés pour votre abonnement annuel.",
  },
  {
    qEn: "Is there a contract or can I cancel anytime?",
    qFr: "Y a-t-il un contrat ou puis-je annuler à tout moment ?",
    aEn:
      "Plans are billed annually with no lock-in contract. You can upgrade, downgrade, or cancel before your next renewal.",
    aFr:
      "Les offres sont facturées annuellement sans engagement. Vous pouvez changer d'offre ou annuler avant le prochain renouvellement.",
  },
];

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
      >
        <span className="font-semibold text-surface-800 dark:text-surface-100">{q}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-5 h-5 text-surface-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-sm text-surface-600 dark:text-surface-400 leading-relaxed animate-fadeIn">
          {a}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const { t, i18n } = useTranslation("landing");
  const isFr = i18n.language === "fr";
  const akademeeLogo = useBrandLogo();
  const { theme } = useTheme();

  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 },
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const trustInstitutions = ["MINESEC", "MINESUP", "GCE Board", "OBC"];
  const paymentBadges = [
    { label: "MTN MoMo", cls: "bg-yellow-400 text-yellow-950" },
    { label: "Orange Money", cls: "bg-orange-500 text-white" },
    { label: "Virement bancaire", cls: "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200" },
  ];

  const seoTitle = isFr
    ? "Akademee — Gestion scolaire tout-en-un au Cameroun"
    : "Akademee — All-in-One School Management in Cameroon";
  const seoDescription = isFr
    ? "Akademee offre à chaque école son propre campus personnalisé, un site web public et des tableaux de bord pour administrateurs, enseignants, comptables, élèves et parents. Notes, finances en FCFA, Mobile Money."
    : "Akademee gives every school its own branded campus, public website and dashboards for admins, teachers, accountants, students and parents. Grades, FCFA finance, Mobile Money.";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Akademee",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: seoDescription,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "XAF",
      lowPrice: "0",
    },
    provider: {
      "@type": "Organization",
      name: "Akademee",
      url: SITE_URL,
      areaServed: "CM",
    },
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path="/"
        jsonLd={organizationJsonLd}
      />
      {/* ══════════ NAVIGATION ══════════ */}
      <nav className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-40 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img key={theme} src={akademeeLogo} alt="Akademee" className="h-10 w-auto object-contain animate-fadeInOnly" />
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {isFr ? "Fonctionnalités" : "Features"}
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {isFr ? "Tarifs" : "Pricing"}
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {isFr ? "Témoignages" : "Testimonials"}
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                FAQ
              </a>
            </div>

            <div className="flex items-center gap-4">
              <ThemeLangToggles />
              <Link
                to="/login"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {t("nav.signIn", "Sign in")}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-colors animate-pulse-on-hover"
              >
                {isFr ? "Commencer" : "Get started"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white">
        <KentePattern className="text-amber-400 opacity-40" />
        <div className="absolute top-24 -right-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slideInLeft">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-amber-300 text-sm font-semibold rounded-full mb-8 animate-fadeIn backdrop-blur-sm">
                <FiAward className="w-4 h-4" />
                {isFr
                  ? "La plateforme scolaire 100% camerounaise"
                  : "The school platform, 100% Cameroonian"}
              </span>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {isFr ? (
                  <>
                    L'école camerounaise,
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                      {" "}
                      simplifiée.
                    </span>
                  </>
                ) : (
                  <>
                    The Cameroonian school,
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
                      {" "}
                      simplified.
                    </span>
                  </>
                )}
              </h1>

              <p className="text-xl text-emerald-100/90 mb-10 leading-relaxed max-w-lg">
                {isFr
                  ? "Gestion scolaire, notes, bulletins, frais et site web pour les écoles francophones, anglophones et les universités LMD — conçu au Cameroun, pour le Cameroun."
                  : "School management, grades, report cards, fees and websites for Francophone, Anglophone and LMD university schools — built in Cameroon, for Cameroon."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 text-base font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30 animate-pulse-on-hover"
                >
                  {isFr ? "Créer mon campus" : "Create your campus"}
                  <FiArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/25 text-white text-base font-medium rounded-xl hover:bg-white/10 transition-all hover:scale-105"
                >
                  <FiMessageCircle className="w-5 h-5" />
                  {isFr ? "Discuter sur WhatsApp" : "Chat on WhatsApp"}
                </a>
              </div>

              {/* Badges de confiance locale */}
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {trustInstitutions.map((inst) => (
                  <span
                    key={inst}
                    className="px-3 py-1 rounded-md bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-100"
                  >
                    {inst}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-bold text-emerald-300">
                  FR / EN / LMD
                </span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full border-2 border-emerald-900 ${
                        i === 1
                          ? "bg-amber-400"
                          : i === 2
                            ? "bg-emerald-500"
                            : i === 3
                              ? "bg-red-500"
                              : "bg-amber-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-emerald-100/90">
                  <span className="font-bold text-white">
                    {isFr ? "320+ écoles" : "320+ schools"}
                  </span>{" "}
                  {isFr ? "de Yaoundé à Douala nous font confiance" : "from Yaoundé to Douala trust Akademee"}
                </p>
              </div>
            </div>

            <div className="relative animate-slideInRight mt-10 lg:mt-0">
              <DashboardMockup isFr={isFr} />
            </div>
          </div>
        </div>

        {/* Liseré tricolore (drapeau du Cameroun) */}
        <div className="relative h-1.5 flex">
          <div className="flex-1 bg-emerald-500" />
          <div className="flex-1 bg-red-600" />
          <div className="flex-1 bg-amber-400" />
        </div>
      </section>

      {/* ══════════ BANDEAU PHOTO ÉLÈVES CAMEROUNAIS ══════════ */}
      <section className="relative">
        <img src={PHOTO_CLASSROOM} alt={isFr ? "Élèves camerounais en classe" : "Cameroonian students in class"} className="w-full h-[480px] sm:h-[560px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-emerald-950/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-xl animate-fadeIn">
              <SectionBadge>
                {isFr ? "Conçu pour nos écoles" : "Made for our schools"}
              </SectionBadge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-5 mb-4 leading-tight">
                {isFr
                  ? "Des élèves camerounais, une gestion moderne."
                  : "Cameroonian students, modern management."}
              </h2>
              <p className="text-emerald-100/90 text-lg leading-relaxed">
                {isFr
                  ? "Du CP à la Terminale, du GCE O-Level au Doctorat LMD : Akademee s'adapte aux programmes officiels du Cameroun."
                  : "From primary to Upper Sixth, from GCE O-Level to LMD doctorate: Akademee adapts to Cameroon's official programmes."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="py-16 bg-emerald-950 text-white relative overflow-hidden">
        <KentePattern className="text-amber-400 opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "320+", label: isFr ? "Écoles inscrites" : "Schools onboarded" },
              { number: "184 000+", label: isFr ? "Élèves gérés" : "Students managed" },
              { number: "9 600+", label: isFr ? "Enseignants outillés" : "Teachers empowered" },
              { number: "99,9%", label: isFr ? "Disponibilité" : "Platform uptime" },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center reveal"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="font-display text-4xl lg:text-5xl font-bold mb-2 text-amber-300 animate-scaleIn">
                  {stat.number}
                </div>
                <div className="text-emerald-100/80 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FONCTIONNALITÉS ══════════ */}
      <section id="features" className="py-24 bg-surface-50 dark:bg-surface-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <SectionBadge>
              <FiBookOpen className="w-3.5 h-3.5" />
              {isFr ? "Fonctionnalités" : "Features"}
            </SectionBadge>
            <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 mt-5 mb-4">
              {isFr ? "Un seul outil. Tous les services." : "One platform. Every service."}
            </h2>
            <p className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              {isFr
                ? "Tout ce qu'une institution camerounaise attend, magnifiquement unifié."
                : "Everything a Cameroonian institution expects, beautifully unified."}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <FiBookOpen className="w-6 h-6" />,
                title: isFr ? "Académique" : "Academics",
                description: isFr
                  ? "Classes, filières, matières et notation pour les systèmes anglophone, francophone et universitaire LMD."
                  : "Classes, streams, subjects and grading for Anglophone, Francophone and LMD university systems.",
              },
              {
                icon: <FiFileText className="w-6 h-6" />,
                title: isFr ? "Notes & bulletins" : "Grades & report cards",
                description: isFr
                  ? "Séquences, trimestres et semestres avec bulletins conformes MINESEC / GCE / LMD générés automatiquement."
                  : "Sequences, terms and semesters with MINESEC / GCE / LMD-compliant report cards generated automatically.",
              },
              {
                icon: <FiCreditCard className="w-6 h-6" />,
                title: isFr ? "Finance en FCFA" : "Finance in FCFA",
                description: isFr
                  ? "Frais de scolarité, reçus, paie des enseignants et encaissements — avec suivi en temps réel."
                  : "School fees, receipts, teacher payroll and revenue tracking — with real-time analytics.",
              },
              {
                icon: <FiGlobe className="w-6 h-6" />,
                title: isFr ? "Site web de l'école" : "School website",
                description: isFr
                  ? "Chaque école obtient son sous-domaine .akademee.cm avec site public et identité propre."
                  : "Every school gets its own .akademee.cm subdomain with a public website and its own branding.",
              },
              {
                icon: <FiUserCheck className="w-6 h-6" />,
                title: isFr ? "Portail parents" : "Parent portal",
                description: isFr
                  ? "Notes, présences et paiements consultables par les parents — alertes automatiques."
                  : "Keep parents informed with real-time grades, attendance and fee notifications.",
              },
              {
                icon: <FiSmartphone className="w-6 h-6" />,
                title: isFr ? "Mobile Money" : "Mobile Money",
                description: isFr
                  ? "Paiements MTN MoMo et Orange Money intégrés pour les frais scolaires."
                  : "MTN MoMo and Orange Money payments integrated for school fees.",
              },
              {
                icon: <FiBarChart2 className="w-6 h-6" />,
                title: isFr ? "Statistiques" : "Analytics",
                description: isFr
                  ? "Tableaux de bord sur les inscriptions, les performances et les revenus."
                  : "Real-time dashboards for enrollment trends, performance and revenue.",
              },
              {
                icon: <FiShield className="w-6 h-6" />,
                title: isFr ? "Sécurité & isolation" : "Security & isolation",
                description: isFr
                  ? "Chaque école dans un tenant isolé avec contrôle d'accès par rôle."
                  : "Each school runs in a fully isolated tenant with role-based access control.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="relative p-6 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 reveal group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-red-500 rounded-b opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-800 to-emerald-700 rounded-xl flex items-center justify-center mb-4 text-amber-300 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ POURQUOI AKADEMEE ══════════ */}
      <section className="py-24 bg-white dark:bg-surface-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 dark:bg-amber-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100/40 dark:bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative reveal">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={PHOTO_STUDENTS}
                  alt={isFr ? "Élèves africains étudiant ensemble" : "African students studying together"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 p-6 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                    <FiAward className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-surface-900 dark:text-surface-100">98%</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {isFr ? "Taux de satisfaction" : "Satisfaction rate"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal" style={{ animationDelay: "0.2s" }}>
              <SectionBadge>
                <FiCheck className="w-3.5 h-3.5" />
                {isFr ? "Pourquoi Akademee ?" : "Why Akademee?"}
              </SectionBadge>
              <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 mt-5 mb-6">
                {isFr ? "Pensé au Cameroun, pour le Cameroun" : "Thought in Cameroon, for Cameroon"}
              </h2>
              <p className="text-xl text-surface-600 dark:text-surface-400 mb-10 leading-relaxed">
                {isFr
                  ? "Les programmes, les frais en FCFA, le Mobile Money, le bilinguisme : Akademee est né des réalités des écoles camerounaises."
                  : "Official programmes, fees in FCFA, Mobile Money, bilingualism: Akademee was born from the reality of Cameroonian schools."}
              </p>
              <ul className="space-y-4">
                {[
                  isFr
                    ? "Conforme MINESEC, MINESUP, GCE Board & OBC"
                    : "MINESEC, MINESUP, GCE Board & OBC compliant",
                  isFr
                    ? "Bulletins officiels FR / EN, séquences et semestres"
                    : "Official FR / EN report cards, sequences and semesters",
                  isFr
                    ? "Tarifs en FCFA, paiement MTN MoMo & Orange Money"
                    : "FCFA pricing, MTN MoMo & Orange Money payments",
                  isFr
                    ? "Interface bilingue français / anglais"
                    : "Bilingual French / English interface",
                  isFr
                    ? "Sous-domaine personnalisé .akademee.cm"
                    : "Custom .akademee.cm subdomain & public website",
                  isFr
                    ? "Import en masse depuis Excel & CSV"
                    : "Bulk import from Excel & CSV",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-surface-700 dark:text-surface-300 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 dark:from-emerald-900/40 dark:to-amber-900/40 flex items-center justify-center flex-shrink-0">
                      <FiCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    </span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TARIFS ══════════ */}
      <section
        id="pricing"
        className="py-24 bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-800 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <SectionBadge>
              <FiCreditCard className="w-3.5 h-3.5" />
              {isFr ? "Tarifs en FCFA" : "Pricing in FCFA"}
            </SectionBadge>
            <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 mt-5 mb-4">
              {isFr ? "Des offres annuelles simples" : "Simple, annual pricing"}
            </h2>
            <p className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              {isFr
                ? "Essai gratuit de 10 jours, puis choisissez une offre. Paiement par Mobile Money."
                : "Start with a free 10-day trial, then pick a plan. Mobile Money accepted."}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
              {paymentBadges.map((badge) => (
                <span
                  key={badge.label}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${badge.cls}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: isFr ? "Essai" : "Trial",
                price: "0",
                period: isFr ? "10 jours" : "10 days",
                features: isFr
                  ? [
                      "Jusqu’à 50 élèves",
                      "Académique & notation",
                      "1 modèle de site web",
                      "Support email",
                      "Site web public",
                    ]
                  : [
                      "Up to 50 students",
                      "Core academics & grading",
                      "1 website template",
                      "Email support",
                      "Public website",
                    ],
                popular: false,
                trial: true,
              },
              {
                name: isFr ? "Basic" : "Basic",
                price: "180 000",
                period: isFr ? "FCFA / an" : "FCFA / year",
                features: isFr
                  ? [
                      "Jusqu'à 300 élèves",
                      "Académique & notation",
                      "1 modèle de site web",
                      "Support email",
                      "Site web public",
                    ]
                  : [
                      "Up to 300 students",
                      "Core academics & grading",
                      "1 website template",
                      "Email support",
                      "Public website",
                    ],
                popular: false,
              },
              {
                name: isFr ? "Premium" : "Premium",
                price: "360 000",
                period: isFr ? "FCFA / an" : "FCFA / year",
                features: isFr
                  ? [
                      "Jusqu'à 1 500 élèves",
                      "Finance & paie complètes",
                      "Les 3 modèles de site web",
                      "Support live chat",
                      "Import en masse (Excel/CSV)",
                      "Identité personnalisée",
                    ]
                  : [
                      "Up to 1,500 students",
                      "Finance & payroll suite",
                      "All 3 website templates",
                      "Live chat support",
                      "Bulk import (Excel/CSV)",
                      "Custom branding",
                    ],
                popular: true,
              },
              {
                name: isFr ? "Professional" : "Professional",
                price: "720 000",
                period: isFr ? "FCFA / an" : "FCFA / year",
                features: isFr
                  ? [
                      "Élèves illimités",
                      "Bibliothèque, transport & internat",
                      "Analyses avancées",
                      "Support prioritaire",
                      "Accès API",
                      "Multi-campus",
                    ]
                  : [
                      "Unlimited students",
                      "Library, transport & hostel",
                      "Advanced analytics",
                      "Priority support",
                      "API access",
                      "Multi-campus",
                    ],
                popular: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 bg-white dark:bg-surface-800 rounded-2xl border-2 flex flex-col transition-all duration-300 hover:shadow-xl hover:scale-105 reveal ${
                  plan.popular
                    ? "border-amber-400 shadow-lg shadow-amber-500/20"
                    : "border-surface-200 dark:border-surface-700 hover:border-emerald-600 dark:hover:border-emerald-500"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.trial && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-full shadow-lg">
                    {isFr ? "Gratuit 10 jours" : "Free 10 days"}
                  </div>
                )}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white text-sm font-semibold rounded-full shadow-lg animate-pulse-on-hover">
                    {isFr ? "Le plus populaire" : "Most popular"}
                  </div>
                )}
                <h3 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-100 mb-3">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100">
                    {plan.price}
                  </span>
                  <span className="text-surface-600 dark:text-surface-400 text-base ml-2">
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIndex) => (
                    <li
                      key={fIndex}
                      className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400"
                    >
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                        <FiCheck className="w-3.5 h-3.5 text-emerald-700" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full py-4 text-center text-base font-semibold rounded-xl transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 shadow-lg shadow-amber-500/30 animate-pulse-on-hover"
                      : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600"
                  }`}
                >
                  {isFr ? "Commencer" : "Get started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TÉMOIGNAGES ══════════ */}
      <section
        id="testimonials"
        className="py-24 bg-white dark:bg-surface-800 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-900/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 text-center mb-16 reveal">
            {isFr ? "Ce que disent nos écoles" : "What our users say"}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: isFr
                  ? "Akademee a remplacé six outils. Nos bulletins se génèrent en secondes et les parents adorent le portail."
                  : "Akademee replaced six tools. Our report cards now generate in seconds and parents love the portal.",
                name: "Grace Mbah",
                role: isFr ? "Proviseur, Grace Academy" : "Principal, Grace Academy",
                photo: PHOTO_PORTRAIT_1,
              },
              {
                quote: isFr
                  ? "La collecte des frais et la paie prenaient des jours. Maintenant, un seul tableau de bord avec des statistiques en temps réel."
                  : "Fee collection and payroll used to take days. Now it is one clean dashboard with real-time analytics.",
                name: "Nadia Fomba",
                role: isFr ? "Économe, Collège Bilingue" : "Bursar, Bilingual College",
                photo: PHOTO_PORTRAIT_2,
              },
              {
                quote: isFr
                  ? "Je suis les notes, présences et paiements de ma fille depuis mon téléphone. Tout est simple et en français."
                  : "I can follow my daughter's grades, attendance and fees from my phone. It is wonderfully simple.",
                name: "Aïcha Njoya",
                role: isFr ? "Parent d'élève" : "Parent",
                photo: PHOTO_PORTRAIT_3,
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="p-8 bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 reveal group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-amber-400"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="text-surface-700 dark:text-surface-300 text-base leading-relaxed mb-6">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.photo}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-800"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-base font-semibold text-surface-900 dark:text-surface-100">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" className="py-24 bg-surface-50 dark:bg-surface-900 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 text-center mb-16 reveal">
            {isFr ? "Questions fréquentes" : "Frequently asked questions"}
          </h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <FaqItem
                key={i}
                q={isFr ? f.qFr : f.qEn}
                a={isFr ? f.aFr : f.aEn}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section className="py-24 bg-white dark:bg-surface-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-surface-50 dark:from-emerald-900/20 dark:to-surface-900" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="relative bg-gradient-to-br from-emerald-950 to-teal-950 rounded-3xl px-8 py-20 text-center shadow-2xl shadow-emerald-900/40 overflow-hidden">
            <KentePattern className="text-amber-400 opacity-30" />
            <h2 className="relative font-display text-4xl lg:text-5xl font-bold text-white mb-6">
              {isFr ? "Prêt à moderniser votre école ?" : "Ready to modernise your school?"}
            </h2>
            <p className="relative text-emerald-100/90 text-xl mb-10 max-w-2xl mx-auto">
              {isFr
                ? "Lancez votre campus personnalisé en quelques minutes. Paiement en FCFA."
                : "Launch your branded campus in minutes. Pay in FCFA."}
            </p>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 text-lg font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg animate-pulse-on-hover"
              >
                {isFr ? "Créer mon campus" : "Create your campus"}
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/25 text-white text-base font-medium rounded-xl hover:bg-white/10 transition-all hover:scale-105"
              >
                <FiMessageCircle className="w-5 h-5" />
                {isFr ? "Contactez-nous sur WhatsApp" : "Contact us on WhatsApp"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-gradient-to-b from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 border-t border-surface-200 dark:border-surface-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img key={theme} src={akademeeLogo} alt="Akademee" className="h-10 w-auto object-contain animate-fadeInOnly" />
              </div>
              <p className="text-surface-600 dark:text-surface-400 text-base leading-relaxed">
                {isFr
                  ? "Gestion scolaire moderne pour le Cameroun. Conçue pour les écoles francophones, anglophones et universitaires."
                  : "Modern multi-tenant school management for Cameroon. Built for Francophone, Anglophone and university schools."}
              </p>
              <div className="flex flex-col gap-2 mt-5 text-sm text-surface-600 dark:text-surface-400">
                <span className="inline-flex items-center gap-2">
                  <FiMapPin className="w-4 h-4 text-emerald-600" />
                  {isFr ? "Yaoundé, Cameroun" : "Yaoundé, Cameroon"}
                </span>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <FiMessageCircle className="w-4 h-4 text-emerald-600" />
                  +237 676 51 44 28
                </a>
                <a
                  href="https://miraedge.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <FiGlobe className="w-4 h-4 text-emerald-600" />
                  miraedge.tech
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-6">
                {isFr ? "Produit" : "Product"}
              </h4>
              <ul className="space-y-3 text-base text-surface-600 dark:text-surface-400">
                <li>
                  <a href="#features" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "Fonctionnalités" : "Features"}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "Tarifs" : "Pricing"}
                  </a>
                </li>
                <li>
                  <Link to="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "Modèles de site" : "Templates"}
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "Sécurité" : "Security"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-6">
                {isFr ? "Entreprise" : "Company"}
              </h4>
              <ul className="space-y-3 text-base text-surface-600 dark:text-surface-400">
                <li>
                  <Link to="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "À propos" : "About"}
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "Contact" : "Contact"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-6">
                {isFr ? "Légal" : "Legal"}
              </h4>
              <ul className="space-y-3 text-base text-surface-600 dark:text-surface-400">
                <li>
                  <Link to="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "Confidentialité" : "Privacy Policy"}
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "Conditions" : "Terms"}
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                    {isFr ? "Support" : "Support"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-surface-200 dark:border-surface-700 pt-8 text-center text-base text-surface-600 dark:text-surface-400">
            <p>
              &copy; 2026 Akademee. akademee.cm — {isFr ? "Tous droits réservés" : "All rights reserved"}.
              {isFr ? " Photos : Wikimedia Commons (CC BY-SA 4.0)." : " Photos: Wikimedia Commons (CC BY-SA 4.0)."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
