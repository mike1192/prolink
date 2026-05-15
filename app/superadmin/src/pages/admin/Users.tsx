import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, MoreHorizontal, Search, ShieldX, Ban, BadgeCheck, UserPlus, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { exportRowsAsCSV } from "@/lib/csv";
import { useUsers } from "@/hooks/useRealTimeData";
import { useUserActions } from "../../hooks/useAdminActions";
import { useQueryClient } from "@tanstack/react-query";

export default function Users() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended" | "banned" | "verified">("all");
  const queryClient = useQueryClient();
  
  const { data: usersData, isLoading, error } = useUsers();
  const { suspendUser, banUser, verifyUser } = useUserActions();
  const users = usersData?.users || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const handleSuspendUser = (userId: string, userName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir suspendre ${userName} ?`)) {
      suspendUser.mutate({ userId, reason: 'Suspendu par un administrateur' });
    }
  };

  const handleBanUser = (userId: string, userName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir bannir ${userName} ? Cette action est irréversible.`)) {
      banUser.mutate({ userId, reason: 'Banni par un administrateur' });
    }
  };

  const handleVerifyUser = (userId: string) => {
    verifyUser.mutate(userId);
  };

  const filtered = useMemo(() => users.filter(u => {
    const matchQ = (u.display_name || u.username || '').toLowerCase().includes(q.toLowerCase()) || 
                   u.email.toLowerCase().includes(q.toLowerCase());
    // Pour l'instant, on considère tous les utilisateurs comme actifs
    const matchF = filter === "all" || filter === "active";
    return matchQ && matchF;
  }), [q, filter, users]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const exportUsers = () => {
    exportRowsAsCSV(filtered, 'users.csv');
    toast.success('Export réussi');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Erreur lors du chargement des utilisateurs
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Gérez les comptes utilisateurs de la plateforme"
        action={
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={exportUsers} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'suspended', 'banned', 'verified'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Tous' : 
               f === 'active' ? 'Actifs' :
               f === 'suspended' ? 'Suspendus' :
               f === 'banned' ? 'Bannis' : 'Vérifiés'}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Compétences</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.display_name || user.username}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.skills?.slice(0, 3).map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {user.skills?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                    {user.verified && (
                      <Badge variant="outline" className="text-blue-600">
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!user.verified && (
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.id)}>
                          <BadgeCheck className="h-4 w-4 mr-2" />
                          Vérifier
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleSuspendUser(user.id, user.display_name || user.username)}
                        className="text-orange-600"
                      >
                        <ShieldX className="h-4 w-4 mr-2" />
                        Suspendre
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleBanUser(user.id, user.display_name || user.username)}
                        className="text-red-600"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Bannir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun utilisateur trouvé
        </div>
      )}
    </div>
  );
}
