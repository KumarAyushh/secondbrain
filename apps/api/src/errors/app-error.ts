import type { ErrorCode } from "./error-codes.js";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: ErrorCode;
    public readonly isOperational: boolean;
  
    constructor(
      message: string,
      statusCode: number,
      code: ErrorCode,
      isOperational = true
    ) {
      super(message);
  
      this.name = this.constructor.name;
      this.statusCode = statusCode;
      this.code = code;
      this.isOperational = isOperational;
  
      //With captureStackTrace, the constructor frames are removed, 
      //so the stack starts where the error was actually thrown:
      Error.captureStackTrace(this, this.constructor);
    }
  }