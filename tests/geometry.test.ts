import { test } from "node:test";
import assert from "node:assert/strict";
import { buildArmature, NODE_COUNT, SHAPES, unionEdges, unionFaces } from "../src/vela/geometry";

const arm = buildArmature();

test("every structure seats every node exactly once", () => {
  for (const id of SHAPES) {
    const s = arm.shapes[id];
    assert.equal(s.positions.length, NODE_COUNT, id);
    for (const p of s.positions) {
      assert.ok(p && p.every(Number.isFinite), `${id}: finite positions`);
    }
  }
});

test("members and panes only reference real nodes", () => {
  for (const id of SHAPES) {
    const { edges, faces } = arm.shapes[id];
    assert.ok(edges.length > 40, `${id} has a structure`);
    for (const [a, b] of edges) assert.ok(a >= 0 && b >= 0 && a < NODE_COUNT && b < NODE_COUNT && a !== b, `${id} edge ${a}-${b}`);
    for (const f of faces) for (const v of f) assert.ok(v >= 0 && v < NODE_COUNT, `${id} face`);
  }
});

test("the union carries every structure's members, tagged by shape", () => {
  const union = unionEdges(arm);
  SHAPES.forEach((id, s) => {
    const tagged = union.filter((e) => e.mask & (1 << s)).length;
    const own = new Set(arm.shapes[id].edges.map(([a, b]) => `${Math.min(a, b)}:${Math.max(a, b)}`)).size;
    assert.equal(tagged, own, id);
  });
  assert.ok(unionFaces(arm).length > 0);
});

test("deterministic: the server still and the renderer agree", () => {
  const again = buildArmature(0x7e1a);
  assert.deepEqual(again.shapes.armature.positions[17], arm.shapes.armature.positions[17]);
});
