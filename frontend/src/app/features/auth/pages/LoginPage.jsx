import { FiHome, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import ThemeLangToggles from "../../../layout/ThemeLangToggles";
import { getSubdomain, buildSubdomainUrl } from "../../../core/utils/subdomainHelper";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation("auth");

  const [formData, setFormData] = useState({
    subdomain: getSubdomain() || "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(formData);
      if (result.success) {
        // If on localhost (no subdomain in URL), redirect to school subdomain URL
        // for proper tenant isolation. Token is passed via ?token= because
        // localStorage is per-origin and won't persist across subdomains.
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        if (result.subdomain && isLocalhost) {
          const dashboardUrl = buildSubdomainUrl(result.subdomain, `/dashboard?token=${result.token}`);
          window.location.href = dashboardUrl;
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.message);
      }
    } catch {
      setError(t("login.genericError", "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:flex bg-[#ccef8d] lg:p-6 xl:p-9">
      <aside className="hidden lg:flex lg:w-[48%] flex-shrink-0 rounded-[32px] bg-[#e3f4b9] p-8 xl:p-12">
        <div className="flex flex-col w-full h-full rounded-[22px] border-[10px] border-[#1d463b] bg-[#d0eb8b] p-9 xl:p-12">
          <div className="w-11 h-11 rounded-xl bg-[#1d463b] flex items-center justify-center">
            <FiHome className="w-5 h-5 text-[#dff3a7]" />
          </div>

          <div className="my-auto max-w-sm">
            <p className="text-[11px] font-bold tracking-[.16em] uppercase text-[#52794d]">Akademee</p>
            <h1 className="mt-4 font-display text-4xl xl:text-5xl leading-[1.06] font-medium text-[#1d463b]">
              Votre école,
              <span className="block">bien organisée.</span>
            </h1>
            <p className="mt-5 text-[15px] leading-7 text-[#496c54]">
              Accédez à votre espace pour gérer les élèves, les équipes et la vie de votre campus.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-2">
              {["Élèves", "Notes", "Frais"].map((item) => (
                <div key={item} className="rounded-lg bg-[#f3fad9] border border-[#b9d981] px-3 py-3 text-center text-xs font-semibold text-[#315a49]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2 h-20" aria-hidden="true">
            <div className="w-10 h-10 rounded-t-lg bg-[#77a962]" />
            <div className="w-16 h-16 rounded-t-lg bg-[#4f8b63]" />
            <div className="w-12 h-12 rounded-t-lg bg-[#315f50]" />
            <div className="w-20 h-20 rounded-t-lg bg-[#1d463b]" />
            <div className="flex-1 h-px mb-1 bg-[#8bb970]" />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-white lg:rounded-r-[32px]">
        <div className="flex items-center justify-between px-6 lg:px-10 py-5 border-b border-surface-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-900 flex items-center justify-center">
              <FiHome className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg text-surface-800">Akademee</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeLangToggles />
            <p className="text-[13.5px] text-surface-400 ml-1">
              {t("login.noAccount", "Don't have a school yet?")}{" "}
              <Link to="/register" className="text-teal-600 font-medium hover:underline">
                {t("login.registerLink", "Register your school")}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-10">
          <div className="w-full max-w-[420px] bg-white rounded-2xl lg:border lg:border-surface-100 lg:shadow-[0_18px_45px_rgba(19,61,53,.08)] p-8 lg:p-10">

            <p className="text-[11px] font-semibold tracking-wide uppercase text-teal-600 mb-1.5">
              {t("login.eyebrow", "School Portal")}
            </p>
            <h1 className="font-display text-2xl font-medium text-surface-800 dark:text-surface-100 mb-1.5">
              {t("login.title", "Welcome back")}
            </h1>
            <p className="text-[13.5px] text-surface-400 leading-relaxed mb-7">
              {t("login.subtitle", "Enter your credentials to access your campus.")}
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-[18px]">

              {/* Subdomain / School Name */}
              <div>
                <label htmlFor="subdomain" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("login.subdomainLabel", "School name or campus")}
                </label>
                <div className="relative flex items-center">
                  <FiHome className="absolute left-3 w-4 h-4 text-surface-400" />
                  <input
                    id="subdomain"
                    name="subdomain"
                    type="text"
                    required
                    value={formData.subdomain}
                    onChange={handleChange}
                    placeholder={t("login.subdomainPlaceholder", "e.g. grace-academy")}
                    autoComplete="off"
                    className="w-full h-11 pl-10 pr-3.5 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                  />
                </div>
                <p className="mt-1 text-[12px] text-surface-400 leading-relaxed">
                  {t("login.subdomainHint", "Your school subdomain — find it in your welcome email or ask your admin.")}
                </p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                  {t("login.emailLabel", "Email address")}
                </label>
                <div className="relative flex items-center">
                  <FiMail className="absolute left-3 w-4 h-4 text-surface-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@yourschool.cm"
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-3.5 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-[12.5px] font-medium text-surface-600 dark:text-surface-300">
                    {t("login.passwordLabel", "Password")}
                  </label>
                  <Link to="/forgot-password" className="text-[12px] text-teal-600 hover:underline font-medium">
                    {t("login.forgotPassword", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <FiLock className="absolute left-3 w-4 h-4 text-surface-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full h-11 pl-10 pr-10 rounded-md border-[1.5px] border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder:text-surface-400 text-sm outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-surface-800 focus:ring-[3.5px] focus:ring-teal-600/10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-4 h-4" />
                    ) : (
                      <FiEye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[46px] mt-2 bg-teal-900 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-teal-50 text-[15px] font-semibold rounded-md flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                {loading ? (
                  t("login.signingIn", "Signing in...")
                ) : (
                  <>
                    <FiArrowRight className="w-[17px] h-[17px]" />
                    {t("login.submit", "Sign in to your school")}
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-2.5 my-5">
              <div className="flex-1 h-px bg-surface-100 dark:bg-surface-700" />
              <span className="text-xs text-surface-400">{t("login.or", "or")}</span>
              <div className="flex-1 h-px bg-surface-100 dark:bg-surface-700" />
            </div>

            <p className="text-center text-[13.5px] text-surface-400">
              {t("login.noAccount", "Don't have a school yet?")}{" "}
              <Link to="/register" className="text-teal-600 font-medium hover:underline">
                {t("login.registerLink", "Register your school")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
