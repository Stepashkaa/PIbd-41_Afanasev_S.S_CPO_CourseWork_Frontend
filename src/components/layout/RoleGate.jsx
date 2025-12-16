import { useContext } from "react";
import { Navigate } from "react-router-dom";
import StoreContext from "../../stores/StoreContext.js";

export default function RoleGate({ allow, children }) {
  const { store } = useContext(StoreContext);

  if (!store.auth.isAuth) return <Navigate to="/login" replace />;
  if (!allow.includes(store.auth.role)) return <Navigate to="/" replace />;

  return children;
}
