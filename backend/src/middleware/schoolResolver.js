// Example middleware that extracts school identifier from subdomain
module.exports = (req, res, next) => {
  const host = req.headers.host || '';
  const parts = host.split('.');
  // naive: school subdomain.schooldomain.tld
  if (parts.length > 2) {
    req.school = parts[0];
  }
  next();
};
