import { useContext, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Spinner, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import StoreContext from "../../../stores/StoreContext";

import { getToursPaged, getMyToursPaged } from "../../../services/tourService";
import {
  getTourDeparturesByTour,
  getTourDepartureById,
  updateTourDeparture,
} from "../../../services/tourDepartureService";
import { getFlightsForDeparture } from "../../../services/flightService";

export default function PageTourDepartureFlightBind() {
  const { store } = useContext(StoreContext);
  const role = store?.auth?.role || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tours, setTours] = useState([]);
  const [departures, setDepartures] = useState([]);

  const [selectedTourId, setSelectedTourId] = useState("");
  const [selectedDepartureId, setSelectedDepartureId] = useState("");

  const [departure, setDeparture] = useState(null);

  // flights
  const [flightSearch, setFlightSearch] = useState("");
  const [flightPage, setFlightPage] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });

  const [selectedFlightIds, setSelectedFlightIds] = useState(() => new Set());

  // --- LOADERS ------------------------------------------------

  const loadTours = async () => {
    const data =
      role === "MANAGER"
        ? await getMyToursPaged({ page: 0, size: 2000 })
        : await getToursPaged({ page: 0, size: 2000 });

    setTours(data?.content || []);
  };

  const loadDepartures = async (tourId) => {
    const data = await getTourDeparturesByTour({
      tourId: Number(tourId),
      page: 0,
      size: 2000,
    });
    setDepartures(data?.content || []);
  };

  const loadDeparture = async (departureId) => {
    const d = await getTourDepartureById(departureId);
    setDeparture(d);
    setSelectedFlightIds(new Set(d.flightIds || []));
  };

  const loadFlights = async (page = 0, overrideSearch) => {
    if (!selectedDepartureId) return;

    const data = await getFlightsForDeparture({
      departureId: Number(selectedDepartureId),
      flightNumber: (overrideSearch ?? flightSearch) || "",
      page,
      size: 10,
    });

    setFlightPage(data);
  };

  // --- EFFECTS ------------------------------------------------

  // 1) туры
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadTours();
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки туров");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  // 2) при смене тура -> грузим вылеты, сбрасываем выбранный вылет/рейсы
  useEffect(() => {
    if (!selectedTourId) {
      setDepartures([]);
      setSelectedDepartureId("");
      setDeparture(null);
      setSelectedFlightIds(new Set());
      setFlightSearch("");
      setFlightPage({ content: [], page: 0, totalPages: 0, totalElements: 0, size: 10 });
      return;
    }

    (async () => {
      try {
        setError(null);

        setDepartures([]);
        setSelectedDepartureId("");
        setDeparture(null);
        setSelectedFlightIds(new Set());
        setFlightSearch("");
        setFlightPage({ content: [], page: 0, totalPages: 0, totalElements: 0, size: 10 });

        await loadDepartures(selectedTourId);
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки вылетов по туру");
      }
    })();
  }, [selectedTourId]);

  // 3) при смене вылета -> грузим деталь и рейсы
  useEffect(() => {
    if (!selectedDepartureId) return;

    (async () => {
      try {
        setError(null);
        setFlightSearch("");

        await loadDeparture(selectedDepartureId);
        await loadFlights(0, "");
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки данных вылета/рейсов");
      }
    })();
    // eslint-disable-next-line
  }, [selectedDepartureId]);

  // --- HELPERS ------------------------------------------------

  const toggleFlight = (id) => {
    setSelectedFlightIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedCount = useMemo(() => selectedFlightIds.size, [selectedFlightIds]);

  const onSearchFlights = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await loadFlights(0);
    } catch (err) {
      setError(err?.response?.data?.message || "Ошибка поиска рейсов");
    }
  };

  const onSave = async () => {
    if (!departure) return;

    try {
      setError(null);

      const payload = {
        startDate: departure.startDate,
        endDate: departure.endDate,
        capacityTotal: departure.capacityTotal,
        capacityReserved: departure.capacityReserved,
        priceOverride: departure.priceOverride ?? null,
        status: departure.status,
        tourId: departure.tourId,
        flightIds: Array.from(selectedFlightIds),
      };

      await updateTourDeparture(selectedDepartureId, payload);
      alert("Привязка рейсов сохранена");
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка сохранения привязки");
    }
  };

  const prevDisabled = flightPage.page <= 0;
  const nextDisabled = flightPage.page >= (flightPage.totalPages || 1) - 1;

  // --- RENDER -------------------------------------------------

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Container className="mt-3" style={{ maxWidth: 1200 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Привязка рейсов к вылету тура</h3>
        <Button as={Link} to="/" variant="outline-secondary">
          ← Назад
        </Button>
      </div>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {/* тур */}
      <Card className="mb-3">
        <Card.Body>
          <Form.Select value={selectedTourId} onChange={(e) => setSelectedTourId(e.target.value)}>
            <option value="">— Выберите тур —</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.title} ({t.baseCityName})
              </option>
            ))}
          </Form.Select>
        </Card.Body>
      </Card>

      {/* вылет */}
      {selectedTourId && (
        <Card className="mb-3">
          <Card.Body>
            <Form.Select
              value={selectedDepartureId}
              onChange={(e) => setSelectedDepartureId(e.target.value)}
            >
              <option value="">— Выберите вылет тура —</option>
              {departures.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.id} | {d.startDate} → {d.endDate} | {d.status}
                </option>
              ))}
            </Form.Select>
          </Card.Body>
        </Card>
      )}

      {/* рейсы */}
      {departure && (
        <Card>
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="mb-0">
                Рейсы <Badge bg="secondary">{selectedCount}</Badge>
              </h5>
            </div>

            <Form className="my-3" onSubmit={onSearchFlights}>
              <div className="d-flex gap-2">
                <Form.Control
                  placeholder="Поиск по номеру рейса"
                  value={flightSearch}
                  onChange={(e) => setFlightSearch(e.target.value)}
                />
                <Button type="submit" variant="secondary">
                  Найти
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={async () => {
                    try {
                      setError(null);
                      setFlightSearch("");
                      await loadFlights(0, "");
                    } catch (e) {
                      setError(e?.response?.data?.message || "Ошибка сброса поиска");
                    }
                  }}
                >
                  Сброс
                </Button>
              </div>
            </Form>

            <Table bordered hover responsive>
              <thead>
                <tr>
                  <th style={{ width: 60 }}></th>
                  <th>Номер</th>
                  <th>Авиакомпания</th>
                  <th>Вылет</th>
                  <th>Прилёт</th>
                </tr>
              </thead>
              <tbody>
                {flightPage.content?.length ? (
                  flightPage.content.map((f) => (
                    <tr key={f.id}>
                      <td className="text-center">
                        <Form.Check
                          checked={selectedFlightIds.has(f.id)}
                          onChange={() => toggleFlight(f.id)}
                        />
                      </td>
                      <td>
                        <b>{f.flightNumber}</b>
                      </td>
                      <td>{f.carrier}</td>
                      <td>{String(f.departAt).slice(0, 16).replace("T", " ")}</td>
                      <td>{String(f.arriveAt).slice(0, 16).replace("T", " ")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center">
                      Рейсы не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center">
              <div>
                Страница: {flightPage.page + 1} / {flightPage.totalPages || 1} (всего:{" "}
                {flightPage.totalElements})
              </div>

              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  disabled={prevDisabled}
                  onClick={() => loadFlights(flightPage.page - 1)}
                >
                  Назад
                </Button>
                <Button
                  variant="outline-secondary"
                  disabled={nextDisabled}
                  onClick={() => loadFlights(flightPage.page + 1)}
                >
                  Вперёд
                </Button>
                <Button onClick={onSave}>Сохранить привязку</Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
