import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MDXProvider } from "@mdx-js/react";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AppRouter } from "./router";
import { GlobalHeader } from "../shared/components/GlobalHeader";

import type { ComponentProps } from "react";

const components = {
  img: (props: ComponentProps<"img">) => (
    <img loading="lazy" decoding="async" {...props} />
  ),
  picture: (props: ComponentProps<"picture">) => <picture {...props} />,
};

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <MDXProvider components={components}>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <GlobalHeader />
            <AppRouter />
          </BrowserRouter>
        </MDXProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
