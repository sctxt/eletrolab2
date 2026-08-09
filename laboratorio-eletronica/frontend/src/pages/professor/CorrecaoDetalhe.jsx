import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { submissionApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, TextInput, Textarea } from '../../components/ui/Field';
import { formatDate } from '../../components/ui/format';

const TYPE_LABELS = {
  TEXTO: 'Texto',
  RESPOSTA_CURTA: 'Resposta curta',
  MULTIPLA_ESCOLHA: 'Múltipla escolha',
  MULTIPLAS_RESPOSTAS: 'Múltiplas respostas'
};

export default function CorrecaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    submissionApi
      .get(id)
      .then((res) => {
        setData(res);
        setGrade(res.submission.grade !== null && res.submission.grade !== undefined ? String(res.submission.grade) : '');
        setFeedback(res.submission.feedback || '');
      })
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, show]);

  if (loading) return <PageLoader text="Carregando correção..." />;
  if (!data) return <EmptyState icon="fa-circle-exclamation" title="Entrega não encontrada" />;

  const { submission, autoGrade } = data;
  const student = submission.student;
  const assignment = submission.assignment;
  const totalPoints = assignment.questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
  const answersMap = Object.fromEntries(submission.answers.map((a) => [a.questionId, a.answer]));

  const handleSave = async (e) => {
    e.preventDefault();
    const next = {};
    if (grade === '' || Number.isNaN(Number(grade))) next.grade = 'Informe uma nota válida.';
    else if (Number(grade) < 0 || Number(grade) > 10) next.grade = 'A nota deve estar entre 0 e 10.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const res = await submissionApi.grade(id, { grade: Number(grade), feedback });
      show(res.message, 'success');
      navigate('/professor/correcoes');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button className="link link--back" onClick={() => navigate('/professor/correcoes')}>
        <i className="fas fa-arrow-left" /> Voltar para correções
      </button>

      <div className="assignment-detail-head">
        <div>
          <h1>Correção — {assignment.title}</h1>
          <p className="text--muted">Entrega de {student?.user?.name}</p>
        </div>
        <Badge status={submission.late && submission.status !== 'CORRIGIDA' ? 'ATRASADA' : submission.status} />
      </div>

      <div className="assignment-meta-bar">
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-user" /></span>
          <div>
            <strong>Estudante</strong>
            <span>{student?.user?.name}</span>
          </div>
        </div>
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-id-card" /></span>
          <div>
            <strong>Matrícula</strong>
            <span>{student?.registrationNumber}</span>
          </div>
        </div>
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-users" /></span>
          <div>
            <strong>Equipe</strong>
            <span>{student?.teamMembers?.[0]?.team?.name || 'Sem equipe'}</span>
          </div>
        </div>
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-calendar" /></span>
          <div>
            <strong>Enviada em</strong>
            <span>{formatDate(submission.submittedAt, true)}</span>
          </div>
        </div>
      </div>

      <div className="section-block">
        <div className="section-block__title">
          <i className="fas fa-file-lines" /> Respostas do estudante
          <span className="count-pill">{assignment.questions.length} questões · {totalPoints} pts</span>
        </div>
        {assignment.questions.map((q, index) => {
          const answer = answersMap[q.id];
          let isCorrect = null;
          if (q.type === 'MULTIPLA_ESCOLHA') {
            const correct = q.options.find((o) => o.correct);
            isCorrect = answer === correct?.text;
          }
          return (
            <div key={q.id} className="question-card">
              <div className="question-card__head">
                <span className="question-card__num">Questão {index + 1}</span>
                <span className="question-card__type">{TYPE_LABELS[q.type] || q.type}</span>
                <span className="question-card__points">{q.points} pts</span>
              </div>
              <p className="question-card__text">{q.text}</p>

              {(q.type === 'MULTIPLA_ESCOLHA' || q.type === 'MULTIPLAS_RESPOSTAS') && (
                <ul className="gabarito-list gabarito-list--answers">
                  {q.options.map((o) => {
                    const answered = answer?.split(',').map((x) => x.trim()).includes(o.text);
                    const correctOpt = o.correct;
                    return (
                      <li
                        key={o.id}
                        className={
                          answered && correctOpt
                            ? 'gabarito-list__right'
                            : answered && !correctOpt
                              ? 'gabarito-list__wrong'
                              : correctOpt
                                ? 'gabarito-list__correct'
                                : ''
                        }
                      >
                        {answered && correctOpt ? <i className="fas fa-check-circle" /> : answered ? <i className="fas fa-xmark-circle" /> : correctOpt ? <i className="fas fa-circle" /> : <i className="fas fa-circle" />}
                        {o.text}
                        {answered && <span className="gabarito-list__tag">{correctOpt ? 'Sua resposta' : 'Sua resposta (incorreta)'}</span>}
                        {!answered && correctOpt && <span className="gabarito-list__tag">Gabarito</span>}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="question-card__answer">
                <strong>Sua resposta:</strong>
                <p className={isCorrect === false ? 'text--danger' : ''}>{answer || '—'}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title"><i className="fas fa-star" /> Correção e nota</h3>
          <p className="card__subtitle">
            {autoGrade > 0
              ? `Sugestão automática (questões objetivas): ${autoGrade.toLocaleString('pt-BR')} pts. Ajuste conforme sua avaliação.`
              : 'Atribua a nota e, se desejar, deixe um comentário para o estudante.'}
          </p>
        </div>
        <div className="card__body">
          <form onSubmit={handleSave} noValidate>
            <div className="form-row">
              <Field label="Nota (0 a 10)" error={errors.grade} required>
                <TextInput
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Ex.: 8.5"
                />
              </Field>
            </div>
            <Field label="Comentário / Feedback" hint="Este comentário ficará visível para o estudante.">
              <Textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Parabéns pelo desenvolvimento! Reforce a resolução das questões discursivas..."
              />
            </Field>
            <div className="form-actions">
              <Button type="submit" variant="success" size="lg" loading={saving}>
                <i className="fas fa-save" /> Salvar Correção
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
