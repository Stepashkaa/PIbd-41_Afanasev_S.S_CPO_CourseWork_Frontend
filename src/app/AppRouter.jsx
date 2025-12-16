// router.jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import RoleGate from "../components/layout/RoleGate";

import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";

import HomePage from "../pages/common/HomePage";
import NotFoundPage from "../pages/common/NotFoundPage";

import PageCities from "../pages/admin/cities/PageCities";
import CreateCity from "../pages/admin/cities/CreateCity";
import EditCity from "../pages/admin/cities/EditCity";

import PageAirports from "../pages/admin/airports/PageAirports.jsx";
import CreateAirport from "../pages/admin/airports/CreateAirport.jsx";
import EditAirport from "../pages/admin/airports/EditAirport.jsx";

import PageUsers from "../pages/admin/users/PageUsers.jsx";
import CreateUser from "../pages/admin/users/CreateUser.jsx";
import EditUser from "../pages/admin/users/EditUser.jsx";

import PageTours from "../pages/admin/tours/PageTours.jsx";
import CreateTour from "../pages/admin/tours/CreateTour.jsx";
import EditTour from "../pages/admin/tours/EditTour.jsx";

import PageToursPublic from "../pages/user/tours/PageToursPublic.jsx";
import PageMyTours from "../pages/manager/tours/PageMyTours.jsx";

import PageFlights from "../pages/admin/flights/PageFlights.jsx";
import CreateFlight from "../pages/admin/flights/CreateFlight.jsx";
import EditFlight from "../pages/admin/flights/EditFlight.jsx";

import PageTourDepartures from "../pages/admin/tourDepartures/PageTourDepartures.jsx";
import CreateTourDeparture from "../pages/admin/tourDepartures/CreateTourDeparture.jsx";
import EditTourDeparture from "../pages/admin/tourDepartures/EditTourDeparture.jsx";

import PageTourDepartureFlightBind from "../pages/common/bindings/PageTourDepartureFlightBind.jsx";

import PageTourBooking from "../pages/user/bookings/PageTourBooking.jsx";

import PageMyBookings from "../pages/user/bookings/PageMyBookings.jsx";

import PageBookingsAdmin from "../pages/admin/bookings/PageBookingsAdmin.jsx";
import EditBookingStatusAdmin from "../pages/admin/bookings/EditBookingStatusAdmin.jsx";


export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ADMIN: Cities */}
      <Route
        path="/admin/cities"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <PageCities />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cities/create"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <CreateCity />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cities/edit/:id"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <EditCity />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      {/* ADMIN: Airports */}
      <Route
        path="/admin/airports"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <PageAirports />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/airports/create"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <CreateAirport />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/airports/edit/:id"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <EditAirport />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      {/* ADMIN: Users */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <PageUsers />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/create"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <CreateUser />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/edit/:id"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <EditUser />
            </RoleGate>
          </ProtectedRoute>
        }
      />

    {/* ADMIN: tours */}
      <Route
        path="/admin/tours"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <PageTours />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tours/create"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <CreateTour />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tours/edit/:id"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <EditTour />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      {/* MANAGER: My Tours */}
      <Route
        path="/manager/tours"
        element={
          <ProtectedRoute>
            <RoleGate allow={["MANAGER"]}>
              <PageMyTours />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      {/* USER: Tours */}
      <Route
        path="/tours"
        element={
          <ProtectedRoute>
            <RoleGate allow={["USER"]}>
              <PageToursPublic />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tours/:id/book"
        element={
          <ProtectedRoute>
            <RoleGate allow={["USER"]}>
              <PageTourBooking />
            </RoleGate>
          </ProtectedRoute>
        }
      />


      {/* ADMIN: Flights */}
      <Route
        path="/admin/flights"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <PageFlights />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/flights/create"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <CreateFlight />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/flights/edit/:id"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <EditFlight />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      {/* TourDepartures: ADMIN + MANAGER */}
      <Route
        path="/tour-departures"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN", "MANAGER"]}>
              <PageTourDepartures />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tour-departures/create"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN", "MANAGER"]}>
              <CreateTourDeparture />
            </RoleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tour-departures/edit/:id"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN", "MANAGER"]}>
              <EditTourDeparture />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      {/* Binding page */}
      <Route
        path="/tour-departure-flight-bind"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN", "MANAGER"]}>
              <PageTourDepartureFlightBind />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <RoleGate allow={["USER"]}>
              <PageMyBookings />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      {/* ADMIN: Bookings */}
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <PageBookingsAdmin />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/bookings/edit/:id"
        element={
          <ProtectedRoute>
            <RoleGate allow={["ADMIN"]}>
              <EditBookingStatusAdmin />
            </RoleGate>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
