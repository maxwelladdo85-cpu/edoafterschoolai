import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  adminListUssdLearners,
  adminSetUssdAccess,
  adminListSmsLog,
} from "@/lib/admin-ussd.functions";

export const Route = createFileRoute("/admin-ussd")({
  component: AdminUssdPage,
});

type Learner = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  class_level: string | null;
  ussd_enabled: boolean;
  has_pin: boolean;
};

type SmsRow = {
  id: string;
  phone: string;
  body: string;
  purpose: string;
  status: string;
  created_at: string;
};

function AdminUssdPage() {
  const { user, role, loading } = useAuth();
  const listLearners = useServerFn(adminListUssdLearners);
  const setAccess = useServerFn(adminSetUssdAccess);
  const listSms = useServerFn(adminListSmsLog);

  const [learners, setLearners] = useState<Learner[]>([]);
  const [sms, setSms] = useState<SmsRow[]>([]);
  const [newPhone, setNewPhone] = useState<Record<string, string>>({});
  const [newPin, setNewPin] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      const [a, b] = await Promise.all([listLearners(), listSms()]);
      setLearners(a as Learner[]);
      setSms(b as SmsRow[]);
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!loading && role === "admin") refresh();
  }, [loading, role]);

  if (loading) return null;
  if (!user || role !== "admin") {
    return (
      <DashboardShell>
        <p className="p-6">Admins only.</p>
      </DashboardShell>
    );
  }

  async function save(id: string, patch: Parameters<typeof setAccess>[0]["data"]) {
    try {
      await setAccess({ data: patch });
      toast.success("Saved");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">USSD &amp; SMS Access</h1>
            <p className="text-sm text-muted-foreground">
              Manage feature-phone access for learners without internet.
              Shortcode delivery is pending aggregator setup; SMS sends are
              currently logged for review.
            </p>
          </div>
          <Button onClick={refresh} disabled={busy} variant="outline">Refresh</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Learners with phone numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>USSD</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {learners.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No learners have a phone number on file yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {learners.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{l.email}</div>
                      </TableCell>
                      <TableCell>{l.class_level || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{l.phone}</TableCell>
                      <TableCell>
                        <Switch
                          checked={l.ussd_enabled}
                          onCheckedChange={(v) => save(l.id, { userId: l.id, enabled: v })}
                        />
                      </TableCell>
                      <TableCell>
                        {l.has_pin ? <Badge>Set</Badge> : <Badge variant="outline">None</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Input
                            className="w-24"
                            placeholder="4-digit"
                            value={newPin[l.id] || ""}
                            onChange={(e) => setNewPin({ ...newPin, [l.id]: e.target.value })}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const pin = newPin[l.id] || "";
                              save(l.id, { userId: l.id, pin });
                              setNewPin({ ...newPin, [l.id]: "" });
                            }}
                          >
                            Set PIN
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Link a new phone to an existing learner</h3>
              <p className="text-xs text-muted-foreground">
                Enter the learner's user ID (from User Management) and their phone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="learner user id"
                  value={newPhone.__id || ""}
                  onChange={(e) => setNewPhone({ ...newPhone, __id: e.target.value })}
                />
                <Input
                  placeholder="phone e.g. 08031234567"
                  value={newPhone.__ph || ""}
                  onChange={(e) => setNewPhone({ ...newPhone, __ph: e.target.value })}
                />
                <Button
                  onClick={() =>
                    save("", { userId: newPhone.__id || "", phone: newPhone.__ph || "", enabled: true })
                  }
                >
                  Link phone
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent SMS activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Body</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No SMS has been sent yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {sms.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{r.phone}</TableCell>
                      <TableCell>{r.purpose}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "sent" ? "default" : "outline"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md text-xs">{r.body}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
