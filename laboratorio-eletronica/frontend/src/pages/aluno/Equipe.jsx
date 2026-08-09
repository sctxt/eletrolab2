import React, { useEffect, useState } from 'react';
import { teamApi, studentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, TextInput, Textarea } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../components/ui/format';

function CreateTeamForm({ onCreated }) {
  const { show } = useToast();
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Informe o nome da equipe.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const res = await teamApi.create(form);
      show(res.message, 'success');
      onCreated();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card--highlight">
      <CardHeader title="Criar nova equipe" subtitle="Crie sua equipe e convide colegas para participar." />
      <div className="card__body">
        <form onSubmit={handleSubmit} noValidate>
          <Field label="Nome da equipe" error={errors.name} required>
            <TextInput name="name" value={form.name} onChange={handleChange} placeholder="Ex.: Circuito Vivo" />
          </Field>
          <Field label="Descrição" hint="Opcional. Descreva o foco da equipe.">
            <Textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Ex.: Projetos de circuitos analógicos e sensores." />
          </Field>
          <Button type="submit" loading={loading}>
            <i className="fas fa-plus" /> Criar equipe
          </Button>
        </form>
      </div>
    </Card>
  );
}

function InviteStudentModal({ team, onDone }) {
  const { show } = useToast();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  const memberIds = team?.members?.map((m) => m.studentId) || [];
  const invitedIds = team?.invitations?.filter((i) => i.status === 'PENDENTE').map((i) => i.studentId) || [];

  const doSearch = async (term) => {
    setSearch(term);
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await studentApi.search(term);
      setResults(res.students.filter((s) => !memberIds.includes(s.id) && !invitedIds.includes(s.id)));
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSearching(false);
    }
  };

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const sendInvites = async () => {
    if (selected.length === 0) {
      show('Selecione ao menos um estudante.', 'warning');
      return;
    }
    setSending(true);
    try {
      const res = await teamApi.invite(team.id, { studentIds: selected });
      show(res.message, 'success');
      onDone();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="invite-modal">
      <Field label="Buscar estudantes" hint="Pesquise por nome ou matrícula.">
        <div className="search-field">
          <i className="fas fa-magnifying-glass" />
          <TextInput
            value={search}
            onChange={(e) => doSearch(e.target.value)}
            placeholder="Ex.: 2024101004 ou Diego"
            autoFocus
          />
        </div>
      </Field>

      {searching && <PageLoader text="Buscando..." />}

      {!searching && results.length > 0 && (
        <ul className="student-picker">
          {results.map((s) => (
            <li key={s.id}>
              <label className="student-picker__item">
                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                <Avatar name={s.user.name} size="sm" />
                <div>
                  <strong>{s.user.name}</strong>
                  <span>{s.registrationNumber} · {s.course}</span>
                </div>
              </label>
            </li>
          ))}
        </ul>
      )}

      {!searching && search.trim().length >= 2 && results.length === 0 && (
        <EmptyState icon="fa-user-magnifying-glass" title="Nenhum estudante encontrado" message="Verifique se o estudante já está na equipe ou já foi convidado." />
      )}

      <div className="invite-modal__footer">
        <Button variant="primary" onClick={sendInvites} loading={sending} disabled={selected.length === 0}>
          <i className="fas fa-paper-plane" /> Enviar convite{selected.length > 0 ? ` (${selected.length})` : ''}
        </Button>
      </div>
    </div>
  );
}

export default function Equipe() {
  const { user } = useAuth();
  const { show } = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    teamApi
      .list()
      .then((res) => setTeams(res.teams))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [reload, show]);

  const team = teams[0] || null;
  const isLeader = team?.leaderId === user?.student?.id;

  const handleRemoveMember = async (studentId) => {
    setConfirm(null);
    try {
      const res = await teamApi.removeMember(team.id, studentId);
      show(res.message, 'success');
      setReload((r) => r + 1);
    } catch (err) {
      show(err.message, 'error');
    }
  };

  const handleLeave = async () => {
    setConfirm(null);
    try {
      const res = await teamApi.leave(team.id);
      show(res.message, 'success');
      setReload((r) => r + 1);
    } catch (err) {
      show(err.message, 'error');
    }
  };

  const handleTransfer = async (studentId) => {
    setConfirm(null);
    try {
      const res = await teamApi.transfer(team.id, { studentId });
      show(res.message, 'success');
      setReload((r) => r + 1);
    } catch (err) {
      show(err.message, 'error');
    }
  };

  if (loading) return <PageLoader text="Carregando equipes..." />;

  return (
    <div>
      <PageHeader
        title="Minha Equipe"
        subtitle="Gerencie sua equipe, convites e integrantes."
        icon="fa-users"
        actions={
          team &&
          isLeader && (
            <Button variant="primary" onClick={() => setShowInvite(true)}>
              <i className="fas fa-user-plus" /> Convidar estudantes
            </Button>
          )
        }
      />

      {!team && (
        <div className="equipe-empty">
          <EmptyState
            icon="fa-users"
            title="Você ainda não está em uma equipe"
            message="Crie uma nova equipe e comece a trabalhar em grupo."
          />
          <CreateTeamForm onCreated={() => setReload((r) => r + 1)} />
        </div>
      )}

      {team && (
        <>
          <div className="team-hero">
            <div className="team-hero__avatar">
              <Avatar name={team.name} size="lg" />
            </div>
            <div className="team-hero__info">
              <h2>{team.name}</h2>
              <p>{team.description || 'Sem descrição.'}</p>
              <div className="team-hero__meta">
                <Badge status="PUBLICADA" label="Equipe ativa" />
                <span><i className="fas fa-crown" /> Líder: {team.leader?.user?.name || '—'}</span>
                <span><i className="fas fa-users" /> {team.members.length} integrante(s)</span>
                <span><i className="fas fa-calendar" /> Criada em {formatDate(team.createdAt)}</span>
              </div>
            </div>
            <div className="team-hero__actions">
              {isLeader ? (
                <>
                  <Button variant="outline" onClick={() => setConfirm({ type: 'delete', id: team.id })}>
                    <i className="fas fa-trash" /> Excluir equipe
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setConfirm({ type: 'leave', id: team.id })}>
                  <i className="fas fa-right-from-bracket" /> Sair da equipe
                </Button>
              )}
            </div>
          </div>

          <div className="team-grid">
            <Card>
              <CardHeader title="Integrantes" subtitle={`${team.members.length} membro(s)`} />
              <div className="card__body">
                <ul className="member-list">
                  {team.members.map((m) => (
                    <li key={m.studentId} className="member-item">
                      <Avatar name={m.student?.user?.name} size="md" />
                      <div className="member-item__info">
                        <strong>
                          {m.student?.user?.name}
                          {m.studentId === team.leaderId && <span className="member-item__leader"><i className="fas fa-crown" /> Líder</span>}
                        </strong>
                        <span>{m.student?.registrationNumber}</span>
                      </div>
                      <div className="member-item__actions">
                        {isLeader && m.studentId !== team.leaderId && (
                          <>
                            <button
                              className="icon-btn icon-btn--sm"
                              title="Transferir liderança"
                              onClick={() => setConfirm({ type: 'transfer', studentId: m.studentId, name: m.student?.user?.name })}
                            >
                              <i className="fas fa-crown" />
                            </button>
                            <button
                              className="icon-btn icon-btn--sm icon-btn--danger"
                              title="Remover membro"
                              onClick={() => setConfirm({ type: 'remove', studentId: m.studentId, name: m.student?.user?.name })}
                            >
                              <i className="fas fa-user-minus" />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card>
              <CardHeader title="Convites enviados" subtitle={`${team.invitations.length} convite(s)`} />
              <div className="card__body">
                {team.invitations.length === 0 ? (
                  <EmptyState icon="fa-paper-plane" title="Nenhum convite" message={'Use o botão "Convidar estudantes" para montar sua equipe.'} />
                ) : (
                  <ul className="invite-list">
                    {team.invitations.map((inv) => (
                      <li key={inv.id} className="invite-item">
                        <Avatar name={inv.student?.user?.name} size="sm" />
                        <div>
                          <strong>{inv.student?.user?.name}</strong>
                          <span>{inv.student?.registrationNumber}</span>
                        </div>
                        <Badge status={inv.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {team && isLeader && (
        <Card className="card--invite-only">
          <CardHeader title="Convidar novos integrantes" subtitle="Busque estudantes por nome ou matrícula." />
          <div className="card__body">
            <Button variant="primary" onClick={() => setShowInvite(true)}>
              <i className="fas fa-user-plus" /> Abrir busca de estudantes
            </Button>
          </div>
        </Card>
      )}

      <Modal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title={`Convidar para ${team?.name || 'equipe'}`}
        size="lg"
      >
        {team && (
          <InviteStudentModal
            team={team}
            onDone={() => {
              setShowInvite(false);
              setReload((r) => r + 1);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.type === 'delete'
            ? 'Excluir equipe'
            : confirm?.type === 'leave'
              ? 'Sair da equipe'
              : confirm?.type === 'remove'
                ? 'Remover membro'
                : 'Transferir liderança'
        }
        message={
          confirm?.type === 'delete'
            ? `Tem certeza que deseja excluir a equipe "${team?.name}"? Todos os integrantes serão removidos.`
            : confirm?.type === 'leave'
              ? 'Tem certeza que deseja sair desta equipe?'
              : confirm?.type === 'remove'
                ? `Remover ${confirm?.name} desta equipe?`
                : `Transferir a liderança para ${confirm?.name}?`
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.type === 'delete') return handleDeleteTeam(confirm.id);
          if (confirm?.type === 'leave') return handleLeave();
          if (confirm?.type === 'remove') return handleRemoveMember(confirm.studentId);
          return handleTransfer(confirm.studentId);
        }}
      />
    </div>
  );

  async function handleDeleteTeam(id) {
    setConfirm(null);
    try {
      const res = await teamApi.remove(id);
      show(res.message, 'success');
      setReload((r) => r + 1);
    } catch (err) {
      show(err.message, 'error');
    }
  }
}
