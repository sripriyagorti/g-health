import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getMedicationsCollection, getAdherenceCollection } from "../db";

const meds = new Hono();

function oid(id: string) {
  try { return new ObjectId(id); }
  catch { throw new Error("Invalid ID"); }
}

meds.get("/:userId", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const docs = await getMedicationsCollection().find({ userId }).sort({ createdAt: -1 }).toArray();
    return c.json({ medications: docs });
  } catch (error) {
    console.error("List meds error:", error);
    return c.json({ error: "Fetch meds failed" }, 500);
  }
});

meds.post("/:userId", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const body = await c.req.json();
    if (!body.name || !body.dosage || !body.frequency) {
      return c.json({ error: "name, dosage, frequency required" }, 400);
    }
    const doc = {
      userId,
      name: body.name,
      dosage: body.dosage,
      frequency: body.frequency,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      indication: body.indication,
      notes: body.notes,
      active: body.active !== false,
      createdAt: new Date(),
    };
    const result = await getMedicationsCollection().insertOne(doc);
    return c.json({ medication: { _id: result.insertedId, ...doc } }, 201);
  } catch (error) {
    console.error("Create med error:", error);
    return c.json({ error: "Save med failed" }, 500);
  }
});

meds.put("/:userId/:id", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const id = oid(c.req.param("id"));
    const body = await c.req.json();
    const updated = await getMedicationsCollection().findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { returnDocument: "after" }
    );
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ medication: updated });
  } catch (error) {
    console.error("Update med error:", error);
    return c.json({ error: "Update failed" }, 500);
  }
});

meds.delete("/:userId/:id", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const id = oid(c.req.param("id"));
    const deleted = await getMedicationsCollection().findOneAndDelete({ _id: id, userId });
    if (!deleted) return c.json({ error: "Not found" }, 404);
    await getAdherenceCollection().deleteMany({ userId, medicationId: id });
    return c.json({ ok: true });
  } catch (error) {
    console.error("Delete med error:", error);
    return c.json({ error: "Delete failed" }, 500);
  }
});

meds.get("/:userId/adherence", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const medicationId = c.req.query("medicationId");
    const startDate = c.req.query("startDate");
    const filter: any = { userId };
    if (medicationId) filter.medicationId = oid(medicationId);
    if (startDate) filter.date = { $gte: startDate };

    const docs = await getAdherenceCollection().find(filter).sort({ date: -1 }).limit(1000).toArray();
    return c.json({ adherence: docs });
  } catch (error) {
    console.error("List adherence error:", error);
    return c.json({ error: "Fetch adherence failed" }, 500);
  }
});

meds.post("/:userId/adherence", async (c) => {
  try {
    const userId = oid(c.req.param("userId"));
    const body = await c.req.json();
    if (!body.medicationId || !body.date || typeof body.taken !== 'boolean') {
      return c.json({ error: "medicationId, date, taken required" }, 400);
    }
    const medicationId = oid(body.medicationId);
    const doc = {
      userId,
      medicationId,
      date: body.date,
      taken: body.taken,
      notes: body.notes,
      timestamp: new Date(),
    };
    const result = await getAdherenceCollection().findOneAndUpdate(
      { userId, medicationId, date: body.date },
      { $set: doc },
      { upsert: true, returnDocument: "after" }
    );
    return c.json({ adherence: result }, 201);
  } catch (error) {
    console.error("Save adherence error:", error);
    return c.json({ error: "Save adherence failed" }, 500);
  }
});

export default meds;
