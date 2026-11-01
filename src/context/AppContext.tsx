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
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { db, auth, googleProvider, testConnection } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/firestoreErrors';

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
  loginWithGoogle: () => Promise<boolean>;
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

  // Firebase status
  isFirebaseReady: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'gusto_current_user_id_v1',
  REMEMBER_EXPIRES: 'gusto_remember_expires_v1',
  IS_LOGGED_OUT: 'gusto_is_logged_out_v1',
  CART: 'gusto_cart_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const explicitlyLoggedOut = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_OUT) === 'true';
    if (explicitlyLoggedOut) return false;

    const rememberExpires = localStorage.getItem(STORAGE_KEYS.REMEMBER_EXPIRES);
    if (rememberExpires) {
      const expiresAt = parseInt(rememberExpires, 10);
      if (Date.now() > expiresAt) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_EXPIRES);
        return false;
      }
    }

    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return Boolean(savedUserId);
  });

  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const explicitlyLoggedOut = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_OUT) === 'true';
    if (explicitlyLoggedOut) return '';
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-mateo';
  });

  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [comments, setComments] = useState<RecipeComment[]>(INITIAL_COMMENTS);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>(INITIAL_FORUM_TOPICS);
  const [forumReplies, setForumReplies] = useState<ForumReply[]>(INITIAL_FORUM_REPLIES);
  const [reports, setReports] = useState<ModerationReport[]>(INITIAL_REPORTS);
  const [collections, setCollections] = useState<RecipeCollection[]>(INITIAL_COLLECTIONS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  const [comparingRecipeIds, setComparingRecipeIds] = useState<string[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('Todas');
  const [printableRecipe, setPrintableRecipe] = useState<Recipe | null>(null);
  const [recipeToConfirmDownload, setRecipeToConfirmDownload] = useState<Recipe | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Sync cart to local storage (cart is local to device/shopping trip)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  // Sync current user ID
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    }
  }, [currentUserId]);

  // -------------------------------------------------------------
  // FIREBASE INITIALIZATION & REAL-TIME SNAPSHOT LISTENERS
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Mandatory test connection check as per Skill directive
    testConnection();

    // 2. Auth State Observer
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setCurrentUserId(fbUser.uid);
        setIsAuthenticated(true);
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);

        // Ensure user document exists in Firestore
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const isAdminEmail = fbUser.email === 'medilautaro06@gmail.com' || fbUser.email === 'admin@gusto.app';
            const newProfile: UserProfile = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cocinero Gusto',
              firstName: fbUser.displayName?.split(' ')[0] || 'Cocinero',
              lastName: fbUser.displayName?.split(' ').slice(1).join(' ') || '',
              username: (fbUser.email?.split('@')[0] || 'usuario').replace(/[^a-zA-Z0-9_]/g, ''),
              email: fbUser.email || '',
              avatar: fbUser.photoURL || '/assets/aistudio/default_avatar_b96d7689.jpg',
              role: isAdminEmail ? 'admin' : 'usuario',
              bio: 'Miembro de la comunidad gastronómica Gusto.',
              specialties: ['Cocina Casera'],
              dietaryPreferences: [],
              subprofiles: [],
              followersCount: 0,
              followingUserIds: ['user-mateo'],
              wishlistRecipeIds: []
            };
            await setDoc(userRef, newProfile);
          }
        } catch (err) {
          console.warn('Error reading or setting user doc in Firestore:', err);
        }
      }
    });

    // 3. Recipes Snapshot Listener
    const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as Recipe);
        setRecipes(list);
      } else {
        // Initial seeding if empty
        INITIAL_RECIPES.forEach(rec => {
          setDoc(doc(db, 'recipes', rec.id), rec).catch(e => console.warn('Recipe seeding:', e));
        });
      }
      setIsFirebaseReady(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'recipes');
    });

    // 4. Users Snapshot Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as UserProfile);
        setUsers(list);
      } else {
        INITIAL_USERS.forEach(u => {
          setDoc(doc(db, 'users', u.id), u).catch(e => console.warn('User seeding:', e));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    // 5. Comments Snapshot Listener
    const unsubComments = onSnapshot(collection(db, 'recipe_comments'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as RecipeComment);
        setComments(list);
      } else {
        INITIAL_COMMENTS.forEach(c => {
          setDoc(doc(db, 'recipe_comments', c.id), c).catch(e => console.warn('Comment seeding:', e));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'recipe_comments');
    });

    // 6. Forum Topics Snapshot Listener
    const unsubTopics = onSnapshot(collection(db, 'forum_topics'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as ForumTopic);
        setForumTopics(list);
      } else {
        INITIAL_FORUM_TOPICS.forEach(t => {
          setDoc(doc(db, 'forum_topics', t.id), t).catch(e => console.warn('Topic seeding:', e));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'forum_topics');
    });

    // 7. Forum Replies Snapshot Listener
    const unsubReplies = onSnapshot(collection(db, 'forum_replies'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as ForumReply);
        setForumReplies(list);
      } else {
        INITIAL_FORUM_REPLIES.forEach(r => {
          setDoc(doc(db, 'forum_replies', r.id), r).catch(e => console.warn('Reply seeding:', e));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'forum_replies');
    });

    // 8. Moderation Reports Snapshot Listener
    const unsubReports = onSnapshot(collection(db, 'moderation_reports'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as ModerationReport);
        setReports(list);
      } else {
        INITIAL_REPORTS.forEach(rep => {
          setDoc(doc(db, 'moderation_reports', rep.id), rep).catch(e => console.warn('Report seeding:', e));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'moderation_reports');
    });

    // 9. Collections Snapshot Listener
    const unsubCollections = onSnapshot(collection(db, 'recipe_collections'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as RecipeCollection);
        setCollections(list);
      } else {
        INITIAL_COLLECTIONS.forEach(col => {
          setDoc(doc(db, 'recipe_collections', col.id), col).catch(e => console.warn('Collection seeding:', e));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'recipe_collections');
    });

    // 10. Notifications Snapshot Listener
    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as AppNotification);
        setNotifications(list);
      } else {
        INITIAL_NOTIFICATIONS.forEach(notif => {
          setDoc(doc(db, 'notifications', notif.id), notif).catch(e => console.warn('Notification seeding:', e));
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    return () => {
      unsubAuth();
      unsubRecipes();
      unsubUsers();
      unsubComments();
      unsubTopics();
      unsubReplies();
      unsubReports();
      unsubCollections();
      unsubNotifications();
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(prev => prev === msg ? null : prev);
    }, 4000);
  };

  const currentUser: UserProfile = users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];

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

  // 1-Click login for preloaded seeder accounts
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

  // Firebase Google Auth Login
  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        const fbUser = cred.user;
        const userRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userRef);
        let profile = snap.exists() ? (snap.data() as UserProfile) : null;
        if (!profile) {
          const isAdminEmail = fbUser.email === 'medilautaro06@gmail.com' || fbUser.email === 'admin@gusto.app';
          profile = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cocinero Gusto',
            firstName: fbUser.displayName?.split(' ')[0] || 'Cocinero',
            lastName: fbUser.displayName?.split(' ').slice(1).join(' ') || '',
            username: (fbUser.email?.split('@')[0] || 'usuario').replace(/[^a-zA-Z0-9_]/g, ''),
            email: fbUser.email || '',
            avatar: fbUser.photoURL || '/assets/aistudio/default_avatar_b96d7689.jpg',
            role: isAdminEmail ? 'admin' : 'usuario',
            bio: 'Miembro activo de la comunidad gastronómica Gusto en Firebase.',
            specialties: ['Cocina Casera'],
            dietaryPreferences: [],
            subprofiles: [],
            followersCount: 0,
            followingUserIds: ['user-mateo'],
            wishlistRecipeIds: []
          };
          await setDoc(userRef, profile);
        }
        setCurrentUserId(fbUser.uid);
        setIsAuthenticated(true);
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);
        showToast(`¡Bienvenido a Gusto, ${profile.name}! (Firebase Auth)`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      showToast('No se pudo completar el inicio de sesión con Google.');
      return false;
    }
  };

  // Login with email and password
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

  // Register new user & persist in Firestore
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
      role: 'usuario',
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

    // Save to Firestore
    setDoc(doc(db, 'users', newUser.id), newUser).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `users/${newUser.id}`)
    );

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

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    const targetUser = users.find(u => u.id === userId);
    setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`)
    );
    showToast(`Rol de ${targetUser?.name || 'usuario'} actualizado a ${newRole.toUpperCase()}.`);
  };

  const logoutUser = () => {
    signOut(auth).catch(console.error);
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
    setDoc(doc(db, 'users', currentUser.id), data, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`)
    );
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
    const nextSubs = [...currentUser.subprofiles, newSub];
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, subprofiles: nextSubs } : u));
    setDoc(doc(db, 'users', currentUser.id), { subprofiles: nextSubs }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`)
    );
    showToast(`Subperfil familiar "${name}" agregado.`);
  };

  const switchActiveSubProfile = (subProfileId: string | null) => {
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, activeSubProfileId: subProfileId } : u)));
    setDoc(doc(db, 'users', currentUser.id), { activeSubProfileId: subProfileId }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`)
    );
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
    const nextFollowing = isFollowing
      ? currentUser.followingUserIds.filter(id => id !== targetUserId)
      : [...currentUser.followingUserIds, targetUserId];

    const targetUser = users.find(u => u.id === targetUserId);
    const nextFollowersCount = targetUser
      ? (isFollowing ? Math.max(0, targetUser.followersCount - 1) : targetUser.followersCount + 1)
      : 0;

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) return { ...u, followingUserIds: nextFollowing };
      if (u.id === targetUserId) return { ...u, followersCount: nextFollowersCount };
      return u;
    }));

    // Persist in Firestore
    setDoc(doc(db, 'users', currentUser.id), { followingUserIds: nextFollowing }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`)
    );
    setDoc(doc(db, 'users', targetUserId), { followersCount: nextFollowersCount }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUserId}`)
    );

    if (!isFollowing) {
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
        setDoc(doc(db, 'notifications', notif.id), notif).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `notifications/${notif.id}`)
        );
      }
      showToast('¡Ahora sigues a este creador!');
    } else {
      showToast('Has dejado de seguir a este perfil.');
    }
  };

  // -------------------------------------------------------------
  // RECIPES OPERATIONS (FIRESTORE PERSISTENT)
  // -------------------------------------------------------------
  const createRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'dislikesCount' | 'likedUserIds' | 'dislikedUserIds' | 'commentsCount'>) => {
    const newId = `rec-${Date.now()}`;
    const now = new Date().toISOString();
    const newRecipe: Recipe = {
      ...recipeData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      likesCount: 0,
      dislikesCount: 0,
      likedUserIds: [],
      dislikedUserIds: [],
      commentsCount: 0
    };

    setRecipes(prev => [newRecipe, ...prev]);

    // Persist in Firestore
    setDoc(doc(db, 'recipes', newId), newRecipe).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `recipes/${newId}`)
    );

    if (newRecipe.status === 'published') {
      showToast(`¡Receta "${newRecipe.title}" publicada en el catálogo!`);
    } else if (newRecipe.status === 'scheduled') {
      showToast(`Receta "${newRecipe.title}" programada para publicación.`);
    } else {
      showToast(`Borrador "${newRecipe.title}" guardado.`);
    }
    return newId;
  };

  const updateRecipe = (id: string, recipeData: Partial<Recipe>): boolean => {
    const target = recipes.find(r => r.id === id);
    if (!target) {
      showToast('La receta que intentas modificar no existe o ha sido eliminada.');
      return false;
    }

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

    let sanitizedData = { ...recipeData };
    if (target.status === 'published') {
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
        status: isStaff && sanitizedData.status ? sanitizedData.status : 'published'
      };
    }

    const updatedRecipe: Recipe = {
      ...target,
      ...sanitizedData,
      updatedAt: new Date().toISOString()
    };

    setRecipes(prev => prev.map(r => r.id === id ? updatedRecipe : r));

    // Persist in Firestore
    setDoc(doc(db, 'recipes', id), updatedRecipe, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `recipes/${id}`)
    );

    showToast(`Receta "${updatedRecipe.title}" actualizada en Firestore.`);
    return true;
  };

  const deleteRecipe = (id: string) => {
    const target = recipes.find(r => r.id === id);
    if (!target) {
      showToast('La receta solicitada no existe o ya ha sido eliminada.');
      return false;
    }

    const canDelete = currentUser.role === 'admin' || currentUser.role === 'editor' || target.authorId === currentUser.id;
    if (!canDelete) {
      showToast('No tienes permisos suficientes para eliminar esta receta.');
      return false;
    }

    setRecipes(prev => prev.filter(r => r.id !== id));
    setCart(prev => prev.filter(c => c.recipeId !== id));
    setComparingRecipeIds(prev => prev.filter(cid => cid !== id));
    setComments(prev => prev.filter(c => c.recipeId !== id));

    // Delete in Firestore
    deleteDoc(doc(db, 'recipes', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `recipes/${id}`)
    );

    showToast(`Receta "${target.title}" eliminada de la base de datos.`);
    return true;
  };

  const togglePinRecipe = (recipeId: string) => {
    const target = recipes.find(r => r.id === recipeId);
    if (!target) return;
    
    if (target.authorId !== currentUser.id && currentUser.role !== 'editor' && currentUser.role !== 'admin') {
      showToast('Solo los autores o editores pueden fijar recetas en el perfil.');
      return;
    }

    const nextState = !target.isPinned;
    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, isPinned: nextState } : r));
    setDoc(doc(db, 'recipes', recipeId), { isPinned: nextState }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `recipes/${recipeId}`)
    );

    showToast(nextState ? 'Receta fijada en tu perfil.' : 'Receta desfijada del perfil.');
  };

  const toggleLikeRecipe = (recipeId: string) => {
    const targetRecipe = recipes.find(r => r.id === recipeId);
    const wasAlreadyLiked = targetRecipe ? targetRecipe.likedUserIds.includes(currentUser.id) : false;

    let updatedRecipe: Recipe | null = null;
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const isLiked = r.likedUserIds.includes(currentUser.id);
      const isDisliked = r.dislikedUserIds.includes(currentUser.id);

      let nextLiked = [...r.likedUserIds];
      let nextDisliked = [...r.dislikedUserIds];

      if (isLiked) {
        nextLiked = nextLiked.filter(id => id !== currentUser.id);
      } else {
        nextLiked.push(currentUser.id);
        nextDisliked = nextDisliked.filter(id => id !== currentUser.id);
      }

      updatedRecipe = {
        ...r,
        likesCount: nextLiked.length,
        dislikesCount: nextDisliked.length,
        likedUserIds: nextLiked,
        dislikedUserIds: nextDisliked
      };
      return updatedRecipe;
    }));

    if (updatedRecipe) {
      const rec = updatedRecipe as Recipe;
      setDoc(doc(db, 'recipes', recipeId), {
        likesCount: rec.likesCount,
        dislikesCount: rec.dislikesCount,
        likedUserIds: rec.likedUserIds,
        dislikedUserIds: rec.dislikedUserIds
      }, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `recipes/${recipeId}`)
      );
    }

    if (!wasAlreadyLiked) {
      showToast('¡Has valorado positivamente esta receta!');
    } else {
      showToast('Valoración retirada.');
    }
  };

  const toggleDislikeRecipe = (recipeId: string) => {
    let updatedRecipe: Recipe | null = null;
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const isLiked = r.likedUserIds.includes(currentUser.id);
      const isDisliked = r.dislikedUserIds.includes(currentUser.id);

      let nextLiked = [...r.likedUserIds];
      let nextDisliked = [...r.dislikedUserIds];

      if (isDisliked) {
        nextDisliked = nextDisliked.filter(id => id !== currentUser.id);
      } else {
        nextDisliked.push(currentUser.id);
        nextLiked = nextLiked.filter(id => id !== currentUser.id);
      }

      updatedRecipe = {
        ...r,
        likesCount: nextLiked.length,
        dislikesCount: nextDisliked.length,
        likedUserIds: nextLiked,
        dislikedUserIds: nextDisliked
      };
      return updatedRecipe;
    }));

    if (updatedRecipe) {
      const rec = updatedRecipe as Recipe;
      setDoc(doc(db, 'recipes', recipeId), {
        likesCount: rec.likesCount,
        dislikesCount: rec.dislikesCount,
        likedUserIds: rec.likedUserIds,
        dislikedUserIds: rec.dislikedUserIds
      }, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `recipes/${recipeId}`)
      );
    }
  };

  const publishScheduledNow = (recipeId: string) => {
    const target = recipes.find(r => r.id === recipeId);
    if (!target) return;
    if (target.authorId !== currentUser.id && currentUser.role !== 'admin' && currentUser.role !== 'editor') {
      showToast('Solo el autor o moderadores pueden publicar esta receta programada.');
      return;
    }

    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, status: 'published', scheduledPublishDate: undefined } : r));
    setDoc(doc(db, 'recipes', recipeId), { status: 'published', scheduledPublishDate: null }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `recipes/${recipeId}`)
    );
    showToast(`¡Receta "${target.title}" publicada en el catálogo comunitario!`);
  };

  const changeRecipeStatus = (recipeId: string, newStatus: RecipeStatus, scheduledDate?: string) => {
    const target = recipes.find(r => r.id === recipeId);
    if (!target) return;

    setRecipes(prev => prev.map(r => r.id === recipeId ? {
      ...r,
      status: newStatus,
      scheduledPublishDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined
    } : r));

    setDoc(doc(db, 'recipes', recipeId), {
      status: newStatus,
      scheduledPublishDate: scheduledDate ? new Date(scheduledDate).toISOString() : null
    }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `recipes/${recipeId}`)
    );

    showToast(`Estado de receta cambiado a ${newStatus.toUpperCase()}`);
  };

  // -------------------------------------------------------------
  // COMMENTS & RATINGS (FIRESTORE PERSISTENT)
  // -------------------------------------------------------------
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

    // Save to Firestore
    setDoc(doc(db, 'recipe_comments', newComment.id), newComment).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `recipe_comments/${newComment.id}`)
    );

    // Update recipe commentsCount in Firestore
    const targetRecipe = recipes.find(r => r.id === recipeId);
    if (targetRecipe) {
      setDoc(doc(db, 'recipes', recipeId), { commentsCount: targetRecipe.commentsCount + 1 }, { merge: true }).catch(console.warn);
    }

    showToast('Comentario guardado en Firestore.');
  };

  const editComment = (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: newContent.trim(), updatedAt: new Date().toISOString() } : c));
    setDoc(doc(db, 'recipe_comments', commentId), { content: newContent.trim(), updatedAt: new Date().toISOString() }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `recipe_comments/${commentId}`)
    );
    showToast('Comentario editado.');
  };

  const deleteComment = (commentId: string) => {
    const target = comments.find(c => c.id === commentId);
    if (!target) return;
    setComments(prev => prev.filter(c => c.id !== commentId && c.parentCommentId !== commentId));
    setRecipes(prev => prev.map(r => r.id === target.recipeId ? { ...r, commentsCount: Math.max(0, r.commentsCount - 1) } : r));

    deleteDoc(doc(db, 'recipe_comments', commentId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `recipe_comments/${commentId}`)
    );
    showToast('Comentario eliminado de Firestore.');
  };

  const toggleCommentVote = (commentId: string, type: 'like' | 'dislike') => {
    let nextComment: RecipeComment | null = null;
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const baseLikes = c.baseLikes ?? 0;
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

      nextComment = {
        ...c,
        baseLikes,
        baseDislikes,
        likedUserIds: nextLiked,
        dislikedUserIds: nextDisliked,
        likes: baseLikes + nextLiked.length
      };
      return nextComment;
    }));

    if (nextComment) {
      const comm = nextComment as RecipeComment;
      setDoc(doc(db, 'recipe_comments', commentId), {
        likes: comm.likes,
        likedUserIds: comm.likedUserIds,
        dislikedUserIds: comm.dislikedUserIds
      }, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `recipe_comments/${commentId}`)
      );
    }
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
    showToast(`${newItems.length} ingredientes de "${recipe.title}" agregados al carrito.`);
  };

  const togglePantryItem = (cartItemId: string) => {
    setCart(prev => prev.map(item => item.id === cartItemId ? { ...item, haveInPantry: !item.haveInPantry } : item));
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
    const nextList = inWishlist
      ? currentUser.wishlistRecipeIds.filter(id => id !== recipeId)
      : [...currentUser.wishlistRecipeIds, recipeId];

    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, wishlistRecipeIds: nextList } : u));
    setDoc(doc(db, 'users', currentUser.id), { wishlistRecipeIds: nextList }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.id}`)
    );

    showToast(inWishlist ? 'Eliminado de tu lista de deseos.' : 'Guardado en tu lista de deseos.');
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
    setDoc(doc(db, 'recipe_collections', newCol.id), newCol).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `recipe_collections/${newCol.id}`)
    );
    showToast(`Colección personal "${name}" creada en Firestore.`);
  };

  const toggleRecipeInCollection = (collectionId: string, recipeId: string) => {
    const target = collections.find(c => c.id === collectionId);
    if (!target) return;
    const exists = target.recipeIds.includes(recipeId);
    const nextIds = exists ? target.recipeIds.filter(id => id !== recipeId) : [...target.recipeIds, recipeId];

    setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, recipeIds: nextIds } : c));
    setDoc(doc(db, 'recipe_collections', collectionId), { recipeIds: nextIds }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `recipe_collections/${collectionId}`)
    );
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
    setDoc(doc(db, 'moderation_reports', newReport.id), newReport).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `moderation_reports/${newReport.id}`)
    );
    showToast('Tu reporte ha sido enviado a Firestore para moderación.');
  };

  const resolveReport = (reportId: string, resolution: 'removed' | 'dismissed') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    if (currentUser.role !== 'admin' && currentUser.role !== 'editor') {
      showToast('No tienes permisos de moderación para realizar esta acción.');
      return;
    }

    if (resolution === 'removed') {
      if (report.targetType === 'recipe') {
        deleteRecipe(report.targetId);
      } else {
        setUsers(prev => prev.map(u => u.id === report.targetId ? { ...u, isBanned: true } : u));
        setDoc(doc(db, 'users', report.targetId), { isBanned: true }, { merge: true }).catch(console.warn);
      }
    }

    const nextStatus = resolution === 'removed' ? 'resolved_removed' : 'dismissed';
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: nextStatus, resolvedAt: new Date().toISOString() } : r));
    setDoc(doc(db, 'moderation_reports', reportId), { status: nextStatus, resolvedAt: new Date().toISOString() }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `moderation_reports/${reportId}`)
    );

    showToast('Reporte actualizado en Firestore.');
  };

  // -------------------------------------------------------------
  // FORUM (COMMUNITY DISCUSSIONS IN FIRESTORE)
  // -------------------------------------------------------------
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
    setDoc(doc(db, 'forum_topics', newId), newTopic).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `forum_topics/${newId}`)
    );

    showToast(`Debate "${title}" publicado en Firestore.`);
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

    setDoc(doc(db, 'forum_replies', newReply.id), newReply).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `forum_replies/${newReply.id}`)
    );

    const topic = forumTopics.find(t => t.id === topicId);
    if (topic) {
      setDoc(doc(db, 'forum_topics', topicId), {
        repliesCount: topic.repliesCount + 1,
        lastActivityAt: new Date().toISOString()
      }, { merge: true }).catch(console.warn);
    }

    showToast('Respuesta guardada en el debate.');
  };

  const toggleForumReplyLike = (replyId: string) => {
    toggleForumReplyVote(replyId, 'like');
  };

  const toggleForumReplyVote = (replyId: string, type: 'like' | 'dislike') => {
    let nextReply: ForumReply | null = null;
    setForumReplies(prev => prev.map(r => {
      if (r.id !== replyId) return r;
      const baseLikes = r.baseLikes ?? 0;
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

      nextReply = {
        ...r,
        baseLikes,
        baseDislikes,
        likedUserIds: nextLiked,
        dislikedUserIds: nextDisliked,
        likesCount: baseLikes + nextLiked.length
      };
      return nextReply;
    }));

    if (nextReply) {
      const rep = nextReply as ForumReply;
      setDoc(doc(db, 'forum_replies', replyId), {
        likesCount: rep.likesCount,
        likedUserIds: rep.likedUserIds,
        dislikedUserIds: rep.dislikedUserIds
      }, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `forum_replies/${replyId}`)
      );
    }
  };

  const editForumReply = (replyId: string, content: string) => {
    if (!content.trim()) return;
    setForumReplies(prev => prev.map(r => r.id === replyId ? { ...r, content: content.trim() } : r));
    setDoc(doc(db, 'forum_replies', replyId), { content: content.trim() }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `forum_replies/${replyId}`)
    );
    showToast('Respuesta editada.');
  };

  const deleteForumReply = (replyId: string) => {
    setForumReplies(prev => prev.filter(r => r.id !== replyId));
    deleteDoc(doc(db, 'forum_replies', replyId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `forum_replies/${replyId}`)
    );
    showToast('Respuesta eliminada.');
  };

  const markBestAnswer = (replyId: string) => {
    setForumReplies(prev => prev.map(r => r.id === replyId ? { ...r, isBestAnswer: true } : r));
    setDoc(doc(db, 'forum_replies', replyId), { isBestAnswer: true }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `forum_replies/${replyId}`)
    );
    showToast('Marcada como mejor respuesta.');
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setDoc(doc(db, 'notifications', id), { read: true }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`)
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notifications.forEach(n => {
      setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true }).catch(console.warn);
    });
    showToast('Todas las notificaciones marcadas como leídas.');
  };

  // Export functions
  const executeDownloadRecipePdf = (recipeOverride?: Recipe) => {
    const target = recipeOverride || recipeToConfirmDownload || printableRecipe;
    if (!target) return;
    downloadRecipePdf(target);
    showToast(`PDF de "${target.title}" descargado exitosamente.`);
    setRecipeToConfirmDownload(null);
  };

  const exportRecipePdf = (recipe: Recipe) => {
    downloadRecipePdf(recipe);
    showToast(`PDF de "${recipe.title}" descargado exitosamente.`);
  };

  const exportRecipeJson = (recipe: Recipe) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(recipe, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${recipe.title.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Archivo JSON de "${recipe.title}" descargado.`);
  };

  const exportRecipeText = (recipe: Recipe) => {
    const txt = `RECETA: ${recipe.title.toUpperCase()}\nCategoría: ${recipe.category}\nPorciones: ${recipe.servings}\nTiempo: ${recipe.prepTimeMin + recipe.cookTimeMin} minutos\n\nINGREDIENTES:\n${recipe.ingredients.map(i => `- ${i.quantity} ${i.unit} ${i.name}`).join('\n')}\n\nPASOS:\n${recipe.steps.map(s => `${s.stepNumber}. ${s.title}: ${s.description}`).join('\n')}`;
    const element = document.createElement('a');
    const file = new Blob([txt], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${recipe.title.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    element.remove();
    showToast(`Archivo de texto de "${recipe.title}" descargado.`);
  };

  const exportRecipePackagePdf = (collectionObj?: RecipeCollection) => {
    const targetRecipes = collectionObj
      ? recipes.filter(r => collectionObj.recipeIds.includes(r.id))
      : recipes.slice(0, 5);

    downloadRecipePackagePdf({
      packageName: collectionObj?.name || 'Recetario Gusto Gourmet',
      description: collectionObj?.description || 'Colección especial de preparaciones culinarias.',
      recipes: targetRecipes,
      curatedBy: currentUser.name
    });
    showToast('Recetario descargado en PDF.');
    return true;
  };

  const getFamousWeeklyRecipes = () => {
    return recipes.slice(0, 5);
  };

  const exportWeeklyPlannerPdf = () => {
    const targetRecipes = getFamousWeeklyRecipes();
    downloadRecipePackagePdf({
      packageName: 'Las Recetas Más Famosas de la Semana',
      description: 'Edición exclusiva con las preparaciones más aclamadas y votadas por la comunidad culinaria de Gusto.',
      recipes: targetRecipes,
      curatedBy: currentUser.name,
    });
    showToast('Paquete de recetas más famosas exportado exitosamente en formato .PDF');
    return true;
  };

  const exportCollectionPackage = (collectionObj: RecipeCollection) => {
    exportRecipePackagePdf(collectionObj);
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
        loginWithGoogle,
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
        showToast,
        isFirebaseReady
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
