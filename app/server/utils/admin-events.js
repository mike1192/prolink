import { io } from '../index.js';

// Fonction pour émettre des événements aux administrateurs connectés
export const emitToAdmins = (eventType, data) => {
  try {
    io.to('admin_room').emit('admin_update', {
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });
    console.log(`📡 Événement admin émis: ${eventType}`);
  } catch (error) {
    console.error('Erreur lors de l\'émission d\'événement admin:', error);
  }
};

// Types d'événements disponibles
export const ADMIN_EVENTS = {
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_LIKED: 'project_liked',
  COMMENT_CREATED: 'comment_created',
  STATS_UPDATED: 'stats_updated'
};