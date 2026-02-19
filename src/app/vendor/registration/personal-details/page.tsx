"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import Swal from "sweetalert2";
import QuoteBlock from "@/components/quotes";
import { sendEmailOtp, verifyEmailOtp } from "@/store/slices/authSlice";
import { AppDispatch } from "@/store";
 // adjust path

export default function Step2() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: any) => state.auth);

  // -------------------
  // Send Email OTP
  // -------------------
  const handleSendOtp = async () => {
    if (!email) {
      Swal.fire("Error", "Please enter your email address", "error");
      return;
    }

    try {
      setLoading(true);
      const result: any = await dispatch(sendEmailOtp({ email }));
      sessionStorage.setItem("vendor_email",email)
      if (result.meta.requestStatus === "fulfilled") {
        setOtpSent(true);
        Swal.fire("Success", "OTP sent to your email!", "success");
      } else {
        Swal.fire("Error", result.payload || "Failed to send OTP", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong while sending OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------
  // Verify Email OTP
  // -------------------
  const handleVerifyOtp = async () => {
    if (!otp) {
      Swal.fire("Error", "Please enter the OTP", "error");
      return;
    }

    try {
      setLoading(true);
      const result: any = await dispatch(verifyEmailOtp({ email, otp }));

      if (result.meta.requestStatus === "fulfilled") {
        Swal.fire("Success", "Email verified successfully!", "success");
        router.push("/vendor/registration/business-details");
      } else {
        Swal.fire("Error", result.payload || "Failed to verify OTP", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong while verifying OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background px-8 py-16 flex flex-col items-center justify-start">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12 max-w-4xl"
      >
        <h1 className="text-6xl font-extrabold text-primary">Email Verification</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Please verify your email address to continue vendor registration.
        </p>
      </motion.div>

      {/* OTP Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border border-border bg-background/80 backdrop-blur-lg p-8">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold">
              {otpSent ? "Verify Your Email" : "Enter Your Email"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!otpSent ? (
              <>
                <label className="mb-2 block font-semibold text-sm">Email Address</label>
                <div className="relative mb-6">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                  />
                </div>

                <Button onClick={handleSendOtp} disabled={loading} className="w-full">
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </>
            ) : (
              <>
                <label className="mb-2 block font-semibold text-sm">Enter OTP</label>
                <div className="relative mb-6">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="pl-10"
                  />
                </div>

                <Button onClick={handleVerifyOtp} disabled={loading} className="w-full">
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Quote */}
      <QuoteBlock />
    </div>
  );
}
