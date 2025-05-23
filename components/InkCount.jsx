import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

const InkCountStyled = styled.div`
    display: inline-block;
    background-image: url(/svg/inkwell.svg);
    text-align: center;
    background-repeat: no-repeat;
    background-position: 50%;
    background-size: contain;
    ${({ size }) => css`
        height: ${size}px;
        width: ${size}px;
        line-height: ${size}px;
        font-size: ${size * 0.4375}px;
    `}
`

const InkCount = ({ count, size }) => <InkCountStyled size={size}><span>{count}</span></InkCountStyled>;

export default InkCount;