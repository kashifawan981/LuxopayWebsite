import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, createToken } from '../auth.js';
import { createUser, findUserByEmail, findUserById } from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: uuidv4(),
    name: name ?? null,
    email,
  };
  await createUser({
    ...user,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  const token = createToken(user);
  return res.status(201).json({
    user,
    token,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const userRecord = await findUserByEmail(email);
  if (!userRecord) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, userRecord.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
  };
  const token = createToken(user);
  return res.json({ user, token });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
});

export default router;
