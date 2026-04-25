const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const products = [
  {
    name: "Aged Texture Oxford Shirt",
    category: "Men - Shirts",
    gender: "Men",
    price: 2199,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=600&auto=format&fit=crop",
    description:
      "A textured button-down shirt designed for an impeccable silhouette.",
  },
  {
    name: "Essential Lightweight Chinos",
    category: "Men - Bottoms",
    gender: "Men",
    price: 1899,
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop",
    description: "Comfort-stretch chinos for everyday wear.",
  },
  {
    name: "Nylon Utility Vest",
    category: "Men - Outerwear",
    gender: "Men",
    price: 3199,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop",
    description: "A functional utility vest with multiple storage options.",
  },
  {
    name: "Urban Explorer Technical Polo",
    category: "Men - Tops",
    gender: "Men",
    price: 2699,
    image:
      "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ebd?q=80&w=600&auto=format&fit=crop",
    description: "Moisture-wicking technical polo for active days.",
  },
  {
    name: "Architectural Pleated Blouse",
    category: "Women - Tops",
    gender: "Women",
    price: 2999,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop",
    description: "A minimal blouse with sculptural pleat details.",
  },
  {
    name: "Structured Denim Midi Skirt",
    category: "Women - Bottoms",
    gender: "Women",
    price: 3499,
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop",
    description: "Timeless structured denim skirt in a deep vintage wash.",
  },
  {
    name: "Classic Cotton Gabardine Trench",
    category: "Women - Outerwear",
    gender: "Women",
    price: 6499,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop",
    description: "Our signature trench coat made for unparalleled elegance.",
  },
  {
    name: "Minimalist Shift Sun Dress",
    category: "Women - Dresses",
    gender: "Women",
    price: 4199,
    image:
      "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ebd?q=80&w=600&auto=format&fit=crop",
    description: "Effortless A-line shift dress perfect for casual elegance.",
  },
];

async function main() {
  console.log(`Curating the DS Clothing Vault...`);
  for (const p of products) {
    const product = await prisma.product.create({
      data: p,
    });
    console.log(`✅ Integrated: ${product.name}`);
  }
  console.log(`Collection perfectly synced.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
