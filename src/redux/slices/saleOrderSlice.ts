import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface SaleOrderState {
  saleOrders: any[];
  currentSaleOrder: any;
  loading: boolean;
  error: string | null;
}

const initialState: SaleOrderState = {
  saleOrders: [],
  currentSaleOrder: null,
  loading: false,
  error: null,
};

export const fetchAllSaleOrders = createAsyncThunk('saleOrder/fetchAll', async () => {
  const response = await api.get('/saleorder');
  return response.data.data;
});

export const fetchSaleOrderById = createAsyncThunk('saleOrder/fetchById', async (id: string) => {
  const response = await api.get(`/saleorder/${id}`);
  return response.data.data;
});

export const createSaleOrder = createAsyncThunk('saleOrder/create', async (data: any) => {
  const response = await api.post('/saleorder/create', data);
  return response.data.data;
});

export const updateSaleOrder = createAsyncThunk('saleOrder/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/saleorder/${id}`, data);
  return response.data.data;
});

export const deleteSaleOrder = createAsyncThunk('saleOrder/delete', async (id: string) => {
  await api.delete(`/saleorder/${id}`);
  return id;
});

const saleOrderSlice = createSlice({
  name: 'saleOrder',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSaleOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllSaleOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.saleOrders = action.payload;
      })
      .addCase(fetchAllSaleOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch sale orders';
      })
      .addCase(fetchSaleOrderById.fulfilled, (state, action) => {
        state.currentSaleOrder = action.payload;
      })
      .addCase(createSaleOrder.fulfilled, (state, action) => {
        state.saleOrders.push(action.payload);
      })
      .addCase(updateSaleOrder.fulfilled, (state, action) => {
        const index = state.saleOrders.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.saleOrders[index] = action.payload;
      })
      .addCase(deleteSaleOrder.fulfilled, (state, action) => {
        state.saleOrders = state.saleOrders.filter((s) => s._id !== action.payload);
      });
  },
});

export default saleOrderSlice.reducer;
