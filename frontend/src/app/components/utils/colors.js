/**
 * Color utility functions — shared across all components and pages.
 */

export const LEVEL_COLORS = {
  'Form 1': '#6366F1',
  'Form 2': '#0EA5E9',
  'Form 3': '#14B8A6',
  'Form 4': '#F59E0B',
  'Form 5': '#EF4444',
  'Lower 6th': '#A855F7',
  'Upper 6th': '#085041',
  '6e': '#6366F1',
  '5e': '#0EA5E9',
  '4e': '#14B8A6',
  '3e': '#F59E0B',
  Seconde: '#A855F7',
  Première: '#EF4444',
  Terminale: '#085041',
};

/**
 * Convert hex color to rgba string.
 * @param {string} hex - Hex color code (e.g. "#085041")
 * @param {number} alpha - Alpha value 0-1
 * @returns {string} rgba(...) string
 */
export function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) {
    return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha})`;
  }
  return `rgba(8, 80, 65, ${alpha})`;
}

/**
 * Extract the dominant level color from a class name.
 * @param {string} className - e.g. "Form 3A"
 * @param {string} fallback - Fallback color
 * @returns {string} hex color
 */
export function getLevelColor(className, fallback = '#085041') {
  for (const [key, color] of Object.entries(LEVEL_COLORS)) {
    if (className?.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return fallback;
}

/**
 * Generate initials from a name string.
 * @param {string} name
 * @param {number} max - Max initials to return
 * @returns {string} uppercase initials
 */
export function getInitials(name, max = 2) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, max)
    .join('')
    .toUpperCase();
}

/**
 * Format a number as currency (XAF).
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(amount);
}
