import { api } from "../api/axios.js";
import qs from "qs";

export async function getAirportsPaged({ iata, name, cityId, page, size }) {
  const query = qs.stringify(
    { iata: iata || undefined, name: name || undefined, cityId: cityId || undefined, page, size },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/airports/paged?${query}`);
  return res.data;
}

export async function getAirportById(id) {
  const res = await api.get(`/api/v1/airports/${id}`);
  return res.data;
}

export async function createAirport(payload) {
  const res = await api.post(`/api/v1/airports`, payload);
  return res.data;
}

export async function updateAirport(id, payload) {
  const res = await api.put(`/api/v1/airports/${id}`, payload);
  return res.data;
}

export async function deleteAirport(id) {
  await api.delete(`/api/v1/airports/${id}`);
}
