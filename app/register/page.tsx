import { SiteHeader } from '../components/site-header';
import { RegisterForm } from './register-form';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <RegisterForm />
    </>
  );
}
