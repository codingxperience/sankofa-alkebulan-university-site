import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('AdminPass123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sankofa.local' },
    update: {},
    create: {
      email: 'admin@sankofa.local',
      name: 'Site Admin',
      role: 'admin',
      password: passwordHash,
    },
  });

  console.log('Admin user created:', admin.email);

  const post = await prisma.post.create({
    data: {
      title: 'Welcome to Sankofa',
      slug: 'welcome-to-sankofa',
      content: 'This is the first seeded post.',
      published: true,
      authorId: admin.id,
    },
  });

  console.log('Sample post created:', post.slug);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
