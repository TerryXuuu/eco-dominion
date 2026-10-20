import { SiteHeader } from '../components/site-header';
import { RecoverForm } from './recover-form';

export const dynamic = 'force-dynamic';

export default function RecoverPage() {
  return (
    <>
      <SiteHeader />
      <RecoverForm />
    </>
  );
}
