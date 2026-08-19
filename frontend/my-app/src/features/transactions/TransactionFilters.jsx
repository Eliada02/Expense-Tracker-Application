import styled from 'styled-components';
import { Search, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { SORT_OPTIONS } from '../../constants';

const Bar = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 2fr) repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  align-items: center;

  @media (max-width: 760px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: var(--space-3);
    color: var(--text-subtle);
    pointer-events: none;
  }

  input {
    padding-left: 38px;
  }

  @media (max-width: 760px) {
    grid-column: 1 / -1;
  }
`;

const ClearWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
`;

/**
 * Filter bar for the transaction pages. It is fully controlled: the page owns
 * the filter state and turns it into the query key, so filtering and caching
 * never disagree.
 */
export function TransactionFilters({
  filters,
  onChange,
  onReset,
  categories,
  paymentMethods,
  months,
  showPaymentMethod = true,
  sort,
  onSortChange,
}) {
  const update = (name) => (event) => onChange({ ...filters, [name]: event.target.value });

  const isDirty = Object.entries(filters).some(([, value]) => value !== '');

  return (
    <Bar>
      <SearchWrapper>
        <Search size={16} aria-hidden="true" />
        <Input
          type="search"
          value={filters.search}
          onChange={update('search')}
          placeholder="Search title or notes"
          aria-label="Search transactions"
        />
      </SearchWrapper>

      <Select value={filters.month} onChange={update('month')} aria-label="Filter by month">
        <option value="">All months</option>
        {months.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </Select>

      <Select
        value={filters.category}
        onChange={update('category')}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </Select>

      {showPaymentMethod ? (
        <Select
          value={filters.paymentMethod}
          onChange={update('paymentMethod')}
          aria-label="Filter by payment method"
        >
          <option value="">All payment methods</option>
          {paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.label}
            </option>
          ))}
        </Select>
      ) : null}

      <Select value={sort} onChange={onSortChange} aria-label="Sort transactions">
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {isDirty ? (
        <ClearWrapper>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X size={15} aria-hidden="true" />
            Clear filters
          </Button>
        </ClearWrapper>
      ) : null}
    </Bar>
  );
}

export default TransactionFilters;
