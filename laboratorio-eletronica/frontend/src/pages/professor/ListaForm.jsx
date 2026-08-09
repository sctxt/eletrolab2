import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assignmentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/ui/Page';
import { Button } from '../../components/ui/Button';
import { Field, TextInput, Textarea, Select } from '../../components/ui/Field';
import { ConfirmDialog } from '../../components/ui/Modal';

const QUESTION_TYPES = [
  { value: 'TEXTO', label: 'Texto' },
  { value: 'RESPOSTA_CURTA', label: 'Resposta curta' },
  { value: 'MULTIPLA_ESCOLHA', label: 'Múltipla escolha' },
  { value: 'MULTIPLAS_RESPOSTAS', label: 'Múltiplas respostas' }
];

function emptyQuestion() {
  return {
    text: '',
    type: 'TEXTO',
    points: 1,
    options: [{ text: '', correct: false }]
  };
}

export default function ListaForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    turma: '',
    dueDate: '',
    status: 'RASCUNHO'
  });

  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    assignmentApi
      .get(id)
      .then((res) => {
        const a = res.assignment;
        setForm({
          title: a.title,
          description: a.description || '',
          instructions: a.instructions || '',
          turma: a.turma || '',
          dueDate: new Date(a.dueDate).toISOString().slice(0, 16),
          status: a.status
        });
        setQuestions(
          a.questions.map((q) => ({
            text: q.text,
            type: q.type,
            points: q.points,
            options: q.options.length > 0 ? q.options.map((o) => ({ text: o.text, correct: o.correct })) : [{ text: '', correct: false }]
          }))
        );
      })
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, isEdit, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateQuestion = (index, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIndex, oIndex, patch) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) => (j === oIndex ? { ...o, ...patch } : o));
        return { ...q, options };
      })
    );
  };

  const isObjective = (type) => type === 'MULTIPLA_ESCOLHA' || type === 'MULTIPLAS_RESPOSTAS';

  const setSingleCorrect = (qIndex, oIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return { ...q, options: q.options.map((o, j) => ({ ...o, correct: j === oIndex })) };
      })
    );
  };

  const toggleCorrect = (qIndex, oIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        return { ...q, options: q.options.map((o, j) => (j === oIndex ? { ...o, correct: !o.correct } : o)) };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [emptyQuestion()]));
  };

  const addOption = (qIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: [...q.options, { text: '', correct: false }] } : q))
    );
  };

  const removeOption = (qIndex, oIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.filter((_, j) => j !== oIndex);
        return { ...q, options: options.length > 0 ? options : [{ text: '', correct: false }] };
      })
    );
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Informe o título da lista.';
    if (!form.dueDate) next.dueDate = 'Informe o prazo de entrega.';

    const qErrors = [];
    questions.forEach((q, i) => {
      const qe = {};
      if (!q.text.trim()) qe.text = 'Digite o enunciado.';
      if (!q.points || Number(q.points) <= 0) qe.points = 'Informe a pontuação.';
      if (isObjective(q.type)) {
        const filled = q.options.filter((o) => o.text.trim());
        if (filled.length < 2) qe.options = 'Adicione ao menos duas opções.';
        else if (q.type === 'MULTIPLA_ESCOLHA' && filled.filter((o) => o.correct).length !== 1) {
          qe.options = 'Marque exatamente uma opção correta.';
        } else if (q.type === 'MULTIPLAS_RESPOSTAS' && filled.filter((o) => o.correct).length < 1) {
          qe.options = 'Marque ao menos uma opção correta.';
        }
      }
      qErrors.push(qe);
      if (Object.keys(qe).length > 0) next[`q-${i}`] = 'true';
    });

    setErrors(next);
    setQuestionErrors(qErrors);
    return Object.keys(next).length === 0;
  };

  const [questionErrors, setQuestionErrors] = useState([]);

  const buildPayload = () => ({
    title: form.title,
    description: form.description,
    instructions: form.instructions,
    turma: form.turma,
    dueDate: new Date(form.dueDate).toISOString(),
    questions: questions.map((q) => ({
      text: q.text,
      type: q.type,
      points: Number(q.points) || 1,
      options: isObjective(q.type)
        ? q.options.filter((o) => o.text.trim()).map((o) => ({ text: o.text, correct: o.correct }))
        : []
    }))
  });

  const submit = async (status) => {
    if (!validate()) {
      show('Verifique os campos destacados.', 'warning', 'Atenção');
      return;
    }
    const payload = { ...buildPayload(), status };
    setSaving(true);
    try {
      const res = isEdit
        ? await assignmentApi.update(id, payload)
        : await assignmentApi.create(payload);
      show(res.message, 'success', status === 'PUBLICADA' ? 'Lista publicada' : 'Rascunho salvo');
      navigate('/professor/listas');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!validate()) {
      show('Verifique os campos destacados.', 'warning', 'Atenção');
      return;
    }
    setPublishing(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await assignmentApi.update(id, payload);
        const res = await assignmentApi.publish(id);
        show(res.message, 'success');
      } else {
        const res = await assignmentApi.create({ ...payload, status: 'PUBLICADA' });
        show(res.message, 'success');
      }
      navigate('/professor/listas');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <PageLoader text="Carregando lista..." />;

  return (
    <div className="lista-form">
      <PageHeader
        title={isEdit ? 'Editar lista' : 'Criar lista'}
        subtitle={isEdit ? 'Atualize as informações da lista.' : 'Monte uma nova lista de exercícios.'}
        icon={isEdit ? 'fa-pen' : 'fa-plus'}
      />

      <div className="card">
        <div className="card__header">
          <h3 className="card__title"><i className="fas fa-circle-info" /> Informações gerais</h3>
        </div>
        <div className="card__body">
          <div className="form-grid">
            <Field label="Título" error={errors.title} required className="form-grid--full">
              <TextInput name="title" value={form.title} onChange={handleChange} placeholder="Ex.: Leis de Kirchhoff" />
            </Field>
            <Field label="Turma" className="form-grid--full">
              <TextInput name="turma" value={form.turma} onChange={handleChange} placeholder="Ex.: Engenharia de Computação - 4º período" />
            </Field>
            <Field label="Descrição" className="form-grid--full">
              <Textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Breve descrição da lista." />
            </Field>
            <Field label="Instruções" className="form-grid--full">
              <Textarea name="instructions" value={form.instructions} onChange={handleChange} rows={3} placeholder="Orientações gerais para os estudantes." />
            </Field>
            <Field label="Prazo de entrega" error={errors.dueDate} required>
              <TextInput type="datetime-local" name="dueDate" value={form.dueDate} onChange={handleChange} />
            </Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title"><i className="fas fa-list-ol" /> Questões</h3>
            <p className="card__subtitle">{questions.length} questão(ões) adicionada(s).</p>
          </div>
        </div>
        <div className="card__body">
          <div className="questions-editor">
            {questions.map((q, qIndex) => {
              const qe = questionErrors[qIndex] || {};
              return (
                <div key={qIndex} className="question-editor">
                  <div className="question-editor__head">
                    <span className="question-editor__num">Questão {qIndex + 1}</span>
                    <div className="question-editor__head-actions">
                      <Select
                        value={q.type}
                        onChange={(e) => updateQuestion(qIndex, { type: e.target.value })}
                        aria-label="Tipo da questão"
                      >
                        {QUESTION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </Select>
                      <div className="points-input">
                        <span>Pontos:</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={q.points}
                          onChange={(e) => updateQuestion(qIndex, { points: e.target.value })}
                        />
                      </div>
                      <button className="icon-btn icon-btn--danger" onClick={() => removeQuestion(qIndex)} title="Remover questão">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>

                  <Field error={qe.text}>
                    <Textarea
                      rows={2}
                      placeholder="Digite o enunciado da questão..."
                      value={q.text}
                      onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                    />
                  </Field>

                  {isObjective(q.type) && (
                    <div className="options-editor">
                      <span className="options-editor__label">
                        {q.type === 'MULTIPLA_ESCOLHA' ? 'Selecione a opção correta' : 'Marque as opções corretas'}
                      </span>
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="option-editor">
                          <label className={`option-correct ${opt.correct ? 'option-correct--checked' : ''}`}>
                            <input
                              type={q.type === 'MULTIPLA_ESCOLHA' ? 'radio' : 'checkbox'}
                              name={`correct-${qIndex}`}
                              checked={opt.correct}
                              onChange={() =>
                                q.type === 'MULTIPLA_ESCOLHA'
                                  ? setSingleCorrect(qIndex, oIndex)
                                  : toggleCorrect(qIndex, oIndex)
                              }
                            />
                            <span className="option-correct__mark"><i className="fas fa-check" /></span>
                          </label>
                          <TextInput
                            placeholder={`Opção ${oIndex + 1}`}
                            value={opt.text}
                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                          />
                          <button className="icon-btn icon-btn--danger" onClick={() => removeOption(qIndex, oIndex)} title="Remover opção">
                            <i className="fas fa-xmark" />
                          </button>
                        </div>
                      ))}
                      {qe.options && (
                        <span className="field__error"><i className="fas fa-circle-exclamation" /> {qe.options}</span>
                      )}
                      <button className="btn btn--outline btn--sm" onClick={() => addOption(qIndex)}>
                        <i className="fas fa-plus" /> Adicionar opção
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button variant="outline" onClick={addQuestion}>
            <i className="fas fa-plus" /> Adicionar questão
          </Button>
        </div>
      </div>

      <div className="form-actions form-actions--sticky">
        <Button variant="ghost" onClick={() => setShowDiscard(true)}>
          <i className="fas fa-xmark" /> Cancelar
        </Button>
        <div className="form-actions__right">
          <Button variant="outline" onClick={() => submit('RASCUNHO')} loading={saving && form.status === 'RASCUNHO'}>
            <i className="fas fa-pen" /> Salvar Rascunho
          </Button>
          <Button variant="success" onClick={handlePublish} loading={publishing}>
            <i className="fas fa-bullhorn" /> Publicar Lista
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDiscard}
        title="Descartar alterações"
        message="As alterações não salvas serão perdidas. Deseja continuar?"
        confirmLabel="Sair sem salvar"
        onCancel={() => setShowDiscard(false)}
        onConfirm={() => navigate('/professor/listas')}
      />
    </div>
  );
}
