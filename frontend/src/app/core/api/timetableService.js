// core/api/timetableService.js
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

// ── Periods (créneaux) ──

export async function getPeriods(params = {}) {
  const response = await api.get(API_ENDPOINTS.TIMETABLE.PERIODS, { params });
  return response.data.data;
}

export async function createPeriod(data) {
  const response = await api.post(API_ENDPOINTS.TIMETABLE.PERIODS, data);
  return response.data.data;
}

export async function createPeriods(data) {
  const response = await api.post(API_ENDPOINTS.TIMETABLE.PERIODS_BULK, data);
  return response.data.data;
}

export async function updatePeriod(id, data) {
  const response = await api.put(API_ENDPOINTS.TIMETABLE.PERIOD(id), data);
  return response.data.data;
}

export async function deletePeriod(id, params = {}) {
  const response = await api.delete(API_ENDPOINTS.TIMETABLE.PERIOD(id), { params });
  return response.data.data;
}

// ── Rooms (salles) ──

export async function getRooms() {
  const response = await api.get(API_ENDPOINTS.TIMETABLE.ROOMS);
  return response.data.data;
}

export async function createRoom(data) {
  const response = await api.post(API_ENDPOINTS.TIMETABLE.ROOMS, data);
  return response.data.data;
}

export async function updateRoom(id, data) {
  const response = await api.put(API_ENDPOINTS.TIMETABLE.ROOM(id), data);
  return response.data.data;
}

export async function deleteRoom(id) {
  const response = await api.delete(API_ENDPOINTS.TIMETABLE.ROOM(id));
  return response.data.data;
}

// ── Entries (cours) ──

export async function getEntries(params = {}) {
  const response = await api.get(API_ENDPOINTS.TIMETABLE.ENTRIES, { params });
  return response.data.data;
}

export async function createEntry(data) {
  const response = await api.post(API_ENDPOINTS.TIMETABLE.ENTRIES, data);
  return response.data.data;
}

export async function updateEntry(id, data) {
  const response = await api.put(API_ENDPOINTS.TIMETABLE.ENTRY(id), data);
  return response.data.data;
}

export async function deleteEntry(id) {
  const response = await api.delete(API_ENDPOINTS.TIMETABLE.ENTRY(id));
  return response.data.data;
}

/** Remplace la grille complète d'une classe (PUT /classes/:classId/entries). */
export async function replaceClassEntries(classId, data) {
  const response = await api.put(API_ENDPOINTS.TIMETABLE.CLASS_ENTRIES(classId), data);
  return response.data.data;
}

// ── Unavailabilities (indisponibilités) ──

export async function getUnavailabilities(params = {}) {
  const response = await api.get(API_ENDPOINTS.TIMETABLE.UNAVAILABILITIES, { params });
  return response.data.data;
}

export async function createUnavailability(data) {
  const response = await api.post(API_ENDPOINTS.TIMETABLE.UNAVAILABILITIES, data);
  return response.data.data;
}

export async function deleteUnavailability(id) {
  const response = await api.delete(API_ENDPOINTS.TIMETABLE.UNAVAILABILITY(id));
  return response.data.data;
}

// ── Grid & Today ──

/** Grille hebdomadaire : { academicYearId, periods, entries } avec filtres optionnels. */
export async function getGrid(params = {}) {
  const response = await api.get(API_ENDPOINTS.TIMETABLE.GRID, { params });
  return response.data.data;
}

/** Emploi du temps du jour : { date, day, entries } — fournir teacherId ou classId. */
export async function getToday(params = {}) {
  const response = await api.get(API_ENDPOINTS.TIMETABLE.TODAY, { params });
  return response.data.data;
}
