import { useQuery } from "@tanstack/react-query";
import { fetchConnectionSuggestions, sendConnectionRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export function ConnectionSuggestions() {
  const { user, token, openLogin } = useAuth();
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["connection-suggestions"],
    queryFn: () => (token ? fetchConnectionSuggestions(token) : []),
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleConnect = async (userId: string, username: string) => {
    if (!token || !user) {
      openLogin();
      return;
    }

    try {
      await sendConnectionRequest(userId, token);
      setSentRequests((prev) => new Set(prev).add(userId));
      toast.success(`Demande de connexion envoyée à ${username} !`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi");
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
          Suggestions de connexions
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="glass rounded-2xl p-4 lg:p-6">
      <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
        Suggestions de connexions
      </h3>
      <div className="space-y-3">
        {suggestions.slice(0, 5).map((suggestion: any) => (
          <div
            key={suggestion.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Link
              to="/u/$username"
              params={{ username: suggestion.username }}
              className="flex-shrink-0"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={suggestion.avatar_url || undefined} />
                <AvatarFallback>
                  {(suggestion.display_name || suggestion.username)?.[0]}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to="/u/$username"
                params={{ username: suggestion.username }}
                className="text-sm font-semibold hover:text-primary transition-colors truncate block"
              >
                {suggestion.display_name || suggestion.username}
              </Link>
              {suggestion.job_title && (
                <p className="text-xs text-muted-foreground truncate">{suggestion.job_title}</p>
              )}
              {suggestion.skills && suggestion.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestion.skills.slice(0, 2).map((skill: string) => (
                    <span
                      key={skill}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="flex-shrink-0"
              disabled={sentRequests.has(suggestion.id)}
              onClick={() => handleConnect(suggestion.id, suggestion.username)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              {sentRequests.has(suggestion.id) ? "Envoyée" : "Connecter"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
