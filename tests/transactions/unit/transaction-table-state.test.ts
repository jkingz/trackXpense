import { expect, it } from "vite-plus/test";

import {
  initialTransactionTableState,
  transactionTableReducer,
} from "@/lib/transaction-table-state";

it("seeds filters from the URL and starts with nothing selected", () => {
  const state = initialTransactionTableState({ search: "coffee", type: "EXPENSE" });
  expect(state.searchTerm).toBe("coffee");
  expect(state.typeFilter).toBe("EXPENSE");
  expect(state.recurringFilter).toBe("");
  expect(state.selectedIds).toEqual([]);
  expect(state.deleteDialogOpen).toBe(false);
});

it("TOGGLE_SELECT adds then removes an id", () => {
  const added = transactionTableReducer(initialTransactionTableState({}), {
    type: "TOGGLE_SELECT",
    id: "a",
  });
  expect(added.selectedIds).toEqual(["a"]);
  const removed = transactionTableReducer(added, { type: "TOGGLE_SELECT", id: "a" });
  expect(removed.selectedIds).toEqual([]);
});

it("SET_SELECT_ALL selects every visible row, then clears on a second check", () => {
  const selected = transactionTableReducer(initialTransactionTableState({}), {
    type: "SET_SELECT_ALL",
    checked: true,
    visibleIds: ["a", "b"],
  });
  expect(selected.selectedIds).toEqual(["a", "b"]);
  const cleared = transactionTableReducer(selected, {
    type: "SET_SELECT_ALL",
    checked: true,
    visibleIds: ["a", "b"],
  });
  expect(cleared.selectedIds).toEqual([]);
});

it("SET_SELECT_ALL with checked false clears the selection", () => {
  const selected = transactionTableReducer(initialTransactionTableState({}), {
    type: "SET_SELECT_ALL",
    checked: true,
    visibleIds: ["a"],
  });
  const cleared = transactionTableReducer(selected, {
    type: "SET_SELECT_ALL",
    checked: false,
    visibleIds: ["a"],
  });
  expect(cleared.selectedIds).toEqual([]);
});

it("CLEAR_FILTERS resets the three filters and the selection but not the dialog", () => {
  const seeded = transactionTableReducer(
    initialTransactionTableState({ search: "x", type: "INCOME", recurring: "recurring" }),
    { type: "SET_DELETE_DIALOG", open: true },
  );
  const cleared = transactionTableReducer(seeded, { type: "CLEAR_FILTERS" });
  expect(cleared.searchTerm).toBe("");
  expect(cleared.typeFilter).toBe("");
  expect(cleared.recurringFilter).toBe("");
  expect(cleared.selectedIds).toEqual([]);
  expect(cleared.deleteDialogOpen).toBe(true);
});

it("SET_DELETE_DIALOG and CLEAR_SELECTION touch one field each", () => {
  const opened = transactionTableReducer(initialTransactionTableState({ search: "keep" }), {
    type: "SET_DELETE_DIALOG",
    open: true,
  });
  expect(opened.deleteDialogOpen).toBe(true);
  expect(opened.searchTerm).toBe("keep");
});
