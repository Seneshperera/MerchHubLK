'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth';
import axios from 'axios';
import { Check, X, ShieldAlert, FolderPlus, Trash2, Users, FolderTree, AlertCircle, Edit, RefreshCw, Sparkles, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const HOST_URL = 'http://localhost:5000';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('sellers');
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchSellers();
    fetchCategories();
  }, [user, router]);

  useEffect(() => {
    if (activeTab === 'moderation') fetchAdminProducts();
  }, [activeTab]);

  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      const res = await axios.get(`${API_URL}/admin/sellers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSellers(res.data);
    } catch (err) {
      console.error('Fetch sellers error:', err);
      setError('Could not load sellers.');
    } finally {
      setLoadingSellers(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Fetch categories error:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchAdminProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await axios.get(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Fetch admin products error:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleApproveSeller = async (id) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_URL}/admin/sellers/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSellers();
    } catch (err) {
      console.error('Approve seller error:', err);
      alert('Failed to approve seller.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSeller = async (id) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_URL}/admin/sellers/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSellers();
    } catch (err) {
      console.error('Reject seller error:', err);
      alert('Failed to reject seller.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleShopFeatured = async (shopId, currentStatus) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_URL}/admin/shops/${shopId}/featured`, {
        isFeatured: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSellers();
    } catch (err) {
      console.error('Toggle shop featured error:', err);
      alert('Failed to update shop featured status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleProductFeatured = async (productId, currentStatus) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_URL}/admin/products/${productId}/featured`, {
        isFeatured: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdminProducts();
    } catch (err) {
      console.error('Toggle product featured error:', err);
      alert('Failed to update product featured status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProductStatus = async (productId, newStatus) => {
    setActionLoading(true);
    try {
      await axios.patch(`${API_URL}/admin/products/${productId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdminProducts();
    } catch (err) {
      console.error('Moderator status update error:', err);
      alert('Failed to update product status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProductModerated = async (productId) => {
    if (!confirm('Are you sure you want to delete this product listing from the platform? This action is irreversible.')) return;

    setActionLoading(true);
    try {
      await axios.delete(`${API_URL}/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdminProducts();
    } catch (err) {
      console.error('Moderator deletion error:', err);
      alert('Failed to delete product.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName) {
      alert('Category name is required');
      return;
    }

    const formData = new FormData();
    formData.append('name', catName);
    formData.append('description', catDesc);
    if (catImage) {
      formData.append('image', catImage);
    }

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/categories`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setCatName('');
      setCatDesc('');
      setCatImage(null);
      
      const fileInput = document.getElementById('cat-image-input');
      if (fileInput) fileInput.value = '';

      fetchCategories();
      alert('Category created successfully!');
    } catch (err) {
      console.error('Create category error:', err);
      alert(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? All products under it will be affected.')) return;
    
    setActionLoading(true);
    try {
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) {
      console.error('Delete category error:', err);
      alert('Failed to delete category.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Admin Dashboard</h1>
          <p className="text-xs text-text-secondary mt-1">Review sellers, approve storefronts, manage categories, and moderate product listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { fetchSellers(); fetchCategories(); if (activeTab === 'moderation') fetchAdminProducts(); }} 
            className="p-2 hover:bg-white/5 border border-white/10 rounded-xl transition-all text-white flex items-center gap-1 text-xs cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-white/5 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sellers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'sellers'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Seller Approvals
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'categories'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Manage Categories
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shrink-0 transition-all ${
            activeTab === 'moderation'
              ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
              : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Moderation Hub
        </button>
      </div>

      {/* Sellers Tab Content */}
      {activeTab === 'sellers' && (
        <div className="flex flex-col gap-6">
          <div className="glass-panel border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Registered Sellers</h3>
            </div>
            
            {loadingSellers ? (
              <div className="p-8 text-center text-xs text-text-secondary animate-pulse">Loading sellers...</div>
            ) : sellers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Email</th>
                      <th className="p-4">Register Date</th>
                      <th className="p-4">Shop Name</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((sel) => (
                      <tr key={sel.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 text-white font-medium">{sel.email}</td>
                        <td className="p-4 text-text-secondary">{new Date(sel.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          {sel.shop ? (
                            <Link href={`/shop/${sel.shop.slug}`} className="text-brand-primary hover:text-brand-secondary font-bold">
                              {sel.shop.name}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic">Not set up yet</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sel.isApproved 
                              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
                              : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                          }`}>
                            {sel.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4">
                          {sel.shop ? (
                            <button
                              onClick={() => handleToggleShopFeatured(sel.shop.id, sel.shop.isFeatured)}
                              disabled={actionLoading}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                sel.shop.isFeatured
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
                              }`}
                              title={sel.shop.isFeatured ? 'Featured Shop' : 'Mark as Featured'}
                            >
                              <Sparkles className="w-4 h-4 fill-current" />
                            </button>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          {!sel.isApproved ? (
                            <button
                              onClick={() => handleApproveSeller(sel.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 font-bold rounded-lg transition-all flex items-center gap-1 text-[11px] disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRejectSeller(sel.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-bold rounded-lg transition-all flex items-center gap-1 text-[11px] disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-text-secondary italic">
                No seller accounts registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab Content */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-brand-primary" />
                Add Category
              </h3>

              <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Stickers"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Description</label>
                  <textarea
                    placeholder="Brief details..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    rows={3}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Category Image</label>
                  <input
                    id="cat-image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCatImage(e.target.files[0])}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white/10 file:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-gradient-brand text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/20 transition-all mt-2 disabled:opacity-50"
                >
                  Create Category
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-panel border border-white/5 rounded-3xl p-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3 mb-4">
                Categories List ({categories.length})
              </h3>

              {loadingCategories ? (
                <div className="text-center py-6 text-xs text-text-secondary animate-pulse">Loading categories...</div>
              ) : categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.08] transition-colors"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{cat.name}</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">{cat.description || 'No description'}</p>
                        <p className="text-[9px] text-brand-primary font-bold mt-2">Products: {cat._count?.products || 0}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={actionLoading}
                        className="p-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/15 rounded-xl text-text-secondary hover:text-rose-400 transition-all shrink-0 cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-text-secondary italic">
                  No categories created yet. Add one on the left.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Moderation Hub Content */}
      {activeTab === 'moderation' && (
        <div className="flex flex-col gap-6">
          <div className="glass-panel border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">All Platform Listings</h3>
            </div>

            {loadingProducts ? (
              <div className="p-8 text-center text-xs text-text-secondary animate-pulse">Loading product listings...</div>
            ) : products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Product</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Seller (Shop)</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4">Status Mod</th>
                      <th className="p-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const img = prod.imageUrls && prod.imageUrls.length > 0 ? `${HOST_URL}${prod.imageUrls[0]}` : '';
                      return (
                        <tr key={prod.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <img src={img} alt={prod.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <Link href={`/product/${prod.slug}`} className="text-white font-bold hover:text-brand-primary block truncate max-w-[130px]">
                                {prod.name}
                              </Link>
                              <span className="text-[10px] text-brand-accent font-semibold">{prod.category?.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-text-secondary font-medium">{prod.sku}</td>
                          <td className="p-4">
                            <Link href={`/shop/${prod.seller?.slug}`} className="text-white font-medium hover:underline">
                              {prod.seller?.name}
                            </Link>
                          </td>
                          <td className="p-4 text-white font-semibold">{prod.stock} items</td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleProductFeatured(prod.id, prod.isFeatured)}
                              disabled={actionLoading}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                prod.isFeatured
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'
                              }`}
                              title={prod.isFeatured ? 'Featured Product' : 'Mark as Featured'}
                            >
                              <Sparkles className="w-4 h-4 fill-current" />
                            </button>
                          </td>
                          <td className="p-4">
                            <select
                              value={prod.status}
                              onChange={(e) => handleUpdateProductStatus(prod.id, e.target.value)}
                              disabled={actionLoading}
                              className="bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                            >
                              <option value="PUBLISHED" className="bg-bg-dark">PUBLISHED</option>
                              <option value="DRAFT" className="bg-bg-dark">DRAFT</option>
                              <option value="ARCHIVED" className="bg-bg-dark">ARCHIVED</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteProductModerated(prod.id)}
                              disabled={actionLoading}
                              className="p-2 hover:bg-rose-500/10 hover:border-rose-500/15 border border-transparent rounded-lg text-rose-400 transition-all cursor-pointer"
                              title="Moderate delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-text-secondary italic">
                No product listings available on the platform yet.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
