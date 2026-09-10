"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHAPTERS, clamp01, journey } from "@/lib/journey";
import { DRAW_DISTANCE, type Tier } from "@/lib/capability";
import { CORRIDOR } from "./Corridor";
import { Horizon } from "./Horizon";
import { JOURNEY_LENGTH, stationDistance } from "./path";
import { Glow, InterfacePanel, Link, Seam, Stone } from "./primitives";
import { PALETTE } from "./materials";

/**
 * THE SIX STATIONS.
 *
 * Each chapter of the page is a place in the corridor rather than a slide. The
 * camera arrives; the architecture is already there. Nothing appears from
 * nowhere and nothing is composited over the top.
 *
 * Everything outside the current draw distance is switched off wholesale — a
 * visibility flag rather than an unmount, so returning to a station never pays
 * to rebuild it. That, plus one instanced draw call per repeated element, is
 * what keeps ten chambers inside a phone's budget.
 */

export function Stations({ tier }: { readonly tier: Exclude<Tier, "C"> }) {
  const radius = DRAW_DISTANCE[tier] / JOURNEY_LENGTH;
  const detailed = tier === "A";

  return (
    <>
      <Station index={0} radius={radius}>
        <FrictionStation detailed={detailed} />
      </Station>
      <Station index={1} radius={radius}>
        <WebsiteStation detailed={detailed} />
      </Station>
      <Station index={2} radius={radius}>
        <EnquiryStation detailed={detailed} />
      </Station>
      <Station index={3} radius={radius}>
        <LabStation detailed={detailed} />
      </Station>
      <Station index={4} radius={radius}>
        <DiscoverabilityStation detailed={detailed} />
      </Station>
      <Station index={5} radius={radius}>
        <DestinationStation detailed={detailed} />
      </Station>
    </>
  );
}

/** Positions a station in the corridor and culls it when far behind or ahead. */
function Station({
  index,
  radius,
  children,
}: {
  readonly index: number;
  readonly radius: number;
  readonly children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const z = CHAPTERS[index]?.z ?? 0;

  useFrame(() => {
    const node = group.current;
    if (!node) return;
    const visible = stationDistance(journey.smooth, index) < radius;
    if (node.visible !== visible) node.visible = visible;
  });

  return (
    <group ref={group} position={[0, 0, z]}>
      {children}
    </group>
  );
}

/** Slow, weighted float. One loop drives the whole group. */
function Drift({
  children,
  amplitude = 0.16,
  speed = 0.22,
  seed = 0,
}: {
  readonly children: ReactNode;
  readonly amplitude?: number;
  readonly speed?: number;
  readonly seed?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const base = useRef(0);

  useFrame((state) => {
    const node = group.current;
    if (!node || !journey.visible) return;
    const t = state.clock.elapsedTime * speed + seed;
    node.position.y = base.current + Math.sin(t) * amplitude;
    node.rotation.z = Math.sin(t * 0.7) * amplitude * 0.05;
  });

  return <group ref={group}>{children}</group>;
}

/* ========================================================================== */
/* 01 — FRICTION                                                              */
/* Systems exist, but nothing connects to anything.                           */
/* ========================================================================== */

const SCATTERED: readonly {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  seed: number;
}[] = [
  { position: [-7.4, 3.4, -4], rotation: [0, 0.42, -0.06], size: [3.6, 2.2], seed: 1 },
  { position: [6.9, 4.8, -9], rotation: [0, -0.5, 0.05], size: [3.2, 2.0], seed: 2 },
  { position: [-5.6, 6.4, -15], rotation: [0.05, 0.3, 0.09], size: [2.8, 1.7], seed: 3 },
  { position: [7.8, 2.4, -19], rotation: [0, -0.34, -0.04], size: [3.0, 1.9], seed: 4 },
  { position: [-8.2, 2.1, 4], rotation: [0, 0.55, 0.03], size: [2.6, 1.6], seed: 5 },
  { position: [5.2, 7.1, 1], rotation: [-0.06, -0.4, -0.07], size: [2.4, 1.5], seed: 6 },
  { position: [-2.4, 8.4, -22], rotation: [0.08, 0.12, 0.04], size: [3.4, 2.0], seed: 7 },
];

function FrictionStation({ detailed }: { readonly detailed: boolean }) {
  const panels = detailed ? SCATTERED : SCATTERED.slice(0, 4);

  return (
    <group>
      {panels.map((panel) => (
        <Drift key={panel.seed} seed={panel.seed * 1.7} amplitude={0.14}>
          <group position={panel.position} rotation={panel.rotation}>
            <InterfacePanel
              position={[0, 0, 0]}
              size={panel.size}
              options={{
                // Dormant: present, lit, and doing nothing for anyone.
                activity: 0.1,
                opacity: 0.82,
                seed: panel.seed,
                rows: 8,
              }}
            />
            <Glow
              position={[0, 0, -0.05]}
              scale={[panel.size[0] * 1.7, panel.size[1] * 1.7]}
              strength={0.1}
            />
          </group>
        </Drift>
      ))}

      {/* No links anywhere in this station. The absence is the point. */}
    </group>
  );
}

/* ========================================================================== */
/* 02 — THE WEBSITE                                                           */
/* The architecture itself becomes the interface.                             */
/* ========================================================================== */

function WebsiteStation({ detailed }: { readonly detailed: boolean }) {
  const wallX = CORRIDOR.halfWidth - 0.35;

  return (
    <group>
      {/* A monumental dark glass surface, not a laptop on a desk. */}
      <group position={[wallX, 6.2, -2]} rotation={[0, -Math.PI / 2, 0]}>
        <InterfacePanel
          position={[0, 0, 0]}
          size={[19, 10.5]}
          options={{ activity: 0.85, opacity: 0.97, seed: 11, rows: 13 }}
        />

        {/* The frame that makes it read as architecture. */}
        <Seam position={[0, 5.35, 0.06]} size={[19, 0.045, 0.045]} glow={0.8} />
        <Seam position={[0, -5.35, 0.06]} size={[19, 0.045, 0.045]} glow={0.8} />
        <Seam position={[-9.5, 0, 0.06]} size={[0.045, 10.5, 0.045]} opacity={0.6} glow={0.4} />
        <Seam position={[9.5, 0, 0.06]} size={[0.045, 10.5, 0.045]} opacity={0.6} glow={0.4} />

        <Glow position={[0, 0, -0.1]} scale={[26, 16]} strength={0.16} />
      </group>

      {/* Its light thrown across the floor. */}
      <Glow
        position={[wallX - 5, 0.02, -2]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        scale={[22, 12]}
        strength={0.13}
      />

      {detailed ? (
        <>
          {/* Two elements lifted out of the surface — hierarchy made spatial. */}
          <Drift seed={2.2} amplitude={0.1}>
            <InterfacePanel
              position={[4.6, 3.1, -7]}
              rotation={[0, -0.6, 0]}
              size={[3.4, 2.1]}
              options={{ activity: 0.7, opacity: 0.93, seed: 12, rows: 6 }}
            />
          </Drift>
          <Drift seed={4.8} amplitude={0.12}>
            <InterfacePanel
              position={[2.6, 6.4, -12]}
              rotation={[0, -0.4, 0]}
              size={[2.8, 1.7]}
              options={{ activity: 0.6, opacity: 0.9, seed: 13, rows: 5 }}
            />
          </Drift>
        </>
      ) : null}
    </group>
  );
}

/* ========================================================================== */
/* 03 — THE LOST ENQUIRY                                                      */
/* One enquiry arrives. Then either nothing, or a path.                       */
/* ========================================================================== */

/** The chain the enquiry travels once a system exists. */
const CHAIN: readonly [number, number, number][] = [
  [-7.2, 2.6, 10],
  [-4.3, 3.2, 2],
  [-1.2, 2.9, -6],
  [2.0, 3.4, -13],
  [5.0, 3.0, -20],
  [7.6, 3.6, -27],
];

function EnquiryStation({ detailed }: { readonly detailed: boolean }) {
  const marker = useRef<THREE.Group>(null);
  const points = useMemo(
    () => CHAIN.map((point) => new THREE.Vector3(...point)),
    [],
  );
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.25),
    [points],
  );
  const cursor = useMemo(() => new THREE.Vector3(), []);

  // Local progress through this chapter: 0 as we arrive, 1 as we leave.
  useFrame((state) => {
    const node = marker.current;
    if (!node || !journey.visible) return;

    const local = clamp01((journey.smooth - 0.4) / 0.2 + 0.5);

    if (local < 0.42) {
      // Before the system exists: the enquiry reaches the inbox and stalls,
      // twitching between tools without ever leaving.
      const t = state.clock.elapsedTime;
      const stutter = Math.sin(t * 1.6) * 0.35 + Math.sin(t * 5.1) * 0.06;
      cursor.copy(points[1]!).lerp(points[2]!, 0.5 + stutter * 0.12);
      node.position.copy(cursor);
      node.scale.setScalar(0.75);
    } else {
      // Once it exists, the same enquiry runs the chain, cleanly.
      const t = (state.clock.elapsedTime * 0.16) % 1;
      curve.getPointAt(t, cursor);
      node.position.copy(cursor);
      node.scale.setScalar(1);
    }
  });

  return (
    <group>
      {/* The inbox: monumental, and on its own. */}
      <group position={[-6.4, 0, 4]}>
        <Stone position={[0, 3.2, 0]} size={[3.4, 6.4, 1.1]} roughness={0.6} />
        <InterfacePanel
          position={[0, 3.6, 0.58]}
          size={[2.6, 3.6]}
          options={{ activity: 0.42, opacity: 0.95, seed: 21, rows: 9 }}
        />
        <Seam position={[0, 0.06, 0.62]} size={[3.4, 0.04, 0.04]} glow={0.6} />
      </group>

      {/* The other places the same enquiry ends up living. */}
      {detailed
        ? ([
            { p: [4.8, 4.2, -4] as [number, number, number], r: -0.5, s: 20 },
            { p: [7.4, 2.4, -12] as [number, number, number], r: -0.4, s: 22 },
            { p: [-5.2, 5.6, -16] as [number, number, number], r: 0.45, s: 23 },
          ]).map((item) => (
            <Drift key={item.s} seed={item.s} amplitude={0.1}>
              <InterfacePanel
                position={item.p}
                rotation={[0, item.r, 0]}
                size={[2.6, 1.7]}
                options={{ activity: 0.24, opacity: 0.88, seed: item.s, rows: 6 }}
              />
            </Drift>
          ))
        : null}

      {/* The path, once it exists: enquiry → CRM → qualification → follow-up
          → reply → booking. Drawn as light between fixed points. */}
      {CHAIN.slice(0, -1).map((point, index) => (
        <Link
          key={index}
          from={point}
          to={CHAIN[index + 1]!}
          opacity={0.34}
          thickness={0.016}
        />
      ))}

      {CHAIN.map((point, index) => (
        <group key={`node-${index}`} position={point}>
          <Seam position={[0, 0, 0]} size={[0.16, 0.16, 0.16]} opacity={0.85} glow={0.5} />
        </group>
      ))}

      {/* The enquiry itself. */}
      <group ref={marker}>
        <Glow position={[0, 0, 0]} scale={[1.5, 1.5]} color={PALETTE.champagneLight} strength={1.1} />
        <Seam position={[0, 0, 0]} size={[0.1, 0.1, 0.1]} color={PALETTE.ivory} glow={0} />
      </group>
    </group>
  );
}

/* ========================================================================== */
/* 04 — SYSTEM LAB                                                            */
/* A room of connected modules.                                               */
/* ========================================================================== */

function LabStation({ detailed }: { readonly detailed: boolean }) {
  const layout = useMemo(() => {
    const columns = 5;
    const rows = 2;
    const nodes: { position: [number, number, number]; seed: number }[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        nodes.push({
          position: [
            (column - (columns - 1) / 2) * 4.3,
            2.6 + row * 3.4,
            row === 0 ? -4 : -12,
          ],
          seed: 30 + row * columns + column,
        });
      }
    }
    return nodes;
  }, []);

  const shown = detailed ? layout : layout.filter((_, index) => index % 2 === 0);

  return (
    <group>
      {shown.map((node) => (
        <Drift key={node.seed} seed={node.seed * 0.8} amplitude={0.07} speed={0.18}>
          <group position={node.position}>
            <InterfacePanel
              position={[0, 0, 0]}
              size={[3.1, 2.0]}
              options={{ activity: 0.78, opacity: 0.95, seed: node.seed, rows: 6 }}
            />
            <Glow position={[0, 0, -0.06]} scale={[5.2, 3.6]} strength={0.13} />
          </group>
        </Drift>
      ))}

      {/* Handoffs between modules, as light. */}
      {detailed
        ? shown.slice(0, -1).map((node, index) => (
            <Link
              key={`lab-link-${node.seed}`}
              from={node.position}
              to={shown[index + 1]!.position}
              opacity={0.2}
              thickness={0.01}
            />
          ))
        : null}

      {/* The room reads as a room: a lit floor plate under the modules. */}
      <Glow
        position={[0, 0.02, -8]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[24, 26]}
        strength={0.1}
      />
    </group>
  );
}

/* ========================================================================== */
/* 05 — DISCOVERABILITY                                                       */
/* One entity, and everything that has to understand it.                      */
/* ========================================================================== */

function DiscoverabilityStation({ detailed }: { readonly detailed: boolean }) {
  const rings = useRef<THREE.Group>(null);

  const orbits = useMemo(() => {
    const built: {
      radius: number;
      height: number;
      count: number;
      speed: number;
    }[] = [
      { radius: 4.2, height: 5.4, count: 8, speed: 0.05 },
      { radius: 6.8, height: 5.4, count: 12, speed: -0.032 },
      { radius: 9.2, height: 5.4, count: 16, speed: 0.02 },
    ];
    return built;
  }, []);

  useFrame((state) => {
    const node = rings.current;
    if (!node || !journey.visible) return;
    node.rotation.y = state.clock.elapsedTime * 0.04;
  });

  const shownOrbits = detailed ? orbits : orbits.slice(0, 2);

  return (
    <group position={[0, 0, -6]}>
      {/* The entity: one business, at the centre, unambiguous. */}
      <Stone position={[0, 5.4, 0]} size={[1.5, 4.6, 1.5]} roughness={0.5} />
      <Seam position={[0, 7.75, 0]} size={[1.6, 0.05, 1.6]} glow={1.2} />
      <Glow position={[0, 5.4, 0.9]} scale={[7, 9]} strength={0.28} />

      <group ref={rings}>
        {shownOrbits.map((orbit) =>
          Array.from({ length: orbit.count }, (_, index) => {
            const angle = (index / orbit.count) * Math.PI * 2;
            const x = Math.cos(angle) * orbit.radius;
            const z = Math.sin(angle) * orbit.radius;
            return (
              <group key={`${orbit.radius}-${index}`}>
                <Seam
                  position={[x, orbit.height, z]}
                  size={[0.12, 0.12, 0.12]}
                  opacity={0.7}
                  glow={0.35}
                />
                {/* Everything that has to be able to read the entity, does. */}
                {index % 2 === 0 ? (
                  <Link
                    from={[x, orbit.height, z]}
                    to={[0, 5.6, 0]}
                    opacity={0.11}
                    thickness={0.008}
                  />
                ) : null}
              </group>
            );
          }),
        )}
      </group>
    </group>
  );
}

/* ========================================================================== */
/* 06 — DESTINATION                                                           */
/* Everything from the previous chapters, now one architecture.               */
/* ========================================================================== */

function DestinationStation({ detailed }: { readonly detailed: boolean }) {
  return (
    <group>
      {/* The corridor opens. The light was there from the first frame.
          The plane is placed so its hard light line lands just above the
          floor — the band is at (band - 0.5) × height from the plane's centre,
          so the y position and the band fraction have to be read together. */}
      <Horizon position={[0, 24, -58]} width={300} height={110} band={0.3} strength={0.95} />
      <Glow position={[0, 1.4, -50]} scale={[120, 22]} strength={0.32} />

      {/* Systems still running — behind him, and no longer needing him. */}
      {(detailed
        ? [
            [-9.2, 4.2, -14],
            [-6.4, 6.6, -22],
            [9.2, 4.2, -14],
            [6.4, 6.6, -22],
            [-3.4, 8.4, -30],
            [3.4, 8.4, -30],
          ]
        : [
            [-9.2, 4.2, -14],
            [9.2, 4.2, -14],
          ]
      ).map((position, index) => (
        <Drift key={index} seed={index * 2.3} amplitude={0.06} speed={0.15}>
          <InterfacePanel
            position={position as [number, number, number]}
            rotation={[0, position[0]! > 0 ? -0.5 : 0.5, 0]}
            size={[2.9, 1.8]}
            options={{ activity: 0.9, opacity: 0.9, seed: 50 + index, rows: 6 }}
          />
        </Drift>
      ))}

      {/* The floor carries the light all the way out. */}
      <Glow
        position={[0, 0.02, -30]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[26, 60]}
        strength={0.16}
      />
    </group>
  );
}
