import { useGetDashboardSummary, useGetTopCrops, useGetPriceTrends } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Scale, 
  Store,
  Leaf,
  Activity,
  MessageSquare
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: topCrops, isLoading: isTopCropsLoading } = useGetTopCrops();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Market Intelligence Overview</h1>
        <p className="text-muted-foreground mt-2 text-lg">Real-time data to help you make informed selling decisions.</p>
      </div>

      {isSummaryLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card hover-elevate transition-all border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fair Price Index</CardTitle>
              <Scale className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.fairPriceIndex}/100</div>
              <p className="text-xs text-muted-foreground mt-1">
                Market fairness across {summary.totalMarkets} mandis
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover-elevate transition-all border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.activeAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.totalAnomaliesDetected} anomalies detected this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover-elevate transition-all border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Gainer</CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.topGainer?.crop ?? "—"}</div>
              <p className="text-xs font-medium text-secondary mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {summary.topGainer ? `+${summary.topGainer.change}% this week` : "No data yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover-elevate transition-all border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Loser</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.topLoser?.crop ?? "—"}</div>
              <p className="text-xs font-medium text-orange-500 mt-1 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                {summary.topLoser ? `${summary.topLoser.change}% this week` : "No data yet"}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Traded Crops</CardTitle>
              <CardDescription>Volume and price movements across all markets</CardDescription>
            </div>
            <Link href="/prices">
              <Button variant="outline" size="sm">View All Prices</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isTopCropsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topCrops && topCrops.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Crop</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">vs MSP</TableHead>
                      <TableHead className="text-right">7d Trend</TableHead>
                      <TableHead className="text-right">Alerts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCrops.map((crop) => (
                      <TableRow key={crop.crop} className="hover:bg-muted/30">
                        <TableCell className="font-medium flex items-center gap-2">
                          <div className="bg-primary/10 p-1.5 rounded text-primary">
                            <Leaf className="h-4 w-4" />
                          </div>
                          {crop.crop}
                        </TableCell>
                        <TableCell className="text-right font-semibold">₹{crop.avgPrice}/q</TableCell>
                        <TableCell className="text-right">
                          {crop.mspPrice ? (
                            <Badge variant={crop.avgPrice >= crop.mspPrice ? "outline" : "destructive"} className="font-mono text-xs">
                              {crop.avgPrice >= crop.mspPrice ? "+" : "-"}
                              {Math.abs(Math.round(((crop.avgPrice - crop.mspPrice) / crop.mspPrice) * 100))}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">No MSP</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "text-sm font-medium flex items-center justify-end",
                            crop.priceChange7d > 0 ? "text-secondary" : crop.priceChange7d < 0 ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {crop.priceChange7d > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : crop.priceChange7d < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                            {crop.priceChange7d > 0 ? "+" : ""}{crop.priceChange7d}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {crop.alertCount > 0 ? (
                            <Badge variant="destructive" className="rounded-full px-2">
                              {crop.alertCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No crop data available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Tools to protect your profit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/fairness" className="block">
              <div className="group flex items-start gap-4 rounded-lg border p-4 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                <div className="rounded-full bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Check Price Fairness</h4>
                  <p className="text-xs text-muted-foreground mt-1">Verify if a trader's offer is fair based on current data.</p>
                </div>
              </div>
            </Link>

            <Link href="/markets" className="block">
              <div className="group flex items-start gap-4 rounded-lg border p-4 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                <div className="rounded-full bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Find Best Markets</h4>
                  <p className="text-xs text-muted-foreground mt-1">Discover nearby mandis paying premium prices.</p>
                </div>
              </div>
            </Link>

            <Link href="/chat" className="block">
              <div className="group flex items-start gap-4 rounded-lg border p-4 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                <div className="rounded-full bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Ask AI Assistant</h4>
                  <p className="text-xs text-muted-foreground mt-1">Get instant answers about crops, markets, and schemes.</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Simple utility function instead of relying on external lib for standard classes
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
