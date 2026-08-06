import { describe, expect, it } from "vitest";

import {
  canChangeMemberRole,
  canDisableMember,
  canInviteRole,
  canRemoveMember,
  countOwners,
  invitationExpiryDate,
  isInvitationExpired,
} from "@/lib/team/rules";

describe("countOwners", () => {
  it("counts members with the owner role", () => {
    expect(
      countOwners([{ role: "owner" }, { role: "admin" }, { role: "owner" }, { role: "viewer" }]),
    ).toBe(2);
  });

  it("returns 0 when there are no owners", () => {
    expect(countOwners([{ role: "admin" }, { role: "viewer" }])).toBe(0);
  });
});

describe("canRemoveMember", () => {
  it("blocks removing an owner by another member", () => {
    const result = canRemoveMember({
      actorUserId: "actor-1",
      targetUserId: "owner-1",
      targetRole: "owner",
      ownerCount: 2,
    });
    expect(result.ok).toBe(false);
  });

  it("allows an owner to remove themself when another owner remains", () => {
    const result = canRemoveMember({
      actorUserId: "owner-1",
      targetUserId: "owner-1",
      targetRole: "owner",
      ownerCount: 2,
    });
    expect(result.ok).toBe(true);
  });

  it("blocks the sole owner from leaving the workspace", () => {
    const result = canRemoveMember({
      actorUserId: "owner-1",
      targetUserId: "owner-1",
      targetRole: "owner",
      ownerCount: 1,
    });
    expect(result.ok).toBe(false);
  });

  it("allows removing a non-owner member", () => {
    const result = canRemoveMember({
      actorUserId: "owner-1",
      targetUserId: "member-1",
      targetRole: "collaborator",
      ownerCount: 1,
    });
    expect(result.ok).toBe(true);
  });
});

describe("canChangeMemberRole", () => {
  it("blocks admin from promoting to owner without confirmation", () => {
    const result = canChangeMemberRole({
      actorRole: "admin",
      targetCurrentRole: "manager",
      nextRole: "owner",
      ownerCount: 1,
    });
    expect(result.ok).toBe(false);
  });

  it("allows promotion to owner when confirmOwnerTransfer is set", () => {
    const result = canChangeMemberRole({
      actorRole: "admin",
      targetCurrentRole: "manager",
      nextRole: "owner",
      ownerCount: 1,
      confirmOwnerTransfer: true,
    });
    expect(result.ok).toBe(true);
  });

  it("blocks demoting the sole owner", () => {
    const result = canChangeMemberRole({
      actorRole: "owner",
      targetCurrentRole: "owner",
      nextRole: "admin",
      ownerCount: 1,
    });
    expect(result.ok).toBe(false);
  });

  it("allows demoting an owner when another owner remains", () => {
    const result = canChangeMemberRole({
      actorRole: "owner",
      targetCurrentRole: "owner",
      nextRole: "admin",
      ownerCount: 2,
    });
    expect(result.ok).toBe(true);
  });

  it("blocks non-management roles from changing roles", () => {
    const result = canChangeMemberRole({
      actorRole: "manager",
      targetCurrentRole: "viewer",
      nextRole: "editor",
      ownerCount: 1,
    });
    expect(result.ok).toBe(false);
  });
});

describe("canDisableMember", () => {
  it("blocks disabling the sole owner", () => {
    expect(canDisableMember({ targetRole: "owner", ownerCount: 1 }).ok).toBe(false);
  });

  it("allows disabling an owner when another owner remains", () => {
    expect(canDisableMember({ targetRole: "owner", ownerCount: 2 }).ok).toBe(true);
  });

  it("allows disabling a non-owner", () => {
    expect(canDisableMember({ targetRole: "sales", ownerCount: 1 }).ok).toBe(true);
  });
});

describe("canInviteRole", () => {
  it("blocks inviting directly as owner", () => {
    expect(canInviteRole("owner").ok).toBe(false);
  });

  it("allows inviting non-owner roles", () => {
    expect(canInviteRole("collaborator").ok).toBe(true);
  });
});

describe("invitation expiry helpers", () => {
  it("defaults to a 7-day expiry window", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const expiry = invitationExpiryDate(from);
    expect(expiry.toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });

  it("detects expired invitations", () => {
    expect(isInvitationExpired("2026-01-01T00:00:00.000Z", new Date("2026-01-02T00:00:00.000Z"))).toBe(
      true,
    );
    expect(isInvitationExpired("2026-01-03T00:00:00.000Z", new Date("2026-01-02T00:00:00.000Z"))).toBe(
      false,
    );
  });
});
