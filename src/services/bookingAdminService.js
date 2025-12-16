import { api } from "../api/axios.js";
import qs from "qs";

// список с фильтрами (для админа)
export async function getBookingsPaged({ userId, tourDepartureId, status, createdFrom, createdTo, page, size }) {
  const query = qs.stringify(
    {
      userId: userId ?? undefined,
      tourDepartureId: tourDepartureId ?? undefined,
      status: status ?? undefined,
      createdFrom: createdFrom ?? undefined,
      createdTo: createdTo ?? undefined,
      page,
      size,
    },
    { skipNulls: true }
  );

  const res = await api.get(`/api/v1/bookings/paged?${query}`);
  return res.data;
}

export async function getBookingById(id) {
  const res = await api.get(`/api/v1/bookings/${id}`);
  return res.data;
}

// PATCH status
export async function updateBookingStatus(id, status) {
  const res = await api.patch(`/api/v1/bookings/${id}/status`, { status });
  return res.data;
}

// опционально: удаление (если оставишь)
export async function deleteBooking(id) {
  await api.delete(`/api/v1/bookings/${id}`);
}
