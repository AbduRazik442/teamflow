import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
process.env.JWT_SECRET =
    "teamflow-integration-test-secret-do-not-use-in-production";

process.env.JWT_EXPIRES_IN = "1h";

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri(), {
        serverSelectionTimeoutMS: 10000,
    });
}, 30000);

afterEach(async () => {
    // Clear only the isolated test database.
    const collections = mongoose.connection.collections;

    for (const collection of Object.values(collections)) {
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
}, 30000);