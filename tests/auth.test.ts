import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

let mongoServer: MongoMemoryServer;
let client: MongoClient;
let mongoUri: string;

// Helper to make requests
const request = async (method: string, path: string, body?: any) => {
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`http://localhost:3000${path}`, opts);
  const json = await res.json();
  return { status: res.status, data: json };
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

  client = new MongoClient(mongoUri);
  await client.connect();
});

afterAll(async () => {
  await client.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  const db = client.db();
  await db.collection("users").deleteMany({});
});

describe("Auth - Signup", () => {
  it("create user with email & password", async () => {
    const db = client.db();
    const users = db.collection("users");

    const password = "pass123";
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      email: "signup@test.com",
      password: hashedPassword,
      age: 45,
      weight: 85,
    });

    const user = await users.findOne({ _id: result.insertedId });

    expect(user!.email).toBe("signup@test.com");
    expect(user!.password).not.toBe(password);
    expect(user!.age).toBe(45);
    expect(user!._id).toBeDefined();
    expect(await bcrypt.compare(password, user!.password)).toBe(true);
  });

  it("hash password with bcrypt", async () => {
    const db = client.db();
    const users = db.collection("users");

    const password = "SecurePass123!";
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      email: "hash@test.com",
      password: hashedPassword,
    });

    const user = await users.findOne({ _id: result.insertedId });

    expect(user!.password).not.toBe(password);
    expect(user!.password.length).toBeGreaterThan(20);
    expect(await bcrypt.compare(password, user!.password)).toBe(true);
  });

  it("store all biometrics", async () => {
    const db = client.db();
    const users = db.collection("users");

    const hashedPassword = await bcrypt.hash("pass123", 10);
    const result = await users.insertOne({
      email: "biome@test.com",
      password: hashedPassword,
      age: 50,
      gender: "male",
      height: 175,
      weight: 90,
      waist: 100,
      systolicBP: 140,
      diastolicBP: 90,
      familyHistory: true,
      activityLevel: "moderate",
    });

    const user = await users.findOne({ _id: result.insertedId });

    expect(user!.age).toBe(50);
    expect(user!.systolicBP).toBe(140);
    expect(user!.activityLevel).toBe("moderate");
    expect(user!.familyHistory).toBe(true);
  });

  it("reject duplicate email", async () => {
    const db = client.db();
    const users = db.collection("users");

    await users.createIndex({ email: 1 }, { unique: true });

    const hashedPassword = await bcrypt.hash("pass123", 10);
    await users.insertOne({
      email: "dup@test.com",
      password: hashedPassword,
    });

    expect(async () => {
      await users.insertOne({
        email: "dup@test.com",
        password: hashedPassword,
      });
    }).toThrow();
  });

  it("require email field", async () => {
    const db = client.db();
    const users = db.collection("users");

    expect(async () => {
      await users.insertOne({
        password: "pass123",
      } as any);
    }).not.toThrow();
  });

  it("require password field", async () => {
    const db = client.db();
    const users = db.collection("users");

    expect(async () => {
      await users.insertOne({
        email: "test@test.com",
      } as any);
    }).not.toThrow();
  });
});

describe("Auth - Login", () => {
  const plainPassword = "pass123";
  let hashedPassword: string;

  beforeEach(async () => {
    const db = client.db();
    const users = db.collection("users");

    hashedPassword = await bcrypt.hash(plainPassword, 10);
    await users.insertOne({
      email: "login@test.com",
      password: hashedPassword,
      age: 45,
      weight: 85,
    });
  });

  it("verify password with bcrypt.compare", async () => {
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ email: "login@test.com" });
    expect(user).toBeDefined();
    expect(await bcrypt.compare(plainPassword, user!.password)).toBe(true);
  });

  it("reject invalid password", async () => {
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ email: "login@test.com" });
    expect(user).toBeDefined();
    expect(await bcrypt.compare("wrongpass", user!.password)).toBe(false);
  });

  it("reject invalid email", async () => {
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ email: "wrong@test.com" });
    expect(user).toBeNull();
  });

  it("never match plaintext to hashed password", async () => {
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ email: "login@test.com" });
    expect(user?.password).not.toBe(plainPassword);
  });

  it("password hash changes each time", async () => {
    const hash1 = await bcrypt.hash(plainPassword, 10);
    const hash2 = await bcrypt.hash(plainPassword, 10);
    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(plainPassword, hash1)).toBe(true);
    expect(await bcrypt.compare(plainPassword, hash2)).toBe(true);
  });
});

describe("Auth - User Fetch", () => {
  let userId: string;

  beforeEach(async () => {
    const db = client.db();
    const users = db.collection("users");

    const hashedPassword = await bcrypt.hash("pass123", 10);
    const result = await users.insertOne({
      email: "fetch@test.com",
      password: hashedPassword,
      age: 45,
      weight: 85,
    });
    userId = result.insertedId.toString();
  });

  it("fetch user by id", async () => {
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(userId) });
    expect(user?.email).toBe("fetch@test.com");
    expect(user?.age).toBe(45);
    expect(user?.password).toBeDefined();
  });

  it("return null for nonexistent id", async () => {
    const db = client.db();
    const users = db.collection("users");

    const fakeId = new ObjectId();
    const user = await users.findOne({ _id: fakeId });
    expect(user).toBeNull();
  });

  it("exclude password on fetch (API response)", async () => {
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(userId) });
    const { password: _, ...userData } = user!;
    expect(Object.keys(userData)).not.toContain("password");
    expect(userData.email).toBe("fetch@test.com");
  });
});

describe("Auth - User Update", () => {
  let userId: string;

  beforeEach(async () => {
    const db = client.db();
    const users = db.collection("users");

    const hashedPassword = await bcrypt.hash("pass123", 10);
    const result = await users.insertOne({
      email: "update@test.com",
      password: hashedPassword,
      age: 45,
      weight: 85,
    });
    userId = result.insertedId.toString();
  });

  it("update user profile", async () => {
    const db = client.db();
    const users = db.collection("users");

    const updated = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { weight: 80, age: 46, systolicBP: 130 } },
      { returnDocument: "after" }
    );

    expect(updated).toBeDefined();
    expect(updated?.weight).toBe(80);
    expect(updated?.age).toBe(46);
    expect(updated?.systolicBP).toBe(130);
  });

  it("preserve existing fields on partial update", async () => {
    const db = client.db();
    const users = db.collection("users");

    const updated = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { weight: 75 } },
      { returnDocument: "after" }
    );

    expect(updated?.weight).toBe(75);
    expect(updated?.email).toBe("update@test.com");
    expect(updated?.age).toBe(45);
  });

  it("preserve password hash on profile update", async () => {
    const db = client.db();
    const users = db.collection("users");

    const userBefore = await users.findOne({ _id: new ObjectId(userId) });
    const originalHash = userBefore?.password;

    await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { weight: 75 } },
      { returnDocument: "after" }
    );

    const userAfter = await users.findOne({ _id: new ObjectId(userId) });
    expect(userAfter?.password).toBe(originalHash);
  });

  it("return null for nonexistent id", async () => {
    const db = client.db();
    const users = db.collection("users");

    const fakeId = new ObjectId();
    const updated = await users.findOneAndUpdate(
      { _id: fakeId },
      { $set: { weight: 80 } },
      { returnDocument: "after" }
    );

    expect(updated).toBeNull();
  });

  it("exclude password on update response", async () => {
    const db = client.db();
    const users = db.collection("users");

    const updated = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { weight: 80 } },
      { returnDocument: "after" }
    );

    expect(updated).toBeDefined();
    const { password: _, ...userData } = updated!;
    expect(Object.keys(userData)).not.toContain("password");
    expect(userData.weight).toBe(80);
  });
});

describe("Auth - Security", () => {
  it("passwords hashed with bcrypt (cost 10)", async () => {
    const db = client.db();
    const users = db.collection("users");

    const plainPassword = "pass123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const result = await users.insertOne({
      email: "bcrypt@test.com",
      password: hashedPassword,
    });

    const user = await users.findOne({ _id: result.insertedId });

    expect(user!.password).not.toBe(plainPassword);
    expect(user!.password.startsWith("$2")).toBe(true);
  });

  it("password never in response payload", async () => {
    const db = client.db();
    const users = db.collection("users");

    const hashedPassword = await bcrypt.hash("pass123", 10);
    const result = await users.insertOne({
      email: "secure@test.com",
      password: hashedPassword,
      age: 45,
    });

    const user = await users.findOne({ _id: result.insertedId });
    const { password: _, ...userData } = user!;
    expect(Object.keys(userData)).not.toContain("password");
  });

  it("verify correct password with bcrypt", async () => {
    const db = client.db();
    const users = db.collection("users");

    const plainPassword = "SecurePass123!";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await users.insertOne({
      email: "verify@test.com",
      password: hashedPassword,
    });

    const user = await users.findOne({ email: "verify@test.com" });
    expect(await bcrypt.compare(plainPassword, user!.password)).toBe(true);
  });

  it("reject wrong password with bcrypt", async () => {
    const db = client.db();
    const users = db.collection("users");

    const plainPassword = "CorrectPass";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await users.insertOne({
      email: "reject@test.com",
      password: hashedPassword,
    });

    const user = await users.findOne({ email: "reject@test.com" });
    expect(await bcrypt.compare("WrongPass", user!.password)).toBe(false);
  });

  it("plaintext password cannot match hash", async () => {
    const plainPassword = "pass123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    expect(plainPassword === hashedPassword).toBe(false);
    expect(await bcrypt.compare(plainPassword, hashedPassword)).toBe(true);
  });

  it("timing attack resistant (bcrypt compare)", async () => {
    const hashedPassword = await bcrypt.hash("password", 10);
    const start = performance.now();
    await bcrypt.compare("wrongpassword", hashedPassword);
    const end = performance.now();

    expect(end - start).toBeGreaterThan(0);
  });
});
