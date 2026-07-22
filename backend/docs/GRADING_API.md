# Grading System API Documentation (v1)

This document describes the backend REST endpoints for Akademee's Report Card Grading System. All routes are prefixed with `/api/v1` and require a valid `Authorization: Bearer <token>` header (except health checks).

## Base URL

```text
http://localhost:1000/api/v1
```

Replace the host and port with the deployed backend URL in production.

## Authentication

Every request must include the access token returned at login:

```http
Authorization: Bearer <access_token>
```

Role-based access is enforced:

- `admin` - full access
- `teacher` - read access, can enter/update grades and generate draft report cards
- `parent`/`student` - not yet enabled on these v1 endpoints

## Response Format

All successful responses follow the unified backend envelope:

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

Errors use the same shape with `success: false` and an HTTP 4xx/5xx status.

## 1. Education Systems

### GET `/education-systems`

List the supported education systems.

**Response:**

```json
{
  "success": true,
  "message": "Education systems retrieved",
  "data": [
    {
      "education_system_id": "...",
      "code": "FR_GEN",
      "name_fr": "Francophone General",
      "name_en": "Francophone General",
      "period_hierarchy": ["sequence", "trimestre"]
    }
  ]
}
```

### GET `/education-systems/:id`

Get a single education system.

## 2. Grading Scales

### POST `/grading-scales`

Create a new grading scale for the current school.

**Body:**

```json
{
  "name": "Cameroon Lycée Scale",
  "minValue": 0,
  "maxValue": 20
}
```

### GET `/grading-scales`

List grading scales for the current school.

### POST `/grading-scales/:scaleId/versions`

Create a version of a grading scale.

**Body:**

```json
{
  "passMark": 10,
  "roundingRule": "round_half_up",
  "decimalPrecision": 2
}
```

`roundingRule` can be `round_half_up`, `round_half_even`, or `truncate`.

### GET `/grading-scales/:scaleId/versions`

List versions ordered from newest to oldest.

## 3. Mention Thresholds

### POST `/mention-threshold-sets`

Create a set of thresholds bound to an education system and grading scale.

**Body:**

```json
{
  "educationSystemId": "...",
  "gradingScaleId": "..."
}
```

### POST `/mention-threshold-sets/:setId/thresholds`

Add a mention band.

**Body:**

```json
{
  "minValue": 16,
  "maxValue": 20,
  "mentionLabelFr": "Excellent",
  "mentionLabelEn": "Excellent"
}
```

### GET `/mention-threshold-sets/:setId/thresholds`

List thresholds for a set, ordered from highest average first.

## 4. Report Card Configuration

### GET `/report-card-configs/:appliesTo`

Get config for a granularity (`SEQUENCE`, `TERM`, `QUARTER`, `SEMESTER`, `ANNUAL`).

### PUT `/report-card-configs/:appliesTo`

Create or update the config.

**Body:**

```json
{
  "languageMode": "BILINGUAL",
  "fieldToggles": {
    "show_class_rank": true,
    "show_mention": true,
    "show_attendance": false
  },
  "gradingScaleId": "...",
  "signatureBlocks": [
    { "role": "teacher", "label": "Class Teacher" },
    { "role": "principal", "label": "Principal" }
  ]
}
```

`languageMode` can be `FR`, `EN`, or `BILINGUAL`.

## 5. Subject Offerings

A subject offering links a `Subject`, a `ClassLevel`, a `PeriodStructure`, an optional `UEGroup`, a coefficient, and credits.

### POST `/subject-offerings`

**Body:**

```json
{
  "subjectId": "...",
  "classLevelId": "...",
  "periodStructureId": "...",
  "coefficient": 3,
  "credits": 4,
  "isElective": false
}
```

### GET `/subject-offerings`

Query parameters: `classLevelId`, `periodStructureId`, `subjectId`.

## 6. Assessment Components

Assessment components define the weighted items inside a subject offering (e.g. Continuous Assessment 40%, Exam 60%).

### POST `/assessment-components`

**Body:**

```json
{
  "subjectOfferingId": "...",
  "type": "EXAM",
  "weightPercent": 60,
  "maxScore": 20
}
```

`type` can be `CONTINUOUS_ASSESSMENT`, `EXAM`, `PRACTICAL`, `THEORY`, `CC`, `TP`, or `RESIT`.

### GET `/subject-offerings/:offeringId/assessment-components`

List components for a subject offering.

## 7. UE Groups

UE (Teaching Unit) groups allow compensation between subjects in technical and university systems.

### POST `/ue-groups`

**Body:**

```json
{
  "programId": "...",
  "periodStructureId": "...",
  "name": "Sciences UE",
  "compensationMode": "WEIGHTED_GROUP_AVERAGE",
  "minGroupAverage": 10
}
```

### GET `/ue-groups`

Query parameters: `programId`, `periodStructureId`.

## 8. Grades

### POST `/grades`

Record a grade.

**Body:**

```json
{
  "studentId": "...",
  "assessmentComponentId": "...",
  "score": 14.5,
  "status": "GRADED",
  "isResit": false
}
```

`status` can be `GRADED`, `ABSENT_JUSTIFIED`, `ABSENT_UNJUSTIFIED`, `EXEMPTED`, or `PENDING`.

**Rules:**

- `score` is required when `status` is `GRADED`.
- `score` must be omitted when status is absent/exempted/pending.
- Every create/update is written to `grading_audit_logs`.

### GET `/grades`

Query parameters: `studentId`, `assessmentComponentId`, `periodStructureId`, `classLevelId`, `status`.

### PUT `/grades/:id`

Update a grade. `previous_score` is automatically preserved when the score changes.

**Body:**

```json
{
  "score": 16,
  "status": "GRADED"
}
```

## 9. Calculations

These endpoints return computed values without persisting a report card.

### GET `/calculations/subject-average`

Query parameters: `studentId`, `offeringId`, `includeResit=false`.

**Response:**

```json
{
  "average": 14.5,
  "maxScore": 20,
  "weightSum": 100,
  "components": [ ... ]
}
```

### GET `/calculations/period-average`

Query parameters: `studentId`, `periodStructureId`.

**Response:**

```json
{
  "average": 13.25,
  "rawAverage": 13.25,
  "coefficientSum": 18,
  "subjectResults": [
    {
      "subjectOfferingId": "...",
      "subjectName": "Mathematics",
      "code": "MATH",
      "coefficient": 4,
      "average": 14.5
    }
  ]
}
```

### GET `/calculations/cohort-ranks`

Query parameters: `classLevelId`, `periodStructureId`.

**Response:**

```json
{
  "ranks": {
    "<student_id>": {
      "classRank": 1,
      "partialClassRanking": false,
      "subjectRanks": { "<offering_id>": 2, ... }
    }
  },
  "classAverage": 12.8,
  "classSize": 42,
  "partialClassRanking": true
}
```

## 10. Report Cards

### POST `/report-cards`

Generate a draft report card for a student and a period.

**Body:**

```json
{
  "studentId": "...",
  "periodStructureId": "..."
}
```

**Response:**

```json
{
  "reportCard": { "report_card_id": "...", "status": "DRAFT", ... },
  "lines": [ ... ]
}
```

The following are computed and stored:

- subject averages and weighted points
- general average (rounded according to active grading scale version)
- class rank
- mention (from active thresholds)
- class size and class average

### POST `/report-cards/batch`

Generate draft report cards for an entire class.

**Body:**

```json
{
  "classLevelId": "...",
  "periodStructureId": "..."
}
```

### GET `/report-cards`

Query parameters: `studentId`, `periodStructureId`, `status`.

### GET `/report-cards/:id/payload`

Return the JSON payload ready for the frontend renderer or PDF generator.

Query parameters: `lang=EN` (values: `FR`, `EN`, `BILINGUAL`).

**Response:**

```json
{
  "report_card_id": "...",
  "status": "DRAFT",
  "version": 1,
  "student": {
    "id": "...",
    "full_name": "John Doe",
    "class_id": "...",
    "class_name": "Form 5 A"
  },
  "period": {
    "id": "...",
    "type": "sequence",
    "label": "First Sequence"
  },
  "class_level": {
    "education_system": "FR_GEN"
  },
  "subjects": [
    {
      "subjectCode": "MATH",
      "name": { "fr": "Mathematiques", "en": "Mathematics" },
      "coefficient": 4,
      "score": 14.5,
      "weightedPoints": 58,
      "subjectRank": 3,
      "teacherRemark": null,
      "validationReason": null
    }
  ],
  "summary": {
    "general_average": 13.25,
    "class_rank": "5/42",
    "class_size": 42,
    "class_average": 12.8,
    "partial_ranking": false,
    "mention": "Good",
    "pass_mark": 10
  },
  "config_applied": { ... }
}
```

### POST `/report-cards/:id/publish`

Change status from `DRAFT` or `COMPLETE` to `PUBLISHED` and freeze the cached payload.

### POST `/report-cards/:id/revise`

Create a new `DRAFT` version (version + 1) for editing while locking the previous version.

**Body:**

```json
{
  "reason": "Teacher correction"
}
```

### POST `/report-cards/:id/lock`

Lock the report card (no further edits without revising).

## 11. Audit Trail

Every grade create/update/delete and every report-card publish/revise/lock is recorded in `grading_audit_logs`. A dedicated audit endpoint may be added in a future version.

## Key Business Rules

1. **Averages are computed on read** for drafts and calculations; a payload is cached when the report card is generated.
2. **Ranks are recomputed** every time a cohort is calculated and are flagged `partial_ranking` when some students lack enough grades.
3. **Mentions** are derived from the active threshold set for the student's education system and active grading scale.
4. **UE compensation**: for `WEIGHTED_GROUP_AVERAGE`, failing subjects are compensated by the weighted average of the UE group. The base implementation stores the UE link; the compensation logic is applied when computing period averages if `compensation_mode` is configured.
5. **Bilingual**: subject and period labels are returned as objects `{ fr, en }` when `languageMode` is `BILINGUAL`.

## PDF Export

PDF rendering is intentionally out of scope for these endpoints. Use `/report-cards/:id/payload` to retrieve a print-ready JSON and send it to a PDF service (e.g. Puppeteer, `html-pdf`, or a microservice).

## Notes for Frontend Developers

- Use existing `/api/classes`, `/api/subjects`, `/api/periods`, `/api/students`, and `/api/enrollments` endpoints to populate forms before calling the grading endpoints.
- A `subject_offering_id` is required before creating `assessment_components` and before recording grades.
- For the first migration, default education systems are seeded automatically; create grading scales and thresholds per school before generating report cards.
- The status machine for report cards: `DRAFT -> COMPLETE -> PUBLISHED -> LOCKED -> REVISED (new DRAFT)`. `ARCHIVED` is supported in the status enum for future use.
