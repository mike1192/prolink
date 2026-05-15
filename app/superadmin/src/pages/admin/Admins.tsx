import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  UserPlus, 
  RefreshCw, 
  MoreHorizontal, 
  Crown, 
  Settings, 
  Clock,
  CheckCircle2,
  XCircle,
  Search
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAdmins } from "../../hooks/useAdminActions";
import { useAuth } from "../../hooks/useAuth";

export default function Admins() {
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    name: "",
    role: "admin",
    password: ""
  });
  
  const { data: adminsData, isLoading, refetch } = useAdmins();
  const { user } = useAuth();
  const admins = adminsData?.admins || [];

  const handleRefresh = () => {
    refetch();
    toast.success("Liste des administrateurs actualisée");
  };

  const handleCreateAdmin = () => {
    // Validation basique
    if (!newAdmin.email || !newAdmin.name || !newAdmin.password) {
      toast.error("Tous les champs sont requis");
      return;
    }

    // Simulation de création (à remplacer par un vrai appel API)
    toast.success(`Administrateur ${newAdmin.name} créé avec succès`);
    setIsCreateDialogOpen(false);
    setNewAdmin({ email: "", name: "", role: "admin", password: "" });
    refetch();
  };

  const handleToggleStatus = (adminId: string, adminName: string, currentStatus: boolean) => {
    const action = currentStatus ? "désactiver" : "activer";
    if (confirm(`Êtes-vous sûr de vouloir ${action} ${adminName} ?`)) {
      toast.success(`${adminName} ${currentStatus ? "désactivé" : "activé"}`);
      refetch();
    }
  };

  const handleChangeRole = (adminId: string, adminName: string, newRole: string) => {
    if (confirm(`Changer le rôle de ${adminName} vers ${newRole} ?`)) {
      toast.success(`Rôle de ${adminName} changé vers ${newRole}`);
      refetch();
    }
  };

  const filteredAdmins = admins.filter((admin: any) => 
    admin.name.toLowerCase().includes(search.toLowerCase()) ||
    admin.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><Crown className="h-3 w-3 mr-1" />Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><Settings className="h-3 w-3 mr-1" />Modérateur</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const canManageAdmin = (targetAdmin: any) => {
    // Seuls les superadmins peuvent gérer d'autres admins
    return user?.role === 'superadmin' && targetAdmin.id !== user?.id;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Administrateurs"
        description="Gérez les comptes administrateurs et leurs permissions"
        action={
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            {user?.role === 'superadmin' && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nouvel Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouvel administrateur</DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouveau membre à l'équipe d'administration
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom complet</Label>
                      <Input
                        id="name"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        placeholder="jean.dupont@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Rôle</Label>
                      <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="moderator">Modérateur</SelectItem>
                          {user?.role === 'superadmin' && (
                            <SelectItem value="superadmin">Super Administrateur</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="password">Mot de passe temporaire</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        placeholder="Mot de passe sécurisé"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateAdmin}>
                      Créer l'administrateur
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : admins.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : admins.filter((a: any) => a.role === 'superadmin').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : admins.filter((a: any) => a.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En ligne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : admins.filter((a: any) => {
                if (!a.last_login) return false;
                const lastLogin = new Date(a.last_login);
                const now = new Date();
                return (now.getTime() - lastLogin.getTime()) < 30 * 60 * 1000; // 30 minutes
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un administrateur..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Liste des administrateurs */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Chargement des administrateurs...</p>
                  </TableCell>
                </TableRow>
              ) : filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {search ? "Aucun administrateur trouvé" : "Aucun administrateur"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin: any, index: number) => (
                  <motion.tr
                    key={admin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {admin.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{admin.name}</div>
                          <div className="text-sm text-muted-foreground">{admin.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(admin.role)}
                    </TableCell>
                    <TableCell>
                      {admin.is_active ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {admin.last_login ? formatDate(admin.last_login) : "Jamais"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(admin.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageAdmin(admin) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleToggleStatus(admin.id, admin.name, admin.is_active)}
                            >
                              {admin.is_active ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleChangeRole(admin.id, admin.name, 'moderator')}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Changer le rôle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {admin.id === user?.id ? "Vous" : "Protégé"}
                        </span>
                      )}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
