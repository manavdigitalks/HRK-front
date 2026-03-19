import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface ReturnState {
  returns: any[];
  filteredProducts: any[];
  pagination: { totalRecords: number; currentPage: number; totalPages: number; limit: number };
  loading: boolean;
  filterLoading: boolean;
  error: string | null;
}

const initialState: ReturnState = {
  returns: [],
  filteredProducts: [],
  pagination: { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 },
  loading: false,
  filterLoading: false,
  error: null,
};

export const fetchAllReturns = createAsyncThunk(
  'return/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/return', { params: { page, limit, search } });
    return response.data;
  }
);

export const getProductsByFilter = createAsyncThunk(
  'return/getProductsByFilter',
  async (params: { designNo?: string; sku?: string; category?: string }) => {
    const response = await api.get('/return/products-by-filter', { params });
    return response.data.data;
  }
);

export const createReturn = createAsyncThunk('return/create', async (data: any) => {
  const response = await api.post('/return/create', data);
  return response.data.data;
});

export const deleteReturn = createAsyncThunk('return/delete', async (id: string) => {
  await api.delete(`/return/${id}`);
  return id;
});

const returnSlice = createSlice({
  name: 'return',
  initialState,
  reducers: {
    clearFilteredProducts: (state) => { state.filteredProducts = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllReturns.pending, (state) => { state.loading = true; })
      .addCase(fetchAllReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.returns = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch returns';
      })
      .addCase(getProductsByFilter.pending, (state) => { state.filterLoading = true; })
      .addCase(getProductsByFilter.fulfilled, (state, action) => {
        state.filterLoading = false;
        state.filteredProducts = action.payload;
      })
      .addCase(getProductsByFilter.rejected, (state) => { state.filterLoading = false; })
      .addCase(createReturn.fulfilled, (state, action) => {
        state.returns.unshift(action.payload);
      })
      .addCase(deleteReturn.fulfilled, (state, action) => {
        state.returns = state.returns.filter((r) => r._id !== action.payload);
      });
  },
});

export const { clearFilteredProducts } = returnSlice.actions;
export default returnSlice.reducer;
