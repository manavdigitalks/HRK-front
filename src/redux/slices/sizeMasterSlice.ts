import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface SizeMasterState {
  sizeMasters: any[];
  dropdownItems: any[];
  currentSizeMaster: any;
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: SizeMasterState = {
  sizeMasters: [],
  dropdownItems: [],
  currentSizeMaster: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllSizeMasters = createAsyncThunk(
  'sizeMaster/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/sizemaster', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const fetchSizeMasterById = createAsyncThunk('sizeMaster/fetchById', async (id: string) => {
  const response = await api.get(`/sizemaster/${id}`);
  return response.data.data;
});

export const createSizeMaster = createAsyncThunk('sizeMaster/create', async (data: any) => {
  const response = await api.post('/sizemaster/create', data);
  return response.data.data;
});

export const updateSizeMaster = createAsyncThunk('sizeMaster/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/sizemaster/${id}`, data);
  return response.data.data;
});

export const deleteSizeMaster = createAsyncThunk('sizeMaster/delete', async (id: string) => {
  await api.delete(`/sizemaster/${id}`);
  return id;
});

export const fetchSizeDropdown = createAsyncThunk(
  'sizeMaster/fetchDropdown',
  async (search?: string) => {
    const response = await api.get('/sizemaster/dropdown', {
      params: { search },
    });
    return response.data.data;
  }
);

const sizeMasterSlice = createSlice({
  name: 'sizeMaster',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSizeMasters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllSizeMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.sizeMasters = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllSizeMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch size masters';
      })
      .addCase(fetchSizeMasterById.fulfilled, (state, action) => {
        state.currentSizeMaster = action.payload;
      })
      .addCase(createSizeMaster.fulfilled, (state, action) => {
        state.sizeMasters.unshift(action.payload);
      })
      .addCase(updateSizeMaster.fulfilled, (state, action) => {
        const index = state.sizeMasters.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.sizeMasters[index] = action.payload;
      })
      .addCase(deleteSizeMaster.fulfilled, (state, action) => {
        state.sizeMasters = state.sizeMasters.filter((s) => s._id !== action.payload);
      })
      .addCase(fetchSizeDropdown.fulfilled, (state, action) => {
        state.dropdownItems = action.payload;
      });
  },
});

export default sizeMasterSlice.reducer;
