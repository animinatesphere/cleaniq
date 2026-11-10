import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RegionProvider } from "./context/RegionContext";
import "./index.css";
import App from "./App.jsx";
import { HelmetProvider } from "react-helmet-async";

// Pre-rendered pages and the app shell ship their own <title>, description, canonical, Open Graph
// tags and JSON-LD for crawlers (marked data-ssr). The page components add the same tags again
// when they render, so remove the server copies first to avoid duplicates.
document.querySelectorAll("head [data-ssr]").forEach((el) => el.remove());

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
