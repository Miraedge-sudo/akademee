
/**
 * SecurityLoginIllustration
 * Illustration flat-design "sécurité / connexion" dans le même esprit
 * que la référence : personnage, formulaire, cadenas, clé, engrenages, plante, voiturette.
 *
 * Usage :
 *   import SecurityLoginIllustration from "./SecurityLoginIllustration";
 *   <SecurityLoginIllustration width={420} />
 *
 * Toutes les couleurs sont pilotables via les props pour matcher ta charte.
 */
export default function SecurityLoginIllustration({
  width = 420,
  primary = "#0F2A3B",   // bleu/noir foncé du personnage
  accent = "#22C58B",    // vert (icônes, bouton)
  accentLight = "#DFF6EC",
  bg = "#EAF1F7",        // fond arrondi clair
  skin = "#F2C9A0",
  card = "#FFFFFF",
  line = "#C9D6E0",
  className,
  style,
}) {
  return (
    <svg
      viewBox="0 0 420 340"
      width={width}
      className={className}
      style={{ display: "block", ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ---------- Fond ---------- */}
      <rect x="0" y="0" width="420" height="340" rx="24" fill="none" />
      <path
        d="M40 300 Q 20 300 20 280 L20 60 Q20 40 40 40 L380 40 Q400 40 400 60 L400 280 Q400 300 380 300 Z"
        fill={bg}
        opacity="0.5"
      />

      {/* ---------- Sol / ombre ---------- */}
      <ellipse cx="120" cy="308" rx="150" ry="8" fill={line} opacity="0.3" />

      {/* ---------- Plante en pot (droite) ---------- */}
      <g transform="translate(320,250)">
        <path d="M-18 40 L18 40 L12 0 L-12 0 Z" fill={primary} />
        <path
          d="M0 0 C -30 -10 -34 -46 0 -56 C 34 -46 30 -10 0 0 Z"
          fill={accent}
        />
        <path d="M0 -6 C -14 -16 -16 -34 0 -42" stroke={accentLight} strokeWidth="2" fill="none" />
      </g>

      {/* ---------- Carte formulaire de connexion ---------- */}
      <g transform="translate(150,90)">
        <rect x="0" y="0" width="170" height="170" rx="10" fill={card} stroke={line} strokeWidth="2" />
        {/* petite icône user en haut de la carte */}
        <circle cx="85" cy="34" r="14" fill={accentLight} />
        <circle cx="85" cy="29" r="5.5" fill={accent} />
        <path d="M73 44 Q85 34 97 44" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* champs du formulaire */}
        <rect x="20" y="62" width="130" height="14" rx="7" fill={bg} />
        <rect x="20" y="86" width="130" height="14" rx="7" fill={bg} />
        <rect x="20" y="110" width="80" height="14" rx="7" fill={bg} />

        {/* bouton */}
        <rect x="20" y="140" width="130" height="20" rx="10" fill={accent} />
      </g>

      {/* ---------- Bulle avec points (mot de passe) ---------- */}
      <g transform="translate(70,50)">
        <rect x="0" y="0" width="86" height="34" rx="17" fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="4 5" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={i} cx={16 + i * 11} cy="17" r="3.2" fill={accent} />
        ))}
      </g>

      {/* ---------- Icône engrenages ---------- */}
      <g transform="translate(232,58)" fill="none" stroke={accent} strokeWidth="2.5">
        <Gear cx={0} cy={0} r={13} teeth={8} />
        <Gear cx={20} cy={16} r={9} teeth={8} />
      </g>

      {/* ---------- Icône clé (cercle) ---------- */}
      <g transform="translate(330,80)">
        <circle cx="0" cy="0" r="26" fill="none" stroke={accent} strokeWidth="2.5" strokeDasharray="3 5" />
        <g transform="translate(-9,-6) rotate(-25)" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round">
          <circle cx="0" cy="0" r="6" />
          <line x1="5" y1="5" x2="20" y2="20" />
          <line x1="15" y1="15" x2="20" y2="10" />
          <line x1="18" y1="18" x2="23" y2="13" />
        </g>
      </g>

      {/* ---------- Icône cadenas (bas droite) ---------- */}
      <g transform="translate(330,190)">
        <circle cx="0" cy="0" r="28" fill={accentLight} />
        <rect x="-10" y="-2" width="20" height="16" rx="3" fill={accent} />
        <path d="M-6 -2 v-6 a6 6 0 0 1 12 0 v6" stroke={accent} strokeWidth="3" fill="none" />
      </g>
      {/* ligne pointillée reliant cadenas <-> carte, façon "sécurisé" */}
      <path
        d="M300 190 Q 250 170 235 145"
        stroke={line}
        strokeWidth="2"
        strokeDasharray="2 6"
        fill="none"
      />

      {/* ---------- Personnage ---------- */}
      <g transform="translate(30,120)">
        {/* jambe/pantalon */}
        <path d="M20 120 L20 190 Q20 200 30 200 L60 200 Q70 200 70 190 L70 120 Z" fill="#E7E1D6" />
        {/* torse / pull */}
        <path
          d="M10 60 Q10 30 45 30 Q80 30 80 60 L86 130 Q86 140 76 140 L14 140 Q4 140 4 130 Z"
          fill={primary}
        />
        {/* bras replié tenant la tablette */}
        <path d="M78 70 Q100 80 96 105 Q94 118 80 118 Z" fill={primary} />
        {/* tête */}
        <circle cx="45" cy="14" r="20" fill={skin} />
        {/* cheveux */}
        <path d="M25 10 Q25 -8 45 -8 Q65 -8 65 10 Q65 0 45 0 Q25 0 25 10 Z" fill="#2B2118" />
        {/* col roulé */}
        <path d="M32 32 Q45 40 58 32 L58 26 Q45 34 32 26 Z" fill="#0A1B26" />
      </g>

      {/* petite tablette/carte tenue par le personnage, avec cadenas */}
      <g transform="translate(120,168)">
        <rect x="0" y="0" width="30" height="20" rx="3" fill={card} stroke={line} strokeWidth="1.5" />
        <rect x="6" y="6" width="12" height="3" rx="1.5" fill={line} />
        <rect x="6" y="12" width="18" height="3" rx="1.5" fill={line} />
      </g>

      {/* ---------- Petite voiture jouet (bas gauche) ---------- */}
      <g transform="translate(60,290)">
        <path d="M0 10 h60 v-6 q0 -6 -8 -6 h-8 l-6 -8 h-24 l-6 8 h-8 q-8 0 -8 6 Z" fill={accentLight} stroke={accent} strokeWidth="1.5" />
        <circle cx="12" cy="12" r="6" fill={primary} />
        <circle cx="48" cy="12" r="6" fill={primary} />
      </g>

      {/* pousse à côté de la voiture */}
      <g transform="translate(20,290)">
        <path d="M0 10 Q-4 -6 8 -8" stroke={accent} strokeWidth="2" fill="none" />
        <path d="M0 10 Q6 -2 12 4" stroke={accent} strokeWidth="2" fill="none" />
      </g>
    </svg>
  );
}

/** Petit sous-composant pour dessiner un engrenage simplifié (cercle + dents) */
function Gear({ cx, cy, r, teeth = 8 }) {
  const points = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    const x2 = cx + Math.cos(a) * (r + 4);
    const y2 = cy + Math.sin(a) * (r + 4);
    points.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2.5" />);
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} />
      <circle cx={cx} cy={cy} r={r * 0.35} />
      {points}
    </g>
  );
}