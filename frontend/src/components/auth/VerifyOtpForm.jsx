import React, { useState, useEffect, useRef } from "react";
import { Key, ArrowLeft, Clock, RotateCw, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";

export const VerifyOtpForm = ({ email, onBack, onOtpVerified }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // OTP validation
  const validateOtp = (otpArray) => {
    const otpString = otpArray.join("");
    if (otpString.length !== 6) return "Please enter all 6 digits of the OTP";
    if (!/^\d{6}$/.test(otpString)) return "OTP must contain only numbers";
    if (timeLeft <= 0) return "OTP has expired. Please request a new one.";
    return "";
  };

  // Update validation when OTP or timer changes
  useEffect(() => {
    const error = validateOtp(otp);
    setOtpError(error);
    setIsValid(!error && otp.join("").length === 6);
  }, [otp, timeLeft]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setTouched(true);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split("").slice(0, 6);
      setOtp(newOtp.concat(Array(6 - newOtp.length).fill("")));
      setTouched(true);

      const lastFilledIndex = Math.min(newOtp.length - 1, 5);
      inputRefs.current[lastFilledIndex].focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResendOtp = async () => {
    setIsResending(true);

    try {
      const result = await authService.forgotPassword(email);

      if (result.success) {
        setTimeLeft(180);
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setTouched(false);
        setIsValid(false);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
        toast.success("New OTP sent to your email!");
      } else {
        toast.error(result.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpString = otp.join("");
    const error = validateOtp(otp);

    if (error) {
      setOtpError(error);
      toast.error("Please fix the OTP error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyOtp(email, otpString);

      if (result.success) {
        toast.success("OTP verified successfully!");

        if (onOtpVerified) {
          onOtpVerified(email, otpString);
        }
      } else {
        toast.error(result.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get border color based on validation state
  const getInputBorderColor = (index) => {
    if (timeLeft <= 0)
      return "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200";
    if (otpError && touched)
      return "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200";
    if (otp[index])
      return "border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
    return "border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify OTP</h2>
        <p className="text-gray-600">
          Enter the 6-digit code sent to{" "}
          <span className="font-semibold">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock
              className={`w-4 h-4 ${timeLeft < 60 ? "text-red-500" : "text-gray-500"}`}
            />
            <span
              className={`font-medium ${timeLeft < 60 ? "text-red-600" : "text-gray-700"}`}
            >
              Code expires in: {formatTime(timeLeft)}
            </span>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={otp[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all ${getInputBorderColor(index)}`}
                disabled={isLoading || timeLeft <= 0}
              />
            ))}
          </div>

          {/* Error Message */}
          {otpError && touched && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            </div>
          )}

          {/* Resend OTP */}
          <div className="text-center">
            {timeLeft <= 0 ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <LoadingSpinner size="sm" color="currentColor" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    <span>Resend OTP</span>
                  </>
                )}
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Didn't receive code? Resend in {formatTime(timeLeft)}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isLoading || timeLeft <= 0}
            className={`w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 shadow-lg ${
              !isValid ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{
              backgroundColor: "#134E4A",
              backgroundImage:
                "linear-gradient(135deg, #134E4A 0%, #0D3A36 100%)",
            }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Key className="w-5 h-5" />
                <span>Verify OTP</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
