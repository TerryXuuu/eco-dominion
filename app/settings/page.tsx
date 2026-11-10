import { redirect } from 'next/navigation';
import { ProfileForm } from '../profile/profile-form';
import { signOut } from '../profile/actions';
import { GameSettings, PrivacySettings } from './settings-client';
import { getTextFree } from '@/lib/card-face';
import { pageActor } from '@/lib/page-actor';
import { getOwnProfile } from '@/lib/profile-service';
import { copy } from '@/lib/i18n';
import { getLang } from '@/lib/lang';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function SettingsPage() {
  const [{ data }, lang, textFree] = await Promise.all([
    pageActor(async (client, _userId, identity) => {
      const profile = await getOwnProfile(client, identity);
      return profile.status === 200 ? profile.body : null;
    }),
    getLang(),
    getTextFree(),
  ]);
  if (!data) redirect('/login');
  const text = copy(lang);
  return (
    <>
      <main className="shell stack settings-page">
        <h1>{text.settings.title}</h1>
        <ProfileForm lang={lang} profile={data} title={text.settings.profile} />
        <GameSettings lang={lang} textFree={textFree} />
        <PrivacySettings lang={lang} profile={data} />
        <form className="settings-signout" action={signOut}>
          <button className="secondary" type="submit">{text.nav.logout}</button>
        </form>
      </main>
    </>
  );
}
