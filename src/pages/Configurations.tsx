import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCustomPresets, useDeleteCustomPreset, type CustomPreset } from "@/hooks/useApiData";
import { ConfigurationDialog } from "@/components/configurations/ConfigurationDialog";
import { STANDARD_PRESET } from "@/lib/standardPreset";

export default function Configurations() {
  const { data, isLoading, error } = useCustomPresets();
  const deleteMut = useDeleteCustomPreset();
  const [editing, setEditing] = useState<CustomPreset | undefined>();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomPreset | null>(null);

  const openCreate = () => { setEditing(undefined); setOpen(true); };
  const openEdit = (p: CustomPreset) => { setEditing(p); setOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.preset_id);
      toast.success("Configuration deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configurations</h1>
          <p className="text-muted-foreground">
            Reusable preflight specs for your products. Customers pick one when submitting.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New configuration
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {error && (
            <p className="px-6 pt-4 text-xs text-muted-foreground">
              Couldn't load your custom configurations: {error instanceof Error ? error.message : "unknown error"}. The system default below is always available.
            </p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    {STANDARD_PRESET.name}
                    <Badge variant="secondary" className="text-xs">System</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{STANDARD_PRESET.description}</div>
                </TableCell>
                <TableCell className="font-mono text-xs">{STANDARD_PRESET.preset_id}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">All products</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">—</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">Read-only</TableCell>
              </TableRow>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-3">
                    <Skeleton className="h-6" />
                  </TableCell>
                </TableRow>
              ) : (
                data?.presets?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.preset_id}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.for_product_types.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.updated_at ? format(new Date(p.updated_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)} aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfigurationDialog open={open} onOpenChange={setOpen} preset={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be removed. Customers can no longer pick it for new jobs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
