import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Field, TextInput } from '../../components/ui/Field';

export default function LoginProfessor() {
  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Informe o e-mail.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Informe um e-mail válido.';
    if (!form.password) next.password = 'Informe a senha.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login('professor', form);
      show('Bem-vindo(a) ao painel do professor!', 'success', 'Login realizado');
      navigate('/professor/dashboard');
    } catch (err) {
      show(err.message, 'error', 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__visual">
        <div className="auth-page__brand">
          <span className="brand__icon brand__icon--lg">
            <i className="fas fa-microchip" />
          </span>
          <h2>Laboratório de Eletrônica</h2>
          <p>IFCE Campus Maranguape</p>
        </div>
        <div className="auth-page__bullets">
          <span><i className="fas fa-check" /> Publique listas de exercícios</span>
          <span><i className="fas fa-check" /> Corrija e dê notas</span>
          <span><i className="fas fa-check" /> Acompanhe relatórios de desempenho</span>
        </div>
      </div>
      <div className="auth-page__form">
        <Link to="/" className="auth-page__back">
          <i className="fas fa-arrow-left" /> Voltar
        </Link>
        <div className="auth-card">
          <div className="auth-card__icon">
            <i className="fas fa-chalkboard-user" />
          </div>
          <h1>Área do Professor</h1>
          <p className="auth-card__subtitle">Acesse com seu e-mail institucional.</p>

          <form onSubmit={handleSubmit} noValidate>
            <Field label="E-mail" error={errors.email} required>
              <TextInput
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seuemail@ifce.edu.br"
                autoComplete="username"
              />
            </Field>
            <Field label="Senha" error={errors.password} required>
              <div className="password-field">
                <TextInput
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-field__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </Field>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="btn--block">
              Entrar
            </Button>
          </form>

          <div className="auth-card__footer">
            <Link to="/login/aluno">
              Sou estudante <i className="fas fa-arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
