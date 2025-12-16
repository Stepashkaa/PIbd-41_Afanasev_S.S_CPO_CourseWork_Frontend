import { useEffect, useState } from "react";
import { Alert, Button, Container, Form, Spinner, Card, Badge } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBookingById, updateBookingStatus } from "../../../services/bookingAdminService.js";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default function EditBookingStatusAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);

  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const b = await getBookingById(id);
        setBooking(b);
        setStatus(b.status || "");
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки бронирования");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!status) return;

    try {
      setSaving(true);
      setError(null);

      await updateBookingStatus(id, status);
      navigate("/admin/bookings");
    } catch (e2) {
      setError(e2?.response?.data?.message || "Ошибка изменения статуса");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-5 text-center"><Spinner /></div>;

  return (
    <Container className="mt-3" style={{ maxWidth: 800 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Изменить статус бронирования #{id}</h3>
          <div className="text-muted small">Все поля ниже — только просмотр</div>
        </div>
        <Button as={Link} to="/admin/bookings" variant="outline-secondary">← Назад</Button>
      </div>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex flex-wrap gap-4 small">
            <div><b>Пользователь:</b> {booking?.userEmail} (#{booking?.userId})</div>
            <div><b>Статус:</b> <Badge bg="secondary">{booking?.status}</Badge></div>
            <div><b>Создано:</b> {String(booking?.createdAt || "").slice(0, 16).replace("T", " ")}</div>
            <div><b>Людей:</b> {booking?.personsCount}</div>
            <div><b>Сумма:</b> {booking?.totalPrice}</div>
            <div><b>Вылет:</b> #{booking?.tourDepartureId}</div>
            <div><b>Тур:</b> {booking?.tourTitle}</div>
            <div><b>Рейс туда:</b> {booking?.outboundFlightNumber ? `${booking.outboundFlightNumber} (#${booking.outboundFlightId})` : "—"}</div>
            <div><b>Рейс обратно:</b> {booking?.returnFlightNumber ? `${booking.returnFlightNumber} (#${booking.returnFlightId})` : "—"}</div>
          </div>
        </Card.Body>
      </Card>

      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Новый статус</Form.Label>
          <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} required>
            <option value="">— выберите —</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" disabled={saving || !status}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button as={Link} to="/admin/bookings" variant="outline-secondary">
            Отмена
          </Button>
        </div>
      </Form>
    </Container>
  );
}
