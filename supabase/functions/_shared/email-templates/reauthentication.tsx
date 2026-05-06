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
    <Preview>🔒 Código de verificação — Orphea Core</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Section style={headerSection}>
            <Heading style={brand}>⚔ ORPHEA CORE</Heading>
            <Text style={brandSub}>Tecnologia Premium para Perfect World</Text>
          </Section>
          <Hr style={divider} />
          <Heading style={h1}>Código de verificação</Heading>
          <Text style={text}>
            Utilize o código abaixo para confirmar sua identidade e concluir a operação solicitada:
          </Text>
          <Section style={codeSection}>
            <Text style={codeStyle}>{token}</Text>
          </Section>
          <Text style={textSmall}>
            Este código possui validade limitada por motivos de segurança.
          </Text>
          <Hr style={dividerLight} />
          <Text style={footer}>
            Se você não solicitou este código, recomendamos alterar sua senha imediatamente.
          </Text>
          <Text style={footerBrand}>
            Equipe Orphea Core
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }
const container = { padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }
const card = {
  backgroundColor: '#fafafa',
  borderRadius: '12px',
  border: '1px solid #e8e8e8',
  padding: '40px 36px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
}
const headerSection = { textAlign: 'center' as const, padding: '0 0 8px' }
const brand = {
  fontSize: '20px',
  fontWeight: '800' as const,
  color: '#5e0b15',
  letterSpacing: '3px',
  margin: '0',
}
const brandSub = {
  fontSize: '11px',
  color: '#888',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '6px 0 0',
}
const divider = { borderColor: '#5e0b15', opacity: 0.2, margin: '20px 0 28px' }
const dividerLight = { borderColor: '#e0e0e0', margin: '28px 0 20px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#3a3a3a',
  lineHeight: '1.7',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}
const textSmall = {
  fontSize: '13px',
  color: '#666',
  lineHeight: '1.5',
  margin: '0 0 8px',
  fontStyle: 'italic' as const,
  textAlign: 'center' as const,
}
const codeSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#f0f0f0',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
}
const codeStyle = {
  fontFamily: "'JetBrains Mono', 'Fira Code', Courier, monospace",
  fontSize: '32px',
  fontWeight: '800' as const,
  color: '#5e0b15',
  margin: '0',
  letterSpacing: '6px',
}
const footer = { fontSize: '13px', color: '#888', margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '13px', color: '#5e0b15', fontWeight: '600' as const, margin: '0' }
