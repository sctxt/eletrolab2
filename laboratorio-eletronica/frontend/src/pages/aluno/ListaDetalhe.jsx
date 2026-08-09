import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assignmentApi, submissionApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { formatDate } from '../../components/ui/format';

const TYPE_LABELS = {
  TEXTO: 'Texto',
  RESPOSTA_CURTA: 'Resposta curta',
  MULTIPLA_ESCOLHA: 'Múltipla escolha',
  MULTIPLAS_RESPOSTAS: 'Múltiplas respostas'
};

function getInitialAnswers(questions) {
  const answers = {};
  for (const q of questions) {
    if (q.type === 'MULTIPLAS_RESPOSTAS') {
      answers[q.id] = [];
    } else {
      answers[q.id] = '';
    }
  }
  return answers;
}

export default function ListaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    assignmentApi
      .get(id)
      .then((res) => {
        setData(res);
        setAnswers(getInitialAnswers(res.assignment.questions));
      })
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, show]);

  const assignment = data?.assignment;
  const submission = data?.submission;
  const questions = assignment?.questions || [];

  const totalPoints = useMemo(
    () => questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0),
    [questions]
  );

  const alreadySubmitted = Boolean(submission);
  const isLate = assignment && !alreadySubmitted && new Date(assignment.dueDate) < new Date();

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: '' }));
  };

  const toggleMulti = (questionId, optionText) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const next = current.includes(optionText)
        ? current.filter((x) => x !== optionText)
        : [...current, optionText];
      return { ...prev, [questionId]: next };
    });
  };

  const validate = () => {
    const next = {};
    for (const q of questions) {
      const value = answers[q.id];
      const empty =
        q.type === 'MULTIPLAS_RESPOSTAS'
          ? !Array.isArray(value) || value.length === 0
          : !String(value || '').trim();
      if (empty) next[q.id] = 'Esta questão é obrigatória.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      show('Preencha todas as questões obrigatórias.', 'warning', 'Atenção');
      return;
    }
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        answer:
          q.type === 'MULTIPLAS_RESPOSTAS'
            ? (answers[q.id] || []).join(', ')
            : String(answers[q.id] || '')
      }));
      const res = await submissionApi.submit(id, { answers: payload });
      show(res.message, 'success', 'Lista enviada');
      const refreshed = await assignmentApi.get(id);
      setData(refreshed);
      setAnswers(getInitialAnswers(refreshed.assignment.questions));
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader text="Carregando lista..." />;
  if (!assignment) return <EmptyState icon="fa-circle-exclamation" title="Lista não encontrada" />;

  const answerMap = submission?.answers
    ? Object.fromEntries(submission.answers.map((a) => [a.questionId, a.answer]))
    : null;

  return (
    <div>
      <button className="link link--back" onClick={() => navigate('/aluno/listas')}>
        <i className="fas fa-arrow-left" /> Voltar para listas
      </button>

      <div className="assignment-detail-head">
        <div>
          <h1>{assignment.title}</h1>
          <p className="text--muted">{assignment.description || 'Sem descrição.'}</p>
        </div>
        <Badge status={assignment.status === 'PUBLICADA' && alreadySubmitted ? (submission.status === 'CORRIGIDA' ? 'CORRIGIDA' : submission.late ? 'ATRASADA' : 'ENVIADA') : isLate ? 'ATRASADA' : 'PENDENTE'} />
      </div>

      <div className="assignment-meta-bar">
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-chalkboard-user" /></span>
          <div>
            <strong>Professor(a)</strong>
            <span>{assignment.teacher?.user?.name}</span>
          </div>
        </div>
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
            <span>{questions.length}</span>
          </div>
        </div>
        <div className="assignment-meta">
          <span className="assignment-meta__icon"><i className="fas fa-weight-hanging" /></span>
          <div>
            <strong>Pontuação</strong>
            <span>{totalPoints.toLocaleString('pt-BR')} pts</span>
          </div>
        </div>
      </div>

      {assignment.instructions && (
        <div className="instructions-box">
          <strong><i className="fas fa-circle-info" /> Instruções</strong>
          <p>{assignment.instructions}</p>
        </div>
      )}

      {alreadySubmitted ? (
        <div className="submitted-view">
          <div className="submitted-banner">
            <i className="fas fa-circle-check" />
            <div>
              <h3>Lista enviada!</h3>
              <p>Enviada em {formatDate(submission.submittedAt, true)}.</p>
              {submission.grade !== null && submission.grade !== undefined && (
                <p className="submitted-banner__grade">
                  Sua nota: <strong>{Number(submission.grade).toLocaleString('pt-BR')}</strong>
                </p>
              )}
              {submission.feedback && (
                <div className="feedback-box">
                  <strong><i className="fas fa-comment" /> Comentário do professor</strong>
                  <p>{submission.feedback}</p>
                </div>
              )}
            </div>
          </div>

          {questions.map((q, index) => (
            <div key={q.id} className="question-card">
              <div className="question-card__head">
                <span className="question-card__num">Questão {index + 1}</span>
                <span className="question-card__type">{TYPE_LABELS[q.type] || q.type}</span>
                <span className="question-card__points">{q.points} pts</span>
              </div>
              <p className="question-card__text">{q.text}</p>
              <div className="question-card__answer">
                <strong>Sua resposta:</strong>
                <p>{answerMap?.[q.id] || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="questions-list">
            {questions.map((q, index) => (
              <div key={q.id} className="question-card">
                <div className="question-card__head">
                  <span className="question-card__num">Questão {index + 1}</span>
                  <span className="question-card__type">{TYPE_LABELS[q.type] || q.type}</span>
                  <span className="question-card__points">{q.points} pts</span>
                </div>
                <p className="question-card__text">{q.text}</p>

                {q.type === 'TEXTO' && (
                  <Field error={errors[q.id]}>
                    <textarea
                      className="textarea"
                      rows={4}
                      placeholder="Digite sua resposta aqui..."
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                  </Field>
                )}

                {q.type === 'RESPOSTA_CURTA' && (
                  <Field error={errors[q.id]}>
                    <input
                      className="input"
                      placeholder="Digite sua resposta..."
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                  </Field>
                )}

                {q.type === 'MULTIPLA_ESCOLHA' && (
                  <div className="option-list">
                    {q.options.map((opt) => (
                      <label
                        key={opt.id}
                        className={`option-item ${answers[q.id] === opt.text ? 'option-item--selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === opt.text}
                          onChange={() => setAnswer(q.id, opt.text)}
                        />
                        <span className="option-item__radio" />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                    {errors[q.id] && <span className="field__error"><i className="fas fa-circle-exclamation" /> {errors[q.id]}</span>}
                  </div>
                )}

                {q.type === 'MULTIPLAS_RESPOSTAS' && (
                  <div className="option-list">
                    {q.options.map((opt) => {
                      const checked = (answers[q.id] || []).includes(opt.text);
                      return (
                        <label
                          key={opt.id}
                          className={`option-item ${checked ? 'option-item--selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMulti(q.id, opt.text)}
                          />
                          <span className="option-item__checkbox"><i className="fas fa-check" /></span>
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                    {errors[q.id] && <span className="field__error"><i className="fas fa-circle-exclamation" /> {errors[q.id]}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="submit-bar">
            <div>
              <strong>Antes de enviar:</strong>
              <span>Revise suas respostas. Após o envio não será possível alterar.</span>
              {isLate && <span className="text--danger"><i className="fas fa-exclamation-triangle" /> O prazo já venceu. O envio será registrado como atrasado.</span>}
            </div>
            <Button variant="success" size="lg" loading={submitting} onClick={handleSubmit}>
              <i className="fas fa-paper-plane" /> Enviar Lista
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
