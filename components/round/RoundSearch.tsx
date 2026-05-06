import { Input } from '@components/ui/Input';

interface RoundSearchProps {
	value: string;
	onChange: (value: string) => void;
}

const RoundSearch = ({ value, onChange }: RoundSearchProps) => (
	<Input
		fullWidth
		label="Rechercher un joueur ou un match"
		value={value}
		onChange={(e) => onChange(e.target.value)}
	/>
);

export default RoundSearch;
