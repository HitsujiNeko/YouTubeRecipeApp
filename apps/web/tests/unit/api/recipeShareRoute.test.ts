import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/recipes/[id]/share/route";

type MockSupabase = {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
};

const RECIPE_ID = "11111111-1111-4111-8111-111111111111";
const EDIT_TOKEN = "sample-edit-token";
const EDIT_TOKEN_HASH = "533254456f33dc3075c09ae6a49915bab4be93776bac96ddb1eb099dc1208739";
const createSupabaseServiceClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServiceClient: () => createSupabaseServiceClientMock(),
}));

function createRequest(headers?: HeadersInit): Request {
  return new Request(`http://localhost/api/recipes/${RECIPE_ID}/share`, {
    method: "POST",
    headers,
  });
}

function createMockSupabase(params?: {
  recipe?: {
    id: string;
    owner_user_id: string | null;
    anon_edit_token_hash: string | null;
    share_enabled_at: string | null;
  } | null;
  updateError?: { code?: string; message: string } | null;
  userId?: string | null;
}) {
  const recipe =
    params && "recipe" in params
      ? params.recipe
      : ({
          id: RECIPE_ID,
          owner_user_id: null,
          anon_edit_token_hash: EDIT_TOKEN_HASH,
          share_enabled_at: null,
        } as const);

  const getUser = vi.fn().mockResolvedValue({
    data: { user: params?.userId ? { id: params.userId } : null },
    error: params?.userId ? null : { message: "invalid token" },
  });

  const from = vi.fn((table: string) => {
    if (table !== "recipes") {
      throw new Error(`Unexpected table ${table}`);
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: recipe, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(
              params?.updateError
                ? { data: null, error: params.updateError }
                : {
                    data: {
                      public_slug: "abc123xyz",
                      share_enabled_at: "2026-03-07T00:00:00.000Z",
                      share_slug_rotated_at: "2026-03-07T00:00:00.000Z",
                    },
                    error: null,
                  },
            ),
          }),
        }),
      }),
    };
  });

  const mock: MockSupabase = { from, auth: { getUser } };
  return { mock, getUser };
}

describe("POST /api/recipes/{id}/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for anonymous owner with valid edit token", async () => {
    const { mock } = createMockSupabase();
    createSupabaseServiceClientMock.mockReturnValue(mock);

    const response = await POST(createRequest({ "X-Recipe-Edit-Token": EDIT_TOKEN }) as never, {
      params: Promise.resolve({ id: RECIPE_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.public_slug).toBe("abc123xyz");
    expect(body.share_enabled_at).toBeTruthy();
    expect(body.share_slug_rotated_at).toBeTruthy();
  });

  it("returns 401 when auth headers are missing", async () => {
    const { mock } = createMockSupabase();
    createSupabaseServiceClientMock.mockReturnValue(mock);

    const response = await POST(createRequest() as never, {
      params: Promise.resolve({ id: RECIPE_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("unauthorized");
  });

  it("returns 403 when anonymous edit token does not match", async () => {
    const { mock } = createMockSupabase();
    createSupabaseServiceClientMock.mockReturnValue(mock);

    const response = await POST(createRequest({ "X-Recipe-Edit-Token": "wrong" }) as never, {
      params: Promise.resolve({ id: RECIPE_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("forbidden");
  });

  it("returns 404 when recipe does not exist", async () => {
    const { mock } = createMockSupabase({ recipe: null });
    createSupabaseServiceClientMock.mockReturnValue(mock);

    const response = await POST(createRequest({ "X-Recipe-Edit-Token": EDIT_TOKEN }) as never, {
      params: Promise.resolve({ id: RECIPE_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("not_found");
  });

  it("returns 409 when slug collision keeps happening", async () => {
    const { mock } = createMockSupabase({
      updateError: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    createSupabaseServiceClientMock.mockReturnValue(mock);

    const response = await POST(createRequest({ "X-Recipe-Edit-Token": EDIT_TOKEN }) as never, {
      params: Promise.resolve({ id: RECIPE_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("conflict");
    expect(body.error.retryable).toBe(true);
  });
});
