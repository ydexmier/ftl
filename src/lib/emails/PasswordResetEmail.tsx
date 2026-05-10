import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  link: string;
}

export function PasswordResetEmail({ link }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Réinitialisation de ton mot de passe Companion Lorcana</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Companion Lorcana</Heading>
          <Text style={text}>
            Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour
            choisir un nouveau mot de passe.
          </Text>
          <Text style={text}>
            Ce lien est valable <strong>1 heure</strong> et ne peut être utilisé qu&apos;une seule
            fois.
          </Text>
          <Section style={btnSection}>
            <Button style={btn} href={link}>
              Réinitialiser mon mot de passe
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={small}>
            Si tu n&apos;es pas à l&apos;origine de cette demande, ignore cet email — ton mot de
            passe restera inchangé.
          </Text>
          <Text style={small}>
            Ou copie ce lien dans ton navigateur :{' '}
            <span style={{ color: '#6366f1' }}>{link}</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: '#09090b',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

const container: React.CSSProperties = {
  margin: '40px auto',
  padding: '32px',
  maxWidth: '480px',
  backgroundColor: '#18181b',
  borderRadius: '12px',
  border: '1px solid #27272a',
};

const h1: React.CSSProperties = {
  color: '#f4f4f5',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 24px',
};

const text: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const btnSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0',
};

const btn: React.CSSProperties = {
  backgroundColor: '#6366f1',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
};

const hr: React.CSSProperties = {
  borderColor: '#27272a',
  margin: '24px 0',
};

const small: React.CSSProperties = {
  color: '#71717a',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
};
