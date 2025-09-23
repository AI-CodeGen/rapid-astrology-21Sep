import { buildSuccessPayload, buildErrorPayload } from '../utils/errorCodes.js';

export async function addMember(req, res, next) {
  try {
    const { name, relation, dob, gender } = req.body;
  if (!name) return res.status(400).json(buildErrorPayload({ error: 'VALIDATION_ERROR', message: 'Name required', status: 400, requestId: req.requestId, details: [{ field: 'name', code: 'NAME_REQUIRED', message: 'Name required' }] }));
    req.dbUser.members.push({ name, relation, dob, gender });
    await req.dbUser.save();
    res.json(buildSuccessPayload({ requestId: req.requestId, data: { members: req.dbUser.members }, message: 'member_added' }));
  } catch (e) { next(e); }
}

export async function listMembers(req, res) {
  res.json(buildSuccessPayload({ requestId: req.requestId, data: { members: req.dbUser.members }, message: 'members_list' }));
}
