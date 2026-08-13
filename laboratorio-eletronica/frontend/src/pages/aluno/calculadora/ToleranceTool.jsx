import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Field, TextInput, Select } from '../../../components/ui/Field';
import { TOLERANCES, parseResistanceInput, formatResistance } from '../../../utils/resistor';
import ResistorVisual, { BandLegend } from './ResistorVisual';
import CalcResult from './CalcResult';

const UNITS = [
  { value: 'Ω', label: 'Ohm (Ω)' },
  { value: 'kΩ', label: 'Quilo-ohm (kΩ)' },
  { value: 'MΩ', label: 'Mega-ohm (MΩ)' }
];

const TOL_INFO = {
  '0.001': 'Precisão de alta qualidade, usada em instrumentação e circuitos de precisão.',
  '0.0025': 'Alta precisão, comum em equipamentos de medição.',
  '0.005': 'Boa precisão, usada em aplicações que exigem estabilidade.',
  '0.01': 'Precisão de 1%, típica da série E96.',
  '0.02': 'Precisão de 2%, comum na série E24 com exigência moderada.',
  '0.05': 'Tolerância padrão de 5%, típica das séries E12 e E24.',
  '0.1': 'Tolerância de 10%, comum na série E12.',
  '0.2': 'Sem faixa de tolerância (sem cor), comum em resistores antigos.',
};

export default function ToleranceTool() {
  const [tol, setTol] = useState('0.05');
  const [nominal, setNominal] = useState('');
  const [unit, setUnit] = useState('Ω');

  const tolObj = TOLERANCES.find((t) => String(t.value) === tol);
  const ohms = useMemo(() => parseResistanceInput(nominal, unit), [nominal, unit]);

  const range = useMemo(() => {
    if (ohms === null || ohms === 0) return null;
    return { min: ohms * (1 - tolObj.value), max: ohms * (1 + tolObj.value) };
  }, [ohms, tolObj]);

  return (
    <div className="calc-grid">
      <Card>
        <CardHeader
          title="Tolerância"
          subtitle="Selecione e visualize as diferentes tolerâncias e sua faixa de variação."
        />
        <div className="calc-form">
          <Field label="Tolerância" required>
            <Select value={tol} onChange={(e) => setTol(e.target.value)}>
              {TOLERANCES.map((t) => (
                <option key={t.label} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <div className="form-row">
            <Field label="Valor nominal (opcional)" hint="Informe um valor para ver a faixa aceitável.">
              <TextInput
                type="number"
                min="0"
                step="any"
                placeholder="Ex.: 4700"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
              />
            </Field>
            <Field label="Unidade">
              <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="calc-tol-preview">
            <span
              className="calc-tol-preview__band"
              style={tolObj.color !== 'transparent' ? { background: tolObj.color } : undefined}
            />
            <div>
              <strong>{tolObj.label}</strong>
              <p>{TOL_INFO[tol]}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="calc-results">
        <Card>
          <CardHeader title="Faixa de tolerância" subtitle="O que o valor informado pode variar." />
          <ResistorVisual bands={[{ color: tolObj.color, label: tolObj.label }]} />
          <BandLegend items={[{ color: tolObj.color, label: `Faixa de tolerância — ${tolObj.label}` }]} />
          {range ? (
            <div className="calc-results__row">
              <CalcResult label="Valor mínimo" value={formatResistance(range.min)} icon="fa-arrow-down" tone="gray" />
              <CalcResult label="Valor nominal" value={formatResistance(ohms)} icon="fa-bullseye" />
              <CalcResult label="Valor máximo" value={formatResistance(range.max)} icon="fa-arrow-up" tone="gray" />
            </div>
          ) : (
            <p className="text--center text--muted">Informe um valor nominal para calcular a faixa de variação.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
