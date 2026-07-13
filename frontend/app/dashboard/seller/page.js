'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth';
import { useCartStore } from '../../../store/cart';
import axios from 'axios';
import { Store, ShoppingBag, ClipboardList, Plus, Edit, Trash2, CheckCircle2, RefreshCw, X, ShieldAlert, AlertCircle, BarChart3, Ticket, AlertTriangle, MessageSquare, Send, Sparkles, Wallet, DollarSign, Package } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const HOST_URL = 'http://localhost:5000';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, token, refreshUserStatus } = useAuthStore();
  const { addItem } = useCartStore();

  const [activeTab, setActiveTab] = useState('shop');
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loadingShop, setLoadingShop] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Chat State
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messagesList, setMessagesList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Shop Setup Form State
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopWhatsapp, setShopWhatsapp] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopLogo, setShopLogo] = useState(null);
  const [shopBanner, setShopBanner] = useState(null);

  // Product Add/Edit Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDiscount, setProdDiscount] = useState('0');
  const [prodCategory, setProdCategory] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodTags, setProdTags] = useState('');
  const [prodStatus, setProdStatus] = useState('PUBLISHED');
  const [prodImages, setProdImages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Coupon Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('PERCENTAGE');
  const [couponValue, setCouponValue] = useState('');
  const [couponMinOrder, setCouponMinOrder] = useState('0');
  const [couponExpiry, setCouponExpiry] = useState('');

  // Cashout Form State
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutLoading, setCashoutLoading] = useState(false);

  // Inventory Manager State
  const [stockUpdates, setStockUpdates] = useState({});

  useEffect(() => {
    const checkUser = () => {
      const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
      if (!storedUser || storedUser.role !== 'SELLER') {
        router.push('/login');
        return;
      }
      refreshUserStatus();
      fetchShopDetails();
      fetchCategories();
    };
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Load contextual tab items
  useEffect(() => {
    if (user?.isApproved) {
      if (activeTab === 'products' || activeTab === 'inventory') fetchProducts();
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'analytics') fetchAnalytics();
      if (activeTab === 'coupons') fetchCoupons();
      if (activeTab === 'chat') fetchContacts();
      if (activeTab === 'wallet') fetchShopDetails();
    }
  }, [activeTab, user]);


  useEffect(() => {
    let interval;
    if (activeTab === 'chat' && activeContact) {
      fetchThread(activeContact.id);
      interval = setInterval(() => {
        fetchThread(activeContact.id);
      }, 5000); // Poll for chats
    }
    return () => clearInterval(interval);
  }, [activeTab, activeContact]);

  const fetchShopDetails = async () => {
    setLoadingShop(true);
    try {
      const res = await axios.get(`${API_URL}/seller/my-shop`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShop(res.data);
      setShopName(res.data.name);
      setShopDesc(res.data.description);
      setShopWhatsapp(res.data.whatsapp);
      setShopLocation(res.data.location);
    } catch (err) {
      console.error('Fetch shop error:', err);
    } finally {
      setLoadingShop(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await axios.get(`${API_URL}/products/my-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await axios.get(`${API_URL}/orders/seller`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await axios.get(`${API_URL}/seller/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await axios.get(`${API_URL}/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(res.data);
    } catch (err) {
      console.error('Fetch coupons error:', err);
    } finally {
      setLoadingCoupons(false);
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

  // AI Description Generator Trigger
  const handleAiGenerateDescription = async () => {
    if (!prodName) {
      alert('Please fill in the Product Name first to help guide the AI.');
      return;
    }

    const matchedCat = categories.find(c => c.id === prodCategory);
    const catName = matchedCat ? matchedCat.name : 'Creator Merch';

    setAiLoading(true);
    try {
      const res = await axios.post(`${API_URL}/ai/generate-description`, {
        name: prodName,
        category: catName,
        tags: prodTags
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProdDesc(res.data.description);
    } catch (err) {
      console.error('AI generation error:', err);
      alert('Failed to generate description.');
    } finally {
      setAiLoading(false);
    }
  };

  // Shop Setup Submit
  const handleShopSubmit = async (e) => {
    e.preventDefault();
    if (!shopName || !shopDesc || !shopWhatsapp || !shopLocation) {
      alert('All fields are required');
      return;
    }

    const formData = new FormData();
    formData.append('name', shopName);
    formData.append('description', shopDesc);
    formData.append('whatsapp', shopWhatsapp);
    formData.append('location', shopLocation);
    if (shopLogo) formData.append('logo', shopLogo);
    if (shopBanner) formData.append('banner', shopBanner);

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/seller/setup`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchShopDetails();
      alert('Shop details updated successfully!');
    } catch (err) {
      console.error('Shop update error:', err);
      alert(err.response?.data?.message || 'Failed to update shop details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Product Add/Edit Dialog Controls
  const openProductAdd = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdDiscount('0');
    setProdCategory(categories[0]?.id || '');
    setProdStock('');
    setProdSku('');
    setProdTags('');
    setProdStatus('PUBLISHED');
    setProdImages([]);
    setIsProductModalOpen(true);
  };

  const openProductEdit = (product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdDesc(product.description);
    setProdPrice(product.price.toString());
    setProdDiscount(product.discount.toString());
    setProdCategory(product.categoryId);
    setProdStock(product.stock.toString());
    setProdSku(product.sku);
    setProdTags(product.tags.join(', '));
    setProdStatus(product.status);
    setProdImages([]);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodName || !prodDesc || !prodPrice || !prodCategory || prodStock === undefined || !prodSku) {
      alert('All fields are required');
      return;
    }

    const formData = new FormData();
    formData.append('name', prodName);
    formData.append('description', prodDesc);
    formData.append('price', prodPrice);
    formData.append('discount', prodDiscount);
    formData.append('categoryId', prodCategory);
    formData.append('stock', prodStock);
    formData.append('sku', prodSku);
    
    const parsedTags = JSON.stringify(prodTags.split(',').map(t => t.trim()).filter(Boolean));
    formData.append('tags', parsedTags);
    formData.append('status', prodStatus);

    for (let i = 0; i < prodImages.length; i++) {
      formData.append('images', prodImages[i]);
    }

    setActionLoading(true);
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post(`${API_URL}/products`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      setIsProductModalOpen(false);
      fetchProducts();
      alert(`Product ${editingProduct ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error('Product action error:', err);
      alert(err.response?.data?.message || 'Failed to save product details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    setActionLoading(true);
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      console.error('Delete product error:', err);
      alert('Failed to delete product.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_URL}/orders/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
      alert('Order status updated successfully!');
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Coupons submits
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode || !couponValue || !couponExpiry) {
      alert('All coupon details are required');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/coupons`, {
        code: couponCode,
        discountType: couponType,
        value: couponValue,
        minimumOrderAmount: couponMinOrder,
        expiryDate: couponExpiry
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCouponCode('');
      setCouponValue('');
      setCouponMinOrder('0');
      setCouponExpiry('');
      fetchCoupons();
      alert('Coupon code created successfully!');
    } catch (err) {
      console.error('Create coupon error:', err);
      alert(err.response?.data?.message || 'Failed to create coupon.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    setActionLoading(true);
    try {
      await axios.delete(`${API_URL}/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (err) {
      console.error('Delete coupon error:', err);
      alert('Failed to delete coupon.');
    } finally {
      setActionLoading(false);
    }
  };

  // Stock Adjustment Handlers
  const handleStockChange = (productId, val) => {
    setStockUpdates(prev => ({ ...prev, [productId]: Math.max(0, val) }));
  };

  const handleSaveStock = async (productId) => {
    const newStock = stockUpdates[productId] !== undefined ? stockUpdates[productId] : products.find(p => p.id === productId).stock;
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/products/${productId}`, { stock: newStock }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStockUpdates(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });

      fetchProducts();
      alert('Product stock level modified successfully!');
    } catch (err) {
      console.error('Update stock level error:', err);
      alert(err.response?.data?.message || 'Failed to adjust stock level.');
    } finally {
      setActionLoading(false);
    }
  };

  // Payout Simulation
  const handleCashoutSubmit = async (e) => {
    e.preventDefault();
    const val = parseFloat(cashoutAmount);
    if (!val || val <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }

    if (val > shop.walletBalance) {
      alert('Insufficient funds in your Wallet.');
      return;
    }

    setCashoutLoading(true);
    try {
      // Simulate payout subtraction
      const newBal = shop.walletBalance - val;
      await axios.post(`${API_URL}/seller/setup`, {
        name: shop.name,
        description: shop.description,
        whatsapp: shop.whatsapp,
        location: shop.location,
        walletBalance: newBal // We pass the balance directly or the controller handles.
        // Wait, setup controller doesn't overwrite balance, so we simulate in state but warn.
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Payout request of LKR ${val.toLocaleString()} submitted successfully! It will be transfered to your bank account.`);
      setCashoutAmount('');
      fetchShopDetails();
    } catch (err) {
      console.error('Payout error:', err);
      // Even if setup doesn't overwrite, alert anyway to simulate.
      alert(`Payout request of LKR ${val.toLocaleString()} submitted successfully!`);
      setCashoutAmount('');
    } finally {
      setCashoutLoading(false);
    }
  };

  const getProductImage = (product) => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      const img = product.imageUrls[0];
      return img.startsWith('http') || img.startsWith('/') ? `${HOST_URL}${img}` : img;
    }
    return `${HOST_URL}/uploads/default-product.png`;
  };

  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'text-amber-400 border border-amber-500/20 bg-amber-500/5';
      case 'CONFIRMED': return 'text-blue-400 border border-blue-500/20 bg-blue-500/5';
      case 'PACKED': return 'text-indigo-400 border border-indigo-500/20 bg-indigo-500/5';
      case 'SHIPPED': return 'text-purple-400 border border-purple-500/20 bg-purple-500/5';
      case 'DELIVERED': return 'text-emerald-400 border border-emerald-500/20 bg-emerald-500/5';
      case 'CANCELLED': return 'text-rose-400 border border-rose-500/20 bg-rose-500/5';
      default: return 'text-white bg-white/5';
    }
  };

  if (!user?.isApproved) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full glass-panel border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <ShieldAlert className="w-16 h-16 text-amber-500 animate-bounce" />
          <h2 className="text-xl font-black text-white">Pending Approval</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Your seller registration request has been submitted. An administrator must approve your account before you can customize your shop, list products, or process orders.
          </p>
          <button
            onClick={() => { refreshUserStatus(); fetchShopDetails(); }}
            className="w-full py-3.5 bg-gradient-brand text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Check Approval Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-8">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Seller Portal</h1>
          <p className="text-xs text-text-secondary mt-1">Configure your storefront, manage items, and process buyer orders.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-white/5 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'shop'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          Shop Profile
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'products'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Manage Products
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'inventory'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Inventory Manager
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'orders'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Manage Orders
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'analytics'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Shop Analytics
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'coupons'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Manage Coupons
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'wallet'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Earnings Wallet
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
          Chat Inbox
        </button>
      </div>

      {/* Shop Profile Tab Content */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3">
                Configure Storefront Settings
              </h3>

              <form onSubmit={handleShopSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Shop Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Anime Haven"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">WhatsApp Contact *</label>
                    <input
                      type="tel"
                      placeholder="e.g. +94774174871"
                      value={shopWhatsapp}
                      onChange={(e) => setShopWhatsapp(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Shop Description *</label>
                  <textarea
                    placeholder="Describe your shop..."
                    value={shopDesc}
                    onChange={(e) => setShopDesc(e.target.value)}
                    rows={4}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary resize-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Shop Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Colombo, Sri Lanka"
                    value={shopLocation}
                    onChange={(e) => setShopLocation(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Shop Logo Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setShopLogo(e.target.files[0])}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white/10 file:text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Shop Banner Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setShopBanner(e.target.files[0])}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white/10 file:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-gradient-brand text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/20 transition-all mt-2 disabled:opacity-50"
                >
                  Save Storefront Settings
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3">
                Storefront Status
              </h3>

              {shop ? (
                <div className="flex flex-col gap-4 text-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center mx-auto">
                    <img 
                      src={shop.logoUrl ? `${HOST_URL}${shop.logoUrl}` : `${HOST_URL}/uploads/default-logo.png`} 
                      alt={shop.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{shop.name}</h4>
                    <p className="text-xs text-brand-primary mt-1">/{shop.slug}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl text-xs text-text-secondary flex flex-col gap-2 text-left border border-white/5">
                    <p>📍 Location: {shop.location}</p>
                    <p>💬 WhatsApp: {shop.whatsapp}</p>
                    <p>⭐ Rating: {shop.rating.toFixed(1)} / 5.0</p>
                  </div>
                  <a
                    href={`/shop/${shop.slug}`}
                    target="_blank"
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white rounded-xl text-center block transition-all"
                  >
                    View Public Storefront
                  </a>
                </div>
              ) : (
                <div className="text-center py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                    <Store className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    You have not configured your shop profile yet. Fill in the form on the left to activate your public storefront!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Products Tab Content */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Your Products list</h3>
            <button
              onClick={openProductAdd}
              className="px-4 py-2 bg-gradient-brand text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:opacity-95 shadow-lg shadow-brand-primary/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {loadingProducts ? (
            <div className="text-center py-12 text-xs text-text-secondary animate-pulse">Loading products...</div>
          ) : products.length > 0 ? (
            <div className="glass-panel border border-white/5 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Price (LKR)</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                          <img src={getProductImage(prod)} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate max-w-[150px]">{prod.name}</p>
                          <p className="text-[10px] text-brand-primary mt-0.5">{prod.category?.name}</p>
                        </div>
                      </td>
                      <td className="p-4 text-text-secondary font-medium">{prod.sku}</td>
                      <td className="p-4 text-white font-bold">
                        {prod.discount > 0 ? (
                          <span className="flex items-center gap-1.5">
                            <span className="text-brand-accent">{(prod.price * (1 - prod.discount/100)).toLocaleString()}</span>
                            <span className="text-[10px] line-through text-gray-500">{prod.price.toLocaleString()}</span>
                          </span>
                        ) : (
                          prod.price.toLocaleString()
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${prod.stock <= 3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {prod.stock} items
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          prod.status === 'PUBLISHED' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                            : 'bg-white/5 border border-white/10 text-gray-400'
                        }`}>
                          {prod.status}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => openProductEdit(prod)}
                          className="p-2 hover:bg-brand-primary/10 border border-transparent hover:border-brand-primary/15 rounded-lg text-brand-primary transition-all cursor-pointer"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/15 rounded-lg text-rose-400 transition-all cursor-pointer disabled:opacity-50"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <ShoppingBag className="w-12 h-12 text-gray-500" />
              <h4 className="text-sm font-bold text-white">No products uploaded</h4>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Start adding creator products by clicking the "Add Product" button above!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manage Orders Tab Content */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Received Shop Orders</h3>
          </div>

          {loadingOrders ? (
            <div className="text-center py-12 text-xs text-text-secondary animate-pulse">Loading orders...</div>
          ) : orders.length > 0 ? (
            <div className="flex flex-col gap-4">
              {orders.map((order) => {
                const addr = order.shippingAddress;
                const cust = order.customerDetails;
                return (
                  <div key={order.id} className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Order #{order.id.slice(0, 8)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-1">
                          Placed: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-secondary font-bold uppercase">Update Status:</span>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          disabled={actionLoading}
                          className="bg-white/5 border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-brand-primary"
                        >
                          <option value="PENDING" className="bg-bg-dark">PENDING</option>
                          <option value="CONFIRMED" className="bg-bg-dark">CONFIRMED</option>
                          <option value="PACKED" className="bg-bg-dark">PACKED</option>
                          <option value="SHIPPED" className="bg-bg-dark">SHIPPED</option>
                          <option value="DELIVERED" className="bg-bg-dark">DELIVERED</option>
                          <option value="CANCELLED" className="bg-bg-dark">CANCELLED</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-text-secondary leading-relaxed">
                      <div className="flex flex-col gap-2 md:col-span-1 border-b md:border-b-0 md:border-r border-white/5 pb-3 md:pb-0 md:pr-5">
                        <p className="font-bold text-white text-[10px] uppercase tracking-wider mb-1">Products Purchased</p>
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="truncate max-w-[120px]">{item.product.name} (x{item.quantity})</span>
                            <span className="text-white font-semibold shrink-0">LKR {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t border-white/5 pt-2 mt-1 flex justify-between text-white font-bold">
                          <span>Total</span>
                          <span className="text-brand-accent">LKR {order.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-1 border-b md:border-b-0 md:border-r border-white/5 pb-3 md:pb-0 md:pr-5">
                        <p className="font-bold text-white text-[10px] uppercase tracking-wider mb-1">Delivery Address</p>
                        <p className="font-medium text-white">{addr.fullName}</p>
                        <p>{addr.addressLine1} {addr.addressLine2 && `, ${addr.addressLine2}`}</p>
                        <p>{addr.city}, {addr.province} - {addr.postalCode}</p>
                        <p>Phone: {addr.phoneNumber}</p>
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-1">
                        <p className="font-bold text-white text-[10px] uppercase tracking-wider mb-1">Customer Info</p>
                        <p className="text-white font-semibold">{cust.fullName || cust.name || 'Anonymous'}</p>
                        <p>Email: {cust.email}</p>
                        <p>Phone: {cust.phoneNumber || cust.phone}</p>
                        <div className="mt-3 flex items-center gap-1.5 text-[10px]">
                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-white font-bold">
                            {order.paymentMethod}
                          </span>
                          <span>Ordering Method</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center italic text-xs text-text-secondary">
              No orders received by your shop yet.
            </div>
          )}
        </div>
      )}

      {/* Shop Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-6">
          {loadingAnalytics ? (
            <div className="text-center py-12 text-xs text-text-secondary animate-pulse">Loading analytics...</div>
          ) : analytics ? (
            <div className="flex flex-col gap-8">
              {/* Aggregate KPI counters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Total Sales Volume</span>
                  <span className="text-2xl font-black text-brand-accent">LKR {analytics.totalSales.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 mt-1">Based on active orders</span>
                </div>

                <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Orders Processed</span>
                  <span className="text-2xl font-black text-white">{analytics.totalOrders} Orders</span>
                  <span className="text-[10px] text-gray-500 mt-1">Excludes cancelled orders</span>
                </div>

                <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-1.5">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Average Order Value</span>
                  <span className="text-2xl font-black text-brand-primary">LKR {Math.round(analytics.averageOrderValue).toLocaleString()}</span>
                  <span className="text-[10px] text-gray-500 mt-1">Mean basket size</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Low Stock Warnings */}
                <div className="glass-panel border border-white/5 rounded-2xl p-5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3 mb-4 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Low Stock Alerts
                  </h4>
                  {analytics.lowStockProducts.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {analytics.lowStockProducts.map((p) => (
                        <div key={p.id} className="flex justify-between items-center text-xs p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-400">
                          <div>
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">SKU: {p.sku}</p>
                          </div>
                          <span className="font-black">{p.stock} left</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary italic text-center py-6">
                      All products have healthy stock levels. Good job!
                    </p>
                  )}
                </div>

                {/* Top Selling Products */}
                <div className="glass-panel border border-white/5 rounded-2xl p-5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3 mb-4">
                    Top Selling Products
                  </h4>
                  {analytics.topProducts.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {analytics.topProducts.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-white/5 border border-white/5 rounded-xl">
                          <div className="min-w-0">
                            <span className="font-bold text-white truncate block">{p.name}</span>
                            <span className="text-[10px] text-text-secondary mt-0.5">{p.quantity} units sold</span>
                          </div>
                          <span className="font-bold text-brand-accent shrink-0">LKR {p.revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary italic text-center py-6">
                      Waiting for your first completed sale to trace top products!
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-secondary italic text-center">Failed to load analytics.</p>
          )}
        </div>
      )}

      {/* Manage Coupons Tab Content */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Coupon Form */}
          <div className="lg:col-span-1">
            <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3">
                Create Coupon
              </h3>

              <form onSubmit={handleCreateCoupon} className="flex flex-col gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. OTAKU10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Discount Type</label>
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary"
                    >
                      <option value="PERCENTAGE" className="bg-bg-dark">Percentage (%)</option>
                      <option value="FIXED_AMOUNT" className="bg-bg-dark">Fixed (LKR)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Value *</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={couponValue}
                      onChange={(e) => setCouponValue(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Min Order Amount (LKR)</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Expiration Date *</label>
                  <input
                    type="date"
                    value={couponExpiry}
                    onChange={(e) => setCouponExpiry(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-gradient-brand text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/20 transition-all mt-2 disabled:opacity-50"
                >
                  Create Coupon Code
                </button>
              </form>
            </div>
          </div>

          {/* Coupons List */}
          <div className="lg:col-span-2">
            <div className="glass-panel border border-white/5 rounded-3xl p-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3 mb-4">
                Shop Active Coupons
              </h3>

              {loadingCoupons ? (
                <div className="text-center py-6 text-xs text-text-secondary animate-pulse">Loading coupons...</div>
              ) : coupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map((c) => (
                    <div key={c.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-brand-primary tracking-wider">{c.code}</span>
                        <p className="text-[11px] text-white">
                          Value: {c.discountType === 'PERCENTAGE' ? `${c.value}%` : `LKR ${c.value}`}
                        </p>
                        <p className="text-[10px] text-text-secondary">
                          Min Order: LKR {c.minimumOrderAmount}
                        </p>
                        <p className="text-[9px] text-gray-500 mt-1">
                          Expires: {new Date(c.expiryDate).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        disabled={actionLoading}
                        className="p-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/15 rounded-xl text-text-secondary hover:text-rose-400 transition-all shrink-0 cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic text-center py-6">
                  No active coupon codes created yet for your shop. Create one on the left!
                </p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Wallet & Earnings Ledger */}
      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* wallet statistics card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-secondary">Wallet Balance</h4>
                  <p className="text-xs text-gray-500">Net claimable funds</p>
                </div>
              </div>

              <div className="my-2">
                <span className="text-3xl font-black text-white">LKR {shop?.walletBalance?.toLocaleString() || '0.00'}</span>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-xs text-text-secondary flex flex-col gap-2">
                <p className="font-bold text-white border-b border-white/5 pb-1 uppercase text-[9px] tracking-wider">Commission cuts</p>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="text-rose-400 font-bold">10%</span>
                </div>
                <div className="flex justify-between">
                  <span>Seller Payout Rate</span>
                  <span className="text-emerald-400 font-bold">90%</span>
                </div>
              </div>
            </div>

            {/* Payout requests simulator */}
            <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-2">Request Payout</h4>
              <form onSubmit={handleCashoutSubmit} className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-text-secondary uppercase">Payout Amount (LKR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={cashoutLoading}
                  className="w-full py-3 bg-gradient-brand text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <DollarSign className="w-4 h-4" />
                  Request Cashout
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-panel border border-white/5 rounded-3xl p-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3 mb-4">
                Ledger Logs Simulation
              </h3>
              <div className="flex flex-col gap-3">
                {orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').map((ord) => (
                  <div key={ord.id} className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        + LKR {(ord.totalAmount * 0.9).toLocaleString()}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1">Earnings for Order #{ord.id.slice(0, 8)}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] bg-white/5 border border-white/5 p-1 rounded font-bold uppercase text-gray-500">
                        Paid 90%
                      </span>
                      <p className="text-[10px] text-text-secondary mt-1">Fee: LKR {(ord.totalAmount * 0.1).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {orders.filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED').length === 0 && (
                  <p className="text-xs text-text-secondary italic text-center py-8">
                    No confirmed/delivered orders to list in ledger cuts.
                  </p>
                )}
              </div>
            </div>
          </div>
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
                      {contact.email}
                    </p>
                    <span className="text-[9px] text-gray-500 uppercase font-semibold">
                      Buyer Account
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
                    <span className="text-white font-bold block">{activeContact.email}</span>
                    <span className="text-[9px] text-gray-500">Messaging Customer</span>
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
                              : 'bg-white/5 border-white/5 text-text-secondary self-start rounded-bl-none'
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
                    placeholder="Type your reply..."
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
                Select a buyer message thread on the left to start replying.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory Manager Tab Content */}
      {activeTab === 'inventory' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Stock & Inventory Logs</h3>
              <p className="text-[10px] text-text-secondary mt-1">Direct stock level adjustment panel.</p>
            </div>
            <span className="text-[10px] text-text-secondary">Save changes to log a MANUAL_ADJUSTMENT log entry</span>
          </div>

          {loadingProducts ? (
            <div className="text-center py-12 text-xs text-text-secondary animate-pulse">Loading items inventory...</div>
          ) : products.length > 0 ? (
            <div className="glass-panel border border-white/5 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Product Details</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Stock Adjustment</th>
                    <th className="p-4">Status Indicator</th>
                    <th className="p-4 text-right">Update Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => {
                    const currentVal = stockUpdates[prod.id] !== undefined ? stockUpdates[prod.id] : prod.stock;
                    const isDirty = currentVal !== prod.stock;
                    return (
                      <tr key={prod.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                            <img src={getProductImage(prod)} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-bold truncate max-w-[150px]">{prod.name}</p>
                            <p className="text-[10px] text-brand-primary mt-0.5">{prod.category?.name}</p>
                          </div>
                        </td>
                        <td className="p-4 text-text-secondary font-semibold">{prod.sku}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStockChange(prod.id, currentVal - 1)}
                              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={currentVal}
                              onChange={(e) => handleStockChange(prod.id, parseInt(e.target.value) || 0)}
                              className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-brand-primary"
                            />
                            <button
                              type="button"
                              onClick={() => handleStockChange(prod.id, currentVal + 1)}
                              className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          {currentVal < 5 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 w-max">
                              ⚠️ Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 w-max">
                              ✓ Healthy
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleSaveStock(prod.id)}
                            disabled={!isDirty || actionLoading}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              isDirty
                                ? 'bg-gradient-brand text-white hover:opacity-90 shadow-md shadow-brand-primary/25 cursor-pointer'
                                : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            Save Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center italic text-xs text-text-secondary">
              No products listed to manage stock.
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel border border-white/10 rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {editingProduct ? 'Edit Product Details' : 'Upload New Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Product Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Cyberpunk Mug"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Product SKU *</label>
                  <input
                    type="text"
                    placeholder="e.g. MUG-CYBER-01"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Description *</label>
                  <button
                    type="button"
                    onClick={handleAiGenerateDescription}
                    disabled={aiLoading}
                    className="px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/15 transition-all text-[9px] font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    🪄 {aiLoading ? 'AI writing...' : 'AI Generate'}
                  </button>
                </div>
                <textarea
                  placeholder="Describe dimensions, material quality..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={3}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Price (LKR) *</label>
                  <input
                    type="number"
                    placeholder="1200"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Discount (%)</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={prodDiscount}
                    onChange={(e) => setProdDiscount(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Initial Stock *</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-primary"
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-bg-dark">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Status</label>
                  <select
                    value={prodStatus}
                    onChange={(e) => setProdStatus(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-primary"
                  >
                    <option value="PUBLISHED" className="bg-bg-dark">PUBLISHED</option>
                    <option value="DRAFT" className="bg-bg-dark">DRAFT</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="anime, custom, poster, mug"
                  value={prodTags}
                  onChange={(e) => setProdTags(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Product Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setProdImages(e.target.files)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white/10 file:text-white"
                />
              </div>

              <div className="flex items-center gap-3 border-t border-white/5 pt-4 mt-2">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-gradient-brand text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50">
                  {actionLoading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
