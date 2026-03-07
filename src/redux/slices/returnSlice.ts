import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface ReturnState {
  returns: any[];
  currentReturn: any;
  loading: boolean;
  error: string | null;
}

const initialState: ReturnState = {
  returns: [],
  currentReturn: null,
  loading: false,
  error: null,
};

export const fetchAllReturns = createAsyncThunk('return/fetchAll', async () => {
  const response = await api.get('/return');
  return response.data.data;
});

export const fetchReturnById = createAsyncThunk('return/fetchById', async (id: string) => {
  const response = await api.get(`/return/${id}`);
  return response.data.data;
});

export const createReturn = createAsyncThunk('return/create', async (data: any) => {
  const response = await api.post('/return/create', data);
  return response.data.data;
});

export const updateReturn = createAsyncThunk('return/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/return/${id}`, data);
  return response.data.data;
});

export const deleteReturn = createAsyncThunk('return/delete', async (id: string) => {
  await api.delete(`/return/${id}`);
  return id;
});

const returnSlice = createSlice({
  name: 'return',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllReturns.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.returns = action.payload;
      })
      .addCase(fetchAllReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch returns';
      })
      .addCase(fetchReturnById.fulfilled, (state, action) => {
        state.currentReturn = action.payload;
      })
      .addCase(createReturn.fulfilled, (state, action) => {
        state.returns.push(action.payload);
      })
      .addCase(updateReturn.fulfilled, (state, action) => {
        const index = state.returns.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.returns[index] = action.payload;
      })
      .addCase(deleteReturn.fulfilled, (state, action) => {
        state.returns = state.returns.filter((r) => r._id !== action.payload);
      });
  },
});

export default returnSlice.reducer;
