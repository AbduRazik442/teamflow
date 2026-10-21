
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createTestUser } from "./helpers/auth.js";

describe("Project authorization", () => {

    it("prevents an unauthorized user from deleting a private project", async () => {
        const owner = await createTestUser({
            email: "delete-owner@example.com",
        });
        const outsider = await createTestUser({
            email: "delete-outsider@example.com",
        });

        const created = await owner.agent.post("/api/projects").send({
            name: "Private Project",
            description: "Must remain private",
            status: "planning",
            priority: "medium",
        });

        expect(created.status).toBe(201);

        const projectId = created.body.project._id;

        const response = await outsider.agent.delete(
            `/api/projects/${projectId}`
        );

        expect([403, 404]).toContain(response.status);

        const stillExists = await owner.agent.get(
            `/api/projects/${projectId}`
        );

        expect(stillExists.status).toBe(200);
    });

    it("allows the owner to delete an empty project", async () => {
        const { agent } = await createTestUser({
            email: "empty-project-owner@example.com",
        });

        const created = await agent.post("/api/projects").send({
            name: "Empty Project",
            description: "Safe to delete",
            status: "planning",
            priority: "medium",
        });

        expect(created.status).toBe(201);

        const projectId = created.body.project._id;

        const response = await agent.delete(
            `/api/projects/${projectId}`
        );

        expect([200, 204]).toContain(response.status);

        const lookup = await agent.get(`/api/projects/${projectId}`);

        expect(lookup.status).toBe(404);
    });

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


    it("prevents deleting a project that still contains tasks", async () => {
        const { agent } = await createTestUser({
            email: "project-with-tasks@example.com",
        });

        const projectResponse = await agent.post("/api/projects").send({
            name: "Project With Tasks",
            description: "Deletion safety test",
            status: "active",
            priority: "medium",
        });

        expect(projectResponse.status).toBe(201);

        const projectId = projectResponse.body.project._id;

        const taskResponse = await agent.post("/api/tasks").send({
            title: "Task that must be preserved",
            description: "The project cannot be deleted yet",
            status: "todo",
            priority: "medium",
            project: projectId,
        });

        expect(taskResponse.status).toBe(201);

        const deleteResponse = await agent.delete(
            `/api/projects/${projectId}`
        );

        expect(deleteResponse.status).toBe(409);
        expect(deleteResponse.body.success).toBe(false);
        expect(deleteResponse.body.taskCount).toBe(1);

        const projectCheck = await agent.get(`/api/projects/${projectId}`);
        const taskCheck = await agent.get(
            `/api/tasks/${taskResponse.body.task._id}`
        );

        expect(projectCheck.status).toBe(200);
        expect(taskCheck.status).toBe(200);
    });

});