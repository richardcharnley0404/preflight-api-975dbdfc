import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, CreditCard } from "lucide-react";

const currentPlan = {
  name: "Free",
  jobsUsed: 32,
  jobsLimit: 50,
  keysUsed: 2,
  keysLimit: 1,
};

const plans = [
  { name: "Free", price: "$0", jobs: "50/mo", keys: "1", current: true },
  { name: "Pro", price: "$49", jobs: "500/mo", keys: "5", current: false },
  { name: "Enterprise", price: "Custom", jobs: "Unlimited", keys: "Unlimited", current: false },
];

const invoices = [
  { id: "inv_001", date: "2026-03-01", amount: "$0.00", status: "Paid" },
  { id: "inv_002", date: "2026-02-01", amount: "$0.00", status: "Paid" },
];

export default function Billing() {
  const usagePercent = (currentPlan.jobsUsed / currentPlan.jobsLimit) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your plan and billing</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription>You are on the <span className="font-medium text-foreground">{currentPlan.name}</span> plan</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">{currentPlan.name}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Jobs used</span>
              <span>{currentPlan.jobsUsed} / {currentPlan.jobsLimit}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.current ? "border-primary ring-1 ring-primary/20" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-bold">{plan.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> {plan.jobs} jobs</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-success" /> {plan.keys} API keys</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant={plan.current ? "secondary" : "default"} className="w-full" disabled={plan.current}>
                  {plan.current ? "Current Plan" : plan.name === "Enterprise" ? "Contact Sales" : "Upgrade"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.id}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                  <TableCell>{inv.amount}</TableCell>
                  <TableCell><Badge variant="secondary">{inv.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
