import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface TransportMasterState {
  transportMasters: any[];
  dropdownItems: any[];
  currentTransportMaster: any;
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: TransportMasterState = {
  transportMasters: [],
  dropdownItems: [],
  currentTransportMaster: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllTransportMasters = createAsyncThunk(
  'transportMaster/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/transportmaster', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const fetchTransportMasterById = createAsyncThunk('transportMaster/fetchById', async (id: string) => {
  const response = await api.get(`/transportmaster/${id}`);
  return response.data.data;
});

export const createTransportMaster = createAsyncThunk('transportMaster/create', async (data: any) => {
  const response = await api.post('/transportmaster/create', data);
  return response.data.data;
});

export const updateTransportMaster = createAsyncThunk('transportMaster/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/transportmaster/${id}`, data);
  return response.data.data;
});

export const deleteTransportMaster = createAsyncThunk('transportMaster/delete', async (id: string) => {
  await api.delete(`/transportmaster/${id}`);
  return id;
});

export const fetchTransportDropdown = createAsyncThunk(
  'transportMaster/fetchDropdown',
  async (search?: string) => {
    const response = await api.get('/transportmaster/dropdown', {
      params: { search },
    });
    return response.data.data;
  }
);

const transportMasterSlice = createSlice({
  name: 'transportMaster',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTransportMasters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllTransportMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.transportMasters = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllTransportMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transport masters';
      })
      .addCase(fetchTransportMasterById.fulfilled, (state, action) => {
        state.currentTransportMaster = action.payload;
      })
      .addCase(createTransportMaster.fulfilled, (state, action) => {
        state.transportMasters.unshift(action.payload);
      })
      .addCase(updateTransportMaster.fulfilled, (state, action) => {
        const index = state.transportMasters.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.transportMasters[index] = action.payload;
      })
      .addCase(deleteTransportMaster.fulfilled, (state, action) => {
        state.transportMasters = state.transportMasters.filter((s) => s._id !== action.payload);
      })
      .addCase(fetchTransportDropdown.fulfilled, (state, action) => {
        state.dropdownItems = action.payload;
      });
  },
});

export default transportMasterSlice.reducer;
