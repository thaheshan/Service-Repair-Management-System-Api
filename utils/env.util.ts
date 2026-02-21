type EnvType = "string" | "number" | "boolean";

interface EnvOptions<T> {
  required?: boolean;
  defaultValue?: T;
  type?: EnvType;
}

export function getEnv<T = string>(
  key: string,
  options: EnvOptions<T> = {},
): T {
  const value = process.env[key];

  if (value === undefined || value === "") {
    if (options.required) {
      throw new Error(`❌ Missing required environment variable: ${key}`);
    }
    return options.defaultValue as T;
  }

  switch (options.type) {
    case "number": {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new Error(`❌ Environment variable ${key} must be a number`);
      }
      return num as T;
    }

    case "boolean":
      return (value === "true") as T;

    default:
      return value as T;
  }
}