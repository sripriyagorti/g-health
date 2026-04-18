import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getBiomarkersCollection, validateBiomarker } from "../db";

const biomarkers = new Hono();

function oid(id: string) {
  try { return new ObjectId(id); }
  catch { throw new Error("Invalid ID"); }
}

biomarkers.get("/:userId", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const markerType = c.req.query("type");
    const filter: any = { userId };
    if (markerType) filter.markerType = markerType;

    const docs = await getBiomarkersCollection()
      .find(filter)
      .sort({ testDate: -1 })
      .limit(500)
      .toArray();

    return c.json({ biomarkers: docs });
  } catch (error) {
    console.error("List biomarkers error:", error);
    return c.json({ error: "Fetch biomarkers failed" }, 500);
  }
});

biomarkers.post("/:userId", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const body = await c.req.json();
    if (!validateBiomarker(body)) {
      return c.json({ error: "Invalid biomarker data" }, 400);
    }
    const doc = {
      userId,
      markerType: body.markerType,
      value: body.value,
      unit: body.unit,
      testDate: body.testDate ? new Date(body.testDate) : new Date(),
      notes: body.notes,
      source: body.source || 'manual_entry',
      createdAt: new Date(),
    };
    const result = await getBiomarkersCollection().insertOne(doc);
    return c.json({ biomarker: { _id: result.insertedId, ...doc } }, 201);
  } catch (error) {
    console.error("Create biomarker error:", error);
    return c.json({ error: "Save biomarker failed" }, 500);
  }
});

biomarkers.put("/:userId/:id", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const id = oid(c.req.param("id"));
    const body = await c.req.json();
    const updated = await getBiomarkersCollection().findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { returnDocument: "after" }
    );
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ biomarker: updated });
  } catch (error) {
    console.error("Update biomarker error:", error);
    return c.json({ error: "Update failed" }, 500);
  }
});

biomarkers.delete("/:userId/:id", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const id = oid(c.req.param("id"));
    const deleted = await getBiomarkersCollection().findOneAndDelete({ _id: id, userId });
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ ok: true });
  } catch (error) {
    console.error("Delete biomarker error:", error);
    return c.json({ error: "Delete failed" }, 500);
  }
});

export default biomarkers;
