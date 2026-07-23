import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../layout/ThemeLangToggles";
import akademeeLogo from "../../../assets/Logo.png";

const faqs = [
  {
    q: "How does the subdomain work?",
    a: "Each school gets its own subdomain like graceacademy.akademee.com hosting a public website and dashboards in a fully isolated tenant.",
  },
  {
    q: "Can I import my existing student data?",
    a: "Yes. Upload an Excel or CSV file and Akademee maps the columns automatically for students, classes, and grades.",
  },
  {
    q: "Does Akademee support both Anglophone and Francophone systems?",
    a: "Akademee handles GCE-style sequences and Francophone semesters, with the full interface available in English and French.",
  },
  {
    q: "Is there a contract or can I cancel anytime?",
    a: "Plans are billed annually with no lock-in contract. You can upgrade, downgrade, or cancel before your next renewal.",
  },
];

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-800 overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
      >
        <span className="font-semibold text-surface-800 dark:text-surface-100">
          {q}
        </span>
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
  const { t } = useTranslation("landing");

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

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-40 backdrop-blur-sm bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <img
                src={akademeeLogo}
                alt="Akademee"
                className="w-8 h-8 object-contain"
              />
              <span className="font-display text-lg font-semibold text-surface-800 dark:text-surface-100">
                Akademee
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {t("nav.features", "Features")}
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {t("nav.pricing", "Pricing")}
              </a>
              <a
                href="#testimonials"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {t("nav.testimonials", "Testimonials")}
              </a>
              <a
                href="#faq"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {t("nav.faq", "FAQ")}
              </a>
            </div>

            <div className="flex items-center gap-4">
              <ThemeLangToggles />
              <Link
                to="/login"
                className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {t("nav.signIn", "Sign in")}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white text-sm font-semibold rounded-md transition-colors animate-pulse-on-hover"
              >
                {t("nav.getStarted", "Get started")}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-surface-50 dark:from-teal-900/10 dark:to-surface-900" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-teal-200/30 dark:bg-teal-800/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-teal-100/30 dark:bg-teal-900/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slideInLeft">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-200 text-sm font-semibold rounded-full mb-8 animate-fadeIn border border-teal-200 dark:border-teal-800">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {t("hero.badge", "Multi-tenant School Management • Cameroon")}
              </span>

              <h1 className="font-display text-5xl lg:text-6xl font-bold text-surface-900 dark:text-surface-100 leading-tight mb-6">
                {t("hero.title", "Run your entire school")}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-900 to-teal-400">
                  {" "}
                  {t("hero.titleHighlight", "on one beautiful platform")}
                </span>
              </h1>

              <p className="text-xl text-surface-600 dark:text-surface-400 mb-10 leading-relaxed max-w-lg">
                {t(
                  "hero.subtitle",
                  "Akademee gives every school its own branded campus, public website and powerful dashboards for admins, teachers, accountants, students and parents.",
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-900 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white text-base font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-teal-900/30 animate-pulse-on-hover"
                >
                  {t("hero.ctaPrimary", "Create your campus")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <button className="px-8 py-4 border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 text-base font-medium rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-all hover:scale-105 hover:border-teal-600 dark:hover:border-teal-600">
                  {t("hero.ctaSecondary", "Book a demo")}
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full border-2 border-white dark:border-surface-800 ${
                        i === 1
                          ? "bg-teal-900"
                      : i === 2
                        ? "bg-teal-900"
                        : i === 3
                          ? "bg-teal-900"
                          : "bg-teal-800"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  <span className="font-semibold text-surface-900 dark:text-surface-100">
                    {t("hero.trustCount", "320+ schools")}
                  </span>{" "}
                  {t("hero.trustText", "across Cameroon trust Akademee")}
                </p>
              </div>
            </div>

            <div className="relative animate-slideInRight">
              <div className="relative bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-700 p-6 hover:shadow-3xl transition-all duration-500 animate-scaleIn overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop"
                  alt="Dashboard Preview"
                  className="w-full h-auto rounded-2xl object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/20 to-transparent rounded-3xl" />
              </div>

              <div className="absolute -bottom-8 -left-8 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 px-6 py-4 animate-float z-10">
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-1 font-semibold uppercase tracking-wider">
                  {t("hero.stat1Label", "Pass rate")}
                </p>
                <p className="font-display text-3xl font-bold text-teal-600">
                  94.2%
                </p>
              </div>

              <div
                className="absolute -top-8 -right-8 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 px-6 py-4 animate-float z-10"
                style={{ animationDelay: "1s" }}
              >
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-1 font-semibold uppercase tracking-wider">
                  {t("hero.stat2Label", "Fees collected")}
                </p>
                <p className="font-display text-3xl font-bold text-teal-600">
                  81%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-teal-900 to-teal-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDQwaDQwVjBIMHY0MHptMjAgMjBoMjBWMjBIMjB2MjB6IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "320+", label: "Schools onboarded" },
              { number: "184,000+", label: "Students managed" },
              { number: "9,600+", label: "Teachers empowered" },
              { number: "99.9%", label: "Platform uptime" },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center reveal"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="font-display text-4xl lg:text-5xl font-bold mb-2 animate-scaleIn">
                  {stat.number}
                </div>
                <div className="text-teal-600-100 text-sm font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 bg-surface-50 dark:bg-surface-900 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 mb-4">
              One platform. Every department.
            </h2>
            <p className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Everything an institution needs, beautifully unified.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <path d="M22 10v6M2 10l10-5 10 5-10 5z" />,
                title: "Academics",
                description:
                  "Classes, streams, subjects, timetables and grading for Anglophone & Francophone systems.",
              },
              {
                icon: (
                  <>
                    <rect x="9" y="11" width="6" height="11" />
                    <path d="M9 11V7a3 3 0 0 1 6 0v4" />
                  </>
                ),
                title: "Attendance & Grades",
                description:
                  "Terms, sequences and semesters with auto-generated report cards and transcripts.",
              },
              {
                icon: (
                  <>
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </>
                ),
                title: "Finance",
                description:
                  "Fees, invoices, receipts, payroll and expense tracking with real-time analytics.",
              },
              {
                icon: (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </>
                ),
                title: "Public Website",
                description:
                  "Every school gets a branded subdomain website with 3 premium templates.",
              },
              {
                icon: (
                  <>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </>
                ),
                title: "Parent Portal",
                description:
                  "Keep parents informed with real-time grades, attendance and fee notifications.",
              },
              {
                icon: (
                  <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <path d="M20 8v6M23 11h-6" />
                  </>
                ),
                title: "Staff & Payroll",
                description:
                  "Manage teacher contracts, attendance and payroll from a single dashboard.",
              },
              {
                icon: (
                  <>
                    <path d="M3 3v18h18" />
                    <path d="M18.7 8l-5.1 5.1-2.8-2.8L7 14" />
                  </>
                ),
                title: "Advanced Analytics",
                description:
                  "Real-time dashboards for enrollment trends, performance and revenue.",
              },
              {
                icon: (
                  <>
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </>
                ),
                title: "Security",
                description:
                  "Each school runs in a fully isolated tenant with role-based access control.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 hover:border-teal-600 dark:hover:border-teal-600 hover:shadow-xl hover:shadow-teal-900/10 transition-all duration-300 reveal group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-teal-900 to-teal-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    {feature.icon}
                  </svg>
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

      {/* Why Akademee Section */}
      <section className="py-24 bg-white dark:bg-surface-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-100/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-50/30 dark:bg-teal-900/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative reveal">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl animate-float">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop&q=80"
                  alt="Students collaborating in class"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="absolute -bottom-6 -right-6 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 p-6 animate-float"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/40 rounded-xl flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6 text-teal-600"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-surface-900 dark:text-surface-100">
                      98%
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      Satisfaction rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal" style={{ animationDelay: "0.2s" }}>
              <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 mb-6">
                Why schools choose Akademee
              </h2>
              <p className="text-xl text-surface-600 dark:text-surface-400 mb-10 leading-relaxed">
                Akademee gives every school its own branded campus, public
                website and powerful dashboards for admins, teachers,
                accountants, students and parents.
              </p>
              <ul className="space-y-4">
                {[
                  "Branded subdomain & public website",
                  "Anglophone & higher-education grading",
                  "Bilingual (English / French)",
                  "Bulk import from Excel & CSV",
                  "Dark & light mode for every user",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-surface-700 dark:text-surface-300 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/40 dark:to-teal-800/40 flex items-center justify-center flex-shrink-0">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 text-teal-600"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-800 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 mb-4">
              Simple, annual pricing
            </h2>
            <p className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Pick a plan, get a branded campus instantly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Basic",
                price: "180,000",
                period: "FCFA / year",
                features: [
                  "Up to 300 students",
                  "Core academics & grading",
                  "1 website template",
                  "Email support",
                  "Public website",
                ],
                popular: false,
              },
              {
                name: "Premium",
                price: "360,000",
                period: "FCFA / year",
                features: [
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
                name: "Professional",
                price: "720,000",
                period: "FCFA / year",
                features: [
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
                    ? "border-teal-600 shadow-lg shadow-teal-900/20"
                    : "border-surface-200 dark:border-surface-700 hover:border-teal-600 dark:hover:border-teal-600"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-teal-900 to-teal-800 text-white text-sm font-semibold rounded-full shadow-lg animate-pulse-on-hover">
                    Most popular
                  </div>
                )}
                <h3 className="font-display text-2xl font-semibold text-surface-900 dark:text-surface-100 mb-3">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100">
                    {plan.price} FCFA
                  </span>
                  <span className="text-surface-600 dark:text-surface-400 text-base ml-2">
                    / year
                  </span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIndex) => (
                    <li
                      key={fIndex}
                      className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-400"
                    >
                      <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5 text-teal-600"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full py-4 text-center text-base font-semibold rounded-xl transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-teal-900 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white shadow-lg shadow-teal-900/30 animate-pulse-on-hover"
                      : "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600"
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-24 bg-white dark:bg-surface-800 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-50/50 to-transparent dark:from-teal-900/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 text-center mb-16 reveal">
            What our users say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Akademee replaced six tools. Our report cards now generate in seconds and parents love the portal.",
                name: "Grace Mbah",
                role: "Principal, Grace Academy",
                avatar: "teal-900",
              },
              {
                quote:
                  "Fee collection and payroll used to take days. Now it is one clean dashboard with real-time analytics.",
                name: "Nadia Fomba",
                role: "Bursar, Bilingual College",
                avatar: "teal-900",
              },
              {
                quote:
                  "I can follow my daughter's grades, attendance and fees from my phone. It is wonderfully simple.",
                name: "Aïcha Njoya",
                role: "Parent",
                avatar: "teal-900",
              },
            ].map((t, index) => (
              <div
                key={index}
                className="p-8 bg-gradient-to-br from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 hover:shadow-xl hover:shadow-teal-900/10 transition-all duration-300 reveal group"
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
                  &quot;{t.quote}&quot;
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full bg-teal-900 flex items-center justify-center text-white font-semibold text-lg"
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-surface-900 dark:text-surface-100">
                      {t.name}
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-24 bg-surface-50 dark:bg-surface-900 relative"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold text-surface-900 dark:text-surface-100 text-center mb-16 reveal">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <FaqItem
                key={i}
                q={f.q}
                a={f.a}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-surface-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-surface-50 dark:from-teal-900/20 dark:to-surface-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/30 dark:bg-teal-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100/30 dark:bg-teal-900/10 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="bg-gradient-to-br from-teal-900 to-teal-800 rounded-3xl px-8 py-20 text-center shadow-2xl shadow-teal-900/30 reveal">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to modernise your school?
            </h2>
            <p className="text-teal-600-100 text-xl mb-10 max-w-2xl mx-auto">
              Launch your branded campus in minutes.
            </p>
            <Link
              to="/register"
              className="inline-block px-10 py-4 bg-white hover:bg-surface-100 text-teal-900 text-lg font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-lg animate-pulse-on-hover"
            >
              Create your campus
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-white to-surface-50 dark:from-surface-800 dark:to-surface-900 border-t border-surface-200 dark:border-surface-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-900 to-teal-800 flex items-center justify-center shadow-lg shadow-teal-900/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="font-display text-xl font-semibold text-surface-900 dark:text-surface-100">
                  Akademee
                </span>
              </div>
              <p className="text-surface-600 dark:text-surface-400 text-base leading-relaxed">
                Modern multi-tenant school management for Cameroon. Built for
                admins, teachers, accountants, students & parents.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-6">
                Product
              </h4>
              <ul className="space-y-3 text-base text-surface-600 dark:text-surface-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Templates
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 transition-colors"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-6">
                Company
              </h4>
              <ul className="space-y-3 text-base text-surface-600 dark:text-surface-400">
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-6">
                Legal
              </h4>
              <ul className="space-y-3 text-base text-surface-600 dark:text-surface-400">
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-surface-200 dark:border-surface-700 pt-8 text-center text-base text-surface-600 dark:text-surface-400">
            <p>
              &copy; 2026 Akademee. akademee.com &mdash; All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
