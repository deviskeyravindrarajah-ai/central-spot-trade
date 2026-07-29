export const APP_NAME = "TradeSpot Central";
export const APP_VERSION = "1.0.0 (Central Province Edition)";
export const DEVELOPERS = ["R. Deviskey", "V. Kavish"] as const;
export const DEVELOPER_EMAIL = "deviskeyravindrarajah@gmail.com";

export const SAFETY_WARNING =
  "Safety Warning: TradeSpot acts strictly as a mediator. Never send bank transfers or advance cash deposits before inspecting the vehicle, land deeds, or items in person.";

export const MAX_IMAGES = 5;
export const MAX_VIDEO_SECONDS = 60;

export type AttributeField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  suffix?: string;
  required?: boolean;
};

/** Category id -> dynamic attribute fields rendered on the post-ad wizard. */
export const CATEGORY_ATTRIBUTES: Record<number, AttributeField[]> = {
  1: [
    { key: "make", label: "Make", type: "text", required: true },
    { key: "model", label: "Model", type: "text", required: true },
    { key: "year", label: "Year of Manufacture", type: "number", required: true },
    { key: "mileage", label: "Mileage", type: "number", suffix: "km" },
    {
      key: "transmission",
      label: "Transmission",
      type: "select",
      options: ["Automatic", "Manual", "Tiptronic"],
    },
    {
      key: "fuel",
      label: "Fuel Type",
      type: "select",
      options: ["Petrol", "Diesel", "Hybrid", "Electric"],
    },
  ],
  2: [
    { key: "land_size", label: "Size", type: "number", suffix: "perches", required: true },
    {
      key: "size_unit",
      label: "Size Unit",
      type: "select",
      options: ["Perches", "Acres"],
    },
    {
      key: "type",
      label: "Property Type",
      type: "select",
      options: ["Bare Land", "House", "Commercial", "Tea / Agricultural Estate"],
    },
    {
      key: "deed_type",
      label: "Deed Status",
      type: "select",
      options: ["Freehold", "Sinnakkara", "Swarnabhoomi", "Leasehold"],
    },
  ],
  3: [
    { key: "brand", label: "Brand", type: "text", required: true },
    { key: "model", label: "Model", type: "text", required: true },
    { key: "storage", label: "Storage", type: "text", suffix: "GB / TB" },
    { key: "ram", label: "RAM", type: "text", suffix: "GB" },
    { key: "processor", label: "Processor", type: "text" },
    { key: "battery_health", label: "Battery Health", type: "number", suffix: "%" },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: ["New", "Used", "Reconditioned"],
    },
    { key: "trcsl_approved", label: "TRCSL Approved", type: "boolean" },
  ],
  4: [
    { key: "compat_make", label: "Compatible Make", type: "text", required: true },
    { key: "compat_model", label: "Compatible Model", type: "text" },
    {
      key: "part_category",
      label: "Part Category",
      type: "select",
      options: ["Engine Parts", "Body Parts", "Tyres & Rims", "Electricals", "Interior", "Other"],
    },
    {
      key: "condition",
      label: "Condition",
      type: "select",
      options: ["New", "Used", "Reconditioned"],
    },
  ],
};

export const CONDITION_OPTIONS = ["New", "Used", "Reconditioned"] as const;
