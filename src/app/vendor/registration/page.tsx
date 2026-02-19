"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store";
import { resetOtpState, sendOtp, verifyOtp } from "@/store/slices/authSlice";
import Swal from "sweetalert2";
import PromotionalBanner from "@/components/promotional-banner";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";

export default function VendorRegistrationPage() {
  const [phone, setPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<HTMLInputElement[]>([]);

  const { success, error } = useSelector((state: any) => state.auth);

  useEffect(() => {
    if (showOtp && timer > 0) {
      const countdown = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [showOtp, timer]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setPhone(value);
  };

  const handleContinue = async () => {
    if (phone.length !== 10) return;

    const sent = await handleSubmit();
    if (!sent) return;

    setShowOtp(true);
    setTimer(30);
    setCanResend(false);
  };

  const handleEditNumber = () => {
    setShowOtp(false);
    setOtp(["", "", "", "", "", ""]);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < otp.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split("");
      setOtp(newOtp);
      otpRefs.current[newOtp.length - 1]?.focus();
    }
  };
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async () => {
    if (!phone) {
      Swal.fire("Warning", "Please enter a phone number", "warning");
      return false;
    }

    try {
      await dispatch(sendOtp(phone)).unwrap();
      sessionStorage.setItem("vendor_phone", phone);
      Swal.fire("Success", "OTP sent successfully", "success");
      return true;
    } catch (err: any) {
      console.error(err, "error");
      const message =
        typeof err === "string"
          ? err
          : err?.message ?? "Failed to send OTP. Please try again.";
      Swal.fire("Error", message, "error");
      return false;
    }
  };

  useEffect(() => {
    if (success) {
      dispatch(resetOtpState());
    }

    if (error) {
      dispatch(resetOtpState());
    }
  }, [success, error, dispatch]);
  const handleResend = async () => {
    setOtp(["", "", "", "", "", ""]);
    const sent = await handleSubmit();

    if (sent) {
      setTimer(30);
      setCanResend(false);
    } else {
      setCanResend(true);
    }
  };

  const handleVerifyOtp = async () => {
    // If OTP is an array, join it properly; otherwise safely convert to string
    const otpString: string = Array.isArray(otp)
      ? otp.join("")
      : String(otp).trim();

    if (!phone || !otpString) {
      Swal.fire("Warning", "Please enter both phone number and OTP", "warning");
      return;
    }

    try {
      await dispatch(verifyOtp({ phone, otp: otpString })).unwrap();
      Swal.fire("Success", "OTP verified successfully", "success");

      router.push("/vendor/registration/personal-details");
    } catch (error:any) {
      console.error("Error verifying OTP:", error);
      const message =
        typeof error === "string"
          ? error
          : error?.message ??
            "Something went wrong while verifying OTP. Please try again.";
      Swal.fire("Error", message, "error");
    }
  };

  const isOtpComplete = otp.join("").length === 6;
  const temp_otp = sessionStorage.getItem("vendor_otp");
  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background px-6 py-20 text-foreground">
        {/* Header Quote */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-2xl"
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
            Join India’s Fastest-Growing Marketplace 🚀
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            “Empowering small businesses with big technology.”
          </p>
        </motion.div>

        {/* Main Registration Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border border-border bg-background/80 backdrop-blur-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-4xl md:text-5xl font-bold">
                Vendor Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="mt-8 space-y-8">
              {!showOtp ? (
                <>
                  {/* Phone Input */}
                  <div className="flex items-center gap-3 border rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Using img to avoid next/image config */}
                      <img
                        src="https://flagcdn.com/w20/in.png"
                        alt="India Flag"
                        width={24}
                        height={24}
                        className="rounded-sm"
                      />
                      <span className="text-lg font-medium text-foreground">
                        +91
                      </span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="flex-1 border-none focus-visible:ring-0 text-lg"
                    />
                  </div>

                  <div className="text-center">
                    <Button
                      size="lg"
                      className="w-full text-lg mt-4"
                      onClick={handleContinue}
                      disabled={phone.length < 10}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Section */}
                  <div className="text-center space-y-3">
                    <p className="text-lg text-muted-foreground">
                      OTP sent to{" "}
                      <span className="font-semibold">+91 {phone}</span>
                    </p>
                    <Button
                      variant="link"
                      className="text-sm text-primary"
                      onClick={handleEditNumber}
                    >
                      Edit number
                    </Button>
                  </div>

                  {/* OTP Boxes */}
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          otpRefs.current[index] = el!;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        onPaste={handlePaste}
                        className="w-12 h-12 text-center text-2xl font-semibold border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    ))}
                  </div>

                  {/* Resend Timer */}
                  <div className="text-center mt-6 text-sm text-muted-foreground">
                    {canResend ? (
                      <Button
                        variant="link"
                        className="text-primary text-base"
                        onClick={handleResend}
                      >
                        Resend OTP 🔁
                      </Button>
                    ) : (
                      <p>Resend OTP in {timer}s</p>
                    )}
                  </div>

                  <div className="text-center mt-8">
                    <Button
                      size="lg"
                      className="w-full text-lg"
                      disabled={!isOtpComplete}
                      onClick={() => handleVerifyOtp()}
                    >
                      Verify OTP
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Divider */}
        <Separator className="my-16 w-3/4 max-w-xl" />

        {/* Extra Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center max-w-3xl space-y-6"
        >
          <h3 className="text-3xl font-bold">Why Join Us?</h3>
          <p className="text-muted-foreground text-lg">
            We help vendors reach customers across India with zero setup hassle.
            Our platform offers advanced analytics, easy payment settlements,
            and a powerful dashboard to track growth.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              {
                title: "0% Listing Fee",
                desc: "Start your online store instantly without hidden charges.",
              },
              {
                title: "24/7 Support",
                desc: "Our vendor success team is always available to assist you.",
              },
              {
                title: "Sell Anywhere",
                desc: "Expand beyond borders and reach new markets with one click.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-card border border-border rounded-2xl shadow-md p-6"
              >
                <h4 className="text-xl font-semibold text-primary mb-2">
                  {item.title}
                </h4>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <p className="mt-12 text-lg italic text-muted-foreground">
            “Your journey to success begins with a single registration.”
          </p>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
