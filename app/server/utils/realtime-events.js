// Système d'événements temps réel pour synchroniser l'app principale avec le superadmin

let io = null;

// Initialiser le système d'événements avec l'instance Socket.IO
export const initRealTimeEvents = (socketIO) => {
  io = socketIO;
  console.log('✅ Système d\'événements temps réel initialisé');
};

// Émettre un événement vers tous les clients connectés
export const emitToAll = (eventType, data) => {
  if (!io) return;
  
  const event = {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  };
  
  io.emit('realtime_event', event);
  console.log(`📡 Événement diffusé: ${eventType}`);
};

// Émettre un événement vers un utilisateur spécifique
export const emitToUser = (userId, eventType, data) => {
  if (!io) return;
  
  const event = {
    type: eventType,
    data: { ...data, userId },
    timestamp: new Date().toISOString()
  };
  
  io.to(`user_${userId}`).emit('realtime_event', event);
  console.log(`📡 Événement envoyé à l'utilisateur ${userId}: ${eventType}`);
};

// Émettre un événement vers les admins seulement
export const emitToAdmins = (eventType, data) => {
  if (!io) return;
  
  const event = {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  };
  
  io.to('admin-room').emit('admin_update', event);
  console.log(`👑 Événement admin diffusé: ${eventType}`);
};

// Fonctions spécifiques pour chaque type d'événement

// Événements utilisateurs
export const notifyUserCreated = (user) => {
  emitToAll('user_created', user);
  emitToAdmins('user_created', user);
};

export const notifyUserUpdated = (user) => {
  emitToAll('user_updated', user);
  emitToAdmins('user_updated', user);
};

export const notifyUserDeleted = (userId) => {
  emitToAll('user_deleted', { userId });
  emitToAdmins('user_deleted', { userId });
};

// Événements projets
export const notifyProjectCreated = (project) => {
  emitToAll('project_created', project);
  emitToAdmins('project_created', project);
};

export const notifyProjectUpdated = (project) => {
  emitToAll('project_updated', project);
  emitToAdmins('project_updated', project);
};

export const notifyProjectDeleted = (projectId, ownerId) => {
  emitToAll('project_deleted', { projectId, ownerId });
  emitToAdmins('project_deleted', { projectId, ownerId });
};

export const notifyProjectLiked = (projectId, userId, likeCount) => {
  emitToAll('project_liked', { projectId, userId, likeCount });
  emitToAdmins('project_liked', { projectId, userId, likeCount });
};

// Événements commentaires
export const notifyCommentCreated = (comment) => {
  emitToAll('comment_created', comment);
  emitToAdmins('comment_created', comment);
  
  // Notifier le propriétaire du projet
  if (comment.projectOwnerId && comment.projectOwnerId !== comment.authorId) {
    emitToUser(comment.projectOwnerId, 'notification_created', {
      title: 'Nouveau commentaire',
      message: `${comment.authorName} a commenté votre projet "${comment.projectTitle}"`,
      type: 'comment',
      projectId: comment.projectId
    });
  }
};

export const notifyCommentDeleted = (commentId, projectId) => {
  emitToAll('comment_deleted', { commentId, projectId });
  emitToAdmins('comment_deleted', { commentId, projectId });
};

// Événements messages
export const notifyMessageSent = (message) => {
  // Envoyer à l'expéditeur et au destinataire
  emitToUser(message.senderId, 'message_sent', message);
  emitToUser(message.receiverId, 'message_sent', message);
  emitToAdmins('message_sent', message);
};

export const notifyMessageRead = (messageId, conversationId, userId) => {
  emitToAll('message_read', { messageId, conversationId, userId });
  emitToAdmins('message_read', { messageId, conversationId, userId });
};

// Événements notifications
export const notifyNotificationCreated = (notification) => {
  emitToUser(notification.userId, 'notification_created', notification);
  emitToAdmins('notification_created', notification);
};

export const notifyNotificationRead = (notificationId, userId) => {
  emitToUser(userId, 'notification_read', { notificationId });
  emitToAdmins('notification_read', { notificationId, userId });
};

// Événements connexions
export const notifyConnectionCreated = (connection) => {
  emitToUser(connection.requesterId, 'connection_created', connection);
  emitToUser(connection.requestedId, 'connection_created', connection);
  emitToAdmins('connection_created', connection);
  
  // Notifier le destinataire de la demande
  emitToUser(connection.requestedId, 'notification_created', {
    title: 'Nouvelle demande de connexion',
    message: `${connection.requesterName} souhaite se connecter avec vous`,
    type: 'connection_request',
    connectionId: connection.id
  });
};

export const notifyConnectionAccepted = (connection) => {
  emitToUser(connection.requesterId, 'connection_accepted', connection);
  emitToUser(connection.requestedId, 'connection_accepted', connection);
  emitToAdmins('connection_accepted', connection);
  
  // Notifier l'expéditeur que sa demande a été acceptée
  emitToUser(connection.requesterId, 'notification_created', {
    title: 'Connexion acceptée',
    message: `${connection.requestedName} a accepté votre demande de connexion`,
    type: 'connection_accepted',
    userId: connection.requestedId
  });
};

// Événements plateforme (depuis le superadmin)
export const notifyBrandingUpdated = (branding) => {
  emitToAll('branding_updated', branding);
  console.log('🎨 Configuration de branding mise à jour et diffusée');
};

export const notifyPlatformSettingsUpdated = (settings) => {
  emitToAll('platform_settings_updated', settings);
  emitToAdmins('platform_settings_updated', settings);
  console.log('⚙️ Paramètres de plateforme mis à jour et diffusés');
};

// Fonction pour rejoindre une room utilisateur
export const joinUserRoom = (socket, userId) => {
  socket.join(`user_${userId}`);
  console.log(`👤 Utilisateur ${userId} rejoint sa room`);
};

// Fonction pour quitter une room utilisateur
export const leaveUserRoom = (socket, userId) => {
  socket.leave(`user_${userId}`);
  console.log(`👤 Utilisateur ${userId} quitte sa room`);
};