import { NEXT_PUBLIC_API_URL } from '@/config/variables'
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

interface AuthState {
  loading: boolean
  success: boolean
  error: string | null
  data: any | null
  token: string | null
}
const initialState: AuthState = {
  loading: false,
  success: false,
  error: null,
  data: null,
  token: null,
}


const BASE_URL = NEXT_PUBLIC_API_URL


export const sendOtp = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>('auth/sendOtp', async (phone, { rejectWithValue }) => {
  try {
    const goodPhone = `91${phone}`
    const response = await axios.post(`${BASE_URL}/vendors/send-otp`, { goodPhone })
    console.log("sdadas",response,response.data)
    sessionStorage.setItem("vendor_otp",response.data.otp)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send OTP')
  }
})

export const verifyOtp = createAsyncThunk<
  any,
  { phone: string; otp: string },
  { rejectValue: string }
>('auth/verifyOtp', async ({ phone, otp }, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${BASE_URL}/vendors/verify-otp`, { phone, otp })
    console.log(response.data,"asdasdsa")
    return response.data.token
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to verify OTP')
  }
})

// -------------------------
// Email OTP Thunks
// -------------------------
export const sendEmailOtp = createAsyncThunk<
  any,
  { email: string },
  { rejectValue: string; state: any }
>('auth/sendEmailOtp', async ({ email }, { rejectWithValue, getState }) => {
  try {
    const state = getState()
    const token = state?.auth?.token
    const response = await axios.post(
      `${BASE_URL}/vendors/send-email-otp`,
      { email },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send Email OTP')
  }
})

export const verifyEmailOtp = createAsyncThunk<
  any,
  { email: string; otp: string },
  { rejectValue: string; state: any }
>('auth/verifyEmailOtp', async ({ email, otp }, { rejectWithValue, getState }) => {
  try {
    const state = getState()
    const token = state?.auth?.token
    const response = await axios.post(
      `${BASE_URL}/vendors/verify-email-otp`,
      { email, otp },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to verify Email OTP')
  }
})

// -------------------------
// Slice
// -------------------------
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetOtpState: (state) => {
      state.loading = false
      state.success = false
      state.error = null
      state.data = null
    },
    logoutAuth: (state) => {
      state.loading = false
      state.success = false
      state.error = null
      state.data = null
      state.token = null
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sendOtp.pending, (state) => {
      state.loading = true
      state.error = null
      state.success = false
    })
    builder.addCase(sendOtp.fulfilled, (state, action) => {
      state.loading = false
      state.success = true
      state.data = action.payload
    })
    builder.addCase(sendOtp.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Something went wrong'
    })

    // Verify Phone OTP
    builder.addCase(verifyOtp.pending, (state) => {
      state.loading = true
      state.error = null
      state.success = false
    })
    builder.addCase(verifyOtp.fulfilled, (state, action) => {
      state.loading = false
      state.success = true
      state.token = action.payload
    })
    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Something went wrong'
    })

    // Send Email OTP
    builder.addCase(sendEmailOtp.pending, (state) => {
      state.loading = true
      state.error = null
      state.success = false
    })
    builder.addCase(sendEmailOtp.fulfilled, (state, action) => {
      state.loading = false
      state.success = true
      state.data = action.payload
    })
    builder.addCase(sendEmailOtp.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Something went wrong'
    })

    // Verify Email OTP
    builder.addCase(verifyEmailOtp.pending, (state) => {
      state.loading = true
      state.error = null
      state.success = false
    })
    builder.addCase(verifyEmailOtp.fulfilled, (state, action) => {
      state.loading = false
      state.success = true
      state.data = action.payload
    })
    builder.addCase(verifyEmailOtp.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Something went wrong'
    })
  },
})

export const { resetOtpState, logoutAuth } = authSlice.actions
export default authSlice.reducer
