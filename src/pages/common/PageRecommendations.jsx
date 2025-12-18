import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getMyRecommendationsPaged,
  markRecommendationSelected,
} from "../../services/recommendationService";

export default function PageRecommendations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const searchId = searchParams.get("searchId"); // optional
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    size: 12,
    totalPages: 0,
    totalElements: 0,
  });

  const PAGE_SIZE = 12;

  const load = async (pageToLoad = 0) => {
    try {
      setLoading(true);
      setError(null);

      if (!searchId) {
        setPageData({ content: [], page: 0, size: PAGE_SIZE, totalPages: 0, totalElements: 0 });
        return;
        }

      // Пока эндпоинт один: /my/paged (без searchId).
      // Если позже добавишь /my/paged?searchId=... — просто прокинем параметр.
      const data = await getMyRecommendationsPaged({
        searchId: Number(searchId),
        page: pageToLoad,
        size: PAGE_SIZE,
        // searchId: searchId ? Number(searchId) : undefined, // на будущее
      });

      setPageData(data || {});
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки рекомендаций");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchId]);

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= (pageData.totalPages || 1) - 1;

  const hasContent = (pageData.content || []).length > 0;

  const headerText = useMemo(() => {
    if (searchId) return `🎯 Рекомендации по вашему запросу #${searchId}`;
    return "🎯 Мои рекомендации";
  }, [searchId]);

  const formatMoney = (v) => {
    if (v === null || v === undefined) return "—";
    const num = Number(v);
    if (Number.isNaN(num)) return String(v);
    return num.toLocaleString();
  };

  const formatPercent = (score) => {
    if (score === null || score === undefined) return "—";
    const s = Number(score);
    if (Number.isNaN(s)) return "—";
    return `${(s * 100).toFixed(1)}%`;
  };

  const calcFreeSeats = (rec) => {
    const total = Number(rec?.capacityTotal);
    const reserved = Number(rec?.capacityReserved);
    if (Number.isNaN(total) || Number.isNaN(reserved)) return null;
    return Math.max(0, total - reserved);
  };

  const handleBook = async (rec) => {
    try {
      if (!rec?.tourId) return;

      if (rec?.recommendationId) {
        setSubmittingId(rec.recommendationId);
        await markRecommendationSelected(rec.recommendationId);
      }

      navigate(`/tours/${rec.tourId}/book`);
    } catch (e) {
      setError(e?.response?.data?.message || "Не удалось перейти к бронированию");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
        <div>
          <h3 className="mb-0">{headerText}</h3>
          <div className="text-muted small">
            {pageData.totalElements ? `Всего: ${pageData.totalElements}` : " "}
          </div>
        </div>

        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/tours")} disabled={submittingId != null}>
            ← К турам
          </Button>
          <Button variant="outline-secondary" onClick={() => load(pageData.page || 0)} disabled={submittingId != null}>
            Обновить
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {!error && !hasContent && (
        <Alert variant="info">
          Пока нет рекомендаций.
          <div className="mt-1">
            Перейди на страницу туров и нажми <b>«Подобрать»</b>, чтобы сформировать рекомендации.
          </div>
        </Alert>
      )}

      <Row className="g-3">
        {(pageData.content || []).map((rec) => {
          const freeSeats = calcFreeSeats(rec);
          const disabled = submittingId != null && submittingId !== rec.recommendationId;

          return (
            <Col key={rec.recommendationId ?? `${rec.tourId}-${rec.tourDepartureId}`} xs={12} md={6} lg={4}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <Card.Title className="mb-1">{rec.title}</Card.Title>
                      <div className="text-muted small">{rec.baseCityName}</div>
                    </div>

                    <Badge bg="success" className="ms-auto">
                      {formatPercent(rec.score)}
                    </Badge>
                  </div>

                  <div className="mt-2">
                    {rec.description ? (
                      <div className="text-muted small">{rec.description}</div>
                    ) : (
                      <div className="text-muted small">Описание отсутствует</div>
                    )}
                  </div>

                  <div className="mt-3 d-flex flex-wrap gap-2">
                    {rec.durationDays != null && (
                      <Badge bg="secondary">{rec.durationDays} дн.</Badge>
                    )}
                    {rec.startDate && rec.endDate && (
                      <Badge bg="info">
                        {rec.startDate} – {rec.endDate}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-3 small">
                    <div>
                      <b>Цена за 1 чел:</b> {formatMoney(rec.pricePerPerson)} ₽
                    </div>
                    {freeSeats != null && (
                      <div>
                        <b>Свободно мест:</b> {freeSeats} / {rec.capacityTotal}
                      </div>
                    )}
                    {rec.tourDepartureId != null && (
                      <div className="text-muted">
                        Вылет: #{rec.tourDepartureId}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-3">
                    <Button
                      variant="primary"
                      className="w-100"
                      disabled={disabled || submittingId === rec.recommendationId}
                      onClick={() => handleBook(rec)}
                    >
                      {submittingId === rec.recommendationId ? "Открываю..." : "Забронировать"}
                    </Button>

                    {rec.recommendationId != null && (
                      <div className="text-muted small mt-2 text-center">
                        recId: {rec.recommendationId}
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {pageData.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4 gap-2">
          <Button
            variant="outline-secondary"
            disabled={prevDisabled || submittingId != null}
            onClick={() => load((pageData.page || 0) - 1)}
          >
            ← Назад
          </Button>

          <span className="align-self-center">
            Стр. {(pageData.page || 0) + 1} из {pageData.totalPages}
          </span>

          <Button
            variant="outline-secondary"
            disabled={nextDisabled || submittingId != null}
            onClick={() => load((pageData.page || 0) + 1)}
          >
            Вперёд →
          </Button>
        </div>
      )}
    </Container>
  );
}
