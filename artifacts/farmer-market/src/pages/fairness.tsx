import { useState } from "react";
import {
  useAnalyzeFairness,
  useListAnomalies,
  useListMarketStates,
  useListMarkets,
  type FairnessResult,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Scale, Info, ShieldAlert, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const CROPS = [
  "Wheat", "Paddy(Common)", "Paddy(Basmati)", "Cotton", "Onion",
  "Tomato", "Mustard", "Soyabean", "Maize", "Potato", "Green Chilli",
];

export default function Fairness() {
  const [crop, setCrop] = useState("Wheat");
  const [selectedState, setSelectedState] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [price, setPrice] = useState("");
  const [result, setResult] = useState<FairnessResult | null>(null);

  const analyzeFairness = useAnalyzeFairness();

  const { data: statesData, isLoading: statesLoading } = useListMarketStates();

  const { data: marketsData, isLoading: marketsLoading } = useListMarkets(
    selectedState ? { state: selectedState } : {},
    { query: { enabled: !!selectedState } },
  );

  const { data: anomalies, isLoading: isAnomaliesLoading } = useListAnomalies(
    { state: selectedState || undefined, crop },
    { query: { enabled: true } },
  );

  const handleStateChange = (s: string) => {
    setSelectedState(s);
    setSelectedMarket("");
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || isNaN(Number(price)) || !selectedState || !selectedMarket) return;

    analyzeFairness.mutate(
      {
        data: {
          crop,
          state: selectedState,
          market: selectedMarket,
          offeredPrice: Number(price),
        },
      },
      { onSuccess: (data) => setResult(data) },
    );
  };

  const isFormValid = !!price && !!selectedState && !!selectedMarket;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Price Fairness Analyzer</h1>
        <p className="text-muted-foreground mt-1">Verify if a trader's offer is fair based on current mandi data.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* ── Left: Form ──────────────────────────────────────────────── */}
        <div className="md:col-span-5 lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Analyze Transaction
              </CardTitle>
              <CardDescription>Enter the offer details you received from a trader</CardDescription>
            </CardHeader>
            <form onSubmit={handleAnalyze}>
              <CardContent className="space-y-4">
                {/* Crop */}
                <div className="space-y-2">
                  <Label>Crop</Label>
                  <Select value={crop} onValueChange={setCrop}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {CROPS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* State */}
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={selectedState} onValueChange={handleStateChange} disabled={statesLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={statesLoading ? "Loading states…" : "Select your state"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(statesData?.states ?? []).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mandi — cascades from state */}
                <div className="space-y-2">
                  <Label>Market / Mandi</Label>
                  <Select
                    value={selectedMarket}
                    onValueChange={setSelectedMarket}
                    disabled={!selectedState || marketsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedState
                            ? "Select a state first"
                            : marketsLoading
                            ? "Loading mandis…"
                            : "Select mandi"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(marketsData ?? []).map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                          <span className="ml-1 text-xs text-muted-foreground">— {m.district}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Offered price */}
                <div className="space-y-2">
                  <Label>Offered Price (₹ per Quintal)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 2100"
                    required
                    min={1}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full font-bold"
                  disabled={analyzeFairness.isPending || !isFormValid}
                >
                  {analyzeFairness.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing…</>
                  ) : (
                    "Check Fairness"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* ── Right: Results + Anomalies ───────────────────────────── */}
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          {result ? (
            <Card className="border-2 shadow-md animate-in zoom-in-95 duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Analysis Result</CardTitle>
                  <Badge
                    variant={
                      result.verdict === "fair"
                        ? "default"
                        : result.verdict === "suspicious"
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-sm px-3 py-1 uppercase tracking-wider"
                  >
                    {result.verdict}
                  </Badge>
                </div>
                <CardDescription className="text-base text-foreground font-medium">
                  {result.explanation}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Offered</div>
                    <div className="text-2xl font-mono font-bold">₹{result.offeredPrice}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Mandi Avg</div>
                    <div className="text-2xl font-mono font-bold text-primary">₹{result.mandiModalPrice}</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">MSP</div>
                    <div className="text-2xl font-mono font-bold">
                      {result.mspPrice ? `₹${result.mspPrice}` : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Deviation from Market</span>
                    <span className={`font-mono font-bold ${result.deviationFromMandi < 0 ? "text-destructive" : "text-primary"}`}>
                      {result.deviationFromMandi}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Deviation from MSP</span>
                    <span className={`font-mono font-bold ${result.deviationFromMsp && result.deviationFromMsp < 0 ? "text-destructive" : "text-primary"}`}>
                      {result.deviationFromMsp ? `${result.deviationFromMsp}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Anomaly Score (0–100)</span>
                    <span className="font-mono font-bold">{result.anomalyScore}</span>
                  </div>
                </div>

                <Separator />

                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 flex gap-3">
                  <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-secondary">Recommendation</h4>
                    <p className="text-sm text-foreground/80 mt-1">{result.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[200px] flex flex-col items-center justify-center text-center p-6 border-dashed bg-muted/30">
              <div className="rounded-full bg-muted p-4 mb-4 text-muted-foreground">
                <Scale className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Awaiting Input</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Select your crop, state, and mandi — then enter the price offered by the trader.
              </p>
            </Card>
          )}

          {/* Recent Anomalies */}
          <div className="space-y-4 mt-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Recent Exploitation Anomalies
              {selectedState && (
                <Badge variant="outline" className="text-xs font-normal">{selectedState}</Badge>
              )}
            </h3>
            {isAnomaliesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : anomalies && anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.slice(0, 5).map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className="bg-card border rounded-lg p-4 flex items-center justify-between hover-elevate transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Exploitative</Badge>
                        <span className="font-bold text-sm">{anomaly.crop} in {anomaly.market}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reported: ₹{anomaly.reportedPrice}/q vs Expected: ₹{anomaly.expectedPrice}/q
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-destructive font-bold font-mono">{anomaly.deviationPct}%</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(anomaly.detectedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-muted-foreground border rounded-lg">
                {selectedState
                  ? `No recent anomalies detected in ${selectedState}.`
                  : "Select a state to filter anomalies by region."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
