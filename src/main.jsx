import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./App.css"; // reuse the cyber background
import { Authenticator } from "@aws-amplify/ui-react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="cyber-bg">
      <div className="cyber-overlay"></div>
      <div className="auth-wrapper">
        <Authenticator>
          <App />
        </Authenticator>
      </div>
    </div>
  </React.StrictMode>
);
