import styled from 'styled-components';
import { Moon, Sun } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardHeader, CardSubtitle, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import useTaxonomy from '../hooks/useTaxonomy';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 720px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
  }

  dt {
    font-weight: 500;
  }

  dd {
    margin: 0;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
`;

const CategoryGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-2);

  li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
`;

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const taxonomy = useTaxonomy();

  return (
    <>
      <PageHeader title="Settings" subtitle="Appearance and application configuration" />

      <Stack>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardSubtitle>Your choice is remembered on this device</CardSubtitle>
            </div>
          </CardHeader>
          <Row>
            <div>
              <dt>Theme</dt>
              <dd>Currently using {theme} mode</dd>
            </div>
            <Button variant="secondary" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              Switch to {theme === 'dark' ? 'light' : 'dark'} mode
            </Button>
          </Row>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Configuration</CardTitle>
              <CardSubtitle>
                Set on the server via environment variables (see backend/.env.example)
              </CardSubtitle>
            </div>
          </CardHeader>
          <Row>
            <div>
              <dt>Currency</dt>
              <dd>Used to format every amount in the app</dd>
            </div>
            <span>{taxonomy.currency}</span>
          </Row>
          <Row>
            <div>
              <dt>Recurrence options</dt>
              <dd>Available frequencies for recurring expenses</dd>
            </div>
            <span>{taxonomy.frequencies.join(', ')}</span>
          </Row>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Expense categories</CardTitle>
              <CardSubtitle>
                Defined once on the server so every screen stays in sync
              </CardSubtitle>
            </div>
          </CardHeader>
          <CategoryGrid>
            {taxonomy.expenseCategories.map((category) => (
              <li key={category.id}>
                <span
                  className="dot"
                  style={{ background: category.color }}
                  aria-hidden="true"
                />
                {category.label}
              </li>
            ))}
          </CategoryGrid>
        </Card>
      </Stack>
    </>
  );
}

export default SettingsPage;
