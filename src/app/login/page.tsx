"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import {
  loginCustomer,
  registerCustomer,
  sendCustomerOtp,
  verifyCustomerOtp,
} from "@/store/slices/customerAuthSlice"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2 } from "lucide-react"

import PromotionalBanner from "@/components/promotional-banner"
import Navbar from "@/components/navbar/Navbar"
import Footer from "@/components/footer"
import { toastSuccess, toastError } from "@/lib/toast"

// A much simpler loading spinner
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}

export default function UserLogin() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loading, token, otpSent } = useSelector(
    (state: RootState) => state.customerAuth,
  )
  const requestedNextPath = searchParams.get("next") || "/profile"
  const nextPath = requestedNextPath.startsWith("/")
    ? requestedNextPath
    : "/profile"

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(Array(6).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (token) {
      router.push(nextPath)
    }
  }, [token, router, nextPath])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(loginCustomer({ identifier, password })).unwrap()
      toastSuccess("Login successful!")
    } catch (err: any) {
      toastError(err.message || "Login failed. Please check your credentials.")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dispatch(registerCustomer({ name, email, phone, password })).unwrap()
      toastSuccess("Registration successful! Please log in.")
      // Ideally, switch to the login tab here
    } catch (err: any) {
      toastError(err.message || "Registration failed. Please try again.")
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length < 10) {
      toastError("Please enter a valid 10-digit phone number.")
      return
    }
    try {
      await dispatch(sendCustomerOtp({ phone })).unwrap()
      toastSuccess("OTP sent successfully!")
    } catch (err: any) {
      toastError(err.message || "Failed to send OTP.")
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join("")
    if (code.length !== 6) {
      toastError("Please enter the 6-digit OTP.")
      return
    }
    try {
      await dispatch(verifyCustomerOtp({ phone, otp: code })).unwrap()
      toastSuccess("OTP verified! You are now logged in.")
    } catch (err: any) {
      toastError(err.message || "Invalid OTP. Please try again.")
    }
  }

  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Tabs defaultValue="login" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
            <TabsTrigger value="otp">OTP Login</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <Image src="/logo.png" alt="Logo" width={60} height={60} className="mx-auto mb-4" />
                <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                <CardDescription>Sign in to access your account and continue shopping.</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier">Email or Phone</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="login-identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-start">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <LoadingSpinner /> : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <Image src="/logo.png" alt="Logo" width={60} height={60} className="mx-auto mb-4" />
                <CardTitle className="text-2xl">Create an Account</CardTitle>
                <CardDescription>Join us! It only takes a minute.</CardDescription>
              </CardHeader>
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input id="register-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Phone Number</Label>
                    <Input id="register-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="1234567890" maxLength={10} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <LoadingSpinner /> : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="otp">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <Image src="/logo.png" alt="Logo" width={60} height={60} className="mx-auto mb-4" />
                <CardTitle className="text-2xl">Quick Login with OTP</CardTitle>
                <CardDescription>We'll send a one-time password to your phone.</CardDescription>
              </CardHeader>
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-phone">Phone Number</Label>
                    <Input id="otp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="1234567890" maxLength={10} required disabled={otpSent} />
                  </div>

                  {otpSent && (
                    <div className="space-y-2">
                      <Label>Enter 6-digit OTP</Label>
                      <div className="flex justify-between gap-2">
                        {otp.map((digit, index) => (
                          <Input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            ref={(el) => { inputRefs.current[index] = el }}
                            className="w-full h-12 text-center text-lg font-semibold"
                            required
                          />
                        ))}
                      </div>
                      <p className="text-center text-sm text-green-600 flex items-center justify-center gap-1 pt-2">
                        <CheckCircle2 size={14} />
                        OTP sent successfully!
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading || (!otpSent && phone.length < 10)}>
                    {loading ? <LoadingSpinner /> : (otpSent ? "Verify OTP" : "Send OTP")}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </>
  )
}

