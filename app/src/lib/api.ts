const API_BASE_URL = "http://localhost:3003/api";

// Helper to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

// Authentication API functions
export async function signupUser(data: {
  email: string;
  password: string;
  username: string;
  display_name: string;
  bio?: string;
  skills?: string[];
}) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de l'inscription");
  }

  return response.json();
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Identifiants invalides");
  }

  return response.json();
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Utilisateur non authentifié");
  }

  return response.json();
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  skills: string[];
  job_title?: string | null;
  location?: string | null;
  website?: string | null;
  github?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  theme?: "dark" | "light";
  notifications_enabled?: boolean;
  public_profile?: boolean;
  availability_status?: "ouvert" | "ferme" | "projets_uniquement";
  portfolio_images?: string[];
  verified_skills?: string[];
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  skills_needed: string[];
  project_type: string | null;
  images: string[] | null;
  created_at: string;
  owner: Profile | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author: Profile | null;
}

export async function fetchFeed(currentUserId: string | null): Promise<Project[]> {
  const url = currentUserId
    ? `${API_BASE_URL}/projects/feed?user_id=${currentUserId}`
    : `${API_BASE_URL}/projects/feed`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du feed");
  }

  return response.json();
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url: string | null;
  file_type: string | null;
  audio_url: string | null;
  audio_duration: number | null;
  conversation_id: string;
  is_read: boolean;
  read_at: string | null;
  is_pinned: boolean;
  forwarded_from: string | null;
  created_at: string;
  sender?: {
    id: string;
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

export async function sendMessage(
  receiver_id: string,
  content: string,
  token: string,
  file_url?: string | null,
  file_type?: string | null,
  audio_url?: string | null,
  audio_duration?: number | null,
) {
  const response = await fetch(`${API_BASE_URL}/messages/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receiver_id, content, file_url, file_type, audio_url, audio_duration }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Erreur lors de l'envoi du message");
  }

  return response.json();
}

export async function markConversationAsRead(otherUserId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/messages/conversation/${otherUserId}/read-all`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors du marquage des messages");
  }

  return response.json();
}

export async function searchMessages(
  otherUserId: string,
  query: string,
  token: string,
): Promise<Message[]> {
  const url = new URL(`${API_BASE_URL}/messages/conversation/${otherUserId}/search`);
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la recherche");
  }

  return response.json();
}

export async function addMessageReaction(messageId: string, emoji: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}/reactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ emoji }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'ajout de la réaction");
  }

  return response.json();
}

export async function fetchMessageReactions(messageId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}/reactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des réactions");
  }

  return response.json();
}

export async function updateMessage(messageId: string, content: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la modification du message");
  }

  return response.json();
}

export async function deleteMessage(messageId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la suppression du message");
  }

  return response.json();
}

export async function uploadAudio(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("audio", file);

  const response = await fetch(`${API_BASE_URL}/upload-audio`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'upload de l'audio");
  }

  return response.json();
}

export async function uploadFile(
  file: File,
  token: string,
): Promise<{
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'upload du fichier");
  }

  return response.json();
}

export async function searchAllMessages(query: string, token: string): Promise<Message[]> {
  const url = new URL(`${API_BASE_URL}/messages/search`);
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la recherche");
  }

  return response.json();
}

export async function pinMessage(messageId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}/pin`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'épinglage");
  }

  return response.json();
}

export async function unpinMessage(messageId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}/unpin`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors du désépinglage");
  }

  return response.json();
}

export async function forwardMessage(messageId: string, receiverId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/messages/${messageId}/forward`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receiver_id: receiverId }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la transfert");
  }

  return response.json();
}

// Upload image de couverture
export async function uploadCoverImage(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("cover", file);

  const response = await fetch(`${API_BASE_URL}/upload-cover`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de l'upload");
  }

  return response.json();
}

// Upload avatar
export async function uploadAvatarImage(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_BASE_URL}/upload-avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de l'upload");
  }

  return response.json();
}

export async function searchProjectsBySkill(
  skill: string,
  currentUserId: string | null,
): Promise<Project[]> {
  const url = currentUserId
    ? `${API_BASE_URL}/projects/search?skill=${encodeURIComponent(skill)}&user_id=${currentUserId}`
    : `${API_BASE_URL}/projects/search?skill=${encodeURIComponent(skill)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Erreur lors de la recherche de projets");
  }

  return response.json();
}

export async function toggleLike(projectId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors du like");
  }

  return response.json();
}

export async function createProject(
  input: {
    title: string;
    description: string;
    skills_needed: string[];
    project_type: string;
    images?: string[];
  },
  token: string,
) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la création du projet");
  }

  return response.json();
}

export async function fetchComments(projectId: string): Promise<Comment[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/comments`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des commentaires");
  }

  return response.json();
}

export async function addComment(
  projectId: string,
  content: string,
  token: string,
  parent_id?: string | null,
) {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, parent_id }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'ajout du commentaire");
  }

  return response.json();
}

export async function updateComment(commentId: string, content: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/projects/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la modification du commentaire");
  }

  return response.json();
}

export async function deleteComment(commentId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/projects/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la suppression du commentaire");
  }

  return response.json();
}

export async function fetchProfile(username: string): Promise<Profile | null> {
  const response = await fetch(`${API_BASE_URL}/profile/${username}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Erreur lors de la récupération du profil");
  }

  return response.json();
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const response = await fetch(`${API_BASE_URL}/profile/id/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Erreur lors de la récupération du profil");
  }

  return response.json();
}

export async function fetchUserProjects(ownerId: string): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects/user/${ownerId}`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des projets");
  }

  return response.json();
}

export async function updateProfile(
  userId: string,
  patch: Partial<
    Pick<
      Profile,
      | "display_name"
      | "bio"
      | "skills"
      | "job_title"
      | "location"
      | "website"
      | "github"
      | "twitter"
      | "linkedin"
    >
  >,
  token: string,
) {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...patch, token }),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la mise à jour du profil");
  }

  return response.json();
}

export async function updateUserPreferences(
  preferences: {
    theme?: "dark" | "light";
    notifications_enabled?: boolean;
    public_profile?: boolean;
  },
  token: string,
) {
  const response = await fetch(`${API_BASE_URL}/auth/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la mise à jour des préférences");
  }

  return response.json();
}

export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "reply" | "follow" | "project_update";
  title: string;
  message: string;
  project_id: string | null;
  sender_id: string | null;
  is_read: boolean;
  created_at: string;
  sender: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export async function fetchNotifications(
  token: string,
  page = 1,
  limit = 20,
  unreadOnly = false,
): Promise<{
  notifications: Notification[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
}> {
  const url = new URL(`${API_BASE_URL}/notifications`);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("limit", limit.toString());
  if (unreadOnly) url.searchParams.set("unread_only", "true");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des notifications");
  }

  return response.json();
}

export async function markNotificationAsRead(notificationId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors du marquage de la notification");
  }

  return response.json();
}

export async function markAllNotificationsAsRead(token: string) {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors du marquage des notifications");
  }

  return response.json();
}

export async function deleteNotification(notificationId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la suppression de la notification");
  }

  return response.json();
}

// ============ CONNECTIONS ============

export interface Connection {
  id: string;
  user: {
    id: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    job_title: string | null;
    location: string | null;
  };
  created_at: string;
}

export async function sendConnectionRequest(receiverId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/connections/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receiver_id: receiverId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de l'envoi de la demande");
  }

  return response.json();
}

export async function acceptConnectionRequest(connectionId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/connections/accept/${connectionId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'acceptation de la demande");
  }

  return response.json();
}

export async function rejectConnectionRequest(connectionId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/connections/reject/${connectionId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors du refus de la demande");
  }

  return response.json();
}

export async function removeConnection(connectionId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/connections/${connectionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la suppression de la connexion");
  }

  return response.json();
}

export async function fetchConnections(userId: string): Promise<Connection[]> {
  const response = await fetch(`${API_BASE_URL}/connections/user/${userId}`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des connexions");
  }

  return response.json();
}

export async function fetchPendingRequests(token: string): Promise<Connection[]> {
  const response = await fetch(`${API_BASE_URL}/connections/pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des demandes");
  }

  return response.json();
}

export async function checkConnectionStatus(otherUserId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/connections/status/${otherUserId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la vérification du statut");
  }

  return response.json();
}

export async function fetchConnectionSuggestions(token: string) {
  const response = await fetch(`${API_BASE_URL}/connections/suggestions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des suggestions");
  }

  return response.json();
}

export async function fetchMutualConnections(otherUserId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/connections/mutual/${otherUserId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des relations en commun");
  }

  return response.json();
}

// ============ MESSAGES ============

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  conversation_id: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface Conversation {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export async function fetchConversations(token: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des conversations");
  }

  return response.json();
}

export async function fetchConversation(otherUserId: string, token: string): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/messages/conversation/${otherUserId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des messages");
  }

  return response.json();
}

export async function fetchUnreadMessageCount(token: string): Promise<{ unread_count: number }> {
  const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération du compteur");
  }

  return response.json();
}

// ============ BOOKMARKS ============

export async function toggleBookmark(projectId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/bookmarks/${projectId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la sauvegarde du projet");
  }

  return response.json();
}

export async function fetchBookmarks(token: string): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/bookmarks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des bookmarks");
  }

  return response.json();
}
