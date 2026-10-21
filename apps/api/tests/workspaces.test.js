
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createTestUser } from "./helpers/auth.js";

describe("Workspace authorization", () => {
    it("allows an authenticated user to create a workspace", async () => {
        const { agent } = await createTestUser();

        const response = await agent
            .post("/api/workspaces")
            .send({
                name: "Engineering Team",
                description: "Integration test workspace",
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.workspace.name).toBe("Engineering Team");
    });

    it("allows an invited user to join a workspace", async () => {
        const owner = await createTestUser({
            email: "workspace-owner@example.com",
        });

        const member = await createTestUser({
            email: "workspace-member@example.com",
        });

        const workspaceResponse = await owner.agent
            .post("/api/workspaces")
            .send({
                name: "Product Team",
                description: "Shared project workspace",
            });

        expect(workspaceResponse.status).toBe(201);

        const workspaceId =
            workspaceResponse.body.workspace._id;

        const inviteResponse = await owner.agent
            .post(`/api/workspaces/${workspaceId}/invitations`)
            .send({
                email: member.email,
                role: "member",
            });

        expect(inviteResponse.status).toBe(201);

        const invitationId =
            inviteResponse.body.invitation?._id ??
            inviteResponse.body.invitationId ??
            inviteResponse.body.invitation?.id;

        expect(invitationId).toBeTruthy();

        const acceptResponse = await member.agent
            .post(`/api/workspaces/invitations/${invitationId}/accept`);

        expect(acceptResponse.status).toBe(200);

        const membersResponse = await member.agent
            .get(`/api/workspaces/${workspaceId}/members`);

        expect(membersResponse.status).toBe(200);
        expect(membersResponse.body.members).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    role: "owner",
                }),
                expect.objectContaining({
                    role: "member",
                }),
            ])
        );
    });

    it("prevents an unrelated user from viewing workspace members", async () => {
        const owner = await createTestUser({
            email: "private-workspace-owner@example.com",
        });

        const outsider = await createTestUser({
            email: "workspace-outsider@example.com",
        });

        const workspaceResponse = await owner.agent
            .post("/api/workspaces")
            .send({
                name: "Private Team",
                description: "Private workspace",
            });

        expect(workspaceResponse.status).toBe(201);

        const workspaceId =
            workspaceResponse.body.workspace._id;

        const response = await outsider.agent
            .get(`/api/workspaces/${workspaceId}/members`);

        expect([403, 404]).toContain(response.status);
    });
});