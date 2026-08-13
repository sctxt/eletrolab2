import React, { useMemo, useState } from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Field, TextInput, Select } from '../../../components/ui/Field';
import { E_SERIES, E_SERIES_DESC, parseResistanceInput, nearestInSeries, formatResistance } from '../../../utils/resistor';

const UNITS = [
  { value: 'Ω', label: 'Ohm (Ω)' },
  { value: 'kΩ', label: 'Quilo-ohm (kΩ)' },
  { value: 'MΩ', label: 'Mega-ohm (MΩ)' }
];

const SERIES_ORDER = ['E12', 'E24', 'E96'];

export default function ESeriesTool() {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('Ω');

  const ohms = useMemo(() => parseResistanceInput(value, unit), [value, unit]);

  const results = useMemo(() => {
    if (ohms === null || ohms === 0) return null;
    return SERIES_ORDER.map((name) => ({
      name,
      ...nearestInSeries(ohms, E_SERIES[name])
    }));
  }, [ohms]);

  return (
    <div className="calc-grid">
      <Card>
        <CardHeader
          title="Séries E12 / E24 / E96"
          subtitle="Informe um valor e encontre os valores comerciais mais próximos em cada série."
        />
        <div className="calc-form">
          <div className="form-row">
            <Field label="Valor desejado" required>
              <TextInput
                type="number"
                min="0"
                step="any"
                placeholder="Ex.: 4700"
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
          <p className="field__hint">
            Os valores comerciais (séries E) são padronizados. A série E96 tem mais valores por década e, por isso, fica mais próxima do valor desejado.
          </p>
        </div>
      </Card>

      <div className="calc-results">
        <Card>
          <CardHeader title="Valores comerciais mais próximos" subtitle="Comparativo entre as séries." />
          {results ? (
            <div className="e-series-results">
              {results.map((res) => (
                <div key={res.name} className={`e-series-card e-series-card--${res.name.toLowerCase()}`}>
                  <div className="e-series-card__head">
                    <strong>{res.name}</strong>
                    <span>{E_SERIES_DESC[res.name]}</span>
                  </div>
                  <div className="e-series-card__value">
                    <span>Mais próximo</span>
                    <strong>{formatResistance(res.value)}</strong>
                    {res.exact && <em className="e-series-card__exact"><i className="fas fa-check" /> exato</em>}
                  </div>
                  <div className="e-series-card__range">
                    <span><i className="fas fa-arrow-down" /> {formatResistance(res.lower)}</span>
                    <span><i className="fas fa-arrow-up" /> {formatResistance(res.higher)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text--center text--muted">Informe um valor maior que zero para comparar as séries.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
