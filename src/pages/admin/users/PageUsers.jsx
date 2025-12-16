import { useEffect, useState } from "react";
import { Button, Container, Form, Table, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { deleteUser, getUsersPaged } from "../../../services/userService.js";

const ROLE_OPTIONS = ["", "USER", "MANAGER", "ADMIN"];
const ACTIVE_OPTIONS = [
  { value: "", label: "Все" },
  { value: "true", label: "Активные" },
  { value: "false", label: "Неактивные" },
];

export default function PageUsers() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // режим: filters | search
  const [mode, setMode] = useState("filters");
  const [q, setQ] = useState("");

  const [filters, setFilters] = useState({
    role: "",
    active: "",
  });

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    size: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const load = async (page = 0, nextMode = mode, nextQ = q, nextFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const data =
        nextMode === "search"
          ? await getUsersPaged({ q: nextQ, page })
          : await getUsersPaged({
              q: "",
              role: nextFilters.role || undefined,
              active:
                nextFilters.active === ""
                  ? undefined
                  : nextFilters.active === "true",
              page,
            });

      setPageData(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    load(0);
  };

  const onReset = () => {
    const nextFilters = { role: "", active: "" };
    setFilters(nextFilters);
    setQ("");

    // важно: сразу грузим уже с очищенными значениями
    load(0, mode, "", nextFilters);
  };

  const onDelete = async (id) => {
    if (!confirm("Удалить пользователя?")) return;
    try {
      await deleteUser(id);
      await load(Math.max(0, pageData.page));
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка удаления пользователя");
    }
  };

  const prevDisabled = pageData.page <= 0;
  const nextDisabled = pageData.page >= pageData.totalPages - 1;

  return (
    <Container className="mt-3" style={{ maxWidth: 1100 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => navigate("/", { replace: true })}
          >
            ← Назад
          </Button>
          <h3 className="mb-0">Пользователи</h3>
        </div>

        <Button as={Link} to="/admin/users/create">
          + Добавить
        </Button>
      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Select
            style={{ maxWidth: 180 }}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="filters">Фильтры</option>
            <option value="search">Поиск</option>
          </Form.Select>

          {mode === "search" ? (
            <Form.Control
              placeholder="Поиск (username / email / phone)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          ) : (
            <>
              <Form.Select
                style={{ maxWidth: 220 }}
                value={filters.role}
                onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="">Все роли</option>
                {ROLE_OPTIONS.filter(Boolean).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Form.Select>

              <Form.Select
                style={{ maxWidth: 220 }}
                value={filters.active}
                onChange={(e) => setFilters((p) => ({ ...p, active: e.target.value }))}
              >
                {ACTIVE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Form.Select>
            </>
          )}

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
                <th>Username</th>
                <th>Email</th>
                <th>Телефон</th>
                <th style={{ width: 140 }}>Роль</th>
                <th style={{ width: 110 }}>Активен</th>
                <th style={{ width: 240 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? (
                pageData.content.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || "-"}</td>
                    <td>{u.userRole}</td>
                    <td>{u.active ? "Да" : "Нет"}</td>
                    <td className="d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/admin/users/edit/${u.id}`}
                        size="sm"
                        variant="outline-primary"
                      >
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => onDelete(u.id)}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">
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
