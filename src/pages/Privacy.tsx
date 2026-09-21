import { Fill, LegalLayout, LegalList, LegalSection } from '../components/legal/LegalLayout'
import { LEGAL, MIN_AGE } from '../lib/legal'

export function Privacy() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      intro="Esta Política explica quais dados pessoais o BoraDuo trata, para quê, com quem são compartilhados e como você exerce seus direitos, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018)."
      otherPage={{ to: '/termos', label: 'Ler os Termos de Uso' }}
    >
      <LegalSection title="1. Controlador e contato">
        <p>
          O BoraDuo é o controlador dos dados pessoais tratados nesta plataforma. Para assuntos de privacidade e para
          exercer seus direitos, escreva para <Fill>{LEGAL.contactEmail}</Fill>.
        </p>
      </LegalSection>

      <LegalSection title="2. Quais dados tratamos">
        <LegalList
          items={[
            <>
              <strong className="text-ink">Conta:</strong> e-mail; a senha, que é guardada apenas de forma
              criptografada (hash) pelo provedor de autenticação; a versão e a data em que você aceitou os Termos.
            </>,
            <>
              <strong className="text-ink">Perfil:</strong> Riot ID, foto (opcional), bio, função, agente principal,
              rank, horários de jogo e se você está &quot;disponível agora&quot;.
            </>,
            <>
              <strong className="text-ink">Uso:</strong> curtidas e passes, matches, conversas iniciadas, mensagens
              enviadas e recebidas, marcação de mensagens lidas e notificações.
            </>,
            <>
              <strong className="text-ink">Moderação:</strong> denúncias que você faz ou recebe, bloqueios e
              banimentos, com data e quem os aplicou.
            </>,
            <>
              <strong className="text-ink">Dados técnicos:</strong> endereço IP, tipo de navegador e registros de
              acesso mantidos pela infraestrutura; sessão de login e preferências guardadas no seu navegador. Não
              usamos cookies de publicidade nem ferramentas de análise de comportamento.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Para quê e com qual base legal">
        <LegalList
          items={[
            'Criar e manter sua conta, montar seu perfil, mostrar você a outros jogadores, permitir matches, conversas e notificações: execução do contrato de uso (art. 7º, V, da LGPD).',
            'Segurança, prevenção a fraude e abuso, limites de uso e moderação de denúncias e banimentos: legítimo interesse e exercício regular de direitos (art. 7º, IX e VI).',
            'Cumprir obrigações legais ou ordens de autoridades: art. 7º, II.',
            'Foto de perfil, que é opcional: seu consentimento (art. 7º, I), que você pode retirar removendo a foto em Perfil.',
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Quem vê seus dados">
        <LegalList
          items={[
            'Outros usuários que não bloquearam você veem seu Riot ID, foto, bio, função, agente, rank e, se ativo, que você está disponível. Seu e-mail nunca é mostrado a outros usuários.',
            'Suas mensagens são visíveis para você e para a outra pessoa da conversa.',
            'A equipe do BoraDuo tem acesso administrativo restrito para operar o serviço e moderar. Ao analisar uma denúncia, pode ler a conversa entre denunciante e denunciado, e somente essa.',
            'Não vendemos seus dados nem exibimos anúncios.',
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Provedores e transferência internacional">
        <p>
          Usamos o <strong className="text-ink">Supabase</strong> (banco de dados, autenticação, armazenamento de fotos
          e comunicação em tempo real) e a <strong className="text-ink">Vercel</strong> (hospedagem do site) como
          operadores. Os dados do Supabase ficam em servidores em <Fill>{LEGAL.dataRegion}</Fill>. Como esses
          provedores podem tratar dados fora do Brasil, pode haver transferência internacional (art. 33 da LGPD),
          amparada pelas salvaguardas contratuais deles.
        </p>
      </LegalSection>

      <LegalSection title="6. Por quanto tempo guardamos">
        <p>
          Mantemos seus dados enquanto sua conta existir. Depois de um pedido de exclusão, eliminamos ou anonimizamos
          os dados, exceto o que precisarmos manter para segurança, prevenção de abuso e exercício de direitos (por
          exemplo, o registro de banimentos e denúncias) ou por obrigação legal. Backups e registros dos provedores
          são mantidos por tempo limitado.
        </p>
      </LegalSection>

      <LegalSection id="direitos" title="7. Seus direitos">
        <p>Nos termos do art. 18 da LGPD, você pode pedir:</p>
        <LegalList
          items={[
            'confirmação de que tratamos seus dados e acesso a eles;',
            'correção de dados incompletos ou desatualizados (você mesmo edita seu perfil em Perfil);',
            'anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;',
            'portabilidade e informação sobre com quem compartilhamos seus dados;',
            'a revogação do consentimento e a oposição a um tratamento.',
          ]}
        />
        <p>
          Para exercer qualquer um deles, escreva para <Fill>{LEGAL.contactEmail}</Fill>; respondemos em até 15 dias.{' '}
          <strong className="text-ink">
            Nesta fase o app não tem botão de exclusão de conta: a exclusão é feita por pedido a esse e-mail.
          </strong>
        </p>
      </LegalSection>

      <LegalSection title="8. Segurança">
        <p>
          Usamos conexão criptografada (TLS), senhas guardadas com hash, controle de acesso por linha no banco de dados
          e limites de uso. Nenhuma medida elimina todo o risco. Em caso de incidente de segurança relevante,
          comunicaremos os usuários afetados e a Autoridade Nacional de Proteção de Dados (ANPD), conforme a lei.
        </p>
      </LegalSection>

      <LegalSection title="9. Menores de idade">
        <p>
          O BoraDuo é destinado a maiores de {MIN_AGE} anos e não coleta intencionalmente dados de menores. Se
          identificarmos uma conta de menor, ela será encerrada e os dados eliminados.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações desta Política">
        <p>
          Podemos atualizar esta Política. A versão vigente e a data ficam no topo desta página; mudanças relevantes
          seguem o mesmo procedimento de novo aceite descrito nos Termos de Uso.
        </p>
      </LegalSection>

      <LegalSection title="11. Contato e ANPD">
        <p>
          Dúvidas: <Fill>{LEGAL.contactEmail}</Fill>. Você também pode apresentar reclamação à ANPD
          (gov.br/anpd).
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
