import { test } from "node:test";
import assert from "node:assert/strict";
import {
  callJev,
  enrichViolations,
  buildRequestBody,
  JevApiError,
  JevState,
} from "../src/jevClient";
import { Rule } from "../src/types";

function makeRule(id: string, name = id, instructions = "Do the thing."): Rule {
  return { id, name, instructions, headingLine: 0 };
}

function makeState(overrides: Partial<JevState> = {}): JevState {
  return {
    diff: "+added line\n",
    diffTruncated: false,
    files: [],
    disclosures: [],
    ...overrides,
  };
}

type FetchArgs = Parameters<typeof fetch>;

/** Installs a fetch mock for the duration of one test and restores it after. */
async function withMockFetch<T>(
  impl: (input: FetchArgs[0], init?: FetchArgs[1]) => Promise<Response>,
  run: () => Promise<T>
): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: FetchArgs[0], init?: FetchArgs[1]) => {
    return impl(input, init);
  }) as typeof fetch;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// buildRequestBody
// ---------------------------------------------------------------------------

test("buildRequestBody sends the review policy once in state, not per rule", () => {
  const rules = [makeRule("a"), makeRule("b"), makeRule("c")];
  const body = buildRequestBody(rules, makeState()) as {
    state: { reviewPolicy: string };
    questions: Record<string, { instructions: string }>;
  };
  assert.equal(typeof body.state.reviewPolicy, "string");
  assert.ok(body.state.reviewPolicy.length > 0);
  for (const rule of rules) {
    assert.ok(!body.questions[rule.id].instructions.includes("Judge ONLY"));
    assert.ok(body.questions[rule.id].instructions.includes(rule.name));
  }
});

test("buildRequestBody creates one choice question per rule with a compliant/violation/not_applicable/insufficient_context criteria set", () => {
  const body = buildRequestBody([makeRule("r1")], makeState()) as {
    questions: Record<string, { type: string; criteria: Record<string, string> }>;
  };
  const q = body.questions.r1;
  assert.equal(q.type, "choice");
  assert.deepEqual(
    Object.keys(q.criteria).sort(),
    ["compliant", "insufficient_context", "not_applicable", "violation"]
  );
});

// ---------------------------------------------------------------------------
// callJev — happy path & answer parsing
// ---------------------------------------------------------------------------

test("callJev returns no_rules error for an empty rule list without making a request", async () => {
  await assert.rejects(
    () => callJev("key", [], makeState()),
    (err: unknown) => err instanceof JevApiError && err.kind === "no_rules"
  );
});

test("callJev maps a valid choice answer to the matching outcome", async () => {
  const rules = [makeRule("r1"), makeRule("r2")];
  await withMockFetch(
    async () =>
      jsonResponse({
        answers: {
          r1: { type: "choice", choice: "violation", confidence: 0.9 },
          r2: { type: "choice", choice: "compliant", confidence: 0.5 },
        },
      }),
    async () => {
      const result = await callJev("key", rules, makeState());
      assert.equal(result.length, 2);
      assert.equal(result[0].ruleId, "r1");
      assert.equal(result[0].outcome, "violation");
      assert.equal(result[0].confidence, 0.9);
      assert.equal(result[1].outcome, "compliant");
    }
  );
});

test("callJev marks a rule as error when the API response has no answer for it", async () => {
  await withMockFetch(
    async () => jsonResponse({ answers: {} }),
    async () => {
      const result = await callJev("key", [makeRule("r1")], makeState());
      assert.equal(result[0].outcome, "error");
      assert.match(result[0].errorMessage ?? "", /No valid answer/);
    }
  );
});

test("callJev marks a rule as error when the choice value is not a recognized outcome", async () => {
  await withMockFetch(
    async () => jsonResponse({ answers: { r1: { type: "choice", choice: "maybe" } } }),
    async () => {
      const result = await callJev("key", [makeRule("r1")], makeState());
      assert.equal(result[0].outcome, "error");
      assert.match(result[0].errorMessage ?? "", /Unrecognized choice value: maybe/);
    }
  );
});

// ---------------------------------------------------------------------------
// callJev — HTTP error classification
// ---------------------------------------------------------------------------

test("callJev classifies 401 as an auth error", async () => {
  await withMockFetch(
    async () => new Response("", { status: 401 }),
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "auth"
      )
  );
});

test("callJev classifies 429 as a rate_limit error", async () => {
  await withMockFetch(
    async () => new Response("", { status: 429 }),
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "rate_limit"
      )
  );
});

test("callJev classifies 529 as a service error", async () => {
  await withMockFetch(
    async () => new Response("", { status: 529 }),
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "service"
      )
  );
});

test("callJev classifies a 400 with a max_tokens_exceeded body as payload_too_large", async () => {
  await withMockFetch(
    async () =>
      new Response(JSON.stringify({ detail: { error_type: "max_tokens_exceeded" } }), {
        status: 400,
      }),
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "payload_too_large"
      )
  );
});

test("callJev classifies a 400 with an unrelated body as invalid_response, not payload_too_large", async () => {
  await withMockFetch(
    async () => new Response(JSON.stringify({ detail: "field 'model' is required" }), { status: 400 }),
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "invalid_response"
      )
  );
});

test("callJev classifies an unmapped error status as a generic service error", async () => {
  await withMockFetch(
    async () => new Response("internal error", { status: 500 }),
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "service"
      )
  );
});

test("callJev reports invalid_response when the body is not valid JSON", async () => {
  await withMockFetch(
    async () => new Response("not json{{{", { status: 200 }),
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "invalid_response"
      )
  );
});

test("callJev reports invalid_response when the body is ok JSON but has no answers map", async () => {
  await withMockFetch(
    async () => jsonResponse({ model: "jev-latest" }),
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "invalid_response"
      )
  );
});

test("callJev reports network errors when fetch itself throws", async () => {
  await withMockFetch(
    async () => {
      throw new TypeError("fetch failed");
    },
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState()),
        (err: unknown) => err instanceof JevApiError && err.kind === "network"
      )
  );
});

test("callJev reports timeout when the external signal is already aborted", async () => {
  const controller = new AbortController();
  controller.abort();
  await withMockFetch(
    async (_input, init) => {
      // Real fetch would reject with an AbortError once the signal fires;
      // simulate that instead of actually depending on Node's fetch/abort wiring.
      if (init?.signal?.aborted) {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      }
      throw new Error("signal was not propagated to fetch");
    },
    () =>
      assert.rejects(
        () => callJev("key", [makeRule("r1")], makeState(), controller.signal),
        (err: unknown) =>
          err instanceof JevApiError && err.kind === "timeout" && /superseded/.test(err.message)
      )
  );
});

// ---------------------------------------------------------------------------
// callJev — adaptive batching
// ---------------------------------------------------------------------------

test("callJev batches rules and preserves original order across batch boundaries", async () => {
  const rules = [makeRule("r1"), makeRule("r2"), makeRule("r3"), makeRule("r4"), makeRule("r5")];
  let requestCount = 0;
  const seenBatchSizes: number[] = [];

  await withMockFetch(
    async (_input, init) => {
      requestCount++;
      const body = JSON.parse(init?.body as string) as { questions: Record<string, unknown> };
      const ids = Object.keys(body.questions);
      seenBatchSizes.push(ids.length);
      const answers: Record<string, unknown> = {};
      for (const id of ids) {
        answers[id] = { type: "choice", choice: "compliant" };
      }
      return jsonResponse({ answers });
    },
    async () => {
      // requestedBatchSize=2 forces 5 rules into 3 batches (2, 2, 1).
      const result = await callJev("key", rules, makeState(), undefined, 2);
      assert.equal(requestCount, 3);
      assert.deepEqual(seenBatchSizes.sort(), [1, 2, 2]);
      assert.deepEqual(result.map((r) => r.ruleId), ["r1", "r2", "r3", "r4", "r5"]);
    }
  );
});

test("callJev fails fast with payload_too_large when diff/file context alone is oversized, without making a request", async () => {
  const hugeState = makeState({ diff: "x".repeat(200000) });
  let fetchCalled = false;
  await withMockFetch(
    async () => {
      fetchCalled = true;
      return jsonResponse({ answers: {} });
    },
    () =>
      assert.rejects(
        // Two rules so pickBatchSize's overhead check actually runs (it's
        // skipped as an optimization when there's only one item to batch).
        () => callJev("key", [makeRule("r1"), makeRule("r2")], hugeState),
        (err: unknown) => err instanceof JevApiError && err.kind === "payload_too_large"
      )
  );
  assert.equal(fetchCalled, false);
});

// ---------------------------------------------------------------------------
// enrichViolations
// ---------------------------------------------------------------------------

test("enrichViolations returns an empty map and makes no request for zero violations", async () => {
  let fetchCalled = false;
  await withMockFetch(
    async () => {
      fetchCalled = true;
      return jsonResponse({ answers: {} });
    },
    async () => {
      const result = await enrichViolations("key", [], makeState(), []);
      assert.equal(result.size, 0);
      assert.equal(fetchCalled, false);
    }
  );
});

test("enrichViolations rounds a fractional severity score to the nearest level and clamps to range", async () => {
  const rule = makeRule("r1");
  await withMockFetch(
    async () =>
      jsonResponse({
        answers: {
          "r1__severity": { type: "score", score: 2.6, confidence: 0.7 },
        },
      }),
    async () => {
      const result = await enrichViolations("key", [{ rule }], makeState(), []);
      const e = result.get("r1");
      assert.equal(e?.severity?.level, "Blocking"); // index 3, round(2.6) = 3
      assert.equal(e?.severity?.score, 2.6);
      assert.equal(e?.severity?.confidence, 0.7);
    }
  );
});

test("enrichViolations resolves a location choice to the matching diff block's file and line", async () => {
  const rule = makeRule("r1");
  const diffBlocks = [
    { file: "a.ts", startLine: 5, preview: "block a" },
    { file: "b.ts", startLine: 42, preview: "block b" },
  ];
  await withMockFetch(
    async () =>
      jsonResponse({
        answers: {
          "r1__location": { type: "choice", choice: "loc1" },
        },
      }),
    async () => {
      const result = await enrichViolations("key", [{ rule }], makeState(), diffBlocks);
      const e = result.get("r1");
      assert.equal(e?.locatedFile, "b.ts");
      assert.equal(e?.locatedLine, 42);
    }
  );
});

test("enrichViolations leaves location null when the model chooses unclear", async () => {
  const rule = makeRule("r1");
  const diffBlocks = [{ file: "a.ts", startLine: 5, preview: "block a" }];
  await withMockFetch(
    async () =>
      jsonResponse({ answers: { "r1__location": { type: "choice", choice: "unclear" } } }),
    async () => {
      const result = await enrichViolations("key", [{ rule }], makeState(), diffBlocks);
      const e = result.get("r1");
      assert.equal(e?.locatedFile, null);
      assert.equal(e?.locatedLine, null);
    }
  );
});

test("enrichViolations does not ask a location question when there are no diff blocks", async () => {
  const rule = makeRule("r1");
  await withMockFetch(
    async (_input, init) => {
      const body = JSON.parse(init?.body as string) as { questions: Record<string, unknown> };
      assert.ok(!("r1__location" in body.questions));
      assert.ok("r1__severity" in body.questions);
      return jsonResponse({ answers: {} });
    },
    () => enrichViolations("key", [{ rule }], makeState(), [])
  );
});

test("enrichViolations batches many violations and merges answers from every batch", async () => {
  const violations = [
    { rule: makeRule("r1") },
    { rule: makeRule("r2") },
    { rule: makeRule("r3") },
  ];
  let requestCount = 0;
  await withMockFetch(
    async (_input, init) => {
      requestCount++;
      const body = JSON.parse(init?.body as string) as { questions: Record<string, unknown> };
      const answers: Record<string, unknown> = {};
      for (const id of Object.keys(body.questions)) {
        if (id.endsWith("__severity")) {
          answers[id] = { type: "score", score: 0 };
        }
      }
      return jsonResponse({ answers });
    },
    async () => {
      const result = await enrichViolations("key", violations, makeState(), [], undefined, 1);
      assert.equal(requestCount, 3);
      assert.equal(result.size, 3);
      for (const v of violations) {
        assert.equal(result.get(v.rule.id)?.severity?.level, "Minor");
      }
    }
  );
});
