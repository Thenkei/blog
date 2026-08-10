import rocketShipSvg from "../../../assets/images/rocket_camera_ship.svg?raw";

type RocketShipArtworkProps = {
  className?: string;
};

export function RocketShipArtwork({
  className = "",
}: RocketShipArtworkProps) {
  return (
    <span
      aria-hidden="true"
      className={`rocket-ship-artwork ${className}`.trim()}
      data-artwork-source="rocket-camera-ship"
      dangerouslySetInnerHTML={{ __html: rocketShipSvg }}
    />
  );
}
