import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userApi from "@/lib/userApi";

interface CustomerAuthState {
  loading: boolean;
  error: string | null;
  token: string | null;
  user: any | null;
  otpSent: boolean;
}

const initialState: CustomerAuthState = {
  loading: false,
  error: null,
  token: null,
  user: null,
  otpSent: false,
};

export const registerCustomer = createAsyncThunk(
  "customerAuth/register",
  async (
    payload: { name: string; email: string; phone: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await userApi.post("/register", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to register",
      );
    }
  },
);

export const loginCustomer = createAsyncThunk(
  "customerAuth/login",
  async (
    payload: { identifier: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await userApi.post("/login", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to login",
      );
    }
  },
);

export const sendCustomerOtp = createAsyncThunk(
  "customerAuth/sendOtp",
  async (payload: { phone: string }, { rejectWithValue }) => {
    try {
      const res = await userApi.post("/send-otp", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send OTP",
      );
    }
  },
);

export const verifyCustomerOtp = createAsyncThunk(
  "customerAuth/verifyOtp",
  async (
    payload: { phone: string; otp: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await userApi.post("/verify-otp", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to verify OTP",
      );
    }
  },
);

export const fetchCustomerProfile = createAsyncThunk(
  "customerAuth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.get("/me");
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load profile",
      );
    }
  },
);

export const updateCustomerProfile = createAsyncThunk(
  "customerAuth/updateProfile",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await userApi.put("/me", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile",
      );
    }
  },
);

const customerAuthSlice = createSlice({
  name: "customerAuth",
  initialState,
  reducers: {
    logoutCustomer: (state) => {
      state.token = null;
      state.user = null;
    },
    resetCustomerAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.token || null;
        state.user = action.payload?.user || null;
      })
      .addCase(registerCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to register";
      })
      .addCase(loginCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.token || null;
        state.user = action.payload?.user || null;
      })
      .addCase(loginCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to login";
      })
      .addCase(sendCustomerOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.otpSent = false;
      })
      .addCase(sendCustomerOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(sendCustomerOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to send OTP";
      })
      .addCase(verifyCustomerOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyCustomerOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload?.token || null;
      })
      .addCase(verifyCustomerOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to verify OTP";
      })
      .addCase(fetchCustomerProfile.fulfilled, (state, action) => {
        state.user = action.payload?.user || null;
      })
      .addCase(updateCustomerProfile.fulfilled, (state, action) => {
        state.user = action.payload?.user || null;
      });
  },
});

export const { logoutCustomer, resetCustomerAuthError } =
  customerAuthSlice.actions;
export default customerAuthSlice.reducer;
