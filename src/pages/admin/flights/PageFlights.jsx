import { useEffect, useState } from "react";
import { Button, Container, Form, Table, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { deleteFlight, getFlightsPaged } from "../../../services/flightService.js";

export default function PageFlights() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    flightNumber: "",
    departureAirportName: "",
    arrivalAirportName: "",
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

      const data = await getFlightsPaged({
        flightNumber: f.flightNumber,
        departureAirportName: f.departureAirportName,
        arrivalAirportName: f.arrivalAirportName,
        page,
      });

      setPageData(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки рейсов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    load(0);
  };

  const onReset = async () => {
    const cleared = { flightNumber: "", departureAirportName: "", arrivalAirportName: "" };
    setFilters(cleared);
    await load(0, cleared);
  };

  const onDelete = async (id) => {
    if (!confirm("Удалить рейс?")) return;
    try {
      await deleteFlight(id);
      await load(pageData.page);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка удаления");
    }
  };

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= pageData.totalPages - 1;

  return (
    <Container className="mt-3" style={{ maxWidth: 1200 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/", { replace: true })}>
            ← Назад
          </Button>
          <h3 className="mb-0">Рейсы</h3>
        </div>

        <Button as={Link} to="/admin/flights/create">+ Добавить</Button>
      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Control
            placeholder="Номер рейса"
            value={filters.flightNumber}
            onChange={(e) => setFilters((p) => ({ ...p, flightNumber: e.target.value }))}
            style={{ maxWidth: 220 }}
          />
          <Form.Control
            placeholder="Аэропорт вылета (частично)"
            value={filters.departureAirportName}
            onChange={(e) => setFilters((p) => ({ ...p, departureAirportName: e.target.value }))}
            style={{ maxWidth: 280 }}
          />
          <Form.Control
            placeholder="Аэропорт прилёта (частично)"
            value={filters.arrivalAirportName}
            onChange={(e) => setFilters((p) => ({ ...p, arrivalAirportName: e.target.value }))}
            style={{ maxWidth: 280 }}
          />

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
                <th style={{ width: 80 }}>ID</th>
                <th style={{ width: 120 }}>Номер</th>
                <th>Авиакомпания</th>
                <th>Вылет</th>
                <th>Прилёт</th>
                <th>Из</th>
                <th>В</th>
                <th style={{ width: 120 }}>Цена</th>
                <th style={{ width: 220 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? pageData.content.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td><b>{f.flightNumber}</b></td>
                  <td>{f.carrier}</td>
                  <td>{String(f.departAt).replace("T", " ")}</td>
                  <td>{String(f.arriveAt).replace("T", " ")}</td>
                  <td>{f.departureAirportName}</td>
                  <td>{f.arrivalAirportName}</td>
                  <td>{f.basePrice}</td>
                  <td className="d-flex gap-2">
                    <Button as={Link} to={`/admin/flights/edit/${f.id}`} size="sm" variant="outline-primary">
                      Редактировать
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => onDelete(f.id)}>
                      Удалить
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="text-center">Ничего не найдено</td>
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
