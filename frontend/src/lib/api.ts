import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refresh,
        });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: any) => api.post("/auth/register", data),
  login: (data: any) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const usersApi = {
  updateProfile: (data: any) => api.patch("/users/me", data),
};

export const projectsApi = {
  list: () => api.get("/projects/"),
  create: (data: any) => api.post("/projects/", data),
  get: (id: number) => api.get(`/projects/${id}`),
  update: (id: number, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

export const providersApi = {
  available: () => api.get("/providers/available"),
  list: () => api.get("/providers/"),
  add: (data: any) => api.post("/providers/", data),
  setDefault: (id: number) => api.patch(`/providers/${id}/set-default`),
  delete: (id: number) => api.delete(`/providers/${id}`),
  validate: (id: number) => api.post(`/providers/${id}/validate`),
};

export const datasetsApi = {
  upload: (formData: FormData) =>
    api.post("/datasets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (projectId?: number) =>
    api.get("/datasets/", {
      params: projectId ? { project_id: projectId } : {},
    }),
  get: (id: number) => api.get(`/datasets/${id}`),
  delete: (id: number) => api.delete(`/datasets/${id}`),
};

export const aiApi = {
  features: (data: any) => api.post("/ai/features", data),
  hyperparams: (data: any) => api.post("/ai/hyperparams", data),
  chat: (data: any) => api.post("/ai/chat", data),
  recommendModel: (data: any) => api.post("/ai/recommend-model", data),
  history: (datasetId: number) => api.get(`/ai/history/${datasetId}`),
  validateProvider: (id: number) => api.post(`/ai/validate-provider/${id}`),
};

export const vizApi = {
  overview: (id: number) => api.get(`/visualizations/${id}/overview`),
  distribution: (id: number, col: string) =>
    api.get(`/visualizations/${id}/distribution/${col}`),
  bar: (id: number, col: string) => api.get(`/visualizations/${id}/bar/${col}`),
  correlation: (id: number) => api.get(`/visualizations/${id}/correlation`),
  missing: (id: number) => api.get(`/visualizations/${id}/missing-values`),
  scatter: (id: number, x: string, y: string) =>
    api.get(`/visualizations/${id}/scatter`, { params: { x, y } }),
  boxplot: (id: number, col: string) =>
    api.get(`/visualizations/${id}/boxplot/${col}`),
  columns: (id: number) => api.get(`/visualizations/${id}/columns`),
};

export const activityApi = {
  getActivities:      (limit = 20) => api.get(`/me/activities?limit=${limit}`),
  getNotifications:   () => api.get("/me/notifications"),
  getUnreadCount:     () => api.get("/me/notifications/unread-count"),
  markRead:           (ids?: number[]) => api.post("/me/notifications/mark-read", { ids }),
  deleteNotification: (id: number) => api.delete(`/me/notifications/${id}`),
  clearAll:           () => api.delete("/me/notifications"),
}

export const cleaningApi = {
  suggestions: (id: number) =>
    api.get(`/datasets/clean/${id}/suggestions`),
  preview: (id: number, operations: any[]) =>
    api.post(`/datasets/clean/${id}/preview`, { operations }),
  apply: (id: number, operations: any[], new_name?: string) =>
    api.post(`/datasets/clean/${id}/apply`, { operations, save_as_new: true, new_name }),
  download: (id: number, operations: any[]) =>
    api.post(`/datasets/clean/${id}/download`, { operations }, { responseType: "blob" }),
}

export const reportApi = {
  generate: (datasetId: number) =>
    api.post(`/pipeline/report/${datasetId}`),
  download: (datasetId: number) =>
    api.post(`/pipeline/report/${datasetId}/download`, {}, { responseType: "blob" }),
}

export const transformApi = {
  preview: (datasetId: number, transformations: any[]) =>
    api.post(`/pipeline/transform/${datasetId}/preview`, { transformations }),
  apply: (datasetId: number, transformations: any[], new_name?: string) =>
    api.post(`/pipeline/transform/${datasetId}/apply`, { transformations, save_as_new: true, new_name }),
  download: (datasetId: number, transformations: any[]) =>
    api.post(`/pipeline/transform/${datasetId}/download`, { transformations }, { responseType: "blob" }),
}

export const mergeApi = {
  suggestions: (datasetId: number, rightId: number) =>
    api.get(`/pipeline/merge/${datasetId}/suggestions?right_id=${rightId}`),
  preview: (datasetId: number, payload: any) =>
    api.post(`/pipeline/merge/${datasetId}/preview`, payload),
  apply: (datasetId: number, payload: any) =>
    api.post(`/pipeline/merge/${datasetId}/apply`, payload),
}

export const schemaApi = {
  validate: (datasetId: number, rules: any[]) =>
    api.post(`/pipeline/schema/${datasetId}/validate`, { rules }),
  save: (datasetId: number, rules: any[], schema_name?: string) =>
    api.post(`/pipeline/schema/${datasetId}/save`, { rules, schema_name }),
  listSaved: () => api.get(`/pipeline/schema/saved`),
}

export const templatesApi = {
  list: () => api.get("/pipeline-templates/"),
  create: (data: any) => api.post("/pipeline-templates/", data),
  get: (id: number) => api.get(`/pipeline-templates/${id}`),
  update: (id: number, data: any) => api.patch(`/pipeline-templates/${id}`, data),
  delete: (id: number) => api.delete(`/pipeline-templates/${id}`),
}
