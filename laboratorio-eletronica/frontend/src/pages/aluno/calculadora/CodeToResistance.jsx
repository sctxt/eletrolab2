import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Field, Select } from '../../../components/ui/Field';
import { DIGIT_COLORS, MULTIPLIER_COLORS, TOLERANCES, codeToResistance, formatResistance } from '../../../utils/resistor';
import ResistorVisual, { BandLegend } from './ResistorVisual';
import CalcResult from './CalcResult';

export default function CodeToResistance() {
  const [bandCount, setBandCount] = useState('4');
  const [b1, setB1] = useState('1');
  const [b2, setB2] = useState('0');
  const [b3, setB3] = useState('0');
  const [mult, setMult] = useState('100');
  const [tol, setTol] = useState('0.05');

  const digits = bandCount === '5' ? [b1, b2, b3] : [b1, b2];

  const result = useMemo(() => {
    const digitVals = digits.map((d) => Number(d));
    const multVal = Number(mult);
    const tolVal = Number(tol);
    const { ohms, min, max } = codeToResistance(digitVals, multVal, tolVal);
    return { ohms, min, max };
  }, [digits, mult, tol]);

  const digitBand = (value) => {
    const c = DIGIT_COLORS.find((d) => String(d.value) === value);
    return { color: c.color, label: `${c.label} (${c.value})` };
  };

  const multBand = MULTIPLIER_COLORS.find((m) => String(m.value) === mult);
  const tolBand = TOLERANCES.find((t) => String(t.value) === tol);

  const bands = useMemo(() => {
    const list = digits.map((d) => digitBand(d));
    list.push({ color: multBand.color, label: `Multiplicador — ${multBand.label}` });
    list.push({ color: tolBand.color, label: `Tolerância — ${tolBand.label}` });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits, mult, tol]);

  return (
    <div className="calc-grid">
      <Card>
        <CardHeader
          title="Código de cores"
          subtitle="Selecione as cores das faixas para descobrir a resistência."
        />
        <div className="calc-form">
          <Field label="Quantidade de faixas">
            <Select value={bandCount} onChange={(e) => setBandCount(e.target.value)}>
              <option value="4">4 faixas</option>
              <option value="5">5 faixas</option>
            </Select>
          </Field>
          <div className="form-row">
            <Field label="1ª faixa (dígito)" required>
              <Select value={b1} onChange={(e) => setB1(e.target.value)}>
                {DIGIT_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label} — {c.value}</option>
                ))}
              </Select>
            </Field>
            <Field label="2ª faixa (dígito)" required>
              <Select value={b2} onChange={(e) => setB2(e.target.value)}>
                {DIGIT_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label} — {c.value}</option>
                ))}
              </Select>
            </Field>
          </div>
          {bandCount === '5' && (
            <Field label="3ª faixa (dígito)" required>
              <Select value={b3} onChange={(e) => setB3(e.target.value)}>
                {DIGIT_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label} — {c.value}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Multiplicador" required>
            <Select value={mult} onChange={(e) => setMult(e.target.value)}>
              {MULTIPLIER_COLORS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tolerância" required>
            <Select value={tol} onChange={(e) => setTol(e.target.value)}>
              {TOLERANCES.map((t) => (
                <option key={t.label} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <div className="calc-results">
        <Card>
          <CardHeader title="Resultado" subtitle="Faixas selecionadas e resistência equivalente." />
          <ResistorVisual bands={bands} />
          <BandLegend items={bands} />
          <div className="calc-results__row">
            <CalcResult label="Resistência" value={formatResistance(result.ohms)} icon="fa-bolt" />
            <CalcResult label="Tolerância" value={TOLERANCES.find((t) => t.value === Number(tol)).label} icon="fa-ruler" tone="amber" />
          </div>
          <div className="calc-results__row">
            <CalcResult label="Valor mínimo" value={formatResistance(result.min)} icon="fa-arrow-down" tone="gray" />
            <CalcResult label="Valor máximo" value={formatResistance(result.max)} icon="fa-arrow-up" tone="gray" />
          </div>
        </Card>
      </div>
    </div>
  );
}
