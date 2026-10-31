import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { api, searchParams } from "../api/index";
import { login, getProfile, logout, register } from "../api/auth.api";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../api/staff.api";
import { createFile, updateFile, getFiles } from "../api/file.api";
import { getFolder, createFolder, deleteFolder } from "../api/folder.api";
import { getVaults, createVault } from "../api/vault.api";
import { canManage, canEditStaff, vaultEnabled } from "../utils/permissions";
import { ApiError, isSessionError, normalizeError } from "../utils/api-error";
import { safeUrl } from "../utils/format";
import type { Role } from "../types/auth.types";
import {
  getRates,
  updateRates,
  previewFeed,
  createFeed,
  getFeeds,
  getFeed,
} from "../api/feed.api";
import { parseRateCsv } from "../utils/feed";
import type { FeedInput } from "../types/feed.types";

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

test("feed routes preserve gram quantities and send raw recipes for server calculation", async () => {
  const calls: string[] = [];
  const recipe: FeedInput = {
    title: "Layers",
    brand: "layers",
    products: [
      {
        code: "L1",
        sellingPrice: 50000,
        bagCost: 500,
        overheadCost: 1000,
        lossPercent: 1,
        commission: 200,
        ingredients: [
          { ingredientId: "507f1f77bcf86cd799439011", quantity: 500 },
        ],
      },
    ],
  };
  mock(async (config) => {
    calls.push(`${config.method} ${config.url}`);
    if (config.method === "patch") {
      assert.deepEqual(JSON.parse(config.data), {
        rates: [{ name: "crebovit", unit: "g", price: 450 }],
      });
      return response(config, []);
    }
    if (config.method === "post") {
      assert.deepEqual(JSON.parse(config.data), recipe);
      return response(config, { ...recipe, _id: "feed-1" });
    }
    return response(
      config,
      config.url === "/feed/feed-1" ? { _id: "feed-1" } : [],
    );
  });
  await getRates();
  await updateRates([{ name: "crebovit", unit: "g", price: 450 }]);
  await previewFeed(recipe);
  await createFeed(recipe);
  await getFeeds();
  await getFeed("feed-1");
  assert.deepEqual(calls, [
    "get /feed/rates",
    "patch /feed/rates",
    "post /feed/preview",
    "post /feed/create",
    "get /feed",
    "get /feed/feed-1",
  ]);
});

test("Excel CSV import supports BOM, CRLF and quoted names without changing units or rates", () => {
  assert.deepEqual(
    parseRateCsv(
      '\uFEFFname,unit,price\r\n"Maize, fine",kg,40.5\r\nCrebovit,g,450\r\n',
    ),
    [
      { name: "maize, fine", unit: "kg", price: 40.5 },
      { name: "crebovit", unit: "g", price: 450 },
    ],
  );
  assert.deepEqual(parseRateCsv("name,unit,price\nMaize,kg,0"), [
    { name: "maize", unit: "kg", price: 0 },
  ]);
});

test("rate import rejects missing prices, duplicate names, wrong units and malformed files", () => {
  for (const csv of [
    "name,unit,price\nMaize,kg,",
    "name,unit,price\nMaize,kg,-1",
    "name,unit,price\nMaize,kg,NaN",
    "name,unit,price\nMaize,kg,1000001",
    "name,unit,price\nMaize,ton,40",
    "name,unit,price\nMaize,kg,40\nmaize,kg,41",
    'name,unit,price\n"Maize,kg,40',
    "name,price\nMaize,40",
  ])
    assert.throws(() => parseRateCsv(csv));
});

test("a wrong API URL returning HTML cannot look like an empty directory", async () => {
  mock(async (config) => ({
    ...response(config, null),
    data: "<!doctype html><html>Wrong application</html>",
  }));
  await assert.rejects(getStaff(), /unexpected response/);
});

test("a malformed list payload remains an error rather than a zero count", async () => {
  mock(async (config) => response(config, { records: [] }));
  await assert.rejects(getStaff(), /invalid list/);
});

test("search text is literal even when it contains regex metacharacters", () => {
  const params = searchParams({
    query: "Report (final)[1].pdf",
    status: "Active",
  });
  const regex = new RegExp(params.query ?? "", "i");
  assert.equal(regex.test("Report (final)[1].pdf"), true);
  assert.equal(regex.test("Report final1Xpdf"), false);
  assert.equal(params.status, "Active");
});
function response(config: InternalAxiosRequestConfig, data: unknown) {
  return {
    data: { success: true, status: "success", message: "OK", data },
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  };
}
function mock(adapter: AxiosAdapter) {
  api.defaults.adapter = adapter;
}
const user = {
  _id: "account-1",
  full_name: "Test Account",
  email: "test@example.invalid",
  role: "ADMIN",
};

test("login verifies the cookie session with /auth/me and returns its actual user", async () => {
  const calls: string[] = [];
  mock(async (config) => {
    calls.push(`${config.method} ${config.url}`);
    assert.equal(config.withCredentials, true);
    if (config.url === "/auth/login") {
      assert.deepEqual(JSON.parse(config.data), {
        email: user.email,
        password: "example-password",
      });
      return response(config, {
        user: { ...user, full_name: "Stale login user" },
        access_token: "ignored-test-token",
      });
    }
    return response(config, user);
  });
  assert.deepEqual(
    await login({ email: user.email, password: "example-password" }),
    user,
  );
  assert.deepEqual(calls, ["post /auth/login", "get /auth/me"]);
});
test("a successful login response does not bypass a missing session cookie", async () => {
  mock(async (config) => {
    if (config.url === "/auth/login")
      return response(config, { user, access_token: "ignored" });
    throw new AxiosError(
      "Request failed",
      "ERR_BAD_RESPONSE",
      config,
      undefined,
      {
        ...response(config, null),
        status: 500,
        data: { message: "Unauthroized Login" },
      },
    );
  });
  await assert.rejects(
    login({ email: user.email, password: "example-password" }),
    (error: unknown) => isSessionError(error),
  );
});
test("logout and registration use the exact backend routes and payloads", async () => {
  const calls: string[] = [];
  mock(async (config) => {
    calls.push(`${config.method} ${config.url}`);
    if (config.url === "/auth/register")
      assert.equal(JSON.parse(config.data).phone, "9800000000");
    return response(config, null);
  });
  await logout();
  await register({
    full_name: "New Account",
    email: "new@example.invalid",
    phone: "9800000000",
    password: "example-password",
  });
  assert.deepEqual(calls, ["post /auth/logout", "post /auth/register"]);
});
test("staff list parameters and singular mutation routes match the supplied source", async () => {
  const calls: string[] = [];
  mock(async (config) => {
    calls.push(`${config.method} ${config.url}`);
    if (config.method === "get") {
      assert.equal(config.params.status, "On Leave");
      return response(config, [{ _id: "staff-1" }]);
    }
    return response(config, { _id: "staff-1" });
  });
  assert.equal(
    (await getStaff({ status: "On Leave", department: "Operations" })).length,
    1,
  );
  const data = new FormData();
  data.append("full_name", "Test Staff");
  await createStaff(data);
  await updateStaff("staff-1", data);
  await deleteStaff("staff-1");
  assert.deepEqual(calls, [
    "get /staff",
    "post /staff/create",
    "patch /staff/update/staff-1",
    "delete /staff/delete/staff-1",
  ]);
});
test("file upload sends actual multipart fields, while updates send metadata only", async () => {
  const data = new FormData();
  data.append("name", "Test document");
  data.append(
    "file",
    new Blob(["example"], { type: "text/plain" }),
    "test.txt",
  );
  mock(async (config) => {
    if (config.url === "/file/create") {
      assert.ok(config.data instanceof FormData);
      assert.ok(config.data.get("file") instanceof Blob);
      assert.equal(config.data.get("name"), "Test document");
    }
    if (config.url?.startsWith("/file/update"))
      assert.deepEqual(JSON.parse(config.data), {
        name: "Renamed",
        parentFolder: "folder-1",
      });
    if (config.url === "/file") {
      assert.equal(config.params.parentFolder, "root");
      return response(config, []);
    }
    return response(config, { _id: "file-1" });
  });
  await createFile(data);
  await updateFile("file-1", { name: "Renamed", parentFolder: "folder-1" });
  assert.deepEqual(await getFiles({ parentFolder: "root" }), []);
});
test("folder detail unwraps folder, subfolders and files; creation retains null for root", async () => {
  const detail = {
    folder: { _id: "folder-1" },
    subfolders: [],
    files: [{ _id: "file-1" }],
  };
  const calls: string[] = [];
  mock(async (config) => {
    calls.push(`${config.method} ${config.url}`);
    if (config.url === "/folder/create")
      assert.deepEqual(JSON.parse(config.data), {
        name: "Reports",
        category: "General",
        parentFolder: null,
      });
    return response(config, detail);
  });
  assert.deepEqual(await getFolder("folder-1"), detail);
  await createFolder({
    name: "Reports",
    category: "General",
    parentFolder: null,
  });
  await deleteFolder("folder-1");
  assert.deepEqual(calls, [
    "get /folder/folder-1",
    "post /folder/create",
    "delete /folder/delete/folder-1",
  ]);
});
test("roles use exact backend permissions and never elevate SUPER_ADMIN or USER", () => {
  for (const role of ["USER", "SUPER_ADMIN", "STAFF"] as Role[]) {
    assert.equal(canManage({ role }), false);
    assert.equal(canEditStaff({ role }), false);
  }
  assert.equal(canManage({ role: "ADMIN" }), true);
  assert.equal(canEditStaff({ role: "ADMIN" }), true);
  assert.equal(canManage({ role: "DIRECTOR" }), true);
  assert.equal(canEditStaff({ role: "DIRECTOR" }), false);
  assert.equal(canManage(null), false);
});
test("session expiry is distinguished from forbidden access and ordinary server errors", () => {
  assert.equal(isSessionError(new ApiError("Unauthroized Login", 500)), true);
  assert.equal(isSessionError(new ApiError("jwt expired", 401)), true);
  assert.equal(isSessionError(new ApiError("Profile not found", 404)), true);
  assert.equal(
    isSessionError(new ApiError("Forbidden. Access denied.", 500)),
    false,
  );
  assert.equal(
    isSessionError(new ApiError("Database unavailable", 500)),
    false,
  );
});
test("network failures remain errors and are never presented as an empty successful list", async () => {
  mock(async (config) => {
    throw new AxiosError("Network Error", "ERR_NETWORK", config);
  });
  await assert.rejects(
    getStaff(),
    (error: unknown) =>
      error instanceof ApiError && /Unable to reach/.test(error.message),
  );
  await assert.rejects(
    getProfile(),
    (error: unknown) => !isSessionError(error),
  );
});
test("server stack traces and duplicate-key internals do not reach the user error", () => {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  const error = new AxiosError("Request failed", undefined, config, undefined, {
    ...response(config, null),
    status: 500,
    data: {
      message: "E11000 duplicate key private_database",
      originalError: "sensitive stack",
    },
  });
  const normalized = normalizeError(error);
  assert.equal(
    normalized.message,
    "A record with those details already exists.",
  );
  assert.equal(normalized.message.includes("private_database"), false);
});
test("vault reads and writes make no network requests while the module is disabled", async () => {
  assert.equal(vaultEnabled, false);
  let calls = 0;
  mock(async (config) => {
    calls++;
    return response(config, []);
  });
  await assert.rejects(getVaults(), /Vault access is unavailable/);
  await assert.rejects(
    createVault({ title: "Example", username: "example", password: "example" }),
    /Vault access is unavailable/,
  );
  assert.equal(calls, 0);
});
test("external record links accept HTTP(S) and reject executable or malformed URLs", () => {
  assert.equal(
    safeUrl("https://example.invalid/report"),
    "https://example.invalid/report",
  );
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "not a url",
  ])
    assert.equal(safeUrl(value), undefined);
});

test("malformed folder contents produce an actionable error", async () => {
  mock(async (config) =>
    response(config, {
      folder: { _id: "folder-1" },
      files: null,
      subfolders: [],
    }),
  );
  await assert.rejects(getFolder("folder-1"), /invalid folder contents/);
});

test("uploads have a longer timeout without changing ordinary list requests", async () => {
  const timeouts: number[] = [];
  mock(async (config) => {
    timeouts.push(config.timeout ?? 0);
    return response(config, config.method === "get" ? [] : { _id: "record-1" });
  });
  const data = new FormData();
  await createFile(data);
  await createStaff(data);
  await updateStaff("staff-1", data);
  await getStaff();
  assert.deepEqual(timeouts, [120000, 120000, 120000, 15000]);
});

test("an incomplete account response cannot establish a session", async () => {
  mock(async (config) => response(config, { full_name: "Missing identity" }));
  await assert.rejects(getProfile(), /invalid account profile/);
});
