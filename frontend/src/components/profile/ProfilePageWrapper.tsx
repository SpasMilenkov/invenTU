import QueryProvider from '../providers/QueryProvider';
import ProfilePage from './ProfilePage';

export default function ProfilePageWrapper() {
  return (
    <QueryProvider>
      <ProfilePage />
    </QueryProvider>
  );
}
