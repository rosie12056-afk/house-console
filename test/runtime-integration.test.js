import { strict as assert } from "node:assert";
import { mkdtempSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "vitest";
import { HouseRuntime, RuntimeService } from "house-runtime";
import { RuntimeHttpClient } from "../src/lib/runtime-client.js";

const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

test("HTTP client reads Runs, Evidence, and Initiatives from a real RuntimeService", async () => {
  const root = mkdtempSync(join(tmpdir(), "house-console-integration-"));
  const runtime = new HouseRuntime({ dbPath: join(root, "runtime.db"), workspaceDir: join(root, "workspace") })
    .registerAgent("agent:lantern", {
      async generate() {
        return { response_text: "Created.", work: { goal: "Create a fictional artifact.", artifacts: [{ path: "note.txt", content: "Fictional content.\n" }] } };
      },
    });
  cleanups.push(async () => runtime.close());
  const completed = await runtime.submit({ roomId: "room:fictional", agentId: "agent:lantern", message: "Create the note.", idempotencyKey: "console-integration-one" });
  const service = new RuntimeService(runtime, { authorize: async () => ({ subjectId: "user:fictional" }) });
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const envelope = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const result = await service.handle(envelope, { authContext: { verifiedByHost: true } });
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(result));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  cleanups.push(async () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  const client = new RuntimeHttpClient({ endpoint: `http://127.0.0.1:${address.port}` });

  const runs = await client.listRuns({ status: "completed", limit: 20 });
  const evidence = await client.getEvidence(completed.run_id);
  const initiative = await client.getInitiative(completed.run_id);

  assert.equal(runs[0].run_id, completed.run_id);
  assert.equal(evidence.bundle_id, completed.result.evidence_bundle_id);
  assert.equal(initiative.initiative_id, completed.result.initiative_id);
});
