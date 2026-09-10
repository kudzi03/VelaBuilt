# Visual Reconstruction Plan

The engineering is sound. The rendered world is not. This replaces the
production-design layer and freezes everything else.

## The diagnosis

The corridor was built entirely from primitives — boxes, planes, capsules and
emissive strips. That approach cannot reach the fidelity of the supplied
references, and no amount of tuning inside it will. Three specific failures:

1. **Architecture is boxes.** The references show a monumental atrium with
   marble columns, cantilevered stairs, mezzanines, planting and a glazed
   facade. A corridor of extruded slabs reads as a technical demo.
2. **Materials are flat.** `MeshStandardMaterial` with emissive strips cannot
   produce polished stone with metre-long specular reflections, smoked glass,
   or brushed champagne metal without an environment map, real reflections and
   a lighting rig well beyond the frame budget.
3. **The Operator is stacked capsules.** The references show a real person in a
   tailored suit. A capsule mannequin is worse than no character at all.

## The strategy: a hybrid cinematic pipeline

The supplied renders **are** the production environment art. They are used as
cinematic plates, and everything a plate cannot do — parallax, depth, camera
movement, reactive lighting, interaction — is layered around them in WebGL.

| Layer | Technique |
| --- | --- |
| Content | Real semantic HTML. Unchanged. |
| Environment | Cinematic plate, AVIF/WebP, responsive widths |
| Depth | Analytic depth ramp per scene → real parallax under a virtual camera |
| Light | Luminance-keyed bloom, breathing practicals, exposure grade |
| Atmosphere | Volumetric haze, vignette, film grain, subtle aberration |
| Interaction | Selective room dimming and illuminated chains (System Lab) |
| Transitions | Light-led dissolves driven by the plate's own luminance |

A plate is not a slideshow: the shader gives every scene a virtual camera that
dollies, drifts and reframes, with the floor and foreground parallaxing against
the horizon. That is what reads as a cinema camera moving through a real space.

## Component map

| Existing | Verdict | Replacement |
| --- | --- | --- |
| `world/Corridor.tsx` | **Delete** | Atrium / chamber plates |
| `world/Stations.tsx` | **Delete** | Per-scene plate + overlays |
| `world/Operator.tsx` | **Delete** | The Operator in the plates — a real person |
| `world/primitives.tsx` | **Delete** | — |
| `world/materials.ts` | **Delete** | `plate/grade.ts` shader |
| `world/Horizon.tsx` | **Delete** | Destination Gateway plate |
| `world/path.ts` | **Delete** | `plate/camera.ts` |
| `WorldCanvas.tsx` | **Replace** | `plate/PlateCanvas.tsx` |
| `StaticWorld.tsx` | **Demote** | Inner-page ambience only; Tier C uses plates |
| `CinematicStage.tsx` | **Modify** | Mounts plates; tier logic kept |
| `JourneyDriver.tsx` | **Keep** | Scroll contract is correct |
| `lib/journey.ts` | **Keep** | Chapters unchanged |
| `lib/capability.ts` | **Keep** | Tiering unchanged |
| `lab/SystemLab.tsx` | **Rebuild presentation** | Data and interaction logic kept verbatim |
| `chrome/Monogram.tsx` | **Replace** | Redrawn from the authoritative mark |
| Everything else | **Freeze** | Routes, SEO, schema, security, enquiry, a11y, QA |

## Scene assignments

| Scene | Reference | Treatment |
| --- | --- | --- |
| 01 Atrium | `01_operator_atrium` | Hero. Slow push, floor parallax, warm horizon right |
| 02 Website Chamber | `02_website_chamber` | Push toward the lit portal; the building carries the interface |
| 03 Enquiry Chamber | `03_enquiry_chamber` | Wide drift across scattered systems; one champagne enquiry travels |
| 04 System Lab | `04_system_lab` | Signature interactive scene. Room dims, chains illuminate |
| 05 Discoverability | `05_destination_gateway` | Entity centre; structure resolving, graded cooler |
| 06 Destination | `05_destination_gateway` | Warm, open, the Operator walking out |

## Non-negotiables carried forward

- Headline copy is HTML. Never baked into imagery.
- Hero content and CTA paint before any plate loads.
- Native scroll. No hijacking.
- Tier C keeps every word, and now gets a real plate instead of gradients.
- Reduced motion freezes the camera; the plate remains.
- No fabricated proof anywhere.

## Status — delivered

All ten steps below are complete. The primitive corridor, stations, materials
and procedural Operator are deleted; the Operator is now the real person in the
plates. Verified by `qa.mjs` (0 findings), `fallbacks.mjs` (all three tiers)
and `interaction.mjs` (keyboard and the whole enquiry).

## Order of work

1. Asset pipeline (AVIF/WebP, responsive, LQIP)
2. Plate compositor + virtual camera + grade
3. Scene 01 Atrium → screenshot against reference
4. Scene 02 Website Chamber
5. Scene 03 Enquiry Chamber
6. Scene 04 System Lab rebuild
7. Scenes 05 / 06
8. Monogram + wordmark
9. Mobile composition
10. Performance, accessibility regression, visual QA
