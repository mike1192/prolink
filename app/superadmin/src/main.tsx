import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useBranding, applyBrandingToDocument } from "./lib/branding-store";

// Apply persisted branding before render and on every change
applyBrandingToDocument(useBranding.getState());
useBranding.subscribe((s) => applyBrandingToDocument(s));

createRoot(document.getElementById("root")!).render(<App />);
