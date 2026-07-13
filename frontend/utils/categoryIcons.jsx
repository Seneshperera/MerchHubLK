import React from 'react';
import {
  Gamepad2,
  Tv,
  Image,
  Frame,
  Shirt,
  Tag,
  Coffee,
  Key,
  Watch,
  Laptop,
  Smartphone,
  Scissors,
  Palette,
  Sparkles,
  Gift,
  Camera,
  Home,
  Download,
  HelpCircle
} from 'lucide-react';

const iconMap = {
  'gaming': Gamepad2,
  'anime': Tv,
  'wall-art': Image,
  'posters': Frame,
  'hoodies': Shirt,
  't-shirts': Shirt,
  'oversized-tees': Shirt,
  'stickers': Tag,
  'mugs': Coffee,
  'key-tags': Key,
  'accessories': Watch,
  'laptop-skins': Laptop,
  'phone-covers': Smartphone,
  'handmade': Scissors,
  'art-prints': Palette,
  'cosplay': Sparkles,
  'custom-gifts': Gift,
  'photography-prints': Camera,
  'home-decor': Home,
  'digital-downloads': Download
};

export function getCategoryIcon(slug) {
  const normalized = (slug || '').toLowerCase().trim();
  return iconMap[normalized] || HelpCircle;
}
