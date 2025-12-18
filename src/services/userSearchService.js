import { api } from "../api/axios";


export async function createUserSearch(payload) {
  const res = await api.post("/api/v1/user-searches", payload);
  return res.data; // { id }
}