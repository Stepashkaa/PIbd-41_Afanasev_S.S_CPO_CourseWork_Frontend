import { useEffect, useState } from "react";
import { Button, Container, Form, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getCityById, updateCity } from "../../../services/cityService.js";

export default function EditCity() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    timezone: ""
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const city = await getCityById(id);
        setFormData({
          name: city.name || "",
          country: city.country || "",
          timezone: city.timezone || ""
        });
      } catch (err) {
        const message = err?.response?.data?.message;

        if (err?.response?.status === 400 && message) {
          setError(message);
        } else {
          setError("Ошибка обновления города");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
      await updateCity(id, formData);
      navigate("/admin/cities");
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка обновления города");
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return <div className="py-5 text-center"><Spinner /></div>;
  }

  return (
    <Container className="mt-3" style={{ maxWidth: 640 }}>
      <h3>Редактировать город #{id}</h3>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Название</Form.Label>
          <Form.Control
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <Form.Control.Feedback type="invalid">
            Название обязательно
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Страна</Form.Label>
          <Form.Control
            required
            name="country"
            value={formData.country}
            onChange={handleChange}
          />
          <Form.Control.Feedback type="invalid">
            Страна обязательна
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Timezone</Form.Label>
          <Form.Control
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            placeholder="Europe/Moscow"
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit">Сохранить</Button>
          <Button as={Link} to="/admin/cities" variant="outline-secondary">Отмена</Button>
        </div>
      </Form>
    </Container>
  );
}
