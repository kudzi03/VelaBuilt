/**
 * THE WATER — keeps a held film frame alive.
 *
 * When the film rests on a keyframe (paused video or a still), this draws
 * that frame once into a texture and animates it in a single fragment pass:
 * the shallow water ripples, reflections shimmer, lanterns flicker. Nothing
 * is downloaded and nothing runs while the film itself is playing.
 */

/** Per keyframe, in image space: where the water starts and ends (0 = no water). */
const WATER: Record<number, readonly [horizon: number, end: number]> = {
  0: [0.535, 0.7],
  4: [0.515, 1.1],
  5: [0.655, 0.8],
};

const VS = "attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
const FS = `precision mediump float;
varying vec2 uv;
uniform sampler2D img;
uniform vec2 scale;
uniform float t,horizon,wend;
void main(){
  vec2 c=.5+(uv-.5)*scale;
  float d=clamp((c.y-horizon)/max(.001,1.-horizon),0.,1.);
  float water=step(horizon,wend)*smoothstep(horizon,horizon+.015,c.y)*(1.-smoothstep(wend-.08,wend,c.y));
  float k=1./(.12+d);
  vec2 w=vec2(sin(c.y*90.*k+t*1.3+sin(c.x*14.+t*.4)*2.)*.0007,sin(c.x*30.+c.y*60.*k-t*1.05)*.0013)*(.55+.45*d)*water;
  vec3 col=texture2D(img,clamp(c+w,.001,.999)).rgb;
  float sh=pow(max(0.,sin(c.x*180.+sin(c.y*40.+t)*3.+t*1.9)*sin(c.y*320.*k-t*1.4)),14.);
  col+=sh*water*.07*(col+.15);
  float lum=dot(col,vec3(.299,.587,.114));
  float warm=max(smoothstep(.22,.4,(col.r-col.b)/max(col.r,.05))*smoothstep(.3,.6,lum),smoothstep(.82,.95,lum)*step(.02,col.r-col.b));
  float fl=sin(t*8.3+c.x*41.+c.y*7.)*.6+sin(t*13.1+c.x*17.-c.y*23.)*.4;
  col*=1.+warm*fl*.06;
  gl_FragColor=vec4(col,1.);
}`;

export interface Water {
  /** Hold on this frame. `delay` lets a still finish its crossfade first. */
  show(src: HTMLImageElement | HTMLVideoElement, key: number, delay?: number): void;
  hide(fast?: boolean): void;
  dispose(): void;
}

export function createWater(canvas: HTMLCanvasElement): Water | null {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uScale = u("scale"), uT = u("t"), uHorizon = u("horizon"), uEnd = u("wend");
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let raf = 0;
  let timer = 0;
  let aspect = 16 / 9;
  let held: { src: HTMLImageElement | HTMLVideoElement; key: number; time: number } | null = null;

  const draw = (now: number) => {
    raf = requestAnimationFrame(draw);
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1 : 1.5);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    const ac = w / h;
    gl.uniform2f(uScale, ac > aspect ? 1 : ac / aspect, ac > aspect ? aspect / ac : 1);
    gl.uniform1f(uT, (now / 1000) % 3600);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const hide = (fast = false) => {
    clearTimeout(timer);
    held = null;
    canvas.style.transitionDuration = fast ? "120ms" : "";
    canvas.removeAttribute("data-on");
    cancelAnimationFrame(raf);
    raf = 0;
  };

  return {
    show(src, key, delay = 0) {
      const time = src instanceof HTMLVideoElement ? src.currentTime : 0;
      if (held && held.src === src && held.key === key && held.time === time) return;
      hide();
      held = { src, key, time };
      timer = window.setTimeout(() => {
        const [horizon, end] = WATER[key] ?? [1, 0];
        const sw = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth;
        const sh = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight;
        if (!sw || !sh) return;
        aspect = sw / sh;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
        gl.uniform1f(uHorizon, horizon);
        gl.uniform1f(uEnd, end);
        raf = requestAnimationFrame(draw);
        // Paint once before fading in, so the canvas never shows black.
        requestAnimationFrame(() => held && canvas.setAttribute("data-on", ""));
      }, delay);
    },
    hide,
    dispose() {
      hide();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
