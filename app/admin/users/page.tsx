"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminRole, AdminUserPublic } from "@/lib/admin-users";
import { displayDateTime } from "@/lib/mockData";

type SessionInfo = {
  email: string | null;
  role?: AdminRole;
};

type MailInfo = {
  ok: boolean;
  mode: "resend" | "log";
  error?: string;
};

export default function AdminUsersPage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [users, setUsers] = useState<AdminUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserPublic | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("officer");
  const [active, setActive] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isAdmin = session?.role === "administrator";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessRes = await fetch("/api/admin/session", { credentials: "include" });
      const sess = (await sessRes.json()) as SessionInfo & { configured?: boolean };
      setSession({ email: sess.email ?? null, role: sess.role });

      if (sess.role !== "administrator") {
        setUsers([]);
        setError("Only administrators can manage admin users.");
        return;
      }

      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = (await res.json()) as { users?: AdminUserPublic[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load users");
        return;
      }
      setUsers(data.users ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setEmail("");
    setName("");
    setRole("officer");
    setActive(true);
    setMustChangePassword(true);
    setFormError(null);
    setNotice(null);
    setOpen(true);
  }

  function openEdit(user: AdminUserPublic) {
    setEditing(user);
    setEmail(user.email);
    setName(user.name);
    setRole(user.role);
    setActive(user.active);
    setMustChangePassword(user.mustChangePassword);
    setFormError(null);
    setNotice(null);
    setOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/users/${editing.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            role,
            active,
            mustChangePassword,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          emailNotification?: MailInfo | null;
          temporaryPassword?: string;
        };
        if (!res.ok) {
          setFormError(data.error ?? "Update failed");
          return;
        }
        setNotice(formatMailNotice(data.emailNotification, data.temporaryPassword, "updated"));
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email,
            name,
            role,
            active,
            mustChangePassword,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          emailNotification?: MailInfo;
          temporaryPassword?: string;
        };
        if (!res.ok) {
          setFormError(data.error ?? "Create failed");
          return;
        }
        setNotice(formatMailNotice(data.emailNotification, data.temporaryPassword, "created"));
      }
      setOpen(false);
      await load();
    } catch {
      setFormError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(user: AdminUserPublic) {
    if (!window.confirm(`Remove admin access for ${user.email}?`)) return;
    setNotice(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Soft Launch admin accounts, roles, and password-change prompts.
          </p>
        </div>
        {isAdmin && (
          <Button type="button" onClick={openCreate}>
            Add admin user
          </Button>
        )}
      </div>

      {notice && (
        <p className="mt-4 rounded-md border border-brand-orange/30 bg-accent px-3 py-2 text-sm text-brand-ink">
          {notice}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-4">
        <AdminTable>
          <TableHeader className="sticky top-0 z-10 bg-white shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No admin users yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || "—"}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>{user.active ? "Active" : "Disabled"}</TableCell>
                  <TableCell>
                    {user.mustChangePassword ? "Change at next sign-in" : "OK"}
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? displayDateTime(user.lastLoginAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void onDelete(user)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </AdminTable>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit admin user" : "Add admin user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update role and password-change requirements. Checking the box emails a temporary password."
                : "Creates the account, emails a temporary password, and can require a change at next sign-in."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={Boolean(editing)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={active}
                onCheckedChange={(v) => setActive(v === true)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-brand-ink">Active</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Disabled users cannot sign in.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={mustChangePassword}
                onCheckedChange={(v) => setMustChangePassword(v === true)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-brand-ink">
                  Ask for a password change at the next sign-in
                </span>
                <span className="mt-0.5 block text-muted-foreground">
                  The user receives an email notification
                  {editing ? " with a temporary password when this is newly enabled." : "."}
                </span>
              </span>
            </label>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create & notify"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatMailNotice(
  mail: MailInfo | null | undefined,
  temporaryPassword: string | undefined,
  action: "created" | "updated"
): string | null {
  if (!mail && !temporaryPassword) {
    return action === "created" ? "User created." : "User updated.";
  }
  if (!mail) return "Saved.";
  if (mail.mode === "resend" && mail.ok) {
    return "Saved. Email notification sent.";
  }
  if (mail.mode === "resend" && !mail.ok) {
    return `Saved, but email failed (${mail.error ?? "unknown"}).${
      temporaryPassword ? ` Temporary password: ${temporaryPassword}` : ""
    }`;
  }
  // log mode — Resend not configured
  if (temporaryPassword) {
    return `Saved. Email logged locally (set RESEND_API_KEY to send). Temporary password: ${temporaryPassword}`;
  }
  return "Saved. Email logged locally (set RESEND_API_KEY to send).";
}
