import TransactionsPage from '../features/transactions/TransactionsPage';

export function IncomesPage() {
  return (
    <TransactionsPage
      kind="income"
      title="Income"
      subtitle="Everything coming in, so your balance stays accurate"
    />
  );
}

export default IncomesPage;
