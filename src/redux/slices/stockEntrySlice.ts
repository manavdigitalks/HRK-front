import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface StockEntryState {
  entries: any[];
  currentInventory: any[];
  inventoryItems: any[]; // New
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  inventoryPagination: { // New
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  inventoryLoading: boolean;
  error: string | null;
}

const initialState: StockEntryState = {
  entries: [],
  currentInventory: [],
  inventoryItems: [],
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  inventoryPagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 20,
  },
  loading: false,
  inventoryLoading: false,
  error: null,
};

export const fetchAllStockEntries = createAsyncThunk(
  'stockEntry/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/stock-entry', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const fetchInventoryItems = createAsyncThunk(
  'stockEntry/fetchInventoryItems',
  async ({ page, limit, search, status, productId, sizeId }: { page?: number; limit?: number; search?: string; status?: string; productId?: string; sizeId?: string | string[] } = {}) => {
    const response = await api.get('/stock-entry/inventory/items', {
      params: { page, limit, search, status, productId, sizeId },
    });
    return response.data;
  }
);

export const markSizeLost = createAsyncThunk(
  'stockEntry/markSizeLost',
  async ({ id, sizeIds }: { id: string; sizeIds: string[] }) => {
    const response = await api.patch(`/stock-entry/inventory/items/${id}/mark-lost`, { sizeIds });
    return response.data.data;
  }
);

export const createStockEntry = createAsyncThunk('stockEntry/create', async (data: any) => {
  const response = await api.post('/stock-entry/create', data);
  return response.data;
});

export const fetchProductInventory = createAsyncThunk('stockEntry/fetchInventory', async ({ productId, status }: { productId: string, status?: string }) => {
  const response = await api.get(`/stock-entry/product/${productId}`, {
    params: { status }
  });
  return response.data.data;
});

export const fetchStockEntryInventory = createAsyncThunk('stockEntry/fetchEntryInventory', async (entryId: string) => {
  const response = await api.get(`/stock-entry/entry/${entryId}`);
  return response.data.data;
});

export const deleteStockEntry = createAsyncThunk('stockEntry/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/stock-entry/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

const stockEntrySlice = createSlice({
  name: 'stockEntry',
  initialState,
  reducers: {
    clearInventory: (state) => {
        state.currentInventory = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStockEntries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllStockEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllStockEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stock entries';
      })
      .addCase(createStockEntry.fulfilled, (state, action) => {
        state.entries.unshift(action.payload.data);
      })
      .addCase(fetchProductInventory.pending, (state) => {
        state.inventoryLoading = true;
      })
      .addCase(fetchProductInventory.fulfilled, (state, action) => {
        state.inventoryLoading = false;
        state.currentInventory = action.payload;
      })
      .addCase(fetchProductInventory.rejected, (state) => {
        state.inventoryLoading = false;
      })
      .addCase(fetchInventoryItems.pending, (state) => {
        state.inventoryLoading = true;
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.inventoryLoading = false;
        state.inventoryItems = action.payload.data;
        state.inventoryPagination = action.payload.pagination;
      })
      .addCase(fetchInventoryItems.rejected, (state) => {
        state.inventoryLoading = false;
      })
      .addCase(markSizeLost.fulfilled, (state, action) => {
          state.inventoryItems = state.inventoryItems.map(item => 
              item._id === action.payload._id ? action.payload : item
          );
      });
  },
});

export const { clearInventory } = stockEntrySlice.actions;
export default stockEntrySlice.reducer;
