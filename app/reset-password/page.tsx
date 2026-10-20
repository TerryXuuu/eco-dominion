import { SiteHeader } from '../components/site-header';
import { ResetForm } from './reset-form';

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <ResetForm />
    </>
  );
}
