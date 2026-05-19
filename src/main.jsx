import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RegionProvider } from "./context/RegionContext";
import "./index.css";
import App from "./App.jsx";
import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <RegionProvider>
          <App />
        </RegionProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
