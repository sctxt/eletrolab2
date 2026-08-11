import React from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: 'fa-users',
    title: 'Gestão de Equipes',
    text: 'Crie equipes, convide colegas, aceite convites e acompanhe seus integrantes em um só lugar.'
  },
  {
    icon: 'fa-list-check',
    title: 'Listas de Exercícios',
    text: 'Professores publicam listas com questões objetivas e discursivas, com prazos e correção.'
  },
  {
    icon: 'fa-clipboard-check',
    title: 'Correções e Notas',
    text: 'Entregue suas respostas, receba notas e comentários dos professores diretamente na plataforma.'
  },
  {
    icon: 'fa-bell',
    title: 'Notificações',
    text: 'Fique por dentro de convites, novas listas, prazos e correções com notificações em tempo real.'
  },
  {
    icon: 'fa-chart-line',
    title: 'Relatórios de Desempenho',
    text: 'Professores acompanham médias, taxas de entrega e o desempenho das equipes com gráficos.'
  },
  {
    icon: 'fa-mobile-screen',
    title: 'Acessível em qualquer lugar',
    text: 'Interface responsiva que funciona no computador, no tablet e no celular.'
  }
];

const STEPS = [
  {
    step: '01',
    icon: 'fa-user-plus',
    title: 'Crie sua conta',
    text: 'Estudantes e professores acessam com matrícula ou e-mail e senha segura.'
  },
  {
    step: '02',
    icon: 'fa-people-group',
    title: 'Monte sua equipe',
    text: 'Organize grupos de trabalho, envie convites e acompanhe os integrantes.'
  },
  {
    step: '03',
    icon: 'fa-pen-to-square',
    title: 'Publique e responda listas',
    text: 'Professores criam listas e estudantes respondem dentro do prazo.'
  },
  {
    step: '04',
    icon: 'fa-file-signature',
    title: 'Corrija e acompanhe',
    text: 'Professores corrigem, dão notas e feedback; estudantes acompanham o desempenho.'
  }
];

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="hero__badge">
              <i className="fas fa-microchip" /> Instituto Federal do Ceará · Campus Maranguape
            </span>
            <h1 className="hero__title">Laboratório de Eletrônica</h1>
            <p className="hero__subtitle">
              Gerencie equipes, listas e atividades acadêmicas em um só lugar.
            </p>
            <div className="hero__actions">
              <Link to="/login/aluno" className="btn btn--light btn--lg">
                <i className="fas fa-user-graduate" /> Área do Aluno
              </Link>
              <Link to="/login/professor" className="btn btn--outline-light btn--lg">
                <i className="fas fa-chalkboard-user" /> Área do Professor
              </Link>
            </div>
            <div className="hero__admin-link">
              <Link to="/login/admin">
                <i className="fas fa-user-shield" /> Área do Administrador
              </Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <strong>5+</strong>
                <span>Estudantes</span>
              </div>
              <div className="hero__stat">
                <strong>2+</strong>
                <span>Equipes</span>
              </div>
              <div className="hero__stat">
                <strong>4+</strong>
                <span>Listas</span>
              </div>
              <div className="hero__stat">
                <strong>100%</strong>
                <span>On-line</span>
              </div>
            </div>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <div className="hero__board">
              <div className="hero__board-card hero__board-card--list">
                <div className="hero__board-card-head">
                  <i className="fas fa-list-check" />
                  <span>Listas ativas</span>
                </div>
                <div className="hero__mini-bar"><span style={{ width: '85%' }} /></div>
                <div className="hero__mini-bar"><span style={{ width: '60%' }} /></div>
                <div className="hero__mini-bar"><span style={{ width: '40%' }} /></div>
              </div>
              <div className="hero__board-card hero__board-card--team">
                <div className="hero__board-card-head">
                  <i className="fas fa-users" />
                  <span>Equipe</span>
                </div>
                <div className="hero__avatars">
                  <span className="hero__dot" />
                  <span className="hero__dot" />
                  <span className="hero__dot" />
                  <span className="hero__dot hero__dot--plus">+</span>
                </div>
              </div>
              <div className="hero__board-card hero__board-card--grade">
                <div className="hero__board-card-head">
                  <i className="fas fa-star" />
                  <span>Nota média</span>
                </div>
                <strong className="hero__grade">8,5</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="section section--about">
        <div className="container">
          <div className="section__heading">
            <span className="section__tag">Sobre o laboratório</span>
            <h2 className="section__title">Um espaço dedicado ao aprendizado em eletrônica</h2>
            <p className="section__text">
              O Laboratório de Eletrônica do IFCE Campus Maranguape integra estudantes e professores
              em projetos práticos de circuitos, sistemas embarcados e eletrônica industrial. Esta
              plataforma digitaliza a gestão das atividades, aproximando a sala de aula do laboratório.
            </p>
          </div>
          <div className="about__grid">
            <div className="about__item">
              <i className="fas fa-flask-vial" />
              <h4>Prática de verdade</h4>
              <p>Projetos com componentes reais, montagem de circuitos e experimentação guiada.</p>
            </div>
            <div className="about__item">
              <i className="fas fa-graduation-cap" />
              <h4>Formação técnica</h4>
              <p>Cursos e disciplinas de eletrônica alinhados às demandas da indústria e da academia.</p>
            </div>
            <div className="about__item">
              <i className="fas fa-lightbulb" />
              <h4>Inovação</h4>
              <p>Incentivo a projetos de pesquisa, extensão e competições acadêmicas.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="section section--features">
        <div className="container">
          <div className="section__heading">
            <span className="section__tag">Funcionalidades</span>
            <h2 className="section__title">Tudo o que o laboratório precisa, em um só lugar</h2>
          </div>
          <div className="features__grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-card__icon">
                  <i className={`fas ${f.icon}`} />
                </div>
                <h4>{f.title}</h4>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section section--steps">
        <div className="container">
          <div className="section__heading">
            <span className="section__tag">Como funciona</span>
            <h2 className="section__title">Do cadastro à correção em quatro passos</h2>
          </div>
          <div className="steps__grid">
            {STEPS.map((s) => (
              <div className="step-card" key={s.step}>
                <span className="step-card__number">{s.step}</span>
                <div className="step-card__icon">
                  <i className={`fas ${s.icon}`} />
                </div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cta">
        <div className="container">
          <div className="cta-card">
            <h2>Pronto para começar?</h2>
            <p>Entre com sua conta de estudante ou professor e organize suas atividades.</p>
            <div className="cta-card__actions">
              <Link to="/login/aluno" className="btn btn--light btn--lg">
                <i className="fas fa-user-graduate" /> Área do Aluno
              </Link>
              <Link to="/login/professor" className="btn btn--outline-light btn--lg">
                <i className="fas fa-chalkboard-user" /> Área do Professor
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className="section section--contact">
        <div className="container">
          <div className="contact__grid">
            <div>
              <h3>Informações institucionais</h3>
              <p>Instituto Federal de Educação, Ciência e Tecnologia do Ceará — Campus Maranguape.</p>
            </div>
            <ul className="contact__list">
              <li>
                <i className="fas fa-location-dot" />
                <span>BR-020, KM 15, Maranguape — CE</span>
              </li>
              <li>
                <i className="fas fa-envelope" />
                <span>laboratorio.eletronica@ifce.edu.br</span>
              </li>
              <li>
                <i className="fas fa-phone" />
                <span>(85) 3000-0000</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer__inner">
          <div className="brand brand--light">
            <span className="brand__icon">
              <i className="fas fa-microchip" />
            </span>
            <span className="brand__text">
              Lab<span>Eletrônica</span>
            </span>
          </div>
          <p>© {new Date().getFullYear()} Laboratório de Eletrônica — IFCE Campus Maranguape.</p>
        </div>
      </footer>
    </div>
  );
}
