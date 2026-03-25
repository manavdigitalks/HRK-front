import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface CategoryMasterState {
  categoryMasters: any[];
  dropdownItems: any[];
  currentCategoryMaster: any;
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: CategoryMasterState = {
  categoryMasters: [],
  dropdownItems: [],
  currentCategoryMaster: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllCategoryMasters = createAsyncThunk(
  'categoryMaster/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/categorymaster', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const fetchCategoryMasterById = createAsyncThunk('categoryMaster/fetchById', async (id: string) => {
  const response = await api.get(`/categorymaster/${id}`);
  return response.data.data;
});

export const createCategoryMaster = createAsyncThunk('categoryMaster/create', async (data: any) => {
  const response = await api.post('/categorymaster/create', data);
  return response.data.data;
});

export const updateCategoryMaster = createAsyncThunk('categoryMaster/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/categorymaster/${id}`, data);
  return response.data.data;
});

export const deleteCategoryMaster = createAsyncThunk('categoryMaster/delete', async (id: string) => {
  await api.delete(`/categorymaster/${id}`);
  return id;
});

export const fetchCategoryDropdown = createAsyncThunk(
  'categoryMaster/fetchDropdown',
  async (search?: string) => {
    const response = await api.get('/categorymaster/dropdown', {
      params: { search },
    });
    return response.data.data;
  }
);

const categoryMasterSlice = createSlice({
  name: 'categoryMaster',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllCategoryMasters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllCategoryMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryMasters = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllCategoryMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch category masters';
      })
      .addCase(fetchCategoryMasterById.fulfilled, (state, action) => {
        state.currentCategoryMaster = action.payload;
      })
      .addCase(createCategoryMaster.fulfilled, (state, action) => {
        state.categoryMasters.unshift(action.payload);
      })
      .addCase(updateCategoryMaster.fulfilled, (state, action) => {
        const index = state.categoryMasters.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.categoryMasters[index] = action.payload;
      })
      .addCase(deleteCategoryMaster.fulfilled, (state, action) => {
        state.categoryMasters = state.categoryMasters.filter((s) => s._id !== action.payload);
      })
      .addCase(fetchCategoryDropdown.fulfilled, (state, action) => {
        state.dropdownItems = action.payload;
      });
  },
});

export default categoryMasterSlice.reducer;
