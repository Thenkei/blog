import { useLayoutEffect, type CSSProperties } from "react";
import { MOUNTAIN_SCENE_GEOMETRY as SCENE } from "./mountainSceneGeometry";
import { TrailRunnerFigure } from "./TrailRunnerFigure";

/**
 * Mountain home hero artwork: an alpine valley at first light, with one trail
 * climbing from the foreground to a pass.
 *
 * The three depth planes share a single coordinate system (a 1920 × 1080
 * scene anchored bottom-right, see `scripts/generate-mountain-scene.mjs`), so
 * the route, the runner and the terrain can never drift apart: the trail and
 * the runner live inside the same plane as the slope they sit on.
 *
 * `compact` only changes the framing. Portrait screens look at the right-hand
 * part of the same scene under a much taller sky, which leaves room for the
 * title above the summits.
 */

const WIDE_VIEW_BOX = "0 0 1920 1080";
const COMPACT_VIEW_BOX = "1040 -440 880 1520";

/** Everything left of this and above the frame is still painted (overflow). */
const SKY = { x: -1500, y: -800, width: 3420, height: 1900 };
const SUN = { x: 1800, y: 462 };

type MountainLayerProps = {
  compact: boolean;
};

function viewBoxFor(compact: boolean): string {
  return compact ? COMPACT_VIEW_BOX : WIDE_VIEW_BOX;
}

type MountainSceneProps = MountainLayerProps & {
  /** Called once the planes are in the DOM, and again when the framing changes. */
  onReady?: (() => void) | undefined;
};

/**
 * The three planes, back to front. Loaded on demand: only visitors using the
 * Mountain theme download the scene geometry.
 */
export function MountainScene({ compact, onReady }: MountainSceneProps) {
  useLayoutEffect(() => {
    onReady?.();
  }, [compact, onReady]);

  return (
    <>
      <MountainSkyLayer compact={compact} />
      <MountainFarLayer compact={compact} />
      <MountainNearLayer compact={compact} />
    </>
  );
}

function MountainSkyLayer({ compact }: MountainLayerProps) {
  return (
    <div className="mountain-layer mountain-layer-sky" aria-hidden="true">
      <svg viewBox={viewBoxFor(compact)} focusable="false">
        <defs>
          <linearGradient
            id="mtn-sky"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="-800"
            x2="0"
            y2="720"
          >
            <stop offset="0" stopColor="#030b12" />
            <stop offset="0.5" stopColor="#071d2a" />
            <stop offset="0.7" stopColor="#0e3746" />
            <stop offset="0.84" stopColor="#245a61" />
            <stop offset="0.93" stopColor="#4f8279" />
            <stop offset="1" stopColor="#8b9d83" />
          </linearGradient>
          <radialGradient
            id="mtn-dawn-glow"
            gradientUnits="userSpaceOnUse"
            cx={SUN.x}
            cy={SUN.y}
            r="980"
          >
            <stop offset="0" stopColor="#ffdda0" stopOpacity="0.95" />
            <stop offset="0.16" stopColor="#f6bd7e" stopOpacity="0.62" />
            <stop offset="0.42" stopColor="#dc9470" stopOpacity="0.24" />
            <stop offset="0.72" stopColor="#b9786a" stopOpacity="0.07" />
            <stop offset="1" stopColor="#b9786a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mtn-sun-halo">
            <stop offset="0" stopColor="#fff1c9" stopOpacity="0.85" />
            <stop offset="0.4" stopColor="#ffd995" stopOpacity="0.3" />
            <stop offset="1" stopColor="#ffd995" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mtn-sun-disc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffbe8" />
            <stop offset="1" stopColor="#ffd78c" />
          </linearGradient>
          <linearGradient id="mtn-cloud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9db5b0" stopOpacity="0.08" />
            <stop offset="1" stopColor="#ffc995" stopOpacity="0.42" />
          </linearGradient>
        </defs>

        <rect {...SKY} fill="url(#mtn-sky)" />

        <g className="mountain-stars" fill="#eaf6f2">
          <path d={SCENE.starTiers[0]} opacity="0.92" />
          <path d={SCENE.starTiers[1]} opacity="0.58" />
          <path d={SCENE.starTiers[2]} opacity="0.32" />
        </g>

        <rect {...SKY} className="mountain-dawn-glow" fill="url(#mtn-dawn-glow)" />

        <g className="mountain-clouds" fill="url(#mtn-cloud)">
          <path d="M1290 318 q190 -34 420 -8 q-150 26 -420 8 Z" />
          <path d="M1150 168 q150 -22 330 -4 q-130 20 -330 4 Z" opacity="0.7" />
          <path d="M300 452 q230 -34 500 -8 q-200 26 -500 8 Z" opacity="0.62" />
          <path d="M-640 372 q260 -34 560 -6 q-240 28 -560 6 Z" opacity="0.5" />
          <path d="M1480 96 q120 -18 280 -2 q-110 18 -280 2 Z" opacity="0.5" />
        </g>

        <g className="mountain-sun">
          <circle cx={SUN.x} cy={SUN.y} r="210" fill="url(#mtn-sun-halo)" />
          <circle cx={SUN.x} cy={SUN.y} r="54" fill="url(#mtn-sun-disc)" />
        </g>
      </svg>
    </div>
  );
}

function MountainFarLayer({ compact }: MountainLayerProps) {
  return (
    <div className="mountain-layer mountain-layer-far" aria-hidden="true">
      <svg viewBox={viewBoxFor(compact)} focusable="false">
        <defs>
          <linearGradient
            id="mtn-range-a"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="460"
            x2="0"
            y2="720"
          >
            <stop offset="0" stopColor="#4d7f84" />
            <stop offset="1" stopColor="#76a097" />
          </linearGradient>
          <linearGradient
            id="mtn-range-b"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="530"
            x2="0"
            y2="780"
          >
            <stop offset="0" stopColor="#356469" />
            <stop offset="1" stopColor="#5a8a84" />
          </linearGradient>
          <linearGradient
            id="mtn-massif"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="240"
            x2="0"
            y2="790"
          >
            <stop offset="0" stopColor="#2f5966" />
            <stop offset="0.55" stopColor="#214a56" />
            <stop offset="1" stopColor="#3b6a6b" />
          </linearGradient>
          <linearGradient id="mtn-alpenglow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffcf9e" stopOpacity="0.96" />
            <stop offset="0.32" stopColor="#eda67d" stopOpacity="0.62" />
            <stop offset="0.72" stopColor="#c48f79" stopOpacity="0.16" />
            <stop offset="1" stopColor="#c48f79" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="mtn-mist">
            <stop offset="0" stopColor="#d6e6d8" stopOpacity="0.42" />
            <stop offset="0.6" stopColor="#d6e6d8" stopOpacity="0.14" />
            <stop offset="1" stopColor="#d6e6d8" stopOpacity="0" />
          </radialGradient>
          <clipPath id="mtn-lit-faces">
            {SCENE.massifLit.map((face) => (
              <path key={face.d} d={face.d} />
            ))}
          </clipPath>
        </defs>

        <path d={SCENE.farRangeA} fill="url(#mtn-range-a)" />
        <path d={SCENE.farRangeB} fill="url(#mtn-range-b)" />

        <path d={SCENE.massif} fill="url(#mtn-massif)" />
        <g className="mountain-alpenglow" fill="url(#mtn-alpenglow)">
          {SCENE.massifLit.map((face) => (
            <path key={face.d} d={face.d} opacity={face.strength} />
          ))}
        </g>
        <g fill="#9dbcc6" fillOpacity="0.86">
          {SCENE.massifSnow.map((snow) => (
            <path key={snow} d={snow} />
          ))}
        </g>
        <g
          className="mountain-snow-light"
          clipPath="url(#mtn-lit-faces)"
          fill="#ffe9c9"
        >
          {SCENE.massifSnow.map((snow) => (
            <path key={snow} d={snow} />
          ))}
        </g>

        <g className="mountain-mist" fill="url(#mtn-mist)">
          <ellipse cx="-980" cy="716" rx="620" ry="74" />
          <ellipse cx="-180" cy="700" rx="560" ry="62" />
          <ellipse cx="520" cy="724" rx="640" ry="80" />
          <ellipse cx="1180" cy="700" rx="520" ry="66" />
          <ellipse cx="1760" cy="676" rx="420" ry="58" />
        </g>
      </svg>
    </div>
  );
}

function MountainNearLayer({ compact }: MountainLayerProps) {
  const { pass } = SCENE;

  return (
    <div className="mountain-layer mountain-layer-near" aria-hidden="true">
      <svg viewBox={viewBoxFor(compact)} focusable="false">
        <defs>
          <linearGradient
            id="mtn-hill"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="620"
            x2="0"
            y2="900"
          >
            <stop offset="0" stopColor="#1f4d47" />
            <stop offset="1" stopColor="#123531" />
          </linearGradient>
          <linearGradient
            id="mtn-slope"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="440"
            x2="0"
            y2="1090"
          >
            <stop offset="0" stopColor="#2a5d50" />
            <stop offset="0.4" stopColor="#1a443d" />
            <stop offset="1" stopColor="#0c2724" />
          </linearGradient>
          <linearGradient
            id="mtn-slope-light"
            gradientUnits="userSpaceOnUse"
            x1="860"
            y1="900"
            x2="1880"
            y2="430"
          >
            <stop offset="0" stopColor="#f0c277" stopOpacity="0" />
            <stop offset="0.6" stopColor="#f0c277" stopOpacity="0.1" />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity="0.34" />
          </linearGradient>
          <linearGradient
            id="mtn-rim"
            gradientUnits="userSpaceOnUse"
            x1="760"
            y1="0"
            x2="1920"
            y2="0"
          >
            <stop offset="0" stopColor="#ffe0a8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffe0a8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff0cf" />
          </linearGradient>
          <linearGradient
            id="mtn-route"
            gradientUnits="userSpaceOnUse"
            x1="60"
            y1="1014"
            x2={pass.x}
            y2={pass.y}
          >
            <stop offset="0" stopColor="#e7b062" />
            <stop offset="0.6" stopColor="#f6d48f" />
            <stop offset="1" stopColor="#fff2c6" />
          </linearGradient>
          <radialGradient id="mtn-headlamp" cx="0.1" cy="0.5" r="0.9">
            <stop offset="0" stopColor="#fff3c4" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path d={SCENE.forestHill} fill="url(#mtn-hill)" />
        <path d={SCENE.hillTrees} fill="#163d38" />

        <path d={SCENE.slope} fill="url(#mtn-slope)" />
        <path className="mountain-slope-light" d={SCENE.slope} fill="url(#mtn-slope-light)" />
        <path
          className="mountain-slope-rim"
          d={SCENE.slopeRim}
          fill="none"
          stroke="url(#mtn-rim)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <g className="mountain-contours" fill="none">
          {SCENE.slopeContours.map((contour) => (
            <path key={contour} d={contour} />
          ))}
        </g>

        <path d={SCENE.slopeTreesBack} fill="#10332e" />
        <path d={SCENE.slopeTreesRight} fill="#0d2a26" />

        {SCENE.rocks.map((rock) => (
          <g key={rock.body}>
            <path d={rock.body} fill="#27443f" />
            <path className="mountain-rock-light" d={rock.lit} fill="#b9ab8c" />
          </g>
        ))}

        <g className="mountain-trail-journey">
          <path className="mountain-route-bed" d={SCENE.trail} />
          <path className="mountain-route-dirt" d={SCENE.trail} />
          <path
            className="mountain-route-glow"
            d={SCENE.trail}
            pathLength={1}
          />
          <path
            className="mountain-route-line"
            d={SCENE.trail}
            pathLength={1}
            stroke="url(#mtn-route)"
          />

          {SCENE.checkpoints.map((checkpoint) => (
            <g
              key={checkpoint.at}
              className="mountain-checkpoint"
              style={{ "--checkpoint-at": checkpoint.at } as CSSProperties}
              transform={`translate(${checkpoint.x} ${checkpoint.y})`}
            >
              <circle className="mountain-checkpoint-ring" r="8.5" />
              <circle className="mountain-checkpoint-core" r="3.8" />
            </g>
          ))}

          <g className="mountain-pass" transform={`translate(${pass.x} ${pass.y})`}>
            <circle className="mountain-pass-ring" r="24" />
            <path className="mountain-pass-pole" d="M0 2 V-52" />
            <path className="mountain-pass-flag" d="M0 -52 L30 -43 L0 -33 Z" />
          </g>

          <g
            className="mountain-cinematic-runner"
            data-stride="a"
            transform="translate(60 1014)"
          >
            <TrailRunnerFigure headlampFill="url(#mtn-headlamp)" />
          </g>
        </g>

        <path d={SCENE.foreground} fill="#071917" />
        <path d={SCENE.foregroundTrees} fill="#061412" />
      </svg>
    </div>
  );
}
