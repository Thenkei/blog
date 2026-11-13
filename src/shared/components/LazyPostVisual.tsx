import { lazy, Suspense, type ComponentProps } from "react";

const PostVisual = lazy(() =>
  import("./PostVisual").then((module) => ({ default: module.PostVisual })),
);

/**
 * The technical SVG cover, used when a post has no editorial artwork.
 *
 * Every published post has artwork today, so this is a fallback that rarely
 * renders. Importing PostVisual directly made each page pay for the whole
 * diagram system up front; here it is only fetched when it is shown.
 */
export function LazyPostVisual(props: ComponentProps<typeof PostVisual>) {
  return (
    <Suspense fallback={null}>
      <PostVisual {...props} />
    </Suspense>
  );
}
