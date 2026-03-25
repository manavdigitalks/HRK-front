import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface ProductState {
  products: any[];
  dropdownItems: any[];
  currentProduct: any;
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  dropdownItems: [],
  currentProduct: null,
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllProducts = createAsyncThunk(
  'product/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/product', {
      params: { page, limit, search },
    });
    return response.data;
  }
);

export const fetchProductDropdown = createAsyncThunk(
  'product/fetchDropdown',
  async (search?: string) => {
    const response = await api.get('/product/dropdown', {
      params: { search },
    });
    return response.data.data;
  }
);

export const fetchProductById = createAsyncThunk('product/fetchById', async (id: string) => {
  const response = await api.get(`/product/${id}`);
  return response.data.data;
});

export const createProduct = createAsyncThunk('product/create', async (data: any) => {
  const response = await api.post('/product/create', data);
  return response.data.data;
});

export const updateProduct = createAsyncThunk('product/update', async ({ id, data }: { id: string; data: any }) => {
  const response = await api.put(`/product/${id}`, data);
  return response.data.data;
});

export const deleteProduct = createAsyncThunk('product/delete', async (id: string) => {
  await api.delete(`/product/${id}`);
  return id;
});

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(fetchProductDropdown.fulfilled, (state, action) => {
        state.dropdownItems = action.payload;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.products[index] = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
      });
  },
});

export default productSlice.reducer;
