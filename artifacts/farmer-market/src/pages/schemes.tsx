import { useState } from "react";
import { useListSchemes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building, FileText, CheckCircle2, Calendar, ExternalLink, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Schemes() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: schemes, isLoading } = useListSchemes({}, { query: { enabled: true } });

  const filteredSchemes = schemes?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ministry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Government Schemes</h1>
          <p className="text-muted-foreground mt-1">Discover subsidies, insurance, and financial support programs.</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search schemes by name, ministry, or keyword..."
          className="pl-10 py-6 text-base bg-card shadow-sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="h-[400px]">
              <CardHeader className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredSchemes && filteredSchemes.length > 0 ? (
          filteredSchemes.map((scheme) => (
            <Card key={scheme.id} className="flex flex-col h-full hover-elevate transition-all border-t-4 border-t-primary">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1 font-medium">
                    <Building className="h-3 w-3" />
                    {scheme.ministry}
                  </Badge>
                  {scheme.deadline && (
                    <Badge variant="secondary" className="flex items-center gap-1 whitespace-nowrap bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400">
                      <Calendar className="h-3 w-3" />
                      Due {new Date(scheme.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl leading-tight">{scheme.name}</CardTitle>
                <CardDescription className="text-foreground/80 font-medium line-clamp-2 mt-2">
                  {scheme.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <span className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                    <IndianRupeeIcon className="h-4 w-4 text-secondary" /> Benefit
                  </span>
                  <span className="text-muted-foreground">{scheme.benefit}</span>
                </div>

                <div>
                  <span className="font-bold text-sm text-foreground flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Eligibility Highlights
                  </span>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {scheme.eligibility}
                  </p>
                </div>
                
                {scheme.applicableCrops && scheme.applicableCrops.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {scheme.applicableCrops.map(crop => (
                      <Badge key={crop} variant="secondary" className="text-[10px] px-1.5 py-0 bg-secondary/10 text-secondary border-secondary/20">
                        {crop}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-4 border-t">
                {scheme.applicationUrl ? (
                  <Button className="w-full font-semibold" asChild>
                    <a href={scheme.applicationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      Apply Now <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full font-semibold">
                    <FileText className="h-4 w-4 mr-2" /> View Details
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-card border rounded-lg">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No schemes found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom simple Indian Rupee icon component since it might not be in lucide-react standard set
function IndianRupeeIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="M6 13l8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}
