import { useContext, useState } from "react";
import { Button, Container, Form, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import StoreContext from "../../stores/StoreContext.js";

export default function RegisterPage() {
  const { store } = useContext(StoreContext);
  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });

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
      await store.auth.register(formData.username, formData.email, formData.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка регистрации");
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  return (
    <Container style={{ maxWidth: 520 }}>
      <h3 className="mb-3">Регистрация</h3>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="regUsername">
          <Form.Label>Имя пользователя</Form.Label>
          <Form.Control
            id="regUsername"
            required
            name="username"
            minLength={5}
            maxLength={50}
            value={formData.username}
            onChange={handleChange}
          />
          <Form.Control.Feedback type="invalid">
            Имя пользователя 5–50 символов
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="regEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            id="regEmail"
            required
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Form.Control.Feedback type="invalid">
            Укажи корректный email
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="regPassword">
          <Form.Label>Пароль</Form.Label>
          <Form.Control
            id="regPassword"
            required
            type="password"
            name="password"
            minLength={8}
            value={formData.password}
            onChange={handleChange}
          />
          <Form.Control.Feedback type="invalid">
            Пароль минимум 8 символов
          </Form.Control.Feedback>
        </Form.Group>

        <Button type="submit">Создать аккаунт</Button>
        <div className="mt-3">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </Form>
    </Container>
  );
}
