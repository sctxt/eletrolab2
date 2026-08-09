const prisma = require('../config/prisma');

async function createNotification(userId, title, message) {
  if (!userId) return null;
  return prisma.notification.create({
    data: { userId, title, message }
  });
}

async function notifyStudents(students, title, message) {
  const data = students.map((s) => ({ userId: s.userId, title, message }));
  if (data.length === 0) return [];
  return prisma.notification.createMany({ data });
}

module.exports = { createNotification, notifyStudents };
