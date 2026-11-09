import { describe, expect, it } from "vitest";
import { apiClient } from "./api/client";
import { LoginPage, SellerPage } from "./App";

describe("Web skeleton test suite", () => {
  it("initializes apiClient with GET method", () => {
    expect(typeof apiClient.GET).toBe("function");
  });

  it("exports route placeholder components", () => {
    expect(typeof LoginPage).toBe("function");
    expect(typeof SellerPage).toBe("function");
  });
});

