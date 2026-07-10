jest.mock("../config/database", () => jest.fn());
jest.mock("./media.service", () => ({
  listGallery: jest.fn().mockResolvedValue([]),
}));

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
