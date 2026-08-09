import React, { useEffect, useState } from 'react';
import { teamApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, TextInput, Textarea } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { formatDate } from '../../components/ui/format';

export default function Equipes() {
  const { show } = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = () => {
    teamApi
      .list()
      .then((res) => setTeams(res.teams))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await teamApi.update(editing.id, form);
      show(res.message, 'success');
      setEditing(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await teamApi.remove(confirm.id);
      show(res.message, 'success');
      setConfirm(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Equipes"
        subtitle="Acompanhe todas as equipes do laboratório."
        icon="fa-users"
      />

      {loading ? (
        <PageLoader text="Carregando equipes..." />
      ) : teams.length === 0 ? (
        <EmptyState icon="fa-users" title="Nenhuma equipe cadastrada" message="Quando os estudantes criarem equipes, elas aparecerão aqui." />
      ) : (
        <div className="team-cards-grid">
          {teams.map((t) => (
            <Card key={t.id} className="team-card">
              <CardHeader
                title={t.name}
                subtitle={
                  <>
                    <span><i className="fas fa-crown" /> Líder: {t.leader?.user?.name}</span>
                    <span><i className="fas fa-calendar" /> Criada em {formatDate(t.createdAt)}</span>
                  </>
                }
                actions={
                  <div className="row-actions">
                    <button className="icon-btn" title="Editar" onClick={() => openEdit(t)}>
                      <i className="fas fa-pen" />
                    </button>
                    <button className="icon-btn icon-btn--danger" title="Excluir" onClick={() => setConfirm({ id: t.id, name: t.name })}>
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                }
              />
              <div className="card__body">
                <p className="team-card__desc">{t.description || 'Sem descrição.'}</p>
                <div className="team-card__members">
                  <div className="team-card__avatars">
                    {t.members.slice(0, 5).map((m) => (
                      <Avatar key={m.studentId} name={m.student?.user?.name} size="sm" />
                    ))}
                  </div>
                  <span className="badge badge--neutral">
                    <i className="fas fa-users" /> {t.members.length} integrante(s)
                  </span>
                </div>
                <ul className="team-card__member-list">
                  {t.members.map((m) => (
                    <li key={m.studentId}>
                      <Avatar name={m.student?.user?.name} size="xs" />
                      <span>
                        {m.student?.user?.name}
                        {m.studentId === t.leaderId && <span className="text--success"> (líder)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar equipe"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button variant="primary" form="edit-team-form" type="submit" loading={busy}>
              <i className="fas fa-save" /> Salvar
            </Button>
          </>
        }
      >
        <form id="edit-team-form" onSubmit={handleSave}>
          <Field label="Nome da equipe" required>
            <TextInput value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Descrição">
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Excluir equipe"
        message={`Tem certeza que deseja excluir a equipe "${confirm?.name}"? Os integrantes serão removidos.`}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={busy}
      />
    </div>
  );
}
