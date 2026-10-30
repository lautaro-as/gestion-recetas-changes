import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  Recipe,
  RecipeComment,
  CartItem,
  ModerationReport,
  ForumTopic,
  ForumReply,
  AppNotification,
  RecipeCollection,
  Ingredient,
  SubProfile,
  DietaryTag,
  RecipeStatus
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_RECIPES,
  INITIAL_COMMENTS,
  INITIAL_FORUM_TOPICS,
  INITIAL_FORUM_REPLIES,
  INITIAL_REPORTS,
  INITIAL_COLLECTIONS,
  INITIAL_NOTIFICATIONS
} from '../data/seedData';
import { downloadRecipePdf } from '../utils/recipePdfGenerator';
import { downloadWeeklyPlannerPdf, downloadRecipePackagePdf } from '../utils/weeklyPlannerPdfGenerator';

interface AppContextType {
  // Authentication & Users
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  switchUserRole: (role: UserRole) => void;
  selectSpecificUser: (userId: string) => void;
  loginUser: (email: string) => boolean;
  loginUserWithPassword: (email: string, password: string, remember30Days?: boolean) => { success: boolean; message: string };
  quickLoginAsUser: (userId: string, remember30Days?: boolean) => void;
  registerUser: (name: string, email: string, role: UserRole) => void;
  registerNewUser: (params: {
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
    password: string;
  }) => { success: boolean; message: string };
  updateUserRole: (userId: string, newRole: UserRole) => void;
  logoutUser: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  addSubProfile: (name: string, relation: string, dietaryRestrictions: DietaryTag[]) => void;
  switchActiveSubProfile: (subProfileId: string | null) => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string };
  followUserToggle: (targetUserId: string) => void;
  
  // Recipes
  recipes: Recipe[];
  createRecipe: (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'dislikesCount' | 'likedUserIds' | 'dislikedUserIds' | 'commentsCount'>) => string;
  updateRecipe: (id: string, recipeData: Partial<Recipe>) => boolean;
  deleteRecipe: (id: string) => boolean;
  togglePinRecipe: (recipeId: string) => void;
  toggleLikeRecipe: (recipeId: string) => void;
  toggleDislikeRecipe: (recipeId: string) => void;
  publishScheduledNow: (recipeId: string) => void;
  changeRecipeStatus: (recipeId: string, newStatus: RecipeStatus, scheduledDate?: string) => void;
  
  // Comments
  comments: RecipeComment[];
  addComment: (recipeId: string, content: string, parentCommentId?: string) => void;
  editComment: (commentId: string, newContent: string) => void;
  deleteComment: (commentId: string) => void;
  toggleCommentVote: (commentId: string, type: 'like' | 'dislike') => void;
  
  // Recipe Comparison
  comparingRecipeIds: string[];
  toggleCompareRecipe: (recipeId: string) => void;
  clearCompareRecipes: () => void;

  // Shopping Cart & Ingredients
  cart: CartItem[];
  addRecipeIngredientsToCart: (recipe: Recipe, selectedIngredientIds?: string[]) => void;
  togglePantryItem: (cartItemId: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  selectedStoreFilter: string;
  setSelectedStoreFilter: (store: string) => void;

  // Wishlist & Collections
  toggleWishlist: (recipeId: string) => void;
  collections: RecipeCollection[];
  createCollection: (name: string, description: string, recipeIds: string[], isPrivate?: boolean) => void;
  toggleRecipeInCollection: (collectionId: string, recipeId: string) => void;

  // Moderation & Reports
  reports: ModerationReport[];
  submitReport: (targetType: 'recipe' | 'profile', targetId: string, titleOrName: string, reason: ModerationReport['reason'], details: string) => void;
  resolveReport: (reportId: string, resolution: 'removed' | 'dismissed') => void;

  // Forum (Community Discussions)
  forumTopics: ForumTopic[];
  forumReplies: ForumReply[];
  createForumTopic: (category: ForumTopic['category'], title: string, content: string, tags: string[]) => string;
  createForumReply: (topicId: string, content: string) => void;
  toggleForumReplyLike: (replyId: string) => void;
  toggleForumReplyVote: (replyId: string, type: 'like' | 'dislike') => void;
  editForumReply: (replyId: string, content: string) => void;
  deleteForumReply: (replyId: string) => void;
  markBestAnswer: (replyId: string) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Print & Export
  printableRecipe: Recipe | null;
  setPrintableRecipe: (recipe: Recipe | null) => void;
  recipeToConfirmDownload: Recipe | null;
  setRecipeToConfirmDownload: (recipe: Recipe | null) => void;
  executeDownloadRecipePdf: (recipeOverride?: Recipe) => void;
  exportRecipePdf: (recipe: Recipe) => void;
  exportRecipeJson: (recipe: Recipe) => void;
  exportRecipeText: (recipe: Recipe) => void;
  exportCollectionPackage: (collection: RecipeCollection) => void;
  getFamousWeeklyRecipes: () => Recipe[];
  exportWeeklyPlannerPdf: () => boolean;
  exportRecipePackagePdf: (collection?: RecipeCollection) => boolean;

  // Toast System
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  USERS: 'gusto_users_v1',
  CURRENT_USER_ID: 'gusto_current_user_id_v1',
  REMEMBER_EXPIRES: 'gusto_remember_expires_v1',
  IS_LOGGED_OUT: 'gusto_is_logged_out_v1',
  RECIPES: 'gusto_recipes_v1',
  COMMENTS: 'gusto_comments_v1',
  CART: 'gusto_cart_v1',
  REPORTS: 'gusto_reports_v1',
  COLLECTIONS: 'gusto_collections_v1',
  TOPICS: 'gusto_topics_v1',
  REPLIES: 'gusto_replies_v1',
  NOTIFICATIONS: 'gusto_notifications_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to Seed Data
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const explicitlyLoggedOut = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_OUT) === 'true';
    if (explicitlyLoggedOut) return false;

    const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!savedId) return false;

    const expiresStr = localStorage.getItem(STORAGE_KEYS.REMEMBER_EXPIRES);
    if (expiresStr) {
      const exp = parseInt(expiresStr, 10);
      if (Date.now() > exp) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_EXPIRES);
        return false;
      }
    }
    return true;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const explicitlyLoggedOut = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_OUT) === 'true';
    if (explicitlyLoggedOut) return '';

    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'user-mateo';
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
    if (!saved) return INITIAL_RECIPES;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_RECIPES;
      return parsed;
    } catch {
      return INITIAL_RECIPES;
    }
  });

  const [comments, setComments] = useState<RecipeComment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (!saved) return INITIAL_COMMENTS;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_COMMENTS;
      return parsed.map((c: RecipeComment) => ({
        ...c,
        baseLikes: c.baseLikes ?? c.likes ?? 0,
        baseDislikes: c.baseDislikes ?? 0,
        likedUserIds: c.likedUserIds || [],
        dislikedUserIds: c.dislikedUserIds || []
      }));
    } catch {
      return INITIAL_COMMENTS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  const [reports, setReports] = useState<ModerationReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!saved) return INITIAL_REPORTS;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_REPORTS;
      return parsed;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [collections, setCollections] = useState<RecipeCollection[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [forumTopics, setForumTopics] = useState<ForumTopic[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TOPICS);
    return saved ? JSON.parse(saved) : INITIAL_FORUM_TOPICS;
  });

  const [forumReplies, setForumReplies] = useState<ForumReply[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REPLIES);
    if (!saved) return INITIAL_FORUM_REPLIES;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_FORUM_REPLIES;
      return parsed.map((r: ForumReply) => ({
        ...r,
        baseLikes: r.baseLikes ?? r.likesCount ?? 0,
        baseDislikes: r.baseDislikes ?? 0,
        likedUserIds: r.likedUserIds || [],
        dislikedUserIds: r.dislikedUserIds || []
      }));
    } catch {
      return INITIAL_FORUM_REPLIES;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [comparingRecipeIds, setComparingRecipeIds] = useState<string[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('Todas');
  const [printableRecipe, setPrintableRecipe] = useState<Recipe | null>(null);
  const [recipeToConfirmDownload, setRecipeToConfirmDownload] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(forumTopics));
  }, [forumTopics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPLIES, JSON.stringify(forumReplies));
  }, [forumReplies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Check scheduled recipes periodically and auto-publish when due
  useEffect(() => {
    const checkScheduled = () => {
      const now = Date.now();
      let hasChanges = false;
      const publishedList: Recipe[] = [];

      setRecipes(prev => {
        const next = prev.map(r => {
          if (
            r.status === 'scheduled' &&
            r.scheduledPublishDate &&
            new Date(r.scheduledPublishDate).getTime() <= now
          ) {
            hasChanges = true;
            const updated: Recipe = {
              ...r,
              status: 'published',
              updatedAt: new Date().toISOString()
            };
            publishedList.push(updated);
            return updated;
          }
          return r;
        });
        return hasChanges ? next : prev;
      });

      if (publishedList.length > 0) {
        const newNotifs: AppNotification[] = publishedList.map(r => ({
          id: `notif-sched-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: r.authorId,
          title: 'Receta programada publicada',
          message: `Tu receta programada "${r.title}" ha sido publicada automáticamente en la comunidad.`,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'scheduled_published',
          linkTarget: r.id
        }));
        setNotifications(prev => [...newNotifs, ...prev]);
      }
    };

    checkScheduled();
    const interval = setInterval(checkScheduled, 15000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(prev => prev === msg ? null : prev);
    }, 4000);
  };

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Role quick switch
  const switchUserRole = (role: UserRole) => {
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      setIsAuthenticated(true);
      localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);
      showToast(`Sesión cambiada a perfil: ${targetUser.name} (${targetUser.role.toUpperCase()})`);
    }
  };

  const selectSpecificUser = (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (u) {
      setCurrentUserId(u.id);
      setIsAuthenticated(true);
      localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);
      showToast(`Sesión activa: ${u.name}`);
    }
  };

  // 1-Click login for preloaded seeder accounts without password
  const quickLoginAsUser = (userId: string, remember30Days = true) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setIsAuthenticated(true);
      localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);

      if (remember30Days) {
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
        localStorage.setItem(STORAGE_KEYS.REMEMBER_EXPIRES, expiresAt.toString());
      } else {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_EXPIRES);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      }
      showToast(`¡Sesión iniciada con cuenta predeterminada: ${target.name}!`);
    }
  };

  // Login with email and password with optional 30-day device remember
  const loginUserWithPassword = (
    email: string,
    password: string,
    remember30Days = false
  ): { success: boolean; message: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return {
        success: false,
        message: 'No existe ninguna cuenta registrada con este correo electrónico.'
      };
    }

    if (found.password && found.password !== password) {
      return {
        success: false,
        message: 'La contraseña ingresada no es válida. Por favor verifica tus credenciales.'
      };
    }

    setCurrentUserId(found.id);
    setIsAuthenticated(true);
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);

    if (remember30Days) {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
      localStorage.setItem(STORAGE_KEYS.REMEMBER_EXPIRES, expiresAt.toString());
    } else {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_EXPIRES);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }

    showToast(`¡Bienvenido de vuelta, ${found.name}!`);
    return { success: true, message: `Sesión iniciada como ${found.name}` };
  };

  const loginUser = (email: string) => {
    const res = loginUserWithPassword(email, 'password123', true);
    return res.success;
  };

  // Register new user with firstName, lastName, email, gender, password and default role 'usuario'
  const registerNewUser = (params: {
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
    password: string;
  }): { success: boolean; message: string } => {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanFirst = params.firstName.trim();
    const cleanLast = params.lastName.trim();

    if (!cleanFirst || !cleanLast || !cleanEmail || !params.password) {
      return { success: false, message: 'Por favor completa todos los campos requeridos.' };
    }

    const emailExists = users.some(u => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return {
        success: false,
        message: 'Ya existe una cuenta registrada con este correo electrónico. Por favor inicia sesión.'
      };
    }

    const fullName = `${cleanFirst} ${cleanLast}`;
    const cleanUsername = `${cleanFirst.toLowerCase().replace(/[^a-z0-9]/g, '')}_${cleanLast.toLowerCase().replace(/[^a-z0-9]/g, '')}` || `usuario_${Date.now()}`;

    // Default avatar image uploaded by user
    const avatar = '/assets/aistudio/default_avatar_b96d7689.jpg';

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: fullName,
      firstName: cleanFirst,
      lastName: cleanLast,
      gender: params.gender,
      username: cleanUsername,
      email: cleanEmail,
      password: params.password,
      avatar,
      role: 'usuario', // Rol asignado por defecto: usuario
      bio: 'Nuevo aficionado a la cocina y miembro activo de la comunidad Gusto.',
      specialties: ['Cocina Casera'],
      dietaryPreferences: [],
      subprofiles: [],
      followersCount: 0,
      followingUserIds: ['user-mateo', 'user-lucia'],
      wishlistRecipeIds: [],
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);

    showToast(`¡Cuenta creada con éxito! Bienvenido a Gusto, ${cleanFirst} (Rol: Usuario).`);
    return { success: true, message: 'Usuario registrado con éxito.' };
  };

  const registerUser = (name: string, email: string, role: UserRole) => {
    const parts = name.trim().split(' ');
    const firstName = parts[0] || 'Usuario';
    const lastName = parts.slice(1).join(' ') || 'Gusto';
    registerNewUser({
      firstName,
      lastName,
      email,
      gender: 'Prefiero no decirlo',
      password: 'password123'
    });
    if (role !== 'usuario') {
      updateUserRole(currentUserId, role);
    }
  };

  // Moderator / Admin role assignment
  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    const targetUser = users.find(u => u.id === userId);
    showToast(`Rol de ${targetUser?.name || 'usuario'} actualizado a ${newRole.toUpperCase()}.`);
  };

  // Logout clears session, flags explicitly logged out, and redirects to auth landing page
  const logoutUser = () => {
    setIsAuthenticated(false);
    setCurrentUserId('');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_EXPIRES);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_OUT, 'true');
    showToast('Sesión cerrada correctamente. Hasta pronto.');
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
    showToast('Perfil actualizado con éxito.');
  };

  const addSubProfile = (name: string, relation: string, dietaryRestrictions: DietaryTag[]) => {
    const newSub: SubProfile = {
      id: `sub-${Date.now()}`,
      name,
      relation,
      avatarColor: 'bg-amber-600',
      dietaryRestrictions
    };
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          subprofiles: [...u.subprofiles, newSub]
        };
      }
      return u;
    }));
    showToast(`Subperfil familiar "${name}" agregado.`);
  };

  const switchActiveSubProfile = (subProfileId: string | null) => {
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, activeSubProfileId: subProfileId };
      }
      return u;
    }));
    if (subProfileId) {
      const sub = currentUser.subprofiles.find(s => s.id === subProfileId);
      showToast(`Filtros adaptados al subperfil: ${sub?.name}`);
    } else {
      showToast('Restaurado a perfil principal.');
    }
  };

  const requestPasswordReset = (email: string) => {
    return {
      success: true,
      message: `Enlace seguro de restablecimiento enviado a ${email}.`
    };
  };

  const followUserToggle = (targetUserId: string) => {
    const isFollowing = currentUser.followingUserIds.includes(targetUserId);
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const nextFollowing = isFollowing
          ? u.followingUserIds.filter(id => id !== targetUserId)
          : [...u.followingUserIds, targetUserId];
        return { ...u, followingUserIds: nextFollowing };
      }
      if (u.id === targetUserId) {
        return {
          ...u,
          followersCount: isFollowing ? Math.max(0, u.followersCount - 1) : u.followersCount + 1
        };
      }
      return u;
    }));
    
    if (!isFollowing) {
      // Add notification to target user
      const targetUser = users.find(u => u.id === targetUserId);
      if (targetUser) {
        const notif: AppNotification = {
          id: `notif-${Date.now()}`,
          userId: targetUserId,
          title: 'Nuevo seguidor',
          message: `${currentUser.name} ha comenzado a seguir tu perfil de cocina.`,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'follow'
        };
        setNotifications(prev => [notif, ...prev]);
      }
      showToast('¡Ahora sigues a este creador!');
    } else {
      showToast('Has dejado de seguir a este perfil.');
    }
  };

  // Recipe Operations
  const createRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'dislikesCount' | 'likedUserIds' | 'dislikedUserIds' | 'commentsCount'>) => {
    const newId = `rec-${Date.now()}`;
    const newRecipe: Recipe = {
      ...recipeData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likesCount: 0,
      dislikesCount: 0,
      likedUserIds: [],
      dislikedUserIds: [],
      commentsCount: 0,
    };
    setRecipes(prev => [newRecipe, ...prev]);

    if (newRecipe.status === 'scheduled') {
      showToast(`Receta "${newRecipe.title}" programada para el ${new Date(newRecipe.scheduledPublishDate || '').toLocaleDateString('es-ES')}.`);
    } else if (newRecipe.status === 'draft') {
      showToast(`Borrador de "${newRecipe.title}" guardado en tu perfil personal.`);
    } else {
      showToast(`¡Receta "${newRecipe.title}" publicada en la comunidad!`);
    }
    return newId;
  };

  const updateRecipe = (id: string, recipeData: Partial<Recipe>): boolean => {
    const target = recipes.find(r => r.id === id);
    if (!target) {
      showToast('La receta que intentas modificar no existe o ha sido eliminada.');
      return false;
    }

    // Permission validation: author, co-author, editor, or admin
    const isAuthor = target.authorId === currentUser.id;
    const isCoAuthor = Boolean(target.coAuthors && target.coAuthors.some(ca =>
      ca.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      ca.toLowerCase().includes(currentUser.username.toLowerCase()) ||
      (ca.startsWith('@') && ca.slice(1).toLowerCase() === currentUser.username.toLowerCase())
    ));
    const isStaff = currentUser.role === 'admin' || currentUser.role === 'editor';
    const canEdit = isAuthor || isCoAuthor || isStaff;

    if (!canEdit) {
      showToast('No tienes permisos suficientes para modificar esta receta.');
      return false;
    }

    // Status & integrity restrictions
    let sanitizedData = { ...recipeData };

    if (target.status === 'published') {
      // Published recipe restrictions:
      // Preserve original author identity, publication timestamp, and community metrics
      sanitizedData = {
        ...sanitizedData,
        authorId: target.authorId,
        authorName: target.authorName,
        authorAvatar: target.authorAvatar,
        createdAt: target.createdAt,
        likesCount: target.likesCount,
        dislikesCount: target.dislikesCount,
        likedUserIds: target.likedUserIds,
        dislikedUserIds: target.dislikedUserIds,
        commentsCount: target.commentsCount,
        // Published recipes maintain published status unless staff explicitly changes it
        status: isStaff && sanitizedData.status ? sanitizedData.status : 'published'
      };
    }

    setRecipes(prev => prev.map(r => r.id === id ? {
      ...r,
      ...sanitizedData,
      updatedAt: new Date().toISOString()
    } : r));

    if (target.status === 'draft') {
      if (sanitizedData.status === 'published') {
        showToast(`¡Borrador "${sanitizedData.title || target.title}" publicado con éxito en el catálogo!`);
      } else if (sanitizedData.status === 'scheduled') {
        showToast(`Borrador "${sanitizedData.title || target.title}" programado para publicación automática.`);
      } else {
        showToast(`Borrador "${sanitizedData.title || target.title}" guardado correctamente.`);
      }
    } else {
      showToast(`Receta "${sanitizedData.title || target.title}" actualizada correctamente.`);
    }

    return true;
  };

  const deleteRecipe = (id: string) => {
    const target = recipes.find(r => r.id === id);
    if (!target) {
      showToast('La receta solicitada no existe o ya ha sido eliminada.');
      return false;
    }

    // Check permissions: author, editor, or admin
    const canDelete = currentUser.role === 'admin' || currentUser.role === 'editor' || target.authorId === currentUser.id;
    if (!canDelete) {
      showToast('No tienes permisos suficientes para eliminar esta receta.');
      return false;
    }

    // 1. Remove recipe from state
    setRecipes(prev => prev.filter(r => r.id !== id));
    // 2. Remove ingredients from shopping cart
    setCart(prev => prev.filter(c => c.recipeId !== id));
    // 3. Remove from compare list
    setComparingRecipeIds(prev => prev.filter(cid => cid !== id));
    // 4. Remove comments belonging to this recipe
    setComments(prev => prev.filter(c => c.recipeId !== id));
    // 5. Remove from collections
    setCollections(prev => prev.map(col => ({
      ...col,
      recipeIds: col.recipeIds.filter(rid => rid !== id)
    })));
    // 6. Remove from users' pinned recipe and wishlists
    setUsers(prev => prev.map(u => ({
      ...u,
      pinnedRecipeId: u.pinnedRecipeId === id ? undefined : u.pinnedRecipeId,
      wishlistRecipeIds: u.wishlistRecipeIds.filter(wid => wid !== id)
    })));
    // 7. Clear printable recipe if it's the deleted one
    setPrintableRecipe(prev => prev?.id === id ? null : prev);
    // 8. Update any pending moderation reports for this recipe
    setReports(prev => prev.map(rep => {
      if (rep.targetType === 'recipe' && rep.targetId === id && rep.status === 'pending') {
        return { ...rep, status: 'resolved_removed' };
      }
      return rep;
    }));

    showToast(`Receta "${target.title}" eliminada con éxito.`);
    return true;
  };

  const togglePinRecipe = (recipeId: string) => {
    const target = recipes.find(r => r.id === recipeId);
    if (!target) return;
    
    // Check permission: author or editor or admin
    if (target.authorId !== currentUser.id && currentUser.role !== 'editor' && currentUser.role !== 'admin') {
      showToast('Solo los autores o editores pueden fijar recetas en el perfil.');
      return;
    }

    const nextState = !target.isPinned;
    setRecipes(prev => prev.map(r => {
      if (r.id === recipeId) {
        return { ...r, isPinned: nextState };
      }
      // If pinning a new recipe, unpin any other recipe by this author
      if (nextState && r.authorId === target.authorId && r.isPinned) {
        return { ...r, isPinned: false };
      }
      return r;
    }));

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, pinnedRecipeId: nextState ? recipeId : undefined };
      }
      return u;
    }));

    showToast(nextState ? 'Receta fijada en la parte superior de tu perfil.' : 'Receta desfijada del perfil.');
  };

  const toggleLikeRecipe = (recipeId: string) => {
    const targetRecipe = recipes.find(r => r.id === recipeId);
    const wasAlreadyLiked = targetRecipe ? targetRecipe.likedUserIds.includes(currentUser.id) : false;

    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const alreadyLiked = r.likedUserIds.includes(currentUser.id);
      const alreadyDisliked = r.dislikedUserIds.includes(currentUser.id);

      const nextLiked = alreadyLiked
        ? r.likedUserIds.filter(id => id !== currentUser.id)
        : [...r.likedUserIds, currentUser.id];
      const nextDisliked = alreadyDisliked
        ? r.dislikedUserIds.filter(id => id !== currentUser.id)
        : r.dislikedUserIds;

      const diffLikes = alreadyLiked ? -1 : 1;
      const diffDislikes = alreadyDisliked ? -1 : 0;

      return {
        ...r,
        likedUserIds: nextLiked,
        dislikedUserIds: nextDisliked,
        likesCount: Math.max(0, (r.likesCount ?? 0) + diffLikes),
        dislikesCount: Math.max(0, (r.dislikesCount ?? 0) + diffDislikes)
      };
    }));

    // If adding a like (not unliking), notify the recipe owner
    if (!wasAlreadyLiked && targetRecipe) {
      const notif: AppNotification = {
        id: `notif-like-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: targetRecipe.authorId,
        title: '¡A alguien le gustó tu receta!',
        message: `A ${currentUser.name} le ha gustado tu receta "${targetRecipe.title}".`,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'like',
        linkTarget: recipeId
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const toggleDislikeRecipe = (recipeId: string) => {
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const alreadyLiked = r.likedUserIds.includes(currentUser.id);
      const alreadyDisliked = r.dislikedUserIds.includes(currentUser.id);

      const nextDisliked = alreadyDisliked
        ? r.dislikedUserIds.filter(id => id !== currentUser.id)
        : [...r.dislikedUserIds, currentUser.id];
      const nextLiked = alreadyLiked
        ? r.likedUserIds.filter(id => id !== currentUser.id)
        : r.likedUserIds;

      const diffDislikes = alreadyDisliked ? -1 : 1;
      const diffLikes = alreadyLiked ? -1 : 0;

      return {
        ...r,
        likedUserIds: nextLiked,
        dislikedUserIds: nextDisliked,
        likesCount: Math.max(0, (r.likesCount ?? 0) + diffLikes),
        dislikesCount: Math.max(0, (r.dislikesCount ?? 0) + diffDislikes)
      };
    }));
  };

  const publishScheduledNow = (recipeId: string) => {
    changeRecipeStatus(recipeId, 'published');
  };

  const changeRecipeStatus = (recipeId: string, newStatus: RecipeStatus, scheduledDate?: string) => {
    const target = recipes.find(r => r.id === recipeId);
    if (!target) return;

    let isoScheduled: string | undefined = undefined;
    if (newStatus === 'scheduled') {
      try {
        const d = scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 86400000 * 3);
        isoScheduled = isNaN(d.getTime()) ? new Date(Date.now() + 86400000 * 3).toISOString() : d.toISOString();
      } catch {
        isoScheduled = new Date(Date.now() + 86400000 * 3).toISOString();
      }
    }

    setRecipes(prev => prev.map(r => {
      if (r.id === recipeId) {
        return {
          ...r,
          status: newStatus,
          scheduledPublishDate: isoScheduled,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    }));

    if (newStatus === 'published') {
      const notif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: target.authorId,
        title: 'Receta publicada',
        message: `Tu receta "${target.title}" ha sido publicada exitosamente en el catálogo.`,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'scheduled_published',
        linkTarget: target.id
      };
      setNotifications(prev => [notif, ...prev]);
      showToast(`¡Receta "${target.title}" publicada en la comunidad!`);
    } else if (newStatus === 'draft') {
      showToast(`Receta "${target.title}" guardada como borrador privado.`);
    } else if (newStatus === 'scheduled') {
      showToast(`Receta "${target.title}" programada para publicación automática.`);
    }
  };

  // Comments
  const addComment = (recipeId: string, content: string, parentCommentId?: string) => {
    if (!content.trim()) return;
    const newComment: RecipeComment = {
      id: `comm-${Date.now()}`,
      recipeId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likedUserIds: [],
      dislikedUserIds: [],
      parentCommentId
    };
    setComments(prev => [...prev, newComment]);
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, commentsCount: r.commentsCount + 1 } : r));

    // Send notification to recipe owner
    const targetRecipe = recipes.find(r => r.id === recipeId);
    if (targetRecipe) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        userId: targetRecipe.authorId,
        title: 'Nuevo comentario en tu receta',
        message: `${currentUser.name} ha comentado en tu receta "${targetRecipe.title}".`,
        createdAt: new Date().toISOString(),
        read: false,
        type: 'comment',
        linkTarget: recipeId
      };
      setNotifications(prev => [notif, ...prev]);
    }

    // If replying to another comment, also notify parent comment author if different
    if (parentCommentId) {
      const parentComment = comments.find(c => c.id === parentCommentId);
      if (parentComment && parentComment.authorId !== currentUser.id && parentComment.authorId !== targetRecipe?.authorId) {
        const replyNotif: AppNotification = {
          id: `notif-reply-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: parentComment.authorId,
          title: 'Respuesta a tu comentario',
          message: `${currentUser.name} respondió a tu comentario en "${targetRecipe?.title || 'una receta'}".`,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'comment',
          linkTarget: recipeId
        };
        setNotifications(prev => [replyNotif, ...prev]);
      }
    }

    showToast('Comentario publicado en la receta.');
  };

  const editComment = (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          content: newContent.trim(),
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
    showToast('Comentario editado correctamente.');
  };

  const deleteComment = (commentId: string) => {
    const target = comments.find(c => c.id === commentId);
    if (!target) return;
    setComments(prev => prev.filter(c => c.id !== commentId && c.parentCommentId !== commentId));
    setRecipes(prev => prev.map(r => {
      if (r.id === target.recipeId) {
        return { ...r, commentsCount: Math.max(0, r.commentsCount - 1) };
      }
      return r;
    }));
    showToast('Comentario eliminado.');
  };

  const toggleCommentVote = (commentId: string, type: 'like' | 'dislike') => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;

      const baseLikes = c.baseLikes !== undefined
        ? c.baseLikes
        : (c.likedUserIds && c.likedUserIds.length > 0 ? Math.max(0, (c.likes ?? 0) - c.likedUserIds.length) : (c.likes ?? 0));
      const baseDislikes = c.baseDislikes ?? 0;

      const likedList = c.likedUserIds || [];
      const dislikedList = c.dislikedUserIds || [];
      const isLiked = likedList.includes(currentUser.id);
      const isDisliked = dislikedList.includes(currentUser.id);

      let nextLiked = [...likedList];
      let nextDisliked = [...dislikedList];

      if (type === 'like') {
        if (isLiked) {
          nextLiked = nextLiked.filter(id => id !== currentUser.id);
        } else {
          nextLiked.push(currentUser.id);
          nextDisliked = nextDisliked.filter(id => id !== currentUser.id);
        }
      } else {
        if (isDisliked) {
          nextDisliked = nextDisliked.filter(id => id !== currentUser.id);
        } else {
          nextDisliked.push(currentUser.id);
          nextLiked = nextLiked.filter(id => id !== currentUser.id);
        }
      }

      return {
        ...c,
        baseLikes,
        baseDislikes,
        likedUserIds: nextLiked,
        dislikedUserIds: nextDisliked,
        likes: baseLikes + nextLiked.length
      };
    }));
  };

  // Recipe Comparison
  const toggleCompareRecipe = (recipeId: string) => {
    if (comparingRecipeIds.includes(recipeId)) {
      setComparingRecipeIds(prev => prev.filter(id => id !== recipeId));
      showToast('Receta retirada del comparador.');
    } else {
      if (comparingRecipeIds.length >= 3) {
        showToast('Puedes comparar hasta un máximo de 3 recetas a la vez.');
        return;
      }
      setComparingRecipeIds(prev => [...prev, recipeId]);
      showToast('Receta añadida al comparador lado a lado.');
    }
  };

  const clearCompareRecipes = () => {
    setComparingRecipeIds([]);
  };

  // Shopping Cart & Ingredients
  const addRecipeIngredientsToCart = (recipe: Recipe, selectedIngredientIds?: string[]) => {
    const ingsToAdd = selectedIngredientIds 
      ? recipe.ingredients.filter(ing => selectedIngredientIds.includes(ing.id))
      : recipe.ingredients;

    const newItems: CartItem[] = ingsToAdd.map(ing => ({
      id: `cart-${recipe.id}-${ing.id}-${Date.now()}`,
      ingredient: ing,
      recipeTitle: recipe.title,
      recipeId: recipe.id,
      quantityNeeded: ing.quantity,
      haveInPantry: false,
      storeName: ing.storeName
    }));

    setCart(prev => [...prev, ...newItems]);
    showToast(`${newItems.length} ingredientes de "${recipe.title}" agregados al carrito virtual.`);
  };

  const togglePantryItem = (cartItemId: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const next = !item.haveInPantry;
        return { ...item, haveInPantry: next };
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(c => c.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    showToast('Carrito de compras vaciado.');
  };

  // Wishlist & Collections
  const toggleWishlist = (recipeId: string) => {
    const inWishlist = currentUser.wishlistRecipeIds.includes(recipeId);
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          wishlistRecipeIds: inWishlist
            ? u.wishlistRecipeIds.filter(id => id !== recipeId)
            : [...u.wishlistRecipeIds, recipeId]
        };
      }
      return u;
    }));
    showToast(inWishlist ? 'Eliminado de tu lista de deseos.' : 'Guardado en tu lista de deseos para cocinar luego.');
  };

  const createCollection = (name: string, description: string, recipeIds: string[], isPrivate = false) => {
    const newCol: RecipeCollection = {
      id: `col-${Date.now()}`,
      name,
      description,
      userId: currentUser.id,
      recipeIds,
      isPrivate,
      coverImage: recipes.find(r => recipeIds.includes(r.id))?.coverImage
    };
    setCollections(prev => [newCol, ...prev]);
    showToast(`Colección personal "${name}" creada.`);
  };

  const toggleRecipeInCollection = (collectionId: string, recipeId: string) => {
    setCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        const exists = c.recipeIds.includes(recipeId);
        const nextIds = exists ? c.recipeIds.filter(id => id !== recipeId) : [...c.recipeIds, recipeId];
        return { ...c, recipeIds: nextIds };
      }
      return c;
    }));
    showToast('Colección actualizada.');
  };

  // Moderation
  const submitReport = (targetType: 'recipe' | 'profile', targetId: string, titleOrName: string, reason: ModerationReport['reason'], details: string) => {
    const newReport: ModerationReport = {
      id: `rep-mod-${Date.now()}`,
      targetType,
      targetId,
      targetTitleOrName: titleOrName,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reason,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setReports(prev => [newReport, ...prev]);
    showToast('Tu reporte ha sido enviado a los moderadores. Gracias por mantener la comunidad segura.');
  };

  const resolveReport = (reportId: string, resolution: 'removed' | 'dismissed') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // Permissions: admin or editor
    if (currentUser.role !== 'admin' && currentUser.role !== 'editor') {
      showToast('No tienes permisos de moderación para realizar esta acción.');
      return;
    }

    if (resolution === 'removed') {
      if (report.targetType === 'recipe') {
        const recipeId = report.targetId;
        // Cascade delete recipe
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
        setCart(prev => prev.filter(c => c.recipeId !== recipeId));
        setComparingRecipeIds(prev => prev.filter(cid => cid !== recipeId));
        setComments(prev => prev.filter(c => c.recipeId !== recipeId));
        setCollections(prev => prev.map(col => ({
          ...col,
          recipeIds: col.recipeIds.filter(rid => rid !== recipeId)
        })));
        setUsers(prev => prev.map(u => ({
          ...u,
          pinnedRecipeId: u.pinnedRecipeId === recipeId ? undefined : u.pinnedRecipeId,
          wishlistRecipeIds: u.wishlistRecipeIds.filter(wid => wid !== recipeId)
        })));
        setPrintableRecipe(prev => prev?.id === recipeId ? null : prev);
      } else {
        setUsers(prev => prev.map(u => u.id === report.targetId ? { ...u, isBanned: true } : u));
      }
    }

    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      status: resolution === 'removed' ? 'resolved_removed' : 'dismissed'
    } : r));

    showToast(
      resolution === 'removed'
        ? (report.targetType === 'recipe' ? `Receta "${report.targetTitleOrName}" eliminada de la plataforma.` : 'Perfil suspendido y reporte resuelto.')
        : 'Reporte desestimado: el contenido se mantendrá activo.'
    );
  };

  // Forum
  const createForumTopic = (category: ForumTopic['category'], title: string, content: string, tags: string[]) => {
    const newId = `top-${Date.now()}`;
    const newTopic: ForumTopic = {
      id: newId,
      category,
      title,
      content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      createdAt: new Date().toISOString(),
      repliesCount: 0,
      viewsCount: 1,
      tags
    };
    setForumTopics(prev => [newTopic, ...prev]);
    showToast(`Hilo de debate "${title}" iniciado en el foro.`);
    return newId;
  };

  const createForumReply = (topicId: string, content: string) => {
    if (!content.trim()) return;
    const newReply: ForumReply = {
      id: `rep-${Date.now()}`,
      topicId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      baseLikes: 0,
      baseDislikes: 0,
      likesCount: 0,
      likedUserIds: [],
      dislikedUserIds: []
    };
    setForumReplies(prev => [...prev, newReply]);
    setForumTopics(prev => prev.map(t => t.id === topicId ? { ...t, repliesCount: t.repliesCount + 1 } : t));
    showToast('Respuesta publicada en el debate.');
  };

  const toggleForumReplyLike = (replyId: string) => {
    toggleForumReplyVote(replyId, 'like');
  };

  const toggleForumReplyVote = (replyId: string, type: 'like' | 'dislike') => {
    setForumReplies(prev => prev.map(r => {
      if (r.id !== replyId) return r;

      const baseLikes = r.baseLikes !== undefined
        ? r.baseLikes
        : (r.likedUserIds && r.likedUserIds.length > 0 ? Math.max(0, (r.likesCount ?? 0) - r.likedUserIds.length) : (r.likesCount ?? 0));
      const baseDislikes = r.baseDislikes ?? 0;

      const likedList = r.likedUserIds || [];
      const dislikedList = r.dislikedUserIds || [];
      const isLiked = likedList.includes(currentUser.id);
      const isDisliked = dislikedList.includes(currentUser.id);

      let nextLiked = [...likedList];
      let nextDisliked = [...dislikedList];

      if (type === 'like') {
        if (isLiked) {
          nextLiked = nextLiked.filter(id => id !== currentUser.id);
        } else {
          nextLiked.push(currentUser.id);
          nextDisliked = nextDisliked.filter(id => id !== currentUser.id);
        }
      } else {
        if (isDisliked) {
          nextDisliked = nextDisliked.filter(id => id !== currentUser.id);
        } else {
          nextDisliked.push(currentUser.id);
          nextLiked = nextLiked.filter(id => id !== currentUser.id);
        }
      }

      return {
        ...r,
        baseLikes,
        baseDislikes,
        likedUserIds: nextLiked,
        dislikedUserIds: nextDisliked,
        likesCount: baseLikes + nextLiked.length
      };
    }));
  };

  const editForumReply = (replyId: string, content: string) => {
    if (!content.trim()) return;
    setForumReplies(prev => prev.map(r => r.id === replyId ? { ...r, content: content.trim(), updatedAt: new Date().toISOString() } : r));
    showToast('Respuesta editada correctamente.');
  };

  const deleteForumReply = (replyId: string) => {
    const target = forumReplies.find(r => r.id === replyId);
    if (!target) return;
    setForumReplies(prev => prev.filter(r => r.id !== replyId));
    setForumTopics(prev => prev.map(t => t.id === target.topicId ? { ...t, repliesCount: Math.max(0, t.repliesCount - 1) } : t));
    showToast('Respuesta eliminada.');
  };

  const markBestAnswer = (replyId: string) => {
    setForumReplies(prev => prev.map(r => ({
      ...r,
      isBestAnswer: r.id === replyId ? !r.isBestAnswer : false
    })));
    showToast('Respuesta destacada de la comunidad actualizada.');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
    showToast('Todas tus notificaciones marcadas como leídas.');
  };

  // Exporting & Printing
  const exportRecipePdf = (recipe: Recipe) => {
    // Prompt confirmation dialog before downloading
    setRecipeToConfirmDownload(recipe);
  };

  const executeDownloadRecipePdf = (recipeOverride?: Recipe) => {
    const target = recipeOverride || recipeToConfirmDownload;
    if (!target) return;
    try {
      downloadRecipePdf(target);
      showToast(`Receta "${target.title}" descargada en formato PDF.`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      showToast('Error al generar el PDF de la receta.');
    } finally {
      setRecipeToConfirmDownload(null);
    }
  };

  const exportRecipeJson = (recipe: Recipe) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(recipe, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${recipe.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Receta "${recipe.title}" exportada en formato JSON.`);
  };

  const exportRecipeText = (recipe: Recipe) => {
    const textContent = `
========================================
${recipe.title.toUpperCase()}
========================================
Por: ${recipe.authorName} ${recipe.coAuthors.length > 0 ? `| Co-autores: ${recipe.coAuthors.join(', ')}` : ''}
Dificultad: ${recipe.difficulty} | Porciones: ${recipe.servings}
Tiempo: Prep ${recipe.prepTimeMin} min | Cocción ${recipe.cookTimeMin} min
Categoría: ${recipe.category}
Etiquetas: ${recipe.tags.join(', ')}

DESCRIPCIÓN:
${recipe.description}

INFORMACIÓN NUTRICIONAL (Por porción):
Calorías: ${recipe.nutrition.calories} kcal | Proteínas: ${recipe.nutrition.proteinG}g
Carbohidratos: ${recipe.nutrition.carbsG}g | Grasas: ${recipe.nutrition.fatG}g | Fibra: ${recipe.nutrition.fiberG}g

INGREDIENTES:
${recipe.ingredients.map(ing => `- ${ing.quantity} ${ing.unit} de ${ing.name} (Tienda: ${ing.storeName})`).join('\n')}

PASO A PASO:
${recipe.steps.map(s => `${s.stepNumber}. ${s.title} (${s.durationMinutes} min)\n   ${s.description}${s.tip ? `\n   Consejo: ${s.tip}` : ''}`).join('\n\n')}

Gusto - Sistema de Gestión de Recetas.
    `.trim();

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${recipe.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Tarjeta de lectura rápida exportada.`);
  };

  const getFamousWeeklyRecipes = (): Recipe[] => {
    return [...recipes]
      .filter((r) => r.status === 'published')
      .sort((a, b) => b.likesCount - a.likesCount);
  };

  const exportWeeklyPlannerPdf = (): boolean => {
    const isPremiumOrAdmin = currentUser.role === 'premium' || currentUser.role === 'admin';
    if (!isPremiumOrAdmin) {
      showToast('Exclusivo para usuarios Premium: Activa tu membresía Premium en Mi perfil para descargar el Planificador Semanal en formato .PDF');
      return false;
    }
    const famous = getFamousWeeklyRecipes();
    downloadWeeklyPlannerPdf({
      famousRecipes: famous.length > 0 ? famous : recipes,
      currentUser,
      weekTitle: 'Planificador Semanal Gourmet Gusto'
    });
    showToast('Planificador semanal exportado exitosamente en formato .PDF');
    return true;
  };

  const exportRecipePackagePdf = (collection?: RecipeCollection): boolean => {
    const isPremiumOrAdmin = currentUser.role === 'premium' || currentUser.role === 'admin';
    if (!isPremiumOrAdmin) {
      showToast('Exclusivo para usuarios Premium: Activa tu membresía Premium en Mi perfil para exportar paquetes de recetas en formato .PDF');
      return false;
    }

    if (collection) {
      const collectedRecipes = recipes.filter((r) => collection.recipeIds.includes(r.id));
      if (collectedRecipes.length === 0) {
        showToast('Esta colección aún no tiene recetas agregadas.');
        return false;
      }
      downloadRecipePackagePdf({
        packageName: collection.name,
        description: collection.description || 'Colección privada seleccionada de recetas.',
        recipes: collectedRecipes,
        curatedBy: currentUser.name,
      });
      showToast(`Paquete culinario "${collection.name}" exportado exitosamente en formato .PDF`);
      return true;
    }

    // Default package: Recetas más famosas de la semana
    const famous = getFamousWeeklyRecipes();
    const targetRecipes = famous.slice(0, 7);
    downloadRecipePackagePdf({
      packageName: 'Las Recetas Más Famosas de la Semana',
      description: 'Edición exclusiva con las preparaciones más aclamadas y votadas por la comunidad culinaria de Gusto.',
      recipes: targetRecipes,
      curatedBy: currentUser.name,
    });
    showToast('Paquete de recetas más famosas exportado exitosamente en formato .PDF');
    return true;
  };

  const exportCollectionPackage = (collection: RecipeCollection) => {
    exportRecipePackagePdf(collection);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        currentUser,
        allUsers: users,
        switchUserRole,
        selectSpecificUser,
        loginUser,
        loginUserWithPassword,
        quickLoginAsUser,
        registerUser,
        registerNewUser,
        updateUserRole,
        logoutUser,
        updateUserProfile,
        addSubProfile,
        switchActiveSubProfile,
        requestPasswordReset,
        followUserToggle,

        recipes,
        createRecipe,
        updateRecipe,
        deleteRecipe,
        togglePinRecipe,
        toggleLikeRecipe,
        toggleDislikeRecipe,
        publishScheduledNow,
        changeRecipeStatus,

        comments,
        addComment,
        editComment,
        deleteComment,
        toggleCommentVote,

        comparingRecipeIds,
        toggleCompareRecipe,
        clearCompareRecipes,

        cart,
        addRecipeIngredientsToCart,
        togglePantryItem,
        removeFromCart,
        clearCart,
        selectedStoreFilter,
        setSelectedStoreFilter,

        toggleWishlist,
        collections,
        createCollection,
        toggleRecipeInCollection,

        reports,
        submitReport,
        resolveReport,

        forumTopics,
        forumReplies,
        createForumTopic,
        createForumReply,
        toggleForumReplyLike,
        toggleForumReplyVote,
        editForumReply,
        deleteForumReply,
        markBestAnswer,

        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        printableRecipe,
        setPrintableRecipe,
        recipeToConfirmDownload,
        setRecipeToConfirmDownload,
        executeDownloadRecipePdf,
        exportRecipePdf,
        exportRecipeJson,
        exportRecipeText,
        exportCollectionPackage,
        getFamousWeeklyRecipes,
        exportWeeklyPlannerPdf,
        exportRecipePackagePdf,

        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
