import api from "./Api";

export async function getFinancialData() {
  const response = await api.get("/api/financial-data");

  return response.data;
}

export async function createFinancialData(data) {
  const response = await api.post("/api/financial-data", data);

  return response.data;
}

export async function updateFinancialData(id, data) {
  const response = await api.put(`/api/financial-data/${id}`, data);

  return response.data;
}

export async function deleteFinancialData(id) {
  const response = await api.delete(`/api/financial-data/${id}`);

  return response.data;
}
