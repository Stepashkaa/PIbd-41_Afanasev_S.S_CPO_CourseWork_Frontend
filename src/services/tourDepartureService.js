import { api } from "../api/axios.js";
import qs from "qs";

export async function getTourDeparturesPaged({ tourId, status, startFrom, startTo, page, size }) {
  const query = qs.stringify(
    {
      tourId: tourId || undefined,
      status: status || undefined,
      startFrom: startFrom || undefined,
      startTo: startTo || undefined,
      page,
      size,
    },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/tour-departures/paged?${query}`);
  return res.data;
}

// ✅ ДЛЯ МЕНЕДЖЕРА: только свои вылеты
export async function getMyTourDeparturesPaged({ tourId, status, startFrom, startTo, page, size }) {
  const query = qs.stringify(
    {
      tourId: tourId || undefined,
      status: status || undefined,
      startFrom: startFrom || undefined,
      startTo: startTo || undefined,
      page,
      size,
    },
    { skipNulls: true }
  );

  // важное: на бэке /my/paged берёт email из SecurityContext
  const res = await api.get(`/api/v1/tour-departures/my/paged?${query}`);
  return res.data;
}

export async function getTourDeparturesByTour({ tourId, page, size }) {
  const query = qs.stringify({ tourId, page, size }, { skipNulls: true });
  const res = await api.get(`/api/v1/tour-departures/search/by-tour?${query}`);
  return res.data;
}

export async function getTourDepartureById(id) {
  const res = await api.get(`/api/v1/tour-departures/${id}`);
  return res.data;
}

export async function createTourDeparture(payload) {
  const res = await api.post(`/api/v1/tour-departures`, payload);
  return res.data;
}

export async function updateTourDeparture(id, payload) {
  const res = await api.put(`/api/v1/tour-departures/${id}`, payload);
  return res.data;
}

export async function deleteTourDeparture(id) {
  await api.delete(`/api/v1/tour-departures/${id}`);
}
