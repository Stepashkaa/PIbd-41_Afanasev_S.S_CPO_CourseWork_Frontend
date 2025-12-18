import { api } from "../api/axios";

export async function getMyRecommendationsPaged({ searchId, page = 0, size = 12 }) {
  const res = await api.get("/api/v1/recommendations/my/paged", {
    params: { searchId, page, size },
  });
  return res.data;
}

export async function markRecommendationSelected(recommendationId) {
  await api.patch(`/api/v1/recommendations/${recommendationId}/select`);
}
