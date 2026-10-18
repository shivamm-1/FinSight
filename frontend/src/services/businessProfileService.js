import api from "./api";

export async function getBusinessProfile() {
  const response = await api.get("/api/business-profile");
  return response.data;
}

export async function createBusinessProfile(data) {
  const response = await api.post("/api/business-profile", data);
  return response.data;
}

export async function updateBusinessProfile(id, data) {
  const response = await api.put(`/api/business-profile/${id}`, data);
  return response.data;
}
