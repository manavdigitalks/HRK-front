import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface StockEntryState {
  entries: any[];
  currentInventory: any[];
  pagination: {
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
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  inventoryLoading: false,
  error: null,
};

export const fetchAllStockEntries = createAsyncThunk(
  'stockEntry/fetchAll',
  async ({ page, limit }: { page?: number; limit?: number } = {}) => {
    const response = await api.get('/stock-entry', {
      params: { page, limit },
    });
    return response.data;
  }
);

export const createStockEntry = createAsyncThunk('stockEntry/create', async (data: any) => {
  const response = await api.post('/stock-entry/create', data);
  return response.data.data;
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

export const deleteStockEntry = createAsyncThunk('stockEntry/delete', async (id: string) => {
  const response = await api.delete(`/stock-entry/${id}`);
  return id;
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
        state.entries.unshift(action.payload);
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
      });
  },
});

export const { clearInventory } = stockEntrySlice.actions;
export default stockEntrySlice.reducer;
