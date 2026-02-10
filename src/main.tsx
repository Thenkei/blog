import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n/config";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/reading.css";
import "./styles/components.css";
import "./styles/footer.css";
import "./styles/animations.css";
import "./styles/responsive.css";
import "highlight.js/styles/github-dark.css";
import App from "./app/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
