const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("foodtalent_token");
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  return response.json();
}

export async function login(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Error al iniciar sesión");
  }

  const data = await response.json();
  localStorage.setItem("foodtalent_token", data.access_token);
  return data;
}

export async function register(
  email: string,
  password: string,
  role: string = "profesional",
  full_name: string = ""
) {
  const data: any = { email, password, role };
  if (full_name) data.full_name = full_name;
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginAndStore(email: string, password: string) {
  return login(email, password).then((data) => {
    localStorage.setItem("foodtalent_token", data.access_token);
    if (data.role) localStorage.setItem("foodtalent_role", data.role);
    return data;
  });
}

export async function searchProfessionals(
  query: string,
  category?: string
) {
  return apiRequest("/api/search", {
    method: "POST",
    body: JSON.stringify({ query, category, max_results: 5 }),
  });
}

export async function getProfessionalProfile(id: number) {
  return apiRequest(`/api/professionals/${id}`);
}

export async function getMyProfessionalProfile() {
  return apiRequest("/api/professionals/me");
}

export async function createProfessionalProfile(data: any) {
  return apiRequest("/api/professionals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProfessionalProfile(id: number, data: any) {
  return apiRequest(`/api/professionals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}


