import AppNavbar from "./AppNavbar";
import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <>
      <AppNavbar />
      <Container className="mt-4">
        <Outlet />
      </Container>
    </>
  );
}
