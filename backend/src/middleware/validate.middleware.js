/**
 * Request Validation Middleware
 */

const { validationResult } = require("express-validator");

const formatFieldLabel = (field) => {
  const normalized = String(field || "field")
    .replace(/^\./, "")
    .replace(/\[(\d+)\]/g, ".$1");
  const labels = {
    schoolName: "School name",
    tagline: "Tagline",
    city: "City",
    region: "Region",
    address: "Address",
    phone: "Phone number",
    email: "Email address",
    yearFounded: "Year founded",
    primaryColor: "Primary color",
    templateCode: "Template",
    websiteDescription: "Website description",
    websiteStats: "Website stats",
    websiteValues: "Website values",
    educationalSystems: "Educational systems",
    heroImageUrl2: "Hero image URL",
    examType: "Exam type",
    examPassRate: "Exam pass rate",
    ranking: "Ranking",
    rankingCity: "Ranking city",
    aboutPhotos: "About photos",
    classesConfig: "Classes configuration",
    onboardingCompleted: "Onboarding completed",
    websitePublished: "Website published",
  };

  return (
    labels[normalized] ||
    normalized.replace(/\./g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")
  );
};

const formatValidationMessage = (err) => {
  const field = err.param || err.path || "field";
  const fieldLabel = formatFieldLabel(field);
  const msg = err.msg || "Invalid value";

  if (field === "email") {
    return "Please enter a valid email address.";
  }

  if (field === "primaryColor") {
    return "Primary color must be a valid hex color such as #085041.";
  }

  if (field === "templateCode") {
    return "Please choose a valid template.";
  }

  if (field === "websitePublished" || field === "onboardingCompleted") {
    return "Please provide a valid true/false value.";
  }

  if (msg === "Invalid value") {
    return `${fieldLabel} is invalid.`;
  }

  return msg;
};

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((err) => ({
        field: err.param || err.path,
        message: formatValidationMessage(err),
      })),
      reqId: req.reqId,
    });
  }

  next();
};

module.exports = validateMiddleware;
