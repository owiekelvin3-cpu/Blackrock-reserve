"use client";

import { useState } from "react";
import { Upload, Shield } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

type Props = {
  defaultEmail?: string;
  defaultName?: string;
  defaultPhone?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
};

function FileField({
  label,
  required,
  onFile,
}: {
  label: string;
  required?: boolean;
  onFile: (dataUrl: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-text-secondary mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      <div className="border border-dashed border-white/15 rounded-xl p-4 hover:border-accent-brand/40 transition-colors cursor-pointer">
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 3 * 1024 * 1024) {
              alert("File must be under 3MB");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => onFile(reader.result as string);
            reader.readAsDataURL(file);
          }}
        />
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Upload size={16} />
          <span>Click to upload (max 3MB)</span>
        </div>
      </div>
    </label>
  );
}

export default function TaxRefundForm({ defaultEmail, defaultName, defaultPhone, onSubmit, submitting }: Props) {
  const [form, setForm] = useState({
    fullLegalName: defaultName ?? "",
    dateOfBirth: "",
    ssn: "",
    phone: defaultPhone ?? "",
    email: defaultEmail ?? "",
    residentialAddress: "",
    city: "",
    state: "",
    zipCode: "",
    employerName: "",
    employerAddress: "",
    jobTitle: "",
    annualIncome: "",
    employmentStartDate: "",
    taxFilingStatus: "Single",
    taxYear: String(new Date().getFullYear() - 1),
    adjustedGrossIncome: "",
    federalTaxPaid: "",
    taxRefundAmountExpected: "",
    tin: "",
    irsFilingConfirmationNumber: "",
    bankName: "",
    accountHolderName: defaultName ?? "",
    accountNumber: "",
    routingNumber: "",
    governmentId: "",
    taxReturnDocument: "",
    w2Form: "",
    proofOfAddress: "",
    declarationAccepted: false,
  });

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      annualIncome: Number(form.annualIncome),
      adjustedGrossIncome: Number(form.adjustedGrossIncome),
      federalTaxPaid: Number(form.federalTaxPaid),
      taxRefundAmountExpected: Number(form.taxRefundAmountExpected),
      declarationAccepted: form.declarationAccepted ? true : undefined,
    });
  };

  const section = (title: string, children: React.ReactNode) => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-primary border-b border-white/10 pb-2">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl brand-gradient-bg flex items-center justify-center shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Tax Refund Verification Form</h2>
          <p className="text-sm text-text-secondary mt-1">
            Complete this secure form before accessing loan products. All sensitive data is encrypted.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {section(
          "Personal Information",
          <>
            <Input label="Full Legal Name" value={form.fullLegalName} onChange={(e) => set("fullLegalName", e.target.value)} required />
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} required />
            <Input label="Social Security Number" placeholder="XXX-XX-XXXX" value={form.ssn} onChange={(e) => set("ssn", e.target.value)} required />
            <Input label="Phone Number" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
            <Input label="Email Address" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required className="sm:col-span-2" />
            <Input label="Residential Address" value={form.residentialAddress} onChange={(e) => set("residentialAddress", e.target.value)} required className="sm:col-span-2" />
            <Input label="City" value={form.city} onChange={(e) => set("city", e.target.value)} required />
            <Input label="State" value={form.state} onChange={(e) => set("state", e.target.value)} required />
            <Input label="ZIP Code" value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} required />
          </>
        )}

        {section(
          "Employment Information",
          <>
            <Input label="Employer Name" value={form.employerName} onChange={(e) => set("employerName", e.target.value)} required />
            <Input label="Job Title" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} required />
            <Input label="Employer Address" value={form.employerAddress} onChange={(e) => set("employerAddress", e.target.value)} required className="sm:col-span-2" />
            <Input label="Annual Income ($)" type="number" min="0" step="0.01" value={form.annualIncome} onChange={(e) => set("annualIncome", e.target.value)} required />
            <Input label="Employment Start Date" type="date" value={form.employmentStartDate} onChange={(e) => set("employmentStartDate", e.target.value)} required />
          </>
        )}

        {section(
          "Tax Information",
          <>
            <label className="block sm:col-span-1">
              <span className="text-sm text-text-secondary mb-1.5 block">Tax Filing Status</span>
              <select className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-text-primary" value={form.taxFilingStatus} onChange={(e) => set("taxFilingStatus", e.target.value)}>
                {["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </label>
            <Input label="Tax Year" value={form.taxYear} onChange={(e) => set("taxYear", e.target.value)} required />
            <Input label="Adjusted Gross Income ($)" type="number" min="0" value={form.adjustedGrossIncome} onChange={(e) => set("adjustedGrossIncome", e.target.value)} required />
            <Input label="Federal Tax Paid ($)" type="number" min="0" value={form.federalTaxPaid} onChange={(e) => set("federalTaxPaid", e.target.value)} required />
            <Input label="Expected Tax Refund ($)" type="number" min="0" value={form.taxRefundAmountExpected} onChange={(e) => set("taxRefundAmountExpected", e.target.value)} required />
            <Input label="Tax Identification Number (TIN)" value={form.tin} onChange={(e) => set("tin", e.target.value)} required />
            <Input label="IRS Filing Confirmation Number" value={form.irsFilingConfirmationNumber} onChange={(e) => set("irsFilingConfirmationNumber", e.target.value)} required className="sm:col-span-2" />
          </>
        )}

        {section(
          "Banking Information",
          <>
            <Input label="Bank Name" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} required />
            <Input label="Account Holder Name" value={form.accountHolderName} onChange={(e) => set("accountHolderName", e.target.value)} required />
            <Input label="Account Number" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} required />
            <Input label="Routing Number" value={form.routingNumber} onChange={(e) => set("routingNumber", e.target.value)} required maxLength={9} />
          </>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-white/10 pb-2">Document Uploads</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <FileField label="Government ID" required onFile={(v) => set("governmentId", v)} />
            <FileField label="Tax Return Document" required onFile={(v) => set("taxReturnDocument", v)} />
            <FileField label="W-2 Form" required onFile={(v) => set("w2Form", v)} />
            <FileField label="Proof of Address" required onFile={(v) => set("proofOfAddress", v)} />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.declarationAccepted}
            onChange={(e) => set("declarationAccepted", e.target.checked)}
            className="mt-1 rounded border-white/20"
          />
          <span className="text-sm text-text-secondary">
            I certify that all information provided is accurate and complete.
          </span>
        </label>

        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Tax Refund Verification"}
        </Button>
      </form>
    </Card>
  );
}
