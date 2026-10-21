import Link from 'next/link';
import { site } from '@/site.config';
export const metadata = { title: 'Privacidade | Barbearia Geral' };
export default function Privacy() {
  return (
    <main id="main" className="legal">
      <Link className="text-button" href="/">
        ← Voltar ao site
      </Link>
      <p className="eyebrow">SEUS DADOS, COM CUIDADO</p>
      <h1>Política de privacidade</h1>
      <p>
        A {site.fullName} trata os dados necessários para organizar atendimentos e manter contato
        com você, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>
      <h2>O que coletamos</h2>
      <p>
        Nome, telefone, serviço, profissional escolhido, data e observações fornecidas no
        agendamento. Não pedimos documentos ou dados de cartão. Evite incluir informações sensíveis
        nas observações.
      </p>
      <h2>Finalidade e base legal</h2>
      <p>
        Usamos esses dados para executar o agendamento solicitado, comunicar alterações e manter o
        histórico do atendimento. A opção de lembrar seus dados no aparelho depende do seu
        consentimento e pode ser removida desmarcando a opção no próximo agendamento ou limpando os
        dados do navegador.
      </p>
      <h2>Armazenamento e proteção</h2>
      <p>
        O acesso ao painel é restrito à equipe autorizada. Sessões utilizam cookies necessários ao
        funcionamento. Não usamos cookies de publicidade. Os dados ficam armazenados durante o
        relacionamento e pelo prazo necessário ao cumprimento de obrigações legais; após esse prazo,
        são excluídos ou anonimizados.
      </p>
      <h2>Compartilhamento</h2>
      <p>
        Prestadores de hospedagem e comunicação podem processar dados para viabilizar o serviço. Ao
        abrir WhatsApp, Instagram ou Google Maps, aplicam-se também as políticas desses serviços. O
        mapa é um serviço externo.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar confirmação, acesso, correção, portabilidade quando aplicável, revogação
        de consentimento e exclusão ou anonimização, ressalvadas obrigações legais. Entre em contato
        pelo{' '}
        <a className="text-button" href={`https://wa.me/${site.phone}`}>
          WhatsApp da barbearia
        </a>
        . Para proteger seus dados, podemos confirmar sua identidade.
      </p>
      <h2>Contato</h2>
      <p>
        Controlador: {site.fullName}. Endereço: {site.address}. Canal para assuntos de privacidade:
        WhatsApp {site.phone}.
      </p>
    </main>
  );
}
