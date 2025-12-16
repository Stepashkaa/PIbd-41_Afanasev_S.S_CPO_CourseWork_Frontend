import { useEffect, useState } from "react";
import { Button, Container, Form, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { createTour } from "../../../services/tourService.js";
import { getCitiesAll } from "../../../services/cityService.js";
import { getUsersAll } from "../../../services/userService.js";

export default function CreateTour() {
  const navigate = useNavigate();

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [cities, setCities] = useState([]);
  const [managers, setManagers] = useState([]);

  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    durationDays: 1,
    basePrice: "",
    active: true,
    baseCityId: "",
    managerUserId: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoadingRefs(true);
        const c = await getCitiesAll();
        setCities(c || []);

        const u = await getUsersAll();
        setManagers((u || []).filter((x) => x.userRole === "MANAGER" && x.active));
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки справочников");
      } finally {
        setLoadingRefs(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((p) => ({
      ...p,
      [name]:
        type === "checkbox"
          ? checked
          : name === "durationDays"
          ? Number(value)
          : name === "basePrice"
          ? value
          : value,
    }));
  };

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

      const payload = {
        title: formData.title,
        description: formData.description || null,
        durationDays: Number(formData.durationDays),
        basePrice: formData.basePrice, // строкой ок, бек BigDecimal съест
        active: Boolean(formData.active),
        baseCityId: Number(formData.baseCityId),
        managerUserId: formData.managerUserId ? Number(formData.managerUserId) : null,
      };

      await createTour(payload);
      navigate("/admin/tours");
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка создания тура");
    }
  };

  if (loadingRefs) {
    return (
      <div className="py-5 text-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Container className="mt-3" style={{ maxWidth: 720 }}>
      <h3>Создать тур</h3>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Название</Form.Label>
          <Form.Control required name="title" value={formData.title} onChange={handleChange} />
          <Form.Control.Feedback type="invalid">Название обязательно</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Описание</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength={500}
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Form.Group className="mb-3" style={{ flex: 1 }}>
            <Form.Label>Длительность (дни)</Form.Label>
            <Form.Control
              required
              type="number"
              min={1}
              max={365}
              name="durationDays"
              value={formData.durationDays}
              onChange={handleChange}
            />
            <Form.Control.Feedback type="invalid">1..365</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" style={{ flex: 1 }}>
            <Form.Label>Базовая цена</Form.Label>
            <Form.Control
              required
              name="basePrice"
              value={formData.basePrice}
              onChange={handleChange}
              placeholder="45000.00"
            />
            <Form.Control.Feedback type="invalid">Цена обязательна</Form.Control.Feedback>
          </Form.Group>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Базовый город</Form.Label>
          <Form.Select
            required
            name="baseCityId"
            value={formData.baseCityId}
            onChange={handleChange}
          >
            <option value="">Выберите город...</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.country}
              </option>
            ))}
          </Form.Select>
          <Form.Control.Feedback type="invalid">Город обязателен</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Менеджер (опционально)</Form.Label>
          <Form.Select
            name="managerUserId"
            value={formData.managerUserId}
            onChange={handleChange}
          >
            <option value="">Без менеджера</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.username} ({m.email})
              </option>
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
          <Button as={Link} to="/admin/tours" variant="outline-secondary">
            Отмена
          </Button>
        </div>
      </Form>
    </Container>
  );
}
