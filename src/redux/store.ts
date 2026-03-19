import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import staffReducer from './slices/staffSlice';
import productReducer from './slices/productSlice';
import customerReducer from './slices/customerSlice';
import stockReducer from './slices/stockSlice';
import billingReducer from './slices/billingSlice';
import saleOrderReducer from './slices/saleOrderSlice';
import purchaseOrderReducer from './slices/purchaseOrderSlice';
import returnReducer from './slices/returnSlice';
import sizeMasterReducer from './slices/sizeMasterSlice';
import categoryMasterReducer from './slices/categoryMasterSlice';
import transportMasterReducer from './slices/transportMasterSlice';
import stockEntryReducer from './slices/stockEntrySlice';
import supplierReducer from './slices/supplierSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    staff: staffReducer,
    product: productReducer,
    customer: customerReducer,
    supplier: supplierReducer,
    stock: stockReducer,
    billing: billingReducer,
    saleOrder: saleOrderReducer,
    purchaseOrder: purchaseOrderReducer,
    return: returnReducer,
    sizeMaster: sizeMasterReducer,
    categoryMaster: categoryMasterReducer,
    transportMaster: transportMasterReducer,
    stockEntry: stockEntryReducer,
  },
});



export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
