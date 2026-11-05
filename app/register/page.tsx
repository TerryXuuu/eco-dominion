import { SiteHeader } from '../components/site-header';
import { RegisterForm } from './register-form';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const lang = await getLang();
  return (
    <>
      <SiteHeader />
      <RegisterForm lang={lang} />
    </>
  );
}
