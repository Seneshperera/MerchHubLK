'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth';
import { useCartStore } from '../../../store/cart';
import axios from 'axios';
import { ShoppingBag, MapPin, Clock, RefreshCw, ChevronDown, ChevronUp, Heart, Bell, Trash2, ShoppingCart, MessageSquare, Send } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const HOST_URL = 'http://localhost:5000';

export default function BuyerDashboard() {
  const router = useRouter();
  const { user, token, notifications, unreadNotificationsCount, fetchNotifications, markNotificationAsRead } = useAuthStore();
  const { addItem } = useCartStore();

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Chat State
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messagesList, setMessagesList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'BUYER') {
      router.push('/login');
      return;
    }
    fetchOrders();
    fetchWishlist();
    fetchNotifications();
    fetchContacts();
  }, [user, router]);

  useEffect(() => {
    if (activeTab === 'wishlist') fetchWishlist();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'chat') fetchContacts();
  }, [activeTab]);

  useEffect(() => {
    let interval;
    if (activeTab === 'chat' && activeContact) {
      fetchThread(activeContact.id);
      interval = setInterval(() => {
        fetchThread(activeContact.id);
      }, 5000); // Poll every 5s for chat updates
    }
    return () => clearInterval(interval);
  }, [activeTab, activeContact]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get(`${API_URL}/orders/buyer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch buyer orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const res = await axios.get(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlist(res.data);
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleRemoveFromWishlist = async (id) => {
    try {
      await axios.delete(`${API_URL}/wishlist/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchWishlist();
    } catch (err) {
      console.error('Remove wishlist error:', err);
    }
  };

  // Chat APIs
  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API_URL}/messages/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(res.data);
      if (res.data.length > 0 && !activeContact) {
        setActiveContact(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const fetchThread = async (contactId) => {
    try {
      const res = await axios.get(`${API_URL}/messages/thread/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessagesList(res.data);
    } catch (err) {
      console.error('Error fetching chat thread:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeContact) return;

    try {
      const res = await axios.post(`${API_URL}/messages`, {
        receiverId: activeContact.id,
        content: chatInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessagesList(prev => [...prev, res.data]);
      setChatInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
      case 'CONFIRMED': return 'bg-blue-500/10 border border-blue-500/20 text-blue-400';
      case 'PACKED': return 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400';
      case 'SHIPPED': return 'bg-purple-500/10 border border-purple-500/20 text-purple-400';
      case 'DELIVERED': return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
      case 'CANCELLED': return 'bg-rose-500/10 border border-rose-500/20 text-rose-400';
      default: return 'bg-white/5 border border-white/10 text-white';
    }
  };

  const toggleExpandOrder = (id) => {
    if (expandedOrder === id) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(id);
    }
  };

  if (!user || user.role !== 'BUYER') return null;

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Buyer Dashboard</h1>
          <p className="text-xs text-text-secondary mt-1">Manage your order history, wishlist items, and notifications.</p>
        </div>
        <button 
          onClick={() => { fetchOrders(); fetchWishlist(); fetchNotifications(); fetchContacts(); }} 
          className="p-2 hover:bg-white/5 border border-white/10 rounded-xl transition-all text-white flex items-center gap-1.5 text-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-white/5 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'orders'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Orders History
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'wishlist'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          My Wishlist
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all relative ${
            activeTab === 'notifications'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-secondary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'chat'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Inbox Chat
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          {loadingOrders ? (
            <div className="text-center py-12 text-xs text-text-secondary animate-pulse">Loading orders...</div>
          ) : orders.length > 0 ? (
            orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const addr = order.shippingAddress;
              return (
                <div 
                  key={order.id} 
                  className="glass-panel border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
                >
                  <div 
                    onClick={() => toggleExpandOrder(order.id)}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01]"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase">#{order.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1">
                      <p className="text-[10px] text-text-secondary">Shop: <span className="text-white font-bold">{order.seller.name}</span></p>
                      <p className="text-xs font-bold text-brand-accent">LKR {order.totalAmount.toLocaleString()}</p>
                    </div>

                    <div className="shrink-0 text-text-secondary">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-white/5 bg-white/[0.01] flex flex-col gap-5 text-xs">
                      <div className="flex flex-col gap-3">
                        <p className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/5 pb-1">Items Summary</p>
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="text-text-secondary">{item.product.name} (x{item.quantity})</span>
                            <span className="text-white font-semibold">LKR {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-white/5 pb-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                          Delivery Address
                        </p>
                        <p className="text-text-secondary font-medium">{addr.fullName}</p>
                        <p className="text-text-secondary">{addr.addressLine1} {addr.addressLine2 && `, ${addr.addressLine2}`}</p>
                        <p className="text-text-secondary">{addr.city}, {addr.province} - {addr.postalCode}</p>
                        <p className="text-text-secondary">Phone: {addr.phoneNumber}</p>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1 text-[10px] text-text-secondary">
                        <span>Payment Method: <span className="text-white font-semibold">{
                          order.paymentMethod === 'COD' 
                            ? 'Cash on Delivery' 
                            : order.paymentMethod === 'WHATSAPP' 
                              ? 'WhatsApp Checkout' 
                              : 'Card Payment (Stripe)'
                        }</span></span>
                        <span>Shop Contact: <span className="text-brand-secondary font-semibold">{order.seller.whatsapp}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center text-xs text-text-secondary italic">
              No orders placed yet.
            </div>
          )}
        </div>
      )}

      {/* Wishlist Tab Content */}
      {activeTab === 'wishlist' && (
        <div className="flex flex-col gap-4">
          {loadingWishlist ? (
            <div className="text-center py-12 text-xs text-text-secondary animate-pulse">Loading wishlist...</div>
          ) : wishlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {wishlist.map((prod) => {
                const img = prod.imageUrls && prod.imageUrls.length > 0 ? `${HOST_URL}${prod.imageUrls[0]}` : '';
                return (
                  <div key={prod.id} className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-white/5 relative">
                    <button
                      onClick={() => handleRemoveFromWishlist(prod.id)}
                      className="absolute top-3 right-3 p-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded-lg transition-all cursor-pointer"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Link href={`/product/${prod.slug}`}>
                      <div className="w-full aspect-square rounded-xl bg-white/5 mb-3 overflow-hidden">
                        <img src={img} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] text-brand-primary font-bold uppercase">{prod.seller.name}</span>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">{prod.name}</h4>
                      <p className="text-[11px] font-bold text-brand-accent mt-1">LKR {prod.price.toLocaleString()}</p>
                    </Link>

                    <button
                      onClick={() => addItem(prod, 1)}
                      className="w-full mt-4 py-2 bg-gradient-brand text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 transition-all cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center text-xs text-text-secondary italic">
              Your wishlist is empty. Explore items and click the heart icon to save them.
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab Content */}
      {activeTab === 'notifications' && (
        <div className="flex flex-col gap-3">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && markNotificationAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all flex justify-between items-start gap-4 ${
                  notif.isRead
                    ? 'bg-white/5 border-white/5 text-text-secondary'
                    : 'bg-brand-primary/10 border-brand-primary/30 text-white cursor-pointer hover:bg-brand-primary/15'
                }`}
              >
                <div className="flex gap-3">
                  <span className="text-lg">🔔</span>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs leading-relaxed font-medium">{notif.message}</p>
                    <span className="text-[9px] text-gray-500 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                {!notif.isRead && (
                  <span className="text-[9px] bg-brand-secondary text-white font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-widest">
                    New
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center text-xs text-text-secondary italic">
              You have no notifications in your inbox.
            </div>
          )}
        </div>
      )}

      {/* Private Chat Inbox */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
          {/* Contacts List Column */}
          <div className="md:col-span-1 glass-panel border border-white/5 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white border-b border-white/5 pb-2">Chats</h3>
            {contacts.length > 0 ? (
              <div className="flex flex-col gap-2">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => { setActiveContact(contact); fetchThread(contact.id); }}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      activeContact?.id === contact.id
                        ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                        : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">
                      {contact.shop?.name || contact.email}
                    </p>
                    <span className="text-[9px] text-gray-500 uppercase font-semibold">
                      {contact.shop ? 'Shop Creator' : contact.role}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary italic text-center py-8">No chats initiated yet.</p>
            )}
          </div>

          {/* Conversation Thread Column */}
          <div className="md:col-span-2 glass-panel border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-full">
            {activeContact ? (
              <>
                {/* Header */}
                <div className="border-b border-white/5 pb-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-white font-bold block">{activeContact.shop?.name || activeContact.email}</span>
                    <span className="text-[9px] text-gray-500">Messaging Creator</span>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto my-4 flex flex-col gap-3 pr-1 text-xs">
                  {messagesList.length > 0 ? (
                    messagesList.map((msg) => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`max-w-[75%] p-3 rounded-2xl flex flex-col gap-1 ${
                            isMe
                              ? 'bg-brand-primary/10 border border-brand-primary/20 text-white self-end rounded-br-none'
                              : 'bg-white/5 border border-white/5 text-text-secondary self-start rounded-bl-none'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span className="text-[8px] text-gray-600 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-text-secondary italic text-center py-10">No messages in this chat thread yet.</p>
                  )}
                </div>

                {/* Footer Send Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/5 pt-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-gradient-brand text-white rounded-xl hover:opacity-90 flex items-center justify-center cursor-pointer transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-xs text-text-secondary italic">
                <MessageSquare className="w-8 h-8 text-gray-500" />
                Select a creator shop on the left to start messaging.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
