import { useContext, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Spinner, Table } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import StoreContext from "../../../stores/StoreContext";

import { getTourDepartureById, updateTourDeparture } from "../../../services/tourDepartureService.js";
import { getFlightsForTour } from "../../../services/flightService.js";
import { getToursPaged, getMyToursPaged } from "../../../services/tourService.js";

const STATUSES = ["PLANNED", "SALES_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function EditTourDeparture() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { store } = useContext(StoreContext);
  const role = store?.auth?.role || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);

  const [tours, setTours] = useState([]);

  const [formData, setFormData] = useState({
    tourId: "",
    startDate: "",
    endDate: "",
    capacityTotal: "",
    capacityReserved: "0",
    priceOverride: "",
    status: "PLANNED",
  });

  // ✅ подбор рейсов
  const [flightSearch, setFlightSearch] = useState("");
  const [flightPage, setFlightPage] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
    size: 0,
  });

  const [selectedFlightIds, setSelectedFlightIds] = useState(() => new Set());

  const loadTours = async () => {
    const data =
      role === "MANAGER"
        ? await getMyToursPaged({ title: "", baseCityId: "", status: "", active: "", page: 0, size: 2000 })
        : await getToursPaged({ title: "", baseCityId: "", status: "", active: "", managerUserId: "", page: 0, size: 2000 });

    setTours(data?.content || []);
  };

  const loadFlights = async (page = 0, overrideSearch) => {
    if (!formData.tourId) {
      setFlightPage({ content: [], page: 0, totalPages: 0, totalElements: 0, size: 0 });
      return;
    }

    const s = overrideSearch ?? flightSearch;
    const data = await getFlightsForTour({
      tourId: Number(formData.tourId),
      flightNumber: s,
      page,
      size: 10,
    });

    setFlightPage(data);
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      await loadTours();

      const d = await getTourDepartureById(id);

      setFormData({
        tourId: d.tourId ? String(d.tourId) : "",
        startDate: d.startDate || "",
        endDate: d.endDate || "",
        capacityTotal: d.capacityTotal ?? "",
        capacityReserved: d.capacityReserved ?? "0",
        priceOverride: d.priceOverride ?? "",
        status: d.status || "PLANNED",
      });

      setSelectedFlightIds(new Set(d.flightIds || []));
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки вылета");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // при смене тура — сбросить выбор рейсов (иначе будет конфликт валидации на бэке)
    (async () => {
      if (!formData.tourId) return;
      setFlightSearch("");
      setSelectedFlightIds(new Set());
      await loadFlights(0, "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tourId]);

  const toggleFlight = (fid) => {
    setSelectedFlightIds((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid);
      else next.add(fid);
      return next;
    });
  };

  const selectedCount = useMemo(() => selectedFlightIds.size, [selectedFlightIds]);

  const onSubmitFlightsSearch = async (e) => {
    e.preventDefault();
    try {
      await loadFlights(0);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Ошибка поиска рейсов");
    }
  };

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

      const payload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        capacityTotal: Number(formData.capacityTotal),
        capacityReserved: Number(formData.capacityReserved),
        priceOverride: formData.priceOverride ? Number(formData.priceOverride) : null,
        status: formData.status,
        tourId: Number(formData.tourId),
        flightIds: Array.from(selectedFlightIds),
      };

      await updateTourDeparture(id, payload);
      navigate("/tour-departures");
    } catch (e2) {
      setError(e2?.response?.data?.message || "Ошибка обновления вылета");
    }
  };

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner />
      </div>
    );
  }

  const prevDisabled = flightPage.page <= 0;
  const nextDisabled = flightPage.page >= flightPage.totalPages - 1;

  return (
    <Container className="mt-3" style={{ maxWidth: 1100 }}>
      <div className="d-flex align-items-center justify-content-between">
        <h3 className="mb-0">Редактировать вылет #{id}</h3>
        <Button as={Link} to="/tour-departures" variant="outline-secondary">
          ← Назад
        </Button>
      </div>

      {error && <Alert className="mt-3" variant="danger">{String(error)}</Alert>}

      <Form className="mt-3" noValidate validated={validated} onSubmit={handleSubmit}>
        <Card className="mb-3">
          <Card.Body>
            <div className="d-flex gap-3 flex-wrap">
              <Form.Group style={{ minWidth: 520 }}>
                <Form.Label>Тур</Form.Label>
                <Form.Select required name="tourId" value={formData.tourId} onChange={handleChange}>
                  <option value="">— выберите тур —</option>
                  {tours.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} — {t.title} ({t.baseCityName})
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">Тур обязателен</Form.Control.Feedback>
              </Form.Group>

              <Form.Group style={{ minWidth: 180 }}>
                <Form.Label>Статус</Form.Label>
                <Form.Select required name="status" value={formData.status} onChange={handleChange}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group style={{ minWidth: 200 }}>
                <Form.Label>Старт</Form.Label>
                <Form.Control required type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
                <Form.Control.Feedback type="invalid">Обязательно</Form.Control.Feedback>
              </Form.Group>

              <Form.Group style={{ minWidth: 200 }}>
                <Form.Label>Финиш</Form.Label>
                <Form.Control required type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
                <Form.Control.Feedback type="invalid">Обязательно</Form.Control.Feedback>
              </Form.Group>
            </div>

            <div className="d-flex gap-3 flex-wrap mt-3">
              <Form.Group style={{ minWidth: 220 }}>
                <Form.Label>Вместимость</Form.Label>
                <Form.Control required type="number" min="1" name="capacityTotal" value={formData.capacityTotal} onChange={handleChange} />
                <Form.Control.Feedback type="invalid">Обязательно</Form.Control.Feedback>
              </Form.Group>

              <Form.Group style={{ minWidth: 220 }}>
                <Form.Label>Забронировано</Form.Label>
                <Form.Control required type="number" min="0" name="capacityReserved" value={formData.capacityReserved} onChange={handleChange} />
                <Form.Control.Feedback type="invalid">Обязательно</Form.Control.Feedback>
              </Form.Group>

              <Form.Group style={{ minWidth: 220 }}>
                <Form.Label>Цена override</Form.Label>
                <Form.Control type="number" min="0" step="0.01" name="priceOverride" value={formData.priceOverride} onChange={handleChange} />
              </Form.Group>
            </div>
          </Card.Body>
        </Card>

        {/* ✅ Привязка рейсов */}
        <Card className="mb-3">
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="mb-0">
                Привязанные рейсы <Badge bg="secondary">{selectedCount}</Badge>
              </h5>
            </div>

            <Form className="mb-3" onSubmit={onSubmitFlightsSearch}>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <Form.Control
                  placeholder="Поиск по номеру рейса (SU100)"
                  value={flightSearch}
                  onChange={(e) => setFlightSearch(e.target.value)}
                  style={{ maxWidth: 360 }}
                  disabled={!formData.tourId}
                />
                <Button type="submit" variant="secondary" disabled={!formData.tourId}>
                  Найти
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  disabled={!formData.tourId}
                  onClick={async () => {
                    setFlightSearch("");
                    await loadFlights(0, "");
                  }}
                >
                  Сброс
                </Button>
              </div>
            </Form>

            {!formData.tourId ? (
              <Alert variant="light">Сначала выберите тур — затем будут доступны рейсы для привязки</Alert>
            ) : (
              <>
                <Table bordered hover responsive>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}></th>
                      <th style={{ width: 140 }}>Номер</th>
                      <th>Авиакомпания</th>
                      <th style={{ width: 170 }}>Вылет</th>
                      <th style={{ width: 170 }}>Прилёт</th>
                      <th style={{ width: 140 }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flightPage.content?.length ? (
                      flightPage.content.map((f) => (
                        <tr key={f.id}>
                          <td className="text-center">
                            <Form.Check
                              type="checkbox"
                              checked={selectedFlightIds.has(f.id)}
                              onChange={() => toggleFlight(f.id)}
                            />
                          </td>
                          <td><b>{f.flightNumber}</b></td>
                          <td>{f.carrier}</td>
                          <td>{String(f.departAt).replace("T", " ").slice(0, 16)}</td>
                          <td>{String(f.arriveAt).replace("T", " ").slice(0, 16)}</td>
                          <td><Badge bg="secondary">{f.status}</Badge></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center">Рейсы не найдены</td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    Страница: {flightPage.page + 1} / {flightPage.totalPages || 1} (всего: {flightPage.totalElements})
                  </div>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" disabled={prevDisabled} onClick={() => loadFlights(flightPage.page - 1)}>
                      Назад
                    </Button>
                    <Button variant="outline-secondary" disabled={nextDisabled} onClick={() => loadFlights(flightPage.page + 1)}>
                      Вперёд
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button type="submit">Сохранить</Button>
          <Button as={Link} to="/tour-departures" variant="outline-secondary">Отмена</Button>
        </div>
      </Form>
    </Container>
  );
}
