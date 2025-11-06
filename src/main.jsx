import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./App.css";
import { Authenticator } from "@aws-amplify/ui-react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="cyber-bg">
      <div className="cyber-overlay"></div>

      <div className="login-container">
        <h1 className="portal-title">Cloud Computing Attendance Portal</h1>
        <p className="portal-tagline">
          Secure sign-in for CS442/642 students to mark attendance on
          <strong> Mondays </strong> & <strong> Wednesdays</strong> until
          December 17.
        </p>
        <div className="neon-line"></div>

        <div className="auth-wrapper">
          <Authenticator>
            <App />
          </Authenticator>
        </div>
      </div>
    </div>
  </React.StrictMode>
);
