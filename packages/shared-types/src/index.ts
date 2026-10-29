export type ApiError = {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
};

export type HealthStatus = {
  status: "ok" | "unavailable";
  checks?: Record<string, "ok" | "unavailable">;
};
