import React, { useEffect, useState } from 'react';
import { profileApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/ui/Page';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Field, TextInput } from '../../components/ui/Field';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate } from '../../components/ui/format';

export default function Perfil() {
  const { user, refreshProfile } = useAuth();
  const { show } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    course: '',
    semester: '',
    currentPassword: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    profileApi
      .get()
      .then((res) => {
        setProfile(res.user);
        setForm({
          name: res.user.name || '',
          email: res.user.email || '',
          course: res.user.student?.course || '',
          semester: res.user.student?.semester || '',
          currentPassword: '',
          password: ''
        });
      })
      .catch((err) => show(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  const isStudent = user?.role === 'ALUNO';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Informe o nome.';
    if (!form.email.trim()) next.email = 'Informe o e-mail.';
    if (form.password && !form.currentPassword) next.currentPassword = 'Informe a senha atual.';
    if (form.password && form.password.length < 6) next.password = 'Mínimo de 6 caracteres.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const body = {
        name: form.name,
        email: form.email
      };
      if (form.currentPassword && form.password) {
        body.currentPassword = form.currentPassword;
        body.password = form.password;
      }
      if (isStudent) {
        body.course = form.course;
        body.semester = Number(form.semester) || 1;
      }
      const res = await profileApi.update(body);
      show(res.message, 'success');
      await refreshProfile();
      setForm((prev) => ({ ...prev, currentPassword: '', password: '' }));
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader text="Carregando perfil..." />;

  return (
    <div>
      <PageHeader title="Perfil" subtitle="Gerencie seus dados pessoais e credenciais." icon="fa-user" />

      <div className="profile-grid">
        <Card>
          <div className="profile-card">
            <Avatar name={profile?.name} size="lg" />
            <h3>{profile?.name}</h3>
            <p>{profile?.email}</p>
            <span className="badge badge--success">
              <i className="fas fa-circle-check" /> {isStudent ? 'Estudante' : 'Professor(a)'}
            </span>
            <div className="profile-card__meta">
              {isStudent && (
                <>
                  <span><i className="fas fa-id-card" /> Matrícula: <strong>{profile?.student?.registrationNumber}</strong></span>
                  <span><i className="fas fa-book" /> Curso: <strong>{profile?.student?.course}</strong></span>
                  <span><i className="fas fa-layer-group" /> Período: <strong>{profile?.student?.semester}º</strong></span>
                </>
              )}
              <span><i className="fas fa-calendar" /> Conta criada em: <strong>{formatDate(profile?.createdAt)}</strong></span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Editar dados" subtitle="Atualize suas informações de contato." />
          <div className="card__body">
            <form onSubmit={handleSubmit} noValidate>
              <Field label="Nome completo" error={errors.name} required>
                <TextInput name="name" value={form.name} onChange={handleChange} />
              </Field>
              <Field label="E-mail" error={errors.email} required>
                <TextInput type="email" name="email" value={form.email} onChange={handleChange} />
              </Field>
              {isStudent && (
                <div className="form-row">
                  <Field label="Curso" required>
                    <TextInput name="course" value={form.course} onChange={handleChange} placeholder="Ex.: Engenharia de Computação" />
                  </Field>
                  <Field label="Período">
                    <TextInput type="number" min="1" max="12" name="semester" value={form.semester} onChange={handleChange} />
                  </Field>
                </div>
              )}
              <hr className="divider" />
              <h4 className="form-section-title">Alterar senha <small>(opcional)</small></h4>
              <Field label="Senha atual" error={errors.currentPassword}>
                <TextInput type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} autoComplete="current-password" />
              </Field>
              <Field label="Nova senha" error={errors.password} hint="Mínimo de 6 caracteres.">
                <TextInput type="password" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
              </Field>
              <div className="form-actions">
                <Button type="submit" loading={saving}>
                  <i className="fas fa-save" /> Salvar alterações
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
