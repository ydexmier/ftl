'use client';
import Ink, { types } from '@components/ui/Ink';
export { types };

interface InkButtonProps {
	type: string;
	isSelected?: boolean;
	isInactive?: boolean;
	onClick?: () => void;
}

const InkButton = ({ type, isSelected, isInactive, onClick }: InkButtonProps) => (
	<button
		type="button"
		data-testid={`ink-btn-${type.toLowerCase()}`}
		onClick={onClick}
		className={[
			'p-1 rounded-full border-2 transition-all duration-300',
			isSelected ? 'border-white/60' : 'border-transparent',
			isInactive ? 'grayscale opacity-50' : '',
			'hover:grayscale-0 hover:opacity-100',
		].join(' ')}
	>
		<Ink type={type} width={32} />
	</button>
);

export default InkButton;
