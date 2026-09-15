import { describe, expect, it } from "vitest";

import { canAdminister, canApprove, canReview, isInternalRole } from "./roles";

describe("internal roles", () => {
  it("treats reviewer, approver, and admin as console roles", () => {
    expect(canReview("reviewer")).toBe(true);
    expect(canReview("approver")).toBe(true);
    expect(canReview("admin")).toBe(true);
    expect(canReview("public")).toBe(false);
    expect(isInternalRole("reviewer")).toBe(true);
    expect(isInternalRole("public")).toBe(false);
  });

  it("limits quote decisions to approvers and admins", () => {
    expect(canApprove("reviewer")).toBe(false);
    expect(canApprove("approver")).toBe(true);
    expect(canApprove("admin")).toBe(true);
  });

  it("limits internal administration to admins", () => {
    expect(canAdminister("reviewer")).toBe(false);
    expect(canAdminister("approver")).toBe(false);
    expect(canAdminister("admin")).toBe(true);
  });
});
