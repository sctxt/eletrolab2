import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/Page';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatDate } from '../../components/ui/format';

export default function Listas() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    assignmentApi
      .list()
      .then((res) => setAssignments(res.assignments))
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await assignmentApi.remove(confirm.id);
      show(res.message, 'success');
      setConfirm(null);
      load();
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      const res = await assignmentApi.publish(id);
      show(res.message, 'success');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await assignmentApi.duplicate(id);
      show(res.message, 'success');
      load();
    } catch (err) {
      show(err.message, 'error');
    }
  };

  const drafts = assignments.filter((a) => a.status === 'RASCUNHO');
  const published = assignments.filter((a) => a.status === 'PUBLICADA');

  const ListTable = ({ items, emptyTitle, emptyMessage }) => (
    <div className="table-wrap">
      {items.length === 0 ? (
        <EmptyState icon="fa-file-lines" title={emptyTitle} message={emptyMessage} />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Prazo</th>
              <th>Questões</th>
              <th>Entregas</th>
              <th>Status</th>
              <th className="table__actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td><strong className="clickable" onClick={() => navigate(`/professor/listas/${a.id}`)}>{a.title}</strong></td>
                <td>{formatDate(a.dueDate)}</td>
                <td>{a._count?.questions ?? 0}</td>
                <td>{a._count?.submissions ?? 0}</td>
                <td><Badge status={a.status} /></td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title="Ver lista" onClick={() => navigate(`/professor/listas/${a.id}`)}>
                      <i className="fas fa-eye" />
                    </button>
                    <button className="icon-btn" title="Editar" onClick={() => navigate(`/professor/listas/${a.id}/editar`)}>
                      <i className="fas fa-pen" />
                    </button>
                    <button className="icon-btn" title="Duplicar" onClick={() => handleDuplicate(a.id)}>
                      <i className="fas fa-copy" />
                    </button>
                    {a.status === 'RASCUNHO' && (
                      <button className="icon-btn icon-btn--success" title="Publicar" onClick={() => handlePublish(a.id)}>
                        <i className="fas fa-bullhorn" />
                      </button>
                    )}
                    <button className="icon-btn icon-btn--danger" title="Excluir" onClick={() => setConfirm({ id: a.id, title: a.title })}>
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Listas"
        subtitle="Gerencie as listas de exercícios do laboratório."
        icon="fa-list-check"
        actions={
          <Button variant="primary" onClick={() => navigate('/professor/listas/criar')}>
            <i className="fas fa-plus" /> Nova lista
          </Button>
        }
      />

      {loading ? (
        <PageLoader text="Carregando listas..." />
      ) : (
        <>
          <div className="section-block">
            <div className="section-block__title">
              <i className="fas fa-pen" /> Rascunhos
              <span className="count-pill">{drafts.length}</span>
            </div>
            <ListTable
              items={drafts}
              emptyTitle="Nenhum rascunho"
              emptyMessage="Listas salvas como rascunho aparecerão aqui."
            />
          </div>

          <div className="section-block">
            <div className="section-block__title">
              <i className="fas fa-bullhorn" /> Publicadas
              <span className="count-pill">{published.length}</span>
            </div>
            <ListTable
              items={published}
              emptyTitle="Nenhuma lista publicada"
              emptyMessage="Publique uma lista para que os estudantes possam respondê-la."
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Excluir lista"
        message={`Tem certeza que deseja excluir a lista "${confirm?.title}"? As entregas e respostas vinculadas também serão removidas.`}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={busy}
      />
    </div>
  );
}
