export interface CustomerReportRow {
  name: string;
  email: string | null;
  phone: string | null;
  /** Customer address; clients may show N/A when null */
  location: string | null;
  /**
   * Segment label (no dedicated DB field).
   * "New" = profile created within the last N days of the report window end;
   * "VIP" = otherwise, high activity in the report period;
   * "Regular" = default.
   */
  type: string;
  repairs: number;
  /** Total completed payment amount in the report period (numeric; format "Rs. …" on the client). */
  totalSpent: number;
}

export interface CustomerReportResponse {
  generatedAt: string;
  customers: CustomerReportRow[];
}

export interface CustomerReportScope {
  tenantId: string;
  shopId: string | null;
}
