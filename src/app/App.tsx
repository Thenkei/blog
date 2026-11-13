import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MDXProvider } from "@mdx-js/react";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AppRouter } from "./router";
import { mdxComponents } from "./mdxComponents";

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <MDXProvider components={mdxComponents}>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRouter />
          </BrowserRouter>
        </MDXProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
