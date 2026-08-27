const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.collection.findMany({
    where: { nama_koleksi: { contains: 'Golok', mode: 'insensitive' } }
  });
  console.log(items.map(i => i.nama_koleksi + ' -> ' + i.gambar));
}
main().finally(() => prisma.$disconnect());
