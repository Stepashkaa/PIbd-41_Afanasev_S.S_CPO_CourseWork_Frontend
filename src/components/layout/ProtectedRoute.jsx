import { useContext } from "react";
import { Navigate } from "react-router-dom";
import StoreContext from "../../stores/StoreContext.js";

export default function ProtectedRoute({ children }) {
  const { store } = useContext(StoreContext);

  if (!store.auth.isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
