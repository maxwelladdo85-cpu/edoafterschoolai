import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bulkCreateUsers } from "@/lib/bulk-users.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type ParsedRow = {
  email: string; full_name: string; role: string;
  class_level?: string; lga?: string; password?: string;
  parent_phone?: string; school_id?: string; school_type?: string; date_of_birth?: string;
  oracle_id?: string; school_name?: string;
  _error?: string;
};

type ResultRow = {
  row: number; email: string; full_name: string; role: string;
  ok: boolean; password?: string; error?: string;
};

const LEARNER_HEADERS = ["email", "full_name", "class_level", "lga", "password"];
const TEACHER_HEADERS = ["full_name", "phone_number", "email", "lga", "school_type", "class_taught", "oracle_id", "school_name", "date_of_birth", "password"];

function makeTemplateCSV(headers: string[], rows: string[]) {
  return headers.join(",") + "\n" + rows.join("\n") + "\n";
}

const LEARNER_TEMPLATE_CSV = makeTemplateCSV(LEARNER_HEADERS, [
  "jane@example.com,Jane Doe,Primary 4,Oredo,",
  "chidi@example.com,Chidi Nwosu,Primary 2,Egor,",
]);

const TEACHER_TEMPLATE_CSV = makeTemplateCSV(TEACHER_HEADERS, [
  "John Smith,08012345678,john@example.com,Ikpoba-Okha,primary,Primary 4,T1000,Ihogbe Primary School,1985-04-12,",
  "Mary Okafor,08087654321,mary@example.com,Oredo,primary,JSS 1,T1001,Emotan Model Primary School,1990-08-22,",
]);


function parseRoleCSV(text: string, role: "learner" | "teacher"): { rows: ParsedRow[]; errors: string[] } {
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
  const iEmail = idx("email"), iName = idx("full_name");
  if (iEmail < 0 || iName < 0) {
    errors.push(`CSV must have headers: email, full_name${role === "learner" ? ", class_level" : ""} (optional: lga, password)`);
    return { rows: [], errors };
  }
  const iClass = idx("class_level"), iClassTaught = idx("class_taught"), iLga = idx("lga"), iPwd = idx("password");
  const iPhone = idx("phone_number"), iSchoolId = idx("school_id"), iSchoolType = idx("school_type"), iDob = idx("date_of_birth");
  const iOracle = idx("oracle_id"), iSchoolName = idx("school_name");
  const iClassAny = role === "teacher" && iClassTaught >= 0 ? iClassTaught : iClass;

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const row: ParsedRow = {
      email: cells[iEmail] ?? "",
      full_name: cells[iName] ?? "",
      role,
      class_level: iClassAny >= 0 ? cells[iClassAny] : undefined,
      lga: iLga >= 0 ? cells[iLga] : undefined,
      password: iPwd >= 0 ? cells[iPwd] : undefined,
      parent_phone: iPhone >= 0 ? cells[iPhone] : undefined,
      school_id: iSchoolId >= 0 ? cells[iSchoolId] : undefined,
      school_type: iSchoolType >= 0 ? cells[iSchoolType] : undefined,
      date_of_birth: iDob >= 0 ? cells[iDob] : undefined,
      oracle_id: iOracle >= 0 ? cells[iOracle] : undefined,
      school_name: iSchoolName >= 0 ? cells[iSchoolName] : undefined,
    };
    if (!row.email || /^\S+@\S+\.\S+$/.test(row.email) === false) row._error = "Invalid email";
    else if (!row.full_name) row._error = "Missing name";
    else if (role === "learner" && iClass >= 0 && !row.class_level) row._error = "Missing class_level";
    else if (role === "teacher" && !row.oracle_id) row._error = "Missing oracle_id";
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

function BulkUploadCard({
  role,
  title,
  icon,
  templateCSV,
  templateFilename,
  description,
  headersLabel,
  onDone,
}: {
  role: "learner" | "teacher";
  title: string;
  icon: React.ReactNode;
  templateCSV: string;
  templateFilename: string;
  description: string;
  headersLabel: string;
  onDone?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const bulkFn = useServerFn(bulkCreateUsers);

  const handleFile = async (file: File) => {
    setResults(null);
    const text = await file.text();
    const { rows: parsed, errors } = parseRoleCSV(text, role);
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
        parent_phone: r.parent_phone, school_id: r.school_id, school_type: r.school_type, date_of_birth: r.date_of_birth,
        oracle_id: r.oracle_id, school_name: r.school_name,
      })) } });
      setResults(res.results as ResultRow[]);
      toast.success(`Created ${res.created} ${role}(s)${res.failed ? `, ${res.failed} failed` : ""}`);
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
    downloadCsv(`${role}-upload-results-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const reset = () => { setRows([]); setResults(null); if (fileRef.current) fileRef.current.value = ""; };

  const validCount = rows.filter((r) => !r._error).length;
  const errorCount = rows.length - validCount;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground">
          {description} Required columns:{" "}
          <span className="font-mono">{headersLabel}</span>. Optional:{" "}
          <span className="font-mono">
            {role === "teacher"
              ? "phone_number, lga, school_type, class_taught, school_name, date_of_birth, password"
              : "lga, password"}
          </span>.
          If password is blank a secure one is generated and returned in the results CSV.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCsv(templateFilename, templateCSV)}>
            <Download className="h-4 w-4 mr-2" /> Download template
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload className="h-4 w-4 mr-2" /> Choose CSV file
          </Button>
          {rows.length > 0 && (
            <>
              <Button size="sm" onClick={submit} disabled={busy || validCount === 0}>
                {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : <>Create {validCount} {role}(s)</>}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={submit}
                disabled={busy || validCount === 0}
                title="Push these rows to the database — new accounts will be created and the data will appear in the teachers/admin views across the app."
              >
                {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</> : <><Upload className="h-4 w-4 mr-2" />Update database with this data</>}
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
          <div className="space-y-2 flex-1">
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
                  <TableHead>Class</TableHead>
                  {role === "teacher" && <TableHead>Phone</TableHead>}
                  {role === "teacher" && <TableHead>Oracle ID</TableHead>}
                  {role === "teacher" && <TableHead>School</TableHead>}
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
                      <TableCell>{r.class_level ?? "—"}</TableCell>
                      {role === "teacher" && <TableCell>{r.parent_phone ?? "—"}</TableCell>}
                      {role === "teacher" && <TableCell className="font-mono text-xs">{r.oracle_id ?? "—"}</TableCell>}
                      {role === "teacher" && <TableCell>{r.school_name ?? "—"}</TableCell>}
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
          <div className="space-y-2 flex-1">
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
                    <TableHead>Name</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Temp password / Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.row}>
                      <TableCell className="text-muted-foreground">{r.row}</TableCell>
                      <TableCell className="font-mono text-xs">{r.email}</TableCell>
                      <TableCell>{r.full_name}</TableCell>
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

export function BulkUploadUsers({ onDone }: { onDone?: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BulkUploadCard
        role="teacher"
        title="Bulk upload teachers"
        icon={<Users className="h-4 w-4" />}
        templateCSV={TEACHER_TEMPLATE_CSV}
        templateFilename="bulk-teachers-template.csv"
        description="Upload a CSV to onboard multiple teachers at once."
        headersLabel="full_name, phone_number, email, lga, school_type, class_level, school_id, date_of_birth, password"
        onDone={onDone}
      />
      <BulkUploadCard
        role="learner"
        title="Bulk upload learners"
        icon={<GraduationCap className="h-4 w-4" />}
        templateCSV={LEARNER_TEMPLATE_CSV}
        templateFilename="bulk-learners-template.csv"
        description="Upload a CSV to onboard multiple learners at once."
        headersLabel="email, full_name, class_level"
        onDone={onDone}
      />
    </div>
  );
}
