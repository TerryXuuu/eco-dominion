import { HomeBoard } from '../components/home-board';
import { homeDashboard } from '@/lib/home-service';
import { pageActor } from '@/lib/page-actor';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function HomeDashboardPage() {
  const [{ data }, lang] = await Promise.all([
    pageActor((client, userId) => homeDashboard(client, userId)),
    getLang(),
  ]);
  const home = data as Awaited<ReturnType<typeof homeDashboard>>;
  return (
    <>
      <main className="shell stack">
        <HomeBoard lang={lang} home={home} />
      </main>
    </>
  );
}
