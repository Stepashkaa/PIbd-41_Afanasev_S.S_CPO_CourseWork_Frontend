import { useEffect, useState } from "react";
import { Button, Container, Form, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { createAirport } from "../../../services/airportService.js";
import { getCitiesAll } from "../../../services/cityService.js";

export default function CreateAirport() {
  const navigate = useNavigate();

  const [loadingCities, setLoadingCities] = useState(true);
  const [cities, setCities] = useState([]);

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    iataCode: "",
    name: "",
    cityId: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoadingCities(true);
        const list = await getCitiesAll();
        setCities(list || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки городов");
      } finally {
        setLoadingCities(false);
      }
    })();
  }, []);

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
      await createAirport({
        iataCode: formData.iataCode.trim(),
        name: formData.name.trim(),
        cityId: Number(formData.cityId),
      });
      navigate("/admin/airports");
    } catch (err) {
      const message = err?.response?.data?.message;
      if (err?.response?.status === 400 && message) {
        setError(message); // ← покажет “Аэропорт с таким IATA-кодом уже существует”
      } else {
        setError("Ошибка создания аэропорта");
      }
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  return (
    <Container className="mt-3" style={{ maxWidth: 640 }}>
      <h3>Создать аэропорт</h3>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {loadingCities ? (
        <div className="py-4 text-center"><Spinner /></div>
      ) : (
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>IATA-код</Form.Label>
            <Form.Control
              required
              name="iataCode"
              value={formData.iataCode}
              onChange={handleChange}
              placeholder="SVO"
              maxLength={10}
            />
            <Form.Control.Feedback type="invalid">
              IATA-код обязателен
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Название</Form.Label>
            <Form.Control
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              maxLength={150}
            />
            <Form.Control.Feedback type="invalid">
              Название обязательно
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Город</Form.Label>
            <Form.Select
              required
              name="cityId"
              value={formData.cityId}
              onChange={handleChange}
            >
              <option value="">— выберите город —</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.country})
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              Город обязателен
            </Form.Control.Feedback>
          </Form.Group>

          <div className="d-flex gap-2">
            <Button type="submit">Создать</Button>
            <Button as={Link} to="/admin/airports" variant="outline-secondary">
              Отмена
            </Button>
          </div>
        </Form>
      )}
    </Container>
  );
}
