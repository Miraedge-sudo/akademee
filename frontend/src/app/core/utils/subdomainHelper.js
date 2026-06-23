/**
 * Subdomain Helper - Extract subdomain from URL
 * Used for multi-tenant routing
 */

// Reserved subdomains that should not be treated as school subdomains
const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'staging', 'dev', 'test', 'localhost'];

/**
 * Extract subdomain from current hostname
 * Examples:
 * - miraedge-academy.lvh.me:3000 → "miraedge-academy"
 * - grace-bilingual.akademee.cm → "grace-bilingual"
 * - localhost:3000 → null
 * - www.akademee.cm → null (reserved)
 */
export function getSubdomainFromHostname() {
  const hostname = window.location.hostname;
  
  // Handle localhost or IP addresses
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // Split hostname into parts
  const parts = hostname.split('.');
  
  // Need at least 3 parts for subdomain (sub.domain.tld)
  if (parts.length < 3) {
    return null;
  }

  const subdomain = parts[0].toLowerCase();
  
  // Check if it's a reserved subdomain
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * Get subdomain from multiple sources in priority order:
 * 1. URL query parameter (?subdomain=xxx)
 * 2. Hostname (xxx.lvh.me or xxx.akademee.cm)
 * 3. LocalStorage (fallback)
 */
export function getSubdomain() {
  // Check URL query parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const querySubdomain = urlParams.get('subdomain');
  if (querySubdomain) {
    return querySubdomain.toLowerCase();
  }

  // Check hostname
  const hostSubdomain = getSubdomainFromHostname();
  if (hostSubdomain) {
    return hostSubdomain;
  }

  // Check localStorage as fallback
  const storedSubdomain = localStorage.getItem('akademee-subdomain');
  if (storedSubdomain) {
    return storedSubdomain.toLowerCase();
  }

  return null;
}

/**
 * Save subdomain to localStorage for persistence
 */
export function saveSubdomain(subdomain) {
  if (subdomain) {
    localStorage.setItem('akademee-subdomain', subdomain.toLowerCase());
  }
}

/**
 * Clear stored subdomain
 */
export function clearSubdomain() {
  localStorage.removeItem('akademee-subdomain');
}

/**
 * Extract token from URL query parameter (?token=xxx)
 * Used after subdomain redirect where token is passed across origins
 */
export function getTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token') || null;
}

/**
 * Build the subdomain URL for a school
 * e.g. http://grace-bilingual.lvh.me:3000/dashboard
 */
export function buildSubdomainUrl(subdomain, path = '/') {
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  const hostname = window.location.hostname;
  
  // In development with localhost, use lvh.me
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${subdomain}.lvh.me${port}${path}`;
  }
  
  // In production or when already on a subdomain
  const parts = hostname.split('.');
  // If we're on a subdomain, replace it; otherwise, prepend
  if (parts.length >= 3) {
    parts[0] = subdomain;
    return `${protocol}//${parts.join('.')}${port}${path}`;
  }
  
  return `${protocol}//${subdomain}.${hostname}${port}${path}`;
}

export { RESERVED_SUBDOMAINS };
