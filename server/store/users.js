// Phase 3 placeholder — wired to Firebase Auth in the next phase.
//
// Firestore collection: users/{uid}
// Schema:
//   uid          string   Firebase Auth UID (document ID)
//   email        string
//   displayName  string
//   createdAt    Timestamp
//   reportCount  number   incremented when user submits a report

export async function createUser(_uid, _profile) {
  throw new Error("User authentication is not implemented yet (Phase 3).");
}
