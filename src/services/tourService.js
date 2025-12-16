import { api } from "../api/axios.js";
import qs from "qs";

export async function getToursPaged({
  title,
  baseCityId,
  status,
  active,
  managerUserId,
  page,
  size,
}) {
  const query = qs.stringify(
    {
      title: title || undefined,
      baseCityId: baseCityId || undefined,
      status: status || undefined,
      active: active ?? undefined,
      managerUserId: managerUserId || undefined,
      page,
      size,
    },
    { skipNulls: true }
  );

  const res = await api.get(`/api/v1/tours/paged?${query}`);
  return res.data;
}

export async function getTourById(id) {
  const res = await api.get(`/api/v1/tours/${id}`);
  return res.data;
}

export async function createTour(payload) {
  const res = await api.post(`/api/v1/tours`, payload);
  return res.data;
}

export async function updateTour(id, payload) {
  const res = await api.put(`/api/v1/tours/${id}`, payload);
  return res.data;
}

export async function deleteTour(id) {
  await api.delete(`/api/v1/tours/${id}`);
}


export async function getToursPublicPaged({ title, baseCityId, page, size }) {
  const query = qs.stringify(
    { title: title || undefined, baseCityId: baseCityId || undefined, page, size },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/tours/public/paged?${query}`);
  return res.data;
}

export async function getMyToursPaged({ title, baseCityId, status, active, page, size }) {
  const query = qs.stringify(
    {
      title: title || undefined,
      baseCityId: baseCityId || undefined,
      status: status || undefined,
      active: active ?? undefined,
      page,
      size,
    },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/tours/my/paged?${query}`);
  return res.data;
}

export async function getTourPublicById(id) {
  const res = await api.get(`/api/v1/tours/${id}`);
  return res.data;
}
