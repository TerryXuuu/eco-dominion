import Link from 'next/link';
import { SiteHeader } from '../components/site-header';
import { adminOverview } from '@/lib/admin-service';
import { pageActor } from '@/lib/page-actor';
import { siteCopy } from '../components/site-footer';
import { AdminConsole } from './admin-client';
import { getLang } from '@/lib/lang';
import { say } from '@/lib/locale-text';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AdminPage() {
  const [{ email, data }, lang] = await Promise.all([pageActor(async (client, userId) => {
    const overview = await adminOverview(client, userId);
    return overview.status === 200 ? overview.body : null;
  }), getLang()]);
  if (!data) {
    return (
      <>
        <SiteHeader email={email} />
        <main className="shell stack">
          <h1>{say(lang, 'Admin console', '管理后台')}</h1>
          <p className="note">{say(lang, `Signed in as ${email}. This account is not an admin, so the console stays closed. Log out, then sign in with an admin account.`, `当前登录为 ${email}。这个账号不是管理员，后台保持关闭。请退出后用管理员账号登录。`)}</p>
          <p><Link href="/moderation">{say(lang, 'Moderation', '审核')}</Link>{say(lang, ' is the report queue. It hides or restores reported posts and comments. It does not manage ratings, matches, or role grants.', '是举报队列。它可以隐藏或恢复被举报的帖子和评论，不管理积分、对局或角色授予。')}</p>
        </main>
      </>
    );
  }
  return (
    <>
      <SiteHeader email={email} />
      <main className="shell wide stack">
        <h1>{say(lang, 'Admin console', '管理后台')}</h1>
        <p className="note">
          {say(lang, 'Accounts, role grants, casual ratings and match records. Moderators still use the moderation queue for reported posts and comments. Admin, player, and guest are the account roles. A guest can read and cannot play or post. You cannot remove your own admin role or suspend yourself.', '账号、角色授予、休闲积分和对局记录。版主仍用审核队列处理被举报的帖子和评论。管理员、玩家和访客是账号角色。访客可以阅读，不能对局或发帖。你不能移除自己的管理员角色，也不能封禁自己。')}
        </p>
        <AdminConsole lang={lang} initial={data} footer={await siteCopy()} />
      </main>
    </>
  );
}
