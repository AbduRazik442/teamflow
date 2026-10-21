
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createTestUser } from "./helpers/auth.js";

describe("Project authorization", () => {
    it("rejects unauthenticated project requests", async () => {
        const response = await request(app).get("/api/projects");

        expect(response.status).toBe(401);
    });

    it("allows an authenticated user to create a personal project", async () => {
        const { agent } = await createTestUser();

        const response = await agent
            .post("/api/projects")
            .send({
                name: "Test Project",
                description: "Created by an integration test",
                status: "planning",
                priority: "medium",
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.project.name).toBe("Test Project");
    });

    it("prevents one user from viewing another user's private project", async () => {
        const owner = await createTestUser({
            email: "project-owner@example.com",
        });

        const otherUser = await createTestUser({
            email: "other-user@example.com",
        });

        const created = await owner.agent
            .post("/api/projects")
            .send({
                name: "Private Project",
                description: "Only the owner should access this",
                status: "planning",
                priority: "medium",
            });

        expect(created.status).toBe(201);

        const projectId = created.body.project._id;

        const response = await otherUser.agent
            .get(`/api/projects/${projectId}`);

        expect(response.status).toBe(404);
    });
});