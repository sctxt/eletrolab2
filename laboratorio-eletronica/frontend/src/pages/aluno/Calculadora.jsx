import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/Page';import CodeToResistance from './calculadora/CodeToResistance';
import ResistanceToCode from './calculadora/ResistanceToCode';
import ToleranceTool from './calculadora/ToleranceTool';
import PowerTool from './calculadora/PowerTool';
import ESeriesTool from './calculadora/ESeriesTool';
import EquivalentTool from './calculadora/EquivalentTool';
import OhmTool from './calculadora/OhmTool';

const TABS = [
  { key: 'code2r', label: 'Cores → Valor', component: <CodeToResistance /> },
  { key: 'r2code', label: 'Valor → Cores', component: <ResistanceToCode /> },
  { key: 'tolerance', label: 'Tolerância', component: <ToleranceTool /> },
  { key: 'power', label: 'Potência', component: <PowerTool /> },
  { key: 'eseries', label: 'Séries E', component: <ESeriesTool /> },
  { key: 'series', label: 'Série', component: <EquivalentTool mode="series" /> },
  { key: 'parallel', label: 'Paralelo', component: <EquivalentTool mode="parallel" /> },
  { key: 'ohm', label: 'Lei de Ohm', component: <OhmTool /> }
];

export default function Calculadora() {
  const [active, setActive] = useState('code2r');
  const current = TABS.find((t) => t.key === active) || TABS[0];

  return (
    <div>
      <PageHeader
        title="Calculadora de Resistores"
        subtitle="Ferramentas para consultar o código de cores, séries comerciais, associações e a Lei de Ohm."
        icon="fa-calculator"
      />

      <div className="filter-bar calc-tabs" role="tablist" aria-label="Ferramentas da calculadora">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            className={`filter-chip ${active === tab.key ? 'filter-chip--active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="calc-tab-panel" role="tabpanel">
        {current.component}
      </div>
    </div>
  );
}
