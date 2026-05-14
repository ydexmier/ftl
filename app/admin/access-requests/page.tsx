import connectToMongoDB from '@/src/lib/db';
import { AccessRequestRepository } from '@/src/repositories/db/AccessRequestRepository';
import { AccessRequestsPageClient } from '@components/admin/access-requests/AccessRequestsPageClient';

interface SearchParams {
  page?: string;
  status?: string;
}

export default async function AccessRequestsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status ?? '';
  const limit = 25;

  await connectToMongoDB();

  const { requests, total } = await AccessRequestRepository.findWithFilters(status, page, limit);

  return (
    <AccessRequestsPageClient
      requests={requests.map((r) => ({
        _id: String(r._id),
        email: r.email,
        reason: r.reason ?? null,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
      }))}
      total={total}
      page={page}
      pages={Math.ceil(total / limit)}
      status={status}
    />
  );
}
