import { LoginForm } from './login-form';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const lang = await getLang();
  return (
    <>
      <LoginForm lang={lang} />
    </>
  );
}
