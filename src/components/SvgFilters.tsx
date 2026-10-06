// Filters that make the paper look handled: a slightly wavy edge, and crumpled shading.
export function SvgFilters() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="wobble" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.028" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={9} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="crumple" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.02" numOctaves={4} seed={11} result="n" />
          <feDiffuseLighting in="n" lightingColor="#ffffff" surfaceScale={3.6} diffuseConstant={1.05}>
            <feDistantLight azimuth={230} elevation={62} />
          </feDiffuseLighting>
        </filter>
      </defs>
    </svg>
  );
}
