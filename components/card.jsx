/** @jsxImportSource @emotion/react */
import { useState } from 'react';
import styled from '@emotion/styled';

const ImageStyled = styled.img`
position: relative;
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
`;

const CardWrapper = styled.div`
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Loader = styled.div`
  width: 100%;
  height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  color: #333;
`;

const Subtitle = styled.p`
  font-style: italic;
  color: #666;
  margin: 0;
`;

const StatLine = styled.div`
  font-size: 0.9rem;
  color: #444;
`;

const Flavor = styled.blockquote`
  font-size: 0.85rem;
  color: #999;
  margin: 0.5rem 0;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  position: relative;
  background: white;
  padding: 2.5rem 2rem 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;
const CloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  color: #888;

  &:hover {
    color: #000;
  }
`;

export default function Card({ data }) {
  const [loading, setLoading] = useState(true);
const [isOpen, setIsOpen] = useState(false);
  const {
    name,
    version,
    image_uris,
    cost,
    inkwell,
    ink,
    type,
    text,
    flavor_text,
  } = data;

  return (
    <CardWrapper>
      {loading && <Loader>🌀 Chargement de l'image...</Loader>}
<div style={{ display: loading ? 'none' : 'block' }}>
<ImageStyled
onClick={() => setIsOpen(true)}
  src={image_uris.digital.normal}
  alt={name}
  onLoad={() => setLoading(false)}
  style={{ display: loading ? 'none' : 'block' }}
/>
</div>
      {isOpen && (
        <ModalBackdrop onClick={() => setIsOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton
              onClick={() => setIsOpen(false)}
              aria-label="Fermer la fenêtre"
            >
              &times;
            </CloseButton>

            <Title>{name}</Title>
            <Subtitle>{version}</Subtitle>
            <StatLine>
              <strong>Coût :</strong> {cost} | <strong>Encrier :</strong>{' '}
              {inkwell ? 'Oui' : 'Non'} | <strong>Encre :</strong> {ink}
            </StatLine>
            <StatLine>
              <strong>Type :</strong> {type?.join(', ')}
            </StatLine>
            <StatLine>
              <strong>Texte :</strong> {text}
            </StatLine>
            {flavor_text && <Flavor>« {flavor_text} »</Flavor>}
          </ModalContent>
        </ModalBackdrop>
      )}
    </CardWrapper>
  );
}
