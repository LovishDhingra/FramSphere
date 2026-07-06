import { useState } from "react";
import { useListAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingDown, Scale, MapPin, Search, AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Alerts() {
  const [severity, setSeverity] = useState("all");
  const [state, setState] = useState("All");

  const { data: alerts, isLoading } = useListAlerts(
    { 
      severity: severity === "all" ? undefined : severity as any,
      state: state === "All" ? undefined : state
    },
    { query: { enabled: true } }
  );

  const states = ["All", "Punjab", "Haryana", "Madhya Pradesh", "Maharashtra"];
  const severities = [
    { value: "all", label: "All Severities" },
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'exploitation': return <Scale className="h-5 w-5" />;
      case 'market_crash': return <TrendingDown className="h-5 w-5" />;
      case 'msp_violation': return <AlertTriangle className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-600 text-white border-red-700';
      case 'high': return 'bg-orange-500 text-white border-orange-600';
      case 'medium': return 'bg-yellow-500 text-white border-yellow-600';
      case 'low': return 'bg-blue-500 text-white border-blue-600';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Alerts Feed</h1>
          <p className="text-muted-foreground mt-1">Real-time alerts for market exploitation, price crashes, and MSP violations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-2 rounded-lg border shadow-sm w-full md:w-auto">
          <div className="flex items-center w-full sm:w-auto">
            <AlertCircle className="h-4 w-4 text-muted-foreground ml-2 absolute" />
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full sm:w-[150px] pl-8 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                {severities.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-6 w-px bg-border hidden sm:block"></div>
          <div className="flex items-center w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0">
            <MapPin className="h-4 w-4 text-muted-foreground ml-2 absolute" />
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="w-full sm:w-[150px] pl-8 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="State" />
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

      <div className="grid gap-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <Card key={alert.id} className={`overflow-hidden transition-all hover-elevate ${alert.severity === 'critical' ? 'border-l-4 border-l-red-600' : ''}`}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-5">
                  <div className={`p-3 rounded-full shrink-0 mt-1 ${
                    alert.type === 'exploitation' ? 'bg-destructive/10 text-destructive' :
                    alert.type === 'market_crash' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize bg-background">
                        {alert.type.replace('_', ' ')}
                      </Badge>
                      {alert.isResolved && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
                          Resolved
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center ml-auto">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(alert.createdAt).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground leading-tight">
                      {alert.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {alert.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-foreground/80 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {alert.market}, {alert.state}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-border"></div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Crop:</span>
                        {alert.crop}
                      </div>
                      {alert.affectedFarmers && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-border"></div>
                          <div className="flex items-center gap-1 text-destructive">
                            <span className="text-muted-foreground">Affected:</span>
                            ~{alert.affectedFarmers} farmers
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 bg-card border rounded-lg">
            <div className="bg-muted inline-flex p-4 rounded-full text-muted-foreground mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No alerts found</h3>
            <p className="text-muted-foreground">Everything looks stable for the selected criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
