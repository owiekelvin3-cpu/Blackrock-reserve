import { z } from "zod";
import { validateProfileImageDataUrl } from "@/lib/profile-image";

const optionalImage = z
  .string()
  .nullable()
  .optional()
  .refine(
    (v) => {
      if (v == null || v === "") return true;
      if (v.startsWith("http://") || v.startsWith("https://")) return v.length <= 2000;
      return validateProfileImageDataUrl(v).ok;
    },
    { message: "Invalid logo image (use URL or JPG/PNG/WEBP under 350KB)" }
  );

const returnField = z.coerce.number().min(-9999).max(9999).optional();

export const marketAssetFieldsSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  sector: z.string().min(1).max(60).optional(),
  description: z.string().min(1).max(4000).optional(),
  logoDomain: z.string().max(120).nullable().optional(),
  logoUrl: optionalImage,
  price: z.coerce.number().positive().optional(),
  changePercent: returnField,
  minInvestment: z.coerce.number().positive().optional(),
  riskRating: z.enum(["Low", "Medium", "High"]).optional(),
  expectedReturnPercent: z.coerce.number().min(-100).max(500).optional(),
  growthRate: returnField,
  return7d: returnField,
  return14d: returnField,
  return30d: returnField,
  return90d: returnField,
  return1y: returnField,
  returnWeekly: returnField,
  returnMonthly: returnField,
  returnYearly: returnField,
  customReturnLabel: z.string().max(40).nullable().optional(),
  customReturnPercent: returnField.nullable().optional(),
  marketCapRank: z.coerce.number().int().min(1).max(9999).optional(),
  popularity: z.coerce.number().int().min(0).max(999999).optional(),
  sortOrder: z.coerce.number().int().min(0).max(99999).optional(),
  isFeatured: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

export const createMarketAssetSchema = z.object({
  symbol: z.string().min(1).max(12),
  name: z.string().min(1).max(120),
  sector: z.string().min(1).max(60),
  description: z.string().min(1).max(4000),
  logoDomain: z.string().max(120).optional(),
  logoUrl: optionalImage,
  price: z.coerce.number().positive(),
  changePercent: returnField,
  minInvestment: z.coerce.number().positive().optional(),
  riskRating: z.enum(["Low", "Medium", "High"]).optional(),
  expectedReturnPercent: z.coerce.number().min(-100).max(500).optional(),
  growthRate: returnField,
  return7d: returnField,
  return14d: returnField,
  return30d: returnField,
  return90d: returnField,
  return1y: returnField,
  returnWeekly: returnField,
  returnMonthly: returnField,
  returnYearly: returnField,
  customReturnLabel: z.string().max(40).optional(),
  customReturnPercent: returnField.optional(),
  marketCapRank: z.coerce.number().int().positive().optional(),
  popularity: z.coerce.number().int().min(0).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

export const reorderMarketAssetsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export type MarketAssetFormInput = z.infer<typeof createMarketAssetSchema>;
