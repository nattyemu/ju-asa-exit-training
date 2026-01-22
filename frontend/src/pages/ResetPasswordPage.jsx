// src/pages/ResetPasswordPage.jsx - Fixed version
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { VerifyOtpForm } from '../components/auth/VerifyOtpForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { PasswordResetSuccess } from '../components/auth/PasswordResetSuccess';
import { usePasswordReset } from '../contexts/PasswordResetContext';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { resetData, updateResetData, clearResetData } = usePasswordReset();

  // Add null/undefined check
  const step = resetData?.step || 'forgot';
  const email = resetData?.email || '';
  const otp = resetData?.otp || '';

  const renderStep = () => {
    switch (step) {
      case 'verify':
        return (
          <VerifyOtpForm
            email={email}
            onBack={() => {
              updateResetData({ step: 'forgot' });
            }}
            onOtpVerified={(email, otp) => {
              updateResetData({ email, otp, step: 'reset' });
            }}
          />
        );
      case 'reset':
        return (
          <ResetPasswordForm
            email={email}
            otp={otp}
            onBack={() => {
              updateResetData({ step: 'verify' });
            }}
            onSuccess={() => {
              updateResetData({ step: 'success' });
            }}
          />
        );
      case 'success':
        return (
          <PasswordResetSuccess
            onBackToLogin={() => {
              clearResetData();
              navigate('/login');
            }}
          />
        );
      default: // 'forgot'
        return (
          <ForgotPasswordForm
            onBackToLogin={() => navigate('/login')}
            onEmailSent={(email) => {
              updateResetData({ email, step: 'verify' });
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
         
          <h1 className="text-3xl font-bold text-gray-900">Password Recovery</h1>
          <p className="text-gray-600 mt-2">Reset your account password</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStep()}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} JU ASA Exit Exam Platform
          </p>
        </div>
      </div>
    </div>
  );
};