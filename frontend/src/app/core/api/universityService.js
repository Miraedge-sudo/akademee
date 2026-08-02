import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

function extractData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function extractList(response) {
  const data = extractData(response);
  if (Array.isArray(data)) {
    return { items: data, pagination: { page: 1, limit: data.length, total: data.length } };
  }
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? { page: 1, limit: 20, total: 0 },
  };
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
}

function list(endpoint, params) {
  return api.get(`${endpoint}${buildQuery(params)}`).then(extractList);
}

function get(endpoint, id) {
  return api.get(id ? `${endpoint}/${id}` : endpoint).then(extractData);
}

export const universityService = {
  faculties: {
    list: (params = {}) => list(API_ENDPOINTS.UNIVERSITY.FACULTIES, params),
    get: (id) => get(API_ENDPOINTS.UNIVERSITY.FACULTIES, id),
    getStats: (id) => api.get(API_ENDPOINTS.UNIVERSITY.FACULTY_STATS(id)).then(extractData),
    getPrograms: (id, params = {}) => list(API_ENDPOINTS.UNIVERSITY.FACULTY_PROGRAMS(id), params),
    create: (payload) => api.post(API_ENDPOINTS.UNIVERSITY.FACULTIES, payload).then(extractData),
    updateById: (id, payload) => api.put(API_ENDPOINTS.UNIVERSITY.FACULTY(id), payload).then(extractData),
    delete: (id) => api.delete(API_ENDPOINTS.UNIVERSITY.FACULTY(id)),
  },

  departments: {
    list: (params = {}) => list(API_ENDPOINTS.UNIVERSITY.DEPARTMENTS, params),
    get: (id) => get(API_ENDPOINTS.UNIVERSITY.DEPARTMENTS, id),
    create: (payload) => api.post(API_ENDPOINTS.UNIVERSITY.DEPARTMENTS, payload).then(extractData),
    updateById: (id, payload) => api.put(API_ENDPOINTS.UNIVERSITY.DEPARTMENT(id), payload).then(extractData),
    delete: (id) => api.delete(API_ENDPOINTS.UNIVERSITY.DEPARTMENT(id)),
  },

  programs: {
    list: (params = {}) => list(API_ENDPOINTS.UNIVERSITY.PROGRAMS, params),
    get: (id) => get(API_ENDPOINTS.UNIVERSITY.PROGRAMS, id),
    create: (payload) => api.post(API_ENDPOINTS.UNIVERSITY.PROGRAMS, payload).then(extractData),
    updateById: (id, payload) => api.put(API_ENDPOINTS.UNIVERSITY.PROGRAM(id), payload).then(extractData),
    delete: (id) => api.delete(API_ENDPOINTS.UNIVERSITY.PROGRAM(id)),
  },

  research: {
    list: (params = {}) => list(API_ENDPOINTS.UNIVERSITY.RESEARCH, params),
    get: (id) => get(API_ENDPOINTS.UNIVERSITY.RESEARCH, id),
    create: (payload) => api.post(API_ENDPOINTS.UNIVERSITY.RESEARCH, payload).then(extractData),
    updateById: (id, payload) => api.put(API_ENDPOINTS.UNIVERSITY.RESEARCH_ITEM(id), payload).then(extractData),
    delete: (id) => api.delete(API_ENDPOINTS.UNIVERSITY.RESEARCH_ITEM(id)),
  },

  publications: {
    list: (params = {}) => list(API_ENDPOINTS.UNIVERSITY.PUBLICATIONS, params),
    get: (id) => get(API_ENDPOINTS.UNIVERSITY.PUBLICATIONS, id),
    create: (payload) => api.post(API_ENDPOINTS.UNIVERSITY.PUBLICATIONS, payload).then(extractData),
    updateById: (id, payload) => api.put(API_ENDPOINTS.UNIVERSITY.PUBLICATION(id), payload).then(extractData),
    delete: (id) => api.delete(API_ENDPOINTS.UNIVERSITY.PUBLICATION(id)),
  },
};

export default universityService;
