import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, TextInput, Select } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { formatDate } from '../../components/ui/format';

const ROLE_BADGE = {
  ALUNO: 'badge--success',
  PROFESSOR: 'badge--info',
  ADMIN: 'badge--warning'
};

const ROLE_LABEL = {
  ALUNO: 'Aluno',
  PROFESSOR: 'Professor(a)',
  ADMIN: 'Administrador'
};

const EMPTY_FORM = {
  role: 'ALUNO',
  name: '',
  email: '',
  password: '',
  registrationNumber: '',
  course: '',
  semester: '1'
};

export default function Contas() {
  const { show } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = (params = '') => {
    setLoading(true);
    adminApi
      .listAccounts(params)
      .then((res) => setAccounts(res.accounts))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    load(`?${params.toString()}`);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreating(true);
  };

  const openEdit = (acc) => {
    setEditing(acc);
    setForm({
      role: acc.role,
      name: acc.name,
      email: acc.email,
      password: '',
      registrationNumber: acc.registrationNumber || '',
      course: acc.course || '',
      semester: acc.semester ? String(acc.semester) : '1'
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.createAccount(form);
      show(res.message, 'success');
      setCreating(false);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        active: editing.active
      };
      if (form.password) payload.password = form.password;
      if (editing.role === 'ALUNO') {
        payload.course = form.course;
        payload.semester = form.semester;
      }
      const res = await adminApi.updateAccount(editing.id, payload);
      show(res.message, 'success');
      setEditing(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateAccount(toggleTarget.id, { active: !toggleTarget.active });
      show(res.message, 'success');
      setToggleTarget(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role) => `badge ${ROLE_BADGE[role] || 'badge--neutral'}`;

  return (
    <div>
      <PageHeader
        title="Contas"
        subtitle="Crie e administre contas de alunos, professores e administradores."
        icon="fa-user-gear"
        actions={
          <Button variant="primary" onClick={openCreate}>
            <i className="fas fa-user-plus" /> Nova conta
          </Button>
        }
      />

      <Card className="filters-card">
        <div className="filters-row">
          <div className="search-field">
            <i className="fas fa-magnifying-glass" />
            <TextInput
              placeholder="Buscar por nome, e-mail ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Todos os papéis</option>
            <option value="ALUNO">Alunos</option>
            <option value="PROFESSOR">Professores</option>
            <option value="ADMIN">Administradores</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </Select>
          <Button variant="primary" onClick={applyFilters}>
            <i className="fas fa-filter" /> Filtrar
          </Button>
        </div>
      </Card>

      {loading ? (
        <PageLoader text="Carregando contas..." />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon="fa-user-gear"
          title="Nenhuma conta encontrada"
          message="Ajuste os filtros ou crie uma nova conta."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Papel</th>
                <th>Matrícula</th>
                <th>Curso</th>
                <th>Status</th>
                <th>Criado em</th>
                <th className="table__actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id}>
                  <td>
                    <div className="table-person">
                      <Avatar name={acc.name} size="sm" />
                      <div>
                        <strong>{acc.name}</strong>
                        <span>{acc.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={roleBadge(acc.role)}>{ROLE_LABEL[acc.role] || acc.role}</span>
                  </td>
                  <td>{acc.registrationNumber || '—'}</td>
                  <td>{acc.course || '—'}</td>
                  <td>
                    <span className={`badge ${acc.active ? 'badge--success' : 'badge--danger'}`}>
                      <i className={`fas ${acc.active ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
                      {acc.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>{formatDate(acc.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-btn" title="Editar conta" onClick={() => openEdit(acc)}>
                        <i className="fas fa-pen" />
                      </button>
                      <button
                        className="icon-btn"
                        title={acc.active ? 'Desativar conta' : 'Ativar conta'}
                        onClick={() => setToggleTarget(acc)}
                      >
                        <i className={`fas ${acc.active ? 'fa-user-slash' : 'fa-user-check'}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nova conta"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button variant="primary" form="create-account-form" type="submit" loading={saving}>
              <i className="fas fa-user-plus" /> Criar conta
            </Button>
          </>
        }
      >
        <form id="create-account-form" onSubmit={handleCreate}>
          <Field label="Tipo de conta" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ALUNO">Aluno</option>
              <option value="PROFESSOR">Professor(a)</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </Field>
          <Field label="Nome completo" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do usuário" />
          </Field>
          <Field label="E-mail" required>
            <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ifce.edu.br" />
          </Field>
          <Field label="Senha inicial" required hint="Mínimo de 6 caracteres.">
            <TextInput type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Defina a senha inicial" />
          </Field>
          {form.role === 'ALUNO' && (
            <>
              <Field label="Matrícula" required>
                <TextInput value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="Ex.: 2024101006" />
              </Field>
              <div className="form-row">
                <Field label="Curso" required>
                  <TextInput value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Ex.: Engenharia de Computação" />
                </Field>
                <Field label="Período">
                  <TextInput type="number" min="1" max="12" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
                </Field>
              </div>
            </>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={`Editar conta — ${editing ? ROLE_LABEL[editing.role] || editing.role : ''}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button variant="primary" form="edit-account-form" type="submit" loading={saving}>
              <i className="fas fa-save" /> Salvar
            </Button>
          </>
        }
      >
        <form id="edit-account-form" onSubmit={handleUpdate}>
          <Field label="Nome completo" required>
            <TextInput value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="E-mail" required>
            <TextInput type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Nova senha" hint={editing?.role === 'ADMIN' ? 'Deixe em branco para manter a senha atual.' : 'Deixe em branco para manter a senha atual.'}>
            <TextInput type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Preencha apenas para redefinir" />
          </Field>
          {editing?.role === 'ALUNO' && (
            <>
              <Field label="Matrícula">
                <TextInput value={form.registrationNumber || ''} disabled />
                <span className="field__hint">A matrícula não pode ser alterada.</span>
              </Field>
              <div className="form-row">
                <Field label="Curso" required>
                  <TextInput value={form.course || ''} onChange={(e) => setForm({ ...form, course: e.target.value })} />
                </Field>
                <Field label="Período">
                  <TextInput type="number" min="1" max="12" value={form.semester || ''} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
                </Field>
              </div>
            </>
          )}
          <Field label="Situação">
            <Select
              value={editing?.active ? 'ativo' : 'inativo'}
              onChange={(e) => setEditing((prev) => ({ ...prev, active: e.target.value === 'ativo' }))}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
          </Field>
          {editing && <p className="field__hint">Conta criada em {formatDate(editing.createdAt)}.</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.active ? 'Desativar conta' : 'Ativar conta'}
        message={
          toggleTarget?.active
            ? `Desativar a conta de ${toggleTarget?.name}? O usuário não conseguirá mais entrar na plataforma.`
            : `Ativar a conta de ${toggleTarget?.name}? O usuário voltará a ter acesso à plataforma.`
        }
        confirmLabel={toggleTarget?.active ? 'Desativar' : 'Ativar'}
        variant={toggleTarget?.active ? 'danger' : 'success'}
        loading={saving}
        onConfirm={handleToggleActive}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
