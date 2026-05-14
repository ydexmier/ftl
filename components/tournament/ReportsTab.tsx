'use client';
import { useEffect, useState } from 'react';
import { Spinner } from '@components/ui/Spinner';

interface ReportRow {
  userId: string;
  username: string;
  count: number;
}

interface ReportsTabProps {
  groupId: string;
  tournamentId: number;
}

export function ReportsTab({ groupId, tournamentId }: ReportsTabProps) {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/groups/${groupId}/tournaments/${tournamentId}/reports`)
      .then((res) => (res.ok ? res.json() : { reports: [] }))
      .then((data) => setReports(data.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [groupId, tournamentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16">
        Aucun report pour ce groupe sur ce tournoi.
      </p>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Membre
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reports
            </th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.userId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-foreground">@{r.username}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                {r.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
