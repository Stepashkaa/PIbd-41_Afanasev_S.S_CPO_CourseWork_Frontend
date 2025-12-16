import { useEffect, useState } from "react";
import {
  Button,
  Container,
  Form,
  Table,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { getMyBookingsPaged, cancelMyBooking } from "../../../services/bookingService";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"];

export default function PageMyBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState("");

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const load = async (page = 0, s = status) => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyBookingsPaged({
        status: s,
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
    // eslint-disable-next-line
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    load(0);
  };

  const onReset = async () => {
    setStatus("");
    await load(0, "");
  };

  const onDelete = async (id) => {
    if (!confirm("Отменить бронирование?")) return;
    try {
      await cancelMyBooking(id);
      await load(pageData.page);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка отмены бронирования");
    }
  };

  return (
    <Container className="mt-3" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Мои бронирования</h3>
        <Button as={Link} to="/tours" variant="outline-secondary">
          ← К турам
        </Button>
      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 align-items-center">
          <Form.Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="">Все статусы</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Form.Select>

          <Button type="submit" variant="secondary">
            Применить
          </Button>
          <Button type="button" variant="outline-secondary" onClick={onReset}>
            Сброс
          </Button>
        </div>
      </Form>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {loading ? (
        <div className="py-5 text-center"><Spinner /></div>
      ) : (
        <>
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Тур</th>
                <th>Вылет</th>
                <th>Рейсы</th>
                <th>Людей</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? (
                pageData.content.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.tourTitle}</td>
                    <td>#{b.tourDepartureId}</td>
                    <td>
                      <div>Туда: {b.outboundFlightNumber}</div>
                      {b.returnFlightNumber && (
                        <div>Обратно: {b.returnFlightNumber}</div>
                      )}
                    </td>
                    <td>{b.personsCount}</td>
                    <td><Badge bg="secondary">{b.totalPrice}</Badge></td>
                    <td><Badge bg="info">{b.status}</Badge></td>
                    <td>
                      {b.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => onDelete(b.id)}
                        >
                          Отменить
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center">
                    Бронирования не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <div>
              Страница: {pageData.page + 1} / {pageData.totalPages || 1}
              (всего: {pageData.totalElements})
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                disabled={pageData.page <= 0}
                onClick={() => load(pageData.page - 1)}
              >
                Назад
              </Button>
              <Button
                variant="outline-secondary"
                disabled={pageData.page >= pageData.totalPages - 1}
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
