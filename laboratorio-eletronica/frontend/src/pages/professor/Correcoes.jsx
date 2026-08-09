import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submissionApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatGrade } from '../../components/ui/format';

const FILTERS = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'ENVIADA', label: 'Pendentes' },
  { value: 'CORRIGIDA', label: 'Corrigidas' },
  { value: 'ATRASADA', label: 'Atrasadas' }
];

export default function Correcoes() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('TODAS');

  useEffect(() => {
    submissionApi
      .list()
      .then((res) => setSubmissions(res.submissions))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  const filtered = filter === 'TODAS' ? submissions : submissions.filter((s) => {
    if (filter === 'ATRASADA') return s.late && s.status !== 'CORRIGIDA';
    return s.status === filter;
  });

  const pendingCount = submissions.filter((s) => s.status === 'ENVIADA').length;

  return (
    <div>
      <PageHeader
        title="Correções"
        subtitle={`Corrija as entregas dos estudantes. ${pendingCount > 0 ? `${pendingCount} aguardando correção.` : ''}`}
        icon="fa-clipboard-check"
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
        <PageLoader text="Carregando entregas..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="fa-clipboard-check"
          title="Nenhuma entrega encontrada"
          message="As entregas dos estudantes aparecerão aqui para correção."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Estudante</th>
                <th>Matrícula</th>
                <th>Equipe</th>
                <th>Lista</th>
                <th>Enviada em</th>
                <th>Status</th>
                <th>Nota</th>
                <th className="table__actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className={s.status === 'ENVIADA' ? 'row--highlight' : ''}>
                  <td><strong>{s.student?.user?.name}</strong></td>
                  <td>{s.student?.registrationNumber}</td>
                  <td>{s.student?.teamMembers?.[0]?.team?.name || '—'}</td>
                  <td>{s.assignment?.title}</td>
                  <td>{formatDate(s.submittedAt, true)}</td>
                  <td><Badge status={s.late && s.status !== 'CORRIGIDA' ? 'ATRASADA' : s.status} /></td>
                  <td className={s.grade !== null ? 'text--success' : ''}>{formatGrade(s.grade)}</td>
                  <td>
                    <Button
                      variant={s.status === 'CORRIGIDA' ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => navigate(`/professor/correcoes/${s.id}`)}
                    >
                      {s.status === 'CORRIGIDA' ? 'Ver correção' : 'Corrigir'}
                    </Button>
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
