import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin, Compass, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearch, SearchResult } from "@/hooks/useSearch";
import { formatPrice } from "@/data/trips";
import { cn } from "@/lib/utils";

interface GlobalSearchBarProps {
  variant?: "navbar" | "hero";
  className?: string;
  onNavigate?: () => void;
}

const GlobalSearchBar = ({ variant = "navbar", className, onNavigate }: GlobalSearchBarProps) => {
  const navigate = useNavigate();
  const { query, results, loading, debouncedSearch, clearSearch } = useSearch();
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    const path = result.type === "trip" ? `/trips/${result.slug}` : `/destinations/${result.slug}`;
    navigate(path);
    clearSearch();
    setIsFocused(false);
    onNavigate?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
      onNavigate?.();
    }
  };

  const showDropdown = isFocused && query.length >= 2;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
            variant === "hero" ? "w-5 h-5 text-muted-foreground" : "w-4 h-4 text-muted-foreground"
          )} />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => debouncedSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={variant === "hero" ? "Search destinations, trips, states..." : "Search..."}
            className={cn(
              "pr-8",
              variant === "hero"
                ? "pl-11 h-14 text-base rounded-2xl bg-background/95 backdrop-blur-md border-2 border-primary/20 focus:border-primary shadow-xl placeholder:text-muted-foreground/60"
                : "pl-9 h-9 text-sm rounded-lg bg-muted/50 border-border focus:bg-background w-[180px] focus:w-[260px] transition-all duration-300"
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => { clearSearch(); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {loading && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className={cn(
          "absolute z-[60] mt-2 w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden",
          variant === "hero" ? "max-w-2xl" : "min-w-[320px] right-0"
        )}>
          {results.length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-b-0"
                >
                  {result.image ? (
                    <img src={result.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {result.type === "destination" ? (
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Compass className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {result.price && (
                      <span className="text-sm font-semibold text-primary">{formatPrice(result.price)}</span>
                    )}
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {result.type === "trip" ? "Trip" : "Destination"}
                    </Badge>
                  </div>
                </button>
              ))}
              {query.trim() && (
                <button
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                    clearSearch();
                    setIsFocused(false);
                    onNavigate?.();
                  }}
                  className="w-full px-4 py-3 text-sm text-primary font-medium hover:bg-primary/5 transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  View all results for "{query}"
                </button>
              )}
            </div>
          ) : !loading ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
