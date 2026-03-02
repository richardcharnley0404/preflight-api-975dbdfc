import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Copy, Trash2, Key } from "lucide-react";
import { toast } from "sonner";

// Mock data
const mockKeys = [
  { id: "1", name: "Production", key: "pk_live_****abcd", created: "2026-01-15", lastUsed: "2026-03-01", active: true },
  { id: "2", name: "Staging", key: "pk_test_****ef01", created: "2026-02-10", lastUsed: "2026-02-28", active: true },
];

export default function ApiKeys() {
  const [keys, setKeys] = useState(mockKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    const fakeKey = `pk_live_${Math.random().toString(36).slice(2, 18)}`;
    setGeneratedKey(fakeKey);
    setKeys((prev) => [
      ...prev,
      { id: String(Date.now()), name: newKeyName || "Untitled", key: `pk_live_****${fakeKey.slice(-4)}`, created: new Date().toISOString().split("T")[0], lastUsed: "-", active: true },
    ]);
    setNewKeyName("");
  };

  const handleRevoke = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key revoked");
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for accessing the PrintPreflight API</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setGeneratedKey(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{generatedKey ? "Your New API Key" : "Create API Key"}</DialogTitle>
              <DialogDescription>
                {generatedKey
                  ? "Copy this key now. You won't be able to see it again."
                  : "Give your key a name to help you identify it later."}
              </DialogDescription>
            </DialogHeader>
            {generatedKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                  <code className="flex-1 break-all">{generatedKey}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyKey(generatedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setDialogOpen(false); setGeneratedKey(null); }}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Key Name</Label>
                  <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production" />
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate}>Generate Key</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" /> Active Keys
          </CardTitle>
          <CardDescription>You have {keys.length} of 1 keys (Free plan)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{k.key}</TableCell>
                  <TableCell className="text-muted-foreground">{k.created}</TableCell>
                  <TableCell className="text-muted-foreground">{k.lastUsed}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently revoke the key "{k.name}". Any applications using this key will stop working immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRevoke(k.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Revoke Key
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
