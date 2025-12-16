import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Spinner, Table } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createBooking } from "../../../services/bookingService";
import { getTourPublicById } from "../../../services/tourService";
import { getTourDeparturesByTour } from "../../../services/tourDepartureService";
import { getFlightsForDeparture } from "../../../services/flightService";

export default function PageTourBooking() {
  const { id } = useParams(); // tourId
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [tour, setTour] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [selectedDepartureId, setSelectedDepartureId] = useState("");

  // flights for selected departure
  const [flightSearch, setFlightSearch] = useState("");
  const [flightPage, setFlightPage] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });

  // выбор рейсов (туда обязателен, обратно опционален)
  const [selectedOutboundId, setSelectedOutboundId] = useState(null);
  const [selectedReturnId, setSelectedReturnId] = useState(null);

  const [personsCount, setPersonsCount] = useState(1);

  const pickOutbound = (flightId) => {
    setSelectedOutboundId((prev) => {
      const next = prev === flightId ? null : flightId;
      // если новый outbound совпал с return — сбрасываем return
      if (next && selectedReturnId === next) setSelectedReturnId(null);
      return next;
    });
  };

  const pickReturn = (flightId) => {
    setSelectedReturnId((prev) => {
      const next = prev === flightId ? null : flightId;
      // если новый return совпал с outbound — сбрасываем outbound
      if (next && selectedOutboundId === next) setSelectedOutboundId(null);
      return next;
    });
  };

  const selectedDeparture = useMemo(
    () => departures.find((d) => String(d.id) === String(selectedDepartureId)) || null,
    [departures, selectedDepartureId]
  );

  const pricePerPerson = useMemo(() => {
    if (!tour || !selectedDeparture) return 0;
    const p = selectedDeparture?.priceOverride ?? tour?.basePrice ?? 0;
    return Number(p) || 0;
  }, [tour, selectedDeparture]);

  const outbound = useMemo(
    () => flightPage.content?.find((f) => f.id === selectedOutboundId) || null,
    [flightPage.content, selectedOutboundId]
  );

  const ret = useMemo(
    () => flightPage.content?.find((f) => f.id === selectedReturnId) || null,
    [flightPage.content, selectedReturnId]
  );

  const totalPrice = useMemo(() => {
    const people = Number(personsCount) || 1;
    const flightSum = (Number(outbound?.basePrice) || 0) + (Number(ret?.basePrice) || 0);
    return people * (pricePerPerson + flightSum);
  }, [personsCount, pricePerPerson, outbound, ret]);

  const loadTourAndDepartures = async () => {
    const t = await getTourPublicById(id);
    setTour(t);

    const deps = await getTourDeparturesByTour({ tourId: Number(id), page: 0, size: 2000 });
    setDepartures(deps?.content || []);
  };

  const loadFlights = async (page = 0, overrideSearch) => {
    if (!selectedDepartureId) return;

    const data = await getFlightsForDeparture({
      departureId: Number(selectedDepartureId),
      flightNumber: overrideSearch ?? flightSearch,
      page,
      size: 10,
    });

    setFlightPage(data);
  };

  const submitBooking = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const depId = Number(selectedDepartureId);
      const persons = Number(personsCount) || 1;

      if (!depId) throw new Error("Не выбран вылет тура");
      if (!selectedOutboundId) throw new Error("Не выбран рейс туда");
      if (persons < 1) throw new Error("Количество людей должно быть >= 1");

      const payload = {
        personsCount: persons,
        totalPrice: totalPrice, // сервер пересчитает, но можно отправить
        tourDepartureId: depId,
        outboundFlightId: Number(selectedOutboundId),
        returnFlightId: selectedReturnId ? Number(selectedReturnId) : null,
        // userId НЕ отправляем — берём на бэке из токена
      };

      const created = await createBooking(payload);

      alert(`Бронь создана ✅ (ID: ${created?.id})`);
      navigate("/", { replace: true }); // поменяй роут если у тебя другой
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Ошибка создания бронирования");
    } finally {
      setSubmitting(false);
    }
  };

  // initial load
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadTourAndDepartures();
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки тура/вылетов");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [id]);

  // auto select first departure
  useEffect(() => {
    if (!departures.length) return;
    if (selectedDepartureId) return;
    setSelectedDepartureId(String(departures[0].id));
    // eslint-disable-next-line
  }, [departures]);

  // when departure changes: reset and load flights
  useEffect(() => {
    if (!selectedDepartureId) return;

    (async () => {
      try {
        setError(null);
        setFlightSearch("");
        setSelectedOutboundId(null);
        setSelectedReturnId(null);

        await loadFlights(0, "");
      } catch (e) {
        setError(e?.response?.data?.message || "Ошибка загрузки рейсов для вылета");
      }
    })();
    // eslint-disable-next-line
  }, [selectedDepartureId]);

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
        <div>
          <h3 className="mb-0">Бронирование тура</h3>
          {tour && (
            <div className="text-muted">
              #{tour.id} — <b>{tour.title}</b> ({tour.baseCityName})
            </div>
          )}
        </div>

        <Button as={Link} to="/tours" variant="outline-secondary" disabled={submitting}>
          ← Назад
        </Button>
      </div>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {/* 1) Departure */}
      <Card className="mb-3">
        <Card.Body>
          <Form.Label className="mb-2">Выберите вылет тура</Form.Label>

          <Form.Select
            value={selectedDepartureId}
            onChange={(e) => setSelectedDepartureId(e.target.value)}
            disabled={submitting}
          >
            {departures.map((d) => (
              <option key={d.id} value={d.id}>
                #{d.id} | {d.startDate} → {d.endDate} | {d.status} | мест: {d.capacityReserved}/{d.capacityTotal}
              </option>
            ))}
          </Form.Select>

          <div className="mt-2 small">
            Цена проживания/тура за 1 человека: <Badge bg="secondary">{pricePerPerson}</Badge>
          </div>
        </Card.Body>
      </Card>

      {/* 2) Flights */}
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Выбор рейсов</h5>
            <div className="d-flex gap-2 align-items-center">
              <span className="small text-muted">Людей:</span>
              <Form.Control
                type="number"
                min={1}
                value={personsCount}
                onChange={(e) => setPersonsCount(Number(e.target.value) || 1)}
                style={{ width: 110 }}
                disabled={submitting}
              />
            </div>
          </div>

          <Form
            className="my-3"
            onSubmit={(e) => {
              e.preventDefault();
              loadFlights(0);
            }}
          >
            <div className="d-flex gap-2">
              <Form.Control
                placeholder="Поиск по номеру рейса (SU100)"
                value={flightSearch}
                onChange={(e) => setFlightSearch(e.target.value)}
                disabled={submitting}
              />
              <Button type="submit" variant="secondary" disabled={submitting}>
                Найти
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                disabled={submitting}
                onClick={() => {
                  setFlightSearch("");
                  loadFlights(0, "");
                }}
              >
                Сброс
              </Button>
            </div>
          </Form>

          <Table bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Туда</th>
                <th style={{ width: 90 }}>Обратно</th>
                <th>Номер</th>
                <th>Авиакомпания</th>
                <th>Аэропорт вылета</th>
                <th>Аэропорт прилёта</th>
                <th>Вылет</th>
                <th>Прилёт</th>
                <th style={{ width: 120 }}>Цена</th>
              </tr>
            </thead>
            <tbody>
              {flightPage.content?.length ? (
                flightPage.content.map((f) => (
                  <tr key={f.id}>
                    <td className="text-center">
                      <Form.Check
                        type="radio"
                        name="outbound"
                        checked={selectedOutboundId === f.id}
                        onChange={() => pickOutbound(f.id)}
                        disabled={submitting}
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="radio"
                        name="return"
                        checked={selectedReturnId === f.id}
                        disabled={submitting || selectedOutboundId === f.id}
                        onChange={() => pickReturn(f.id)}
                      />
                    </td>
                    <td>
                      <b>{f.flightNumber}</b>
                    </td>
                    <td>{f.carrier}</td>
                    <td>{f.departureAirportName}</td>
                    <td>{f.arrivalAirportName}</td>
                    <td>{String(f.departAt).slice(0, 16).replace("T", " ")}</td>
                    <td>{String(f.arriveAt).slice(0, 16).replace("T", " ")}</td>
                    <td>
                      <Badge bg="secondary">{f.basePrice}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center">
                    Рейсы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <div className="small text-muted">
              Страница: {flightPage.page + 1} / {flightPage.totalPages || 1} (всего: {flightPage.totalElements})
            </div>

            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                disabled={submitting || flightPage.page <= 0}
                onClick={() => loadFlights(flightPage.page - 1)}
              >
                Назад
              </Button>
              <Button
                variant="outline-secondary"
                disabled={submitting || flightPage.page >= (flightPage.totalPages || 1) - 1}
                onClick={() => loadFlights(flightPage.page + 1)}
              >
                Вперёд
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* 3) Summary */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-2">Итог</h5>

          <div className="small">
            <div>Тур: <b>{tour?.title}</b></div>
            <div>Вылет: <b>#{selectedDepartureId || "—"}</b></div>
            <div>Рейс туда: <b>{outbound ? `${outbound.flightNumber} (${outbound.basePrice})` : "—"}</b></div>
            <div>Рейс обратно: <b>{ret ? `${ret.flightNumber} (${ret.basePrice})` : "—"}</b></div>
            <div>Людей: <b>{Number(personsCount) || 1}</b></div>
          </div>

          <div className="mt-3">
            <h4 className="mb-0">Итого: {totalPrice}</h4>
            <div className="text-muted small">(при отправке будет создана бронь со статусом PENDING)</div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <Button
              disabled={submitting || !selectedDepartureId || !selectedOutboundId}
              onClick={submitBooking}
            >
              {submitting ? "Отправка..." : "Отправить бронь"}
            </Button>

            <Button variant="outline-secondary" onClick={() => navigate("/tours")} disabled={submitting}>
              Отмена
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
