import { create } from 'zustand';

const getInitialUserId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user ? user.email : null;
  } catch {
    return null;
  }
};

const getInitialCartState = (userId) => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const key = userId ? `cart_items_${userId}` : 'cart_items_anonymous';
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
  } catch {
    return [];
  }
};

export const useCartStore = create((set, get) => {
  const initialUserId = getInitialUserId();
  const initialItems = getInitialCartState(initialUserId);

  return {
    items: initialItems,
    userId: initialUserId,

    setUserId: (userId) => {
      set({ userId });
      if (typeof window !== 'undefined') {
        const key = userId ? `cart_items_${userId}` : 'cart_items_anonymous';
        const saved = localStorage.getItem(key);
        set({ items: saved ? JSON.parse(saved) : [] });
      }
    },

    addItem: (product, quantity = 1) => {
      const items = get().items;
      const existingItem = items.find((item) => item.id === product.id);
      
      let newItems;
      const unitPrice = product.price * (1 - (product.discount || 0) / 100);

      if (existingItem) {
        // Check stock limit
        const nextQty = existingItem.quantity + quantity;
        if (nextQty > product.stock) {
          alert(`Cannot add more. Only ${product.stock} items available in stock.`);
          return;
        }
        newItems = items.map((item) =>
          item.id === product.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        if (quantity > product.stock) {
          alert(`Cannot add. Only ${product.stock} items available in stock.`);
          return;
        }
        
        const firstImage = product.imageUrls && product.imageUrls.length > 0 
          ? product.imageUrls[0] 
          : '/uploads/default-product.png';

        newItems = [
          ...items,
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            discount: product.discount || 0,
            quantity: quantity,
            image: firstImage,
            sellerId: product.sellerId,
            sellerName: product.seller?.name || 'Seller',
            sellerWhatsapp: product.seller?.whatsapp || '',
            stock: product.stock,
          },
        ];

      }

      const userId = get().userId;
      const key = userId ? `cart_items_${userId}` : 'cart_items_anonymous';
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(newItems));
      }
      set({ items: newItems });
    },

    removeItem: (productId) => {
      const items = get().items;
      const newItems = items.filter((item) => item.id !== productId);
      
      const userId = get().userId;
      const key = userId ? `cart_items_${userId}` : 'cart_items_anonymous';
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(newItems));
      }
      set({ items: newItems });
    },

    updateQuantity: (productId, quantity) => {
      const items = get().items;
      const item = items.find((i) => i.id === productId);
      if (!item) return;

      if (quantity > item.stock) {
        alert(`Only ${item.stock} items available in stock.`);
        return;
      }

      if (quantity <= 0) {
        get().removeItem(productId);
        return;
      }

      const newItems = items.map((i) =>
        i.id === productId ? { ...i, quantity } : i
      );

      const userId = get().userId;
      const key = userId ? `cart_items_${userId}` : 'cart_items_anonymous';
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(newItems));
      }
      set({ items: newItems });
    },

    clearCart: () => {
      const userId = get().userId;
      const key = userId ? `cart_items_${userId}` : 'cart_items_anonymous';
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
      set({ items: [] });
    },

    getTotalPrice: () => {
      const items = get().items;
      return items.reduce((total, item) => {
        const itemPrice = item.price * (1 - item.discount / 100);
        return total + itemPrice * item.quantity;
      }, 0);
    },

    getItemCount: () => {
      const items = get().items;
      return items.reduce((count, item) => count + item.quantity, 0);
    },
  };
});
