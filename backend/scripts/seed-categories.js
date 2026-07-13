const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { name: 'Gaming', slug: 'gaming', description: 'Gaming gear, custom keycaps, mousepads and accessories.' },
  { name: 'Anime', slug: 'anime', description: 'Anime figures, merchandise, and fanart items.' },
  { name: 'Wall Art', slug: 'wall-art', description: 'Beautiful wall frames, canvasses, and decors.' },
  { name: 'Posters', slug: 'posters', description: 'High quality posters of anime, games, and movies.' },
  { name: 'Hoodies', slug: 'hoodies', description: 'Comfortable custom hoodies and streetwear.' },
  { name: 'T-Shirts', slug: 't-shirts', description: 'Custom printed graphic t-shirts.' },
  { name: 'Oversized Tees', slug: 'oversized-tees', description: 'Trendy oversized graphic tees.' },
  { name: 'Stickers', slug: 'stickers', description: 'Die-cut vinyl stickers for laptops and journals.' },
  { name: 'Mugs', slug: 'mugs', description: 'Custom printed ceramic mugs.' },
  { name: 'Key Tags', slug: 'key-tags', description: 'Custom acrylic and rubber keychains.' },
  { name: 'Accessories', slug: 'accessories', description: 'Unique personal styling items and accessories.' },
  { name: 'Laptop Skins', slug: 'laptop-skins', description: 'Vinyl laptop wraps and decals.' },
  { name: 'Phone Covers', slug: 'phone-covers', description: 'Custom designed phone cases.' },
  { name: 'Handmade', slug: 'handmade', description: 'Artisanal, handcrafted creations.' },
  { name: 'Art Prints', slug: 'art-prints', description: 'Physical high-quality prints of digital drawings.' },
  { name: 'Cosplay', slug: 'cosplay', description: 'Cosplay props, costumes, and accessories.' },
  { name: 'Custom Gifts', slug: 'custom-gifts', description: 'Personalized gift hampers and tokens.' },
  { name: 'Photography Prints', slug: 'photography-prints', description: 'Aesthetic photo prints and frames.' },
  { name: 'Home Decor', slug: 'home-decor', description: 'Creative home accents and utilities.' },
  { name: 'Digital Downloads', slug: 'digital-downloads', description: 'Wallpapers, printables, and 3D files.' }
];

async function main() {
  console.log('Seeding categories list in MerchHub LK database...');
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description }
    });
    console.log(`- Upserted Category: ${cat.name}`);
  }
  console.log('Categories seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
