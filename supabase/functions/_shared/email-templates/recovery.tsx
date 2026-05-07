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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinir senha — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔑 Redefinir Senha</Heading>
        <Text style={text}>
          Recebemos uma solicitação para redefinir a senha da sua conta no{' '}
          <strong>{siteName}</strong>.
        </Text>
        <Text style={text}>
          Clique no botão abaixo para criar uma nova senha:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Redefinir Senha
        </Button>
        <Text style={footer}>
          Se você não solicitou isso, pode ignorar este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px', borderTop: '4px solid #7F1D1D' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#7F1D1D', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const button = { backgroundColor: '#7F1D1D', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
