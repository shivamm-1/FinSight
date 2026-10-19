import api from "./api";

export async function registerAccount(data) {
  const response = await api.post("/api/auth/register", data);
  return response.data;
}

export async function loginAccount(credentials) {
  const response = await api.post("/api/auth/login", credentials);
  return response.data;
}
