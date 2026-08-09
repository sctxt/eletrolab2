const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

async function listNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, read: false }
    });

    return res.json({ notifications, unreadCount });
  } catch (err) {
    return next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new AppError('Notificação não encontrada.', 404);
    if (notification.userId !== req.user.id) {
      throw new AppError('Você não pode acessar esta notificação.', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return res.json({ message: 'Notificação marcada como lida.', notification: updated });
  } catch (err) {
    return next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    return res.json({ message: `${result.count} notificação(ns) marcada(s) como lida(s).` });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listNotifications, markAsRead, markAllAsRead };
