import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface SupplierState {
  suppliers: any[];
  dropdownOptions: any[];
  currentSupplier: any;
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: SupplierState = {
  suppliers: [],
  dropdownOptions: [],
  currentSupplier: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllSuppliers = createAsyncThunk(
  'supplier/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/supplier', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const fetchSupplierDropdown = createAsyncThunk('supplier/fetchDropdown', async () => {
    const response = await api.get('/supplier/dropdown');
    return response.data.data;
  });

export const fetchSupplierById = createAsyncThunk('supplier/fetchById', async (id: string) => {
  const response = await api.get(`/supplier/${id}`);
  return response.data.data;
});

export const createSupplier = createAsyncThunk('supplier/create', async (data: any) => {
  const response = await api.post('/supplier', data);
  return response.data.data;
});

export const updateSupplier = createAsyncThunk('supplier/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/supplier/${id}`, data);
  return response.data.data;
});

export const deleteSupplier = createAsyncThunk('supplier/delete', async (id: string) => {
  await api.delete(`/supplier/${id}`);
  return id;
});

const supplierSlice = createSlice({
  name: 'supplier',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSuppliers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch suppliers';
      })
      .addCase(fetchSupplierDropdown.fulfilled, (state, action) => {
        state.dropdownOptions = action.payload;
      })
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.currentSupplier = action.payload;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        // state.suppliers.unshift(action.payload);
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const index = state.suppliers.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.suppliers[index] = action.payload;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter((c) => c._id !== action.payload);
      });
  },
});

export default supplierSlice.reducer;
