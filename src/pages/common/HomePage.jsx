import { useContext } from "react";
import { Alert, Button, Card, Col, Row, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import StoreContext from "../../stores/StoreContext";

export default function HomePage() {
  const { store } = useContext(StoreContext);
  const role = store?.auth?.role || null;

  return (
    <Container className="mt-3" style={{ maxWidth: 1100 }}>
      {!store.auth.isAuth ? (
        <Alert variant="info">
          Главная страница. Войдите в систему, чтобы открыть доступные разделы.
        </Alert>
      ) : (
        <>
          <Alert variant="success">
            Главная страница. Вы вошли как <b>{role}</b> ({store.auth.email})
          </Alert>

          <Row className="g-3">
            {role === "ADMIN" && (
              <>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Города</Card.Title>
                      <Card.Text>Управление городами</Card.Text>
                      <Button as={Link} to="/admin/cities">
                        Открыть
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Аэропорты</Card.Title>
                      <Card.Text>Управление аэропортами</Card.Text>
                      <Button as={Link} to="/admin/airports">Открыть</Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Пользователи</Card.Title>
                      <Card.Text>Управление пользователями</Card.Text>
                      <Button as={Link} to="/admin/users">
                        Открыть
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Рейсы</Card.Title>
                      <Card.Text>Управление рейсами (CRUD)</Card.Text>
                      <Button as={Link} to="/admin/flights">
                        Открыть
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Бронирования</Card.Title>
                      <Card.Text>Просмотр и смена статусов</Card.Text>
                      <Button as={Link} to="/admin/bookings">Открыть</Button>
                    </Card.Body>
                  </Card>
                </Col>
              </>
            )}

            {(role === "ADMIN" || role === "MANAGER") && (
              <>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Туры</Card.Title>
                      <Card.Text>Создание и управление турами</Card.Text>

                      <Button
                        as={Link}
                        to={role === "MANAGER" ? "/manager/tours" : "/admin/tours"}
                      >
                        Открыть
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Вылеты туров</Card.Title>
                      <Card.Text>Даты, места, привязка рейсов</Card.Text>
                      <Button as={Link} to="/tour-departures">
                        Открыть
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Привязка рейсов</Card.Title>
                      <Card.Text>Привязка рейсов к вылетам туров</Card.Text>
                      <Button as={Link} to="/tour-departure-flight-bind">
                        Открыть
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </>
            )}

            {role === "USER" && (
              <>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Туры</Card.Title>
                      <Card.Text>Просмотр доступных туров</Card.Text>
                      <Button as={Link} to="/tours">
                        Открыть
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>Мои бронирования</Card.Title>
                      <Card.Text>Просмотр ваших броней</Card.Text>
                      <Button as={Link} to="/bookings">
                        Открыть
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </>
            )}
          </Row>
        </>
      )}
    </Container>
  );
}
