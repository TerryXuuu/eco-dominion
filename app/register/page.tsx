import { RegisterForm } from './register-form';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const lang = await getLang();
  return (
    <>
      <RegisterForm lang={lang} />
    </>
  );
}
