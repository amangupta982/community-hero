import { FieldValue } from "@google-cloud/firestore";
import { db } from "../config/index.js";
import { DEMO_CLUSTERS } from "../demo/seedData.js";

const COLL = () => db.collection("clusters");

export async function seedDemo(_req, res) {
  // Check how many demo documents already exist.
  const existing = await COLL().where("demoSeeded", "==", true).count().get();
  if (existing.data().count > 0) {
    // Idempotent: seed is already in place. Return the current set.
    const snap = await COLL().where("demoSeeded", "==", true).get();
    return res.json({ seeded: 0, existing: snap.size, message: "Demo data already present" });
  }

  // Insert all demo clusters in one batch.
  const batch = db.batch();
  const ids = DEMO_CLUSTERS.map(() => COLL().doc());
  DEMO_CLUSTERS.forEach((cluster, i) => {
    // Convert ISO string dates to Firestore Timestamps where cluster.js expects them.
    batch.set(ids[i], {
      ...cluster,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  res.json({
    seeded: DEMO_CLUSTERS.length,
    existing: 0,
    message: `Seeded ${DEMO_CLUSTERS.length} demo clusters`,
  });
}

export async function resetDemo(_req, res) {
  const snap = await COLL().where("demoSeeded", "==", true).get();
  if (snap.empty) {
    return res.json({ deleted: 0, message: "No demo data to reset" });
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  res.json({ deleted: snap.size, message: `Deleted ${snap.size} demo clusters` });
}
