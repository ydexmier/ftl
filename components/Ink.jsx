import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
const Container = styled.div`
  position: relative;
  width: ${({ width }) => (typeof width === 'number' ? `${width}px` : width)};
  aspect-ratio: 1 / 1;
  overflow: hidden;

  img {
    position: absolute;
    top: 0;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  ${({ isBicolor }) =>
    isBicolor
      ? css`
          img {
            width: 200%; /* double largeur */
          }
          img:first-child {
            left: 0;
            clip-path: inset(0 50% 0 0); /* couper moitié droite */
          }
          img:last-child {
            right: 0;
            left: auto;
            clip-path: inset(0 0 0 50%); /* couper moitié gauche */
          }
        `
      : css`
          img {
            width: 100%; /* image pleine largeur */
            position: static;
            clip-path: none;
          }
        `}
`;
export const types = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

export default function Ink({ type, width = 100 }) {
  const size = typeof width === 'number' ? `${width}px` : width;
  let src;
  const isBicolor = Array.isArray(type) && type.length > 1;

  if (Array.isArray(type)) {
    src = type.map(ink => `/svg/${ink.toLowerCase()}.svg`);
  } else {
    src = [`/svg/${type.toLowerCase()}.svg`];
  }

  return (
    <Container isBicolor={isBicolor} width={size}>
      {src.map(inkSrc => <img
        src={inkSrc}
        alt={inkSrc}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />)}
    </Container>
  );
}
