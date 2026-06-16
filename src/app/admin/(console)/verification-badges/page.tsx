"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { History, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminStatGrid,
  AdminStatCard,
  AdminFormPanel,
  AdminToolbar,
  AdminSearchField,
  AdminFilterTabs,
  AdminDataCard,
  AdminMobileList,
  AdminMobileCard,
  AdminSplitLayout,
} from "@/components/admin/AdminUi";
import AdminFetchState from "@/components/admin/AdminFetchState";
import { clearAdminFetchCacheByPrefix, useAdminFetch } from "@/hooks/use-admin-fetch";
import UserDisplayName from "@/components/ui/UserDisplayName";
import VerificationBadge from "@/components/ui/VerificationBadge";
import {
  getVerificationBadgeDescription,
  getVerificationBadgeLabel,
  getVerificationBadgeShortLabel,
  hasVerificationBadge,
  type VerificationBadgeType,
} from "@/lib/verification-badge";
import type {
  VerificationBadgeHistoryRow,
  VerificationBadgeStats,
  VerificationBadgeUserRow,
} from "@/lib/verification-badge-service";
import { cn } from "@/lib/utils";

type Payload = {
  users: VerificationBadgeUserRow[];
  history: VerificationBadgeHistoryRow[];
  stats: VerificationBadgeStats;
  partialError?: string;
};

const ASSIGNABLE_BADGES: VerificationBadgeType[] = ["STANDARD", "BUSINESS", "GOLD"];

function UserBadgeControls({
  user,
  assigning,
  onAssign,
}: {
  user: VerificationBadgeUserRow;
  assigning: string | null;
  onAssign: (userId: string, badge: VerificationBadgeType) => void;
}) {
  const busy = assigning === user.id;
  const current = user.verificationBadge;

  return (
    <div className="vb-admin-actions">
      <div className="vb-admin-current">
        {hasVerificationBadge(current) ? (
          <>
            <VerificationBadge type={current} size="sm" />
            <span>{getVerificationBadgeLabel(current)}</span>
          </>
        ) : (
          <span className="vb-admin-current-none">No badge</span>
        )}
      </div>

      <select
        className="admin-input vb-admin-assign-select text-xs py-2"
        value=""
        disabled={busy}
        onChange={(e) => {
          const next = e.target.value as VerificationBadgeType;
          if (next) onAssign(user.id, next);
          e.target.value = "";
        }}
      >
        <option value="">Change badge…</option>
        {ASSIGNABLE_BADGES.map((badge) => (
          <option key={badge} value={badge} disabled={current === badge}>
            Assign {getVerificationBadgeShortLabel(badge)}
          </option>
        ))}
      </select>

      {hasVerificationBadge(current) && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAssign(user.id, "NONE")}
          className="admin-btn-ghost text-xs py-2 px-3 inline-flex items-center gap-1.5 text-red-400 border border-red-500/25"
        >
          <UserMinus size={14} />
          {busy ? "Removing…" : "Remove"}
        </button>
      )}
    </div>
  );
}

export default function AdminVerificationBadgesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [quickEmail, setQuickEmail] = useState("");
  const [quickBadge, setQuickBadge] = useState<VerificationBadgeType>("GOLD");
  const [quickAssigning, setQuickAssigning] = useState(false);
  const partialErrorShown = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (badgeFilter && !(verifiedOnly && badgeFilter === "NONE")) {
      params.set("badgeType", badgeFilter);
    }
    if (verifiedOnly) params.set("verifiedOnly", "true");
    if (selectedUserId) params.set("historyUserId", selectedUserId);
    const q = params.toString();
    return `/api/admin/verification-badges${q ? `?${q}` : ""}`;
  }, [debouncedSearch, badgeFilter, verifiedOnly, selectedUserId]);

  const { data, error, loading, refresh, lastUpdated } = useAdminFetch<Payload>(url, {
    pollMs: 30_000,
  });

  const users = data?.users ?? [];
  const history = data?.history ?? [];
  const stats = data?.stats ?? { totalUsers: 0, verifiedUsers: 0 };

  useEffect(() => {
    if (data?.partialError && !partialErrorShown.current) {
      partialErrorShown.current = true;
      toast.error(data.partialError);
    }
  }, [data?.partialError]);

  useEffect(() => {
    if (verifiedOnly && badgeFilter === "NONE") {
      setBadgeFilter("");
    }
  }, [verifiedOnly, badgeFilter]);

  const assignBadge = async (userId: string, badgeType: VerificationBadgeType) => {
    setAssigning(userId);
    try {
      const res = await fetch(`/api/admin/verification-badges/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update badge");
      toast.success(
        badgeType === "NONE"
          ? "Verification badge removed"
          : `${getVerificationBadgeLabel(badgeType)} badge assigned`
      );
      clearAdminFetchCacheByPrefix("/api/admin/verification-badges");
      refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update badge");
      return false;
    } finally {
      setAssigning(null);
    }
  };

  const quickAssignByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = quickEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Enter a user email address");
      return;
    }

    setQuickAssigning(true);
    try {
      const lookup = await fetch(`/api/admin/users?search=${encodeURIComponent(email)}`, {
        credentials: "include",
      });
      const lookupJson = await lookup.json();
      if (!lookup.ok) throw new Error(lookupJson.error || "Could not find user");

      const match =
        (lookupJson.users as { id: string; email: string }[] | undefined)?.find(
          (u) => u.email?.toLowerCase() === email
        ) ?? (lookupJson.users as { id: string; email: string }[] | undefined)?.[0];

      if (!match?.id) throw new Error("No user found with that email");

      const ok = await assignBadge(match.id, quickBadge);
      if (ok) {
        setQuickEmail("");
        setSearch(email);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign badge");
    } finally {
      setQuickAssigning(false);
    }
  };

  const filterTabValue = verifiedOnly && !badgeFilter ? "verified" : badgeFilter || "all";

  return (
    <AdminPage>
      <AdminPageHeader
        title="Verification Badges"
        description="Assign social-style verification rosettes to customers — shown on their dashboard, profile, and transfers"
        action={
          <AdminRefreshButton
            onClick={() => {
              clearAdminFetchCacheByPrefix("/api/admin/verification-badges");
              refresh();
            }}
          />
        }
      />

      <AdminStatGrid cols={3}>
        <AdminStatCard
          label="Verified users"
          value={stats.verifiedUsers}
          sub={`of ${stats.totalUsers} registered customers`}
          accent="green"
        />
        <AdminStatCard label="Badge tiers" value={3} sub="Black · Green · Gold" accent="gold" />
        <AdminStatCard
          label="Recent changes"
          value={history.length}
          sub={selectedUserId ? "Filtered to selected user" : "Audit trail on the right"}
        />
      </AdminStatGrid>

      <section className="vb-admin-types" aria-label="Badge types">
        {ASSIGNABLE_BADGES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setVerifiedOnly(false);
              setBadgeFilter((current) => (current === type ? "" : type));
            }}
            className={cn("vb-admin-type-card", badgeFilter === type && "vb-admin-type-card-active")}
          >
            <div className="vb-admin-type-head">
              <VerificationBadge type={type} size="lg" />
              <span className="vb-admin-type-title">{getVerificationBadgeLabel(type)}</span>
            </div>
            <p className="vb-admin-type-desc">{getVerificationBadgeDescription(type)}</p>
          </button>
        ))}
      </section>

      <AdminFormPanel
        title="Quick assign"
        description="Find any customer by email and grant a verification badge instantly."
      >
        <form onSubmit={quickAssignByEmail} className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-[var(--admin-muted)] mb-1.5">Customer email</label>
              <input
                type="email"
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                placeholder="user@example.com"
                className="admin-input w-full"
                required
              />
            </div>
            <button
              type="submit"
              disabled={quickAssigning}
              className="admin-btn-primary px-6 py-2.5 text-sm min-h-[42px] inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <UserPlus size={16} />
              {quickAssigning ? "Assigning…" : "Assign badge"}
            </button>
          </div>

          <div>
            <p className="text-xs text-[var(--admin-muted)] mb-2">Select badge to assign</p>
            <div className="vb-admin-picker">
              {ASSIGNABLE_BADGES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setQuickBadge(type)}
                  className={cn("vb-admin-picker-btn", quickBadge === type && "vb-admin-picker-btn-active")}
                >
                  <VerificationBadge type={type} size="sm" />
                  {getVerificationBadgeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </form>
      </AdminFormPanel>

      <AdminToolbar>
        <AdminSearchField value={search} onChange={setSearch} placeholder="Search by name or email…" />
      </AdminToolbar>

      <AdminFilterTabs
        value={filterTabValue}
        onChange={(id) => {
          if (id === "verified") {
            setVerifiedOnly(true);
            setBadgeFilter("");
            return;
          }
          setVerifiedOnly(false);
          setBadgeFilter(id === "all" ? "" : id);
        }}
        tabs={[
          { id: "all", label: "All users" },
          { id: "verified", label: "Verified only", count: stats.verifiedUsers },
          ...ASSIGNABLE_BADGES.map((type) => ({
            id: type,
            label: getVerificationBadgeShortLabel(type),
          })),
          { id: "NONE", label: "Unverified" },
        ]}
      />

      <AdminFetchState
        loading={loading}
        error={error}
        onRetry={() => {
          clearAdminFetchCacheByPrefix("/api/admin/verification-badges");
          refresh();
        }}
        lastUpdated={lastUpdated}
        isEmpty={!loading && !error && users.length === 0}
        emptyMessage={
          verifiedOnly || badgeFilter || debouncedSearch
            ? "No users match your filters."
            : "No registered customers found."
        }
      >
        <AdminSplitLayout
          main={
            <AdminDataCard noPadding className="min-h-[360px]">
              <AdminMobileList className="lg:hidden">
                {users.map((user) => (
                  <AdminMobileCard key={user.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedUserId((current) => (current === user.id ? null : user.id))
                      }
                      className="text-left w-full mb-3"
                    >
                      <UserDisplayName
                        name={user.name}
                        verificationBadge={user.verificationBadge}
                        nameClassName="text-sm font-semibold"
                      />
                      <p className="text-xs text-[var(--admin-muted)] truncate">{user.email}</p>
                    </button>
                    <UserBadgeControls user={user} assigning={assigning} onAssign={assignBadge} />
                  </AdminMobileCard>
                ))}
              </AdminMobileList>

              <div className="hidden lg:block">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "vb-admin-user-row",
                      selectedUserId === user.id && "vb-admin-user-row-selected"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedUserId((current) => (current === user.id ? null : user.id))
                      }
                      className="text-left min-w-0 flex-1"
                      title="Filter history to this user"
                    >
                      <UserDisplayName
                        name={user.name}
                        verificationBadge={user.verificationBadge}
                        nameClassName="text-sm font-semibold"
                      />
                      <p className="text-xs text-[var(--admin-muted)] truncate mt-0.5">{user.email}</p>
                      {user.verificationBadgeAt && (
                        <p className="text-[10px] text-[var(--admin-muted)] mt-1">
                          Assigned {new Date(user.verificationBadgeAt).toLocaleString()}
                          {user.grantedBy ? ` · by ${user.grantedBy.name}` : ""}
                        </p>
                      )}
                    </button>
                    <UserBadgeControls user={user} assigning={assigning} onAssign={assignBadge} />
                  </div>
                ))}
              </div>
            </AdminDataCard>
          }
          side={
            <AdminFormPanel title="Verification history" className="min-h-[360px]">
              <div className="flex items-center justify-between gap-2 -mt-1 mb-3">
                <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                  <History size={15} />
                  <span className="text-xs">Recent badge changes</span>
                </div>
                {selectedUserId && (
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(null)}
                    className="admin-btn-ghost text-[10px] px-2 py-1 inline-flex items-center gap-1"
                  >
                    <X size={12} /> Show all
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5 admin-scroll-card max-h-[28rem] -mx-1 px-1">
                {history.length === 0 ? (
                  <p className="text-sm text-[var(--admin-muted)]">
                    {selectedUserId
                      ? "No verification history for this user yet."
                      : "No verification history yet."}
                  </p>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className="vb-admin-history-item">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <UserDisplayName
                            name={entry.userName}
                            verificationBadge={entry.badgeType}
                            nameClassName="text-sm font-medium"
                            badgeSize="xs"
                          />
                          <p className="text-[10px] text-[var(--admin-muted)] mt-0.5 truncate">
                            {entry.userEmail}
                          </p>
                        </div>
                        <span className="vb-admin-history-action shrink-0">{entry.action}</span>
                      </div>
                      <p className="text-xs text-[var(--admin-muted)] mt-2">
                        {entry.previousBadge
                          ? `${getVerificationBadgeLabel(entry.previousBadge)} → ${getVerificationBadgeLabel(entry.badgeType)}`
                          : getVerificationBadgeLabel(entry.badgeType)}
                      </p>
                      <p className="text-[10px] text-[var(--admin-muted)] mt-1">
                        {new Date(entry.createdAt).toLocaleString()} · {entry.admin.name}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </AdminFormPanel>
          }
        />
      </AdminFetchState>
    </AdminPage>
  );
}
