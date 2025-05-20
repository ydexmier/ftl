/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import Layout from '../components/Layout';


const Title = styled.h1`
  color: #0070f3;
  font-size: 2rem;
`;

export default function Home() {
    return <Layout><Title>Hello FTL</Title></Layout>
        
}
