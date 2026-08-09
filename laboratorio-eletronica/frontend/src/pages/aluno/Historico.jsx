import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissionApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatGrade } from '../../components/ui/format';

export default function Historico() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    submissionApi
      .mine()
      .then((res) => setSubmissions(res.submissions))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  const graded = submissions.filter((s) => s.grade !== null);
  const average = graded.length > 0 ? graded.reduce((acc, s) => acc + s.grade, 0) / graded.length : null;

  return (
    <div>
      <PageHeader
        title="Histórico"
        subtitle="Todas as suas entregas, notas e correções."
        icon="fa-clock-rotate-left"
      />

      <div className="summary-strip">
        <div className="summary-strip__item">
          <span>Entregas</span>
          <strong>{submissions.length}</strong>
        </div>
        <div className="summary-strip__item">
          <span>Corrigidas</span>
          <strong>{graded.length}</strong>
        </div>
        <div className="summary-strip__item">
          <span>Média geral</span>
          <strong>{average !== null ? average.toLocaleString('pt-BR') : '—'}</strong>
        </div>
      </div>

      {loading ? (
        <PageLoader text="Carregando histórico..." />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon="fa-clock-rotate-left"
          title="Nenhuma entrega ainda"
          message="Suas listas enviadas aparecerão aqui."
          action={<button className="btn btn--primary" onClick={() => navigate('/aluno/listas')}>Ver listas</button>}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Lista</th>
                <th>Professor(a)</th>
                <th>Enviada em</th>
                <th>Status</th>
                <th>Nota</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.assignment?.title}</strong></td>
                  <td>{s.assignment?.teacher?.user?.name || '—'}</td>
                  <td>{formatDate(s.submittedAt, true)}</td>
                  <td><Badge status={s.late && s.status !== 'CORRIGIDA' ? 'ATRASADA' : s.status} /></td>
                  <td className={s.grade !== null ? 'text--success' : ''}>
                    <strong>{formatGrade(s.grade)}</strong>
                  </td>
                  <td>
                    <button className="icon-btn" title="Ver detalhes" onClick={() => navigate(`/aluno/listas/${s.assignmentId}`)}>
                      <i className="fas fa-chevron-right" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
