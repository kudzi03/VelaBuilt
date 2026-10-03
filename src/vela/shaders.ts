/**
 * The Armature's shaders. Plain GLSL ES 3.00, written for this object only.
 *
 * One blend mode for everything: premultiplied alpha (ONE, ONE_MINUS_SRC_ALPHA).
 * Dark material writes alpha and occludes; light writes colour with zero
 * alpha and therefore adds — onto the canvas and, because the canvas is
 * composited premultiplied, onto the page behind it. That is how an ember
 * can glow against an ivory page without a post-processing pass.
 *
 * Note for editors: these are template literals — a backtick inside a GLSL
 * comment ends the string. (It has happened on this codebase before.)
 */

const HEAD = /* glsl */ `#version 300 es
precision highp float;
`;

/* ── members: screen-space ribbons with a depth-of-field falloff ──────── */

export const MEMBER_VS = HEAD + /* glsl */ `
layout(location=0) in vec2 aCorner;
layout(location=1) in vec3 aA;
layout(location=2) in vec3 aB;
layout(location=3) in float aAlpha;
layout(location=4) in float aGlow;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform vec2 uViewport;
uniform float uWidth;
uniform float uFocus;
uniform float uDof;
uniform float uCenterZ;
uniform float uRadius;
out float vSide;
out float vAlpha;
out float vGlow;
void main() {
  float t = aCorner.x * 0.5 + 0.5;
  vec4 va = uView * uModel * vec4(aA, 1.0);
  vec4 vb = uView * uModel * vec4(aB, 1.0);
  vec4 ca = uProj * va;
  vec4 cb = uProj * vb;
  vec2 sa = ca.xy / ca.w * uViewport * 0.5;
  vec2 sb = cb.xy / cb.w * uViewport * 0.5;
  vec2 d = sb - sa;
  vec2 dir = length(d) > 1e-4 ? normalize(d) : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec4 c = mix(ca, cb, t);
  float z = mix(va.z, vb.z, t);
  // Circle of confusion: members off the focal plane widen and thin out.
  float coc = abs(z - uFocus) * uDof;
  float w = uWidth * (1.0 + aGlow * 0.9) + coc * coc * 5.0;
  c.xy += nrm * aCorner.y * (w * 0.5) / (uViewport * 0.5) * c.w;
  // Atmospheric depth: the far side of the structure recedes into the room.
  float near = clamp((z - (uCenterZ - uRadius)) / (2.0 * uRadius), 0.0, 1.0);
  vSide = aCorner.y;
  vGlow = aGlow;
  vAlpha = aAlpha * mix(0.28, 1.0, near) / (1.0 + coc * coc * 2.2);
  gl_Position = c;
}`;

export const MEMBER_FS = HEAD + /* glsl */ `
in float vSide;
in float vAlpha;
in float vGlow;
uniform vec3 uColor;
uniform vec3 uEmber;
out vec4 frag;
void main() {
  float a = vAlpha * (1.0 - smoothstep(0.25, 1.0, abs(vSide)));
  // A member carrying energy is lit along its length: it stops occluding and
  // starts adding light, graphite through amber to white-hot.
  float g = clamp(vGlow, 0.0, 1.0);
  vec3 hot = mix(uEmber, vec3(1.0, 0.94, 0.8), g * g);
  vec3 col = mix(uColor, hot * 1.4, g);
  frag = vec4(col * a, a * (1.0 - g * 0.75));
}`;

/* ── nodes: blackened metal, lit as spheres without being spheres ─────── */

export const NODE_VS = HEAD + /* glsl */ `
layout(location=0) in vec2 aCorner;
layout(location=1) in vec3 aPos;
layout(location=2) in vec2 aSizeGlow;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform float uScale;
uniform float uCenterZ;
uniform float uRadius;
out vec2 vUv;
out float vGlow;
out float vNear;
void main() {
  vec4 v = uView * uModel * vec4(aPos, 1.0);
  float size = aSizeGlow.x * uScale * (1.0 + aSizeGlow.y * 2.2);
  v.xy += aCorner * size;
  vUv = aCorner;
  vGlow = aSizeGlow.y;
  vNear = clamp((v.z - (uCenterZ - uRadius)) / (2.0 * uRadius), 0.0, 1.0);
  gl_Position = uProj * v;
}`;

export const NODE_FS = HEAD + /* glsl */ `
in vec2 vUv;
in float vGlow;
in float vNear;
uniform vec3 uEmber;
out vec4 frag;
void main() {
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  vec3 n = vec3(vUv, sqrt(1.0 - r2));
  vec3 L = normalize(vec3(-0.45, 0.7, 0.55));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
  float rim = pow(1.0 - n.z, 2.5);
  vec3 base = vec3(0.085, 0.08, 0.075);
  vec3 col = base * (0.35 + 0.65 * diff) + vec3(1.0, 0.95, 0.86) * spec * 0.75 + vec3(0.85, 0.8, 0.72) * rim * 0.18;
  float edge = 1.0 - smoothstep(0.82, 1.0, sqrt(r2));
  float a = edge * mix(0.35, 1.0, vNear);
  // Energy passing through lights the joint from inside.
  vec3 hot = mix(uEmber, vec3(1.0, 0.96, 0.88), vGlow * vGlow);
  float g = clamp(vGlow, 0.0, 1.0);
  col = mix(col, hot * 1.35, g);
  frag = vec4(col * a, a * (1.0 - g * 0.85));
}`;

/* ── light: pulses, embers, the core. Additive through zero alpha. ────── */

export const GLOW_VS = HEAD + /* glsl */ `
layout(location=0) in vec2 aCorner;
layout(location=1) in vec3 aPos;
layout(location=2) in vec2 aSizeIntensity;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform float uScale;
out vec2 vUv;
out float vI;
void main() {
  vec4 v = uView * uModel * vec4(aPos, 1.0);
  v.xy += aCorner * aSizeIntensity.x * uScale;
  vUv = aCorner;
  vI = aSizeIntensity.y;
  gl_Position = uProj * v;
}`;

export const GLOW_FS = HEAD + /* glsl */ `
in vec2 vUv;
in float vI;
uniform vec3 uEmber;
uniform float uCoreBias;
out vec4 frag;
void main() {
  float d2 = dot(vUv, vUv);
  if (d2 > 1.0) discard;
  float core = exp(-d2 * mix(38.0, 14.0, uCoreBias));
  float halo = exp(-d2 * mix(5.5, 3.2, uCoreBias)) * (1.0 - d2);
  // The core adds light; the halo tints what is behind it amber rather than
  // washing it white — on an ivory page, that is the difference between an
  // ember and fog.
  vec3 col = vec3(1.0, 0.95, 0.84) * core * 1.15 + uEmber * halo * 0.95;
  frag = vec4(col * vI, halo * 0.5 * min(vI, 1.0));
}`;

/* Embers orbit the core entirely on the GPU: no per-frame upload. */
export const EMBER_VS = HEAD + /* glsl */ `
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aSeed;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform float uScale;
uniform float uTime;
uniform float uEnergy;
uniform float uContract;
out vec2 vUv;
out float vI;
void main() {
  float s = aSeed.x * 6.2831;
  float r = mix(0.12, 0.62, aSeed.y) * uContract;
  float speed = mix(0.05, 0.22, aSeed.z);
  float th = s + uTime * speed;
  float ph = aSeed.w * 3.1415 + sin(uTime * 0.13 + s) * 0.4;
  vec3 p = vec3(cos(th) * sin(ph), cos(ph) * 0.85, sin(th) * sin(ph)) * r;
  vec4 v = uView * uModel * vec4(p, 1.0);
  float flick = pow(0.5 + 0.5 * sin(uTime * mix(1.3, 4.1, aSeed.z) + s * 3.0), 5.0);
  float size = mix(0.008, 0.022, aSeed.w) * (0.6 + flick * 0.8);
  v.xy += aCorner * size * uScale * 3.0;
  vUv = aCorner;
  vI = flick * uEnergy * mix(0.5, 1.2, aSeed.y);
  gl_Position = uProj * v;
}`;

/* ── smoke: the dark mass the light is seen against ───────────────────── */

export const SMOKE_VS = HEAD + /* glsl */ `
layout(location=0) in vec2 aCorner;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform float uSize;
uniform float uRot;
out vec2 vUv;
void main() {
  vec4 v = uView * uModel * vec4(0.0, 0.0, 0.0, 1.0);
  float c = cos(uRot), s = sin(uRot);
  vec2 k = mat2(c, -s, s, c) * aCorner;
  v.xy += k * uSize;
  vUv = aCorner;
  gl_Position = uProj * v;
}`;

export const SMOKE_FS = HEAD + /* glsl */ `
in vec2 vUv;
uniform float uTime;
uniform float uSeed;
uniform float uDensity;
uniform int uOctaves;
out vec4 frag;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
void main() {
  float r = length(vUv);
  if (r > 1.0) discard;
  vec2 p = vUv * 2.2 + vec2(uSeed * 7.1, uSeed * 3.3);
  float n = 0.0, amp = 0.55;
  for (int i = 0; i < 4; i++) {
    if (i >= uOctaves) break;
    n += noise(p + vec2(uTime * 0.05, -uTime * 0.035)) * amp;
    p = p * 2.03 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  float fall = pow(1.0 - r, 1.6);
  float a = smoothstep(0.26, 0.8, n) * fall * uDensity;
  frag = vec4(vec3(0.045, 0.038, 0.032) * a, a);
}`;

/* ── glass: panes in the frame, lit at the edge ───────────────────────── */

export const FACET_VS = HEAD + /* glsl */ `
layout(location=0) in vec3 aPos;
layout(location=1) in float aAlpha;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
out vec3 vView;
out float vAlpha;
out vec3 vWorld;
void main() {
  vec4 v = uView * uModel * vec4(aPos, 1.0);
  vView = v.xyz;
  vWorld = aPos;
  vAlpha = aAlpha;
  gl_Position = uProj * v;
}`;

export const FACET_FS = HEAD + /* glsl */ `
in vec3 vView;
in float vAlpha;
in vec3 vWorld;
uniform float uTime;
uniform vec3 uEmber;
out vec4 frag;
void main() {
  vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
  vec3 e = normalize(-vView);
  float f = pow(1.0 - abs(dot(n, e)), 2.0);
  // A slow sheen crossing the panes, like light moving over glass.
  float band = sin((vWorld.x * 1.3 + vWorld.y * 0.8) * 3.0 - uTime * 0.6);
  float sheen = smoothstep(0.93, 1.0, band);
  // On a light field glass reads as a faint tint, lit only at its edge.
  vec3 film = vec3(0.55, 0.53, 0.5);
  float a = vAlpha * (0.04 + f * 0.05);
  vec3 col = film * a + vec3(1.0, 0.97, 0.92) * (f * 0.08 + sheen * 0.05) * vAlpha;
  frag = vec4(col, a);
}`;
