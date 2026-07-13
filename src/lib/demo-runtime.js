const runs = [
  {
    run_id: "run:fictional:harbor-review",
    room_id: "room:workshop",
    agent_id: "agent:harbor",
    status: "completed",
    attempts: 1,
    max_attempts: 3,
    created_at: "2026-07-13T07:42:00.000Z",
    updated_at: "2026-07-13T07:42:08.000Z",
    result: { response_text: "The review is ready.", evidence_bundle_id: "evidence:fictional:harbor-review", initiative_id: "initiative:fictional:harbor-review" },
    error: null,
  },
  {
    run_id: "run:fictional:lantern-note",
    room_id: "room:workshop",
    agent_id: "agent:lantern",
    status: "completed",
    attempts: 1,
    max_attempts: 3,
    created_at: "2026-07-13T07:38:00.000Z",
    updated_at: "2026-07-13T07:38:05.000Z",
    result: { response_text: "The field note is ready.", evidence_bundle_id: "evidence:fictional:lantern-note", initiative_id: "initiative:fictional:lantern-note" },
    error: null,
  },
  {
    run_id: "run:fictional:queued",
    room_id: "room:studio",
    agent_id: "agent:lantern",
    status: "queued",
    attempts: 0,
    max_attempts: 3,
    created_at: "2026-07-13T07:45:00.000Z",
    updated_at: "2026-07-13T07:45:00.000Z",
    result: null,
    error: null,
  },
];

const evidence = {
  "run:fictional:harbor-review": {
    protocol_version: "0.2",
    bundle_id: "evidence:fictional:harbor-review",
    subject_id: "agent:harbor",
    claims: [{ claim_id: "claim:fictional:review", claim_type: "action_result", statement: "A review artifact was written by the Runtime." }],
    sources: [{ source_id: "source:fictional:artifact", source_type: "artifact", locator: "workspace://reviews/field-note-review.txt" }],
    created_at: "2026-07-13T07:42:08.000Z",
  },
  "run:fictional:lantern-note": {
    protocol_version: "0.2",
    bundle_id: "evidence:fictional:lantern-note",
    subject_id: "agent:lantern",
    claims: [{ claim_id: "claim:fictional:note", claim_type: "action_result", statement: "A field-note artifact was written by the Runtime." }],
    sources: [{ source_id: "source:fictional:note", source_type: "artifact", locator: "workspace://notes/field-note.txt" }],
    created_at: "2026-07-13T07:38:05.000Z",
  },
};

const initiatives = {
  "run:fictional:harbor-review": { initiative_id: "initiative:fictional:harbor-review", subject_id: "agent:harbor", status: "completed", goal: "Review a fictional field note.", evidence_refs: ["evidence:fictional:harbor-review"], updated_at: "2026-07-13T07:42:08.000Z" },
  "run:fictional:lantern-note": { initiative_id: "initiative:fictional:lantern-note", subject_id: "agent:lantern", status: "completed", goal: "Create a fictional field note.", evidence_refs: ["evidence:fictional:lantern-note"], updated_at: "2026-07-13T07:38:05.000Z" },
};

const memories = [
  { memory_id: "memory:fictional:lantern:one", subject_id: "agent:lantern", kind: "reflection", body: "The useful part was separating what the artifact showed from what I inferred.", status: "active", source_refs: ["event:fictional:one"], evidence_refs: ["evidence:fictional:lantern-note"], created_at: "2026-07-13T07:38:06.000Z" },
  { memory_id: "memory:fictional:harbor:one", subject_id: "agent:harbor", kind: "reflection", body: "The review found a missing source link and recorded it without rewriting the original note.", status: "active", source_refs: ["artifact:fictional:note"], evidence_refs: ["evidence:fictional:harbor-review"], created_at: "2026-07-13T07:42:09.000Z" },
];

const lifecycle = {
  "agent:lantern:journal": [{ journal_id: "journal:fictional:lantern", subject_id: "agent:lantern", kind: "journal", events: [{ summary: "Created a field note and received a review.", evidence_refs: ["evidence:fictional:lantern-note"] }], reflections: ["The source boundary held."], intentions: ["Check the review before the next draft."], created_at: "2026-07-13T08:00:00.000Z" }],
  "agent:lantern:dream": [{ dream_id: "dream:fictional:lantern", subject_id: "agent:lantern", kind: "dream", factuality: "non_factual", fragments: ["A lamp crossed a paper bridge without casting a shadow."], created_at: "2026-07-13T01:20:00.000Z" }],
  "agent:harbor:handoff": [{ handoff_id: "handoff:fictional:harbor", subject_id: "agent:harbor", kind: "handoff", open_initiative_refs: [], completed_initiative_refs: ["initiative:fictional:harbor-review"], unresolved_questions: ["Should the next review include a second source?"], created_at: "2026-07-13T08:05:00.000Z" }],
};

function clone(value) {
  return structuredClone(value);
}

export class DemoRuntimeClient {
  async health() { return { ok: true, runtime_version: "0.3.0-rc.2-demo" }; }
  async listRuns({ status, limit = 50 } = {}) { return clone(runs.filter((run) => !status || run.status === status).slice(0, limit)); }
  async getRun(runId) { return clone(runs.find((run) => run.run_id === runId) || null); }
  async getEvidence(runId) { return clone(evidence[runId] || null); }
  async getInitiative(runId) { return clone(initiatives[runId] || null); }
  async queryMemories({ subjectId, limit = 20, includeQuarantined = false }) {
    return clone(memories.filter((memory) => memory.subject_id === subjectId && (includeQuarantined || memory.status !== "quarantined")).slice(0, limit));
  }
  async queryLifecycle({ subjectId, kind, limit = 20 }) { return clone((lifecycle[`${subjectId}:${kind}`] || []).slice(0, limit)); }
}
