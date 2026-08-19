import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { EmptyState } from '../components/ui/States';

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That page does not exist. It may have been moved or the link may be wrong."
        action={
          <Button as={Link} to="/">
            Back to dashboard
          </Button>
        }
      />
    </Card>
  );
}

export default NotFoundPage;
