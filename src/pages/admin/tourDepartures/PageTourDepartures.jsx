import { useContext, useEffect, useState } from "react";
import { Alert, Badge, Button, Container, Form, Spinner, Table } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StoreContext from "../../../stores/StoreContext";

import { getTourDeparturesPaged, getMyTourDeparturesPaged, deleteTourDeparture } from "../../../services/tourDepartureService.js";
import { getToursPaged, getMyToursPaged } from "../../../services/tourService.js";

const STATUSES = ["PLANNED", "SALES_CLOSED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function PageTourDepartures() {
  const navigate = useNavigate();
  const { store } = useContext(StoreContext);
  const role = store?.auth?.role || null;

  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tours, setTours] = useState([]);

  // черновик (то что в инпутах)
  const [draftTourId, setDraftTourId] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftStartFrom, setDraftStartFrom] = useState("");
  const [draftStartTo, setDraftStartTo] = useState("");

  // применённые параметры (по ним реально грузим)
  const [applied, setApplied] = useState({
    tourId: "",
    status: "",
    startFrom: "",
    startTo: "",
  });

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    size: 0, // приходит с бэка
    totalPages: 0,
    totalElements: 0,
  });

  useEffect(() => {
  const tourIdFromUrl = searchParams.get("tourId") || "";
  if (!tourIdFromUrl) return;

  setDraftTourId(tourIdFromUrl);
  setPageData((p) => ({ ...p, page: 0 }));
  setApplied((p) => ({ ...p, tourId: tourIdFromUrl }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // 1) список туров для фильтра — один раз
  useEffect(() => {
    (async () => {
      try {
        const data =
          role === "MANAGER"
            ? await getMyToursPaged({
                title: "",
                baseCityId: "",
                status: "",
                active: "",
                page: 0,
                size: 2000,
              })
            : await getToursPaged({
                title: "",
                baseCityId: "",
                status: "",
                active: "",
                managerUserId: "",
                page: 0,
                size: 2000,
              });

        setTours(data?.content || []);
      } catch (e) {
        console.warn("Не удалось загрузить туры для фильтра", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (page = 0, params = applied) => {
    try {
      setLoading(true);
      setError(null);

      const data = await (role === "MANAGER" ? getMyTourDeparturesPaged : getTourDeparturesPaged)({
        tourId: params.tourId ? Number(params.tourId) : undefined,
        status: params.status || undefined,
        startFrom: params.startFrom || undefined,
        startTo: params.startTo || undefined,
        page,
        // size не передаем — используем дефолт на бэке
      });

      setPageData(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки вылетов");
    } finally {
      setLoading(false);
    }
  };

  // 2) грузим при изменении applied или текущей страницы
  useEffect(() => {
    load(pageData.page, applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, pageData.page]);

  const onSubmit = (e) => {
    e.preventDefault();

    // применяем параметры и сбрасываем страницу на 0
    setPageData((p) => ({ ...p, page: 0 }));
    setApplied({
      tourId: draftTourId,
      status: draftStatus,
      startFrom: draftStartFrom,
      startTo: draftStartTo,
    });
  };

  const onReset = () => {
    // очищаем черновик
    setDraftTourId("");
    setDraftStatus("");
    setDraftStartFrom("");
    setDraftStartTo("");

    // применяем пустые значения + уходим на первую страницу
    setPageData((p) => ({ ...p, page: 0 }));
    setApplied({ tourId: "", status: "", startFrom: "", startTo: "" });
  };

  const onDelete = async (id) => {
    if (!confirm("Удалить вылет тура?")) return;

    try {
      await deleteTourDeparture(id);

      // если удалили последний элемент на странице — откатиться на предыдущую (если можно)
      const shouldGoPrev = pageData.content?.length === 1 && pageData.page > 0;

      setPageData((p) => ({ ...p, page: shouldGoPrev ? p.page - 1 : p.page }));
      // загрузка сработает сама через useEffect
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка удаления");
    }
  };

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= pageData.totalPages - 1;

  return (
    <Container className="mt-3" style={{ maxWidth: 1200 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/", { replace: true })}>
            ← Назад
          </Button>
          <h3 className="mb-0">Вылеты туров</h3>
        </div>

        <Button as={Link} to="/tour-departures/create">
          + Добавить
        </Button>
      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Select
            value={draftTourId}
            onChange={(e) => setDraftTourId(e.target.value)}
            style={{ maxWidth: 420 }}
          >
            <option value="">Все туры</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.id} — {t.title} ({t.baseCityName})
              </option>
            ))}
          </Form.Select>

          <Form.Select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="">Все статусы</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Form.Select>

          <Form.Control
            type="date"
            value={draftStartFrom}
            onChange={(e) => setDraftStartFrom(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <Form.Control
            type="date"
            value={draftStartTo}
            onChange={(e) => setDraftStartTo(e.target.value)}
            style={{ maxWidth: 200 }}
          />

          <Button type="submit" variant="secondary">
            Применить
          </Button>
          <Button type="button" variant="outline-secondary" onClick={onReset}>
            Сброс
          </Button>
        </div>
      </Form>

      {error && <Alert variant="danger">{String(error)}</Alert>}

      {loading ? (
        <div className="py-5 text-center">
          <Spinner />
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Тур</th>
                <th style={{ width: 130 }}>Старт</th>
                <th style={{ width: 130 }}>Финиш</th>
                <th style={{ width: 120 }}>Вмест.</th>
                <th style={{ width: 120 }}>Занято</th>
                <th style={{ width: 140 }}>Статус</th>
                <th style={{ width: 220 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? (
                pageData.content.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>
                      {d.tourTitle}{" "}
                      <Badge bg="light" text="dark">
                        tourId={d.tourId}
                      </Badge>
                    </td>
                    <td>{d.startDate}</td>
                    <td>{d.endDate}</td>
                    <td>{d.capacityTotal}</td>
                    <td>{d.capacityReserved}</td>
                    <td>
                      <Badge bg="secondary">{d.status}</Badge>
                    </td>
                    <td className="d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/tour-departures/edit/${d.id}`}
                        size="sm"
                        variant="outline-primary"
                      >
                        Редактировать
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => onDelete(d.id)}>
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center">
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <div>
              Страница: {pageData.page + 1} / {pageData.totalPages || 1} (всего: {pageData.totalElements})
            </div>

            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                disabled={prevDisabled}
                onClick={() => setPageData((p) => ({ ...p, page: p.page - 1 }))}
              >
                Назад
              </Button>
              <Button
                variant="outline-secondary"
                disabled={nextDisabled}
                onClick={() => setPageData((p) => ({ ...p, page: p.page + 1 }))}
              >
                Вперёд
              </Button>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
