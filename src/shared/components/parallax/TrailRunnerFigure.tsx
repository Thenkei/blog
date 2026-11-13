/**
 * The Mountain theme's trail runner, shared by the home hero and the article
 * reading progress.
 *
 * Drawn facing right with its feet on the origin, about 66 units tall. The
 * parent `<g>` positions it and carries `data-stride="a" | "b"`, which selects
 * one of the two leg poses (styles in `base.css`).
 */

type TrailRunnerFigureProps = {
  /** Paint server for the headlamp beam, e.g. `url(#id)`. Omit for no beam. */
  headlampFill?: string | undefined;
};

function RunnerPose({ variant }: { variant: "a" | "b" }) {
  if (variant === "a") {
    return (
      <>
        <path d="M2 -47 L-8 -40 L-13 -31" />
        <path d="M-3 -29 L-10 -15 L-22 -12 L-25 -17" />
        <path d="M-3 -29 L9 -18 L12 -3 L19 -2" />
        <path d="M3 -47 L12 -39 L19 -45" />
      </>
    );
  }

  return (
    <>
      <path d="M2 -47 L8 -38 L15 -40" />
      <path d="M-3 -29 L6 -19 L-4 -10 L-8 -14" />
      <path d="M-3 -29 L4 -16 L1 -2 L8 -1" />
      <path d="M3 -47 L-5 -39 L-9 -30" />
    </>
  );
}

export function TrailRunnerFigure({ headlampFill }: TrailRunnerFigureProps) {
  return (
    <>
      {headlampFill ? (
        <ellipse
          className="mountain-runner-headlamp"
          cx="30"
          cy="-54"
          rx="30"
          ry="12"
          fill={headlampFill}
        />
      ) : null}
      {(["a", "b"] as const).map((variant) => (
        <g
          key={variant}
          className={`mountain-runner-pose mountain-runner-pose-${variant}`}
        >
          <g className="mountain-runner-outline">
            <RunnerPose variant={variant} />
            <path d="M3 -49 L-3 -29" />
          </g>
          <g className="mountain-runner-limbs">
            <RunnerPose variant={variant} />
          </g>
        </g>
      ))}
      <path
        className="mountain-runner-pack"
        d="M-4 -51 q-9 1 -10 9 l1 10 q5 4 10 0 Z"
      />
      <path className="mountain-runner-torso" d="M3 -49 L-3 -29" />
      <circle className="mountain-runner-head" cx="7" cy="-58" r="6.6" />
    </>
  );
}
