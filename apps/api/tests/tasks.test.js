
import { describe, it, expect } from "vitest";
import app from "../src/app.js";
import { createTestUser } from "./helpers/auth.js";

describe("Shared task authorization", () => {

    it("prevents another user from viewing or editing a private task", async () => {
        const owner = await createTestUser({
            email: "task-owner@example.com",
        });
        const outsider = await createTestUser({
            email: "task-outsider@example.com",
        });

        const projectResponse = await owner.agent
            .post("/api/projects")
            .send({
                name: "Owner's Private Project",
                description: "Private task authorization test",
                status: "planning",
                priority: "medium",
            });

        expect(projectResponse.status).toBe(201);

        const projectId = projectResponse.body.project._id;

        const taskResponse = await owner.agent.post("/api/tasks").send({
            title: "Private task",
            description: "Only the owner should access this task",
            status: "todo",
            priority: "medium",
            project: projectId,
        });

        expect(taskResponse.status).toBe(201);

        const taskId = taskResponse.body.task._id;

        const viewResponse = await outsider.agent.get(
            `/api/tasks/${taskId}`
        );

        expect(viewResponse.status).toBe(404);

        const editResponse = await outsider.agent
            .patch(`/api/tasks/${taskId}`)
            .send({ status: "completed" });

        expect([403, 404]).toContain(editResponse.status);

        const ownerCheck = await owner.agent.get(`/api/tasks/${taskId}`);

        expect(ownerCheck.status).toBe(200);
        expect(ownerCheck.body.task.status).toBe("todo");
    });

    it("allows a workspace owner to create a task in a shared project", async () => {
        const owner = await createTestUser({
            email: "task-owner@example.com",
        });

        const workspaceResponse = await owner.agent
            .post("/api/workspaces")
            .send({
                name: "Task Testing Team",
                description: "Shared task tests",
            });

        expect(workspaceResponse.status).toBe(201);

        const workspaceId =
            workspaceResponse.body.workspace._id;

        const projectResponse = await owner.agent
            .post("/api/projects")
            .send({
                name: "Shared Website",
                description: "Build the team website",
                status: "planning",
                priority: "high",
                workspace: workspaceId,
            });

        expect(projectResponse.status).toBe(201);

        const projectId = projectResponse.body.project._id;

        const taskResponse = await owner.agent
            .post("/api/tasks")
            .send({
                title: "Build the landing page",
                description: "Create the responsive home page",
                status: "todo",
                priority: "high",
                project: projectId,
            });

        expect(taskResponse.status).toBe(201);
        expect(taskResponse.body.success).toBe(true);
        expect(taskResponse.body.task.title).toBe(
            "Build the landing page"
        );
    });

    it("does not expose a shared task to an unrelated user", async () => {
        const owner = await createTestUser({
            email: "shared-task-owner@example.com",
        });

        const outsider = await createTestUser({
            email: "shared-task-outsider@example.com",
        });

        const workspaceResponse = await owner.agent
            .post("/api/workspaces")
            .send({ name: "Restricted Team" });

        expect(workspaceResponse.status).toBe(201);

        const projectResponse = await owner.agent
            .post("/api/projects")
            .send({
                name: "Restricted Project",
                workspace: workspaceResponse.body.workspace._id,
            });

        expect(projectResponse.status).toBe(201);

        const taskResponse = await owner.agent
            .post("/api/tasks")
            .send({
                title: "Confidential task",
                project: projectResponse.body.project._id,
            });

        expect(taskResponse.status).toBe(201);

        const taskId = taskResponse.body.task._id;

        const response = await outsider.agent
            .get(`/api/tasks/${taskId}`);

        expect(response.status).toBe(404);
    });
});