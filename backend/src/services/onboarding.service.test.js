jest.mock("../config/database", () => jest.fn());
jest.mock("./media.service", () => ({
  listGallery: jest.fn().mockResolvedValue([]),
}));

const { validationResult } = require("express-validator");
const { saveOnboardingValidator } = require("../validators/onboarding.validator");
const {
  normalizeEducationalSystems,
  normalizeClassesConfig,
} = require("./onboarding.service");

describe("onboarding payload normalization", () => {
  it("maps legacy educational system labels to backend codes", () => {
    expect(
      normalizeEducationalSystems([
        "Anglophone",
        "Francophone",
        "Bilingual",
        "International",
        "anglophone_general",
      ]),
    ).toEqual(["anglophone_general", "francophone_general", "university"]);
  });

  it("preserves classes config arrays and objects", () => {
    expect(normalizeClassesConfig([])).toEqual([]);
    expect(normalizeClassesConfig({ levels: [] })).toEqual({ levels: [] });
  });
});

describe("onboarding save validator", () => {
  it("accepts more than four website values on the final save payload", async () => {
    const req = {
      body: {
        websiteValues: [
          "Excellence",
          "Integrity",
          "Innovation",
          "Leadership",
          "Community",
        ],
      },
    };

    for (const validator of saveOnboardingValidator) {
      await validator.run(req);
    }

    const errors = validationResult(req);
    expect(errors.isEmpty()).toBe(true);
  });
});
