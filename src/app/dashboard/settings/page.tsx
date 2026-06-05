"use client";

import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        <Card>
          <h2 className="font-semibold text-text-primary mb-6">Profile</h2>
          <div className="space-y-4">
            <Input label="Full Name" defaultValue={session?.user?.name || ""} />
            <Input label="Email" defaultValue={session?.user?.email || ""} disabled />
            <Input label="Phone" placeholder="+1 (555) 000-0000" />
            <Button onClick={() => toast.success("Profile updated")}>Save Changes</Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-text-primary mb-6">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50">
              <div>
                <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                <p className="text-xs text-text-muted">Add an extra layer of security</p>
              </div>
              <Badge variant="default">Not configured</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50">
              <div>
                <p className="text-sm font-medium text-text-primary">Biometric Login</p>
                <p className="text-xs text-text-muted">Use fingerprint or face ID</p>
              </div>
              <Badge variant="default">Disabled</Badge>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-text-primary mb-6">Notifications</h2>
          <div className="space-y-3">
            {["Transaction alerts", "Investment updates", "Security notifications", "Marketing emails"].map((item) => (
              <label key={item} className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-tertiary/30 transition-colors cursor-pointer">
                <span className="text-sm text-text-primary">{item}</span>
                <input type="checkbox" defaultChecked className="rounded accent-accent-gold" />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
