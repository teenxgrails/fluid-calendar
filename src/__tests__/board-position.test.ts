import {
  POSITION_STEP,
  initialPositions,
  movePosition,
  needsRebalance,
  positionBetween,
} from "@/lib/board-position";

describe("board-position", () => {
  describe("positionBetween", () => {
    it("returns a first step for an empty list", () => {
      expect(positionBetween(null, null)).toBe(POSITION_STEP);
    });

    it("places before the first item", () => {
      expect(positionBetween(null, 1000)).toBeLessThan(1000);
    });

    it("places after the last item", () => {
      expect(positionBetween(1000, null)).toBeGreaterThan(1000);
    });

    it("takes the midpoint between two items", () => {
      expect(positionBetween(1000, 2000)).toBe(1500);
    });

    it("keeps strict ordering when repeatedly splitting", () => {
      const lo = 0;
      let hi = 1024;
      for (let i = 0; i < 20; i += 1) {
        const mid = positionBetween(lo, hi);
        expect(mid).toBeGreaterThan(lo);
        expect(mid).toBeLessThan(hi);
        hi = mid; // keep inserting just after `lo`
      }
    });
  });

  describe("movePosition (card + column moves)", () => {
    const neighbors = [1024, 2048, 3072]; // three items already ordered

    it("moves to the front", () => {
      const pos = movePosition(neighbors, 0);
      expect(pos).toBeLessThan(1024);
    });

    it("moves to the end", () => {
      const pos = movePosition(neighbors, 3);
      expect(pos).toBeGreaterThan(3072);
    });

    it("moves into the middle (between index 0 and 1)", () => {
      const pos = movePosition(neighbors, 1);
      expect(pos).toBe(1536);
      expect(pos).toBeGreaterThan(neighbors[0]);
      expect(pos).toBeLessThan(neighbors[1]);
    });

    it("clamps an out-of-range index to the end", () => {
      expect(movePosition(neighbors, 99)).toBeGreaterThan(3072);
    });

    it("clamps a negative index to the front", () => {
      expect(movePosition(neighbors, -5)).toBeLessThan(1024);
    });

    it("handles an empty column", () => {
      expect(movePosition([], 0)).toBe(POSITION_STEP);
    });

    it("produces an order that re-sorts correctly after a move", () => {
      // Start: A=1024, B=2048, C=3072. Move C to the front (index 0).
      const others = [1024, 2048];
      const cPos = movePosition(others, 0);
      const sorted = [
        { id: "C", pos: cPos },
        { id: "A", pos: 1024 },
        { id: "B", pos: 2048 },
      ].sort((a, b) => a.pos - b.pos);
      expect(sorted.map((item) => item.id)).toEqual(["C", "A", "B"]);
    });
  });

  describe("initialPositions", () => {
    it("returns evenly spaced, strictly increasing positions", () => {
      expect(initialPositions(3)).toEqual([1024, 2048, 3072]);
    });

    it("returns an empty array for zero items", () => {
      expect(initialPositions(0)).toEqual([]);
    });
  });

  describe("needsRebalance", () => {
    it("is false for well-spaced positions", () => {
      expect(needsRebalance([1024, 2048, 3072])).toBe(false);
    });

    it("is true when two positions have collapsed together", () => {
      expect(needsRebalance([1024, 1024.0000001, 2048])).toBe(true);
    });
  });
});
