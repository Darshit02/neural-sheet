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
