import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface OrderBookingState {
  orderBookings: any[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: OrderBookingState = {
  orderBookings: [],
  pagination: {
    totalRecords: 0,
    currentPage: 1,
    totalPages: 0,
    limit: 10,
  },
  loading: false,
  error: null,
};

export const fetchAllOrderBookings = createAsyncThunk(
  'orderBooking/fetchAll',
  async ({ page, limit, search }: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/order-booking/all', {
        params: { page, limit, search },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to fetch order bookings');
    }
  }
);

export const createOrderBooking = createAsyncThunk(
  'orderBooking/create', 
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/order-booking/create', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to create order booking');
    }
  }
);

export const updateOrderBooking = createAsyncThunk(
  'orderBooking/update', 
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/order-booking/update/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to update order booking');
    }
  }
);

export const deleteOrderBooking = createAsyncThunk(
  'orderBooking/delete', 
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/order-booking/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to delete order booking');
    }
  }
);

const orderBookingSlice = createSlice({
  name: 'orderBooking',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrderBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllOrderBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.orderBookings = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllOrderBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || 'Failed to fetch order bookings';
      })
      .addCase(createOrderBooking.fulfilled, (state, action) => {
        state.orderBookings.unshift(action.payload);
      })
      .addCase(createOrderBooking.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to create order booking';
      })
      .addCase(updateOrderBooking.fulfilled, (state, action) => {
        const index = state.orderBookings.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) state.orderBookings[index] = action.payload;
      })
      .addCase(updateOrderBooking.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to update order booking';
      })
      .addCase(deleteOrderBooking.fulfilled, (state, action) => {
        state.orderBookings = state.orderBookings.filter((b) => b._id !== action.payload);
      })
      .addCase(deleteOrderBooking.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || 'Failed to delete order booking';
      });
  },
});

export default orderBookingSlice.reducer;
