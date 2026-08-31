const { prisma } = require('../config/database');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
const TEXT_PER_IMAGE = 5; // ratio 1 image : 5 text

async function generateUniqueGrantCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (!(await prisma.grantCode.findUnique({ where: { code } }))) return code;
  }
  throw new Error('Could not generate a unique grant code');
}

// POST /grant/admin/create — create a bonus-generation code (text auto = 5× images)
async function adminCreateGrantCode(req, res) {
  try {
    const grantImages = Math.max(0, parseInt(req.body.images, 10) || 0);
    if (grantImages <= 0) return res.status(400).json({ error: 'Enter a number of image generations to grant.' });
    const grantTexts = grantImages * TEXT_PER_IMAGE;
    const rawMax = req.body.maxUses;
    const maxUses = (rawMax === 0 || rawMax === -1 || rawMax === '0') ? -1 : Math.max(1, parseInt(rawMax, 10) || 1);

    const code = await generateUniqueGrantCode();
    const created = await prisma.grantCode.create({ data: { code, grantImages, grantTexts, maxUses } });
    res.json({ code: created });
  } catch (e) {
    console.error('Create grant code error:', e);
    res.status(500).json({ error: 'Failed to create grant code' });
  }
}

// GET /grant/admin/codes
async function adminGetGrantCodes(req, res) {
  try {
    const codes = await prisma.grantCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ codes });
  } catch (e) {
    console.error('Get grant codes error:', e);
    res.status(500).json({ error: 'Failed to load grant codes' });
  }
}

// PATCH /grant/admin/codes/:id/toggle
async function adminToggleGrantCode(req, res) {
  try {
    const code = await prisma.grantCode.findUnique({ where: { id: req.params.id } });
    if (!code) return res.status(404).json({ error: 'Code not found' });
    const updated = await prisma.grantCode.update({ where: { id: code.id }, data: { isActive: !code.isActive } });
    res.json({ code: updated });
  } catch (e) {
    console.error('Toggle grant code error:', e);
    res.status(500).json({ error: 'Failed to toggle code' });
  }
}

// POST /grant/redeem — user redeems a grant code for bonus generations
async function redeemGrantCode(req, res) {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const grant = await prisma.grantCode.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (!grant || !grant.isActive) return res.status(400).json({ error: 'Invalid or inactive code' });
    if (grant.maxUses !== -1 && grant.usedCount >= grant.maxUses) {
      return res.status(400).json({ error: 'This code has reached its maximum uses' });
    }

    const existing = await prisma.grantRedemption.findUnique({ where: { codeId_userId: { codeId: grant.id, userId } } });
    if (existing) return res.status(400).json({ error: 'You have already redeemed this code' });

    await prisma.$transaction([
      prisma.grantRedemption.create({ data: { codeId: grant.id, userId } }),
      prisma.grantCode.update({ where: { id: grant.id }, data: { usedCount: { increment: 1 } } }),
      prisma.user.update({
        where: { id: userId },
        data: { bonusImages: { increment: grant.grantImages }, bonusTexts: { increment: grant.grantTexts } },
      }),
    ]);

    res.json({ message: 'Code redeemed', grantedImages: grant.grantImages, grantedTexts: grant.grantTexts });
  } catch (e) {
    console.error('Redeem grant code error:', e);
    res.status(500).json({ error: 'Failed to redeem code' });
  }
}

module.exports = { adminCreateGrantCode, adminGetGrantCodes, adminToggleGrantCode, redeemGrantCode };
