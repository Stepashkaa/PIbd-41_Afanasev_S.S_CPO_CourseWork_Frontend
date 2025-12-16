import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import App from "./app/App.jsx";

import StoreContext from "./stores/StoreContext.js";
import store from "./stores/store.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StoreContext.Provider value={{ store }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoreContext.Provider>
  </React.StrictMode>
);
