import { useEffect, useState } from "react";
import { Button, Container, Form, Table, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getCitiesPaged, deleteCity, searchCitiesFree, getCitiesAll } from "../../../services/cityService.js";

export default function PageCities() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [countries, setCountries] = useState([]);

  // черновик (то что в инпутах)
  const [draftMode, setDraftMode] = useState("filters"); // filters | search
  const [draftQ, setDraftQ] = useState("");
  const [draftCountry, setDraftCountry] = useState("");

  // применённые параметры (по ним реально грузим)
  const [applied, setApplied] = useState({
    mode: "filters",
    q: "",
    country: "",
  });

  const [pageData, setPageData] = useState({
    content: [],
    page: 0,
    size: 0, // приходит с бэка
    totalPages: 0,
    totalElements: 0,
  });

  // 1) грузим страны один раз
  useEffect(() => {
    (async () => {
      try {
        const all = await getCitiesAll();
        const unique = Array.from(
          new Set((all || []).map((c) => (c.country || "").trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b));

        setCountries(unique);
      } catch (e) {
        // не критично, таблица может работать и без списка стран
        console.warn("Не удалось загрузить список стран", e);
      }
    })();
  }, []);

  const load = async (page = 0, params = applied) => {
    try {
      setLoading(true);
      setError(null);

      const data =
        params.mode === "search"
          ? await searchCitiesFree({ q: params.q, page })
          : await getCitiesPaged({ country: params.country || undefined, page });

      setPageData(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка загрузки городов");
    } finally {
      setLoading(false);
    }
  };

  // 2) грузим при изменении применённых параметров или страницы
  useEffect(() => {
    load(pageData.page, applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, pageData.page]);

  const onSubmit = (e) => {
    e.preventDefault();

    // применяем параметры и сбрасываем страницу на 0
    setPageData((p) => ({ ...p, page: 0 }));
    setApplied({
      mode: draftMode,
      q: draftMode === "search" ? draftQ : "",
      country: draftMode === "filters" ? draftCountry : "",
    });
  };

  const onReset = () => {
    // очищаем черновик
    setDraftMode("filters");
    setDraftQ("");
    setDraftCountry("");

    // применяем пустые значения + уходим на первую страницу
    setPageData((p) => ({ ...p, page: 0 }));
    setApplied({ mode: "filters", q: "", country: "" });
  };

   const onDelete = async (id) => {
    if (!confirm("Удалить город?")) return;

    try {
      await deleteCity(id);

      // если удалили последний элемент на странице — откатиться на предыдущую (если можно)
      const shouldGoPrev =
        pageData.content?.length === 1 && pageData.page > 0;

      setPageData((p) => ({ ...p, page: shouldGoPrev ? p.page - 1 : p.page }));
      // загрузка сработает сама через useEffect
    } catch (e) {
      setError(e?.response?.data?.message || "Ошибка удаления");
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
          <h3 className="mb-0">Города</h3>
        </div>

        <Button as={Link} to="/admin/cities/create">
          + Добавить
        </Button>
      </div>

      <Form className="mb-3" onSubmit={onSubmit}>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Select
            style={{ maxWidth: 180 }}
            value={draftMode}
            onChange={(e) => setDraftMode(e.target.value)}
          >
            <option value="filters">Фильтр</option>
            <option value="search">Поиск</option>
          </Form.Select>

          {draftMode === "search" ? (
            <Form.Control
              placeholder="Поиск (название или страна)"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
            />
          ) : (
            <Form.Select
              value={draftCountry}
              onChange={(e) => setDraftCountry(e.target.value)}
              style={{ minWidth: 260 }}
            >
              <option value="">Все страны</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Form.Select>
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
                <th style={{ width: 90 }}>ID</th>
                <th>Название</th>
                <th>Страна</th>
                <th style={{ width: 220 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pageData.content?.length ? (
                pageData.content.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.country}</td>
                    <td className="d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/admin/cities/edit/${c.id}`}
                        size="sm"
                        variant="outline-primary"
                      >
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => onDelete(c.id)}
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center">
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
