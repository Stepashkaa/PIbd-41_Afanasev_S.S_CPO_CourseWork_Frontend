import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Container, Form, Spinner, Table } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getFlightById, updateFlight, addDepartureToFlight, removeDepartureFromFlight } from "../../../services/flightService.js";
import { getAirportsPaged } from "../../../services/airportService.js";
import { getToursPaged } from "../../../services/tourService.js";
import { getTourDeparturesByTour, getTourDepartureById } from "../../../services/tourDepartureService.js";

export default function EditFlight() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingAirports, setLoadingAirports] = useState(true);

  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  const [airports, setAirports] = useState([]);

  const [formData, setFormData] = useState({
    flightNumber: "",
    carrier: "",
    departAt: "",
    arriveAt: "",
    status: "SCHEDULED",
    basePrice: "",
    departureAirportId: "",
    arrivalAirportId: "",
  });

  // ✅ привязанные вылеты (из flight.tourDepartureIds)
  const [boundDepartureIds, setBoundDepartureIds] = useState([]);
  const [boundDepartures, setBoundDepartures] = useState([]); // детали вылетов

  // ✅ блок "добавить привязку"
  const [tours, setTours] = useState([]);
  const [bindTourId, setBindTourId] = useState("");
  const [tourDepartures, setTourDepartures] = useState([]); // вылеты выбранного тура (paged но тут возьмём 2000)
  const [bindDepartureId, setBindDepartureId] = useState("");

  const loadAirports = async () => {
    const page = await getAirportsPaged({ iata: "", name: "", cityId: undefined, page: 0, size: 2000 });
    setAirports(page?.content || []);
  };

  const loadTours = async () => {
    // берём много, чтобы select был полный
    const page = await getToursPaged({ title: "", baseCityId: "", status: "", active: "", managerUserId: "", page: 0, size: 2000 });
    setTours(page?.content || []);
  };

  const normalizeDateTimeLocal = (iso) => {
    // "2025-12-31T10:00:00" -> "2025-12-31T10:00"
    if (!iso) return "";
    return String(iso).slice(0, 16);
  };

  const loadBoundDeparturesDetails = async (ids) => {
    try {
      const unique = Array.from(new Set(ids || []));
      if (!unique.length) {
        setBoundDepartures([]);
        return;
      }
      const items = await Promise.all(unique.map((did) => getTourDepartureById(did)));
      setBoundDepartures(items);
    } catch (e) {
      // не критично
      console.warn("Не удалось загрузить детали вылетов", e);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const flight = await getFlightById(id);

      setFormData({
        flightNumber: flight.flightNumber || "",
        carrier: flight.carrier || "",
        departAt: normalizeDateTimeLocal(flight.departAt),
        arriveAt: normalizeDateTimeLocal(flight.arriveAt),
        status: flight.status || "SCHEDULED",
        basePrice: flight.basePrice ?? "",
        departureAirportId: flight.departureAirportId ? String(flight.departureAirportId) : "",
        arrivalAirportId: flight.arrivalAirportId ? String(flight.arrivalAirportId) : "",
      });

      const depIds = flight.tourDepartureIds || [];
      setBoundDepartureIds(depIds);
      await loadBoundDeparturesDetails(depIds);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки рейса");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoadingAirports(true);
        await Promise.all([loadAirports(), loadTours()]);
      } catch (e) {
        // не валим всё
        console.warn(e);
      } finally {
        setLoadingAirports(false);
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!bindTourId) {
        setTourDepartures([]);
        setBindDepartureId("");
        return;
      }
      try {
        // быстро возьмём все вылеты этого тура (до 2000)
        const page = await getTourDeparturesByTour({ tourId: Number(bindTourId), page: 0, size: 2000 });
        setTourDepartures(page?.content || []);
        setBindDepartureId("");
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки вылетов тура");
      }
    })();
  }, [bindTourId]);

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
      await updateFlight(id, {
        flightNumber: formData.flightNumber.trim(),
        carrier: formData.carrier.trim(),
        departAt: formData.departAt,
        arriveAt: formData.arriveAt,
        status: formData.status,
        basePrice: Number(formData.basePrice),
        departureAirportId: Number(formData.departureAirportId),
        arrivalAirportId: Number(formData.arrivalAirportId),
      });
      navigate("/admin/flights");
    } catch (e2) {
      setError(e2?.response?.data?.message || "Ошибка обновления рейса");
    }
  };

  const onBind = async () => {
    if (!bindDepartureId) return;
    try {
      setError(null);
      const dto = await addDepartureToFlight(Number(id), Number(bindDepartureId));
      const newIds = dto.tourDepartureIds || [];
      setBoundDepartureIds(newIds);
      await loadBoundDeparturesDetails(newIds);
      setBindDepartureId("");
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка привязки вылета к рейсу");
    }
  };

  const onUnbind = async (departureId) => {
    if (!confirm("Отвязать вылет от рейса?")) return;
    try {
      setError(null);
      const dto = await removeDepartureFromFlight(Number(id), Number(departureId));
      const newIds = dto.tourDepartureIds || [];
      setBoundDepartureIds(newIds);
      await loadBoundDeparturesDetails(newIds);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка отвязки");
    }
  };

  const availableToBind = useMemo(() => {
    const bound = new Set(boundDepartureIds || []);
    return (tourDepartures || []).filter((d) => !bound.has(d.id));
  }, [tourDepartures, boundDepartureIds]);

  if (loading || loadingAirports) {
    return <div className="py-5 text-center"><Spinner /></div>;
  }

  return (
    <Container className="mt-3" style={{ maxWidth: 980 }}>
      <div className="d-flex align-items-center justify-content-between">
        <h3 className="mb-0">Редактировать рейс #{id}</h3>
        <Button as={Link} to="/admin/flights" variant="outline-secondary">← Назад</Button>
      </div>

      {error && <Alert className="mt-3" variant="danger">{String(error)}</Alert>}

      <Form className="mt-3" noValidate validated={validated} onSubmit={handleSubmit}>
        <div className="d-flex gap-3 flex-wrap">
          <Form.Group className="mb-3" style={{ minWidth: 260 }}>
            <Form.Label>Номер рейса</Form.Label>
            <Form.Control required name="flightNumber" value={formData.flightNumber} onChange={handleChange} maxLength={20} />
            <Form.Control.Feedback type="invalid">Номер обязателен</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" style={{ minWidth: 260 }}>
            <Form.Label>Авиакомпания</Form.Label>
            <Form.Control required name="carrier" value={formData.carrier} onChange={handleChange} maxLength={150} />
            <Form.Control.Feedback type="invalid">Авиакомпания обязательна</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" style={{ minWidth: 220 }}>
            <Form.Label>Статус</Form.Label>
            <Form.Select required name="status" value={formData.status} onChange={handleChange}>
              {["SCHEDULED","BOARDING","DEPARTED","ARRIVED","CANCELLED","DELAYED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          <Form.Group className="mb-3" style={{ minWidth: 260 }}>
            <Form.Label>Вылет</Form.Label>
            <Form.Control required type="datetime-local" name="departAt" value={formData.departAt} onChange={handleChange} />
            <Form.Control.Feedback type="invalid">Обязательно</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" style={{ minWidth: 260 }}>
            <Form.Label>Прилёт</Form.Label>
            <Form.Control required type="datetime-local" name="arriveAt" value={formData.arriveAt} onChange={handleChange} />
            <Form.Control.Feedback type="invalid">Обязательно</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" style={{ minWidth: 220 }}>
            <Form.Label>Цена</Form.Label>
            <Form.Control required type="number" min="0" step="0.01" name="basePrice" value={formData.basePrice} onChange={handleChange} />
            <Form.Control.Feedback type="invalid">Цена обязательна</Form.Control.Feedback>
          </Form.Group>
        </div>

        <div className="d-flex gap-3 flex-wrap">
          <Form.Group className="mb-3" style={{ minWidth: 420 }}>
            <Form.Label>Аэропорт вылета</Form.Label>
            <Form.Select required name="departureAirportId" value={formData.departureAirportId} onChange={handleChange}>
              <option value="">— выберите —</option>
              {airports.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.iataCode} — {a.name} ({a.cityName})
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">Обязательно</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" style={{ minWidth: 420 }}>
            <Form.Label>Аэропорт прилёта</Form.Label>
            <Form.Select required name="arrivalAirportId" value={formData.arrivalAirportId} onChange={handleChange}>
              <option value="">— выберите —</option>
              {airports.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.iataCode} — {a.name} ({a.cityName})
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">Обязательно</Form.Control.Feedback>
          </Form.Group>
        </div>

        <div className="d-flex gap-2">
          <Button type="submit">Сохранить</Button>
          <Button variant="outline-secondary" onClick={() => navigate("/admin/flights")}>Отмена</Button>
        </div>
      </Form>

      {/* ✅ Привязка вылетов */}
      <hr className="my-4" />
      <h5 className="mb-2">Привязанные вылеты туров</h5>

      {boundDepartures?.length ? (
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Тур</th>
              <th style={{ width: 140 }}>Старт</th>
              <th style={{ width: 140 }}>Финиш</th>
              <th style={{ width: 140 }}>Статус</th>
              <th style={{ width: 140 }}>Действие</th>
            </tr>
          </thead>
          <tbody>
            {boundDepartures.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.tourTitle} <Badge bg="light" text="dark">tourId={d.tourId}</Badge></td>
                <td>{d.startDate}</td>
                <td>{d.endDate}</td>
                <td><Badge bg="secondary">{d.status}</Badge></td>
                <td>
                  <Button size="sm" variant="outline-danger" onClick={() => onUnbind(d.id)}>
                    Отвязать
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="light">Пока нет привязанных вылетов</Alert>
      )}

      <div className="mt-3">
        <h6 className="mb-2">Добавить привязку</h6>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Select
            value={bindTourId}
            onChange={(e) => setBindTourId(e.target.value)}
            style={{ maxWidth: 420 }}
          >
            <option value="">— выберите тур —</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.title} ({t.baseCityName})
              </option>
            ))}
          </Form.Select>

          <Form.Select
            value={bindDepartureId}
            onChange={(e) => setBindDepartureId(e.target.value)}
            disabled={!bindTourId}
            style={{ maxWidth: 420 }}
          >
            <option value="">— выберите вылет тура —</option>
            {availableToBind.map((d) => (
              <option key={d.id} value={d.id}>
                #{d.id} — {d.startDate}..{d.endDate} — {d.status}
              </option>
            ))}
          </Form.Select>

          <Button disabled={!bindDepartureId} onClick={onBind}>
            Привязать
          </Button>
        </div>
      </div>
    </Container>
  );
}
