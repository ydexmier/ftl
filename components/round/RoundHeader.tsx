import FetchButton from '@components/ui/FetchButton';

interface RoundHeaderProps {
	updatedAt?: string | null;
	onRefresh: () => void;
}

const RoundHeader = ({ updatedAt, onRefresh }: RoundHeaderProps) => (
	<div className="flex items-center justify-between gap-2 my-4">
		<h2 className="text-lg font-semibold text-foreground">Matchs</h2>
		<FetchButton
			defaultLabel="MAJ Round"
			onFetch={onRefresh}
			refreshDelay={60}
			lastUpdate={updatedAt}
		/>
	</div>
);

export default RoundHeader;
