import { useMemo } from 'react';
import styled from 'styled-components';
import { Select } from './Field';
import { recentMonthKeys } from '../../utils/dates';
import { formatMonthKey } from '../../utils/format';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);

  select {
    width: auto;
    min-width: 160px;
  }
`;

/** Period selector shared by the dashboard, insights and budget pages. */
export function MonthPicker({ value, onChange, months = 12, label = 'Period' }) {
  const options = useMemo(() => recentMonthKeys(months), [months]);

  return (
    <Wrapper>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {options.map((month) => (
          <option key={month} value={month}>
            {formatMonthKey(month, true)}
          </option>
        ))}
      </Select>
    </Wrapper>
  );
}

export default MonthPicker;
