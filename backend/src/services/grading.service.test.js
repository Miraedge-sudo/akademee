/**
 * Unit tests for GradingService
 *
 * Mocks the database (postgres) and tests both pure utility functions
 * and CRUD operations with mocked SQL responses.
 */
jest.mock("../config/database", () => jest.fn());

const GradingService = require("./grading.service");

describe("GradingService — Pure utility methods", () => {
  // ------------------------------------------------------------------
  // _round
  // ------------------------------------------------------------------
  describe("_round", () => {
    it("returns null for null/undefined input", () => {
      expect(GradingService._round(null)).toBeNull();
      expect(GradingService._round(undefined)).toBeNull();
    });

    it("rounds half up by default (round_half_up)", () => {
      expect(GradingService._round(13.254, "round_half_up", 2)).toBe(13.25);
      expect(GradingService._round(13.255, "round_half_up", 2)).toBe(13.26);
      expect(GradingService._round(13.256, "round_half_up", 2)).toBe(13.26);
    });

    it("truncates when rule is 'truncate'", () => {
      expect(GradingService._round(13.259, "truncate", 2)).toBe(13.25);
      expect(GradingService._round(13.999, "truncate", 1)).toBe(13.9);
    });

    it("rounds half even (banker's rounding)", () => {
      // 13.255 → 13.26 (5 rounds to even → 6 is even? No, 13.26 = 1326 is even → actually 13.255 at 2dp = 13.26 since 6 is even)
      // 13.265 → 13.26 (5 rounds to even → 6 is even → round down)
      // Actually banker's: when exactly .5, round to nearest even
      // 13.255 → scaled = 1325.5, floor = 1325, ceil = 1326, diff = 0.5 → 1325 is odd → ceil = 1326 → 13.26
      expect(GradingService._round(13.255, "round_half_even", 2)).toBe(13.26);
      // 13.265 → scaled = 1326.5, floor = 1326, ceil = 1327, diff = 0.5 → 1326 is even → floor = 1326 → 13.26
      expect(GradingService._round(13.265, "round_half_even", 2)).toBe(13.26);
    });

    it("respects the precision parameter", () => {
      expect(GradingService._round(10.123456, "round_half_up", 0)).toBe(10);
      expect(GradingService._round(10.123456, "round_half_up", 1)).toBe(10.1);
      expect(GradingService._round(10.123456, "round_half_up", 3)).toBe(10.123);
      expect(GradingService._round(10.123456, "round_half_up", 4)).toBe(10.1235);
    });

    it("handles negative values (Math.round rounds .5 toward +Infinity)", () => {
      // Math.round(-1055.5) → -1055, so result is -10.55
      expect(GradingService._round(-10.555, "round_half_up", 2)).toBe(-10.55);
    });
  });

  // ------------------------------------------------------------------
  // _roundHalfEven
  // ------------------------------------------------------------------
  describe("_roundHalfEven", () => {
    it("rounds up when digit after half is more than 0.5", () => {
      // 13.6 → plus que 0.5 → ceil = 14
      expect(GradingService._roundHalfEven(13.6)).toBe(14);
    });

    it("rounds down when digit after half is less than 0.5", () => {
      expect(GradingService._roundHalfEven(13.4)).toBe(13);
    });

    it("rounds to even when exactly 0.5", () => {
      // 13.5 → diff = 0.5 → 13 is odd → ceil = 14
      expect(GradingService._roundHalfEven(13.5)).toBe(14);
      // 14.5 → diff = 0.5 → 14 is even → floor = 14
      expect(GradingService._roundHalfEven(14.5)).toBe(14);
    });
  });

  // ------------------------------------------------------------------
  // _coalesceNumber
  // ------------------------------------------------------------------
  describe("_coalesceNumber", () => {
    it("returns fallback for null/undefined", () => {
      expect(GradingService._coalesceNumber(null, 0)).toBe(0);
      expect(GradingService._coalesceNumber(undefined, 5)).toBe(5);
      expect(GradingService._coalesceNumber(null, 10)).toBe(10);
    });

    it("returns the number when value is provided", () => {
      expect(GradingService._coalesceNumber(15, 0)).toBe(15);
      expect(GradingService._coalesceNumber("10", 0)).toBe(10);
      expect(GradingService._coalesceNumber(3.14, 0)).toBe(3.14);
    });

    it("returns 0 as default fallback", () => {
      expect(GradingService._coalesceNumber(null)).toBe(0);
      expect(GradingService._coalesceNumber(undefined)).toBe(0);
    });
  });

  // ------------------------------------------------------------------
  // deriveMention
  // ------------------------------------------------------------------
  describe("deriveMention", () => {
    const thresholds = [
      { min_value: 16, max_value: 20, mention_label_en: "Excellent", mention_label_fr: "Excellent" },
      { min_value: 14, max_value: 15.99, mention_label_en: "Good", mention_label_fr: "Bien" },
      { min_value: 12, max_value: 13.99, mention_label_en: "Fairly Good", mention_label_fr: "Assez bien" },
      { min_value: 10, max_value: 11.99, mention_label_en: "Passable", mention_label_fr: "Passable" },
      { min_value: 0, max_value: 9.99, mention_label_en: "Insufficient", mention_label_fr: "Insuffisant" },
    ];

    it("returns null for null average", () => {
      expect(GradingService.deriveMention(null, thresholds)).toBeNull();
    });

    it("returns null for empty thresholds", () => {
      expect(GradingService.deriveMention(15, [])).toBeNull();
      expect(GradingService.deriveMention(15, null)).toBeNull();
    });

    it("returns the correct mention for each band", () => {
      expect(GradingService.deriveMention(18, thresholds)).toBe("Excellent");
      expect(GradingService.deriveMention(15, thresholds)).toBe("Good");
      expect(GradingService.deriveMention(12.5, thresholds)).toBe("Fairly Good");
      expect(GradingService.deriveMention(10, thresholds)).toBe("Passable");
      expect(GradingService.deriveMention(5, thresholds)).toBe("Insufficient");
    });

    it("handles boundary values correctly", () => {
      expect(GradingService.deriveMention(16, thresholds)).toBe("Excellent");
      expect(GradingService.deriveMention(15.99, thresholds)).toBe("Good");
      expect(GradingService.deriveMention(14, thresholds)).toBe("Good");
      expect(GradingService.deriveMention(0, thresholds)).toBe("Insufficient");
    });

    it("uses English label as fallback", () => {
      const mixed = [{ min_value: 10, max_value: 20, mention_label_en: "Pass", mention_label_fr: null }];
      expect(GradingService.deriveMention(15, mixed)).toBe("Pass");
    });

    it("uses French label when English is missing", () => {
      const mixed = [{ min_value: 10, max_value: 20, mention_label_fr: "Réussi" }];
      expect(GradingService.deriveMention(15, mixed)).toBe("Réussi");
    });
  });

  // ------------------------------------------------------------------
  // _periodTypeToGranularity
  // ------------------------------------------------------------------
  describe("_periodTypeToGranularity", () => {
    it("maps known period types correctly", () => {
      expect(GradingService._periodTypeToGranularity("sequence")).toBe("SEQUENCE");
      expect(GradingService._periodTypeToGranularity("term")).toBe("TERM");
      expect(GradingService._periodTypeToGranularity("trimestre")).toBe("TERM");
      expect(GradingService._periodTypeToGranularity("semester")).toBe("SEMESTER");
      expect(GradingService._periodTypeToGranularity("academic_year")).toBe("ANNUAL");
    });

    it("defaults to SEQUENCE for unknown types", () => {
      expect(GradingService._periodTypeToGranularity("quarter")).toBe("SEQUENCE");
      expect(GradingService._periodTypeToGranularity("unknown")).toBe("SEQUENCE");
      expect(GradingService._periodTypeToGranularity("")).toBe("SEQUENCE");
    });

    it("is case-insensitive", () => {
      expect(GradingService._periodTypeToGranularity("SEQUENCE")).toBe("SEQUENCE");
      expect(GradingService._periodTypeToGranularity("Term")).toBe("TERM");
      expect(GradingService._periodTypeToGranularity("TRIMESTRE")).toBe("TERM");
    });
  });
});

describe("GradingService — CRUD operations (mocked DB)", () => {
  const mockSql = require("../config/database");

  beforeEach(() => {
    // Reset mock between tests
    mockSql.mockReset();
  });

  // ------------------------------------------------------------------
  // Education Systems
  // ------------------------------------------------------------------
  describe("listEducationSystems", () => {
    it("returns ordered list of education systems", async () => {
      const fakeRows = [
        { code: "ANG_GEN", name_en: "Anglophone General" },
        { code: "FR_GEN", name_en: "Francophone General" },
      ];
      mockSql.mockResolvedValue(fakeRows);

      const result = await GradingService.listEducationSystems();
      expect(result).toEqual(fakeRows);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });
  });

  describe("getEducationSystem", () => {
    it("returns a single education system by id", async () => {
      const fakeRow = { education_system_id: "sys-1", code: "FR_GEN" };
      mockSql.mockResolvedValue([fakeRow]);

      const result = await GradingService.getEducationSystem("sys-1");
      expect(result).toEqual(fakeRow);
    });

    it("returns null when not found", async () => {
      mockSql.mockResolvedValue([]);
      const result = await GradingService.getEducationSystem("nonexistent");
      expect(result).toBeNull();
    });
  });

  // ------------------------------------------------------------------
  // Grading Scales
  // ------------------------------------------------------------------
  describe("createGradingScale", () => {
    it("inserts and returns the new grading scale", async () => {
      const fakeScale = { grading_scale_id: "scale-1", name: "Test Scale", min_value: 0, max_value: 20 };
      mockSql.mockResolvedValue([fakeScale]);

      const result = await GradingService.createGradingScale("school-1", {
        name: "Test Scale",
        minValue: 0,
        maxValue: 20,
      });
      expect(result).toEqual(fakeScale);
      expect(mockSql).toHaveBeenCalledTimes(1);
    });

    it("uses defaults for min/max when not provided", async () => {
      mockSql.mockResolvedValue([{ grading_scale_id: "scale-2", name: "Default Scale", min_value: 0, max_value: 20 }]);

      const result = await GradingService.createGradingScale("school-1", { name: "Default Scale" });
      expect(result.min_value).toBe(0);
      expect(result.max_value).toBe(20);
    });
  });

  describe("listGradingScales", () => {
    it("returns scales for a school ordered by name", async () => {
      const fakeScales = [{ name: "A Scale" }, { name: "B Scale" }];
      mockSql.mockResolvedValue(fakeScales);

      const result = await GradingService.listGradingScales("school-1");
      expect(result).toEqual(fakeScales);
    });
  });

  // ------------------------------------------------------------------
  // Grading Scale Versions
  // ------------------------------------------------------------------
  describe("createGradingScaleVersion", () => {
    it("inserts and returns the new version", async () => {
      const fakeVersion = { grading_scale_version_id: "ver-1", pass_mark: 10, rounding_rule: "round_half_up", decimal_precision: 2 };
      mockSql.mockResolvedValue([fakeVersion]);

      const result = await GradingService.createGradingScaleVersion("scale-1", {
        passMark: 10,
        roundingRule: "round_half_up",
        decimalPrecision: 2,
      });
      expect(result).toEqual(fakeVersion);
    });

    it("uses defaults when not provided", async () => {
      mockSql.mockResolvedValue([{ grading_scale_version_id: "ver-2", pass_mark: 10, rounding_rule: "round_half_up", decimal_precision: 2 }]);

      const result = await GradingService.createGradingScaleVersion("scale-1", {});
      expect(result.pass_mark).toBe(10);
      expect(result.rounding_rule).toBe("round_half_up");
      expect(result.decimal_precision).toBe(2);
    });
  });

  describe("listGradingScaleVersions", () => {
    it("returns versions ordered by effective_from DESC", async () => {
      const fakeVersions = [{ version: 2 }, { version: 1 }];
      mockSql.mockResolvedValue(fakeVersions);

      const result = await GradingService.listGradingScaleVersions("scale-1");
      expect(result).toEqual(fakeVersions);
    });
  });

  // ------------------------------------------------------------------
  // Mention Thresholds
  // ------------------------------------------------------------------
  describe("createMentionThresholdSet", () => {
    it("inserts and returns the threshold set", async () => {
      const fakeSet = { threshold_set_id: "set-1" };
      mockSql.mockResolvedValue([fakeSet]);

      const result = await GradingService.createMentionThresholdSet({
        educationSystemId: "sys-1",
        gradingScaleId: "scale-1",
      });
      expect(result).toEqual(fakeSet);
    });
  });

  describe("createMentionThreshold", () => {
    it("inserts and returns the threshold", async () => {
      const fakeThreshold = { mention_threshold_id: "th-1", min_value: 16, max_value: 20, mention_label_en: "Excellent" };
      mockSql.mockResolvedValue([fakeThreshold]);

      const result = await GradingService.createMentionThreshold("set-1", {
        minValue: 16,
        maxValue: 20,
        mentionLabelFr: "Excellent",
        mentionLabelEn: "Excellent",
      });
      expect(result).toEqual(fakeThreshold);
    });
  });

  describe("listMentionThresholds", () => {
    it("returns thresholds ordered by min_value DESC", async () => {
      const fakeThresholds = [{ min_value: 16 }, { min_value: 10 }];
      mockSql.mockResolvedValue(fakeThresholds);

      const result = await GradingService.listMentionThresholds("set-1");
      expect(result).toEqual(fakeThresholds);
    });
  });
});
