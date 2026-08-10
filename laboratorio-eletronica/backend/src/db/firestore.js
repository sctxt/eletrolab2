const crypto = require('crypto');
const { getDb, FieldValue, isConfigured } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

const COLLECTIONS = {
  user: 'users',
  student: 'students',
  teacher: 'teachers',
  team: 'teams',
  teamMember: 'teamMembers',
  teamInvitation: 'teamInvitations',
  assignment: 'assignments',
  question: 'questions',
  questionOption: 'questionOptions',
  submission: 'submissions',
  answer: 'answers',
  notification: 'notifications'
};

const DEFAULTS = {
  user: { active: true, role: 'ALUNO' },
  student: { semester: 1 },
  teacher: {},
  team: { description: '' },
  teamMember: { joinedAt: () => new Date() },
  teamInvitation: { status: 'PENDENTE' },
  assignment: { description: '', instructions: '', turma: '', status: 'RASCUNHO' },
  question: { points: 1, order: 0 },
  questionOption: { correct: false },
  submission: { submittedAt: () => new Date(), status: 'ENVIADA', late: false },
  answer: {},
  notification: { read: false }
};

function applyDefaults(model, data) {
  const defaults = DEFAULTS[model] || {};
  const out = { ...data };
  for (const [key, val] of Object.entries(defaults)) {
    if (out[key] === undefined) out[key] = typeof val === 'function' ? val() : val;
  }
  return out;
}

const NULLABLES = {
  submission: ['grade', 'feedback']
};

function normalizeNulls(model, doc) {
  for (const key of NULLABLES[model] || []) {
    if (doc[key] === undefined) doc[key] = null;
  }
  return doc;
}

const RELATIONS = {
  user: {
    student: { target: 'student', local: 'id', foreign: 'userId', type: 'one' },
    teacher: { target: 'teacher', local: 'id', foreign: 'userId', type: 'one' },
    notifications: { target: 'notification', local: 'id', foreign: 'userId', type: 'many' }
  },
  student: {
    user: { target: 'user', local: 'userId', foreign: 'id', type: 'one' },
    teamMembers: { target: 'teamMember', local: 'id', foreign: 'studentId', type: 'many' },
    teamInvitations: { target: 'teamInvitation', local: 'id', foreign: 'studentId', type: 'many' },
    submissions: { target: 'submission', local: 'id', foreign: 'studentId', type: 'many' },
    ledTeams: { target: 'team', local: 'id', foreign: 'leaderId', type: 'many' }
  },
  teacher: {
    user: { target: 'user', local: 'userId', foreign: 'id', type: 'one' },
    assignments: { target: 'assignment', local: 'id', foreign: 'teacherId', type: 'many' }
  },
  team: {
    leader: { target: 'student', local: 'leaderId', foreign: 'id', type: 'one' },
    members: { target: 'teamMember', local: 'id', foreign: 'teamId', type: 'many' },
    invitations: { target: 'teamInvitation', local: 'id', foreign: 'teamId', type: 'many' }
  },
  teamMember: {
    team: { target: 'team', local: 'teamId', foreign: 'id', type: 'one' },
    student: { target: 'student', local: 'studentId', foreign: 'id', type: 'one' }
  },
  teamInvitation: {
    team: { target: 'team', local: 'teamId', foreign: 'id', type: 'one' },
    student: { target: 'student', local: 'studentId', foreign: 'id', type: 'one' }
  },
  assignment: {
    teacher: { target: 'teacher', local: 'teacherId', foreign: 'id', type: 'one' },
    questions: { target: 'question', local: 'id', foreign: 'assignmentId', type: 'many' },
    submissions: { target: 'submission', local: 'id', foreign: 'assignmentId', type: 'many' }
  },
  question: {
    assignment: { target: 'assignment', local: 'assignmentId', foreign: 'id', type: 'one' },
    options: { target: 'questionOption', local: 'id', foreign: 'questionId', type: 'many' }
  },
  questionOption: {
    question: { target: 'question', local: 'questionId', foreign: 'id', type: 'one' }
  },
  submission: {
    assignment: { target: 'assignment', local: 'assignmentId', foreign: 'id', type: 'one' },
    student: { target: 'student', local: 'studentId', foreign: 'id', type: 'one' },
    answers: { target: 'answer', local: 'id', foreign: 'submissionId', type: 'many' }
  },
  answer: {
    submission: { target: 'submission', local: 'submissionId', foreign: 'id', type: 'one' },
    question: { target: 'question', local: 'questionId', foreign: 'id', type: 'one' }
  },
  notification: {
    user: { target: 'user', local: 'userId', foreign: 'id', type: 'one' }
  }
};

const OPERATORS = new Set(['not', 'equals', 'contains', 'mode', 'gte', 'gt', 'lte', 'lt', 'in']);

function toJS(value) {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(toJS);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) {
      if (value[k] !== undefined) out[k] = toJS(value[k]);
    }
    return out;
  }
  return value;
}

function toVal(value) {
  if (value instanceof Date) return value.getTime();
  if (value instanceof Timestamp) return value.toDate().getTime();
  return value;
}

async function loadCollection(cache, model) {
  if (!cache[model]) {
    const snap = await getDb().collection(COLLECTIONS[model]).get();
    cache[model] = snap.docs.map((d) => normalizeNulls(model, { id: d.id, ...toJS(d.data()) }));
  }
  return cache[model];
}

function evalField(value, cond) {
  if (cond === null || cond === undefined) return value === cond;
  if (cond instanceof Date) return toVal(value) === toVal(cond);
  if (typeof cond !== 'object' || Array.isArray(cond)) return value === cond;
  if ('equals' in cond) return toVal(value) === toVal(cond.equals);
  if ('not' in cond) return toVal(value) !== toVal(cond.not);
  if ('contains' in cond) {
    const v = value == null ? '' : String(value);
    const t = String(cond.contains);
    return cond.mode === 'insensitive' ? v.toLowerCase().includes(t.toLowerCase()) : v.includes(t);
  }
  if ('in' in cond) return Array.isArray(cond.in) && cond.in.some((x) => toVal(x) === toVal(value));
  if ('gte' in cond && !(toVal(value) >= toVal(cond.gte))) return false;
  if ('gt' in cond && !(toVal(value) > toVal(cond.gt))) return false;
  if ('lte' in cond && !(toVal(value) <= toVal(cond.lte))) return false;
  if ('lt' in cond && !(toVal(value) < toVal(cond.lt))) return false;
  return true;
}

function isOperatorOnly(cond) {
  if (!cond || typeof cond !== 'object' || Array.isArray(cond) || cond instanceof Date) return false;
  return Object.keys(cond).length > 0 && Object.keys(cond).every((k) => OPERATORS.has(k));
}

async function loadOne(model, doc, rel, cache) {
  const docs = await loadCollection(cache, rel.target);
  return docs.find((t) => t[rel.foreign] === doc[rel.local]) || null;
}

async function loadMany(model, doc, rel, cache) {
  const docs = await loadCollection(cache, rel.target);
  return docs.filter((t) => t[rel.foreign] === doc[rel.local]);
}

async function evalRelation(model, doc, rel, cond, cache) {
  if (rel.type === 'one') {
    const related = await loadOne(model, doc, rel, cache);
    if (cond === null) return related == null;
    if (related == null) return false;
    let sub = cond;
    if (cond && typeof cond === 'object' && 'is' in cond) sub = cond.is;
    return evalWhere(rel.target, related, sub, cache);
  }
  const related = await loadMany(model, doc, rel, cache);
  if (cond && typeof cond === 'object' && 'some' in cond) {
    for (const r of related) if (await evalWhere(rel.target, r, cond.some, cache)) return true;
    return false;
  }
  if (cond && typeof cond === 'object' && 'none' in cond) {
    for (const r of related) if (await evalWhere(rel.target, r, cond.none, cache)) return false;
    return true;
  }
  for (const r of related) if (await evalWhere(rel.target, r, cond, cache)) return true;
  return false;
}

async function evalWhere(model, doc, where, cache) {
  if (!where || Object.keys(where).length === 0) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === 'OR') {
      if (!Array.isArray(cond)) continue;
      let ok = false;
      for (const sub of cond) {
        if (await evalWhere(model, doc, sub, cache)) {
          ok = true;
          break;
        }
      }
      if (!ok) return false;
      continue;
    }
    if (key === 'AND') {
      if (!Array.isArray(cond)) continue;
      for (const sub of cond) if (!(await evalWhere(model, doc, sub, cache))) return false;
      continue;
    }
    if (
      key.includes('_') &&
      cond &&
      typeof cond === 'object' &&
      !Array.isArray(cond) &&
      !(cond instanceof Date) &&
      !isOperatorOnly(cond)
    ) {
      for (const [fk, fv] of Object.entries(cond)) {
        if (!evalField(doc[fk], fv)) return false;
      }
      continue;
    }
    const rel = RELATIONS[model] && RELATIONS[model][key];
    if (rel) {
      if (!(await evalRelation(model, doc, rel, cond, cache))) return false;
      continue;
    }
    if (cond && typeof cond === 'object' && !(cond instanceof Date) && !Array.isArray(cond) && !isOperatorOnly(cond)) {
      let ok = true;
      for (const [fk, fv] of Object.entries(cond)) {
        if (!evalField(doc[fk], fv)) {
          ok = false;
          break;
        }
      }
      if (!ok) return false;
      continue;
    }
    if (!evalField(doc[key], cond)) return false;
  }
  return true;
}

function pickFields(doc, select) {
  const out = {};
  for (const [k, enabled] of Object.entries(select || {})) {
    if (enabled && k in doc) out[k] = doc[k];
  }
  return out;
}

async function applyInclude(model, doc, include, cache) {
  if (!include) return doc;
  for (const [key, spec] of Object.entries(include)) {
    if (key === '_count') {
      doc._count = {};
      for (const [relName, enabled] of Object.entries(spec.select || {})) {
        if (!enabled) continue;
        const rel = RELATIONS[model] && RELATIONS[model][relName];
        if (!rel) continue;
        if (rel.type === 'many') {
          doc._count[relName] = (await loadMany(model, doc, rel, cache)).length;
        } else {
          doc._count[relName] = (await loadOne(model, doc, rel, cache)) ? 1 : 0;
        }
      }
      continue;
    }
    const rel = RELATIONS[model] && RELATIONS[model][key];
    if (!rel) continue;
    if (rel.type === 'one') {
      const related = await loadOne(model, doc, rel, cache);
      doc[key] = related ? await applySpec(rel.target, related, spec, cache) : null;
    } else {
      let list = await loadMany(model, doc, rel, cache);
      if (spec.where) {
        const filtered = [];
        for (const r of list) if (await evalWhere(rel.target, r, spec.where, cache)) filtered.push(r);
        list = filtered;
      }
      if (spec.orderBy) list = await sortDocs(rel.target, list, spec.orderBy, cache);
      if (spec.take) list = list.slice(0, spec.take);
      const resolved = [];
      for (const r of list) resolved.push(await applySpec(rel.target, r, spec, cache));
      doc[key] = resolved;
    }
  }
  return doc;
}

async function applySpec(model, doc, spec, cache) {
  let out = { ...doc };
  if (spec.include) out = await applyInclude(model, out, spec.include, cache);
  if (spec.select) out = pickFields(out, spec.select);
  return out;
}

async function sortDocs(model, docs, orderBy, cache) {
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];

  async function sortKey(m, doc, spec) {
    const [field, dir] = Object.entries(spec)[0];
    const rel = RELATIONS[m] && RELATIONS[m][field];
    if (rel && rel.type === 'one') {
      const related = await loadOne(m, doc, rel, cache);
      if (!related) return null;
      if (dir && typeof dir === 'object') return sortKey(rel.target, related, dir);
      return related[dir];
    }
    return doc[field];
  }

  const decorated = [];
  for (const d of docs) {
    const keys = [];
    for (const o of orders) keys.push(await sortKey(model, d, o));
    decorated.push({ doc: d, keys });
  }
  decorated.sort((a, b) => {
    for (let i = 0; i < orders.length; i++) {
      let desc = false;
      const dir = Object.values(orders[i])[0];
      if (typeof dir === 'string') desc = dir === 'desc';
      else if (dir && typeof dir === 'object') desc = Object.values(dir)[0] === 'desc';
      const va = a.keys[i];
      const vb = b.keys[i];
      if (va == null && vb == null) continue;
      if (va == null) return desc ? 1 : -1;
      if (vb == null) return desc ? -1 : 1;
      const ca = toVal(va);
      const cb = toVal(vb);
      if (ca < cb) return desc ? 1 : -1;
      if (ca > cb) return desc ? -1 : 1;
    }
    return 0;
  });
  return decorated.map((x) => x.doc);
}

function firestoreValue(plain) {
  const out = {};
  for (const [k, v] of Object.entries(plain)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

async function findMany(model, args = {}) {
  const cache = {};
  let docs = await loadCollection(cache, model);
  if (args.where) {
    const filtered = [];
    for (const d of docs) if (await evalWhere(model, d, args.where, cache)) filtered.push(d);
    docs = filtered;
  }
  if (args.orderBy) docs = await sortDocs(model, docs, args.orderBy, cache);
  if (args.take) docs = docs.slice(0, args.take);
  const result = [];
  for (const d of docs) {
    let r = { ...d };
    if (args.include) r = await applyInclude(model, r, args.include, cache);
    if (args.select) r = pickFields(r, args.select);
    result.push(r);
  }
  return result;
}

async function findUnique(model, args = {}) {
  const cache = {};
  const docs = await loadCollection(cache, model);
  let found = null;
  for (const d of docs) {
    if (await evalWhere(model, d, args.where, cache)) {
      found = d;
      break;
    }
  }
  if (!found) return null;
  let r = { ...found };
  if (args.include) r = await applyInclude(model, r, args.include, cache);
  if (args.select) r = pickFields(r, args.select);
  return r;
}

async function findFirst(model, args = {}) {
  const cache = {};
  let docs = await loadCollection(cache, model);
  if (args.where) {
    const filtered = [];
    for (const d of docs) if (await evalWhere(model, d, args.where, cache)) filtered.push(d);
    docs = filtered;
  }
  if (args.orderBy) docs = await sortDocs(model, docs, args.orderBy, cache);
  if (docs.length === 0) return null;
  let r = { ...docs[0] };
  if (args.include) r = await applyInclude(model, r, args.include, cache);
  if (args.select) r = pickFields(r, args.select);
  return r;
}

async function create(model, args = {}) {
  const data = args.data || {};
  const id = data.id || crypto.randomUUID();
  const docRef = getDb().collection(COLLECTIONS[model]).doc(id);
  const plain = {};
  const nested = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === 'object' && !Array.isArray(val) && 'create' in val) {
      nested[key] = val.create;
    } else {
      plain[key] = val;
    }
  }
  if (plain.createdAt === undefined && !('createdAt' in data)) plain.createdAt = new Date();
  plain.id = id;
  await docRef.set(firestoreValue(applyDefaults(model, plain)));
  for (const [relName, childData] of Object.entries(nested)) {
    const rel = RELATIONS[model][relName];
    const arr = Array.isArray(childData) ? childData : [childData];
    for (const cd of arr) {
      const child = { ...cd };
      child[rel.foreign] = id;
      await create(rel.target, { data: child });
    }
  }
  if (args.include) {
    const cache = {};
    const docs = await loadCollection(cache, model);
    const found = docs.find((x) => x.id === id);
    let r = { ...found };
    r = await applyInclude(model, r, args.include, cache);
    return r;
  }
  return { id, ...plain };
}

async function update(model, args = {}) {
  const cache = {};
  const docs = await loadCollection(cache, model);
  let found = null;
  for (const d of docs) {
    if (await evalWhere(model, d, args.where, cache)) {
      found = d;
      break;
    }
  }
  if (!found) throw new Error(`${model} não encontrado.`);
  const id = found.id;
  const plain = {};
  const nested = {};
  for (const [key, val] of Object.entries(args.data || {})) {
    if (val && typeof val === 'object' && !Array.isArray(val) && 'create' in val) {
      nested[key] = val.create;
    } else {
      plain[key] = val;
    }
  }
  if (Object.keys(plain).length > 0) {
    await getDb().collection(COLLECTIONS[model]).doc(id).update(firestoreValue(plain));
  }
  for (const [relName, childData] of Object.entries(nested)) {
    const rel = RELATIONS[model][relName];
    const arr = Array.isArray(childData) ? childData : [childData];
    for (const cd of arr) {
      const child = { ...cd };
      child[rel.foreign] = id;
      await create(rel.target, { data: child });
    }
  }
  const refetched = await loadCollection(cache, model);
  const upd = refetched.find((x) => x.id === id);
  let r = upd ? { ...upd } : { id };
  if (args.include) r = await applyInclude(model, r, args.include, cache);
  if (args.select) r = pickFields(r, args.select);
  return r;
}

async function deleteOne(model, args = {}) {
  const cache = {};
  const docs = await loadCollection(cache, model);
  let found = null;
  for (const d of docs) {
    if (await evalWhere(model, d, args.where, cache)) {
      found = d;
      break;
    }
  }
  if (!found) throw new Error(`${model} não encontrado.`);
  await getDb().collection(COLLECTIONS[model]).doc(found.id).delete();
  return found;
}

async function count(model, args = {}) {
  const cache = {};
  let docs = await loadCollection(cache, model);
  if (args.where) {
    const filtered = [];
    for (const d of docs) if (await evalWhere(model, d, args.where, cache)) filtered.push(d);
    docs = filtered;
  }
  return docs.length;
}

async function updateMany(model, args = {}) {
  const cache = {};
  let docs = await loadCollection(cache, model);
  if (args.where) {
    const filtered = [];
    for (const d of docs) if (await evalWhere(model, d, args.where, cache)) filtered.push(d);
    docs = filtered;
  }
  const col = getDb().collection(COLLECTIONS[model]);
  for (const d of docs) {
    await col.doc(d.id).update(firestoreValue(args.data || {}));
  }
  return { count: docs.length };
}

async function createMany(model, args = {}) {
  for (const d of args.data || []) {
    await create(model, { data: d });
  }
  return { count: (args.data || []).length };
}

async function deleteMany(model, args = {}) {
  const cache = {};
  let docs = await loadCollection(cache, model);
  if (args.where) {
    const filtered = [];
    for (const d of docs) if (await evalWhere(model, d, args.where, cache)) filtered.push(d);
    docs = filtered;
  }
  const col = getDb().collection(COLLECTIONS[model]);
  for (const d of docs) {
    await col.doc(d.id).delete();
  }
  return { count: docs.length };
}

const models = {};
for (const name of Object.keys(COLLECTIONS)) {
  models[name] = {
    findUnique: (args) => findUnique(name, args),
    findFirst: (args) => findFirst(name, args),
    findMany: (args) => findMany(name, args),
    create: (args) => create(name, args),
    update: (args) => update(name, args),
    delete: (args) => deleteOne(name, args),
    count: (args) => count(name, args),
    updateMany: (args) => updateMany(name, args),
    createMany: (args) => createMany(name, args),
    deleteMany: (args) => deleteMany(name, args)
  };
}

models.$transaction = async (operations) => {
  const results = [];
  for (const op of operations) results.push(await op);
  return results.length === 1 ? results[0] : results;
};

models.$disconnect = async () => {};

module.exports = models;
module.exports.isConfigured = isConfigured;
