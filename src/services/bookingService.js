import { api } from "../api/axios.js";
import qs from "qs";

export async function getMyBookingsPaged({ status, page, size }) {
  const query = qs.stringify(
    {
      status: status || undefined,
      page,
      size,
    },
    { skipNulls: true }
  );

  const res = await api.get(`/api/v1/bookings/my/paged?${query}`);
  return res.data;
}

export async function deleteBooking(id) {
  await api.delete(`/api/v1/bookings/${id}`);
}

export async function createBooking(payload) {
  const res = await api.post("/api/v1/bookings", payload);
  return res.data;
}

export async function cancelMyBooking(id) {
  const res = await api.patch(`/api/v1/bookings/my/${id}/cancel`);
  return res.data;
}