import { SiteHeader } from '../components/site-header';
import { ResetForm } from './reset-form';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  const lang = await getLang();
  return (
    <>
      <SiteHeader />
      <ResetForm lang={lang} />
    </>
  );
}
