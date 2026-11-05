import { SiteHeader } from '../components/site-header';
import { LoginForm } from './login-form';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const lang = await getLang();
  return (
    <>
      <SiteHeader />
      <LoginForm lang={lang} />
    </>
  );
}
