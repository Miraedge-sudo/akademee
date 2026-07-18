import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../core/hooks/useTheme";
import { getClasses } from "../../../core/api/classService";
import { getAllClassTeacherAssignments, assignClassTeacher, removeClassTeacher } from "../../../core/api/subjectService";
import { getUsers, deleteUser } from "../../../core/api/userManagementService";
import { getStudents } from "../../../core/api/studentService";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiUser,
  FiShield,
  FiBookOpen,
  FiAward,
  FiDollarSign,
  FiClipboard,
  FiHeart,
  FiSearch,
  FiX,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiMail,
  FiUserPlus,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiClock,
  FiMoreVertical,
  FiBell,
  FiCheck,
  FiLoader,
} from "react-icons/fi";

// ── Role config ──
const ROLE_META = {
  ADMIN: { icon: FiShield, color: "#085041", bg: "#E1F5EE", label: "Admin", labelFr: "Admin" },
  TEACHER: { icon: FiBookOpen, color: "#3B82F6", bg: "#EFF6FF", label: "Teacher", labelFr: "Enseignant" },
  STUDENT: { icon: FiAward, color: "#8B5CF6", bg: "#F5F3FF", label: "Student", labelFr: "Élève" },
  ACCOUNTANT: { icon: FiDollarSign, color: "#F59E0B", bg: "#FEF3C7", label: "Accountant", labelFr: "Comptable" },
  SECRETARY: { icon: FiClipboard, color: "#EC4899", bg: "#FDF2F8", label: "Secretary", labelFr: "Secrétaire" },
  PARENT: { icon: FiHeart, color: "#14B8A6", bg: "#F0FDFA", label: "Parent", labelFr: "Parent" },
};

const ROLES = ["ADMIN", "TEACHER", "STUDENT", "ACCOUNTANT", "SECRETARY"];

const PER_PAGE = 8;

export default function UsersListPage() {
  const { i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("table");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Load users from real API ──
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [userData, studentData] = await Promise.all([
        getUsers({ limit: 500, includeInactive: true }),
        getStudents({ limit: 500 }).catch(() => ({ students: [] })),
      ]);
      const list = userData?.users || [];
      // Build a map of userId -> className for students
      const studentMap = {};
      const studentList = Array.isArray(studentData) ? studentData : (studentData?.students || []);
      studentList.forEach((s) => {
        if (s.className) {
          studentMap[s.userId] = s.className;
        }
      });
      const mapped = list.map((u) => ({
        id: u.id,
        userId: u.id,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        email: u.email || "",
        loginEmail: u.loginEmail || u.email || "",
        role: u.roles?.[0]?.code || (u.role || "USER"),
        status: u.isActive !== false ? "active" : "inactive",
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—",
        phone: u.phone || "—",
        class: studentMap[u.id] || "",
      }));
      console.log(`[UsersListPage] Loaded ${mapped.length} users (${mapped.filter((u) => u.role === "TEACHER").length} teachers)`);
      setUsers(mapped);
    } catch (err) {
      console.error("[UsersListPage] Failed to load users:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const navigate = useNavigate();

  // ── Delete user state & handler ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success(isFr ? `Utilisateur ${deleteTarget.name} supprimé` : `User ${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || (isFr ? "Erreur" : "Error");
      toast.error(msg);
    }
    setDeleting(false);
  };

  // ── Teacher assignment modal ──
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const openAssignModal = async (teacher) => {
    setAssignTeacher(teacher);
    setLoadingClasses(true);
    try {
      const [clsData, asgnData] = await Promise.all([
        getClasses(),
        getAllClassTeacherAssignments().catch(() => []),
      ]);
      setClasses(clsData?.classes || clsData || []);
      const allAssignments = Array.isArray(asgnData) ? asgnData : (asgnData?.data || []);
      setTeacherAssignments(allAssignments);
    } catch { /* ignore */ }
    setLoadingClasses(false);
  };

  const closeAssignModal = () => {
    setAssignTeacher(null);
    setClasses([]);
    setTeacherAssignments([]);
  };

  const assignedClassIds = useMemo(() => {
    if (!assignTeacher) return new Set();
    return new Set(
      teacherAssignments
        .filter((a) => a.teacherId === assignTeacher.id)
        .map((a) => a.classId)
    );
  }, [assignTeacher, teacherAssignments]);

  const toggleClassAssignment = async (classId) => {
    const existing = teacherAssignments.find(
      (a) => a.teacherId === assignTeacher.id && a.classId === classId
    );

    try {
      if (existing) {
        await removeClassTeacher(classId, assignTeacher.id);
        setTeacherAssignments((prev) => prev.filter((a) => a.id !== existing.id));
      } else {
        const saved = await assignClassTeacher(classId, { teacherId: assignTeacher.id });
        setTeacherAssignments((prev) => [...prev, saved]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || (isFr ? "Erreur" : "Error");
      toast.error(msg);
      // Fallback for UI responsiveness
      if (!existing) {
        setTeacherAssignments((prev) => [...prev, { id: Date.now(), teacherId: assignTeacher.id, classId }]);
      }
    }
  };

  // ── Compute counts ──
  const counts = useMemo(() => {
    const c = { all: users.length };
    ROLES.forEach((r) => (c[r] = users.filter((u) => u.role === r).length));
    return c;
  }, [users]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const roleOk = roleFilter === "all" || u.role === roleFilter;
      const searchOk =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.class || "").toLowerCase().includes(q);
      const statusOk = statusFilter === "all" || u.status === statusFilter;
      return roleOk && searchOk && statusOk;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Handlers ──
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginated.map((u) => u.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const allPageSelected = paginated.length > 0 && paginated.every((u) => selectedIds.has(u.id));
  const totalSelected = selectedIds.size;

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const changePage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  // ── hexToRgb ──
  const htr = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "8,80,65";
  };

  // ── Role helper ──
  const roleClass = (role) => {
    const m = {
      ADMIN: "bg-[rgba(8,80,65,0.09)] text-[#085041] border-[rgba(8,80,65,0.18)]",
      TEACHER: "bg-[rgba(59,130,246,0.09)] text-[#3B82F6] border-[rgba(59,130,246,0.2)]",
      STUDENT: "bg-[rgba(139,92,246,0.09)] text-[#8B5CF6] border-[rgba(139,92,246,0.2)]",
      ACCOUNTANT: "bg-[rgba(245,158,11,0.09)] text-[#F59E0B] border-[rgba(245,158,11,0.2)]",
      SECRETARY: "bg-[rgba(236,72,153,0.09)] text-[#EC4899] border-[rgba(236,72,153,0.2)]",
      PARENT: "bg-[rgba(20,184,166,0.09)] text-[#14B8A6] border-[rgba(20,184,166,0.2)]",
    };
    return m[role] || m.ADMIN;
  };

  // ── KPI Chip ──
  const KpiChip = ({ role, label, count, icon: Icon, bgColor, textColor, active, onClick }) => (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border-2 p-3.5 sm:p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-left ${
        active ? "border-[#085041] bg-white" : "border-surface-100 dark:border-surface-700 bg-white dark:bg-surface-800"
      }`}
    >
      <div className="absolute top-0 left-[-100%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bgColor }}>
          <Icon className="w-3.5 h-3.5" style={{ color: textColor, strokeWidth: 1.8 }} />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-extrabold leading-none mb-0.5 text-surface-800 dark:text-surface-100">
        {count}
      </div>
      <div className="text-[11px] text-surface-400 font-medium">{label}</div>
    </button>
  );

  // ── Chevrons icon ──
  const ChevronsUpDown = () => (
    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="17 3 12 8 7 3" />
      <polyline points="7 21 12 16 17 21" />
    </svg>
  );

  // ── Render table view ──
  const renderTableView = () => (
    <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
              <th className="w-10 px-3 py-2.5">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    allPageSelected ? "bg-[#085041] border-[#085041]" : "border-surface-200 dark:border-surface-500"
                  }`}
                  onClick={toggleSelectAll}
                >
                  {allPageSelected && (
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">
                <span className="inline-flex items-center gap-1">
                  {isFr ? "Utilisateur" : "User"} <ChevronsUpDown />
                </span>
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400">
                {isFr ? "Rôle" : "Role"}
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400 hidden sm:table-cell">
                {isFr ? "Classe/Matière" : "Class / Subject"}
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400 hidden md:table-cell">
                {isFr ? "Statut" : "Status"}
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400 hidden md:table-cell">
                {isFr ? "Email de connexion" : "Login email"}
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold tracking-wider uppercase text-surface-400 hidden lg:table-cell">
                <span className="inline-flex items-center gap-1">
                  {isFr ? "Dernière connexion" : "Last login"} <ChevronsUpDown />
                </span>
              </th>
              <th className="px-3 py-2.5 text-right text-[11px] font-bold tracking-wider uppercase text-surface-400">
                {isFr ? "Actions" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u) => {
              const meta = ROLE_META[u.role] || ROLE_META.ADMIN;
              const initials = (u.firstName[0] + u.lastName[0]).toUpperCase();
              const isChecked = selectedIds.has(u.id);
              const Icon = meta.icon;
              return (<tr
                    key={u.id}
                    className="group border-t border-surface-50 dark:border-surface-700/50 hover:bg-[rgba(8,80,65,0.025)] dark:hover:bg-surface-700/30 transition-colors"
                  >
                  <td className="px-3 py-3">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                        isChecked
                          ? "bg-[#085041] border-[#085041] scale-110"
                          : "border-surface-200 dark:border-surface-500"
                      }`}
                      onClick={() => toggleSelect(u.id)}
                    >
                      {isChecked && (
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <polyline points="2 6 5 9 10 3" />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {initials}
                        </div>
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-surface-800"
                          style={{ background: u.status === "active" ? "#1D9E75" : "#9BA59C" }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-bold text-surface-800 dark:text-surface-100 truncate">
                          {u.name}
                        </div>
                        <div className="text-[11.5px] text-surface-400 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${roleClass(u.role)}`}
                    >
                      <Icon className="w-3 h-3" strokeWidth={2.5} />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-surface-500 dark:text-surface-400 hidden sm:table-cell">
                    {u.class || u.subjects || "—"}
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-[7px] h-[7px] rounded-full"
                        style={{
                          background: u.status === "active" ? "#1D9E75" : "#BFC4BB",
                        }}
                      />
                      <span
                        className="text-[13px]"
                        style={{ color: u.status === "active" ? "inherit" : undefined }}
                      >
                        {u.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[12.5px] text-surface-500 dark:text-surface-400 font-mono hidden md:table-cell max-w-[140px] truncate">
                    {u.loginEmail !== u.email ? u.loginEmail : u.email}
                  </td>
                  <td className="px-3 py-3 text-[12.5px] text-surface-400 hidden lg:table-cell">
                    {u.lastLogin}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/dashboard/users/new?edit=${u.id}&role=${u.role}`)}
                        className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-110 hover:border-surface-200 hover:shadow-sm transition-all"
                        title={isFr ? "Voir" : "View"}
                      >
                        <FiEye className="w-3 h-3 text-surface-400" />
                      </button>
                      {/* ── Role-specific actions ── */}
                      {u.role === "TEACHER" && (
                        <button
                          onClick={() => openAssignModal(u)}
                          className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-110 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all"
                          title={isFr ? "Assigner aux classes" : "Assign to classes"}
                        >
                          <FiBookOpen className="w-3 h-3" style={{ color: "#3B82F6" }} />
                        </button>
                      )}
                      {u.role === "STUDENT" && (
                        <button
                          onClick={() => navigate(`/dashboard/users/new?edit=${u.id}&role=${u.role}`)}
                          className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-110 hover:border-purple-200 hover:bg-purple-50 hover:shadow-sm transition-all"
                          title={isFr ? "Voir la fiche" : "View profile"}
                        >
                          <FiAward className="w-3 h-3" style={{ color: "#8B5CF6" }} />
                        </button>
                      )}
                      {u.role !== "TEACHER" && u.role !== "STUDENT" && (
                        <button
                          onClick={() => navigate(`/dashboard/users/new?edit=${u.id}&role=${u.role}`)}
                          className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-110 hover:border-teal-200 hover:bg-teal-50 hover:shadow-sm transition-all"
                          title={isFr ? "Modifier" : "Edit"}
                        >
                          <FiEdit2 className="w-3 h-3" style={{ color: "#085041" }} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center hover:scale-110 hover:border-red-200 hover:bg-red-50 hover:shadow-sm transition-all"
                        title={isFr ? "Supprimer" : "Delete"}
                      >
                        <FiTrash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-14 animate-scaleIn">
          <div className="w-[72px] h-[72px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-4">
            <FiUser className="w-7 h-7 text-surface-400" />
          </div>
          <div className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-1.5">
            {isFr ? "Aucun utilisateur trouvé" : "No users found"}
          </div>
          <p className="text-[13.5px] text-surface-400 mb-6">
            {search
              ? isFr ? "Essayez un autre terme de recherche." : "Try a different search term."
              : isFr ? "Ajoutez votre premier utilisateur pour commencer." : "Add your first user to get started."}
          </p>
          {!search && (
            <Link
              to="/dashboard/users/new"
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all"
              style={{ backgroundColor: pc, boxShadow: `0 4px 14px rgba(8,80,65,0.22)` }}
            >
              <FiUserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
              {isFr ? "Ajouter un utilisateur" : "Add user"}
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-t border-surface-100 dark:border-surface-700 flex-wrap gap-3">
          <div className="text-[12.5px] text-surface-400">
            {isFr
              ? `Affichage ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} sur ${filtered.length}`
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length} users`}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => changePage(page - 1)}
              disabled={page === 1}
              className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center text-[13px] font-semibold text-surface-500 dark:text-surface-400 hover:scale-105 hover:border-surface-200 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-default disabled:hover:scale-100"
            >
              <FiChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => changePage(i + 1)}
                className={`w-8 h-8 rounded-md border flex items-center justify-center text-[13px] font-semibold transition-all hover:scale-105 ${
                  page === i + 1
                    ? "bg-[#085041] border-[#085041] text-white"
                    : "border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:border-surface-200 hover:shadow-sm"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => changePage(page + 1)}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center text-[13px] font-semibold text-surface-500 dark:text-surface-400 hover:scale-105 hover:border-surface-200 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-default disabled:hover:scale-100"
            >
              <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render card view ──
  const renderCardsView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-fadeIn">
      {paginated.map((u) => {
        const meta = ROLE_META[u.role] || ROLE_META.ADMIN;
        const initials = (u.firstName[0] + u.lastName[0]).toUpperCase();
        const Icon = meta.icon;
        return (
          <div
            key={u.id}
            className="bg-white dark:bg-surface-800 rounded-xl border border-surface-100 dark:border-surface-700 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-surface-200 transition-all duration-250 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3.5">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-base font-extrabold"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {initials}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2.5px] border-white dark:border-surface-800"
                  style={{ background: u.status === "active" ? "#1D9E75" : "#9BA59C" }}
                />
              </div>
              <button
                className="w-7 h-7 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                title={isFr ? "Menu" : "Menu"}
              >
                <FiMoreVertical className="w-3.5 h-3.5 text-surface-400" />
              </button>
            </div>
            <div className="text-[15px] font-bold text-surface-800 dark:text-surface-100 mb-1 truncate">
              {u.name}
            </div>
            <div className="text-xs text-surface-400 mb-3 truncate">{u.email}</div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border mb-3 ${roleClass(u.role)}`}
            >
              <Icon className="w-3 h-3" strokeWidth={2.5} />
              {u.role}
            </span>
            <div className="flex items-center justify-between pt-3 border-t border-surface-50 dark:border-surface-700/50 mt-2">
              <div className="flex items-center gap-1 text-[11.5px] text-surface-400">
                <FiClock className="w-2.5 h-2.5" />
                {u.lastLogin}
              </div>
              <div
                className="flex items-center gap-1 text-[11.5px]"
                style={{ color: u.status === "active" ? "#1D9E75" : "#9BA59C" }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />
                {u.status === "active" ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="col-span-full text-center py-14">
          <div className="w-[72px] h-[72px] rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-4">
            <FiUser className="w-7 h-7 text-surface-400" />
          </div>
          <div className="font-display text-xl font-bold text-surface-800 dark:text-surface-100 mb-1.5">
            {isFr ? "Aucun utilisateur trouvé" : "No users found"}
          </div>
          <p className="text-[13.5px] text-surface-400">{isFr ? "Essayez un autre terme." : "Try a different term."}</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="col-span-full flex justify-center gap-1 mt-4">
          <button
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center text-[13px] font-semibold text-surface-500 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-default"
          >
            <FiChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => changePage(i + 1)}
              className={`w-8 h-8 rounded-md border flex items-center justify-center text-[13px] font-semibold transition-all hover:scale-105 ${
                page === i + 1
                  ? "bg-[#085041] border-[#085041] text-white"
                  : "border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-500 hover:border-surface-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            className="w-8 h-8 rounded-md border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 flex items-center justify-center text-[13px] font-semibold text-surface-500 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-default"
          >
            <FiChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6 animate-fadeIn">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-1 h-[26px] rounded-full" style={{ backgroundColor: pc }} />
            <h1 className="font-display text-[26px] font-bold text-surface-800 dark:text-surface-100">
              {isFr ? "Utilisateurs" : "Users"}
            </h1>
          </div>
          <p className="text-[13.5px] text-surface-400 ml-3.5">
            {isFr
              ? `${filtered.length} utilisateur${filtered.length !== 1 ? "s" : ""} · ${users.length} au total`
              : `${filtered.length} user${filtered.length !== 1 ? "s" : ""} · ${users.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border-2 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-[13.5px] font-bold hover:bg-surface-50 dark:hover:bg-surface-700 transition-all">
            <FiDownload className="w-3.5 h-3.5" />
            {isFr ? "Exporter" : "Export"}
          </button>
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border-2 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-[13.5px] font-bold hover:bg-surface-50 dark:hover:bg-surface-700 transition-all">
            <FiMail className="w-3.5 h-3.5" />
            {isFr ? "Inviter" : "Invite"}
          </button>
          <Link
            to="/dashboard/users/new"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg text-white text-[13.5px] font-bold shadow-md hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: pc, boxShadow: `0 4px 14px rgba(${htr(pc)},0.22)` }}
          >
            <FiUserPlus className="w-3.5 h-3.5" strokeWidth={2.5} />
            {isFr ? "Ajouter" : "Add user"}
          </Link>
        </div>
      </div>

      {/* ── KPI chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
        <KpiChip role="all" label={isFr ? "Tous" : "All users"} count={counts.all} icon={FiUser} bgColor="#F7F8F6" textColor="#5C665E" active={roleFilter === "all"} onClick={() => handleRoleFilter("all")} />
        <KpiChip role="ADMIN" label={isFr ? "Admins" : "Admins"} count={counts.ADMIN} icon={FiShield} bgColor="#E1F5EE" textColor="#085041" active={roleFilter === "ADMIN"} onClick={() => handleRoleFilter("ADMIN")} />
        <KpiChip role="TEACHER" label={isFr ? "Enseignants" : "Teachers"} count={counts.TEACHER} icon={FiBookOpen} bgColor="rgba(59,130,246,0.08)" textColor="#3B82F6" active={roleFilter === "TEACHER"} onClick={() => handleRoleFilter("TEACHER")} />
        <KpiChip role="STUDENT" label={isFr ? "Élèves" : "Students"} count={counts.STUDENT} icon={FiAward} bgColor="rgba(139,92,246,0.08)" textColor="#8B5CF6" active={roleFilter === "STUDENT"} onClick={() => handleRoleFilter("STUDENT")} />
        <KpiChip role="ACCOUNTANT" label={isFr ? "Comptables" : "Accountants"} count={counts.ACCOUNTANT} icon={FiDollarSign} bgColor="rgba(245,158,11,0.08)" textColor="#F59E0B" active={roleFilter === "ACCOUNTANT"} onClick={() => handleRoleFilter("ACCOUNTANT")} />
        <KpiChip role="SECRETARY" label={isFr ? "Secrétaires" : "Secretaries"} count={counts.SECRETARY} icon={FiClipboard} bgColor="rgba(236,72,153,0.08)" textColor="#EC4899" active={roleFilter === "SECRETARY"} onClick={() => handleRoleFilter("SECRETARY")} />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-[340px] flex items-center gap-2 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-600 rounded-lg px-3.5 h-[42px] shadow-sm transition-colors focus-within:border-teal-600">
          <FiSearch className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={isFr ? "Rechercher par nom, email ou classe..." : "Search by name, email or class..."}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 border-none outline-none bg-transparent text-sm text-surface-800 dark:text-surface-100 placeholder:text-surface-300 font-sans"
          />
          {search && (
            <button onClick={() => handleSearch("")} className="bg-none border-none cursor-pointer p-0">
              <FiX className="w-3.5 h-3.5 text-surface-400" />
            </button>
          )}
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-600 rounded-lg p-1 shadow-sm overflow-x-auto">
          {[
            { role: "all", label: isFr ? "Tous" : "All" },
            { role: "ADMIN", label: "Admin" },
            { role: "TEACHER", label: isFr ? "Ens." : "Teacher" },
            { role: "STUDENT", label: isFr ? "Élève" : "Student" },
            { role: "ACCOUNTANT", label: isFr ? "Compta" : "Acct." },
            { role: "SECRETARY", label: isFr ? "Secr." : "Sec." },
          ].map(({ role, label }) => (
            <button
              key={role}
              onClick={() => handleRoleFilter(role)}
              className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                roleFilter === role
                  ? "bg-[#085041] text-white shadow-md scale-[1.02]"
                  : "text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-700"
              }`}
            >
              {label}
              <span
                className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-full ${
                  roleFilter === role ? "bg-white/20 text-white" : "bg-surface-100 dark:bg-surface-700 text-surface-500"
                }`}
              >
                {counts[role] || counts.all}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-surface-100 dark:border-surface-600 bg-white dark:bg-surface-800 text-[13px] text-surface-600 dark:text-surface-300 shadow-sm cursor-pointer font-sans outline-none"
          >
            <option value="all">{isFr ? "Tous les statuts" : "All statuses"}</option>
            <option value="active">{isFr ? "Actif" : "Active"}</option>
            <option value="inactive">{isFr ? "Inactif" : "Inactive"}</option>
          </select>

          {/* View toggle */}
          <div className="flex gap-0.5 bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-600 rounded-md p-0.5 shadow-sm">
            <button
              onClick={() => setView("table")}
              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                view === "table" ? "bg-[#085041]" : "bg-transparent"
              }`}
            >
              <FiList className={`w-3.5 h-3.5 ${view === "table" ? "text-white" : "text-surface-400"}`} strokeWidth={2} />
            </button>
            <button
              onClick={() => setView("cards")}
              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                view === "cards" ? "bg-[#085041]" : "bg-transparent"
              }`}
            >
              <FiGrid className={`w-3.5 h-3.5 ${view === "cards" ? "text-white" : "text-surface-400"}`} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      {view === "table" ? renderTableView() : renderCardsView()}

      {/* ── Delete User Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-[420px] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl p-7">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <FiTrash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100 text-center mb-2">
              {isFr ? "Confirmer la suppression" : "Confirm deletion"}
            </h3>
            <p className="text-sm text-surface-500 text-center mb-7 leading-relaxed">
              {isFr
                ? `Êtes-vous sûr de vouloir supprimer définitivement "${deleteTarget.name}" ? Cette action est irréversible.`
                : `Are you sure you want to permanently delete "${deleteTarget.name}"? This action cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-11 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 text-sm font-semibold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                {isFr ? "Annuler" : "Cancel"}
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-55 hover:bg-red-600 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                {deleting && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {isFr ? "Supprimer" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Teacher Class Assignment Modal ── */}
      {assignTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAssignModal} />
          <div className="relative w-full max-w-[520px] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <FiBookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-surface-800 dark:text-surface-100">
                    {isFr ? "Assigner aux classes" : "Assign to Classes"}
                  </h2>
                  <p className="text-xs text-surface-400">
                    {assignTeacher.name} · {assignTeacher.email}
                  </p>
                </div>
              </div>
              <button onClick={closeAssignModal} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                <FiX className="w-4 h-4 text-surface-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {loadingClasses ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <div className="w-8 h-8 rounded-full border-4 border-surface-200 dark:border-surface-600 border-t-blue-500 animate-spin" />
                  <p className="text-sm text-surface-400">{isFr ? "Chargement des classes..." : "Loading classes..."}</p>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-10">
                  <FiBookOpen className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-surface-500">{isFr ? "Aucune classe disponible" : "No classes available"}</p>
                  <p className="text-xs text-surface-400 mt-1">{isFr ? "Créez d'abord des classes dans la section Classes" : "Create classes first in the Classes section"}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {classes.map((cls) => {
                    const isAssigned = assignedClassIds.has(cls.id);
                    return (
                      <button
                        key={cls.id}
                        onClick={() => toggleClassAssignment(cls.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          isAssigned
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                            : "bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            isAssigned
                              ? "bg-blue-600 border-blue-600"
                              : "border-surface-300 dark:border-surface-500"
                          }`}
                        >
                          {isAssigned && (
                            <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-bold text-surface-800 dark:text-surface-100 truncate">{cls.name}</div>
                          <div className="text-[11px] text-surface-400">
                            {cls.level} · {cls.studentsCount || 0} {isFr ? "élèves" : "students"}
                          </div>
                        </div>
                        {isAssigned && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700 flex-shrink-0">
                            {isFr ? "Assigné" : "Assigned"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
              <button
                onClick={closeAssignModal}
                className="h-[44px] px-5 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
              >
                {isFr ? "Fermer" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk action bar ── */}
      <div
        className={`fixed bottom-7 left-1/2 z-50 bg-surface-900 dark:bg-surface-800 text-white px-5 py-3 rounded-xl flex items-center gap-3.5 shadow-lg whitespace-nowrap transition-all duration-300 ${
          totalSelected > 0 ? "translate-x-[-50%] translate-y-0 opacity-100 pointer-events-auto" : "translate-x-[-50%] translate-y-20 opacity-0 pointer-events-none"
        }`}
      >
        <span className="text-[13px] font-bold text-teal-400">{totalSelected} selected</span>
        <div className="w-px h-[18px] bg-white/15" />
        <button className="flex items-center gap-1.5 text-[13px] font-semibold text-white/75 hover:text-white hover:bg-white/10 px-2 py-1 rounded-md transition-all bg-transparent border-none cursor-pointer">
          <FiCheckCircle className="w-3.5 h-3.5" />
          {isFr ? "Activer" : "Activate"}
        </button>
        <button className="flex items-center gap-1.5 text-[13px] font-semibold text-white/75 hover:text-white hover:bg-white/10 px-2 py-1 rounded-md transition-all bg-transparent border-none cursor-pointer">
          <FiXCircle className="w-3.5 h-3.5" />
          {isFr ? "Désactiver" : "Deactivate"}
        </button>
        <button className="flex items-center gap-1.5 text-[13px] font-semibold text-white/75 hover:text-white hover:bg-white/10 px-2 py-1 rounded-md transition-all bg-transparent border-none cursor-pointer">
          <FiBell className="w-3.5 h-3.5" />
          {isFr ? "Notifier" : "Notify"}
        </button>
        <div className="w-px h-[18px] bg-white/15" />
        <button className="flex items-center gap-1.5 text-[13px] font-semibold text-red-400 hover:text-red-300 hover:bg-white/10 px-2 py-1 rounded-md transition-all bg-transparent border-none cursor-pointer">
          <FiTrash2 className="w-3.5 h-3.5" />
          {isFr ? "Supprimer" : "Delete"}
        </button>
        <div className="w-px h-[18px] bg-white/15" />
        <button
          onClick={() => setSelectedIds(new Set())}
          className="text-white/40 hover:text-white bg-transparent border-none cursor-pointer"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
