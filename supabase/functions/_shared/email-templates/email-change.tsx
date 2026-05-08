/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração de email — Orphea Core</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={brand}>⚔ ORPHEA CORE</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Confirmar alteração de email</Heading>
        <Text style={text}>
          Você solicitou a alteração do seu email no Orphea Core de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Clique no botão abaixo para confirmar esta alteração:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar Alteração
        </Button>
        <Text style={footer}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
const link = { color: '#7F1D1D', textDecoration: 'underline' }
const button = {
  backgroundColor: '#7F1D1D',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '6px',
  padding: '12px 24px',
  textDecoration: 'none',
  border: '1px solid #C6A15B',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
