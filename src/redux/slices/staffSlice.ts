import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface StaffState {
  staffs: any[];
  currentStaff: any;
  loading: boolean;
  error: string | null;
  pagination: any;
}

const initialState: StaffState = {
  staffs: [],
  currentStaff: null,
  loading: false,
  error: null,
  pagination: null,
};

export const fetchAllStaffs = createAsyncThunk('staff/fetchAll', async (params?: { page?: number; limit?: number; search?: string }) => {
  const response = await api.get('/staff', { params });
  return response.data;
});

export const fetchStaffById = createAsyncThunk('staff/fetchById', async (id: string) => {
  const response = await api.get(`/staff/${id}`);
  return response.data.data;
});

export const createStaff = createAsyncThunk('staff/create', async (data: any) => {
  const response = await api.post('/staff/create', data);
  return response.data.data;
});

export const updateStaff = createAsyncThunk('staff/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/staff/${id}`, data);
  return response.data.data;
});

export const deleteStaff = createAsyncThunk('staff/delete', async (id: string) => {
  await api.delete(`/staff/${id}`);
  return id;
});

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStaffs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllStaffs.fulfilled, (state, action) => {
        state.loading = false;
        state.staffs = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllStaffs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch staffs';
      })
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        state.currentStaff = action.payload;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.staffs.push(action.payload);
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        const index = state.staffs.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.staffs[index] = action.payload;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.staffs = state.staffs.filter((s) => s._id !== action.payload);
      });
  },
});

export default staffSlice.reducer;
