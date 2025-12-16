import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Outlet />
      </div>
    </Container>
  );
}
