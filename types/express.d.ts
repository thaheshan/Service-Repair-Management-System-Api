import "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: "ADMIN" | "MANAGER" | "TECHNICIAN" | "CUSTOMER";
      tenantId: string;
      shopId: string | null;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
