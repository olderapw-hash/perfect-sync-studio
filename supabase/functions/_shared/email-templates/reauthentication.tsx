/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  tokenHash: string
}

export const ReauthenticationEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  tokenHash,
}: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Código de verificação — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🛡️ Verificação</Heading>
        <Text style={text}>
          Use o código abaixo para verificar sua identidade no{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>:
        </Text>
        <Text style={codeStyle}>{tokenHash}</Text>
        <Text style={footer}>
          Se você não solicitou este código, pode ignorar este email.
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
const link = { color: '#7F1D1D', textDecoration: 'underline' }
const codeStyle = { fontSize: '28px', fontWeight: 'bold' as const, color: '#7F1D1D', letterSpacing: '4px', textAlign: 'center' as const, padding: '16px', backgroundColor: '#FFF5F5', borderRadius: '8px', margin: '0 0 25px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
