import { useEffect, useState } from "react";
import { Button, Container, Form, Table, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getAirportsPaged, deleteAirport } from "../../../services/airportService.js";
import { getCitiesAll } from "../../../services/cityService.js";

export default function PageAirports() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cities, setCities] = useState([]);
  const [filters, setFilters] = useState({
    iata: "",
    name: "",
    cityId: "" // строкой из select, потом приведём к Number
  });

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    size: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const load = async (page = 0, f = filters) => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAirportsPaged({
        iata: f.iata,
        name: f.name,
        cityId: f.cityId ? Number(f.cityId) : undefined,
        page
        });

      setPageData(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки аэропортов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const all = await getCitiesAll();
        setCities(all);
      } catch (e) {
        // города нужны только для фильтра — можно не падать полностью
        console.warn("Не удалось загрузить города для фильтра", e);
      }
      await load(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    load(0);
  };

  const onReset = async () => {
    const cleared = { iata: "", name: "", cityId: "" };
    setFilters(cleared);
    await load(0, cleared);
    };

  const onDelete = async (id) => {
    if (!confirm("Удалить аэропорт?")) return;
    try {
      await deleteAirport(id);
      await load(pageData.page);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка удаления");
    }
  };

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= pageData.totalPages - 1;

  return (
    <Container className="mt-3" style={{ maxWidth: 1100 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/", { replace: true })}>
            ← Назад
          </Button>
          <h3 className="mb-0">Аэропорты</h3>
        </div>

        <Button as={Link} to="/admin/airports/create">
          + Добавить
        </Button>
      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Control
            placeholder="IATA (частичный)"
            value={filters.iata}
            onChange={(e) => setFilters((p) => ({ ...p, iata: e.target.value }))}
            style={{ maxWidth: 220 }}
          />
          <Form.Control
            placeholder="Название"
            value={filters.name}
            onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
          />

          {/* ✅ ФИЛЬТР ГОРОДА ТОЛЬКО ВЫБОР */}
          <Form.Select
            value={filters.cityId}
            onChange={(e) => setFilters((p) => ({ ...p, cityId: e.target.value }))}
            style={{ maxWidth: 280 }}
          >
            <option value="">Все города</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>

          <Button type="submit" variant="secondary">Применить</Button>
          <Button type="button" variant="outline-secondary" onClick={onReset}>Сброс</Button>
        </div>
      </Form>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {loading ? (
        <div className="py-5 text-center"><Spinner /></div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th style={{ width: 120 }}>IATA</th>
                <th>Название</th>
                <th>Город</th>
                <th style={{ width: 220 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? pageData.content.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td><b>{a.iataCode}</b></td>
                  <td>{a.name}</td>
                  <td>{a.cityName}</td>
                  <td className="d-flex gap-2">
                    <Button as={Link} to={`/admin/airports/edit/${a.id}`} size="sm" variant="outline-primary">
                      Редактировать
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => onDelete(a.id)}>
                      Удалить
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center">Ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <div>
              Страница: {pageData.page + 1} / {pageData.totalPages || 1} (всего: {pageData.totalElements})
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" disabled={prevDisabled} onClick={() => load(pageData.page - 1)}>
                Назад
              </Button>
              <Button variant="outline-secondary" disabled={nextDisabled} onClick={() => load(pageData.page + 1)}>
                Вперёд
              </Button>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
