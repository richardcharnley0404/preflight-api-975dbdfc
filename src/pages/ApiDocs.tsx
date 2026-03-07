import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm font-mono text-foreground">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">{title}</h2>
      {children}
    </section>
  );
}

const BASE_URL = "https://api.preflight-api.com";

const curlSubmit = `curl -X POST ${BASE_URL}/v1/jobs \\
  -H "X-API-Key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "artwork": {
      "url": "https://example.com/artwork.pdf",
      "filename": "business-card.pdf"
    },
    "spec": {
      "units": "mm",
      "pages": [{
        "type": "combined",
        "range": "1",
        "trim": { "width": 90, "height": 55 },
        "bleed": { "left": 3, "right": 3, "top": 3, "bottom": 3 }
      }],
      "min_dpi": 300,
      "colour_space": "CMYK",
      "font_check": true
    }
  }'`;

const jsSubmit = `const response = await fetch("${BASE_URL}/v1/jobs", {
  method: "POST",
  headers: {
    "X-API-Key": "your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    artwork: {
      url: "https://example.com/artwork.pdf",
      filename: "business-card.pdf",
    },
    spec: {
      units: "mm",
      pages: [{
        type: "combined",
        range: "1",
        trim: { width: 90, height: 55 },
        bleed: { left: 3, right: 3, top: 3, bottom: 3 },
      }],
      min_dpi: 300,
      colour_space: "CMYK",
      font_check: true,
    },
  }),
});

const { job_id, status } = await response.json();`;

const curlMultiPage = `curl -X POST ${BASE_URL}/v1/jobs \\
  -H "X-API-Key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "artwork": {
      "url": "https://example.com/perfect-bound-book.pdf",
      "filename": "book-a4.pdf"
    },
    "spec": {
      "units": "mm",
      "pages": [
        {
          "type": "combined",
          "range": "1",
          "trim": { "width": 425, "height": 297 },
          "bleed": { "left": 3, "right": 3, "top": 3, "bottom": 3 },
          "safe_zone": { "left": 10, "right": 10, "top": 10, "bottom": 10 }
        },
        {
          "type": "combined",
          "range": "2-100",
          "trim": { "width": 210, "height": 297 },
          "bleed": { "left": 3, "right": 3, "top": 3, "bottom": 3 },
          "safe_zone": { "left": 5, "right": 5, "top": 5, "bottom": 5 }
        }
      ],
      "min_dpi": 300,
      "colour_space": "CMYK"
    }
  }'`;

const jsMultiPage = `const response = await fetch("${BASE_URL}/v1/jobs", {
  method: "POST",
  headers: {
    "X-API-Key": "your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    artwork: {
      url: "https://example.com/perfect-bound-book.pdf",
      filename: "book-a4.pdf",
    },
    spec: {
      units: "mm",
      pages: [
        {
          type: "combined",
          range: "1",
          trim: { width: 425, height: 297 },
          bleed: { left: 3, right: 3, top: 3, bottom: 3 },
          safe_zone: { left: 10, right: 10, top: 10, bottom: 10 },
        },
        {
          type: "combined",
          range: "2-100",
          trim: { width: 210, height: 297 },
          bleed: { left: 3, right: 3, top: 3, bottom: 3 },
          safe_zone: { left: 5, right: 5, top: 5, bottom: 5 },
        },
      ],
      min_dpi: 300,
      colour_space: "CMYK",
    },
  }),
});

const { job_id } = await response.json();`;

const curlGet = `curl ${BASE_URL}/v1/jobs/{job_id} \\
  -H "X-API-Key: your_api_key"`;

const jsGet = `const response = await fetch("${BASE_URL}/v1/jobs/{job_id}", {
  headers: { "X-API-Key": "your_api_key" },
});

const job = await response.json();
// job.status, job.result, job.checks, job.proof_url`;

const jobResponseExample = `{
  "job_id": "abc-123",
  "status": "completed",
  "result": "fail",
  "filename": "business-card.pdf",
  "submitted_at": "2026-03-07T10:00:00Z",
  "completed_at": "2026-03-07T10:00:02Z",
  "processing_time": "1.8s",
  "checks": [
    { "name": "Trim Size", "status": "pass", "details": "90 x 55 mm — matches spec" },
    { "name": "Bleed", "status": "pass", "details": "3 mm bleed on all sides" },
    { "name": "Resolution", "status": "fail", "details": "Image on page 1 is 150 DPI (min 300)" },
    { "name": "Colour Space", "status": "pass", "details": "CMYK" },
    { "name": "Fonts", "status": "pass", "details": "All fonts embedded" }
  ],
  "proof_url": "https://proof.preflight-api.com/view/abc-123"
}`;

const webhookExample = `{
  "event": "job.completed",
  "job_id": "abc-123",
  "status": "completed",
  "result": "fail",
  "checks": [
    { "name": "Trim Size", "status": "pass", "details": "90 x 55 mm — matches spec" },
    { "name": "Resolution", "status": "fail", "details": "Image on page 1 is 150 DPI (min 300)" }
  ],
  "proof_url": "https://proof.preflight-api.com/view/abc-123",
  "timestamp": "2026-03-07T10:00:02Z"
}`;

const specFieldsTable = [
  { field: "units", type: "string", required: false, desc: '"mm" or "in". Default: "mm"' },
  { field: "pages", type: "PageSpec[]", required: true, desc: "Array of page specifications with trim, bleed, and safe zone" },
  { field: "pages[].type", type: "string", required: true, desc: '"combined", "front", or "back"' },
  { field: "pages[].range", type: "string", required: true, desc: 'Page range, e.g. "1", "1-4", "all"' },
  { field: "pages[].trim", type: "object", required: true, desc: "{ width, height } — finished size" },
  { field: "pages[].bleed", type: "object", required: false, desc: "{ left, right, top, bottom } — bleed margins" },
  { field: "pages[].safe_zone", type: "object", required: false, desc: "{ left, right, top, bottom } — safe zone insets" },
  { field: "page_count.min", type: "integer", required: false, desc: "Minimum page count" },
  { field: "page_count.max", type: "integer", required: false, desc: "Maximum page count" },
  { field: "page_count.must_be_even", type: "boolean", required: false, desc: "Require even page count" },
  { field: "min_dpi", type: "integer", required: false, desc: "Minimum image resolution. Default: 300" },
  { field: "colour_space", type: "string", required: false, desc: '"any", "CMYK", or "RGB". Default: "any"' },
  { field: "font_check", type: "boolean", required: false, desc: "Check all fonts are embedded. Default: true" },
  { field: "dimension_tolerance_mm", type: "number", required: false, desc: "Allowed deviation from trim size. Default: 0.5" },
];

const errorCodes = [
  { code: "400", meaning: "Bad Request", desc: "Missing required fields or invalid values" },
  { code: "401", meaning: "Unauthorized", desc: "Missing or invalid API key" },
  { code: "404", meaning: "Not Found", desc: "Job ID does not exist" },
  { code: "429", meaning: "Too Many Requests", desc: "Rate limit exceeded — slow down" },
  { code: "500", meaning: "Internal Server Error", desc: "Something went wrong on our end" },
];

export default function ApiDocs() {
  const tocItems = [
    { id: "quick-start", label: "Quick Start" },
    { id: "authentication", label: "Authentication" },
    { id: "submit-job", label: "Submit a Job" },
    { id: "multi-page-specs", label: "Multi-Page Specs" },
    { id: "get-result", label: "Get Job Result" },
    { id: "webhooks", label: "Webhooks" },
    { id: "proof-viewer", label: "Proof Viewer" },
    { id: "errors", label: "Error Codes" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Integrate PrintPreflight into your print workflow
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/api-docs.json" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            OpenAPI Spec
          </a>
        </Button>
      </div>

      {/* Table of contents */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm text-primary hover:underline"
              >
                {item.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Section id="quick-start" title="Quick Start">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-3">
              <Badge className="shrink-0">1</Badge>
              <div>
                <p className="font-medium text-foreground">Get your API key</p>
                <p className="text-sm text-muted-foreground">
                  Create an API key from the <a href="/dashboard/api-keys" className="text-primary hover:underline">API Keys</a> page.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0">2</Badge>
              <div>
                <p className="font-medium text-foreground">Submit a preflight job</p>
                <p className="text-sm text-muted-foreground">
                  POST your artwork URL and print spec to <code className="bg-muted px-1 rounded text-xs">/v1/jobs</code>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge className="shrink-0">3</Badge>
              <div>
                <p className="font-medium text-foreground">Get results</p>
                <p className="text-sm text-muted-foreground">
                  Poll the job status or receive results via webhook. Each check returns pass/fail with details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Authentication */}
      <Section id="authentication" title="Authentication">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Key Authentication</CardTitle>
            <CardDescription>
              Include your API key in the <code className="bg-muted px-1 rounded text-xs">X-API-Key</code> header with every request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock code={`curl ${BASE_URL}/v1/jobs \\\n  -H "X-API-Key: pk_live_abc123..."`} />
            <p className="text-sm text-muted-foreground mt-3">
              Keep your API key secret. Do not expose it in client-side code. If compromised, revoke it immediately from the API Keys page and create a new one.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* Submit a Job */}
      <Section id="submit-job" title="Submit a Job">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <Badge variant="secondary" className="mr-2">POST</Badge>
              /v1/jobs
            </CardTitle>
            <CardDescription>
              Submit a PDF for preflight checking against your print specification. The <code className="bg-muted px-1 rounded text-xs">pages</code> array supports multiple entries for documents with different page dimensions — see <a href="#multi-page-specs" className="text-primary hover:underline">Multi-Page Specs</a>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <CodeBlock code={curlSubmit} />
              </TabsContent>
              <TabsContent value="js">
                <CodeBlock code={jsSubmit} language="javascript" />
              </TabsContent>
            </Tabs>

            <div>
              <h4 className="font-medium mb-3 text-foreground">Spec Fields</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground">Field</th>
                      <th className="text-left p-3 font-medium text-foreground">Type</th>
                      <th className="text-left p-3 font-medium text-foreground">Required</th>
                      <th className="text-left p-3 font-medium text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specFieldsTable.map((row) => (
                      <tr key={row.field} className="border-t">
                        <td className="p-3 font-mono text-xs text-foreground">{row.field}</td>
                        <td className="p-3 text-muted-foreground">{row.type}</td>
                        <td className="p-3">
                          {row.required ? (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          ) : (
                            <span className="text-muted-foreground">Optional</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Multi-Page Specs */}
      <Section id="multi-page-specs" title="Multi-Page Specifications">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Different Specs per Page Range</CardTitle>
            <CardDescription>
              Use multiple entries in the <code className="bg-muted px-1 rounded text-xs">pages</code> array to define different trim sizes, bleed, and safe zones for different page ranges within a single PDF — ideal for perfect bound books, brochures, or any document where covers and text pages differ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3 text-foreground">Example: Perfect Bound Book (A4)</h4>
              <p className="text-sm text-muted-foreground mb-4">
                This example defines two page specs: a cover spread (page 1, 425×297 mm with 10 mm safe zone) and text pages (pages 2–100, 210×297 mm with 5 mm safe zone).
              </p>
              <Tabs defaultValue="curl">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <CodeBlock code={curlMultiPage} />
                </TabsContent>
                <TabsContent value="js">
                  <CodeBlock code={jsMultiPage} language="javascript" />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-foreground">Page Range Syntax</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground">Range</th>
                      <th className="text-left p-3 font-medium text-foreground">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { range: '"1"', meaning: "Page 1 only" },
                      { range: '"1-4"', meaning: "Pages 1 through 4" },
                      { range: '"2-100"', meaning: "Pages 2 through 100" },
                      { range: '"all"', meaning: "All pages in the document" },
                    ].map((row) => (
                      <tr key={row.range} className="border-t">
                        <td className="p-3 font-mono text-xs text-foreground">{row.range}</td>
                        <td className="p-3 text-muted-foreground">{row.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-foreground">Page Type</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground">Type</th>
                      <th className="text-left p-3 font-medium text-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { type: '"combined"', desc: "Front and back artwork are in the same PDF (e.g. a spread or single-sided)" },
                      { type: '"front"', desc: "This spec applies to front-side artwork only" },
                      { type: '"back"', desc: "This spec applies to back-side artwork only" },
                    ].map((row) => (
                      <tr key={row.type} className="border-t">
                        <td className="p-3 font-mono text-xs text-foreground">{row.type}</td>
                        <td className="p-3 text-muted-foreground">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> Each page in the PDF is matched against the first spec whose range includes it. Define more specific ranges before broader ones for predictable results.
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Get Job Result */}
      <Section id="get-result" title="Get Job Result">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <Badge variant="secondary" className="mr-2">GET</Badge>
              /v1/jobs/{"{job_id}"}
            </CardTitle>
            <CardDescription>Retrieve the status and check results for a submitted job.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
              </TabsList>
              <TabsContent value="curl">
                <CodeBlock code={curlGet} />
              </TabsContent>
              <TabsContent value="js">
                <CodeBlock code={jsGet} language="javascript" />
              </TabsContent>
            </Tabs>

            <div>
              <h4 className="font-medium mb-3 text-foreground">Response Example</h4>
              <CodeBlock code={jobResponseExample} language="json" />
            </div>

            <div>
              <h4 className="font-medium mb-3 text-foreground">Check Statuses</h4>
              <div className="flex gap-3">
                <Badge className="bg-green-500/10 text-green-700 border-green-200">pass</Badge>
                <Badge className="bg-red-500/10 text-red-700 border-red-200">fail</Badge>
                <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">warn</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                The overall <code className="bg-muted px-1 rounded text-xs">result</code> is "pass" only if all checks pass. Any single failure makes the result "fail".
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Webhooks */}
      <Section id="webhooks" title="Webhooks">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook Notifications</CardTitle>
            <CardDescription>
              Receive job results automatically instead of polling. Include a webhook URL when submitting a job.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock
              code={`"webhook": {\n  "url": "https://yourapp.com/preflight-webhook",\n  "secret": "whsec_your_hmac_secret"\n}`}
              language="json"
            />
            <p className="text-sm text-muted-foreground">
              When the job completes, we'll POST the results to your webhook URL. If you provide a <code className="bg-muted px-1 rounded text-xs">secret</code>, we'll include an <code className="bg-muted px-1 rounded text-xs">X-Signature</code> header with an HMAC-SHA256 signature of the payload body.
            </p>
            <div>
              <h4 className="font-medium mb-3 text-foreground">Webhook Payload</h4>
              <CodeBlock code={webhookExample} language="json" />
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Proof Viewer */}
      <Section id="proof-viewer" title="Proof Viewer">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interactive Proof Viewer</CardTitle>
            <CardDescription>
              Generate shareable proof links for your customers to visually verify their artwork.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock
              code={`"proof": {\n  "generate": true,\n  "expires_hours": 72,\n  "base_url": "https://proofs.yoursite.com"\n}`}
              language="json"
            />
            <p className="text-sm text-muted-foreground">
              When <code className="bg-muted px-1 rounded text-xs">generate</code> is true, a <code className="bg-muted px-1 rounded text-xs">proof_url</code> is included in the response and webhook payload. The proof viewer shows an overlay of trim lines, bleed area, and safe zone on the artwork. Links expire after <code className="bg-muted px-1 rounded text-xs">expires_hours</code> (default 72).
            </p>
            <p className="text-sm text-muted-foreground">
              Use <code className="bg-muted px-1 rounded text-xs">base_url</code> to white-label the proof link domain. The proof ID will be appended as a path segment.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* Error Codes */}
      <Section id="errors" title="Error Codes">
        <Card>
          <CardContent className="pt-6">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium text-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-foreground">Meaning</th>
                    <th className="text-left p-3 font-medium text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {errorCodes.map((err) => (
                    <tr key={err.code} className="border-t">
                      <td className="p-3 font-mono text-foreground">{err.code}</td>
                      <td className="p-3 font-medium text-foreground">{err.meaning}</td>
                      <td className="p-3 text-muted-foreground">{err.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-foreground">Error Response Format</h4>
              <CodeBlock
                code={`{\n  "error": "Invalid request",\n  "detail": "spec.pages is required"\n}`}
                language="json"
              />
            </div>
          </CardContent>
        </Card>
      </Section>

      <div className="pb-8" />
    </div>
  );
}
