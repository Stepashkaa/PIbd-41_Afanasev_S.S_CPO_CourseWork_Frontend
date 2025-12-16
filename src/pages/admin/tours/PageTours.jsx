import { useEffect, useState } from "react";
import { Button, Container, Form, Table, Spinner, Alert, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getToursPaged, deleteTour } from "../../../services/tourService.js";
import { getCitiesAll } from "../../../services/cityService.js";
import { getUsersAll } from "../../../services/userService.js";

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default function PageTours() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cities, setCities] = useState([]);
  const [managers, setManagers] = useState([]);

  // поиск
  const [title, setTitle] = useState("");

  // фильтры (все селекты)
  const [filters, setFilters] = useState({
    baseCityId: "",
    status: "",
    active: "",
    managerUserId: "",
  });

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    size: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const load = async (
    page = 0,
    override = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      const titleVal = override.title ?? title;
      const filtersVal = override.filters ?? filters;

      const activeVal =
        override.activeValue ??
        (filtersVal.active === "" ? undefined : filtersVal.active === "true");

      const data = await getToursPaged({
        title: titleVal,
        baseCityId: filtersVal.baseCityId ? Number(filtersVal.baseCityId) : undefined,
        status: filtersVal.status || undefined,
        active: activeVal,
        managerUserId: filtersVal.managerUserId ? Number(filtersVal.managerUserId) : undefined,
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
    (async () => {
      try {
        // города для фильтра
        const c = await getCitiesAll();
        setCities(c || []);

        // менеджеры для фильтра (берём всех и фильтруем по роли)
        const u = await getUsersAll();
        setManagers((u || []).filter((x) => x.userRole === "MANAGER" && x.active));
      } catch (e) {
        // не блокируем таблицу, но покажем ошибку
        setError(e?.response?.data?.message || "Ошибка загрузки справочников");
      } finally {
        await load(0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    await load(0);
  };

const onReset = async () => {
  const emptyFilters = { baseCityId: "", status: "", active: "", managerUserId: "" };

  setTitle("");
  setFilters(emptyFilters);

  await load(0, { title: "", filters: emptyFilters, activeValue: undefined });
};

  const onDelete = async (id) => {
    if (!confirm("Удалить тур?")) return;
    try {
      await deleteTour(id);
      await load(Math.max(0, pageData.page));
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка удаления тура");
    }
  };

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= pageData.totalPages - 1;

  const statusBadge = (s) => {
    const map = {
      DRAFT: "secondary",
      PUBLISHED: "success",
      ARCHIVED: "dark",
    };
    return <Badge bg={map[s] || "secondary"}>{s}</Badge>;
  };

  return (
    <Container className="mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/", { replace: true })}>
            ← Назад
          </Button>
          <h3 className="mb-0">Туры</h3>
        </div>

        <Button as={Link} to="/admin/tours/create">
          + Добавить
        </Button>
      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Control
            style={{ minWidth: 240 }}
            placeholder="Поиск по названию тура"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Form.Select
            style={{ maxWidth: 220 }}
            value={filters.baseCityId}
            onChange={(e) => setFilters((p) => ({ ...p, baseCityId: e.target.value }))}
          >
            <option value="">Город (все)</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.country}
              </option>
            ))}
          </Form.Select>

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

          <Form.Select
            style={{ maxWidth: 240 }}
            value={filters.managerUserId}
            onChange={(e) => setFilters((p) => ({ ...p, managerUserId: e.target.value }))}
          >
            <option value="">Менеджер (все)</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.username} ({m.email})
              </option>
            ))}
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
                <th>Менеджер</th>
                <th style={{ width: 220 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? (
                pageData.content.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.durationDays}</td>
                    <td>{t.basePrice}</td>
                    <td>{statusBadge(t.status)}</td>
                    <td>{t.active ? "Да" : "Нет"}</td>
                    <td>{t.baseCityName}</td>
                    <td>{t.managerUsername || "—"}</td>
                    <td className="d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/admin/tours/edit/${t.id}`}
                        size="sm"
                        variant="outline-primary"
                      >
                        Редактировать
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => onDelete(t.id)}>
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center">
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
