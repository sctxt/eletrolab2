import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Field, TextInput, Select } from '../../../components/ui/Field';
import { Button } from '../../../components/ui/Button';
import { parseResistanceInput, formatResistance } from '../../../utils/resistor';
import CalcResult from './CalcResult';

const UNITS = [
  { value: 'Ω', label: 'Ohm (Ω)' },
  { value: 'kΩ', label: 'Quilo-ohm (kΩ)' },
  { value: 'MΩ', label: 'Mega-ohm (MΩ)' }
];

const QUICK = [100, 220, 330, 470, 1000, 4700, 10000, 47000];

export default function EquivalentTool({ mode }) {
  const isSeries = mode === 'series';
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('Ω');
  const [error, setError] = useState('');
  const [resistors, setResistors] = useState([]);

  const addResistor = (ohms) => {
    setResistors((prev) => [...prev, ohms]);
  };

  const handleAdd = () => {
    const ohms = parseResistanceInput(value, unit);
    if (ohms === null || ohms === 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    setError('');
    addResistor(ohms);
    setValue('');
  };

  const handleQuick = (ohms) => {
    setError('');
    addResistor(ohms);
  };

  const removeResistor = (index) => {
    setResistors((prev) => prev.filter((_, i) => i !== index));
  };

  const clear = () => {
    setResistors([]);
  };

  const result = useMemo(() => {
    if (resistors.length === 0) return null;
    if (isSeries) {
      return { value: resistors.reduce((acc, r) => acc + r, 0) };
    }
    if (resistors.some((r) => r === 0)) return { infinite: true };
    const inv = resistors.reduce((acc, r) => acc + 1 / r, 0);
    return { value: 1 / inv };
  }, [resistors, isSeries]);

  return (
    <div className="calc-grid">
      <Card>
        <CardHeader
          title={isSeries ? 'Resistores em série' : 'Resistores em paralelo'}
          subtitle={
            isSeries
              ? 'Some vários resistores conectados em série (um após o outro).'
              : 'Associe vários resistores em paralelo (entre os mesmos dois pontos).'
          }
        />
        <div className="calc-form">
          <div className="form-row">
            <Field label="Valor do resistor" error={error}>
              <TextInput
                type="number"
                min="0"
                step="any"
                placeholder="Ex.: 470"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
          <div className="form-actions">
            <Button variant="primary" onClick={handleAdd}>
              <i className="fas fa-plus" /> Adicionar resistor
            </Button>
            {resistors.length > 0 && (
              <Button variant="ghost" onClick={clear}>
                <i className="fas fa-broom" /> Limpar
              </Button>
            )}
          </div>
          <div className="quick-add">
            <span className="quick-add__label">Adição rápida:</span>
            {QUICK.map((q) => (
              <button key={q} className="quick-add__chip" onClick={() => handleQuick(q)}>
                {formatResistance(q)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="calc-results">
        <Card>
          <CardHeader
            title={isSeries ? 'Associação em série' : 'Associação em paralelo'}
            subtitle={`${resistors.length} resistor(es) adicionado(s)`}
          />
          {resistors.length === 0 ? (
            <p className="text--center text--muted">Adicione ao menos um resistor para calcular a resistência equivalente.</p>
          ) : (
            <>
              <ul className="resistor-list">
                {resistors.map((r, i) => (
                  <li key={i} className="resistor-list__item">
                    <span className="resistor-list__index">R{i + 1}</span>
                    <strong>{formatResistance(r)}</strong>
                    <button
                      className="icon-btn"
                      title="Remover resistor"
                      onClick={() => removeResistor(i)}
                    >
                      <i className="fas fa-xmark" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="calc-results__row">
                <CalcResult
                  label={isSeries ? 'Resistência equivalente' : 'Resistência equivalente'}
                  value={result.infinite ? '0 Ω (curto-circuito)' : formatResistance(result.value)}
                  icon={isSeries ? 'fa-plus' : 'fa-sitemap'}
                />
              </div>
              <p className="calc-formula-note">
                <i className="fas fa-lightbulb" />{' '}
                {isSeries
                  ? 'Em série, a resistência equivalente é a soma das resistências e sempre é maior que a maior delas.'
                  : 'Em paralelo, a resistência equivalente é sempre menor que a menor resistência do conjunto.'}
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
