import TransactionsPage from '../features/transactions/TransactionsPage';

export function ExpensesPage() {
  return (
    <TransactionsPage
      kind="expense"
      title="Expenses"
      subtitle="Search, filter and manage everything you have spent"
      allowExport
    />
  );
}

export default ExpensesPage;
