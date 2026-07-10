import React from "react";
import ReactDOM from "react-dom/client";
import { PermissionsApp } from "./PermissionsApp";
import "./popup/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PermissionsApp />
  </React.StrictMode>
);
