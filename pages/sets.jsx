/** @jsxImportSource @emotion/react */
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import Layout from '../components/Layout';
import Card from '../components/card';

const Title = styled.h1`
  color: #0070f3;
  font-size: 2rem;
`;

const LinkList = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const LinkButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${({ active }) => (active ? '#0070f3' : '#eee')};
  color: ${({ active }) => (active ? 'white' : '#333')};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #005bb5;
    color: white;
  }
`;


const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

  export default function Sets() {
  const [selected, setSelected] = useState(1);
  const [items, setItems] = useState([]);


  useEffect(() => {
    if (selected === null) return;

    setItems([]); // reset
    fetch(`/json/sets/${selected}.json`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(() => setItems([]));
  }, [selected]);

  return (
    <Layout>
      <Title>Choisissez un Set</Title>

      <LinkList>
        {[...Array(8)].map((_, index) => {
          const value = index + 1;
          return (
            <LinkButton
              key={value}
              active={selected === value}
              onClick={() => setSelected(value)}
            >
              {value}
            </LinkButton>
          );
        })}
      </LinkList>

      <CardGrid>
  {items.map((item, index) => (
    <Card key={index} data={item} />
  ))}
</CardGrid>
    </Layout>
  );
}

