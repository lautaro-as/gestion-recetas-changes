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
  setDoc as rawSetDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { db, auth, googleProvider, testConnection } from '../firebase/config';
import { handleFirestoreError, cleanForFirestore, OperationType } from '../firebase/firestoreErrors';

// Sanitized setDoc wrapper to prevent undefined field runtime errors in Firestore
const setDoc = (docRef: any, data: any, options?: any) => {
  const cleaned = cleanForFirestore(data);
  return options ? rawSetDoc(docRef, cleaned, options) : rawSetDoc(docRef, cleaned);
};

export const normalizeUser = (u: any): UserProfile => {
  return {
    id: u?.id || `user-${Date.now()}`,
    name: u?.name || 'Usuario',
    firstName: u?.firstName || u?.name?.split(' ')[0] || 'Usuario',
    lastName: u?.lastName || u?.name?.split(' ').slice(1).join(' ') || '',
    gender: u?.gender || 'Prefiero no decirlo',
    username: u?.username || (u?.name || 'usuario').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
    email: u?.email || '',
    password: u?.password ?? null,
    avatar: u?.avatar || '/assets/aistudio/default_avatar_b96d7689.jpg',
    role: u?.role || 'usuario',
    bio: u?.bio || '',
    specialties: Array.isArray(u?.specialties) ? u.specialties : ['Cocina Casera'],
    dietaryPreferences: Array.isArray(u?.dietaryPreferences) ? u.dietaryPreferences : [],
    subprofiles: Array.isArray(u?.subprofiles) ? u.subprofiles : [],
    activeSubProfileId: u?.activeSubProfileId ?? null,
    followersCount: typeof u?.followersCount === 'number' ? u.followersCount : 0,
    followingUserIds: Array.isArray(u?.followingUserIds) ? u.followingUserIds : [],
    pinnedRecipeId: u?.pinnedRecipeId ?? null,
    wishlistRecipeIds: Array.isArray(u?.wishlistRecipeIds) ? u.wishlistRecipeIds : [],
    location: u?.location || 'Argentina',
    isBanned: Boolean(u?.isBanned)
  };
};

export const normalizeRecipe = (r: any): Recipe => {
  return {
    ...r,
    id: r?.id || `recipe-${Date.now()}`,
    title: r?.title || 'Receta sin título',
    description: r?.description || '',
    category: r?.category || 'General',
    difficulty: r?.difficulty || 'media',
    prepTimeMin: typeof r?.prepTimeMin === 'number' ? r.prepTimeMin : 15,
    cookTimeMin: typeof r?.cookTimeMin === 'number' ? r.cookTimeMin : 20,
    servings: typeof r?.servings === 'number' ? r.servings : 4,
    nutrition: {
      calories: typeof r?.nutrition?.calories === 'number' ? r.nutrition.calories : 350,
      proteinG: typeof r?.nutrition?.proteinG === 'number' ? r.nutrition.proteinG : 15,
      carbsG: typeof r?.nutrition?.carbsG === 'number' ? r.nutrition.carbsG : 40,
      fatG: typeof r?.nutrition?.fatG === 'number' ? r.nutrition.fatG : 12,
      fiberG: typeof r?.nutrition?.fiberG === 'number' ? r.nutrition.fiberG : 5,
    },
    authorName: r?.authorName || 'Chef Gusto',
    authorAvatar: r?.authorAvatar || '/assets/aistudio/default_avatar_b96d7689.jpg',
    coverImage: r?.coverImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    likedUserIds: Array.isArray(r?.likedUserIds) ? r.likedUserIds : [],
    dislikedUserIds: Array.isArray(r?.dislikedUserIds) ? r.dislikedUserIds : [],
    tags: Array.isArray(r?.tags) ? r.tags : [],
    coAuthors: Array.isArray(r?.coAuthors) ? r.coAuthors : [],
    ingredients: Array.isArray(r?.ingredients) ? r.ingredients : [],
    steps: Array.isArray(r?.steps) ? r.steps : [],
    likesCount: typeof r?.likesCount === 'number' ? r.likesCount : ((r?.likedUserIds && Array.isArray(r.likedUserIds)) ? r.likedUserIds.length : 0),
    dislikesCount: typeof r?.dislikesCount === 'number' ? r.dislikesCount : ((r?.dislikedUserIds && Array.isArray(r.dislikedUserIds)) ? r.dislikedUserIds.length : 0),
    commentsCount: typeof r?.commentsCount === 'number' ? r.commentsCount : 0,
  };
};

export const normalizeComment = (c: any): RecipeComment => {
  return {
    ...c,
    likedUserIds: Array.isArray(c?.likedUserIds) ? c.likedUserIds : [],
    dislikedUserIds: Array.isArray(c?.dislikedUserIds) ? c.dislikedUserIds : [],
    likes: typeof c?.likes === 'number' ? c.likes : 0,
    baseLikes: typeof c?.baseLikes === 'number' ? c.baseLikes : 0,
    baseDislikes: typeof c?.baseDislikes === 'number' ? c.baseDislikes : 0,
  };
};

const mergeAllUsers = (firestoreUsers: UserProfile[] = [], cachedUsers: UserProfile[] = []): UserProfile[] => {
  const map = new Map<string, UserProfile>();

  // 1. Always start with all INITIAL_USERS as guaranteed defaults
  for (const initU of INITIAL_USERS) {
    map.set(initU.id, normalizeUser(initU));
  }

  // 2. Add cached local users (custom registered accounts)
  for (const c of cachedUsers) {
    if (!c?.id) continue;
    const existing = map.get(c.id);
    map.set(c.id, normalizeUser({ ...(existing || {}), ...c }));
  }

  // 3. Add or update from Firestore (source of truth for registered users)
  for (const f of firestoreUsers) {
    if (!f?.id) continue;
    const existing = map.get(f.id);
    map.set(f.id, normalizeUser({ ...(existing || {}), ...f }));
  }

  return Array.from(map.values());
};

const mergeAllRecipes = (firestoreRecipes: Recipe[] = []): Recipe[] => {
  const map = new Map<string, Recipe>();

  // 1. Always start with all INITIAL_RECIPES
  for (const initR of INITIAL_RECIPES) {
    map.set(initR.id, normalizeRecipe(initR));
  }

  // 2. Add or update from Firestore
  for (const f of firestoreRecipes) {
    if (!f?.id) continue;
    // Skip empty dummy docs with no title or content
    if ((!f.title || f.title === 'Receta sin título') && (!f.ingredients || f.ingredients.length === 0)) {
      continue;
    }
    const existing = map.get(f.id);
    map.set(f.id, normalizeRecipe({ ...(existing || {}), ...f }));
  }

  return Array.from(map.values());
};

const mergeAllComments = (firestoreComments: RecipeComment[] = []): RecipeComment[] => {
  const map = new Map<string, RecipeComment>();

  for (const initC of INITIAL_COMMENTS) {
    map.set(initC.id, normalizeComment(initC));
  }

  for (const f of firestoreComments) {
    if (!f?.id) continue;
    map.set(f.id, normalizeComment(f));
  }

  return Array.from(map.values());
};

const mergeAllTopics = (firestoreTopics: ForumTopic[] = []): ForumTopic[] => {
  const map = new Map<string, ForumTopic>();

  for (const initT of INITIAL_FORUM_TOPICS) {
    map.set(initT.id, initT);
  }

  for (const f of firestoreTopics) {
    if (!f?.id) continue;
    map.set(f.id, f);
  }

  return Array.from(map.values());
};

const mergeAllReplies = (firestoreReplies: ForumReply[] = []): ForumReply[] => {
  const map = new Map<string, ForumReply>();

  for (const initR of INITIAL_FORUM_REPLIES) {
    map.set(initR.id, initR);
  }

  for (const f of firestoreReplies) {
    if (!f?.id) continue;
    map.set(f.id, f);
  }

  return Array.from(map.values());
};

const mergeAllReports = (firestoreReports: ModerationReport[] = [], cachedReports: ModerationReport[] = []): ModerationReport[] => {
  const map = new Map<string, ModerationReport>();

  for (const initR of INITIAL_REPORTS) {
    map.set(initR.id, initR);
  }

  for (const c of cachedReports) {
    if (c?.id) map.set(c.id, c);
  }

  for (const f of firestoreReports) {
    if (f?.id) map.set(f.id, f);
  }

  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

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
  authPromptTrigger: number;
  promptAuthRequired: (message?: string) => void;
  
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
  COMMENTS_CACHE: 'gusto_recipe_comments_cache_v2',
  RECIPES_CACHE: 'gusto_recipes_cache_v2',
  FORUM_TOPICS_CACHE: 'gusto_forum_topics_cache_v2',
  FORUM_REPLIES_CACHE: 'gusto_forum_replies_cache_v2',
  REPORTS_CACHE: 'gusto_moderation_reports_cache_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [authPromptTrigger, setAuthPromptTrigger] = useState<number>(0);

  const promptAuthRequired = (message?: string) => {
    setAuthPromptTrigger(Date.now());
    if (message) {
      showToast(message);
    }
  };

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

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('gusto_custom_users_cache') || '[]');
      return mergeAllUsers([], Array.isArray(cached) ? cached : []);
    } catch {}
    return INITIAL_USERS.map(normalizeUser);
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const explicitlyLoggedOut = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_OUT) === 'true';
    if (explicitlyLoggedOut) return '';
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-mateo';
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPES_CACHE) || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        return mergeAllRecipes(cached);
      }
    } catch {}
    return INITIAL_RECIPES.map(normalizeRecipe);
  });

  const [comments, setComments] = useState<RecipeComment[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMENTS_CACHE) || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        return mergeAllComments(cached);
      }
    } catch {}
    return INITIAL_COMMENTS.map(normalizeComment);
  });

  const [forumTopics, setForumTopics] = useState<ForumTopic[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORUM_TOPICS_CACHE) || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        return mergeAllTopics(cached);
      }
    } catch {}
    return INITIAL_FORUM_TOPICS;
  });

  const [forumReplies, setForumReplies] = useState<ForumReply[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORUM_REPLIES_CACHE) || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        return mergeAllReplies(cached);
      }
    } catch {}
    return INITIAL_FORUM_REPLIES;
  });
  const [reports, setReports] = useState<ModerationReport[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS_CACHE) || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        return mergeAllReports([], cached);
      }
    } catch {}
    return INITIAL_REPORTS;
  });
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

    // Guard to ensure initial seed runs at most once per session and only when authenticated
    const seededCollections = new Set<string>();

    const safeInitialSeed = async (collectionName: string, items: any[]) => {
      if (seededCollections.has(collectionName)) return;
      seededCollections.add(collectionName);

      try {
        for (const item of items) {
          const docRef = doc(db, collectionName, item.id);
          await setDoc(docRef, item, { merge: true });
        }
      } catch (err) {
        console.info(`Initial Firestore sync info (${collectionName}):`, err);
      }
    };

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
              name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Cocinero Gusto',
              firstName: fbUser.displayName?.split(' ')[0] ?? 'Cocinero',
              lastName: fbUser.displayName?.split(' ').slice(1).join(' ') ?? '',
              gender: 'Prefiero no decirlo',
              username: (fbUser.email?.split('@')[0] ?? 'usuario').replace(/[^a-zA-Z0-9_]/g, ''),
              email: fbUser.email ?? '',
              password: null as any,
              avatar: fbUser.photoURL ?? '/assets/aistudio/default_avatar_b96d7689.jpg',
              role: isAdminEmail ? 'admin' : 'usuario',
              bio: 'Miembro de la comunidad gastronómica Gusto.',
              specialties: ['Cocina Casera'],
              dietaryPreferences: [],
              subprofiles: [],
              activeSubProfileId: null,
              followersCount: 0,
              followingUserIds: ['user-mateo'],
              pinnedRecipeId: null,
              wishlistRecipeIds: [],
              location: 'Argentina',
              isBanned: false
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
        const firestoreList = snapshot.docs.map(d => normalizeRecipe(d.data()));
        const merged = mergeAllRecipes(firestoreList);
        setRecipes(merged);
        try {
          localStorage.setItem(STORAGE_KEYS.RECIPES_CACHE, JSON.stringify(merged));
        } catch {}
      } else {
        safeInitialSeed('recipes', INITIAL_RECIPES);
      }
      setIsFirebaseReady(true);
    }, (error) => {
      console.warn('Firestore recipes listener notice:', error);
    });

    // 4. Users Snapshot Listener (Always preserving INITIAL_USERS)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let firestoreList: UserProfile[] = [];
      if (!snapshot.empty) {
        firestoreList = snapshot.docs.map(d => d.data() as UserProfile);
      } else {
        safeInitialSeed('users', INITIAL_USERS);
      }
      try {
        const cached: UserProfile[] = JSON.parse(localStorage.getItem('gusto_custom_users_cache') || '[]');
        setUsers(mergeAllUsers(firestoreList, Array.isArray(cached) ? cached : []));
      } catch {
        setUsers(mergeAllUsers(firestoreList, []));
      }
    }, (error) => {
      console.warn('Firestore users listener notice:', error);
    });

    // 5. Comments Snapshot Listener
    const unsubComments = onSnapshot(collection(db, 'recipe_comments'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreList = snapshot.docs.map(d => normalizeComment(d.data()));
        const merged = mergeAllComments(firestoreList);
        setComments(merged);
        try {
          localStorage.setItem(STORAGE_KEYS.COMMENTS_CACHE, JSON.stringify(merged));
        } catch {}
      } else {
        safeInitialSeed('recipe_comments', INITIAL_COMMENTS);
      }
    }, (error) => {
      console.warn('Firestore comments listener notice:', error);
    });

    // 6. Forum Topics Snapshot Listener
    const unsubTopics = onSnapshot(collection(db, 'forum_topics'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreList = snapshot.docs.map(d => d.data() as ForumTopic);
        const merged = mergeAllTopics(firestoreList);
        setForumTopics(merged);
        try {
          localStorage.setItem(STORAGE_KEYS.FORUM_TOPICS_CACHE, JSON.stringify(merged));
        } catch {}
      } else {
        safeInitialSeed('forum_topics', INITIAL_FORUM_TOPICS);
      }
    }, (error) => {
      console.warn('Firestore forum topics listener notice:', error);
    });

    // 7. Forum Replies Snapshot Listener
    const unsubReplies = onSnapshot(collection(db, 'forum_replies'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreList = snapshot.docs.map(d => d.data() as ForumReply);
        const merged = mergeAllReplies(firestoreList);
        setForumReplies(merged);
        try {
          localStorage.setItem(STORAGE_KEYS.FORUM_REPLIES_CACHE, JSON.stringify(merged));
        } catch {}
      } else {
        safeInitialSeed('forum_replies', INITIAL_FORUM_REPLIES);
      }
    }, (error) => {
      console.warn('Firestore forum replies listener notice:', error);
    });

    // 8. Moderation Reports Snapshot Listener
    const unsubReports = onSnapshot(collection(db, 'moderation_reports'), (snapshot) => {
      let firestoreList: ModerationReport[] = [];
      if (!snapshot.empty) {
        firestoreList = snapshot.docs.map(d => d.data() as ModerationReport);
      }
      try {
        const cached: ModerationReport[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS_CACHE) || '[]');
        const merged = mergeAllReports(firestoreList, Array.isArray(cached) ? cached : []);
        setReports(merged);
        localStorage.setItem(STORAGE_KEYS.REPORTS_CACHE, JSON.stringify(merged));
      } catch {
        setReports(mergeAllReports(firestoreList, []));
      }
    }, (error) => {
      console.info('Firestore moderation reports notice:', error.message);
    });

    // 9. Collections Snapshot Listener
    const unsubCollections = onSnapshot(collection(db, 'recipe_collections'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as RecipeCollection);
        setCollections(list);
      } else if (auth.currentUser) {
        safeInitialSeed('recipe_collections', INITIAL_COLLECTIONS);
      }
    }, (error) => {
      console.warn('Firestore collections listener notice:', error);
    });

    // 10. Notifications Snapshot Listener
    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => d.data() as AppNotification);
        setNotifications(list);
      }
    }, (error) => {
      console.info('Firestore notifications notice:', error.message);
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

  const rawCurrentUser = users.find(u => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  const currentUser: UserProfile = normalizeUser(rawCurrentUser);

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
            name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Cocinero Gusto',
            firstName: fbUser.displayName?.split(' ')[0] ?? 'Cocinero',
            lastName: fbUser.displayName?.split(' ').slice(1).join(' ') ?? '',
            gender: 'Prefiero no decirlo',
            username: (fbUser.email?.split('@')[0] ?? 'usuario').replace(/[^a-zA-Z0-9_]/g, ''),
            email: fbUser.email ?? '',
            password: null as any,
            avatar: fbUser.photoURL ?? '/assets/aistudio/default_avatar_b96d7689.jpg',
            role: isAdminEmail ? 'admin' : 'usuario',
            bio: 'Miembro activo de la comunidad gastronómica Gusto.',
            specialties: ['Cocina Casera'],
            dietaryPreferences: [],
            subprofiles: [],
            activeSubProfileId: null,
            followersCount: 0,
            followingUserIds: ['user-mateo'],
            pinnedRecipeId: null,
            wishlistRecipeIds: [],
            location: 'Argentina',
            isBanned: false
          };
          await setDoc(userRef, profile);
        }
        setCurrentUserId(fbUser.uid);
        setIsAuthenticated(true);
        localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);
        showToast(`¡Bienvenido a Gusto, ${profile.name}!`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error?.code === 'auth/unauthorized-domain') {
        showToast('Dominio web no autorizado para inicio de sesión con Google.');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        showToast('Ventana de autenticación cerrada por el usuario.');
      } else {
        showToast('No se pudo completar el inicio de sesión con Google.');
      }
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
    let found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      try {
        const cached: UserProfile[] = JSON.parse(localStorage.getItem('gusto_custom_users_cache') || '[]');
        found = cached.find(u => u.email.toLowerCase() === cleanEmail);
      } catch {}
    }

    if (!found) {
      found = INITIAL_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    }

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
      activeSubProfileId: null,
      followersCount: 0,
      followingUserIds: ['user-mateo', 'user-lucia'],
      pinnedRecipeId: null,
      wishlistRecipeIds: [],
      location: 'Argentina',
      isBanned: false,
    };

    // Save locally
    try {
      const cached = JSON.parse(localStorage.getItem('gusto_custom_users_cache') || '[]');
      localStorage.setItem('gusto_custom_users_cache', JSON.stringify([...cached.filter((u: any) => u.email.toLowerCase() !== cleanEmail), newUser]));
    } catch {}

    setUsers(prev => mergeAllUsers(prev, [newUser]));
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);
    localStorage.removeItem(STORAGE_KEYS.IS_LOGGED_OUT);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);

    // Save to Firestore with non-blocking error handler
    setDoc(doc(db, 'users', newUser.id), newUser).catch((err) =>
      console.warn('Firestore register notice:', err)
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
    const updated = normalizeUser({ ...currentUser, ...data });
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));

    try {
      const cached: UserProfile[] = JSON.parse(localStorage.getItem('gusto_custom_users_cache') || '[]');
      const updatedCache = [...cached.filter(u => u.id !== currentUser.id), updated];
      localStorage.setItem('gusto_custom_users_cache', JSON.stringify(updatedCache));
    } catch {}

    setDoc(doc(db, 'users', currentUser.id), data, { merge: true }).catch((err) =>
      console.warn('Firestore updateUserProfile notice:', err)
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
    const nextSubs = [...(currentUser.subprofiles || []), newSub];
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, subprofiles: nextSubs } : u));
    setDoc(doc(db, 'users', currentUser.id), { subprofiles: nextSubs }, { merge: true }).catch((err) =>
      console.warn('Firestore addSubProfile notice:', err)
    );
    showToast(`Subperfil familiar "${name}" agregado.`);
  };

  const switchActiveSubProfile = (subProfileId: string | null) => {
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? { ...u, activeSubProfileId: subProfileId } : u)));
    setDoc(doc(db, 'users', currentUser.id), { activeSubProfileId: subProfileId }, { merge: true }).catch((err) =>
      console.warn('Firestore switchActiveSubProfile notice:', err)
    );
    if (subProfileId) {
      const sub = (currentUser.subprofiles || []).find(s => s.id === subProfileId);
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
    const currentFollowing = currentUser.followingUserIds || [];
    const isFollowing = currentFollowing.includes(targetUserId);
    const nextFollowing = isFollowing
      ? currentFollowing.filter(id => id !== targetUserId)
      : [...currentFollowing, targetUserId];

    const targetUser = users.find(u => u.id === targetUserId);
    const nextFollowersCount = targetUser
      ? (isFollowing ? Math.max(0, targetUser.followersCount - 1) : targetUser.followersCount + 1)
      : 0;

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) return { ...u, followingUserIds: nextFollowing };
      if (u.id === targetUserId) return { ...u, followersCount: nextFollowersCount };
      return u;
    }));

    // Persist in Firestore with safe catch
    setDoc(doc(db, 'users', currentUser.id), { followingUserIds: nextFollowing }, { merge: true }).catch((err) =>
      console.warn('Firestore followUserToggle notice:', err)
    );
    setDoc(doc(db, 'users', targetUserId), { followersCount: nextFollowersCount }, { merge: true }).catch((err) =>
      console.warn('Firestore followUserToggle target notice:', err)
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

    setRecipes(prev => {
      const next = [newRecipe, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.RECIPES_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });

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

    setRecipes(prev => {
      const next = prev.map(r => r.id === id ? updatedRecipe : r);
      try {
        localStorage.setItem(STORAGE_KEYS.RECIPES_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Persist in Firestore
    setDoc(doc(db, 'recipes', id), updatedRecipe, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `recipes/${id}`)
    );

    showToast(`Receta "${updatedRecipe.title}" actualizada exitosamente.`);
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

    setRecipes(prev => {
      const next = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.RECIPES_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });
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
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para valorar recetas.');
      return;
    }
    const targetRecipe = recipes.find(r => r.id === recipeId);
    const wasAlreadyLiked = targetRecipe ? (targetRecipe.likedUserIds || []).includes(currentUser.id) : false;

    let updatedRecipe: Recipe | null = null;
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const likedList = r.likedUserIds || [];
      const dislikedList = r.dislikedUserIds || [];
      const isLiked = likedList.includes(currentUser.id);

      let nextLiked = [...likedList];
      let nextDisliked = [...dislikedList];

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
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para valorar recetas.');
      return;
    }
    let updatedRecipe: Recipe | null = null;
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const likedList = r.likedUserIds || [];
      const dislikedList = r.dislikedUserIds || [];
      const isDisliked = dislikedList.includes(currentUser.id);

      let nextLiked = [...likedList];
      let nextDisliked = [...dislikedList];

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
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para comentar en esta receta.');
      return;
    }
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
      baseLikes: 0,
      baseDislikes: 0,
      likedUserIds: [],
      dislikedUserIds: [],
      parentCommentId: parentCommentId || null as any
    };

    setComments(prev => {
      const next = [...prev, normalizeComment(newComment)];
      try {
        localStorage.setItem(STORAGE_KEYS.COMMENTS_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });

    setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, commentsCount: (r.commentsCount || 0) + 1 } : r));

    // Save directly to Firestore collection recipe_comments
    setDoc(doc(db, 'recipe_comments', newComment.id), newComment).catch((err) =>
      console.warn('Firestore addComment save notice:', err)
    );

    // Update recipe commentsCount in Firestore safely
    const targetRecipe = recipes.find(r => r.id === recipeId);
    if (targetRecipe) {
      setDoc(doc(db, 'recipes', recipeId), { commentsCount: (targetRecipe.commentsCount || 0) + 1 }, { merge: true }).catch(console.warn);
    }

    // DISPATCH NOTIFICATIONS (RF-28 & Requirement 1)
    // 1. If replying to an existing comment, notify that comment's author
    if (parentCommentId) {
      const parentComment = comments.find(c => c.id === parentCommentId);
      if (parentComment && parentComment.authorId && parentComment.authorId !== currentUser.id) {
        const notif: AppNotification = {
          id: `notif-reply-${Date.now()}`,
          userId: parentComment.authorId,
          title: 'Nueva respuesta a tu comentario',
          message: `${currentUser.name} respondió a tu comentario en "${targetRecipe?.title || 'la receta'}": "${content.trim().slice(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'comment',
          linkTarget: recipeId
        };
        setNotifications(prev => [notif, ...prev]);
        setDoc(doc(db, 'notifications', notif.id), notif).catch(console.warn);
      }
    }

    // 2. Notify the recipe author if someone else commented on their recipe
    if (targetRecipe && targetRecipe.authorId && targetRecipe.authorId !== currentUser.id) {
      const parentComment = parentCommentId ? comments.find(c => c.id === parentCommentId) : null;
      if (!parentComment || parentComment.authorId !== targetRecipe.authorId) {
        const notif: AppNotification = {
          id: `notif-recipe-${Date.now()}`,
          userId: targetRecipe.authorId,
          title: 'Nuevo comentario en tu receta',
          message: `${currentUser.name} comentó en tu receta "${targetRecipe.title}": "${content.trim().slice(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'comment',
          linkTarget: recipeId
        };
        setNotifications(prev => [notif, ...prev]);
        setDoc(doc(db, 'notifications', notif.id), notif).catch(console.warn);
      }
    }

    showToast('Comentario publicado exitosamente.');
  };

  const editComment = (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setComments(prev => {
      const next = prev.map(c => c.id === commentId ? { ...c, content: newContent.trim(), updatedAt: new Date().toISOString() } : c);
      try {
        localStorage.setItem(STORAGE_KEYS.COMMENTS_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });

    setDoc(doc(db, 'recipe_comments', commentId), { content: newContent.trim(), updatedAt: new Date().toISOString() }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `recipe_comments/${commentId}`)
    );
    showToast('Comentario editado exitosamente.');
  };

  const deleteComment = (commentId: string) => {
    const target = comments.find(c => c.id === commentId);
    if (!target) return;
    setComments(prev => {
      const next = prev.filter(c => c.id !== commentId && c.parentCommentId !== commentId);
      try {
        localStorage.setItem(STORAGE_KEYS.COMMENTS_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });

    setRecipes(prev => prev.map(r => r.id === target.recipeId ? { ...r, commentsCount: Math.max(0, r.commentsCount - 1) } : r));

    deleteDoc(doc(db, 'recipe_comments', commentId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `recipe_comments/${commentId}`)
    );
    showToast('Comentario eliminado exitosamente.');
  };

  const toggleCommentVote = (commentId: string, type: 'like' | 'dislike') => {
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para valorar comentarios.');
      return;
    }
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
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para agregar ingredientes al carrito de compras.');
      return;
    }
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
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para guardar recetas en tu lista de deseos.');
      return;
    }
    const list = currentUser.wishlistRecipeIds || [];
    const inWishlist = list.includes(recipeId);
    const nextList = inWishlist
      ? list.filter(id => id !== recipeId)
      : [...list, recipeId];

    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, wishlistRecipeIds: nextList } : u));
    setDoc(doc(db, 'users', currentUser.id), { wishlistRecipeIds: nextList }, { merge: true }).catch((err) =>
      console.warn('Firestore toggleWishlist notice:', err)
    );

    showToast(inWishlist ? 'Eliminado de tu lista de deseos.' : 'Guardado en tu lista de deseos.');
  };

  const createCollection = (name: string, description: string, recipeIds: string[], isPrivate = false) => {
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para crear colecciones personales.');
      return;
    }
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
    showToast(`Colección personal "${name}" creada exitosamente.`);
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

  // Moderation (Persistent in Firestore and cache)
  const submitReport = (targetType: 'recipe' | 'profile', targetId: string, titleOrName: string, reason: ModerationReport['reason'], details: string) => {
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para reportar contenido a los administradores.');
      return;
    }
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
    setReports(prev => {
      const next = [newReport, ...prev.filter(r => r.id !== newReport.id)];
      try {
        localStorage.setItem(STORAGE_KEYS.REPORTS_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });
    setDoc(doc(db, 'moderation_reports', newReport.id), newReport).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `moderation_reports/${newReport.id}`)
    );
    showToast('Denuncia enviada correctamente. El equipo de administración revisará el caso.');
  };

  const resolveReport = (reportId: string, resolution: 'removed' | 'dismissed') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    if (currentUser.role !== 'admin') {
      showToast('Solo un Administrador puede moderar y resolver denuncias.');
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

    const nextStatus: ModerationReport['status'] = resolution === 'removed' ? 'resolved_removed' : 'dismissed';
    setReports(prev => {
      const next: ModerationReport[] = prev.map(r => r.id === reportId ? { ...r, status: nextStatus, resolvedAt: new Date().toISOString() } : r);
      try {
        localStorage.setItem(STORAGE_KEYS.REPORTS_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });
    setDoc(doc(db, 'moderation_reports', reportId), { status: nextStatus, resolvedAt: new Date().toISOString() }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `moderation_reports/${reportId}`)
    );

    showToast(resolution === 'removed' ? 'Contenido sancionado y retirado de la plataforma.' : 'Reporte desestimado correctamente.');
  };

  // -------------------------------------------------------------
  // FORUM (COMMUNITY DISCUSSIONS)
  // -------------------------------------------------------------
  const createForumTopic = (category: ForumTopic['category'], title: string, content: string, tags: string[]) => {
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para iniciar un debate en la comunidad.');
      return '';
    }
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

    setForumTopics(prev => {
      const next = [newTopic, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.FORUM_TOPICS_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });

    setDoc(doc(db, 'forum_topics', newId), newTopic).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `forum_topics/${newId}`)
    );

    showToast(`Debate "${title}" publicado exitosamente.`);
    return newId;
  };

  const createForumReply = (topicId: string, content: string) => {
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para responder en la comunidad.');
      return;
    }
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

    setForumReplies(prev => {
      const next = [...prev, newReply];
      try {
        localStorage.setItem(STORAGE_KEYS.FORUM_REPLIES_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });

    setForumTopics(prev => {
      const next = prev.map(t => t.id === topicId ? { ...t, repliesCount: t.repliesCount + 1 } : t);
      try {
        localStorage.setItem(STORAGE_KEYS.FORUM_TOPICS_CACHE, JSON.stringify(next));
      } catch {}
      return next;
    });

    setDoc(doc(db, 'forum_replies', newReply.id), newReply).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `forum_replies/${newReply.id}`)
    );

    const topic = forumTopics.find(t => t.id === topicId);
    if (topic) {
      setDoc(doc(db, 'forum_topics', topicId), {
        repliesCount: topic.repliesCount + 1,
        lastActivityAt: new Date().toISOString()
      }, { merge: true }).catch(console.warn);

      // NOTIFY TOPIC AUTHOR (Requirement 1 & RF-28)
      if (topic.authorId && topic.authorId !== currentUser.id) {
        const notif: AppNotification = {
          id: `notif-forum-${Date.now()}`,
          userId: topic.authorId,
          title: 'Nueva respuesta a tu debate',
          message: `${currentUser.name} respondió a tu debate "${topic.title}": "${content.trim().slice(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'comment',
          linkTarget: topicId
        };
        setNotifications(prev => [notif, ...prev]);
        setDoc(doc(db, 'notifications', notif.id), notif).catch(console.warn);
      }
    }

    showToast('Respuesta publicada exitosamente en el debate.');
  };

  const toggleForumReplyLike = (replyId: string) => {
    toggleForumReplyVote(replyId, 'like');
  };

  const toggleForumReplyVote = (replyId: string, type: 'like' | 'dislike') => {
    if (!isAuthenticated) {
      promptAuthRequired('Inicia sesión para valorar respuestas en el debate.');
      return;
    }
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
        authPromptTrigger,
        promptAuthRequired,

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
