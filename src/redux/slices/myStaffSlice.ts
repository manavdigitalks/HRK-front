import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface MyStaffState {
  myStaffs: any[];
  dropdownItems: any[];
  currentMyStaff: any;
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: MyStaffState = {
  myStaffs: [],
  dropdownItems: [],
  currentMyStaff: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllMyStaffs = createAsyncThunk(
  'myStaff/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/mystaff', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const fetchMyStaffById = createAsyncThunk('myStaff/fetchById', async (id: string) => {
  const response = await api.get(`/mystaff/${id}`);
  return response.data.data;
});

export const createMyStaff = createAsyncThunk('myStaff/create', async (data: any) => {
  const response = await api.post('/mystaff/create', data);
  return response.data.data;
});

export const updateMyStaff = createAsyncThunk('myStaff/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/mystaff/${id}`, data);
  return response.data.data;
});

export const deleteMyStaff = createAsyncThunk('myStaff/delete', async (id: string) => {
  await api.delete(`/mystaff/${id}`);
  return id;
});

export const fetchMyStaffDropdown = createAsyncThunk(
  'myStaff/fetchDropdown',
  async (search?: string) => {
    const response = await api.get('/mystaff/dropdown', {
      params: { search },
    });
    return response.data.data;
  }
);

const myStaffSlice = createSlice({
  name: 'myStaff',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllMyStaffs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllMyStaffs.fulfilled, (state, action) => {
        state.loading = false;
        state.myStaffs = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllMyStaffs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch staff members';
      })
      .addCase(fetchMyStaffById.fulfilled, (state, action) => {
        state.currentMyStaff = action.payload;
      })
      .addCase(createMyStaff.fulfilled, (state, action) => {
        state.myStaffs.unshift(action.payload);
      })
      .addCase(updateMyStaff.fulfilled, (state, action) => {
        const index = state.myStaffs.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.myStaffs[index] = action.payload;
      })
      .addCase(deleteMyStaff.fulfilled, (state, action) => {
        state.myStaffs = state.myStaffs.filter((s) => s._id !== action.payload);
      })
      .addCase(fetchMyStaffDropdown.fulfilled, (state, action) => {
        state.dropdownItems = action.payload;
      });
  },
});

export default myStaffSlice.reducer;
