import { FieldValue } from "@google-cloud/firestore";
import { db } from "../config/index.js";
import { isWithinClusterRadius, worstSeverity } from "../services/clustering.js";

const COLL = () => db.collection("clusters");

// Bounding-box delta for geo pre-filter (~111 m, well above the 50 m cluster radius).
// Firestore filters to this bbox, then Haversine in memory gives precise distance.
const LAT_DELTA = 0.001;

// ── Serialization ─────────────────────────────────────────────────────────────

function serializeCluster(id, data) {
  return {
    id,
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? data.createdAt ?? null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? data.updatedAt ?? null,
  };
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function listClusters({ limit = 50, after = null } = {}) {
  const cap = Math.min(limit, 100);
  let q = COLL().orderBy("createdAt", "desc").limit(cap);

  if (after) {
    const afterSnap = await COLL().doc(after).get();
    if (afterSnap.exists) q = q.startAfter(afterSnap);
  }

  const snap = await q.get();
  return snap.docs.map((doc) => serializeCluster(doc.id, doc.data()));
}

export async function listAllClusters() {
  const snap = await COLL().orderBy("createdAt", "desc").limit(500).get();
  return snap.docs.map((doc) => serializeCluster(doc.id, doc.data()));
}

export async function findClusterById(id) {
  const doc = await COLL().doc(id).get();
  if (!doc.exists) return null;
  return serializeCluster(doc.id, doc.data());
}

// ── Writes ────────────────────────────────────────────────────────────────────

export async function updateCluster(id, fields) {
  await COLL()
    .doc(id)
    .update({ ...fields, updatedAt: FieldValue.serverTimestamp() });
}

// ── Transactional cluster-or-create ───────────────────────────────────────────
//
// Atomically: find a nearby cluster of the same type → merge into it,
// OR create a new cluster. Using a transaction prevents two simultaneous
// submissions from each creating their own cluster when they should merge.
//
// Read-before-write is strictly maintained inside the transaction callback
// (all tx.get() calls happen before any tx.update() / tx.set() call).

// analysis         — merged finalClassification from pipeline
// photoUrl         — GCS signed URL
// enriched         — optional: { geoResult, contextResult, riskResult, complaintResult, monitoringResult }
export async function submitReport({ analysis, photoUrl, lat, lng, enriched = {} }) {
  const { geoResult, contextResult, riskResult, complaintResult, monitoringResult } = enriched;

  return db.runTransaction(async (tx) => {
    let candidateQuery;

    if (lat != null && lng != null) {
      // Geo pre-filter: narrow the read set to the bounding box before Haversine.
      // Composite index required: (issueType ASC, isCivicIssue ASC, lat ASC)
      candidateQuery = COLL()
        .where("issueType", "==", analysis.issueType)
        .where("isCivicIssue", "==", true)
        .where("lat", ">=", lat - LAT_DELTA)
        .where("lat", "<=", lat + LAT_DELTA)
        .orderBy("lat"); // required when using range filter on lat
    } else {
      // No GPS — skip geo matching entirely; always create a new cluster.
      candidateQuery = null;
    }

    // ── READ phase ────────────────────────────────────────────────────────────
    const snap = candidateQuery ? await tx.get(candidateQuery) : { docs: [] };

    // Precise Haversine check on the candidates returned by the bbox query.
    let matchDoc = null;
    for (const doc of snap.docs) {
      const d = doc.data();
      if (d.lat != null && d.lng != null) {
        if (isWithinClusterRadius({ lat, lng }, { lat: d.lat, lng: d.lng })) {
          matchDoc = doc;
          break;
        }
      }
    }

    // ── WRITE phase ───────────────────────────────────────────────────────────
    if (matchDoc) {
      const existing = matchDoc.data();
      const escalated = worstSeverity(existing.severity, analysis.severity);
      const followUpDate = complaintResult?.followUpDays
        ? new Date(Date.now() + complaintResult.followUpDays * 86_400_000).toISOString()
        : null;
      const updates = {
        reportCount: FieldValue.increment(1),
        severity: escalated,
        photos: FieldValue.arrayUnion(photoUrl),
        updatedAt: FieldValue.serverTimestamp(),
        // Re-run agents upgrade existing cluster's enrichment on merge.
        ...(contextResult && { contextResult }),
        ...(riskResult    && { riskAssessment: riskResult }),
        ...(complaintResult && {
          complaint:        complaintResult.letter,
          department:       complaintResult.department,
          complaintSubject: complaintResult.subject,
          workOrder:        complaintResult.workOrder   ?? null,
          citizenSummary:   complaintResult.citizenSummary ?? null,
          followUpDate,
          status: "Complaint Drafted",
          statusHistory: FieldValue.arrayUnion({
            status: "Complaint Drafted",
            at:     new Date().toISOString(),
            note:   `Complaint re-filed to ${complaintResult.department}`,
          }),
        }),
      };
      tx.update(matchDoc.ref, updates);

      const merged = serializeCluster(matchDoc.id, {
        ...existing,
        reportCount: (existing.reportCount || 1) + 1,
        severity: escalated,
        photos: [...(existing.photos ?? [existing.photo]), photoUrl],
        updatedAt: new Date().toISOString(),
        ...(riskResult && { riskAssessment: riskResult }),
        ...(complaintResult && {
          complaint: complaintResult.letter,
          department: complaintResult.department,
          complaintSubject: complaintResult.subject,
          status: "Complaint Drafted",
        }),
      });
      return { cluster: merged, merged: true };
    }

    // New distinct issue — create a fresh cluster document.
    const newRef = COLL().doc();
    const now = new Date().toISOString();
    const newData = {
      issueType: analysis.issueType,
      severity: analysis.severity,
      description: analysis.description,
      confidence: analysis.confidence,
      isCivicIssue: analysis.isCivicIssue,
      rawObservations: analysis.rawObservations ?? [],
      affectedInfrastructure: analysis.affectedInfrastructure ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      status: complaintResult ? "Complaint Drafted" : "Reported",
      reportCount: 1,
      // Core complaint fields
      complaint:        complaintResult?.letter   ?? null,
      department:       complaintResult?.department ?? null,
      complaintSubject: complaintResult?.subject  ?? null,
      workOrder:        complaintResult?.workOrder ?? null,
      citizenSummary:   complaintResult?.citizenSummary ?? null,
      followUpDate: complaintResult?.followUpDays
        ? new Date(Date.now() + complaintResult.followUpDays * 86_400_000).toISOString()
        : null,
      statusHistory: [
        { status: "Reported",          at: new Date().toISOString(), note: "7-agent AI pipeline completed" },
        ...(complaintResult ? [{ status: "Complaint Drafted", at: new Date().toISOString(), note: `Formal complaint filed to ${complaintResult.department}` }] : []),
      ],
      photo: photoUrl,
      photos: [photoUrl],
      // Enriched agent outputs stored as sub-objects
      geoContext:     geoResult        ?? null,
      contextResult:  contextResult    ?? null,
      riskAssessment: riskResult       ?? null,
      pipelineTrace:  monitoringResult ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: null,
    };
    tx.set(newRef, newData);

    return {
      cluster: serializeCluster(newRef.id, { ...newData, createdAt: now }),
      merged: false,
    };
  });
}
