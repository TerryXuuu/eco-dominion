import { SiteHeader } from '../components/site-header';
import { RecoverForm } from './recover-form';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';

export default async function RecoverPage() {
  const lang = await getLang();
  return (
    <>
      <SiteHeader />
      <RecoverForm lang={lang} />
    </>
  );
}
