import { HomeBoard } from '../components/home-board';
import { SiteHeader } from '../components/site-header';
import { homeDashboard } from '@/lib/home-service';
import { pageActor } from '@/lib/page-actor';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function HomeDashboardPage() {
  const { data } = await pageActor((client, userId) => homeDashboard(client, userId));
  const home = data as Awaited<ReturnType<typeof homeDashboard>>;
  const lang = await getLang();
  return (
    <>
      <SiteHeader />
      <main className="shell stack">
        <HomeBoard lang={lang} home={home} />
      </main>
    </>
  );
}
