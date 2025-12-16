import { useEffect, useState } from "react";
import { Button, Container, Form, Alert, Spinner } from "react-bootstrap";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getUserById, updateUser } from "../../../services/userService.js";

const ROLES = ["USER", "MANAGER", "ADMIN"];

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "", // опционально
    phone: "",
    userRole: "USER",
    active: true,
  });

  const extractError = (err) =>
    err?.response?.data?.message || err?.message || "Ошибка обновления пользователя";

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const u = await getUserById(id);
        setFormData({
          username: u.username || "",
          email: u.email || "",
          password: "",
          phone: u.phone || "",
          userRole: u.userRole || "USER",
          active: !!u.active,
        });
      } catch (e) {
        setError(extractError(e));
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

      await updateUser(id, {
        username: formData.username,
        email: formData.email,
        password: formData.password?.trim() ? formData.password : null,
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

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Container className="mt-3" style={{ maxWidth: 640 }}>
      <h3>Редактировать пользователя #{id}</h3>

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
          <Form.Label>Новый пароль (если нужно поменять)</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Оставь пустым — пароль не изменится"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Телефон</Form.Label>
          <Form.Control name="phone" value={formData.phone} onChange={handleChange} />
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
          <Button type="submit">Сохранить</Button>
          <Button as={Link} to="/admin/users" variant="outline-secondary">
            Отмена
          </Button>
        </div>
      </Form>
    </Container>
  );
}
