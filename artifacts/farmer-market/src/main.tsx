import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// On Render (and any deployment where the frontend and API are on different
// origins), set VITE_API_BASE_URL to the API service's URL so that all
// generated API hooks resolve correctly instead of hitting the static-site
// origin and getting index.html back as a 200 response.
const apiBase = import.meta.env.VITE_API_BASE_URL;
if (apiBase) {
  setBaseUrl(apiBase);
}

createRoot(document.getElementById("root")!).render(<App />);
