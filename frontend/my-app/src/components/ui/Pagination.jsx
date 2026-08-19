import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';
import { Select } from './Field';
import { PAGE_SIZES } from '../../constants';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
  font-size: var(--text-sm);
  color: var(--text-muted);
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const PageSize = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);

  select {
    width: auto;
    height: 32px;
  }
`;

export function Pagination({ meta, page, limit, onPageChange, onLimitChange }) {
  if (!meta) return null;

  const { total, totalPages } = meta;
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <Bar>
      <span aria-live="polite">
        Showing {first}–{last} of {total}
      </span>

      <Controls>
        <PageSize>
          <label htmlFor="page-size">Rows</label>
          <Select
            id="page-size"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </PageSize>

        <Button
          variant="secondary"
          size="sm"
          iconOnly
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </Button>
      </Controls>
    </Bar>
  );
}

export default Pagination;
