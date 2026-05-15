import { redirect } from 'next/navigation';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import { getServerUser } from '@/src/lib/auth/getServerUser';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const auth = await getServerUser();
  if (!auth) redirect('/login');

  await connectToMongoDB();
  const user = await UserModel.findById(auth.userId).select('-passwordHash').lean();
  if (!user) redirect('/login');

  return (
    <ProfileClient
      initialUsername={user.username}
      initialEmail={user.email}
    />
  );
}
