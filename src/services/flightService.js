import { api } from "../api/axios.js";
import qs from "qs";

export async function getFlightsPaged({ flightNumber, departureAirportName, arrivalAirportName, page, size }) {
  const query = qs.stringify(
    { flightNumber: flightNumber || undefined, departureAirportName: departureAirportName || undefined, arrivalAirportName: arrivalAirportName || undefined, page, size },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/flights/paged?${query}`);
  return res.data;
}

export async function getFlightById(id) {
  const res = await api.get(`/api/v1/flights/${id}`);
  return res.data;
}

export async function createFlight(payload) {
  const res = await api.post(`/api/v1/flights`, payload);
  return res.data;
}

export async function updateFlight(id, payload) {
  const res = await api.put(`/api/v1/flights/${id}`, payload);
  return res.data;
}

export async function deleteFlight(id) {
  await api.delete(`/api/v1/flights/${id}`);
}

export async function getFlightsForTour({ tourId, flightNumber, page, size }) {
  const query = qs.stringify(
    { flightNumber: flightNumber || undefined, page, size },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/flights/for-tour/${tourId}?${query}`);
  return res.data;
}

export async function getFlightsForDeparture({ departureId, flightNumber, page, size }) {
  const query = qs.stringify(
    { flightNumber: flightNumber || undefined, page, size },
    { skipNulls: true }
  );
  const res = await api.get(`/api/v1/flights/for-departure/${departureId}?${query}`);
  return res.data;
}

export async function addDepartureToFlight(flightId, departureId) {
  const res = await api.post(`/api/v1/flights/${flightId}/departures/${departureId}`);
  return res.data;
}

export async function removeDepartureFromFlight(flightId, departureId) {
  const res = await api.delete(`/api/v1/flights/${flightId}/departures/${departureId}`);
  return res.data;
}
