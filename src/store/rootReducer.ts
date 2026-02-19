import { combineReducers } from "@reduxjs/toolkit"
import bannerReducer from "./slices/bannerSlice"
import categoryReducer from "./slices/category"
import authReducer from './slices/authSlice'
import vendorReducer from './slices/vendorSlice'
import productReducer from './slices/productSlice'
import alltemplateReducer from './slices/alltemplateslice'
import vendorprofileReducer from './slices/vendorProfileSlice'
import customerAuthReducer from "./slices/customerAuthSlice"
import customerCartReducer from "./slices/customerCartSlice"
import customerAddressReducer from "./slices/customerAddressSlice"
import customerOrderReducer from "./slices/customerOrderSlice"
import customerWishlistReducer from "./slices/customerWishlistSlice"

const rootReducer = combineReducers({
  banner: bannerReducer,
  category:categoryReducer,
  auth:authReducer,
  vendor:vendorReducer,
  product:productReducer,
  alltemplatepage:alltemplateReducer,
  vendorprofilepage:vendorprofileReducer,
  customerAuth: customerAuthReducer,
  customerCart: customerCartReducer,
  customerAddress: customerAddressReducer,
  customerOrder: customerOrderReducer,
  customerWishlist: customerWishlistReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer
