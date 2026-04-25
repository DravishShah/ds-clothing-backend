// const { PrismaClient } = require("@prisma/client");
// const bcrypt = require("bcryptjs"); // NEW
// const prisma = new PrismaClient();

// async function main() {
//   // 1. Delete the old unsecured account if it exists
//   await prisma.user.deleteMany({ where: { email: "test@test.com" } });

//   // 2. Hash the password (10 is the "salt round" - how many times it shreds it)
//   const hashedPassword = await bcrypt.hash("adminTest1234", 10);

//   // 3. Save the secure account
//   const admin = await prisma.user.create({
//     data: {
//       email: "test@test.com",
//       password: hashedPassword, // Saving the scrambled text!
//       name: "Dravish",
//     },
//   });
//   console.log("Secure Admin account created successfully!");
// }

// main().then(() => prisma.$disconnect());
