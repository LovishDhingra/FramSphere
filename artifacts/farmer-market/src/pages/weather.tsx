import { useState } from "react";
import {
  useGetWeatherPricePrediction,
  useListMarketStates,
  useListMarkets,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudSun, CloudRain, ThermometerSun, AlertCircle, ArrowUpRight, ArrowDownRight, Wind, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const CROPS = [
  "Wheat", "Paddy", "Cotton", "Onion", "Tomato",
  "Mustard", "Soybean", "Sugarcane", "Maize", "Gram",
];

export default function Weather() {
  const [crop, setCrop] = useState("Wheat");
  const [selectedState, setSelectedState] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");

  const { data: statesData, isLoading: statesLoading } = useListMarketStates();

  const { data: marketsData, isLoading: marketsLoading } = useListMarkets(
    selectedState ? { state: selectedState } : {},
    { query: { enabled: !!selectedState } },
  );

  const { data: prediction, isLoading: predLoading } = useGetWeatherPricePrediction(
    { crop, market: selectedMarket, days: 7 },
    { query: { enabled: !!crop && !!selectedMarket } },
  );

  const handleStateChange = (s: string) => {
    setSelectedState(s);
    setSelectedMarket("");
  };

  const isReady = !!crop && !!selectedMarket;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Weather & Price Forecast</h1>
        <p className="text-muted-foreground mt-1">See how upcoming weather will impact your crop's market price.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* ── Left: Controls ──────────────────────────────────────────── */}
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Settings</CardTitle>
              <CardDescription>Select crop, state and mandi</CardDescription>
            </CardHeader>
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
                    <SelectValue placeholder={statesLoading ? "Loading states…" : "Select state"} />
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

              {!isReady && (
                <p className="text-xs text-muted-foreground pt-1">
                  Select all three fields to load the 7-day forecast.
                </p>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendation card */}
          {prediction && !predLoading && (
            <Card className="bg-primary text-primary-foreground border-primary shadow-lg overflow-hidden relative">
              <div className="absolute right-[-20px] top-[-20px] opacity-10">
                <CloudSun className="w-32 h-32" />
              </div>
              <CardHeader>
                <CardTitle className="text-primary-foreground">AI Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium leading-relaxed relative z-10">
                  {prediction.recommendedAction}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Forecast ─────────────────────────────────────────── */}
        <div className="md:col-span-8 space-y-6">
          {predLoading ? (
            <Card>
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating forecast for {selectedMarket}…</span>
                </div>
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-4 gap-4 mt-6">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              </CardContent>
            </Card>
          ) : prediction ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <ThermometerSun className="h-6 w-6 text-orange-500" />
                        Weather Impact Summary
                      </CardTitle>
                      <CardDescription className="mt-2 text-base leading-relaxed">
                        {prediction.weatherSummary}
                      </CardDescription>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Current Price</div>
                      <div className="text-3xl font-bold font-mono">₹{prediction.currentPrice}</div>
                      <div className="text-xs text-muted-foreground">/quintal</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-6" />
                  <h3 className="font-bold text-lg mb-4">7-Day Price Forecast</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {prediction.predictions.map((day, idx) => {
                      const isUp = day.predictedPrice > prediction.currentPrice;
                      const dateObj = new Date(day.date);
                      return (
                        <div
                          key={idx}
                          className={`border rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all hover:border-primary hover:shadow-md ${
                            idx === 0 ? "bg-primary/5 border-primary/30" : "bg-card"
                          }`}
                        >
                          <div className="text-xs text-muted-foreground mb-1 uppercase font-semibold">
                            {idx === 0 ? "Today" : dateObj.toLocaleDateString("en-IN", { weekday: "short" })}
                          </div>

                          <div className="my-2">
                            {day.weatherFactor.toLowerCase().includes("rain") ? (
                              <CloudRain className="h-6 w-6 text-blue-500" />
                            ) : day.weatherFactor.toLowerCase().includes("heat") ? (
                              <ThermometerSun className="h-6 w-6 text-orange-500" />
                            ) : day.weatherFactor.toLowerCase().includes("wind") ? (
                              <Wind className="h-6 w-6 text-gray-500" />
                            ) : (
                              <CloudSun className="h-6 w-6 text-yellow-500" />
                            )}
                          </div>

                          <div className="text-lg font-bold font-mono">₹{day.predictedPrice}</div>

                          <div className={`text-[10px] mt-1 flex items-center font-bold ${isUp ? "text-secondary" : "text-destructive"}`}>
                            {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(Math.round(((day.predictedPrice - prediction.currentPrice) / prediction.currentPrice) * 100))}%
                          </div>

                          <div className="w-full bg-muted h-1 mt-3 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${day.confidence > 80 ? "bg-primary" : day.confidence > 60 ? "bg-secondary" : "bg-destructive"}`}
                              style={{ width: `${day.confidence}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-1">{day.confidence}% conf.</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Disclaimer:</strong> Weather-based price predictions are AI-generated estimates based on historical correlation between meteorological events and market arrivals. They do not account for sudden regulatory changes or macroeconomic shifts.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/30 border border-dashed rounded-lg p-12">
              <div className="text-center">
                <CloudSun className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">
                  {!selectedState ? "Start by selecting a state" : !selectedMarket ? "Now pick a mandi" : "Select a crop to continue"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose crop → state → mandi to view AI-powered weather and price forecasts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
