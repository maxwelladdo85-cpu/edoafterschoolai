import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Local feature-phone simulator. Posts to /api/public/ussd exactly the way
// an aggregator like Africa's Talking would, so you can test the menu tree
// in the browser without an account, shortcode, or SMS credit.
export function UssdSimulator() {
  const [phone, setPhone] = useState("08031234567");
  const [sessionId, setSessionId] = useState(() => `sim-${Date.now()}`);
  const [text, setText] = useState(""); // running "1*2*1234" string
  const [screen, setScreen] = useState<string>("Press DIAL to start *384*1#");
  const [ended, setEnded] = useState(true);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");

  const isCon = useMemo(() => screen.startsWith("CON "), [screen]);
  const body = useMemo(() => screen.replace(/^(CON |END )/, ""), [screen]);

  async function post(nextText: string) {
    setBusy(true);
    try {
      const form = new URLSearchParams();
      form.set("sessionId", sessionId);
      form.set("phoneNumber", phone);
      form.set("serviceCode", "*384*1#");
      form.set("text", nextText);
      const res = await fetch("/api/public/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const t = await res.text();
      setScreen(t);
      setText(nextText);
      setEnded(t.startsWith("END "));
    } catch (e: any) {
      setScreen(`END Error: ${e.message || e}`);
      setEnded(true);
    } finally {
      setBusy(false);
    }
  }

  function dial() {
    const fresh = `sim-${Date.now()}`;
    setSessionId(fresh);
    setText("");
    setInput("");
    setEnded(false);
    // First request has empty text — shows root menu.
    setTimeout(() => post(""), 0);
  }

  function send() {
    if (!input.trim()) return;
    const next = text ? `${text}*${input.trim()}` : input.trim();
    setInput("");
    post(next);
  }

  function cancel() {
    setScreen("END Cancelled");
    setEnded(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>USSD Simulator (test in browser)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          A fake feature phone. It calls the real <code>/api/public/ussd</code> endpoint,
          so any learner you have linked + given a PIN can be tested end-to-end. No
          aggregator account needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Caller phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={dial} disabled={busy}>
            DIAL *384*1#
          </Button>
        </div>

        <div className="mx-auto max-w-xs rounded-3xl border-4 border-neutral-800 bg-neutral-900 p-3 shadow-inner">
          <div className="rounded-md bg-green-950/40 text-green-200 font-mono text-sm p-3 min-h-[180px] whitespace-pre-wrap">
            {body}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              className="bg-neutral-800 text-green-200 border-neutral-700"
              placeholder={ended ? "Session ended" : isCon ? "Type reply…" : ""}
              value={input}
              disabled={ended || busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <Button size="sm" onClick={send} disabled={ended || busy || !input.trim()}>
              Send
            </Button>
            <Button size="sm" variant="destructive" onClick={cancel} disabled={ended}>
              End
            </Button>
          </div>
          <div className="mt-2 text-[10px] text-neutral-500 font-mono break-all">
            text: {text || "(empty)"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
