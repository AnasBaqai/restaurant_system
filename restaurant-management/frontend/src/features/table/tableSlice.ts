import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Table, TableStatus } from "../../types";
import tableService from "../../services/table.service";

interface TableState {
  tables: Table[];
  selectedTable: Table | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TableState = {
  tables: [],
  selectedTable: null,
  isLoading: false,
  error: null,
};

export const createTable = createAsyncThunk(
  "table/createTable",
  async (
    data: { tableNumber: number; capacity: number },
    { rejectWithValue }
  ) => {
    try {
      return await tableService.createTable(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create table"
      );
    }
  }
);

export const fetchTables = createAsyncThunk(
  "table/fetchTables",
  async (_, { rejectWithValue }) => {
    try {
      return await tableService.getAllTables();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tables"
      );
    }
  }
);

export const fetchAvailableTables = createAsyncThunk(
  "table/fetchAvailableTables",
  async (_, { rejectWithValue }) => {
    try {
      return await tableService.getAvailableTables();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch available tables"
      );
    }
  }
);

export const updateTableStatus = createAsyncThunk(
  "table/updateStatus",
  async (
    { id, status }: { id: string; status: TableStatus },
    { rejectWithValue }
  ) => {
    try {
      return await tableService.updateTableStatus(id, status);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update table status"
      );
    }
  }
);

export const assignWaiter = createAsyncThunk(
  "table/assignWaiter",
  async (
    { id, waiterId }: { id: string; waiterId: string },
    { rejectWithValue }
  ) => {
    try {
      return await tableService.assignWaiter(id, waiterId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign waiter"
      );
    }
  }
);

const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    setSelectedTable: (state, action) => {
      state.selectedTable = action.payload;
    },
    clearSelectedTable: (state) => {
      state.selectedTable = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Table
      .addCase(createTable.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTable.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tables.push(action.payload);
      })
      .addCase(createTable.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Tables
      .addCase(fetchTables.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tables = action.payload;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Available Tables
      .addCase(fetchAvailableTables.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableTables.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tables = action.payload;
      })
      .addCase(fetchAvailableTables.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Table Status
      .addCase(updateTableStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTableStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tables.findIndex(
          (table) => table._id === action.payload._id
        );
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        if (state.selectedTable?._id === action.payload._id) {
          state.selectedTable = action.payload;
        }
      })
      .addCase(updateTableStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Assign Waiter
      .addCase(assignWaiter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(assignWaiter.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tables.findIndex(
          (table) => table._id === action.payload._id
        );
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        if (state.selectedTable?._id === action.payload._id) {
          state.selectedTable = action.payload;
        }
      })
      .addCase(assignWaiter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedTable, clearSelectedTable, clearError } =
  tableSlice.actions;
export default tableSlice.reducer;
