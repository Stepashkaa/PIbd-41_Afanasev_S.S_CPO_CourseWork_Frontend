import { api } from "../api/axios.js";
import qs from "qs";

// q — общий поиск (username/email/phone) на беке
export async function getUsersPaged({ q, role, active, page = 0, size }) {
  const query = qs.stringify(
    {
      q: q || undefined,
      role: role || undefined,
      active: active ?? undefined,
      page,
      size,
    },
    { skipNulls: true }
  );

  const res = await api.get(`/api/v1/users/paged?${query}`);
  return res.data;
}

export async function getUserById(id) {
  const res = await api.get(`/api/v1/users/${id}`);
  return res.data;
}

export async function createUser(payload) {
  const res = await api.post(`/api/v1/users`, payload);
  return res.data;
}

export async function updateUser(id, payload) {
  const res = await api.put(`/api/v1/users/${id}`, payload);
  return res.data;
}

export async function deleteUser(id) {
  await api.delete(`/api/v1/users/${id}`);
}

export async function getUsersAll() {
  const res = await api.get("/api/v1/users");
  return res.data;
}