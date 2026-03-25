import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface BillingState {
  billings: any[];
  currentBilling: any;
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: BillingState = {
  billings: [],
  currentBilling: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllBillings = createAsyncThunk(
  'billing/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/billing', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

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

export const scanBarcode = createAsyncThunk('billing/scan', async ({ barcode, customerId, alreadyScanned }: { barcode: string; customerId?: string; alreadyScanned?: number }) => {
  const response = await api.get(`/billing/scan/${barcode}`, { params: { customerId, alreadyScanned } });
  return response.data.data;
});

export const fetchReservedItems = createAsyncThunk('billing/fetchReserved', async (customerId: string) => {
  const response = await api.get(`/order-booking/all`, { params: { customerId, status: "Hold" } });
  return response.data.data;
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
        state.billings = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllBillings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch billings';
      })
      .addCase(fetchBillingById.fulfilled, (state, action) => {
        state.currentBilling = action.payload;
      })
      .addCase(createBilling.fulfilled, (state, action) => {
        state.billings.unshift(action.payload);
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
