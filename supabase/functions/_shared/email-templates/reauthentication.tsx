/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação — Orphea Core</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={brand}>⚔ ORPHEA CORE</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Código de verificação</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Este código expira em breve. Se você não solicitou, pode ignorar
          este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '480px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '10px 0' }
const brand = {
  fontSize: '18px',
  fontWeight: 'bold' as const,
  color: '#7F1D1D',
  letterSpacing: '2px',
  margin: '0',
}
const divider = { borderColor: '#C6A15B', margin: '15px 0 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#7F1D1D',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#3a3a3a',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#7F1D1D',
  textAlign: 'center' as const,
  letterSpacing: '4px',
  margin: '0 0 30px',
  padding: '15px',
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  border: '1px solid #C6A15B',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
