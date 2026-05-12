import FetchButton from '@components/ui/FetchButton';

interface RoundHeaderProps {
	lastFetchedAt?: string | null;
	onRefresh: () => Promise<void>;
}

const RoundHeader = ({ lastFetchedAt, onRefresh }: RoundHeaderProps) => (
	<div className="flex items-center justify-between gap-2 my-4">
		<h2 className="text-lg font-semibold text-foreground">Matchs</h2>
		<FetchButton
			defaultLabel="MAJ Round"
			onFetch={onRefresh}
			refreshDelay={60}
			lastUpdate={lastFetchedAt}
		/>
	</div>
);

export default RoundHeader;
