import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assignmentApi, submissionApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatDate, formatGrade } from '../../components/ui/format';

const TYPE_LABELS = {
  TEXTO: 'Texto',
  RESPOSTA_CURTA: 'Resposta curta',
  MULTIPLA_ESCOLHA: 'Múltipla escolha',
  MULTIPLAS_RESPOSTAS: 'Múltiplas respostas'
};

export default function ListaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([assignmentApi.get(id), submissionApi.listForAssignment(id)])
      .then(([a, s]) => {
        setAssignment(a.assignment);
        setSubmissions(s.submissions);
      })
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, show]);

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await assignmentApi.remove(id);
      show(res.message, 'success');
      navigate('/professor/listas');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const res = await assignmentApi.publish(id);
      show(res.message, 'success');
      const updated = await assignmentApi.get(id);
      setAssignment(updated.assignment);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const res = await assignmentApi.duplicate(id);
      show(res.message, 'success');
      navigate(`/professor/listas/${res.assignment.id}/editar`);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader text="Carregando lista..." />;
  if (!assignment) return <EmptyState icon="fa-circle-exclamation" title="Lista não encontrada" />;

  return (
    <div>
      <button className="link link--back" onClick={() => navigate('/professor/listas')}>
        <i className="fas fa-arrow-left" /> Voltar para listas
      </button>

      <div className="assignment-detail-head">
        <div>
          <h1>{assignment.title}</h1>
          <p className="text--muted">
            {assignment.description || 'Sem descrição.'}
            {assignment.turma && ` · Turma: ${assignment.turma}`}
          </p>
        </div>
        <Badge status={assignment.status} />
      </div>

      <div className="assignment-meta-bar">
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-calendar" /></span>
          <div>
            <strong>Prazo</strong>
            <span>{formatDate(assignment.dueDate)}</span>
          </div>
        </div>
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-list-ol" /></span>
          <div>
            <strong>Questões</strong>
            <span>{assignment.questions.length}</span>
          </div>
        </div>
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-paper-plane" /></span>
          <div>
            <strong>Entregas</strong>
            <span>{submissions.length}</span>
          </div>
        </div>
      </div>

      <div className="detail-actions">
        <Button variant="outline" onClick={() => navigate(`/professor/listas/${id}/editar`)}>
          <i className="fas fa-pen" /> Editar
        </Button>
        <Button variant="outline" onClick={handleDuplicate} disabled={busy}>
          <i className="fas fa-copy" /> Duplicar
        </Button>
        {assignment.status === 'RASCUNHO' && (
          <Button variant="success" onClick={handlePublish} loading={busy}>
            <i className="fas fa-bullhorn" /> Publicar
          </Button>
        )}
        <Button variant="danger" onClick={() => setConfirm({ action: 'delete' })}>
          <i className="fas fa-trash" /> Excluir
        </Button>
      </div>

      {assignment.instructions && (
        <div className="instructions-box">
          <strong><i className="fas fa-circle-info" /> Instruções</strong>
          <p>{assignment.instructions}</p>
        </div>
      )}

      <div className="section-block">
        <div className="section-block__title">
          <i className="fas fa-list-ol" /> Questões e gabarito
        </div>
        {assignment.questions.map((q, index) => (
          <div key={q.id} className="question-card">
            <div className="question-card__head">
              <span className="question-card__num">Questão {index + 1}</span>
              <span className="question-card__type">{TYPE_LABELS[q.type] || q.type}</span>
              <span className="question-card__points">{q.points} pts</span>
            </div>
            <p className="question-card__text">{q.text}</p>
            {(q.type === 'MULTIPLA_ESCOLHA' || q.type === 'MULTIPLAS_RESPOSTAS') && (
              <ul className="gabarito-list">
                {q.options.map((o) => (
                  <li key={o.id} className={o.correct ? 'gabarito-list__correct' : ''}>
                    {o.correct ? <i className="fas fa-check-circle" /> : <i className="fas fa-circle" />}
                    {o.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="section-block">
        <div className="section-block__title">
          <i className="fas fa-paper-plane" /> Entregas dos estudantes
          <span className="count-pill">{submissions.length}</span>
        </div>
        {submissions.length === 0 ? (
          <EmptyState
            icon="fa-inbox"
            title="Nenhuma entrega ainda"
            message="Quando os estudantes enviarem respostas, elas aparecerão aqui."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Estudante</th>
                  <th>Matrícula</th>
                  <th>Equipe</th>
                  <th>Enviada em</th>
                  <th>Status</th>
                  <th>Nota</th>
                  <th className="table__actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.student?.user?.name}</strong></td>
                    <td>{s.student?.registrationNumber}</td>
                    <td>{s.student?.teamMembers?.[0]?.team?.name || '—'}</td>
                    <td>{formatDate(s.submittedAt, true)}</td>
                    <td><Badge status={s.late && s.status !== 'CORRIGIDA' ? 'ATRASADA' : s.status} /></td>
                    <td className={s.grade !== null ? 'text--success' : ''}>{formatGrade(s.grade)}</td>
                    <td>
                      <button className="btn btn--primary btn--sm" onClick={() => navigate(`/professor/correcoes/${s.id}`)}>
                        {s.status === 'CORRIGIDA' ? 'Ver correção' : 'Corrigir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Excluir lista"
        message={`Tem certeza que deseja excluir a lista "${assignment.title}"? Todas as entregas serão removidas.`}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={busy}
      />
    </div>
  );
}
