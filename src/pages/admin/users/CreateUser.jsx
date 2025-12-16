import { useState } from "react";
import { Button, Container, Form, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { createUser } from "../../../services/userService.js";

const ROLES = ["USER", "MANAGER", "ADMIN"];

export default function CreateUser() {
  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    userRole: "USER",
    active: true,
  });

  const extractError = (err) =>
    err?.response?.data?.message ||
    err?.message ||
    "Ошибка создания пользователя";

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

      await createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        userRole: formData.userRole,
        active: formData.active,
      });

      navigate("/admin/users");
    } catch (err) {
      setError(extractError(err));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  return (
    <Container className="mt-3" style={{ maxWidth: 640 }}>
      <h3>Создать пользователя</h3>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control required name="username" value={formData.username} onChange={handleChange} />
          <Form.Control.Feedback type="invalid">
            Username обязателен
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control required type="email" name="email" value={formData.email} onChange={handleChange} />
          <Form.Control.Feedback type="invalid">
            Email обязателен
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Пароль</Form.Label>
          <Form.Control required type="password" name="password" value={formData.password} onChange={handleChange} />
          <Form.Control.Feedback type="invalid">
            Пароль обязателен (минимум 8 символов)
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Телефон</Form.Label>
          <Form.Control name="phone" value={formData.phone} onChange={handleChange} placeholder="+7 900 123-45-67" />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Роль</Form.Label>
          <Form.Select name="userRole" value={formData.userRole} onChange={handleChange}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            name="active"
            checked={formData.active}
            onChange={handleChange}
            label="Активен"
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit">Создать</Button>
          <Button as={Link} to="/admin/users" variant="outline-secondary">
            Отмена
          </Button>
        </div>
      </Form>
    </Container>
  );
}
