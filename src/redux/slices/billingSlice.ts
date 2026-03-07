import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface BillingState {
  billings: any[];
  currentBilling: any;
  loading: boolean;
  error: string | null;
}

const initialState: BillingState = {
  billings: [],
  currentBilling: null,
  loading: false,
  error: null,
};

export const fetchAllBillings = createAsyncThunk('billing/fetchAll', async () => {
  const response = await api.get('/billing');
  return response.data.data;
});

export const fetchBillingById = createAsyncThunk('billing/fetchById', async (id: string) => {
  const response = await api.get(`/billing/${id}`);
  return response.data.data;
});

export const createBilling = createAsyncThunk('billing/create', async (data: any) => {
  const response = await api.post('/billing/create', data);
  return response.data.data;
});

export const updateBilling = createAsyncThunk('billing/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/billing/${id}`, data);
  return response.data.data;
});

export const deleteBilling = createAsyncThunk('billing/delete', async (id: string) => {
  await api.delete(`/billing/${id}`);
  return id;
});

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllBillings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllBillings.fulfilled, (state, action) => {
        state.loading = false;
        state.billings = action.payload;
      })
      .addCase(fetchAllBillings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch billings';
      })
      .addCase(fetchBillingById.fulfilled, (state, action) => {
        state.currentBilling = action.payload;
      })
      .addCase(createBilling.fulfilled, (state, action) => {
        state.billings.push(action.payload);
      })
      .addCase(updateBilling.fulfilled, (state, action) => {
        const index = state.billings.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) state.billings[index] = action.payload;
      })
      .addCase(deleteBilling.fulfilled, (state, action) => {
        state.billings = state.billings.filter((b) => b._id !== action.payload);
      });
  },
});

export default billingSlice.reducer;
