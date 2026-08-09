import React, { useEffect, useState } from 'react';
import { reportApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader, StatCard } from '../../components/ui/Page';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatGrade } from '../../components/ui/format';

function DonutChart({ percentage }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="donut" style={{ '--pct': percentage }}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="donut__track" cx="60" cy="60" r={radius} />
        <circle
          className="donut__fill"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="donut__label">
        <strong>{percentage}%</strong>
        <span>entrega</span>
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color = '' }) {
  const width = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <span className="bar-row__label" title={label}>{label}</span>
      <div className="bar-row__track">
        <div className={`bar-row__fill ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="bar-row__value">{value.toLocaleString('pt-BR')}</span>
    </div>
  );
}

export default function Relatorios() {
  const { show } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi
      .get()
      .then(setData)
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  if (loading) return <PageLoader text="Gerando relatórios..." />;
  if (!data) return null;

  const maxAverage = Math.max(1, ...data.studentAverages.map((s) => s.average));
  const maxSubmissions = Math.max(1, ...data.responsesByList.map((r) => r.submitted));
  const maxActivity = Math.max(1, ...data.mostActive.map((a) => a.count));
  const maxTeamScore = Math.max(1, ...data.teamPerformance.map((t) => t.submissions));

  return (
    <div className="relatorios">
      <PageHeader
        title="Relatórios"
        subtitle="Indicadores de desempenho do laboratório."
        icon="fa-chart-line"
      />

      <div className="stats-grid">
        <StatCard icon="fa-user-graduate" label="Alunos" value={data.totalStudents} />
        <StatCard icon="fa-users" label="Equipes" value={data.totalTeams} tone="teal" />
        <StatCard icon="fa-list-check" label="Listas publicadas" value={data.totalPublished} tone="lime" />
        <StatCard icon="fa-paper-plane" label="Respostas" value={data.totalSubmissions} tone="dark" />
      </div>

      <div className="reports-grid">
        <Card>
          <CardHeader title="Taxa de entrega" subtitle="Percentual de listas respondidas pelos estudantes." />
          <div className="card__body card__body--center">
            <DonutChart percentage={data.deliveryRate} />
            <p className="text--muted">
              {data.totalSubmissions} de {data.totalPublished * data.totalStudents} entregas esperadas.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Listas atrasadas" subtitle="Listas publicadas sem entregas após o prazo." />
          <div className="card__body">
            {data.lateLists.length === 0 ? (
              <EmptyState icon="fa-calendar-check" title="Nenhuma lista atrasada" message="Todas as listas publicadas têm entregas ou estão dentro do prazo." />
            ) : (
              <ul className="late-list">
                {data.lateLists.map((l) => (
                  <li key={l.id}>
                    <span className="late-list__icon"><i className="fas fa-clock" /></span>
                    <div>
                      <strong>{l.title}</strong>
                      <span>Prazo vencido em {formatDate(l.dueDate)}</span>
                    </div>
                    <Badge status="ATRASADA" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Média dos alunos" subtitle="Nota média de cada estudante nas listas corrigidas." />
          <div className="card__body">
            {data.studentAverages.length === 0 ? (
              <EmptyState icon="fa-chart-simple" title="Sem dados" />
            ) : (
              data.studentAverages.slice(0, 8).map((s) => (
                <BarRow key={s.registrationNumber} label={s.name} value={s.average} max={10} color="bar-row__fill--green" />
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Desempenho das equipes" subtitle="Quantidade de entregas por equipe." />
          <div className="card__body">
            {data.teamPerformance.length === 0 ? (
              <EmptyState icon="fa-users-slash" title="Sem equipes" />
            ) : (
              data.teamPerformance.map((t) => (
                <BarRow key={t.id} label={`${t.name} (${t.membersCount} membros)`} value={t.submissions} max={maxTeamScore} color="bar-row__fill--teal" />
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Quantidade de respostas por lista" subtitle="Entregas recebidas em cada lista." />
          <div className="card__body">
            {data.responsesByList.length === 0 ? (
              <EmptyState icon="fa-list-check" title="Nenhuma lista" />
            ) : (
              data.responsesByList.map((r) => (
                <BarRow key={r.title} label={`${r.title}${r.status === 'RASCUNHO' ? ' (rascunho)' : ''}`} value={r.submitted} max={maxSubmissions} color={r.status === 'RASCUNHO' ? 'bar-row__fill--neutral' : 'bar-row__fill--green'} />
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Alunos mais ativos" subtitle="Estudantes com mais entregas realizadas." />
          <div className="card__body">
            {data.mostActive.length === 0 ? (
              <EmptyState icon="fa-user-check" title="Sem dados" />
            ) : (
              <ol className="ranking">
                {data.mostActive.map((a, i) => (
                  <li key={a.name} className={`ranking__item ${i === 0 ? 'ranking__item--first' : ''}`}>
                    <span className="ranking__pos">{i + 1}º</span>
                    <strong>{a.name}</strong>
                    <span className="ranking__count">{a.count} entrega(s)</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
