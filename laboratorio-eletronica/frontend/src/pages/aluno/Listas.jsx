import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../components/ui/format';

const FILTERS = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'ENVIADA', label: 'Enviadas' },
  { value: 'CORRIGIDA', label: 'Corrigidas' },
  { value: 'ATRASADA', label: 'Atrasadas' }
];

export default function Listas() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('TODAS');

  useEffect(() => {
    assignmentApi
      .list()
      .then((res) => setAssignments(res.assignments))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  const filtered = filter === 'TODAS' ? assignments : assignments.filter((a) => a.status === filter);

  return (
    <div>
      <PageHeader
        title="Listas"
        subtitle="Acompanhe e responda as listas publicadas pelos professores."
        icon="fa-list-check"
      />

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`filter-chip ${filter === f.value ? 'filter-chip--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader text="Carregando listas..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="fa-list-check"
          title="Nenhuma lista encontrada"
          message={filter === 'TODAS' ? 'Não há listas publicadas no momento.' : 'Nenhuma lista com este status.'}
        />
      ) : (
        <div className="assignment-grid">
          {filtered.map((a) => (
            <button
              key={a.id}
              className="assignment-card"
              onClick={() => navigate(`/aluno/listas/${a.id}`)}
            >
              <div className="assignment-card__top">
                <div className="assignment-card__icon">
                  <i className="fas fa-file-lines" />
                </div>
                <Badge status={a.status} />
              </div>
              <h3 className="assignment-card__title">{a.title}</h3>
              <p className="assignment-card__desc">{a.description || 'Sem descrição.'}</p>
              <div className="assignment-card__meta">
                <span><i className="fas fa-chalkboard-user" /> {a.teacher?.user?.name}</span>
                <span><i className="fas fa-calendar" /> {formatDate(a.dueDate)}</span>
              </div>
              <div className="assignment-card__footer">
                <span><i className="fas fa-circle-question" /> {a.questionCount} questões</span>
                {a.submission && <span className="text--success"><i className="fas fa-check" /> Enviada</span>}
                {a.submission?.grade !== null && a.submission?.grade !== undefined && (
                  <span className="assignment-card__grade">Nota: {a.submission.grade.toLocaleString('pt-BR')}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
