import { describe, expect, it, vi } from "vitest";
import { RuntimeHttpClient } from "../src/lib/runtime-client.js";

describe("RuntimeHttpClient", () => {
  it("uses the host cookie transport without placing authentication in the envelope", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ protocol_version: "0.2", request_id: "request:test:one", ok: true, result: [] }) }));
    const client = new RuntimeHttpClient({ endpoint: "/runtime", fetchImpl });
    await client.listRuns({ status: "completed", limit: 20 });
    const [endpoint, options] = fetchImpl.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(endpoint).toBe("/runtime");
    expect(options.credentials).toBe("include");
    expect(body.method).toBe("run.list");
    expect(JSON.stringify(body)).not.toMatch(/token|cookie|session|principal/i);
  });

  it("rejects reserved authentication fields before transport", async () => {
    const fetchImpl = vi.fn();
    const client = new RuntimeHttpClient({ fetchImpl });
    await expect(client.listRuns({ token: "fictional" })).rejects.toMatchObject({ code: "E_RESERVED_AUTH_FIELD" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
