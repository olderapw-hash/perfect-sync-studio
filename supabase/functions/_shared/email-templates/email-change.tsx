/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
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
    <Preview>Confirme seu novo email — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📧 Alteração de Email</Heading>
        <Text style={text}>
          Você solicitou a alteração do email da sua conta no <strong>{siteName}</strong>
          {oldEmail ? <> de <strong>{oldEmail}</strong></> : null}
          {newEmail ? <> para <strong>{newEmail}</strong></> : null}.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar Novo Email
        </Button>
        <Text style={footer}>
          Se você não solicitou esta alteração, pode ignorar este email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px', borderTop: '4px solid #7F1D1D' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#7F1D1D', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const button = { backgroundColor: '#7F1D1D', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
