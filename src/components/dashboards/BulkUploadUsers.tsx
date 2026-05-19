import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bulkCreateUsers } from "@/lib/bulk-users.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ParsedRow = {
  email: string; full_name: string; role: string;
  class_level?: string; lga?: string; password?: string;
  _error?: string;
};

type ResultRow = {
  row: number; email: string; full_name: string; role: string;
  ok: boolean; password?: string; error?: string;
};

const TEMPLATE_HEADERS = ["email", "full_name", "role", "class_level", "lga", "password"];
const TEMPLATE_CSV =
  TEMPLATE_HEADERS.join(",") + "\n" +
  "jane@example.com,Jane Doe,learner,Primary 4,Oredo,\n" +
  "john@example.com,John Smith,teacher,,Ikpoba-Okha,\n";

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ["File is empty"] };

  const splitLine = (line: string) => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") { out.push(cur); cur = ""; }
        else cur += c;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => headers.indexOf(name);
  const iEmail = idx("email"), iName = idx("full_name"), iRole = idx("role");
  if (iEmail < 0 || iName < 0 || iRole < 0) {
    errors.push("CSV must have headers: email, full_name, role (optional: class_level, lga, password)");
    return { rows: [], errors };
  }
  const iClass = idx("class_level"), iLga = idx("lga"), iPwd = idx("password");

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const row: ParsedRow = {
      email: cells[iEmail] ?? "",
      full_name: cells[iName] ?? "",
      role: (cells[iRole] ?? "").toLowerCase(),
      class_level: iClass >= 0 ? cells[iClass] : undefined,
      lga: iLga >= 0 ? cells[iLga] : undefined,
      password: iPwd >= 0 ? cells[iPwd] : undefined,
    };
    if (!row.email || !/^\S+@\S+\.\S+$/.test(row.email)) row._error = "Invalid email";
    else if (!row.full_name) row._error = "Missing name";
    else if (row.role !== "learner" && row.role !== "teacher") row._error = "Role must be learner or teacher";
    rows.push(row);
  }
  return { rows, errors };
}

function downloadCsv(filename: string, text: string) {
  const blob = new Blob([`\ufeff${text}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function BulkUploadUsers({ onDone }: { onDone?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const bulkFn = useServerFn(bulkCreateUsers);

  const handleFile = async (file: File) => {
    setResults(null);
    const text = await file.text();
    const { rows: parsed, errors } = parseCSV(text);
    if (errors.length) { toast.error(errors[0]); return; }
    if (parsed.length === 0) { toast.error("No data rows found"); return; }
    if (parsed.length > 500) { toast.error("Maximum 500 rows per upload"); return; }
    setRows(parsed);
    toast.success(`Parsed ${parsed.length} row(s)`);
  };

  const submit = async () => {
    const valid = rows.filter((r) => !r._error);
    if (valid.length === 0) { toast.error("No valid rows to upload"); return; }
    setBusy(true);
    try {
      const res = await bulkFn({ data: { rows: valid.map((r) => ({
        email: r.email, full_name: r.full_name, role: r.role as "learner" | "teacher",
        class_level: r.class_level, lga: r.lga, password: r.password,
      })) } });
      setResults(res.results as ResultRow[]);
      toast.success(`Created ${res.created} user(s)${res.failed ? `, ${res.failed} failed` : ""}`);
      onDone?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk upload failed");
    } finally {
      setBusy(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;
    const headers = ["row", "email", "full_name", "role", "ok", "password", "error"];
    const escape = (v: any) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...results.map((r) => headers.map((h) => escape((r as any)[h])).join(","))].join("\n");
    downloadCsv(`bulk-upload-results-${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  const reset = () => { setRows([]); setResults(null); if (fileRef.current) fileRef.current.value = ""; };

  const validCount = rows.filter((r) => !r._error).length;
  const errorCount = rows.length - validCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Bulk upload learners &amp; teachers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload a CSV to onboard multiple users at once. Required columns:{" "}
          <span className="font-mono">email, full_name, role</span>. Optional:{" "}
          <span className="font-mono">class_level, lga, password</span>. Role must be{" "}
          <span className="font-mono">learner</span> or <span className="font-mono">teacher</span>.
          If password is blank a secure one is generated for you and returned in the results CSV.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCsv("bulk-users-template.csv", TEMPLATE_CSV)}>
            <Download className="h-4 w-4 mr-2" /> Download template
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload className="h-4 w-4 mr-2" /> Choose CSV file
          </Button>
          {rows.length > 0 && (
            <>
              <Button size="sm" onClick={submit} disabled={busy || validCount === 0}>
                {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : <>Create {validCount} user(s)</>}
              </Button>
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>Clear</Button>
            </>
          )}
          <input
            ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {rows.length > 0 && !results && (
          <div className="space-y-2">
            <div className="flex gap-2 text-sm">
              <Badge variant="default">{validCount} valid</Badge>
              {errorCount > 0 && <Badge variant="destructive">{errorCount} invalid</Badge>}
            </div>
            <div className="rounded-md border max-h-72 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>LGA</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{r.email}</TableCell>
                      <TableCell>{r.full_name}</TableCell>
                      <TableCell><Badge variant={r.role === "teacher" ? "default" : "secondary"}>{r.role}</Badge></TableCell>
                      <TableCell>{r.class_level ?? "—"}</TableCell>
                      <TableCell>{r.lga ?? "—"}</TableCell>
                      <TableCell>
                        {r._error
                          ? <span className="text-destructive text-xs">{r._error}</span>
                          : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-2 text-sm">
                <Badge variant="default">{results.filter((r) => r.ok).length} created</Badge>
                {results.some((r) => !r.ok) && (
                  <Badge variant="destructive">{results.filter((r) => !r.ok).length} failed</Badge>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={downloadResults}>
                <Download className="h-4 w-4 mr-2" /> Download results (incl. passwords)
              </Button>
            </div>
            <div className="rounded-md border max-h-72 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Temp password / Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.row}>
                      <TableCell className="text-muted-foreground">{r.row}</TableCell>
                      <TableCell className="font-mono text-xs">{r.email}</TableCell>
                      <TableCell>{r.role}</TableCell>
                      <TableCell>
                        {r.ok
                          ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs"><CheckCircle2 className="h-3 w-3" />Created</span>
                          : <span className="inline-flex items-center gap-1 text-destructive text-xs"><AlertCircle className="h-3 w-3" />Failed</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.ok ? r.password : r.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Passwords are shown once. Download the results CSV and share credentials securely — users should change their password after first sign-in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
