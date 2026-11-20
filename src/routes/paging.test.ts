import { describe, expect, it } from "vitest";
import { createPagination, parsePagination } from "./paging.js";

const pageUri = (page: number) => `/titles?page=${page}&pageSize=10`;

describe("parsePagination", () => {
  it("applies defaults when no values are given", () => {
    expect(parsePagination(undefined, undefined)).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it("caps the page size at the maximum", () => {
    expect(parsePagination("1", "500")).toEqual({ page: 1, pageSize: 100 });
  });

  it.each([
    ["0", "10"],
    ["-1", "10"],
    ["abc", "10"],
    ["1.5", "10"],
    ["1", "0"],
  ])("rejects page=%s pageSize=%s", (page, pageSize) => {
    expect(parsePagination(page, pageSize)).toBeNull();
  });
});

describe("createPagination", () => {
  it("links to the next page only on the first page", () => {
    expect(createPagination(1, 10, 25, pageUri)).toEqual({
      page: 1,
      pageSize: 10,
      totalItems: 25,
      totalPages: 3,
      previous: null,
      next: "/titles?page=2&pageSize=10",
    });
  });

  it("links both ways on a middle page", () => {
    const pagination = createPagination(2, 10, 25, pageUri);

    expect(pagination.previous).toBe("/titles?page=1&pageSize=10");
    expect(pagination.next).toBe("/titles?page=3&pageSize=10");
  });

  it("links to the previous page only on the last page", () => {
    const pagination = createPagination(3, 10, 25, pageUri);

    expect(pagination.previous).toBe("/titles?page=2&pageSize=10");
    expect(pagination.next).toBeNull();
  });

  it("returns no links for a page beyond the end", () => {
    const pagination = createPagination(9, 10, 25, pageUri);

    expect(pagination.previous).toBeNull();
    expect(pagination.next).toBeNull();
  });

  it("handles an empty list", () => {
    expect(createPagination(1, 10, 0, pageUri)).toMatchObject({
      totalPages: 0,
      previous: null,
      next: null,
    });
  });
});
