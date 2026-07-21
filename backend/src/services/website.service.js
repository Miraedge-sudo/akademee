/**
 * Website Service — public school landing page data scoped by subdomain (tenant isolation).
 */

const sql = require('../config/database');
const { buildSchoolUrls } = require('../utils/domainHelper');
const mediaService = require('./media.service');

class WebsiteService {
  async getPublicWebsiteBySubdomain(subdomain) {
    const schools = await sql`
      SELECT
        s.school_id,
        s.name,
        s.tagline,
        s.subdomain,
        s.email,
        s.phone,
        s.address,
        s.city,
        s.region,
        s.logo_url,
        s.hero_image_url,
        s.hero_image_url_2,
        s.primary_color,
        s.website_description,
        s.year_founded,
        s.website_stats,
        s.website_values,
        s.website_published,
        s.onboarding_completed,
        s.subscription_plan,
        s.educational_systems,
        s.exam_type,
        s.exam_pass_rate,
        s.ranking,
        s.ranking_city,
        s.about_photos,
        s.classes_config,
        wt.template_id,
        wt.template_code,
        wt.name AS template_name,
        wt.description AS template_description
      FROM schools s
      LEFT JOIN website_templates wt ON s.website_template_id = wt.template_id
      WHERE s.subdomain = ${subdomain} AND s.is_active = true
    `;

    if (schools.length === 0) {
      throw new Error('School website not found');
    }

    const school = schools[0];
    const templateCode = school.template_code || 'bold';
    const urls = buildSchoolUrls(school.subdomain, templateCode);
    const gallery = await mediaService.listGallery(school.school_id);

    return {
      schoolId: school.school_id,
      name: school.name,
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
      primaryColor: school.primary_color || '#085041',
      websiteDescription: school.website_description,
      yearFounded: school.year_founded,
      websiteStats: school.website_stats || {},
      websiteValues: school.website_values || [],
      websitePublished: school.website_published,
      onboardingCompleted: school.onboarding_completed,
      subscriptionPlan: school.subscription_plan,
      educationalSystems: school.educational_systems || [],
      examType: school.exam_type,
      examPassRate: school.exam_pass_rate,
      ranking: school.ranking,
      rankingCity: school.ranking_city,
      aboutPhotos: school.about_photos || [],
      classesConfig: school.classes_config || [],
      gallery: gallery.map((g) => ({ id: g.media_id, url: g.url, caption: g.caption })),
      templateCode,
      template: {
        id: school.template_id,
        code: templateCode,
        name: school.template_name,
        description: school.template_description,
      },
      urls,
    };
  }
}

module.exports = new WebsiteService();
