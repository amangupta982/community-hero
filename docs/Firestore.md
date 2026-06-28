# Firestore

## Database Setup

Community Hero uses **Firestore in Native mode**. Do not use Datastore mode — Native mode is required for real-time listeners (even though we currently use polling).

Create the database:

```bash
gcloud firestore databases create --location=asia-south1
```

Choose a region close to your Cloud Run service. `asia-south1` (Mumbai) is recommended for Indian deployments.

---

## Collections

### `clusters`

Primary collection. One document = one distinct civic issue at a location.

**Document ID**: Auto-generated Firestore document ID.

**Schema**: See [Architecture.md](Architecture.md#data-model) for the full TypeScript interface.

**Key fields for querying**:

| Field | Type | Indexed | Description |
|---|---|---|---|
| `issueType` | string | ✅ (composite) | Issue category |
| `isCivicIssue` | boolean | ✅ (composite) | Filter for real civic issues |
| `lat` | number | ✅ (composite, range) | Latitude for geo clustering |
| `createdAt` | Timestamp | ✅ (auto) | Creation time — used for `orderBy` |

### `complaints`

Audit log of all drafted complaint texts.

| Field | Type | Description |
|---|---|---|
| `clusterId` | string | Reference to parent cluster |
| `text` | string | Full complaint letter text |
| `department` | string | Addressed department |
| `createdAt` | Timestamp | When complaint was drafted |

### `activity_logs`

Immutable append-only audit trail.

| Field | Type | Description |
|---|---|---|
| `type` | string | Event type: `report_created`, `cluster_merged`, `complaint_drafted` |
| `clusterId` | string | Related cluster ID |
| `metadata` | object | Additional context (pipelineId, agentCount, etc.) |
| `createdAt` | Timestamp | When the event occurred |

### `users`

User preference documents (currently unused in the main flow; reserved for future authentication).

---

## Composite Indexes

Two composite indexes are required for geo-clustering. Without them, the bounding-box query in `store/clusters.js` throws `FAILED_PRECONDITION`.

### Index 1 — Primary geo-clustering query

```json
{
  "collectionGroup": "clusters",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "issueType",    "order": "ASCENDING" },
    { "fieldPath": "isCivicIssue", "order": "ASCENDING" },
    { "fieldPath": "lat",          "order": "ASCENDING" }
  ]
}
```

**Query it enables:**
```javascript
db.collection("clusters")
  .where("issueType", "==", analysis.issueType)
  .where("isCivicIssue", "==", true)
  .where("lat", ">=", lat - LAT_DELTA)
  .where("lat", "<=", lat + LAT_DELTA)
  .orderBy("lat")
```

### Index 2 — Historical context query (Context Agent)

```json
{
  "collectionGroup": "clusters",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "issueType", "order": "ASCENDING" },
    { "fieldPath": "lat",       "order": "ASCENDING" }
  ]
}
```

**Query it enables** (inside `agents/context.js`):
```javascript
db.collection("clusters")
  .where("issueType", "==", issueType)
  .where("lat", ">=", lat - LAT_DELTA)
  .where("lat", "<=", lat + LAT_DELTA)
  .orderBy("lat")
  .limit(10)
```

### Deploy indexes

```bash
firebase deploy --only firestore:indexes
```

Index building takes **1–10 minutes**. The server logs `FAILED_PRECONDITION: That index is currently building` during this window and degrades gracefully (skips geo-clustering, creates a new cluster instead of merging).

---

## Transactions

The `submitReport()` function in `store/clusters.js` uses `db.runTransaction()` to ensure atomic cluster-or-create semantics:

```
READ PHASE  → query candidate clusters (bbox pre-filter + Haversine in-memory)
WRITE PHASE → tx.update(existingCluster) OR tx.set(newCluster)
```

This prevents two simultaneous submissions from the same location each creating their own cluster. Firestore transactions retry automatically on contention (up to 5 times with exponential backoff).

**Important**: All `tx.get()` calls must precede all `tx.update()` / `tx.set()` calls within the same transaction callback. Interleaving reads and writes causes a Firestore error. The current implementation strictly maintains this ordering.

---

## Security Rules

> **Current state**: Firestore security rules are managed via the Firebase Console and not versioned in this repository. For production, add a `firestore.rules` file and deploy it with `firebase deploy --only firestore:rules`.

Recommended minimal rules (all writes go through the server; no direct client writes):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Block all direct client reads/writes.
    // The Express server uses the Admin SDK which bypasses these rules.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

If you add client-side Firebase SDK access in the future, scope rules to authenticated users and specific collection paths.

---

## Querying the Database

### Cloud Console

Open the [Firestore Console](https://console.firebase.google.com/) → select your project → Firestore Database.

### Programmatically (local script)

```javascript
import { Firestore } from "@google-cloud/firestore";
const db = new Firestore({ projectId: "your-project-id" });
const snap = await db.collection("clusters").orderBy("createdAt", "desc").limit(10).get();
snap.docs.forEach(doc => console.log(doc.id, doc.data()));
```

### Export / Backup

```bash
gcloud firestore export gs://YOUR_BACKUP_BUCKET/firestore-backup-$(date +%Y%m%d)
```

---

## Known Limitations

- **`listAllClusters()`** reads up to 500 documents per call (used by the dashboard). For deployments with thousands of reports, add time-range filtering or aggregation.
- **No TTL / cleanup**: Old demo data and non-civic reports are never automatically deleted. Consider a Cloud Scheduler job to clean up documents older than 90 days.
- **Firestore Security Rules**: Currently not versioned. Add `firestore.rules` before enabling any client-side Firebase SDK usage.
