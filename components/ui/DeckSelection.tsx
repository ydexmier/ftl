'use client';
import { useState } from 'react';
import Ink, { types } from '@components/ui/Ink';
export { types };

interface DeckSelectionProps {
	inks: string[];
	selected?: boolean;
	onClick?: (inks: string[]) => void;
}

const DeckSelection = ({ inks, selected: initialSelected = false, onClick }: DeckSelectionProps) => {
	const [isSelected, setIsSelected] = useState(initialSelected);

	const handleClick = () => {
		setIsSelected((prev) => !prev);
		onClick?.(inks);
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className={[
				'inline-flex items-center rounded-full p-1 transition-all duration-200',
				'border-2',
				isSelected ? 'border-white/60' : 'border-transparent',
				'hover:border-white/40 hover:opacity-100',
				!isSelected ? 'opacity-80' : '',
			].join(' ')}
		>
			{inks.map((ink) => (
				<Ink key={ink} type={ink} width={32} />
			))}
			{inks.length === 1 && <Ink type="" width={32} />}
		</button>
	);
};

export default DeckSelection;
