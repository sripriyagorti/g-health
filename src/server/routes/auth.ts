import { Hono } from "hono";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { getUsersCollection, validateEmail, validatePassword } from "../db";

const auth = new Hono();

// Signup
auth.post("/signup", async (c) => {
  try {
    const { email, password, ...biometrics } = await c.req.json();

    if (!validateEmail(email)) {
      return c.json({ error: "Invalid email" }, 400);
    }
    if (!validatePassword(password)) {
      return c.json({ error: "Password must be at least 3 characters" }, 400);
    }

    const users = getUsersCollection();
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return c.json({ error: "Email already in use" }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      email,
      password: hashedPassword,
      ...biometrics,
    });

    return c.json(
      {
        user: {
          id: result.insertedId,
          email,
          ...biometrics,
        },
      },
      201
    );
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// Login
auth.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }

    const users = getUsersCollection();
    const user = await users.findOne({ email });
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const { password: _, ...userData } = user;
    return c.json({
      user: {
        id: user._id,
        ...userData,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Get user
auth.get("/user/:id", async (c) => {
  try {
    let userId: ObjectId;
    try {
      userId = new ObjectId(c.req.param("id"));
    } catch {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const users = getUsersCollection();
    const user = await users.findOne({ _id: userId });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const { password: _, ...userData } = user;
    return c.json({
      user: {
        id: user._id,
        ...userData,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Fetch user failed" }, 500);
  }
});

// Update user
auth.put("/user/:id", async (c) => {
  try {
    let userId: ObjectId;
    try {
      userId = new ObjectId(c.req.param("id"));
    } catch {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const body = await c.req.json();
    const users = getUsersCollection();
    const updated = await users.findOneAndUpdate(
      { _id: userId },
      { $set: body },
      { returnDocument: "after" }
    );

    if (!updated) {
      return c.json({ error: "User not found" }, 404);
    }

    const { password: _, ...userData } = updated;
    return c.json({
      user: {
        id: updated._id,
        ...userData,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return c.json({ error: "Update user failed" }, 500);
  }
});

export default auth;
