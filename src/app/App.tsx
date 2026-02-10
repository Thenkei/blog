import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AppRouter } from "./router";

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRouter />
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
}
