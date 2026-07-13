'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import ProductCard from '../../../components/ProductCard';
import { useCartStore } from '../../../store/cart';
import { useAuthStore } from '../../../store/auth';
import { ShoppingCart, Phone, Tag, ChevronLeft, MapPin, BadgePercent, ShieldCheck, Heart, Star, MessageSquare, AlertTriangle, Send, X, Sparkles } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';
const HOST_URL = 'http://localhost:5000';

export default function ProductDetails() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { user, token } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Wishlist State
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Review Form State
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Floating Chat Widget State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Customization Request Form State
  const [customizationText, setCustomizationText] = useState('');
  const [customizationFileUrl, setCustomizationFileUrl] = useState('');
  const [customizationSubmitting, setCustomizationSubmitting] = useState(false);


  useEffect(() => {
    fetchProductAndReviews();
  }, [slug]);

  // Update page tab title for SEO
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Buy Custom Merchandise Sri Lanka | MerchHub LK`;
    }
  }, [product]);

  // Check wishlist once product is loaded and user is BUYER
  useEffect(() => {
    if (product && user && user.role === 'BUYER') {
      checkWishlistStatus();
    }
  }, [product, user]);

  // Fetch related products once category is resolved
  useEffect(() => {
    if (product?.category?.slug) {
      fetchRelatedProducts();
    }
  }, [product]);

  // Poll Chat thread if floating chat is open
  useEffect(() => {
    let interval;
    if (isChatOpen && product?.seller?.ownerId) {
      fetchChatThread();
      interval = setInterval(() => {
        fetchChatThread();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isChatOpen, product]);

  const fetchProductAndReviews = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const prodRes = await axios.get(`${API_URL}/products/details/${slug}`);
      setProduct(prodRes.data);
      
      const revsRes = await axios.get(`${API_URL}/reviews/${prodRes.data.id}`);
      setReviews(revsRes.data);
      
      setError('');
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Product could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      setLoadingRelated(true);
      const res = await axios.get(`${API_URL}/products?category=${product.category.slug}`);
      const filtered = res.data.filter(p => p.id !== product.id).slice(0, 4);
      setRelatedProducts(filtered);
    } catch (err) {
      console.error('Error loading related items:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const inWishlist = res.data.some(item => item.id === product.id);
      setIsWishlisted(inWishlist);
    } catch (err) {
      console.error('Error checking wishlist status:', err);
    }
  };

  const handleCustomizationFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('designImage', file);

    setCustomizationSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/products/upload-design`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setCustomizationFileUrl(res.data.imageUrl);
    } catch (err) {
      console.error('Error uploading custom design:', err);
      alert('Failed to upload sketch image.');
    } finally {
      setCustomizationSubmitting(false);
    }
  };

  const handleSendCustomizationRequest = async () => {
    if (!user) {
      router.push('/login?redirect=product/' + slug);
      return;
    }
    if (!product?.seller?.ownerId) return;

    let finalMessage = `🎨 *CUSTOMIZATION INQUIRY* for *${product.name}*\n\n` +
      `*Details:* ${customizationText}`;
    if (customizationFileUrl) {
      finalMessage += `\n\n*Sketch Reference:* ${HOST_URL}${customizationFileUrl}`;
    }

    setCustomizationSubmitting(true);
    try {
      await axios.post(`${API_URL}/messages`, {
        receiverId: product.seller.ownerId,
        content: finalMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear forms
      setCustomizationText('');
      setCustomizationFileUrl('');
      
      // Auto open DM chat
      setIsChatOpen(true);
      fetchChatThread();
      alert('Customization request sent! Chat window opened with creator.');
    } catch (err) {
      console.error('Error sending customization request:', err);
      alert('Failed to send request.');
    } finally {
      setCustomizationSubmitting(false);
    }
  };

  const fetchChatThread = async () => {
    if (!product?.seller?.ownerId) return;
    try {
      const res = await axios.get(`${API_URL}/messages/thread/${product.seller.ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(res.data);
    } catch (err) {
      console.error('Error fetching product chat thread:', err);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !product?.seller?.ownerId) return;

    try {
      const res = await axios.post(`${API_URL}/messages`, {
        receiverId: product.seller.ownerId,
        content: chatInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(prev => [...prev, res.data]);
      setChatInput('');
    } catch (err) {
      console.error('Error sending product chat:', err);
    }
  };

  const handleOpenChat = () => {
    if (!user) {
      router.push('/login?redirect=product/' + slug);
      return;
    }
    setIsChatOpen(true);
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push('/login?redirect=product/' + slug);
      return;
    }

    if (user.role !== 'BUYER') {
      alert('Only buyers can add items to their wishlist!');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await axios.delete(`${API_URL}/wishlist/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWishlisted(false);
      } else {
        await axios.post(`${API_URL}/wishlist/${product.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      alert('Failed to update wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=product/' + slug);
      return;
    }

    setReviewLoading(true);
    try {
      await axios.post(`${API_URL}/reviews/${product.id}`, {
        rating: ratingInput,
        comment: commentInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCommentInput('');
      setRatingInput(5);
      
      // Refresh reviews and product rating
      const revsRes = await axios.get(`${API_URL}/reviews/${product.id}`);
      setReviews(revsRes.data);

      const prodRes = await axios.get(`${API_URL}/products/details/${slug}`);
      setProduct(prodRes.data);

      alert('Thank you for your review!');
    } catch (err) {
      console.error('Error submitting review:', err);
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const getProductImage = (idx) => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      const img = product.imageUrls[idx] || product.imageUrls[0];
      return img.startsWith('http') || img.startsWith('/') ? `${HOST_URL}${img}` : img;
    }
    return `${HOST_URL}/uploads/default-product.png`;
  };

  const getShopLogo = () => {
    if (product.seller?.logoUrl) {
      return product.seller.logoUrl.startsWith('http') || product.seller.logoUrl.startsWith('/') 
        ? `${HOST_URL}${product.seller.logoUrl}` 
        : product.seller.logoUrl;
    }
    return `${HOST_URL}/uploads/default-logo.png`;
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleBuyNowWhatsApp = () => {
    const message = `Hello ${product.seller.name}! I would like to order this item from your shop on MerchHub LK:\n\n` +
      `*Product:* ${product.name}\n` +
      `*Quantity:* ${quantity}\n` +
      `*SKU:* ${product.sku}\n` +
      `*Price:* LKR ${currentPrice.toFixed(2)} each\n` +
      `*Total Price:* LKR ${(currentPrice * quantity).toFixed(2)}\n\n` +
      `Please let me know how to proceed with the payment and delivery. Thanks!`;
    
    let targetPhone = product.seller?.whatsapp;
    if (!targetPhone) {
      alert('This seller has not set up a WhatsApp contact number.');
      return;
    }
    let cleaned = targetPhone.replace(/[^\d]/g, '');
    if (!cleaned.startsWith('94') && cleaned.length === 9) {
      cleaned = '94' + cleaned;
    }
    
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Review summaries calculation (5 star, 4 star etc.)
  const getRatingPercentages = () => {
    if (reviews.length === 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rounded = Math.round(r.rating);
      if (counts[rounded] !== undefined) counts[rounded]++;
    });
    const percentages = {};
    Object.keys(counts).forEach(k => {
      percentages[k] = Math.round((counts[k] / reviews.length) * 100);
    });
    return percentages;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-10 py-10 w-full animate-pulse">
        <div className="h-6 bg-white/5 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-white/5 rounded-3xl" />
          <div className="flex flex-col gap-6">
            <div className="h-10 bg-white/5 rounded w-2/3" />
            <div className="h-4 bg-white/5 rounded w-1/3" />
            <div className="h-24 bg-white/5 rounded w-full" />
            <div className="h-12 bg-white/5 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 text-xs text-rose-400">Product not found.</div>;

  const originalPrice = product.price;
  const discount = product.discount || 0;
  const currentPrice = originalPrice * (1 - discount / 100);
  const ratingPercentages = getRatingPercentages();

  return (
    <div className="flex flex-col w-full gap-6 relative">
      
      {/* Back button and Wishlist toggle */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Browse
        </button>

        {/* Heart Wishlist button */}
        {(!user || user.role === 'BUYER') && (
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className={`p-2.5 rounded-full border transition-all cursor-pointer flex items-center justify-center gap-1 text-xs font-bold ${
              isWishlisted
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Product Media Layout */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center">
            <img
              src={getProductImage(selectedImage)}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/600x600/14141d/ffffff?text=' + encodeURIComponent(product.name);
              }}
            />
            {discount > 0 && (
              <div className="absolute top-4 right-4 bg-brand-secondary text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                <BadgePercent className="w-4 h-4" />
                {discount}% OFF
              </div>
            )}
          </div>

          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border shrink-0 bg-white/5 transition-all ${
                    selectedImage === idx ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <img
                    src={url.startsWith('http') || url.startsWith('/') ? `${HOST_URL}${url}` : url}
                    alt={`${product.name} preview ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Meta details */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2.5 py-0.5 rounded-full uppercase">
                  {product.category?.name || 'Merchandise'}
                </span>
                <span className="text-xs text-text-secondary">SKU: {product.sku}</span>
              </div>
              
              {/* Product Star Average */}
              {product.rating > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  {product.rating.toFixed(1)}
                  <span className="text-gray-500 font-medium">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{product.name}</h1>
          </div>

          {/* Low Stock Warning Alert */}
          {product.stock > 0 && product.stock < 5 && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-pulse">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
              <span>Only {product.stock} items left in stock! Order quickly.</span>
            </div>
          )}

          {/* Pricing Info */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Price</p>
              <div className="flex items-baseline gap-2 mt-1">
                {discount > 0 ? (
                  <>
                    <span className="text-xl font-black text-brand-accent">LKR {currentPrice.toLocaleString()}</span>
                    <span className="text-xs text-text-secondary line-through font-semibold">LKR {originalPrice.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-xl font-black text-white">LKR {originalPrice.toLocaleString()}</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Availability</p>
              <p className={`text-xs font-bold mt-1 ${product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {product.stock > 0 ? `${product.stock} items left` : 'Out of Stock'}
              </p>
            </div>
          </div>

          {/* Creator Shop details */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <img
                    src={getShopLogo()}
                    alt={product.seller?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Seller</p>
                  <Link href={`/shop/${product.seller?.slug}`} className="text-sm font-bold text-white hover:text-brand-primary transition-colors block mt-0.5">
                    {product.seller?.name}
                  </Link>
                </div>
              </div>
              <Link
                href={`/shop/${product.seller?.slug}`}
                className="text-xs font-semibold hover:text-brand-secondary transition-colors"
              >
                View Shop
              </Link>
            </div>

            {/* Seller stats */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3 mt-1 text-[11px] text-text-secondary">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>Seller Rating: <strong className="text-white">{(product.seller?.rating || 4.7).toFixed(1)} ★</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ship on Time: <strong className="text-white">{90 + Math.floor((product.seller?.rating || 4.7) * 2)}%</strong></span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white">Description</h3>
            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-white/5 p-4 rounded-2xl border border-white/5">
              {product.description}
            </p>
          </div>

          {/* Customization Request form */}
          {(!user || user.id !== product.seller?.ownerId) && (
            <div className="glass-panel border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                Request Custom Design / Print
              </h4>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Want a custom name print, text print, color choice, or logo on this item? Describe your ideas below, upload a sketch/design, and directly inquire with the creator.
              </p>
              
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex flex-col gap-1.5">
                  <textarea
                    placeholder="Describe what you want to customize (e.g. 'Print name Senesh on the back in white font size 24')..."
                    value={customizationText}
                    onChange={(e) => setCustomizationText(e.target.value)}
                    rows={3}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary resize-none placeholder:text-gray-600"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Attach Custom Sketch / Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomizationFileChange}
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 cursor-pointer"
                  />
                  {customizationFileUrl && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 mt-1">
                      <img src={`${HOST_URL}${customizationFileUrl}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCustomizationFileUrl('')}
                        className="absolute top-1 right-1 p-0.5 bg-black/70 rounded-full text-white hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSendCustomizationRequest}
                  disabled={customizationSubmitting || !customizationText.trim()}
                  className="w-full py-2.5 bg-gradient-brand text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/25 transition-all cursor-pointer disabled:opacity-40"
                >
                  {customizationSubmitting ? 'Uploading & Sending...' : 'Send Customization Inquiry'}
                </button>
              </div>
            </div>
          )}


          {/* Quantity selector and checkout actions */}
          <div className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-2">
            {product.stock > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-text-secondary uppercase">Qty</span>
                    <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg hover:bg-white/5 text-white font-bold flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-xs font-bold text-white">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="w-8 h-8 rounded-lg hover:bg-white/5 text-white font-bold flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={`flex-1 mt-4 ${product.seller?.whatsapp ? 'grid grid-cols-2 gap-3' : 'flex'}`}>
                    <button
                      onClick={handleAddToCart}
                      className="py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer w-full"
                    >
                      <ShoppingCart className="w-4 h-4 text-brand-primary" />
                      Add to Cart
                    </button>
                    
                    {product.seller?.whatsapp && (
                      <button
                        onClick={handleBuyNowWhatsApp}
                        className="py-3 px-4 bg-gradient-brand text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-brand-primary/25 transition-all cursor-pointer w-full"
                      >
                        <Phone className="w-4 h-4" />
                        Order via WhatsApp
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct site chat widget trigger */}
                {(!user || user.id !== product.seller?.ownerId) && (
                  <button
                    onClick={handleOpenChat}
                    className="w-full py-3 border border-brand-primary/30 hover:bg-brand-primary/5 text-brand-primary text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat with Creator (Direct Message)
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-center text-xs font-bold">
                This item is currently sold out. Check back later!
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-text-secondary justify-center mt-2 border-t border-white/5 pt-4">
            <ShieldCheck className="w-4 h-4 text-brand-accent shrink-0" />
            <span>Secure marketplace. WhatsApp orders processed directly with verified creators.</span>
          </div>

        </div>

      </div>

      {/* Reviews Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-white/5 pt-10 mt-6">
        
        {/* Rating Summary bars (like Daraz) */}
        <div className="lg:col-span-1">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3">
              Ratings Summary
            </h3>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{(product.rating || 0).toFixed(1)}</span>
              <span className="text-xs text-text-secondary">/ 5.0</span>
            </div>

            <div className="flex items-center text-amber-400 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(product.rating) ? 'fill-current' : 'text-gray-600'}`}
                />
              ))}
              <span className="text-xs text-text-secondary ml-2 font-semibold">({reviews.length} ratings)</span>
            </div>

            <div className="flex flex-col gap-2 mt-4 text-[11px] text-text-secondary">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-3 text-right">{stars}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${ratingPercentages[stars] || 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-bold text-white">{ratingPercentages[stars] || 0}%</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-4 mt-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-2">Write a Review</h4>
              {user ? (
                user.role === 'BUYER' ? (
                  <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 text-xs">
                    {/* Rating Selector */}
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2.5 text-gray-500">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button; submit"
                            onClick={() => setRatingInput(stars)}
                            className="hover:scale-110 transition-transform"
                          >
                            <Star className={`w-5 h-5 cursor-pointer ${
                              stars <= ratingInput ? 'text-amber-400 fill-current' : 'text-gray-600'
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <textarea
                        placeholder="Share your experience about this creator product..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        rows={3}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="w-full py-2.5 bg-gradient-brand text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                  </form>
                ) : (
                  <p className="text-[10px] text-text-secondary italic">
                    Only buyer accounts can leave reviews. Log in as a Buyer to write one.
                  </p>
                )
              ) : (
                <div className="text-center py-2 flex flex-col gap-2">
                  <p className="text-[10px] text-text-secondary">
                    You must be signed in as a Buyer to leave reviews.
                  </p>
                  <Link
                    href="/login"
                    className="py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white rounded-xl text-center transition-all block"
                  >
                    Sign In to Review
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 h-full flex flex-col">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3 mb-4">
              Buyer Reviews ({reviews.length})
            </h3>

            {reviews.length > 0 ? (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-96 pr-1">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 hover:bg-white/[0.08] transition-colors"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-white font-bold">{rev.buyer?.email || 'Buyer'}</span>
                        <span className="text-[10px] text-text-secondary ml-2">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Stars count */}
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-current text-amber-400' : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed bg-black/10 p-3 rounded-xl">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-text-secondary italic my-auto">
                No reviews left for this product yet. Be the first to write one!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* You May Also Like Related Products */}
      <div className="border-t border-white/5 pt-10 mt-6">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-white mb-6 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
          You May Also Like
        </h3>

        {loadingRelated ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="glass-card h-80 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary italic">No other related products found in this category.</p>
        )}
      </div>

      {/* Floating Chat Widget Overlay */}
      {isChatOpen && product && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-bg-dark/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-200">
          {/* Widget Header */}
          <div className="bg-gradient-brand p-3.5 flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="font-bold text-white text-[11px] leading-tight">{product.seller?.name}</p>
                <p className="text-[9px] text-white/70">Creator Shop Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Widget Messages thread */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 text-[11px]">
            {chatMessages.length > 0 ? (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] p-2.5 rounded-xl flex flex-col gap-0.5 ${
                      isMe
                        ? 'bg-brand-primary/10 border border-brand-primary/20 text-white self-end rounded-br-none'
                        : 'bg-white/5 border-white/5 text-text-secondary self-start rounded-bl-none'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className="text-[7px] text-gray-500 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-text-secondary italic text-center py-10">
                Ask the creator about customizing this merchandise!
              </p>
            )}
          </div>

          {/* Widget Input Form */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/5 flex gap-2">
            <input
              type="text"
              placeholder="Ask creator a question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              className="p-2 bg-gradient-brand text-white rounded-xl hover:opacity-90 flex items-center justify-center transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
