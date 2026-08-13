import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Field, TextInput, Select } from '../../../components/ui/Field';
import { TOLERANCES, resistanceToColors, parseResistanceInput, formatResistance } from '../../../utils/resistor';
import ResistorVisual, { BandLegend } from './ResistorVisual';
import CalcResult from './CalcResult';

const UNITS = [
  { value: 'Ω', label: 'Ohm (Ω)' },
  { value: 'kΩ', label: 'Quilo-ohm (kΩ)' },
  { value: 'MΩ', label: 'Mega-ohm (MΩ)' }
];

export default function ResistanceToCode() {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('Ω');
  const [bandCount, setBandCount] = useState('4');
  const [tol, setTol] = useState('0.05');

  const ohms = useMemo(() => parseResistanceInput(value, unit), [value, unit]);

  const result = useMemo(() => {
    if (ohms === null || ohms === 0) return null;
    return resistanceToColors(ohms, bandCount === '5' ? 5 : 4);
  }, [ohms, bandCount]);

  const tolBand = TOLERANCES.find((t) => String(t.value) === tol);

  const bands = useMemo(() => {
    if (!result || result.outOfRange) return [];
    const digitStr = String(result.digits).padStart(bandCount === '5' ? 3 : 2, '0');
    const list = result.digitColors.map((color, i) => ({
      color,
      label: `${i + 1}ª faixa — dígito ${digitStr[i]}`
    }));
    list.push({ color: result.multiplierColor.color, label: `Multiplicador — ${result.multiplierColor.label}` });
    list.push({ color: tolBand.color, label: `Tolerância — ${tolBand.label}` });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, bandCount, tol]);

  return (
    <div className="calc-grid">
      <Card>
        <CardHeader
          title="Resistência → código de cores"
          subtitle="Informe o valor da resistência e veja as cores das faixas."
        />
        <div className="calc-form">
          <div className="form-row">
            <Field label="Valor da resistência" required>
              <TextInput
                type="number"
                min="0"
                step="any"
                placeholder="Ex.: 4700 ou 4,7"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
            <Field label="Unidade" required>
              <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="form-row">
            <Field label="Quantidade de faixas">
              <Select value={bandCount} onChange={(e) => setBandCount(e.target.value)}>
                <option value="4">4 faixas</option>
                <option value="5">5 faixas</option>
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
        </div>
      </Card>

      <div className="calc-results">
        <Card>
          <CardHeader title="Código de cores" subtitle="Faixas equivalentes ao valor informado." />
          {result && !result.outOfRange ? (
            <>
              <ResistorVisual bands={bands} />
              <BandLegend items={bands} />
              <CalcResult
                label="Valor lido"
                value={formatResistance(result.value)}
                hint={!result.exact ? `Aproximação para ${bandCount === '5' ? '5' : '4'} faixas (valor exato: ${formatResistance(ohms)}).` : null}
                icon="fa-bolt"
              />
              <CalcResult label="Tolerância" value={tolBand.label} icon="fa-ruler" tone="amber" />
            </>
          ) : result?.outOfRange ? (
            <p className="text--center text--danger">
              <i className="fas fa-circle-exclamation" /> Valor fora da faixa representável com {bandCount === '5' ? '5' : '4'} faixas (use mais faixas ou ajuste o valor).
            </p>
          ) : (
            <p className="text--center text--muted">Informe um valor maior que zero para ver as cores.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
