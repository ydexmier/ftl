import React from 'react';
import styled from '@emotion/styled';
import { ButtonBase } from '@mui/material';
import Ink, { types } from '@components/ui/Ink';
export { types };

const StyledInkButton = styled(ButtonBase, {
	shouldForwardProp: (prop) => prop !== 'isInactive',
})(({ isInactive, isSelected }) => ({
	transition: 'filter 0.3s, opacity 0.3s',
	padding: '4px',
	borderRadius: 99999,
	filter: isInactive ? 'grayscale(100%)' : 'none',
	opacity: isInactive ? 0.5 : 1,
	pointerEvents: 'auto',
	border: isSelected ? '2px solid grey' : '2px solid transparent',
	'&:hover': { filter: 'none', opacity: 1 },
}));

const InkButton = ({ type, ...props }) => {
	return (
		<StyledInkButton {...props}>
			<Ink type={type} width={32} />
		</StyledInkButton>
	);
};

export default InkButton;
