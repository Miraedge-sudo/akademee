export default function WebsiteFooter({ school, variant = "dark" }) {
  const s = school || {};
  const year = new Date().getFullYear();

  if (variant === "light") {
    return (
      <footer className="py-7 border-t text-center text-[13px]" style={{ borderColor: "#e8ebe6", color: "#6e7a70" }}>
        <div className="max-w-[1080px] mx-auto px-5">
          &copy; {year} {s.schoolName || "School"}. Managed with <strong style={{ color: s.primaryColor || "#085041" }}>Akademee</strong>
        </div>
      </footer>
    );
  }

  return (
    <footer style={{ background: "#181C19" }}>
      <div className="max-w-[1140px] mx-auto px-6 pt-[60px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-md:gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-[34px] h-[34px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: s.primaryColor+"99" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-[17px] h-[17px]">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="font-display text-[17px] text-white">{s.schoolName || "School"}</span>
            </div>
            <p className="text-[14px] text-[#6B7280] leading-relaxed max-w-[280px]">Shaping the leaders of tomorrow since {s.yearFounded || "1998"}.</p>
          </div>
          {[
            {title:"Quick links",links:["About","Classes","Gallery","Contact"].map(l=>({label:l,href:`#${l.toLowerCase()}`}))},
            {title:"Login",links:[{label:"Login",href:"/login"}]},
            {title:"Academic",links:["Timetable","Fees structure","GCE results","Admissions"].map(l=>({label:l,href:"#"}))},
          ].map((col,i) => (
            <div key={i}>
              <p className="text-[13px] font-semibold text-white tracking-[0.3px] mb-4">{col.title}</p>
              <ul className="list-none flex flex-col gap-2.5 p-0 m-0">
                {col.links.map((link,j) => (
                  <li key={j}><a href={link.href} className="text-[14px] text-[#6B7280] no-underline hover:text-[var(--p-text,#C8F0E4)] transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] py-5 flex items-center justify-between gap-4 flex-wrap max-md:flex-col max-md:items-start">
          <p className="text-[13px] text-[#4B5563]">&copy; {year} {s.schoolName || "School"}. All rights reserved.</p>
          <div className="inline-flex items-center gap-1.5 text-[12.5px] text-[#4B5563] bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/[0.06]">
            Managed with <strong className="font-semibold" style={{ color: s.primaryColor+"BF" }}>Akademee</strong> &middot; akademee.cm
          </div>
        </div>
      </div>
    </footer>
  );
}
