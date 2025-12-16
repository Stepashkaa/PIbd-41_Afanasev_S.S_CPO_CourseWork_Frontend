import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getToursPublicPaged } from "../../../services/tourService";
import { getCitiesAll } from "../../../services/cityService";

export default function PageToursPublic() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");

  // справочник городов
  const [cities, setCities] = useState([]);

  // фильтры
  const [filters, setFilters] = useState({
    country: "",
    baseCityId: "",
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
    await load(0);
  };

  const onReset = async () => {
    const emptyFilters = { country: "", baseCityId: "" };
    setTitle("");
    setFilters(emptyFilters);
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

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Control
            style={{ minWidth: 260 }}
            placeholder="Поиск по названию"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Страна */}
          <Form.Select
            style={{ maxWidth: 220 }}
            value={filters.country}
            disabled={loadingRefs}
            onChange={(e) => onCountryChange(e.target.value)}
          >
            <option value="">Страна (все)</option>
            {countries.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </Form.Select>

          {/* Город */}
          <Form.Select
            style={{ maxWidth: 260 }}
            value={filters.baseCityId}
            disabled={loadingRefs}
            onChange={(e) => setFilters((p) => ({ ...p, baseCityId: e.target.value }))}
          >
            <option value="">Город (все)</option>
            {citiesByCountry.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.country ? ` — ${c.country}` : ""}
              </option>
            ))}
          </Form.Select>

          <Button type="submit" variant="secondary" disabled={loadingRefs}>
            Применить
          </Button>
          <Button type="button" variant="outline-secondary" onClick={onReset} disabled={loadingRefs}>
            Сброс
          </Button>
        </div>
      </Form>

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
