import { SiteHeader } from '../components/site-header';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <LoginForm />
    </>
  );
}
