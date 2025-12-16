import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container className="mt-3 text-center">
      <h4>404 — Страница не найдена</h4>
      <p className="text-muted">
        Такой страницы не существует или у вас нет доступа
      </p>

      <Button
        className="mt-3"
        variant="primary"
        onClick={() => navigate("/", { replace: true })}
      >
        На главную
      </Button>
    </Container>
  );
}
