import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getLogsCollection, validateLogData } from "../db";

const logs = new Hono();

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    throw new Error("Invalid ID");
  }
}

// List logs with filtering
logs.get("/:userId", async (c) => {
  try {
    const userId = toObjectId(c.req.param("userId"));
    const type = c.req.query("type");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");
    const limit = parseInt(c.req.query("limit") || "100");
    const skip = parseInt(c.req.query("skip") || "0");

    const filter: any = { userId };
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logsCollection = getLogsCollection();
    const docs = await logsCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    const total = await logsCollection.countDocuments(filter);

    return c.json({
      logs: docs,
      total,
      count: docs.length,
    });
  } catch (error) {
    console.error("List logs error:", error);
    return c.json({ error: "Fetch logs failed" }, 500);
  }
});

// Create log
logs.post("/:userId", async (c) => {
  try {
    const userId = toObjectId(c.req.param("userId"));
    const { type, data, timestamp } = await c.req.json();

    if (!type || !data) {
      return c.json({ error: "Type and data required" }, 400);
    }

    if (!validateLogData(type, data)) {
      return c.json({ error: "Invalid data format for log type" }, 400);
    }

    const logsCollection = getLogsCollection();
    const result = await logsCollection.insertOne({
      userId,
      type,
      data,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return c.json(
      {
        log: {
          _id: result.insertedId,
          userId,
          type,
          data,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      },
      201
    );
  } catch (error) {
    console.error("Create log error:", error);
    return c.json({ error: "Save log failed" }, 500);
  }
});

// Update log
logs.put("/:userId/:logId", async (c) => {
  try {
    const userId = toObjectId(c.req.param("userId"));
    const logId = toObjectId(c.req.param("logId"));
    const body = await c.req.json();

    const logsCollection = getLogsCollection();
    const updated = await logsCollection.findOneAndUpdate(
      { _id: logId, userId },
      { $set: body },
      { returnDocument: "after" }
    );

    if (!updated) {
      return c.json({ error: "Log not found" }, 404);
    }

    return c.json({ log: updated });
  } catch (error) {
    console.error("Update log error:", error);
    return c.json({ error: "Update log failed" }, 500);
  }
});

// Delete log
logs.delete("/:userId/:logId", async (c) => {
  try {
    const userId = toObjectId(c.req.param("userId"));
    const logId = toObjectId(c.req.param("logId"));

    const logsCollection = getLogsCollection();
    const deleted = await logsCollection.findOneAndDelete({
      _id: logId,
      userId,
    });

    if (!deleted) {
      return c.json({ error: "Log not found" }, 404);
    }

    return c.json({
      message: "Log deleted",
      log: deleted,
    });
  } catch (error) {
    console.error("Delete log error:", error);
    return c.json({ error: "Delete log failed" }, 500);
  }
});

// Bulk upsert
logs.post("/:userId/bulk", async (c) => {
  try {
    const userId = toObjectId(c.req.param("userId"));
    const { logs: logArray } = await c.req.json();

    if (!Array.isArray(logArray)) {
      return c.json({ error: "Logs must be array" }, 400);
    }

    const logsCollection = getLogsCollection();
    const operations = logArray.map((log: any) => ({
      updateOne: {
        filter: {
          userId,
          type: log.type,
          timestamp: new Date(log.timestamp),
        },
        update: {
          $set: {
            userId,
            type: log.type,
            data: log.data,
            timestamp: new Date(log.timestamp),
          },
        },
        upsert: true,
      },
    }));

    const result = await logsCollection.bulkWrite(operations as any);

    return c.json({
      message: "Bulk upsert complete",
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      total: result.upsertedCount + result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk upsert error:", error);
    return c.json({ error: "Bulk upsert failed" }, 500);
  }
});

// Analytics
logs.get("/:userId/analytics", async (c) => {
  try {
    const userId = toObjectId(c.req.param("userId"));

    const logsCollection = getLogsCollection();
    const docs = await logsCollection
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();

    const analytics = {
      totalLogs: docs.length,
      byType: {
        weight: docs.filter((l: any) => l.type === "weight").length,
        bp: docs.filter((l: any) => l.type === "bp").length,
        food: docs.filter((l: any) => l.type === "food").length,
        exercise: docs.filter((l: any) => l.type === "exercise").length,
        lipids: docs.filter((l: any) => l.type === "lipids").length,
      },
      dateRange:
        docs.length > 0
          ? {
              earliest: docs[docs.length - 1].timestamp,
              latest: docs[0].timestamp,
            }
          : null,
      recentData: {
        weight: docs.find((l: any) => l.type === "weight")?.data,
        bp: docs.find((l: any) => l.type === "bp")?.data,
        lastExercise: docs.find((l: any) => l.type === "exercise")?.data,
        lastMeal: docs.find((l: any) => l.type === "food")?.data,
        lastLipids: docs.find((l: any) => l.type === "lipids")?.data,
      },
    };

    return c.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    return c.json({ error: "Analytics failed" }, 500);
  }
});

export default logs;
