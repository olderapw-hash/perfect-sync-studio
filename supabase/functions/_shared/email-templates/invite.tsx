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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>🎮 Você foi convidado para o Orphea Core</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Section style={headerSection}>
            <Heading style={brand}>⚔ ORPHEA CORE</Heading>
            <Text style={brandSub}>Tecnologia Premium para Perfect World</Text>
          </Section>
          <Hr style={divider} />
          <Heading style={h1}>Convite recebido</Heading>
          <Text style={text}>
            Você recebeu um convite para participar da plataforma{' '}
            <Link href={siteUrl} style={link}><strong>Orphea Core</strong></Link>.
          </Text>
          <Text style={text}>
            Aceite o convite abaixo para criar sua conta e acessar todas as funcionalidades de gerenciamento de servidor.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={confirmationUrl}>
              Aceitar Convite
            </Button>
          </Section>
          <Hr style={dividerLight} />
          <Text style={footer}>
            Se você não esperava este convite, pode ignorar esta mensagem com segurança.
          </Text>
          <Text style={footerBrand}>
            Equipe Orphea Core
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
}
const text = {
  fontSize: '15px',
  color: '#3a3a3a',
  lineHeight: '1.7',
  margin: '0 0 16px',
}
const link = { color: '#5e0b15', textDecoration: 'none', fontWeight: '600' as const }
const buttonSection = { textAlign: 'center' as const, margin: '28px 0' }
const button = {
  backgroundColor: '#5e0b15',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700' as const,
  borderRadius: '8px',
  padding: '14px 36px',
  textDecoration: 'none',
  border: 'none',
  boxShadow: '0 4px 14px rgba(94,11,21,0.3)',
}
const footer = { fontSize: '13px', color: '#888', margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '13px', color: '#5e0b15', fontWeight: '600' as const, margin: '0' }
