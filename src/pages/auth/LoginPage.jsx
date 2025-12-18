import { useContext, useState } from "react";
import { Button, Container, Form, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import StoreContext from "../../stores/StoreContext.js";

export default function LoginPage() {
  const { store } = useContext(StoreContext);
  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ email: "", password: "" });

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
      await store.auth.login(formData.email, formData.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка входа");
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  return (
    <Container style={{ maxWidth: 520 }}>
      <h3 className="mb-3">Вход</h3>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="loginEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
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

        <Form.Group className="mb-3" controlId="loginPassword">
          <Form.Label>Пароль</Form.Label>
          <Form.Control
            id="loginPassword"
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

        <Button type="submit">Войти</Button>
        <div className="mt-3">
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </div>
      </Form>
    </Container>
  );
}
