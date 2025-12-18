import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getToursPublicPaged } from "../../../services/tourService";
import { getCitiesAll } from "../../../services/cityService";
import { createUserSearch } from "../../../services/userSearchService";

export default function PageToursPublic() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [error, setError] = useState(null);
   const [submittingReco, setSubmittingReco] = useState(false);

  const [title, setTitle] = useState("");

  // справочник городов
  const [cities, setCities] = useState([]);

  // фильтры
  const [filters, setFilters] = useState({
    country: "",
    baseCityId: "",
  });

  const [recFilters, setRecFilters] = useState({
    destinationCityId: "",
    dateFrom: "",
    dateTo: "",
    personsCount: 1,
    budgetMin: "",
    budgetMax: "",
  });

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    size: 0,
    totalPages: 0,
    totalElements: 0,
  });


  // уникальные страны из списка городов
  const countries = useMemo(() => {
    const set = new Set();
    (cities || []).forEach((c) => {
      if (c?.country) set.add(c.country);
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  }, [cities]);

  // города, отфильтрованные по стране (если выбрана)
  const citiesByCountry = useMemo(() => {
    if (!filters.country) return cities;
    return (cities || []).filter((c) => c.country === filters.country);
  }, [cities, filters.country]);

  const load = async (page = 0, override = {}) => {
    try {
      setLoading(true);
      setError(null);

      const titleVal = override.title ?? title;
      const filtersVal = override.filters ?? filters;

      const data = await getToursPublicPaged({
        title: titleVal || undefined,
        baseCityId: filtersVal.baseCityId ? Number(filtersVal.baseCityId) : undefined,
        page,
      });

      setPageData(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки туров");
    } finally {
      setLoading(false);
    }
  };

  // загрузка справочника городов + первая загрузка туров
  useEffect(() => {
    (async () => {
      try {
        setLoadingRefs(true);
        const c = await getCitiesAll();
        setCities(c || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки городов");
      } finally {
        setLoadingRefs(false);
        await load(0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    // 🔍 логируем SEARCH
    /*try {
      await createUserSearch({
        action: "SEARCH",
        title: title || null,
        country: filters.country || null,
        baseCityId: filters.baseCityId
          ? Number(filters.baseCityId)
          : null,
        tourId: null,
        tourDepartureId: null,
      });
    } catch (e) {setError(e?.response?.data?.message || "Ошибка поиска");}*/

    await load(0);
  };

  const onReset = async () => {
    const emptyFilters = { country: "", baseCityId: "" };
    setTitle("");
    setFilters(emptyFilters);
    /*try {
      await createUserSearch({
        action: "SEARCH",
        title: null,
        country: null,
        baseCityId: null,
        tourId: null,
        tourDepartureId: null,
      });
    } catch (e) {setError(e?.response?.data?.message || "Ошибка поиска");}*/
    await load(0, { title: "", filters: emptyFilters });
  };

  const onCountryChange = (value) => {
    // при смене страны сбрасываем выбранный город,
    // чтобы не осталось "старое baseCityId" из другой страны
    setFilters((p) => ({ ...p, country: value, baseCityId: "" }));
  };

  const onBook = (tourId) => {
    navigate(`/tours/${tourId}/book`);
  };

  const validateRecoFilters = () => {
    const persons = Number(recFilters.personsCount || 1);
    if (persons < 1) return "Количество людей должно быть >= 1";

    if (recFilters.dateFrom && recFilters.dateTo) {
      if (String(recFilters.dateFrom) > String(recFilters.dateTo)) {
        return "dateFrom не может быть позже dateTo";
      }
    }

    const min = recFilters.budgetMin !== "" ? Number(recFilters.budgetMin) : null;
    const max = recFilters.budgetMax !== "" ? Number(recFilters.budgetMax) : null;
    if (min != null && Number.isNaN(min)) return "budgetMin должен быть числом";
    if (max != null && Number.isNaN(max)) return "budgetMax должен быть числом";
    if (min != null && max != null && min > max) return "budgetMin не может быть больше budgetMax";

    return null;
  };

  const onRecommend = async () => {
    const err = validateRecoFilters();
    if (err) {
      setError(err);
      return;
    }

    try {
      setSubmittingReco(true);
      setError(null);

      const payload = {
        //title: title || null,
        destinationCityId: recFilters.destinationCityId ? Number(recFilters.destinationCityId) : null,
        dateFrom: recFilters.dateFrom || null,  // ожидается ISO yyyy-MM-dd
        dateTo: recFilters.dateTo || null,      // ожидается ISO yyyy-MM-dd
        personsCount: Number(recFilters.personsCount || 1),
        budgetMin: recFilters.budgetMin !== "" ? Number(recFilters.budgetMin) : null,
        budgetMax: recFilters.budgetMax !== "" ? Number(recFilters.budgetMax) : null,
        preferencesJson: null,
      };

      const res = await createUserSearch(payload); // { id }
      navigate(`/recommendations?searchId=${res.id}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка подбора рекомендаций");
    } finally {
      setSubmittingReco(false);
    }
  };

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= pageData.totalPages - 1;

  return (
    <Container className="mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/", { replace: true })}>
            ← Назад
          </Button>
          <h3 className="mb-0">Доступные туры</h3>
        </div>
      </div>

      {/* Фильтры витрины */}
      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Control
            style={{ minWidth: 260 }}
            placeholder="Поиск по названию"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Form.Select
            style={{ maxWidth: 220 }}
            value={filters.country}
            disabled={loadingRefs || submittingReco}
            onChange={(e) => onCountryChange(e.target.value)}
          >
            <option value="">Страна (все)</option>
            {countries.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </Form.Select>

          <Form.Select
            style={{ maxWidth: 260 }}
            value={filters.baseCityId}
            disabled={loadingRefs || submittingReco}
            onChange={(e) => setFilters((p) => ({ ...p, baseCityId: e.target.value }))}
          >
            <option value="">Город (все)</option>
            {citiesByCountry.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.country ? ` — ${c.country}` : ""}
              </option>
            ))}
          </Form.Select>

          <Button type="submit" variant="secondary" disabled={loadingRefs || submittingReco}>
            Применить
          </Button>
          <Button type="button" variant="outline-secondary" onClick={onReset} disabled={loadingRefs || submittingReco}>
            Сброс
          </Button>
        </div>
      </Form>

      {/* Параметры рекомендаций */}
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex flex-wrap gap-2 align-items-end">
            <div style={{ minWidth: 260 }}>
              <Form.Label className="small text-muted">Куда (город назначения)</Form.Label>
              <Form.Select
                value={recFilters.destinationCityId}
                disabled={loadingRefs || submittingReco}
                onChange={(e) => setRecFilters((p) => ({ ...p, destinationCityId: e.target.value }))}
              >
                <option value="">Любой</option>
                {(cities || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.country ? ` — ${c.country}` : ""}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div style={{ width: 180 }}>
              <Form.Label className="small text-muted">Дата от</Form.Label>
              <Form.Control
                type="date"
                value={recFilters.dateFrom}
                disabled={submittingReco}
                onChange={(e) => setRecFilters((p) => ({ ...p, dateFrom: e.target.value }))}
              />
            </div>

            <div style={{ width: 180 }}>
              <Form.Label className="small text-muted">Дата до</Form.Label>
              <Form.Control
                type="date"
                value={recFilters.dateTo}
                disabled={submittingReco}
                onChange={(e) => setRecFilters((p) => ({ ...p, dateTo: e.target.value }))}
              />
            </div>

            <div style={{ width: 140 }}>
              <Form.Label className="small text-muted">Людей</Form.Label>
              <Form.Control
                type="number"
                min={1}
                value={recFilters.personsCount}
                disabled={submittingReco}
                onChange={(e) => setRecFilters((p) => ({ ...p, personsCount: Number(e.target.value) || 1 }))}
              />
            </div>

            <div style={{ width: 180 }}>
              <Form.Label className="small text-muted">Бюджет min (общий)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={recFilters.budgetMin}
                disabled={submittingReco}
                onChange={(e) => setRecFilters((p) => ({ ...p, budgetMin: e.target.value }))}
              />
            </div>

            <div style={{ width: 180 }}>
              <Form.Label className="small text-muted">Бюджет max (общий)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={recFilters.budgetMax}
                disabled={submittingReco}
                onChange={(e) => setRecFilters((p) => ({ ...p, budgetMax: e.target.value }))}
              />
            </div>

            <Button variant="primary" onClick={onRecommend} disabled={loadingRefs || submittingReco}>
              {submittingReco ? "Подбор..." : "Подобрать"}
            </Button>
          </div>

          <div className="small text-muted mt-2">
            Подбор создаст searchId и откроет страницу рекомендаций.
          </div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {loading ? (
        <div className="py-5 text-center">
          <Spinner />
        </div>
      ) : (
        <>
          {pageData.content?.length ? (
            <Row className="g-3">
              {pageData.content.map((t) => (
                <Col key={t.id} xs={12} md={6} lg={4}>
                  <Card className="h-100">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="mb-2">{t.title}</Card.Title>

                      {t.description ? (
                        <Card.Text className="text-muted small">{t.description}</Card.Text>
                      ) : (
                        <Card.Text className="text-muted small">Описание отсутствует</Card.Text>
                      )}

                      <div className="mt-2 small">
                        <div><b>Город:</b> {t.baseCityName}</div>
                        <div><b>Дней:</b> {t.durationDays}</div>
                        <div><b>Цена:</b> {t.basePrice}</div>
                      </div>

                      <div className="mt-auto pt-3">
                        <Button onClick={() => onBook(t.id)} className="w-100">
                          Забронировать
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="light" className="text-center">
              Ничего не найдено
            </Alert>
          )}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              Страница: {pageData.page + 1} / {pageData.totalPages || 1} (всего: {pageData.totalElements})
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                disabled={prevDisabled}
                onClick={() => load(pageData.page - 1)}
              >
                Назад
              </Button>
              <Button
                variant="outline-secondary"
                disabled={nextDisabled}
                onClick={() => load(pageData.page + 1)}
              >
                Вперёд
              </Button>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
