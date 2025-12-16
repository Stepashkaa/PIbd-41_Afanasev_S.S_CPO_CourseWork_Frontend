import { useContext } from "react";
import { Navbar, Container, Nav, Button, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import StoreContext from "../../stores/StoreContext.js";

export default function AppNavbar() {
  const { store } = useContext(StoreContext);
  const navigate = useNavigate();

  const role = store?.auth?.role || null;

  const onLogout = () => {
    store.auth.logout();
    navigate("/login");
  };

  return (
    <Navbar bg="light" expand="lg" className="mb-3 border-bottom">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <span>TourAgency</span>

          {store.auth.isAuth && role === "ADMIN" && (
            <Badge bg="primary">Админ-панель</Badge>
          )}
          {store.auth.isAuth && role === "MANAGER" && (
            <Badge bg="success">Менеджер</Badge>
          )}
          {store.auth.isAuth && role === "USER" && (
            <Badge bg="secondary">Пользователь</Badge>
          )}
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="nav" />
        <Navbar.Collapse id="nav">
          <Nav className="me-auto">
            {store.auth.isAuth && role === "ADMIN" && (
              <>
                <Nav.Link as={Link} to="/admin/cities">Города</Nav.Link>
                <Nav.Link as={Link} to="/admin/airports">Аэропорты</Nav.Link>
                <Nav.Link as={Link} to="/admin/users">Пользователи</Nav.Link>
              </>
            )}

            {store.auth.isAuth && role === "ADMIN" && (
              <>
                <Nav.Link as={Link} to="/admin/tours">Туры</Nav.Link>
                <Nav.Link as={Link} to="/tour-departures">Вылеты</Nav.Link>
                <Nav.Link as={Link} to="/admin/flights">Рейсы</Nav.Link>
                <Nav.Link as={Link} to="/tour-departure-flight-bind">Привязка рейсов</Nav.Link>
              </>
            )}

            {store.auth.isAuth && role === "MANAGER" && (
              <>
                <Nav.Link as={Link} to="/manager/tours">Мои туры</Nav.Link>
                <Nav.Link as={Link} to="/tour-departure-flight-bind">Привязка рейсов</Nav.Link>
                <Nav.Link as={Link} to="/tour-departures">Вылеты</Nav.Link>
              </>
            )}

            {store.auth.isAuth && role === "USER" && (
              <>
                <Nav.Link as={Link} to="/tours">Туры</Nav.Link>
                <Nav.Link as={Link} to="/bookings">Мои брони</Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="ms-auto align-items-center">
            {!store.auth.isAuth ? (
              <>
                <Nav.Link as={Link} to="/login">Вход</Nav.Link>
                <Nav.Link as={Link} to="/register">Регистрация</Nav.Link>
              </>
            ) : (
              <>
                <Navbar.Text className="me-3">
                  {store.auth.email} ({role})
                </Navbar.Text>
                <Button variant="outline-danger" onClick={onLogout}>
                  Выйти
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
