import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface StockState {
  stocks: any[];
  currentStock: any;
  loading: boolean;
  error: string | null;
}

const initialState: StockState = {
  stocks: [],
  currentStock: null,
  loading: false,
  error: null,
};

export const fetchAllStocks = createAsyncThunk('stock/fetchAll', async () => {
  const response = await api.get('/stock');
  return response.data.data;
});

export const fetchStockById = createAsyncThunk('stock/fetchById', async (id: string) => {
  const response = await api.get(`/stock/${id}`);
  return response.data.data;
});

export const createStock = createAsyncThunk('stock/create', async (data: any) => {
  const response = await api.post('/stock/create', data);
  return response.data.data;
});

export const updateStock = createAsyncThunk('stock/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/stock/${id}`, data);
  return response.data.data;
});

export const deleteStock = createAsyncThunk('stock/delete', async (id: string) => {
  await api.delete(`/stock/${id}`);
  return id;
});

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStocks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload;
      })
      .addCase(fetchAllStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stocks';
      })
      .addCase(fetchStockById.fulfilled, (state, action) => {
        state.currentStock = action.payload;
      })
      .addCase(createStock.fulfilled, (state, action) => {
        state.stocks.push(action.payload);
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.stocks.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.stocks[index] = action.payload;
      })
      .addCase(deleteStock.fulfilled, (state, action) => {
        state.stocks = state.stocks.filter((s) => s._id !== action.payload);
      });
  },
});

export default stockSlice.reducer;
