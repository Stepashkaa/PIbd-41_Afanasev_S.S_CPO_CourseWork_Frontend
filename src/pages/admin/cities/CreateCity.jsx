import { useState } from "react";
import { Button, Container, Form, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { createCity } from "../../../services/cityService.js";

export default function CreateCity() {
  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});

  // ⚠️ поля могут отличаться — жду твои CityCreateRequest/UpdateRequest/ResponseDto
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    timezone: ""
  });

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
      await createCity(formData);
      navigate("/admin/cities");
    } catch (err) {
      const message = err?.response?.data?.message || "";

      if (message.toLowerCase().includes("уже существует")) {
        setFieldErrors({
          name: "Город с таким названием уже существует",
          country: "Проверьте страну"
        });
      } else {
        setError(message || "Ошибка создания города");
      }
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  return (
    <Container className="mt-3" style={{ maxWidth: 640 }}>
      <h3>Создать город</h3>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Название</Form.Label>
          <Form.Control
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            isInvalid={!!fieldErrors.name}
          />
          <Form.Control.Feedback type="invalid">
            {fieldErrors.name || "Название обязательно"}
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
          <Button type="submit">Создать</Button>
          <Button as={Link} to="/admin/cities" variant="outline-secondary">Отмена</Button>
        </div>
      </Form>
    </Container>
  );
}
