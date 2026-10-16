export type TransactionTableState = {
  selectedIds: string[];
  searchTerm: string;
  typeFilter: string;
  recurringFilter: string;
  deleteDialogOpen: boolean;
};

export type TransactionTableEvent =
  | { type: "TOGGLE_SELECT"; id: string }
  | { type: "SET_SELECT_ALL"; checked: boolean; visibleIds: string[] }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_TYPE_FILTER"; value: string }
  | { type: "SET_RECURRING_FILTER"; value: string }
  | { type: "CLEAR_FILTERS" }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_DELETE_DIALOG"; open: boolean };

export const initialTransactionTableState = (params: {
  search?: string;
  type?: string;
  recurring?: string;
}): TransactionTableState => ({
  selectedIds: [],
  searchTerm: params.search ?? "",
  typeFilter: params.type ?? "",
  recurringFilter: params.recurring ?? "",
  deleteDialogOpen: false,
});

// Select-all is a toggle driven by length, not contents: re-clicking when every
// visible row is already selected clears the selection.
export function transactionTableReducer(
  state: TransactionTableState,
  event: TransactionTableEvent,
): TransactionTableState {
  switch (event.type) {
    case "TOGGLE_SELECT":
      return {
        ...state,
        selectedIds: state.selectedIds.includes(event.id)
          ? state.selectedIds.filter((id) => id !== event.id)
          : [...state.selectedIds, event.id],
      };
    case "SET_SELECT_ALL": {
      if (!event.checked) return { ...state, selectedIds: [] };
      const allSelected = state.selectedIds.length === event.visibleIds.length;
      return { ...state, selectedIds: allSelected ? [] : event.visibleIds };
    }
    case "SET_SEARCH":
      return { ...state, searchTerm: event.value };
    case "SET_TYPE_FILTER":
      return { ...state, typeFilter: event.value };
    case "SET_RECURRING_FILTER":
      return { ...state, recurringFilter: event.value };
    case "CLEAR_FILTERS":
      return { ...state, searchTerm: "", typeFilter: "", recurringFilter: "", selectedIds: [] };
    case "CLEAR_SELECTION":
      return { ...state, selectedIds: [] };
    case "SET_DELETE_DIALOG":
      return { ...state, deleteDialogOpen: event.open };
  }
}
