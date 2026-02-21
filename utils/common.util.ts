export const successResponse = (res: any) => {
  return {
    isError: false,
    data: res,
  };
};
export const errorResponse = (res: any) => {
  return {
    status: false,
    message: res,
  };
};

export const pick = <
  T extends Record<string, any>,
  K extends readonly (keyof T)[],
>(
  obj: T,
  keys: K,
): Pick<T, K[number]> => {
  return keys.reduce(
    (acc, key) => {
      if (obj[key] !== undefined) {
        acc[key] = obj[key];
      }
      return acc;
    },
    {} as Pick<T, K[number]>,
  );
};

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}