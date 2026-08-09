const TOKEN_KEY = 'lab_eletronica_token';
const USER_KEY = 'lab_eletronica_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (e) {
    return null;
  }
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const message = data?.error || `Erro na requisição (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return data;
}

export const authApi = {
  studentLogin: (body) => api('/auth/student/login', { method: 'POST', body }),
  teacherLogin: (body) => api('/auth/teacher/login', { method: 'POST', body })
};

export const profileApi = {
  get: () => api('/profile'),
  update: (body) => api('/profile', { method: 'PUT', body })
};

export const studentApi = {
  list: (params = '') => api(`/students${params}`),
  search: (term) => api(`/students/search?term=${encodeURIComponent(term)}`),
  get: (id) => api(`/students/${id}`),
  update: (id, body) => api(`/students/${id}`, { method: 'PUT', body })
};

export const teamApi = {
  list: () => api('/teams'),
  get: (id) => api(`/teams/${id}`),
  create: (body) => api('/teams', { method: 'POST', body }),
  update: (id, body) => api(`/teams/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/teams/${id}`, { method: 'DELETE' }),
  invite: (id, body) => api(`/teams/${id}/invitations`, { method: 'POST', body }),
  leave: (id) => api(`/teams/${id}/leave`, { method: 'POST' }),
  transfer: (id, body) => api(`/teams/${id}/transfer`, { method: 'POST', body }),
  removeMember: (id, studentId) => api(`/teams/${id}/members/${studentId}`, { method: 'DELETE' }),
  myInvitations: () => api('/teams/invitations')
};

export const invitationApi = {
  accept: (id) => api(`/invitations/${id}/accept`, { method: 'POST' }),
  reject: (id) => api(`/invitations/${id}/reject`, { method: 'POST' })
};

export const assignmentApi = {
  list: (params = '') => api(`/assignments${params}`),
  get: (id) => api(`/assignments/${id}`),
  create: (body) => api('/assignments', { method: 'POST', body }),
  update: (id, body) => api(`/assignments/${id}`, { method: 'PUT', body }),
  remove: (id) => api(`/assignments/${id}`, { method: 'DELETE' }),
  publish: (id) => api(`/assignments/${id}/publish`, { method: 'POST' }),
  duplicate: (id) => api(`/assignments/${id}/duplicate`, { method: 'POST' })
};

export const submissionApi = {
  list: (params = '') => api(`/submissions${params}`),
  submit: (assignmentId, body) => api(`/submissions/assignments/${assignmentId}/submit`, { method: 'POST', body }),
  listForAssignment: (assignmentId) => api(`/submissions/assignments/${assignmentId}/submissions`),
  get: (id) => api(`/submissions/${id}`),
  grade: (id, body) => api(`/submissions/${id}/grade`, { method: 'PUT', body }),
  mine: () => api('/submissions/mine')
};

export const notificationApi = {
  list: () => api('/notifications'),
  markRead: (id) => api(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => api('/notifications/read-all', { method: 'PUT' })
};

export const dashboardApi = {
  get: () => api('/dashboard')
};

export const reportApi = {
  get: () => api('/reports')
};
