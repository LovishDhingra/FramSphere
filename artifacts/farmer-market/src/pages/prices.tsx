import { useState } from "react";
import { useListPrices, useComparePrices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, LineChart, MapPin, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Prices() {
  const [crop, setCrop] = useState("Wheat");
  const [state, setState] = useState("Punjab");
  
  const { data: prices, isLoading: isPricesLoading } = useListPrices({ 
    crop: crop === "All" ? undefined : crop, 
    state: state === "All" ? undefined : state, 
    limit: 20 
  }, { query: { enabled: true } });

  const { data: comparison, isLoading: isCompareLoading } = useComparePrices({ 
    crop, 
    state: state === "All" ? undefined : state 
  }, { query: { enabled: !!crop } });

  const crops = ["All", "Wheat", "Paddy", "Cotton", "Maize", "Soyabean", "Mustard", "Gram"];
  const states = ["All", "Punjab", "Haryana", "Madhya Pradesh", "Maharashtra", "Uttar Pradesh", "Rajasthan"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Price Explorer</h1>
          <p className="text-muted-foreground mt-1">Live mandi prices across states and markets.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-2 rounded-lg border shadow-sm w-full md:w-auto">
          <div className="flex items-center w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground ml-2 absolute" />
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="w-full sm:w-[140px] pl-8 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Select Crop" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-6 w-px bg-border hidden sm:block"></div>
          <div className="flex items-center w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0">
            <MapPin className="h-4 w-4 text-muted-foreground ml-2 absolute" />
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-full sm:w-[160px] pl-8 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Market List
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" /> Compare Prices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Recent Market Arrivals</CardTitle>
              <CardDescription>Latest price updates for {crop === "All" ? "all crops" : crop} in {state === "All" ? "all states" : state}</CardDescription>
            </CardHeader>
            <CardContent>
              {isPricesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : prices && prices.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Market</TableHead>
                        <TableHead>Crop & Variety</TableHead>
                        <TableHead className="text-right">Min Price</TableHead>
                        <TableHead className="text-right">Max Price</TableHead>
                        <TableHead className="text-right text-primary font-bold">Modal Price</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prices.map((p) => (
                        <TableRow key={p.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-medium text-foreground">{p.market}</div>
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {p.district}, {p.state}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal bg-primary/5 text-primary border-primary/20">
                              {p.crop}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">{p.variety || "Standard"}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono">₹{p.minPrice}/q</TableCell>
                          <TableCell className="text-right font-mono">₹{p.maxPrice}/q</TableCell>
                          <TableCell className="text-right font-mono font-bold text-primary bg-primary/5">
                            ₹{p.modalPrice}/q
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {new Date(p.priceDate).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="bg-muted p-4 rounded-full text-muted-foreground mb-4">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No prices found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
                  <Button variant="outline" className="mt-4" onClick={() => { setCrop("All"); setState("All"); }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle>Market Comparison</CardTitle>
              <CardDescription>Price deviation across markets for {crop} in {state === "All" ? "India" : state}</CardDescription>
            </CardHeader>
            <CardContent>
              {isCompareLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : comparison && comparison.length > 0 ? (
                <div className="space-y-4">
                  {/* Top Market Banner */}
                  <div className="bg-primary text-primary-foreground p-4 rounded-lg flex items-center justify-between border shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-full">
                        <IndianRupee className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wider">Best Premium Market</div>
                        <div className="text-xl font-bold">{comparison[0].market}, {comparison[0].state}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary-foreground/80">Modal Price</div>
                      <div className="text-2xl font-bold font-mono">₹{comparison[0].modalPrice}/q</div>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[80px]">Rank</TableHead>
                          <TableHead>Market</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Deviation vs Avg</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparison.map((c, i) => (
                          <TableRow key={`${c.market}-${c.state}`} className="hover:bg-muted/30">
                            <TableCell className="font-bold text-muted-foreground text-center">
                              #{c.rank}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground flex items-center">
                                {i === 0 && <span className="text-yellow-500 mr-2">⭐</span>}
                                {c.market}
                              </div>
                              <div className="text-xs text-muted-foreground">{c.state}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-primary">
                              ₹{c.modalPrice}/q
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={c.deviation > 0 ? "default" : c.deviation < 0 ? "destructive" : "outline"} className={
                                c.deviation > 0 ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" : ""
                              }>
                                {c.deviation > 0 ? "+" : ""}{c.deviation}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="bg-muted p-4 rounded-full text-muted-foreground mb-4">
                    <LineChart className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No comparison data</h3>
                  <p className="text-muted-foreground">Select a specific crop to see market comparisons.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
