import type { ReactNode } from "react";

type InlineArticleDiagramProps = {
  svg: string;
  children: ReactNode;
};

export function InlineArticleDiagram({ svg, children }: InlineArticleDiagramProps) {
  return (
    <figure className="article-figure" data-inline-article-diagram>
      <div
        className="article-figure-svg"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption>{children}</figcaption>
    </figure>
  );
}
