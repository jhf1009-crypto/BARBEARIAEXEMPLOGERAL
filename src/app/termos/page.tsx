import Link from 'next/link';
export const metadata = { title: 'Termos de agendamento | Barbearia Geral' };
export default function Terms() {
  return (
    <main id="main" className="legal">
      <Link className="text-button" href="/">
        ← Voltar ao site
      </Link>
      <h1>Termos de agendamento</h1>
      <h2>Reserva de horário</h2>
      <p>
        A reserva é confirmada após a tela de sucesso. Valores e duração são apresentados antes da
        confirmação. O pagamento acontece no local. Os horários seguem o fuso de Salvador, Bahia.
      </p>
      <h2>Cancelamento e reagendamento</h2>
      <p>
        Use o link recebido na confirmação. Alterações estão sujeitas à disponibilidade e à
        antecedência mínima configurada pela barbearia, informada quando a alteração não for mais
        permitida. Se precisar de ajuda, entre em contato pelo WhatsApp.
      </p>
      <h2>Pontualidade</h2>
      <p>
        Chegue com alguns minutos de antecedência. Atrasos podem exigir ajustes conforme a
        disponibilidade da equipe. Se o profissional precisar alterar o atendimento, entraremos em
        contato para oferecer outro horário.
      </p>
      <h2>Seu link de acesso</h2>
      <p>
        O link do agendamento é pessoal e permite consultar ou alterar a reserva. Guarde-o com
        cuidado e evite compartilhá-lo publicamente.
      </p>
      <h2>Dados pessoais</h2>
      <p>
        Seus dados são tratados conforme nossa{' '}
        <Link className="text-button" href="/privacidade">
          política de privacidade
        </Link>
        .
      </p>
    </main>
  );
}
