import styled from 'styled-components';
import { Pencil, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { CategoryBadge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/States';
import { formatCurrency, formatDate } from '../../utils/format';

const Wrapper = styled.div`
  /* The table scrolls inside its own container so the page never scrolls
     sideways on a narrow screen. */
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
  min-width: 720px;

  th,
  td {
    padding: var(--space-3) var(--space-4);
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  th {
    font-weight: 500;
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-subtle);
    background: var(--surface-2);
    position: sticky;
    top: 0;
  }

  tbody tr:hover {
    background: var(--surface-hover);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  .numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    white-space: nowrap;
  }

  .actions {
    text-align: right;
    white-space: nowrap;
  }
`;

const Title = styled.div`
  font-weight: 500;
  color: var(--text);
`;

const Note = styled.div`
  color: var(--text-subtle);
  font-size: var(--text-xs);
  margin-top: 2px;
  max-width: 32ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionGroup = styled.div`
  display: inline-flex;
  gap: var(--space-1);
`;

/* --- Mobile card list --------------------------------------------------- */

const Cards = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const CardItem = styled.li`
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .amount {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
`;

const Desktop = styled.div`
  @media (max-width: 760px) {
    display: none;
  }
`;

const Mobile = styled.div`
  display: none;

  @media (max-width: 760px) {
    display: block;
  }
`;

const COLUMNS = ['Date', 'Description', 'Category', 'Payment', 'Amount', ''];

function SkeletonRows({ rows = 6 }) {
  return Array.from({ length: rows }, (_, index) => (
    <tr key={index}>
      {COLUMNS.map((column, columnIndex) => (
        <td key={column || columnIndex}>
          <Skeleton $height="14px" $width={columnIndex === 1 ? '70%' : '50%'} />
        </td>
      ))}
    </tr>
  ));
}

/**
 * Renders a page of transactions as a table on desktop and as cards on mobile,
 * so a narrow screen stays readable instead of overflowing horizontally.
 */
export function TransactionTable({
  items,
  loading,
  currency,
  categoryMap,
  paymentMethodMap,
  onEdit,
  onDelete,
  amountPrefix = '',
}) {
  const describe = (item) => ({
    category: categoryMap.get(item.category) ?? { label: item.category, color: null },
    payment: paymentMethodMap.get(item.paymentMethod)?.label ?? '—',
  });

  return (
    <Wrapper>
      <Desktop>
        <Table>
          <thead>
            <tr>
              {COLUMNS.map((column, index) => (
                <th
                  key={column || index}
                  className={column === 'Amount' ? 'numeric' : undefined}
                  scope="col"
                >
                  {column || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : (
              items.map((item) => {
                const { category, payment } = describe(item);
                return (
                  <tr key={item._id}>
                    <td>{formatDate(item.date)}</td>
                    <td>
                      <Title>{item.title}</Title>
                      {item.description ? <Note>{item.description}</Note> : null}
                    </td>
                    <td>
                      <CategoryBadge color={category.color} label={category.label} />
                    </td>
                    <td>{payment}</td>
                    <td className="numeric">
                      {amountPrefix}
                      {formatCurrency(item.amount, currency)}
                    </td>
                    <td className="actions">
                      <ActionGroup>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() => onEdit(item)}
                          aria-label={`Edit ${item.title}`}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          onClick={() => onDelete(item)}
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </ActionGroup>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Desktop>

      <Mobile>
        {loading ? (
          <Cards>
            {Array.from({ length: 4 }, (_, index) => (
              <CardItem key={index}>
                <Skeleton $height="16px" $width="60%" />
                <Skeleton $height="12px" $width="40%" />
              </CardItem>
            ))}
          </Cards>
        ) : (
          <Cards>
            {items.map((item) => {
              const { category, payment } = describe(item);
              return (
                <CardItem key={item._id}>
                  <header>
                    <div>
                      <Title>{item.title}</Title>
                      {item.description ? <Note>{item.description}</Note> : null}
                    </div>
                    <span className="amount">
                      {amountPrefix}
                      {formatCurrency(item.amount, currency)}
                    </span>
                  </header>
                  <footer>
                    <span>
                      {formatDate(item.date)} · {payment}
                    </span>
                    <CategoryBadge color={category.color} label={category.label} />
                  </footer>
                  <ActionGroup>
                    <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
                      <Pencil size={14} /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
                      <Trash2 size={14} /> Delete
                    </Button>
                  </ActionGroup>
                </CardItem>
              );
            })}
          </Cards>
        )}
      </Mobile>
    </Wrapper>
  );
}

export default TransactionTable;
