/**
 * THE PLATE COMPOSITOR.
 *
 * One fragment shader turns a still environment render into a shot: a virtual
 * camera dollies and drifts, the floor and the frame edges parallax against the
 * horizon, the practicals bloom, haze opens up the distance, and the whole
 * thing is graded per scene.
 *
 * The depth model is analytic rather than a depth map. These are architectural
 * interiors shot from standing height, so depth is almost entirely predictable:
 * the floor runs from the horizon down to camera, and the frame edges are the
 * columns you are passing between. Two ramps — vertical and lateral — recover
 * enough of that to drive convincing parallax, with no extra asset to author,
 * ship or keep in sync.
 *
 * Two plates are resident so scenes can hand over with a light-led dissolve:
 * the incoming room's bright areas arrive first, which reads as walking into
 * its light rather than as a crossfade.
 */

export const PLATE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const PLATE_FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uPlateA;
  uniform sampler2D uPlateB;
  /** 0 = only A, 1 = only B. */
  uniform float uMix;
  /** 1 when A and B are the same image, so the dissolve is skipped. */
  uniform float uSamePlate;

  uniform vec2 uResolution;
  uniform vec2 uPlateSize;

  // --- Camera -------------------------------------------------------------
  uniform vec2 uFocalA;
  uniform vec2 uFocalB;
  uniform float uZoomA;
  uniform float uZoomB;
  uniform vec2 uPanA;
  uniform vec2 uPanB;

  // --- Depth --------------------------------------------------------------
  uniform float uHorizonA;
  uniform float uHorizonB;
  uniform float uLateralA;
  uniform float uLateralB;
  uniform float uParallax;

  // --- Grade --------------------------------------------------------------
  uniform float uExposureA;
  uniform float uExposureB;
  uniform float uContrastA;
  uniform float uContrastB;
  uniform float uSaturationA;
  uniform float uSaturationB;
  uniform float uWarmthA;
  uniform float uWarmthB;
  uniform float uBloomA;
  uniform float uBloomB;
  uniform float uHazeA;
  uniform float uHazeB;

  // --- Atmosphere ---------------------------------------------------------
  uniform float uVignette;
  uniform float uGrain;
  uniform float uTime;
  uniform float uQuality;

  // --- Selective lighting (System Lab) ------------------------------------
  /** 0 = room at full, 1 = everything but the spotlight falls away. */
  uniform float uDim;
  /** Spotlight centre in screen space, and its radius. */
  uniform vec3 uSpot;

  const vec3 CHAMPAGNE = vec3(0.878, 0.765, 0.596);
  const vec3 HAZE_COLOUR = vec3(0.055, 0.048, 0.043);

  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  /**
   * Maps screen UV to plate UV with a cover fit and a chosen framing.
   *
   * The window is the fraction of the plate that stays visible on each axis,
   * so it has to be multiplied in — dividing samples beyond the plate and
   * smears its edge pixels across the frame.
   *
   * The window is then centred on the focal point and clamped to the plate, so
   * naming a focal point actually reframes the shot. This is what lets a 16:9
   * room be cropped to a phone and still show the part of itself worth seeing,
   * and it matches CSS object-position exactly, so the canvas and the plain
   * <img> fallback frame the room the same way.
   */
  vec2 coverUv(vec2 uv, vec2 focal, float zoom) {
    float screenAspect = uResolution.x / uResolution.y;
    float plateAspect = uPlateSize.x / uPlateSize.y;

    vec2 window = screenAspect > plateAspect
      ? vec2(1.0, plateAspect / screenAspect)
      : vec2(screenAspect / plateAspect, 1.0);

    // Pushing in shows less of the plate.
    window /= max(zoom, 0.001);

    vec2 half_ = window * 0.5;
    vec2 centre = clamp(focal, min(half_, vec2(0.5)), max(1.0 - half_, vec2(0.5)));

    return (uv - 0.5) * window + centre;
  }

  /**
   * Approximate depth: 0 far, 1 near. The floor ramps in below the horizon and
   * the frame edges read as the architecture you are passing between.
   */
  float depthAt(vec2 uv, float horizon, float lateral) {
    float floorDepth = smoothstep(horizon, 1.0, uv.y);
    float edgeDepth = pow(abs(uv.x - 0.5) * 2.0, 2.2) * lateral;
    // Above the horizon the ceiling also comes toward camera, more gently.
    float ceilingDepth = smoothstep(horizon * 0.75, 0.0, uv.y) * 0.45;
    return clamp(max(max(floorDepth, edgeDepth), ceilingDepth), 0.0, 1.0);
  }

  /** The camera: frame on the focal point, push in, drift, parallax by depth. */
  vec2 frame(vec2 uv, vec2 focal, float zoom, vec2 pan, float horizon, float lateral, out float depth) {
    vec2 framed = coverUv(uv, focal, zoom);
    depth = depthAt(framed, horizon, lateral);

    // Near things travel further than far things. This is the whole effect.
    vec2 fromFocal = framed - focal;
    vec2 parallax = fromFocal * depth * uParallax * (zoom - 1.0);
    vec2 drift = pan * (0.35 + depth * 0.9);

    return framed + parallax + drift;
  }

  /** Warm bloom keyed off the plate's own practicals. */
  vec3 bloomAt(sampler2D plate, vec2 uv, float strength) {
    if (strength <= 0.001) return vec3(0.0);

    vec2 texel = 2.6 / uPlateSize;
    vec3 sum = vec3(0.0);

    // Six taps on a rotated hexagon — cheaper than a separable blur and, at
    // this radius, indistinguishable from one on a soft light source.
    for (int i = 0; i < 6; i++) {
      float angle = float(i) * 1.0472 + 0.4;
      vec2 offset = vec2(cos(angle), sin(angle)) * texel * 4.0;
      vec3 sample_ = texture2D(plate, uv + offset).rgb;
      float key = smoothstep(0.42, 0.95, luma(sample_));
      sum += sample_ * key;
    }

    if (uQuality > 0.5) {
      for (int i = 0; i < 6; i++) {
        float angle = float(i) * 1.0472 - 0.3;
        vec2 offset = vec2(cos(angle), sin(angle)) * texel * 9.0;
        vec3 sample_ = texture2D(plate, uv + offset).rgb;
        float key = smoothstep(0.5, 1.0, luma(sample_));
        sum += sample_ * key * 0.7;
      }
      sum /= 10.2;
    } else {
      sum /= 6.0;
    }

    return sum * strength;
  }

  vec3 grade(vec3 colour, float exposure, float contrast, float saturation, float warmth) {
    colour *= pow(2.0, exposure);
    colour = (colour - 0.5) * contrast + 0.5;

    float l = luma(colour);
    colour = mix(vec3(l), colour, saturation);

    // Warmth rides on the highlights, so the shadows stay neutral and deep
    // rather than the whole frame turning brown.
    colour = mix(colour, colour * CHAMPAGNE, warmth * smoothstep(0.12, 0.85, l));

    return max(colour, 0.0);
  }

  /** Samples one plate through the camera, graded, bloomed and hazed. */
  vec3 renderPlate(
    sampler2D plate, vec2 uv, vec2 focal, float zoom, vec2 pan,
    float horizon, float lateral,
    float exposure, float contrast, float saturation, float warmth,
    float bloom, float haze
  ) {
    float depth;
    vec2 suv = frame(uv, focal, zoom, pan, horizon, lateral, depth);

    // Clamp rather than wrap: a repeated edge is instantly readable as a bug.
    vec2 clamped = clamp(suv, vec2(0.0015), vec2(0.9985));

    vec3 colour = texture2D(plate, clamped).rgb;
    colour += bloomAt(plate, clamped, bloom * 0.9);
    colour = grade(colour, exposure, contrast, saturation, warmth);

    // Distance haze: the far end of the room fills with air.
    float aerial = (1.0 - depth) * haze;
    colour = mix(colour, HAZE_COLOUR + CHAMPAGNE * 0.035, aerial * 0.55);

    return colour;
  }

  void main() {
    vec2 uv = vUv;

    vec3 colour = renderPlate(
      uPlateA, uv, uFocalA, uZoomA, uPanA, uHorizonA, uLateralA,
      uExposureA, uContrastA, uSaturationA, uWarmthA, uBloomA, uHazeA
    );

    // Hand over to the next room. When both slots hold the same plate the
    // dissolve is skipped entirely and the camera simply keeps moving, which is
    // what makes two chapters in one location feel continuous.
    if (uMix > 0.001) {
      vec3 next = renderPlate(
        uPlateB, uv, uFocalB, uZoomB, uPanB, uHorizonB, uLateralB,
        uExposureB, uContrastB, uSaturationB, uWarmthB, uBloomB, uHazeB
      );

      float key = smoothstep(0.05, 0.75, luma(next));
      float led = smoothstep(uMix - 0.42, uMix + 0.26, key * 0.55 + 0.45);
      float blend = mix(led, uMix, uSamePlate);
      colour = mix(colour, next, clamp(blend, 0.0, 1.0));
    }

    // Selective lighting: the room falls away except where attention is.
    if (uDim > 0.001) {
      vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
      float d = length((vUv - uSpot.xy) * aspect) / max(uSpot.z, 0.001);
      float spot = 1.0 - smoothstep(0.35, 1.25, d);
      float fall = mix(1.0, mix(0.24, 1.0, spot), uDim);
      // Desaturating as it dims keeps the dark half reading as unlit stone
      // rather than as a black wash laid over the picture.
      colour = mix(vec3(luma(colour)) * 0.85, colour, mix(0.55, 1.0, spot)) * fall;
    }

    // Vignette.
    vec2 v = (vUv - 0.5) * vec2(1.06, 1.0);
    float vig = 1.0 - smoothstep(0.34, 0.96, length(v)) * uVignette;
    colour *= vig;

    // Grain, so large near-black fields do not band.
    float g = hash(vUv * uResolution + fract(uTime) * 137.0) - 0.5;
    colour += g * uGrain * (1.0 - smoothstep(0.0, 0.55, luma(colour)) * 0.6);

    gl_FragColor = vec4(max(colour, 0.0), 1.0);
    #include <colorspace_fragment>
  }
`;
