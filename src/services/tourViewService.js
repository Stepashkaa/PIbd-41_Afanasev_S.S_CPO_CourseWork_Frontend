import { api } from "../api/axios";


export async function addTourView(tourId) {
  await api.post(`/api/v1/tour-views/${tourId}`);
}