import React, { useState } from 'react';
import styled from '@emotion/styled';
import { ButtonBase } from '@mui/material';
import Ink, { types } from '@components/ui/Ink';
export { types };

const StyledDeckSelection = styled(ButtonBase, {
	shouldForwardProp: (prop) => prop !== 'isInactive',
})(({ isInactive, isSelected }) => ({
	transition: 'filter 0.3s, opacity 0.3s',
	padding: '4px',
	borderRadius: 99999,
	filter: isInactive ? 'grayscale(100%)' : 'none',
	opacity: isInactive ? 0.5 : 1,
	pointerEvents: 'auto',
	border: isSelected ? '2px solid grey' : '2px solid transparent',
	'&:hover': { border: '2px solid grey', filter: 'none', opacity: 1 },
}));

const DeckSelection = ({ inks, selected, onClick, ...props }) => {
	const [isSelected, setIsSelected] = useState(selected || false);
	const handleOnClick = () => {
		setIsSelected(!isSelected);
		onClick && onClick(inks);
	};
	return (
		<StyledDeckSelection {...props} selected={isSelected} onClick={handleOnClick}>
			{inks.map((ink) => (
				<Ink key={ink} type={ink} width={32} />
			))}
			{inks.length === 1 && <Ink width={32} />}
		</StyledDeckSelection>
	);
};

export default DeckSelection;
