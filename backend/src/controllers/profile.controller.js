export async function addMember(req, res, next) {
  try {
    const { name, relation, dob, gender } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    req.dbUser.members.push({ name, relation, dob, gender });
    await req.dbUser.save();
    res.json({ members: req.dbUser.members });
  } catch (e) { next(e); }
}

export async function listMembers(req, res) {
  res.json({ members: req.dbUser.members });
}
