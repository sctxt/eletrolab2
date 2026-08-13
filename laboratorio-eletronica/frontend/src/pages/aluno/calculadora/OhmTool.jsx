import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Field, TextInput, Select } from '../../../components/ui/Field';
import { formatResistance } from '../../../utils/resistor';
import CalcResult from './CalcResult';
import { formatPower } from './PowerTool';

function toBase(value, unit) {
  const n = parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  const f = { V: 1, mV: 1e-3, kV: 1e3, A: 1, kA: 1e3, mA: 1e-3, Ω: 1, kΩ: 1e3, MΩ: 1e6 };
  return n * (f[unit] ?? 1);
}

function parseField(value, unit) {
  const trimmed = String(value).trim();
  if (trimmed === '') return { filled: false, base: null };
  const base = toBase(trimmed, unit);
  return { filled: true, base };
}

function formatVoltage(v) {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e3) return `${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kV`;
  if (a >= 1) return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} V`;
  return `${(v * 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mV`;
}

function formatCurrent(a) {
  if (!Number.isFinite(a)) return '—';
  const abs = Math.abs(a);
  if (abs >= 1e3) return `${(a / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kA`;
  if (abs >= 1) return `${a.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} A`;
  return `${(a * 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mA`;
}

export default function OhmTool() {
  const [v, setV] = useState('');
  const [i, setI] = useState('');
  const [r, setR] = useState('');
  const [unitV, setUnitV] = useState('V');
  const [unitI, setUnitI] = useState('A');
  const [unitR, setUnitR] = useState('Ω');

  const analysis = useMemo(() => {
    const V = parseField(v, unitV);
    const I = parseField(i, unitI);
    const R = parseField(r, unitR);
    const filled = [V.filled, I.filled, R.filled].filter(Boolean).length;

    if (filled < 2) return { status: 'incomplete', V, I, R };
    if (filled === 3) {
      const okV = Math.abs(V.base - I.base * R.base) < 1e-9;
      return { status: 'complete', V, I, R, consistent: okV };
    }

    if (!V.filled) {
      if (I.base === 0 || R.base === 0) return { status: 'error', V, I, R, message: 'Não é possível calcular com corrente ou resistência zero.' };
      const voltage = I.base * R.base;
      return { status: 'result', V: { ...V, computed: true, value: voltage }, I, R, power: voltage * I.base };
    }
    if (!I.filled) {
      if (R.base === 0) return { status: 'error', V, I, R, message: 'Resistência zero indica curto-circuito — corrente tende ao infinito.' };
      const current = V.base / R.base;
      return { status: 'result', V, I: { ...I, computed: true, value: current }, R, power: V.base * current };
    }
    if (!R.filled) {
      if (I.base === 0) return { status: 'error', V, I, R, message: 'Corrente zero indica circuito aberto — resistência tende ao infinito.' };
      const resistance = V.base / I.base;
      return { status: 'result', V, I, R: { ...R, computed: true, value: resistance }, power: V.base * I.base };
    }
    return { status: 'incomplete', V, I, R };
  }, [v, i, r, unitV, unitI, unitR]);

  return (
    <div className="calc-grid">
      <Card>
        <CardHeader
          title="Lei de Ohm"
          subtitle="Informe dois valores (tensão, corrente ou resistência) e o terceiro é calculado automaticamente. V = I · R"
        />
        <div className="calc-form">
          <div className="form-row">
            <Field label="Tensão (V)" hint="Deixe em branco para calcular">
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
          <div className="form-row">
            <Field label="Corrente (A)" hint="Deixe em branco para calcular">
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
          <div className="form-row">
            <Field label="Resistência (Ω)" hint="Deixe em branco para calcular">
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
        </div>
      </Card>

      <div className="calc-results">
        <Card>
          <CardHeader title="Resultado" subtitle="Grandezas calculadas automaticamente." />
          {analysis.status === 'incomplete' && (
            <p className="text--center text--muted">
              Preencha duas das três grandezas (tensão, corrente ou resistência).
            </p>
          )}
          {analysis.status === 'error' && (
            <p className="text--center text--danger">
              <i className="fas fa-circle-exclamation" /> {analysis.message}
            </p>
          )}
          {analysis.status === 'complete' && (
            <p className={`text--center ${analysis.consistent ? 'text--success' : 'text--danger'}`}>
              <i className={`fas ${analysis.consistent ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
              {analysis.consistent ? 'Os três valores são consistentes com a Lei de Ohm.' : 'Os três valores informados não satisfazem V = I · R.'}
            </p>
          )}
          {analysis.status === 'result' && (
            <>
              <div className="calc-results__row">
                <CalcResult
                  label="Tensão (V)"
                  value={analysis.V.computed ? formatVoltage(analysis.V.value) : formatVoltage(analysis.V.base)}
                  icon="fa-bolt"
                  tone={analysis.V.computed ? 'green' : 'gray'}
                />
                <CalcResult
                  label="Corrente (A)"
                  value={analysis.I.computed ? formatCurrent(analysis.I.value) : formatCurrent(analysis.I.base)}
                  icon="fa-wave-square"
                  tone={analysis.I.computed ? 'green' : 'gray'}
                />
              </div>
              <div className="calc-results__row">
                <CalcResult
                  label="Resistência (Ω)"
                  value={analysis.R.computed ? formatResistance(analysis.R.value) : formatResistance(analysis.R.base)}
                  icon="fa-bezier-curve"
                  tone={analysis.R.computed ? 'green' : 'gray'}
                />
                <CalcResult label="Potência" value={formatPower(analysis.power)} icon="fa-fire-flame-curved" tone="amber" />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
