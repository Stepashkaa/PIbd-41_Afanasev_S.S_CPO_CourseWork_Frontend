import { useEffect, useState } from "react";
import { Button, Container, Form, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { createFlight } from "../../../services/flightService.js";
import { getAirportsPaged } from "../../../services/airportService.js";

export default function CreateFlight() {
  const navigate = useNavigate();

  const [loadingAirports, setLoadingAirports] = useState(true);
  const [airports, setAirports] = useState([]);

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    flightNumber: "",
    carrier: "",
    departAt: "",
    arriveAt: "",
    basePrice: "",
    departureAirportId: "",
    arrivalAirportId: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoadingAirports(true);
        // берём много, чтобы хватило для селекта
        const page = await getAirportsPaged({ iata: "", name: "", cityId: undefined, page: 0, size: 2000 });
        setAirports(page?.content || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки аэропортов");
      } finally {
        setLoadingAirports(false);
      }
    })();
  }, []);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      setValidated(true);
      return;
    }

    try {
      setError(null);
      await createFlight({
        flightNumber: formData.flightNumber.trim(),
        carrier: formData.carrier.trim(),
        departAt: formData.departAt, // ISO
        arriveAt: formData.arriveAt,
        basePrice: Number(formData.basePrice),
        departureAirportId: Number(formData.departureAirportId),
        arrivalAirportId: Number(formData.arrivalAirportId),
      });
      navigate("/admin/flights");
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка создания рейса");
    }
  };

  return (
    <Container className="mt-3" style={{ maxWidth: 720 }}>
      <h3>Создать рейс</h3>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {loadingAirports ? (
        <div className="py-4 text-center"><Spinner /></div>
      ) : (
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Номер рейса</Form.Label>
            <Form.Control required name="flightNumber" value={formData.flightNumber} onChange={handleChange} maxLength={20} placeholder="SU100" />
            <Form.Control.Feedback type="invalid">Номер обязателен</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Авиакомпания</Form.Label>
            <Form.Control required name="carrier" value={formData.carrier} onChange={handleChange} maxLength={150} />
            <Form.Control.Feedback type="invalid">Авиакомпания обязательна</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Время вылета</Form.Label>
            <Form.Control required type="datetime-local" name="departAt" value={formData.departAt} onChange={handleChange} />
            <Form.Control.Feedback type="invalid">Время вылета обязательно</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Время прилёта</Form.Label>
            <Form.Control required type="datetime-local" name="arriveAt" value={formData.arriveAt} onChange={handleChange} />
            <Form.Control.Feedback type="invalid">Время прилёта обязательно</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Базовая цена</Form.Label>
            <Form.Control required type="number" min="0" step="0.01" name="basePrice" value={formData.basePrice} onChange={handleChange} />
            <Form.Control.Feedback type="invalid">Цена обязательна</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Аэропорт вылета</Form.Label>
            <Form.Select required name="departureAirportId" value={formData.departureAirportId} onChange={handleChange}>
              <option value="">— выберите —</option>
              {airports.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.iataCode} — {a.name} ({a.cityName})
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">Аэропорт вылета обязателен</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Аэропорт прилёта</Form.Label>
            <Form.Select required name="arrivalAirportId" value={formData.arrivalAirportId} onChange={handleChange}>
              <option value="">— выберите —</option>
              {airports.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.iataCode} — {a.name} ({a.cityName})
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">Аэропорт прилёта обязателен</Form.Control.Feedback>
          </Form.Group>

          <div className="d-flex gap-2">
            <Button type="submit">Создать</Button>
            <Button as={Link} to="/admin/flights" variant="outline-secondary">Отмена</Button>
          </div>
        </Form>
      )}
    </Container>
  );
}
