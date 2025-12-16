import { useEffect, useState } from "react";
import { Alert, Button, Container, Form, Spinner, Table, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getBookingsPaged, deleteBooking } from "../../../services/bookingAdminService.js";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default function PageBookingsAdmin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: "",
    tourDepartureId: "",
    createdFrom: "",
    createdTo: "",
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

      const normalizeDT = (v) => {
        if (!v) return undefined;
        // "2025-12-17T01:47" -> "2025-12-17T01:47:00"
        if (v.length === 16) return v + ":00";
        return v; // уже с секундами
      };

      const data = await getBookingsPaged({
        status: f.status || undefined,
        tourDepartureId: f.tourDepartureId ? Number(f.tourDepartureId) : undefined,
        createdFrom: normalizeDT(f.createdFrom),
        createdTo: normalizeDT(f.createdTo),
        page,
        size: 10,
      });

      setPageData(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки бронирований");
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
    const cleared = { status: "", tourDepartureId: "", createdFrom: "", createdTo: "" };
    setFilters(cleared);
    await load(0, cleared);
  };

  const onDelete = async (id) => {
    if (!confirm("Удалить бронирование?")) return;
    try {
      await deleteBooking(id);
      await load(pageData.page);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка удаления бронирования");
    }
  };

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= (pageData.totalPages || 1) - 1;

  return (
    <Container className="mt-3" style={{ maxWidth: 1200 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/", { replace: true })}>
            ← Назад
          </Button>
          <h3 className="mb-0">Бронирования</h3>
        </div>
      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">

          <Form.Select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            style={{ maxWidth: 220 }}
          >
            <option value="">Все статусы</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Form.Select>

          <Form.Control
            placeholder="ID вылета тура"
            value={filters.tourDepartureId}
            onChange={(e) => setFilters((p) => ({ ...p, tourDepartureId: e.target.value }))}
            style={{ maxWidth: 180 }}
          />

          <Form.Control
            type="datetime-local"
            value={filters.createdFrom}
            onChange={(e) => setFilters((p) => ({ ...p, createdFrom: e.target.value }))}
            style={{ maxWidth: 220 }}
          />

          <Form.Control
            type="datetime-local"
            value={filters.createdTo}
            onChange={(e) => setFilters((p) => ({ ...p, createdTo: e.target.value }))}
            style={{ maxWidth: 220 }}
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
                <th style={{ width: 90 }}>ID</th>
                <th style={{ width: 160 }}>Создано</th>
                <th style={{ width: 120 }}>Статус</th>
                <th style={{ width: 110 }}>Людей</th>
                <th style={{ width: 140 }}>Сумма</th>
                <th>Пользователь</th>
                <th style={{ width: 130 }}>Вылет</th>
                <th>Тур</th>
                <th style={{ width: 170 }}>Рейс туда</th>
                <th style={{ width: 170 }}>Рейс обратно</th>
                <th style={{ width: 260 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? pageData.content.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{String(b.createdAt || "").slice(0, 16).replace("T", " ")}</td>
                  <td><Badge bg="secondary">{b.status}</Badge></td>
                  <td>{b.personsCount}</td>
                  <td><Badge bg="secondary">{b.totalPrice}</Badge></td>
                  <td>
                    {b.userEmail ? `${b.userEmail} (#${b.userId})` : (b.userId ? `#${b.userId}` : "—")}
                  </td>
                  <td>#{b.tourDepartureId}</td>
                  <td>{b.tourTitle}</td>
                  <td>{b.outboundFlightNumber ? `${b.outboundFlightNumber} (#${b.outboundFlightId})` : "—"}</td>
                  <td>{b.returnFlightNumber ? `${b.returnFlightNumber} (#${b.returnFlightId})` : "—"}</td>
                  <td className="d-flex gap-2 flex-wrap">
                    <Button
                      as={Link}
                      to={`/admin/bookings/edit/${b.id}`}
                      size="sm"
                      variant="outline-primary"
                    >
                      Статус
                    </Button>

                    {/* если оставляешь удаление */}
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => onDelete(b.id)}
                    >
                      Удалить
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={11} className="text-center">Ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <div className="small">
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
