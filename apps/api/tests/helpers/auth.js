
import request from "supertest";
import app from "../../src/app.js";

export async function createTestUser({
    name = "Test User",
    email = `user-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}@example.com`,
    password = "TestPassword123!",
} = {}) {
    const agent = request.agent(app);

    const response = await agent
        .post("/api/auth/register")
        .send({ name, email, password });

    if (response.status !== 201) {
        throw new Error(
            `Test user registration failed: ${response.status} ${JSON.stringify(response.body)}`
        );
    }

    return {
        agent,
        user: response.body.user,
        email,
        password,
    };
}