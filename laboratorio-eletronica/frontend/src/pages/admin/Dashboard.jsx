import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { PageHeader, StatCard } from '../../components/ui/Page';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function AdminDashboard() {
  const { show } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .stats()
      .then((res) => setStats(res.stats))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader text="Carregando estatísticas..." />;

  const total = stats.students + stats.teachers + stats.admins;
  const activeTotal = stats.activeStudents + stats.activeTeachers + stats.admins;

  return (
    <div>
      <PageHeader
        title="Painel Administrativo"
        subtitle="Visão geral das contas cadastradas no laboratório."
        icon="fa-user-shield"
        actions={
          <Link to="/admin/contas">
            <Button variant="primary">
              <i className="fas fa-user-plus" /> Nova conta
            </Button>
          </Link>
        }
      />

      <div className="stats-grid">
        <StatCard icon="fa-user-graduate" label="Estudantes" value={stats.students} hint={`${stats.activeStudents} ativos`} tone="green" />
        <StatCard icon="fa-chalkboard-user" label="Professores" value={stats.teachers} hint={`${stats.activeTeachers} ativos`} tone="teal" />
        <StatCard icon="fa-user-shield" label="Administradores" value={stats.admins} hint="Coordenação" tone="lime" />
        <StatCard icon="fa-user-check" label="Contas ativas" value={activeTotal} hint={`de ${total} no total`} tone="amber" />
      </div>

      <Card className="mt-24">
        <div className="card__header">
          <h3 className="card__title">
            <i className="fas fa-circle-info" /> Sobre a administração
          </h3>
        </div>
        <p className="text--muted">
          Nesta área você pode criar contas de <strong>alunos</strong>, <strong>professores</strong> e{' '}
          <strong>administradores</strong>, além de editar dados, ativar/desativar contas e redefinir senhas.
          Acesse <Link to="/admin/contas">Contas</Link> para começar.
        </p>
      </Card>
    </div>
  );
}
