import { create } from 'zustand';
import axios from 'axios';
import { useCartStore } from './cart';

const API_URL = 'http://localhost:5000/api';

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, notifications: [], unreadNotificationsCount: 0 };
  }
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return { user, token, notifications: [], unreadNotificationsCount: 0 };
  } catch {
    return { user: null, token: null, notifications: [], unreadNotificationsCount: 0 };
  }
};

export const useAuthStore = create((set, get) => ({
  ...getInitialState(),

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token });
    
    // Sync cart store user ID scoping
    useCartStore.getState().setUserId(user.email);
    
    get().fetchNotifications();
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null, notifications: [], unreadNotificationsCount: 0 });
    
    // De-sync cart store user ID scoping (switches to anonymous cart)
    useCartStore.getState().setUserId(null);
  },

  updateUserApproval: (isApproved) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, isApproved };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },

  refreshUserStatus: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) return;

    try {
      if (user.role === 'SELLER') {
        const res = await axios.get(`${API_URL}/seller/my-shop`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 200) {
          const currentUser = get().user;
          if (!currentUser || !currentUser.isApproved) {
            const updatedUser = { ...currentUser, isApproved: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            set({ user: updatedUser });
          }
        }
      }
      get().fetchNotifications();
    } catch (err) {
      if (err.response && err.response.status === 403) {
        const currentUser = get().user;
        if (!currentUser || currentUser.isApproved !== false) {
          const updatedUser = { ...currentUser, isApproved: false };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      }
    }
  },

  fetchNotifications: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notifications = res.data;
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ notifications, unreadNotificationsCount: unreadCount });
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  },

  markNotificationAsRead: async (id) => {
    const token = get().token;
    if (!token) return;

    try {
      await axios.patch(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set((state) => {
        const updated = state.notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = updated.filter(n => !n.isRead).length;
        return { notifications: updated, unreadNotificationsCount: unreadCount };
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }
}));
