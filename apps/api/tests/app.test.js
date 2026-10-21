import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("TeamFlow API", () => {
    it("returns healthy status when MongoDB is connected", async () => {
        const response = await request(app).get("/api/health");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.services.api).toBe("up");
        expect(response.body.services.database).toBe("connected");
    });

    it("returns 404 for an unknown API route", async () => {
        const response = await request(app).get(
            "/api/this-route-does-not-exist"
        );

        expect(response.status).toBe(404);
    });
});