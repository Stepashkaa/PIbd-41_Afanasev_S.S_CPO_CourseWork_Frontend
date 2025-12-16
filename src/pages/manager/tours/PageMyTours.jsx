import { useEffect, useState } from "react";
import { Alert, Badge, Button, Container, Form, Spinner, Table } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getMyToursPaged } from "../../../services/tourService";

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default function PageMyTours() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [filters, setFilters] = useState({ status: "", active: "" });

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    size: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const statusBadge = (s) => {
    const map = { DRAFT: "secondary", PUBLISHED: "success", ARCHIVED: "dark" };
    return <Badge bg={map[s] || "secondary"}>{s}</Badge>;
  };

  const load = async (page = 0, override = {}) => {
    try {
      setLoading(true);
      setError(null);

      const titleVal = override.title ?? title;
      const filtersVal = override.filters ?? filters;

      const activeVal =
        override.activeValue ??
        (filtersVal.active === "" ? undefined : filtersVal.active === "true");

      const data = await getMyToursPaged({
        title: titleVal,
        status: filtersVal.status || undefined,
        active: activeVal,
        page,
      });

      setPageData(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки туров");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    await load(0);
  };

  const onReset = async () => {
    const emptyFilters = { status: "", active: "" };
    setTitle("");
    setFilters(emptyFilters);
    await load(0, { title: "", filters: emptyFilters, activeValue: undefined });
  };

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= pageData.totalPages - 1;

  return (
    <Container className="mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/", { replace: true })}>
            ← Назад
          </Button>
          <h3 className="mb-0">Мои туры</h3>
        </div>

      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Control
            style={{ minWidth: 240 }}
            placeholder="Поиск по названию"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Form.Select
            style={{ maxWidth: 180 }}
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">Статус (все)</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Form.Select>

          <Form.Select
            style={{ maxWidth: 180 }}
            value={filters.active}
            onChange={(e) => setFilters((p) => ({ ...p, active: e.target.value }))}
          >
            <option value="">Активность (все)</option>
            <option value="true">Активные</option>
            <option value="false">Неактивные</option>
          </Form.Select>

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
                <th>Название</th>
                <th style={{ width: 120 }}>Дней</th>
                <th style={{ width: 140 }}>Цена</th>
                <th style={{ width: 140 }}>Статус</th>
                <th style={{ width: 110 }}>Активен</th>
                <th>Город</th>
                <th style={{ width: 170 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? (
                pageData.content.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>
                      <div className="fw-semibold">{t.title}</div>
                      {t.description && <div className="text-muted small">{t.description}</div>}
                    </td>
                    <td>{t.durationDays}</td>
                    <td>{t.basePrice}</td>
                    <td>{statusBadge(t.status)}</td>
                    <td>{t.active ? "Да" : "Нет"}</td>
                    <td>{t.baseCityName}</td>
                    <td className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        disabled
                        title="Появится после реализации TourDeparture"
                      >
                        Вылеты
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
              Страница: {pageData.page + 1} / {pageData.totalPages || 1} (всего:{" "}
              {pageData.totalElements})
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                disabled={prevDisabled}
                onClick={() => load(pageData.page - 1)}
              >
                Назад
              </Button>
              <Button
                variant="outline-secondary"
                disabled={nextDisabled}
                onClick={() => load(pageData.page + 1)}
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
