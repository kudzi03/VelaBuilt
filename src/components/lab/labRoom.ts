import type { SystemId } from "@/content/systems";

/**
 * THE ROOM'S REACTION.
 *
 * Selecting a module in the System Lab does not just change a card — the
 * chamber responds. This is the handoff between the interface and the
 * compositor: the lab writes which station has attention, and the plate shader
 * dims everything else and holds a soft light on that part of the room.
 *
 * Kept outside React deliberately, exactly like the journey: the shader reads
 * it every frame, and a hover must never cost a render of the page.
 */

export interface LabRoomState {
  /** True while a module is selected or hovered. */
  active: boolean;
  /** How far the rest of the room falls away, 0–1. */
  dim: number;
  /** Spotlight centre in screen space, plus radius. */
  spot: [number, number, number];
}

export const labRoom: LabRoomState = {
  active: false,
  dim: 0.82,
  spot: [0.5, 0.5, 0.42],
};

/**
 * Where each system stands in the room, in plate space.
 *
 * The first six are the stations actually visible in the System Lab render —
 * CRM, Follow-up and Booking to the left of the core, Calendar, AI Assistance
 * and Data to its right. The remaining four are placed on the same ring, in
 * front of the core, where the floor plan leaves room for them.
 */
export const STATIONS: Record<SystemId, readonly [number, number]> = {
  crm: [0.088, 0.372],
  "follow-up": [0.194, 0.379],
  booking: [0.296, 0.392],
  email: [0.388, 0.474],
  pipeline: [0.442, 0.6],
  analytics: [0.562, 0.6],
  messaging: [0.618, 0.474],
  calendar: [0.71, 0.392],
  ai: [0.81, 0.379],
  data: [0.912, 0.372],
};

/** The suspended core the whole room is built around. */
export const CORE: readonly [number, number] = [0.5, 0.405];

export function focusStation(id: SystemId | null): void {
  if (!id) {
    labRoom.active = false;
    labRoom.spot = [CORE[0], CORE[1], 0.55];
    return;
  }

  const station = STATIONS[id];
  labRoom.active = true;
  // The light sits between the station and the core, because the thing being
  // explained is the relationship, not the box.
  labRoom.spot = [
    (station[0] + CORE[0] * 0.6) / 1.6,
    (station[1] + CORE[1] * 0.6) / 1.6,
    0.46,
  ];
}
