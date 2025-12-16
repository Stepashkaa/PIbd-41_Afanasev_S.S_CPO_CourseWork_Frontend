import { api } from "../api/axios.js";
import qs from "qs";

export async function getCitiesPaged({ name, country, page, size }) {
  const query = qs.stringify(
    { name: name || undefined, country: country || undefined, page, size },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/cities/paged?${query}`);
  return res.data;
}

export async function searchCitiesFree({ q, page, size }) {
  const query = qs.stringify(
    { q: q || undefined, page, size },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/cities/search-free?${query}`);
  return res.data;
}

export async function getCityById(id) {
  const res = await api.get(`/api/v1/cities/${id}`);
  return res.data;
}

export async function createCity(payload) {
  const res = await api.post(`/api/v1/cities`, payload);
  return res.data;
}

export async function updateCity(id, payload) {
  const res = await api.put(`/api/v1/cities/${id}`, payload);
  return res.data;
}

export async function deleteCity(id) {
  await api.delete(`/api/v1/cities/${id}`);
}

// ✅ ДОБАВЬ ЭТО
export async function getCitiesAll() {
  const res = await api.get(`/api/v1/cities`);
  return res.data; // массив городов
}
