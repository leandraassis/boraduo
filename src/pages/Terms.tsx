import { Fill, LegalLayout, LegalList, LegalSection } from '../components/legal/LegalLayout'
import { LEGAL, MIN_AGE } from '../lib/legal'

export function Terms() {
  return (
    <LegalLayout
      title="Termos de Uso"
      intro={`Estes Termos de Uso regulam o uso do BoraDuo, uma plataforma para encontrar parceiros de jogo (duo) de Valorant. Ao criar uma conta você declara ter ${MIN_AGE} anos ou mais e aceita estes Termos e a Política de Privacidade. Se não concordar, não use o serviço.`}
      otherPage={{ to: '/privacidade', label: 'Ler a Política de Privacidade' }}
    >
      <LegalSection title="1. O que é o BoraDuo">
        <p>
          O BoraDuo ajuda jogadores de Valorant a se encontrarem por função no jogo, rank e horários. Cada pessoa cria
          um perfil (Riot ID, foto opcional, bio curta, função, agente principal, rank e horários) e pode: descobrir
          outros jogadores por &quot;swipe&quot;, ver quem está &quot;Disponível agora&quot; e conversar por mensagens.
        </p>
        <p>
          O BoraDuo é uma plataforma independente e <strong className="text-ink">não é afiliada nem endossada pela
          Riot Games, Inc.</strong> Não verificamos Riot IDs, ranks nem qualquer outra informação de perfil: elas são
          declaradas pelo próprio usuário.
        </p>
      </LegalSection>

      <LegalSection title="2. Quem pode usar">
        <LegalList
          items={[
            `Ter ${MIN_AGE} anos ou mais e capacidade civil para aceitar estes Termos. Se identificarmos uma conta de menor de idade, ela será encerrada.`,
            'Manter uma conta pessoal e informar dados verdadeiros. Você é responsável por tudo o que acontece na sua conta e por manter sua senha em segurança.',
            'Informar o seu próprio Riot ID. É proibido usar o Riot ID de outra pessoa ou criar perfil falso ou que se passe por outra pessoa.',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Como funciona o contato entre jogadores">
        <p>
          No swipe, quando dois jogadores se curtem, abre-se uma conversa. Em &quot;Disponíveis agora&quot; o contato é
          direto:{' '}
          <strong className="text-ink">
            quando você ativa &quot;Estou disponível&quot;, qualquer jogador disponível pode iniciar uma conversa com
            você, sem pedir seu aceite antes.
          </strong>{' '}
          Você pode bloquear e denunciar qualquer pessoa a qualquer momento (seção 5).
        </p>
        <p>
          Para evitar abuso, existem limites, por exemplo, de mensagens, de denúncias e de conversas iniciadas por
          período. Esses limites podem mudar e não podem ser contornados.
        </p>
      </LegalSection>

      <LegalSection title="4. Regras de conduta">
        <p>Você concorda em não usar o BoraDuo para:</p>
        <LegalList
          items={[
            'assediar, ameaçar, intimidar, discriminar ou ofender outras pessoas, nem praticar discurso de ódio ou comportamento tóxico;',
            'publicar ou enviar conteúdo sexual explícito, violento, ilegal ou que viole direitos de terceiros (inclusive fotos de terceiros sem autorização);',
            'fazer spam, aplicar golpes, pedir dados pessoais ou financeiros ou divulgar dados pessoais de outras pessoas;',
            'coletar dados de outros usuários de forma automatizada, usar bots ou tentar burlar limites, controles de segurança ou banimentos, inclusive criando nova conta para voltar após um banimento;',
            'denunciar de má-fé ou usar a denúncia para prejudicar alguém.',
          ]}
        />
        <p>Você é responsável pelo conteúdo que publica: Riot ID, foto, bio e mensagens.</p>
      </LegalSection>

      <LegalSection id="moderacao" title="5. Bloqueio, denúncia, moderação e banimento">
        <LegalList
          items={[
            'Bloquear: vocês deixam de aparecer um para o outro e a conversa existente fica somente leitura, com o histórico preservado. Você pode desfazer um bloqueio voluntário em Perfil.',
            'Denunciar: enviamos sua denúncia para a equipe de moderação e bloqueamos a pessoa denunciada para você. Esse bloqueio só pode ser removido pela moderação.',
            'Análise: para decidir uma denúncia, a equipe pode consultar o perfil, o texto da denúncia e a conversa entre denunciante e denunciado. Esse acesso se limita à denúncia analisada.',
            'Sanções: contas que violem estes Termos podem ser banidas. Uma conta banida perde o acesso ao serviço; para quem não foi banido, o histórico da conversa continua visível, somente para leitura.',
            'Não garantimos que toda denúncia resulte em uma ação, nem prazo para a análise.',
          ]}
        />
        <p>
          <strong className="text-ink">Contestar um banimento:</strong> escreva para{' '}
          <Fill>{LEGAL.contactEmail}</Fill> informando o seu Riot ID. Analisamos o pedido e respondemos em prazo
          razoável.
        </p>
      </LegalSection>

      <LegalSection title="6. Seu conteúdo">
        <p>
          O conteúdo que você publica continua sendo seu. Para operar o serviço, você nos concede uma licença não
          exclusiva, gratuita e limitada para hospedar e exibir esse conteúdo dentro do BoraDuo, e declara ter o
          direito de usá-lo.
        </p>
      </LegalSection>

      <LegalSection title="7. Riot Games e Valorant">
        <p>
          Valorant e as marcas relacionadas pertencem à Riot Games, Inc. Usar o BoraDuo não substitui as regras do jogo
          nem os termos da Riot, que continuam valendo, e não respondemos por decisões da Riot sobre contas do jogo.
        </p>
      </LegalSection>

      <LegalSection title="8. Disponibilidade do serviço">
        <p>
          O BoraDuo está em evolução. Funcionalidades podem mudar, ser suspensas ou apresentar instabilidade, e o
          serviço pode passar por manutenção sem aviso prévio.
        </p>
      </LegalSection>

      <LegalSection title="9. Encerramento">
        <p>
          Você pode parar de usar o serviço quando quiser. Nesta fase o app não tem botão de exclusão de conta:
          para pedir a exclusão dos seus dados, escreva para <Fill>{LEGAL.contactEmail}</Fill> (veja a Política de
          Privacidade). Também podemos suspender ou encerrar contas que violem estes Termos.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitação de responsabilidade">
        <p>
          O serviço é oferecido no estado em que se encontra. Não verificamos a identidade, a idade, o Riot ID, o rank
          nem as intenções dos usuários. Conversas e encontros fora do BoraDuo (no jogo, no Discord ou em qualquer
          outro lugar) são por sua conta e risco; recomendamos não compartilhar dados pessoais com quem você não
          conhece. Nos limites da lei, não respondemos por danos indiretos decorrentes do uso do serviço ou de
          condutas de outros usuários.
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações destes Termos">
        <p>
          Podemos atualizar estes Termos. Quando a mudança for relevante, publicamos uma nova versão (com a data no
          topo desta página) e pedimos um novo aceite ao seu próximo acesso. Para continuar usando o serviço é preciso
          aceitar a versão vigente.
        </p>
      </LegalSection>

      <LegalSection title="12. Lei aplicável">
        <p>
          Estes Termos são regidos pelas leis do Brasil. Eventuais disputas serão resolvidas no foro competente
          segundo a lei, inclusive o do domicílio do consumidor, quando aplicável.
        </p>
      </LegalSection>

      <LegalSection title="13. Contato">
        <p>
          Dúvidas, pedidos e contestações: <Fill>{LEGAL.contactEmail}</Fill>.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
