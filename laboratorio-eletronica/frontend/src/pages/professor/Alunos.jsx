import React, { useEffect, useState } from 'react';
import { studentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, TextInput, Select } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../components/ui/format';

export default function Alunos() {
  const { show } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = (params = '') => {
    setLoading(true);
    studentApi
      .list(params)
      .then((res) => setStudents(res.students))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (courseFilter) params.set('course', courseFilter);
    if (statusFilter) params.set('status', statusFilter);
    load(`?${params.toString()}`);
  };

  const courses = [...new Set(students.map((s) => s.course))].sort();

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.user.name,
      email: s.user.email,
      course: s.course,
      semester: s.semester,
      active: s.user.active
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await studentApi.update(editing.id, form);
      show(res.message, 'success');
      setEditing(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Alunos"
        subtitle="Gerencie os estudantes cadastrados no laboratório."
        icon="fa-user-graduate"
      />

      <Card className="filters-card">
        <div className="filters-row">
          <div className="search-field">
            <i className="fas fa-magnifying-glass" />
            <TextInput
              placeholder="Buscar por nome ou matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">Todos os cursos</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
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
        <PageLoader text="Carregando alunos..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon="fa-user-graduate"
          title="Nenhum aluno encontrado"
          message="Ajuste os filtros ou cadastre novos estudantes."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Estudante</th>
                <th>Matrícula</th>
                <th>Curso</th>
                <th>Equipe</th>
                <th>Status</th>
                <th className="table__actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const teamNames = [...(s.teams || []).map((t) => t.name), ...(s.ledTeams || []).map((t) => t.name)];
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="table-person">
                        <Avatar name={s.user.name} size="sm" />
                        <div>
                          <strong>{s.user.name}</strong>
                          <span>{s.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{s.registrationNumber}</td>
                    <td>{s.course}</td>
                    <td>{teamNames.length > 0 ? teamNames.join(', ') : '—'}</td>
                    <td>
                      <span className={`badge ${s.user.active ? 'badge--success' : 'badge--danger'}`}>
                        <i className={`fas ${s.user.active ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
                        {s.user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn" title="Editar aluno" onClick={() => openEdit(s)}>
                        <i className="fas fa-pen" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar estudante"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button variant="primary" form="edit-student-form" type="submit" loading={saving}>
              <i className="fas fa-save" /> Salvar
            </Button>
          </>
        }
      >
        <form id="edit-student-form" onSubmit={handleSave}>
          <Field label="Nome" required>
            <TextInput value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="E-mail" required>
            <TextInput type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <div className="form-row">
            <Field label="Curso" required>
              <TextInput value={form.course || ''} onChange={(e) => setForm({ ...form, course: e.target.value })} />
            </Field>
            <Field label="Período">
              <TextInput type="number" min="1" max="12" value={form.semester || ''} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            </Field>
          </div>
          <Field label="Matrícula">
            <TextInput value={editing?.registrationNumber || ''} disabled />
            <span className="field__hint">A matrícula não pode ser alterada.</span>
          </Field>
          <Field label="Situação">
            <Select value={form.active ? 'ativo' : 'inativo'} onChange={(e) => setForm({ ...form, active: e.target.value === 'ativo' })}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
          </Field>
          {editing && <p className="field__hint">Conta criada em {formatDate(editing.user?.createdAt)}.</p>}
        </form>
      </Modal>
    </div>
  );
}
