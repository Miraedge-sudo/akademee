/**
 * Onboarding Validators — validate website setup payload per school.
 */

const { body } = require("express-validator");

const optionalString = (field) =>
  body(field)
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .customSanitizer((value) => {
      if (typeof value !== "string") return value;
      return value.trim() === "" ? undefined : value;
    });

const VALID_EDUCATIONAL_SYSTEMS = [
  "anglophone_general",
  "francophone_general",
  "anglophone_technical",
  "francophone_technical",
  "university",
];

const LEGACY_EDUCATIONAL_SYSTEMS = [
  "Anglophone",
  "Francophone",
  "Bilingual",
  "International",
  "anglophone",
  "francophone",
  "anglo",
  "franco",
];

const saveOnboardingValidator = [
  optionalString("schoolName")
    .isLength({ max: 200 })
    .withMessage("School name must be 200 characters or fewer."),
  optionalString("tagline")
    .isLength({ max: 255 })
    .withMessage("Tagline must be 255 characters or fewer."),
  optionalString("city"),
  optionalString("region"),
  optionalString("address"),
  optionalString("phone"),
  optionalString("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  optionalString("yearFounded")
    .isLength({ max: 4 })
    .withMessage("Year founded must be 4 characters or fewer."),
  optionalString("primaryColor")
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Primary color must be a valid hex color such as #085041."),
  optionalString("templateCode")
    .isIn(["bold", "playful", "premium"])
    .withMessage("Please choose a valid template."),
  optionalString("websiteDescription")
    .isLength({ max: 2000 })
    .withMessage("Website description must be 2000 characters or fewer."),
  body("websiteStats")
    .optional({ nullable: true })
    .isObject()
    .withMessage("Website stats must be a valid object."),
  body("websiteValues")
    .optional({ nullable: true })
    .isArray()
    .withMessage("Website values must be a valid list."),
  body("educationalSystems")
    .optional({ nullable: true })
    .isArray({ max: 10 })
    .withMessage("Educational systems must be a valid list."),
  body("educationalSystems.*")
    .optional({ nullable: true })
    .isString()
    .isIn([...VALID_EDUCATIONAL_SYSTEMS, ...LEGACY_EDUCATIONAL_SYSTEMS])
    .withMessage("Please choose only valid educational systems."),
  optionalString("heroImageUrl2")
    .isString()
    .isLength({ max: 500 })
    .withMessage("Hero image URL must be 500 characters or fewer."),
  optionalString("examType")
    .isLength({ max: 50 })
    .withMessage("Exam type must be 50 characters or fewer."),
  optionalString("examPassRate")
    .isLength({ max: 10 })
    .withMessage("Exam pass rate must be 10 characters or fewer."),
  optionalString("ranking")
    .isLength({ max: 50 })
    .withMessage("Ranking must be 50 characters or fewer."),
  optionalString("rankingCity")
    .isLength({ max: 100 })
    .withMessage("Ranking city must be 100 characters or fewer."),
  body("aboutPhotos")
    .optional({ nullable: true })
    .isArray({ max: 20 })
    .withMessage("About photos must be a valid list."),
  body("aboutPhotos.*.url")
    .optional({ nullable: true })
    .isString()
    .withMessage("Each about photo URL must be a valid string."),
  body("aboutPhotos.*.caption")
    .optional({ nullable: true })
    .isString()
    .withMessage("Each about photo caption must be a valid string."),
  body("classesConfig")
    .optional({ nullable: true })
    .custom(
      (value) =>
        value === undefined ||
        value === null ||
        Array.isArray(value) ||
        (typeof value === "object" && !Array.isArray(value)),
    )
    .withMessage("Classes configuration must be a valid object or list."),
  body("onboardingCompleted")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("Onboarding completed must be true or false."),
  body("websitePublished")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("Website published must be true or false."),
];

module.exports = {
  saveOnboardingValidator,
};
