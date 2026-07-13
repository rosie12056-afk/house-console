const RESERVED_AUTH_KEYS = new Set(["auth", "authentication", "authenticated_by", "cookie", "principal", "session", "token"]);

function containsReservedAuthField(value) {
  if (Array.isArray(value)) return value.some(containsReservedAuthField);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => RESERVED_AUTH_KEYS.has(key.toLowerCase()) || containsReservedAuthField(child));
}

function requestId() {
  return `request:console:${crypto.randomUUID()}`;
}

export class RuntimeHttpClient {
  constructor({ endpoint = "/api/runtime", fetchImpl = fetch } = {}) {
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
  }

  async request(method, params = {}) {
    if (containsReservedAuthField(params)) {
      throw Object.assign(new Error("Authentication belongs to the host transport, not request data."), { code: "E_RESERVED_AUTH_FIELD" });
    }
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ protocol_version: "0.2", request_id: requestId(), method, params }),
    });
    if (!response.ok) throw Object.assign(new Error(`Runtime transport failed with HTTP ${response.status}.`), { code: "E_HTTP_TRANSPORT" });
    const envelope = await response.json();
    if (!envelope || typeof envelope.ok !== "boolean") throw Object.assign(new Error("Runtime returned an invalid response."), { code: "E_BAD_RESPONSE" });
    if (!envelope.ok) throw Object.assign(new Error(envelope.error?.message || "Runtime request failed."), { code: envelope.error?.code || "E_RUNTIME_REQUEST" });
    return envelope.result;
  }

  health() { return this.request("runtime.health", {}); }
  listRuns(params = {}) { return this.request("run.list", params); }
  getRun(runId) { return this.request("run.get", { runId }); }
  getEvidence(runId) { return this.request("evidence.get", { runId }); }
  getInitiative(runId) { return this.request("initiative.get", { runId }); }
  queryMemories(params) { return this.request("memory.query", params); }
  queryLifecycle(params) { return this.request("lifecycle.query", params); }
}
