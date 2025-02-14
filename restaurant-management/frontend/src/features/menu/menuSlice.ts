import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { MenuItem } from "../../types";
import menuService from "../../services/menu.service";

interface MenuState {
  items: MenuItem[];
  selectedItem: MenuItem | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MenuState = {
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,
};

export const fetchMenuItems = createAsyncThunk(
  "menu/fetchItems",
  async (_, { rejectWithValue }) => {
    try {
      return await menuService.getAllItems();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch menu items"
      );
    }
  }
);

export const fetchItemsByCategory = createAsyncThunk(
  "menu/fetchItemsByCategory",
  async (category: string, { rejectWithValue }) => {
    try {
      return await menuService.getItemsByCategory(category);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch menu items by category"
      );
    }
  }
);

export const createMenuItem = createAsyncThunk(
  "menu/createItem",
  async (data: Partial<MenuItem>, { rejectWithValue }) => {
    try {
      return await menuService.createItem(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create menu item"
      );
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  "menu/updateItem",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: Partial<MenuItem>;
    },
    { rejectWithValue }
  ) => {
    try {
      return await menuService.updateItem(id, data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update menu item"
      );
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  "menu/deleteItem",
  async (id: string, { rejectWithValue }) => {
    try {
      await menuService.deleteItem(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete menu item"
      );
    }
  }
);

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    setSelectedItem: (state, action) => {
      state.selectedItem = action.payload;
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Menu Items
      .addCase(fetchMenuItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Items by Category
      .addCase(fetchItemsByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchItemsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchItemsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create Menu Item
      .addCase(createMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload);
      })
      .addCase(createMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Menu Item
      .addCase(updateMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex(
          (item) => item._id === action.payload._id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete Menu Item
      .addCase(deleteMenuItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter((item) => item._id !== action.payload);
      })
      .addCase(deleteMenuItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedItem, clearSelectedItem, clearError } =
  menuSlice.actions;
export default menuSlice.reducer;
