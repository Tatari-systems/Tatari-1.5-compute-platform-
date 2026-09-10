import { describe, expect, it } from "vitest";

import {
  canTransitionQuote,
  canTransitionRequirement,
} from "./statuses";

describe("requirement transitions", () => {
  it("allows submitted requirements to reach a terminal matching result", () => {
    expect(canTransitionRequirement("submitted", "matched")).toBe(true);
    expect(canTransitionRequirement("submitted", "no_match")).toBe(true);
  });

  it("rejects repeated and terminal-state transitions", () => {
    expect(canTransitionRequirement("submitted", "submitted")).toBe(false);
    expect(canTransitionRequirement("matched", "no_match")).toBe(false);
    expect(canTransitionRequirement("no_match", "matched")).toBe(false);
  });
});

describe("quote transitions", () => {
  it("allows one decision from pending approval", () => {
    expect(canTransitionQuote("pending_approval", "approved")).toBe(true);
    expect(canTransitionQuote("pending_approval", "rejected")).toBe(true);
  });

  it("does not allow an approved or rejected quote to change again", () => {
    expect(canTransitionQuote("approved", "rejected")).toBe(false);
    expect(canTransitionQuote("rejected", "approved")).toBe(false);
    expect(canTransitionQuote("approved", "approved")).toBe(false);
  });
});
