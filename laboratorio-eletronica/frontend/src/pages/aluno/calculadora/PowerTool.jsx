import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Field, TextInput, Select } from '../../../components/ui/Field';
import CalcResult from './CalcResult';

const MODES = [
  { value: 'VR', label: 'Tensão e resistência', formula: 'P = V² / R' },
  { value: 'IR', label: 'Corrente e resistência', formula: 'P = I² · R' },
  { value: 'VI', label: 'Tensão e corrente', formula: 'P = V · I' }
];

function toBase(value, unit) {
  const n = parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  const f = { V: 1, mV: 1e-3, kV: 1e3, A: 1, kA: 1e3, mA: 1e-3, Ω: 1, kΩ: 1e3, MΩ: 1e6 };
  return n * (f[unit] ?? 1);
}

export function formatPower(watts) {
  if (!Number.isFinite(watts)) return '—';
  const a = Math.abs(watts);
  if (a >= 1e6) return `${(watts / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MW`;
  if (a >= 1e3) return `${(watts / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kW`;
  if (a >= 1) return `${(watts).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} W`;
  if (a >= 1e-3) return `${(watts * 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mW`;
  return `${(watts * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} µW`;
}

export default function PowerTool() {
  const [mode, setMode] = useState('VR');
  const [v, setV] = useState('');
  const [i, setI] = useState('');
  const [r, setR] = useState('');
  const [unitV, setUnitV] = useState('V');
  const [unitI, setUnitI] = useState('A');
  const [unitR, setUnitR] = useState('Ω');

  const result = useMemo(() => {
    const voltage = toBase(v, unitV);
    const current = toBase(i, unitI);
    const resistance = toBase(r, unitR);

    if (mode === 'VR') {
      if (voltage === null || resistance === null || resistance === 0) return null;
      return { value: (voltage * voltage) / resistance, v, i: null, r };
    }
    if (mode === 'IR') {
      if (current === null || resistance === null || resistance === 0) return null;
      return { value: current * current * resistance, v: null, i, r };
    }
    if (voltage === null || current === null) return null;
    return { value: voltage * current, v, i, r };
  }, [mode, v, i, r, unitV, unitI, unitR]);

  const modeObj = MODES.find((m) => m.value === mode);

  return (
    <div className="calc-grid">
      <Card>
        <CardHeader title="Potência" subtitle="Calcule a potência dissipada pelo resistor." />
        <div className="calc-form">
          <Field label="Modo de cálculo">
            <Select value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label} — {m.formula}</option>
              ))}
            </Select>
          </Field>

          {(mode === 'VR' || mode === 'VI') && (
            <div className="form-row">
              <Field label="Tensão (V)" required>
                <TextInput type="number" min="0" step="any" placeholder="Ex.: 12" value={v} onChange={(e) => setV(e.target.value)} />
              </Field>
              <Field label="Unidade">
                <Select value={unitV} onChange={(e) => setUnitV(e.target.value)}>
                  <option value="V">Volt (V)</option>
                  <option value="mV">Milivolt (mV)</option>
                  <option value="kV">Quilovolt (kV)</option>
                </Select>
              </Field>
            </div>
          )}

          {(mode === 'VI' || mode === 'IR') && (
            <div className="form-row">
              <Field label="Corrente (A)" required>
                <TextInput type="number" min="0" step="any" placeholder="Ex.: 0,5" value={i} onChange={(e) => setI(e.target.value)} />
              </Field>
              <Field label="Unidade">
                <Select value={unitI} onChange={(e) => setUnitI(e.target.value)}>
                  <option value="A">Ampère (A)</option>
                  <option value="mA">Miliampère (mA)</option>
                  <option value="kA">Quiloampère (kA)</option>
                </Select>
              </Field>
            </div>
          )}

          {(mode === 'VR' || mode === 'IR') && (
            <div className="form-row">
              <Field label="Resistência (Ω)" required>
                <TextInput type="number" min="0" step="any" placeholder="Ex.: 100" value={r} onChange={(e) => setR(e.target.value)} />
              </Field>
              <Field label="Unidade">
                <Select value={unitR} onChange={(e) => setUnitR(e.target.value)}>
                  <option value="Ω">Ohm (Ω)</option>
                  <option value="kΩ">Quilo-ohm (kΩ)</option>
                  <option value="MΩ">Mega-ohm (MΩ)</option>
                </Select>
              </Field>
            </div>
          )}
        </div>
      </Card>

      <div className="calc-results">
        <Card>
          <CardHeader title="Potência dissipada" subtitle={`Fórmula: ${modeObj.formula}`} />
          {result ? (
            <>
              <CalcResult label="Potência (P)" value={formatPower(result.value)} icon="fa-fire-flame-curved" tone="amber" />
              <p className="calc-formula-note">
                <i className="fas fa-lightbulb" /> A potência indica a quantidade de energia que o resistor transforma em calor. Escolha um resistor com potência nominal maior que o valor calculado.
              </p>
            </>
          ) : (
            <p className="text--center text--muted">Preencha os campos solicitados para calcular a potência.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
