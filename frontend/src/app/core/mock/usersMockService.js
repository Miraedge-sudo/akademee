// ── Mock Data ─────────────────────────────────────────────
const MOCK_TEACHERS = [
  { id: "t1", firstName: "John", lastName: "Doe", email: "john@school.cm", gender: "Male", phone: "+237 671 234 567", empType: "Full-time", qualif: "MSc Mathematics" },
  { id: "t2", firstName: "Marie", lastName: "Smith", email: "marie@school.cm", gender: "Female", phone: "+237 672 345 678", empType: "Full-time", qualif: "MSc English" },
  { id: "t3", firstName: "Tom", lastName: "Green", email: "tom@school.cm", gender: "Male", phone: "+237 673 456 789", empType: "Part-time", qualif: "BSc Physics" },
];

const MOCK_CLASSES = [
  "Form 1A", "Form 1B", "Form 2A", "Form 2B", "Form 3A", "Form 3B",
  "Form 4A", "Form 5A", "Lower 6th Science", "Lower 6th Arts",
  "Upper 6th Science", "Upper 6th Arts",
  "6ème A", "5ème A", "4ème A", "3ème A", "2nde A", "1ère D", "Tle D",
];

const MOCK_SUBJECTS = [
  "Mathematics", "English Language", "French", "Physics", "Chemistry",
  "Biology", "History", "Geography", "Computer Science", "Economics",
  "Literature in English", "Religious Studies", "Physical Education",
  "Philosophy", "Citizenship", "ICT",
];

let MOCK_USERS = [
  {
    id: "u1", firstName: "Admin", lastName: "System", email: "admin@school.cm",
    role: "ADMIN", gender: "Male", phone: "+237 670 000 001",
    photo: null, createdAt: "2025-01-15T08:00:00Z", active: true,
  },
  {
    id: "u2", firstName: "Marie", lastName: "Smith", email: "marie@school.cm",
    role: "TEACHER", gender: "Female", phone: "+237 672 345 678",
    subjects: ["English Language", "Literature in English"],
    classes: ["Form 3A", "Form 3B"], empType: "Full-time",
    qualif: "MSc English", photo: null,
    createdAt: "2025-01-20T10:30:00Z", active: true,
  },
];

// ── Simulate network delay ──
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ── Generate IDs ──
let nextId = 100;
function genId() {
  return `u${nextId++}`;
}

// ── Academic years mock ──
const MOCK_ACADEMIC_YEARS = [
  { id: "y1", name: "2025/2026", isCurrent: true },
  { id: "y2", name: "2026/2027", isCurrent: false },
];

// ── API Functions ──

export async function createUser(userData) {
  await delay(1200);

  const newUser = {
    id: genId(),
    ...userData,
    createdAt: new Date().toISOString(),
    active: true,
    photo: userData.photo || null,
    subjects: userData.subjects || [],
    classes: userData.classes || [],
  };

  MOCK_USERS.push(newUser);

  return {
    success: true,
    message: "User created successfully",
    data: newUser,
  };
}

export async function sendInvitation(email, firstName, role) {
  await delay(800);

  return {
    success: true,
    message: `Invitation sent to ${email}`,
    data: { email, firstName, role, sentAt: new Date().toISOString() },
  };
}

export async function getUsers(params = {}) {
  await delay(300);
  let users = [...MOCK_USERS];
  if (params.role) {
    users = users.filter((u) => u.role === params.role);
  }
  return { success: true, data: users };
}

export async function getUserById(id) {
  await delay(200);
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  return { success: true, data: user };
}

export async function getTeachers() {
  await delay(200);
  return { success: true, data: [...MOCK_TEACHERS] };
}

export async function getClasses() {
  await delay(200);
  return { success: true, data: [...MOCK_CLASSES] };
}

export async function getSubjects() {
  await delay(200);
  return { success: true, data: [...MOCK_SUBJECTS] };
}

export async function getAcademicYears() {
  await delay(200);
  return { success: true, data: [...MOCK_ACADEMIC_YEARS] };
}

export default {
  createUser,
  sendInvitation,
  getUsers,
  getUserById,
  getTeachers,
  getClasses,
  getSubjects,
  getAcademicYears,
};
