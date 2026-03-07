import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface ProductState {
  products: any[];
  currentProduct: any;
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  loading: false,
  error: null,
};

export const fetchAllProducts = createAsyncThunk('product/fetchAll', async () => {
  const response = await api.get('/product');
  return response.data.data;
});

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
        state.products = action.payload;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.currentProduct = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
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
