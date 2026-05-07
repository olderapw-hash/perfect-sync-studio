/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({
  token,
}: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Código de verificação — Orphea Core</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔐 Código de Verificação</Heading>
        <Text style={text}>
          Use o código abaixo para confirmar sua identidade:
        </Text>
        <Text style={code}>{token}</Text>
        <Text style={footer}>
          Este código expira em poucos minutos. Se você não solicitou, ignore este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px', borderTop: '4px solid #7F1D1D' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#7F1D1D', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const code = { fontSize: '32px', fontWeight: 'bold' as const, color: '#7F1D1D', letterSpacing: '6px', textAlign: 'center' as const, margin: '10px 0 30px', padding: '15px', backgroundColor: '#FFF5F5', borderRadius: '8px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
