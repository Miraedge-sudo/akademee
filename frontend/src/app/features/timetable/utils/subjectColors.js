/**
 * Couleurs stables par matière pour l'emploi du temps.
 * Chaque matière reçoit une couleur déterministe (hash de son id/name)
 * pour rester identique entre les vues et les rechargements.
 */

const PALETTE = [
  { bg: "rgba(8,80,65,.10)", border: "#085041", text: "#085041", solid: "#085041" },
  { bg: "rgba(59,130,246,.10)", border: "#3B82F6", text: "#3B82F6", solid: "#3B82F6" },
  { bg: "rgba(139,92,246,.10)", border: "#8B5CF6", text: "#8B5CF6", solid: "#8B5CF6" },
  { bg: "rgba(245,158,11,.12)", border: "#F59E0B", text: "#B45309", solid: "#F59E0B" },
  { bg: "rgba(236,72,153,.10)", border: "#EC4899", text: "#EC4899", solid: "#EC4899" },
  { bg: "rgba(20,184,166,.10)", border: "#14B8A6", text: "#0F766E", solid: "#14B8A6" },
  { bg: "rgba(239,68,68,.10)", border: "#EF4444", text: "#EF4444", solid: "#EF4444" },
  { bg: "rgba(99,102,241,.10)", border: "#6366F1", text: "#6366F1", solid: "#6366F1" },
  { bg: "rgba(16,185,129,.10)", border: "#10B981", text: "#047857", solid: "#10B981" },
  { bg: "rgba(249,115,22,.12)", border: "#F97316", text: "#C2410C", solid: "#F97316" },
  { bg: "rgba(14,165,233,.10)", border: "#0EA5E9", text: "#0369A1", solid: "#0EA5E9" },
  { bg: "rgba(168,85,247,.10)", border: "#A855F7", text: "#A855F7", solid: "#A855F7" },
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSubjectColor(subjectId, subjectName = "") {
  const key = String(subjectId || "") + String(subjectName || "");
  return PALETTE[hashCode(key) % PALETTE.length];
}

/** Palette partagée pour la légende / le sélecteur. */
export { PALETTE };
