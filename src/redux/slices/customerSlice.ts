import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface CustomerState {
  customers: any[];
  currentCustomer: any;
  loading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  currentCustomer: null,
  loading: false,
  error: null,
};

export const fetchAllCustomers = createAsyncThunk('customer/fetchAll', async () => {
  const response = await api.get('/customer');
  return response.data.data;
});

export const fetchCustomerById = createAsyncThunk('customer/fetchById', async (id: string) => {
  const response = await api.get(`/customer/${id}`);
  return response.data.data;
});

export const createCustomer = createAsyncThunk('customer/create', async (data: any) => {
  const response = await api.post('/customer/create', data);
  return response.data.data;
});

export const updateCustomer = createAsyncThunk('customer/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/customer/${id}`, data);
  return response.data.data;
});

export const deleteCustomer = createAsyncThunk('customer/delete', async (id: string) => {
  await api.delete(`/customer/${id}`);
  return id;
});

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchAllCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.currentCustomer = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.customers[index] = action.payload;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter((c) => c._id !== action.payload);
      });
  },
});

export default customerSlice.reducer;
