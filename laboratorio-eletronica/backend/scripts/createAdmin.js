const bcrypt = require('bcryptjs');
const db = require('../src/db/firestore');
const config = require('../src/config');

async function main() {
  const [nameArg, emailArg, passwordArg] = process.argv.slice(2);
  const name = nameArg || 'Administrador';
  const email = emailArg || process.env.ADMIN_EMAIL;
  const password = passwordArg || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Uso: node scripts/createAdmin.js <nome> <usuario> <senha>');
    console.error('      (ou defina ADMIN_EMAIL e ADMIN_PASSWORD no ambiente)');
    process.exit(1);
  }
  if (String(password).length < 6) {
    console.error('A senha deve ter pelo menos 6 caracteres.');
    process.exit(1);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const hashed = await bcrypt.hash(password, config.bcryptRounds);

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { name: String(name).trim(), role: 'ADMIN', active: true, password: hashed }
    });
    console.log(`Admin atualizado: ${normalizedEmail}`);
  } else {
    await db.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashed,
        role: 'ADMIN'
      }
    });
    console.log(`Admin criado: ${normalizedEmail}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
