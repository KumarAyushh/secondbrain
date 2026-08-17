export interface RegisterInput {
  email: string;
  password: string;
}

export interface VerifyOtpInput {
  email: string;
  otp: string;
}

export interface PendingRegistration {
  passwordHash: string;
  otpHash: string;
}
