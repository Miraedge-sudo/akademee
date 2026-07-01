export default function WebsiteNav({ school, variant = "light", scrolled, mobileOpen, onToggleMobile }) {
  const s = school || {};
  const location = [s.city, s.region].filter(Boolean).join(", ");

  const links = ["About", "Classes", "Gallery", "Contact"];

  if (variant === "dark") {
    return (
      <nav className="flex items-center justify-between gap-6">
        <ul className="hidden md:flex items-center gap-0 list-none m-0 p-0">
          {links.map(item => (
            <li key={item}>
              <a href={`#${item.toLowerCase()}`}
                className="text-[11.5px] font-medium tracking-[1.5px] uppercase no-underline px-4 py-2 relative text-white/70 hover:text-white transition-colors"
              >{item}</a>
            </li>
          ))}
        </ul>
        <a href="#" className="flex flex-col items-center gap-1 no-underline">
          <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 flex-shrink-0" style={{ background: s.primaryColor, borderColor: s.primaryColor+"BF" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#1A1710" strokeWidth="1.8" strokeLinecap="round" className="w-6 h-6">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="text-center">
            <div className="text-[15px] font-semibold text-white leading-tight" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>{s.schoolName||"School"}</div>
            <div className="text-[9.5px] tracking-[2px] uppercase mt-0.5" style={{ color: s.primaryColor+"BF" }}>Est. {s.yearFounded||"1998"} &middot; {s.city||"Douala"}</div>
          </div>
        </a>
        <div className="hidden md:flex items-center gap-2.5">
          <a href="#contact" className="h-9 px-[18px] border rounded-sm text-[11px] font-medium tracking-[1.5px] uppercase no-underline inline-flex items-center" style={{ borderColor: s.primaryColor+"80", color: s.primaryColor+"BF" }}>Contact</a>
          <a href="/login" className="h-9 px-[18px] rounded-sm text-[11px] font-semibold tracking-[1.5px] uppercase no-underline inline-flex items-center gap-1.5" style={{ background: s.primaryColor, color: "#1A1710" }}>Login</a>
        </div>
        <button onClick={onToggleMobile} className="md:hidden w-10 h-10 border-none bg-transparent cursor-pointer flex flex-col items-end justify-center gap-[5px]">
          <span className="block h-[1.5px] bg-white rounded transition-all" style={{ width: mobileOpen?"24px":"24px", transform: mobileOpen?"rotate(45deg) translate(5px,5px)":"" }} />
          <span className="block h-[1.5px] bg-white rounded transition-all" style={{ width: mobileOpen?"24px":"18px", opacity: mobileOpen?0:1 }} />
          <span className="block h-[1.5px] bg-white rounded transition-all" style={{ width: mobileOpen?"24px":"24px", transform: mobileOpen?"rotate(-45deg) translate(5px,-5px)":"" }} />
        </button>
      </nav>
    );
  }

  // Light variant (Modern template)
  return (
    <div className="flex items-center h-[68px] gap-8">
      <a href="#" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
        <div className="w-[38px] h-[38px] rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: s.logoUrl ? `url(${s.logoUrl}) center/cover no-repeat` : (s.primaryColor||"#085041") }}>
          {!s.logoUrl && (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          )}
        </div>
        <div>
          <div className="text-[17px] font-display font-medium text-[#181C19] leading-tight">{s.schoolName||"School Name"}</div>
          <div className="text-[11px] text-[#9BA59C]">{location||s.city||"Campus"}</div>
        </div>
      </a>
      <ul className="hidden md:flex items-center gap-1 flex-1 justify-center list-none m-0 p-0">
        {links.map(item => (
          <li key={item}><a href={`#${item.toLowerCase()}`} className="text-[14px] font-medium text-[#5C665E] px-3.5 py-2 rounded-md no-underline transition-colors hover:text-[var(--p,custom)]">{item}</a></li>
        ))}
      </ul>
      <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
        <a href="/login" className="h-[38px] px-[22px] rounded-xl text-[13.5px] font-medium text-white no-underline inline-flex items-center gap-1.5" style={{ background: s.primaryColor||"#085041" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Login
        </a>
      </div>
      <button onClick={onToggleMobile} className="md:hidden w-10 h-10 border-none bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[5px] ml-auto">
        <span className="block w-[22px] h-[2px] bg-[#2A3029] rounded transition-all" style={{ transform: mobileOpen?"rotate(45deg) translate(5px,5px)":"" }} />
        <span className="block w-[22px] h-[2px] bg-[#2A3029] rounded transition-all" style={{ opacity: mobileOpen?0:1 }} />
        <span className="block w-[22px] h-[2px] bg-[#2A3029] rounded transition-all" style={{ transform: mobileOpen?"rotate(-45deg) translate(5px,-5px)":"" }} />
      </button>
    </div>
  );
}
