import React, { useState } from 'react';
import styled from '@emotion/styled';
import { ButtonBase } from '@mui/material';
import Ink, { types } from '@components/Ink';
export { types };

const StyledDeckButton = styled(ButtonBase, {
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

const DeckButton = ({ inks, selected, onClick, ...props }) => {
	const [isSelected, setIsSelected] = useState(selected || false);
	const handleOnClick = () => {
		setIsSelected(!isSelected);
		console.log(inks);
		onClick && onClick(inks);
	};
	return (
		<StyledDeckButton {...props} selected={isSelected} onClick={handleOnClick}>
			{inks.map((ink) => (
				<Ink type={ink} width={32} />
			))}
		</StyledDeckButton>
	);
};

export default DeckButton;
