import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface PurchaseOrderState {
  purchaseOrders: any[];
  currentPurchaseOrder: any;
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseOrderState = {
  purchaseOrders: [],
  currentPurchaseOrder: null,
  loading: false,
  error: null,
};

export const fetchAllPurchaseOrders = createAsyncThunk('purchaseOrder/fetchAll', async () => {
  const response = await api.get('/purchaseorder');
  return response.data.data;
});

export const fetchPurchaseOrderById = createAsyncThunk('purchaseOrder/fetchById', async (id: string) => {
  const response = await api.get(`/purchaseorder/${id}`);
  return response.data.data;
});

export const createPurchaseOrder = createAsyncThunk('purchaseOrder/create', async (data: any) => {
  const response = await api.post('/purchaseorder/create', data);
  return response.data.data;
});

export const updatePurchaseOrder = createAsyncThunk('purchaseOrder/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/purchaseorder/${id}`, data);
  return response.data.data;
});

export const deletePurchaseOrder = createAsyncThunk('purchaseOrder/delete', async (id: string) => {
  await api.delete(`/purchaseorder/${id}`);
  return id;
});

const purchaseOrderSlice = createSlice({
  name: 'purchaseOrder',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPurchaseOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders = action.payload;
      })
      .addCase(fetchAllPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch purchase orders';
      })
      .addCase(fetchPurchaseOrderById.fulfilled, (state, action) => {
        state.currentPurchaseOrder = action.payload;
      })
      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.purchaseOrders.push(action.payload);
      })
      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        const index = state.purchaseOrders.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.purchaseOrders[index] = action.payload;
      })
      .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
        state.purchaseOrders = state.purchaseOrders.filter((p) => p._id !== action.payload);
      });
  },
});

export default purchaseOrderSlice.reducer;
