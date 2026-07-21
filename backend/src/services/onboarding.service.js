/**
 * Onboarding Service — saves per-school website setup data (tenant-isolated by school_id).
 * All onboarding fields power the public vitrine landing page for that school's subdomain.
 */

const crypto = require("crypto");
const sql = require("../config/database");
const SlugGenerator = require("../utils/slugGenerator");
const { buildSchoolUrls } = require("../utils/domainHelper");
const mediaService = require("./media.service");

const EDUCATIONAL_SYSTEM_MAP = {
  Anglophone: "anglophone_general",
  Francophone: "francophone_general",
  Bilingual: "university",
  International: "university",
  anglophone: "anglophone_general",
  francophone: "francophone_general",
  anglo: "anglophone_general",
  franco: "francophone_general",
};

const normalizeEducationalSystems = (value) => {
  if (!Array.isArray(value)) return [];
  const normalized = new Set();

  value.forEach((item) => {
    if (typeof item !== "string") return;
    const trimmed = item.trim();
    if (!trimmed) return;

    const mapped = EDUCATIONAL_SYSTEM_MAP[trimmed] || trimmed;
    if (mapped) normalized.add(mapped);
  });

  return Array.from(normalized).filter((item) =>
    [
      "anglophone_general",
      "francophone_general",
      "anglophone_technical",
      "francophone_technical",
      "university",
    ].includes(item),
  );
};

const normalizeClassesConfig = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  return [];
};

class OnboardingService {
  /**
   * Load onboarding + branding data for the authenticated school only.
   */
  async getOnboardingData(schoolId) {
    const schools = await sql`
      SELECT
        s.school_id, s.name, s.tagline, s.subdomain, s.email, s.phone, s.address,
        s.city, s.region, s.logo_url, s.hero_image_url, s.hero_image_url_2, s.primary_color,
        s.website_description, s.year_founded, s.website_stats, s.website_values,
        s.educational_systems, s.exam_type, s.exam_pass_rate, s.ranking, s.ranking_city,
        s.about_photos, s.classes_config,
        s.onboarding_completed, s.website_published, s.email_verified,
        wt.template_code
      FROM schools s
      LEFT JOIN website_templates wt ON s.website_template_id = wt.template_id
      WHERE s.school_id = ${schoolId} AND s.is_active = true
    `;

    if (schools.length === 0) {
      throw new Error("School not found");
    }

    const school = schools[0];
    const gallery = await mediaService.listGallery(schoolId);
    const templateCode = school.template_code || "bold";
    const urls = buildSchoolUrls(school.subdomain, templateCode);

    return {
      schoolId: school.school_id,
      schoolName: school.name,
      tagline: school.tagline,
      subdomain: school.subdomain,
      email: school.email,
      phone: school.phone,
      address: school.address,
      city: school.city,
      region: school.region,
      logoUrl: school.logo_url,
      heroImageUrl: school.hero_image_url,
      heroImageUrl2: school.hero_image_url_2,
      primaryColor: school.primary_color || "#085041",
      websiteDescription: school.website_description,
      yearFounded: school.year_founded,
      websiteStats: school.website_stats || {},
      websiteValues: school.website_values || [],
      educationalSystems: school.educational_systems || [],
      examType: school.exam_type,
      examPassRate: school.exam_pass_rate,
      ranking: school.ranking,
      rankingCity: school.ranking_city,
      aboutPhotos: school.about_photos || [],
      classesConfig: school.classes_config || [],
      templateCode,
      onboardingCompleted: school.onboarding_completed,
      websitePublished: school.website_published,
      emailVerified: school.email_verified,
      gallery: gallery.map((g) => ({
        id: g.media_id,
        url: g.url,
        caption: g.caption,
      })),
      urls,
    };
  }

  /**
   * Persist onboarding wizard data for one school — never crosses tenant boundaries.
   */
  async saveOnboarding(schoolId, payload) {
    const schools = await sql`
      SELECT school_id, email_verified, require_email_verification
      FROM schools
      WHERE school_id = ${schoolId}
    `;

    if (schools.length === 0) {
      throw new Error("School not found");
    }

    const school = schools[0];
    if (school.require_email_verification && !school.email_verified) {
      throw new Error("School email is not verified");
    }

    const {
      schoolName,
      tagline,
      city,
      region,
      address,
      phone,
      email,
      yearFounded,
      primaryColor,
      templateCode,
      websiteDescription,
      websiteStats,
      websiteValues,
      educationalSystems,
      heroImageUrl2,
      examType,
      examPassRate,
      ranking,
      rankingCity,
      aboutPhotos,
      classesConfig,
      onboardingCompleted,
      websitePublished,
    } = payload;

    const normalizedEducationalSystems =
      normalizeEducationalSystems(educationalSystems);
    const normalizedClassesConfig = normalizeClassesConfig(classesConfig);

    let templateId = null;
    let resolvedTemplateCode = templateCode || "bold";

    if (templateCode) {
      const templates = await sql`
        SELECT template_id, template_code FROM website_templates WHERE template_code = ${templateCode}
      `;
      templateId = templates[0]?.template_id || null;
      resolvedTemplateCode =
        templates[0]?.template_code || resolvedTemplateCode;
    }

    const updatedSchools = await sql`
      UPDATE schools SET
        name = COALESCE(${schoolName || null}, name),
        tagline = COALESCE(${tagline ?? null}, tagline),
        city = COALESCE(${city || null}, city),
        region = COALESCE(${region ?? null}, region),
        address = COALESCE(${address ?? null}, address),
        phone = COALESCE(${phone ?? null}, phone),
        email = COALESCE(${email || null}, email),
        year_founded = COALESCE(${yearFounded ?? null}, year_founded),
        primary_color = COALESCE(${primaryColor || null}, primary_color),
        website_description = COALESCE(${websiteDescription ?? null}, website_description),
        website_stats = COALESCE(${websiteStats ? sql.json(websiteStats) : null}, website_stats),
        website_values = COALESCE(${websiteValues ? sql.json(websiteValues) : null}, website_values),
        website_template_id = COALESCE(${templateId}, website_template_id),
        educational_systems = COALESCE(${normalizedEducationalSystems.length > 0 ? sql.json(normalizedEducationalSystems) : null}, educational_systems),
        hero_image_url_2 = COALESCE(${heroImageUrl2 || null}, hero_image_url_2),
        exam_type = COALESCE(${examType || null}, exam_type),
        exam_pass_rate = COALESCE(${examPassRate || null}, exam_pass_rate),
        ranking = COALESCE(${ranking || null}, ranking),
        ranking_city = COALESCE(${rankingCity || null}, ranking_city),
        about_photos = COALESCE(${aboutPhotos ? sql.json(aboutPhotos) : null}, about_photos),
        classes_config = COALESCE(${normalizedClassesConfig ? sql.json(normalizedClassesConfig) : null}, classes_config),
        onboarding_completed = COALESCE(${onboardingCompleted ?? null}, onboarding_completed),
        website_published = COALESCE(${websitePublished ?? null}, website_published),
        updated_at = NOW()
      WHERE school_id = ${schoolId}
      RETURNING school_id, name, subdomain, website_published, onboarding_completed
    `;

    if (updatedSchools.length === 0) {
      throw new Error("School not found");
    }

    const updatedSchool = updatedSchools[0];
    const urls = buildSchoolUrls(updatedSchool.subdomain, resolvedTemplateCode);

    return {
      ...updatedSchool,
      templateCode: resolvedTemplateCode,
      urls,
    };
  }

  async uploadMedia(schoolId, file, mediaType, sortOrder = null) {
    const allowed = ["logo", "hero", "gallery", "about"];
    if (!allowed.includes(mediaType)) {
      throw new Error("Invalid media type");
    }
    return mediaService.saveSchoolMedia(
      schoolId,
      file,
      mediaType,
      null,
      sortOrder,
    );
  }

  /**
   * Verify school email token — activates the school for login.
   */
  async verifySchoolEmail(token) {
    console.log('[OnboardingService] Verifying school email with token:', token);

    const schools = await sql`
      SELECT school_id, name, subdomain, verification_token_expires_at, email_verified
      FROM schools
      WHERE verification_token = ${token}
    `;

    console.log('[OnboardingService] School verification query found', schools.length, 'school(s)');

    if (schools.length === 0) {
      throw new Error("Invalid or expired verification link");
    }

    const school = schools[0];

    const urls = buildSchoolUrls(school.subdomain);

    if (school.email_verified) {
      return {
        alreadyVerified: true,
        schoolId: school.school_id,
        subdomain: school.subdomain,
        schoolName: school.name,
        onboardingUrl: urls.onboardingUrl,
      };
    }

    if (
      school.verification_token_expires_at &&
      new Date(school.verification_token_expires_at) < new Date()
    ) {
      throw new Error(
        "Verification link has expired. Please request a new one.",
      );
    }

    await sql`
      UPDATE schools
      SET email_verified = true,
          verification_token = NULL,
          verification_token_expires_at = NULL,
          updated_at = NOW()
      WHERE school_id = ${school.school_id}
    `;

    return {
      alreadyVerified: false,
      schoolId: school.school_id,
      subdomain: school.subdomain,
      schoolName: school.name,
      onboardingUrl: urls.onboardingUrl,
    };
  }

  createVerificationToken() {
    return crypto.randomBytes(16).toString("hex");
  }

  verificationExpiryDate(hours = 48) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }
}

module.exports = new OnboardingService();
module.exports.normalizeEducationalSystems = normalizeEducationalSystems;
module.exports.normalizeClassesConfig = normalizeClassesConfig;
