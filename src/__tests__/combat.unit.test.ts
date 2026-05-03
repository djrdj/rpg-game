// Unit tests for combat edge cases — Task 2.9
// Validates: Requirements 7.1, 7.3

import { describe, it, expect } from "vitest";
import {
  calcPhysicalDamage,
  calcMagicDamage,
  calcMagicHeal,
} from "../game/combat.js";

describe("combat unit tests: edge cases", () => {
  // ── Physical damage edge cases ──────────────────────────────────────────

  it("physical damage has minimum of 1 regardless of high defense", () => {
    // Very high defense should still result in at least 1 damage
    expect(calcPhysicalDamage(1, 1, 1000)).toBe(1);
    expect(calcPhysicalDamage(1, 10, 1000)).toBe(1);
    expect(calcPhysicalDamage(5, 1, 100)).toBe(1);
  });

  it("physical damage equals (baseValue + attack) - defense when result > 1", () => {
    expect(calcPhysicalDamage(10, 20, 5)).toBe(25); // (10+20) - 5 = 25
    expect(calcPhysicalDamage(8, 12, 5)).toBe(15);  // (8+12) - 5 = 15
    expect(calcPhysicalDamage(14, 12, 8)).toBe(18); // (14+12) - 8 = 18
  });

  it("physical damage equals 1 when (baseValue + attack) - defense <= 0", () => {
    expect(calcPhysicalDamage(1, 1, 10)).toBe(1);    // (1+1) - 10 = -8 → 1
    expect(calcPhysicalDamage(1, 2, 5)).toBe(1);     // (1+2) - 5 = -2 → 1
  });

  // ── Magic damage tests ──────────────────────────────────────────────────

  it("magic damage equals baseValue + magic", () => {
    expect(calcMagicDamage(5, 10)).toBe(15);
    expect(calcMagicDamage(3, 8)).toBe(11);
    expect(calcMagicDamage(10, 1)).toBe(11);
  });

  it("magic damage is just magic when baseValue is 0", () => {
    expect(calcMagicDamage(0, 100)).toBe(100);
  });

  it("magic damage is just baseValue when magic is 0", () => {
    expect(calcMagicDamage(10, 0)).toBe(10);
  });

  // ── Magic healing edge cases ────────────────────────────────────────────

  it("healing at max health stays at max health", () => {
    expect(calcMagicHeal(10, 5, 100, 100)).toBe(100);
    expect(calcMagicHeal(100, 100, 100, 100)).toBe(100);
  });

  it("healing below max health increases health correctly", () => {
    expect(calcMagicHeal(5, 2, 50, 100)).toBe(57); // 50 + 5 + 2 = 57
    expect(calcMagicHeal(10, 30, 70, 100)).toBe(100); // 70 + 40 = 110 → 100
  });

  it("healing that would exceed max health is capped at max health", () => {
    expect(calcMagicHeal(100, 10, 50, 100)).toBe(100); // 50 + 110 = 160 → 100
    expect(calcMagicHeal(20, 5, 90, 100)).toBe(100);  // 90 + 25 = 115 → 100
  });

  it("healing with 0 baseValue or 0 magic still heals by the other value in additive model", () => {
    expect(calcMagicHeal(0, 10, 50, 100)).toBe(60); // 50 + 0 + 10 = 60
    expect(calcMagicHeal(10, 0, 50, 100)).toBe(60); // 50 + 10 + 0 = 60
  });

  it("healing works correctly at boundary (maxHealth - 1)", () => {
    expect(calcMagicHeal(1, 1, 99, 100)).toBe(100);
    expect(calcMagicHeal(1, 2, 99, 100)).toBe(100);
  });
});
