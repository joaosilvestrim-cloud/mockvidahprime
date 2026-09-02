// Textos legais oficiais da Vidah Prime (contrato + regulamento interno).
// Fonte: documentos enviados pela cliente (agosto/2026). Usados no cadastro e no PDF de assinatura.

export const ENTITY = {
  name: "VIDAH PRIME COWORKING LTDA",
  cnpj: "56.934.208/0001-32",
  address: "Avenida General Osório, 736, Trujillo, Sorocaba/SP",
  cep: "18060-501",
  rep: "Raquel Boccatto Rosa Trinca",
  pixKey: "56.934.208/0001-32",
};

export const CONTRACT = {
  title: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE APOIO ADMINISTRATIVO E CESSÃO DE USO DE ESPAÇO (COWORKING)",
  intro: [
    `CONTRATADA: ${ENTITY.name}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${ENTITY.cnpj}, estabelecida na ${ENTITY.address}, CEP ${ENTITY.cep}, neste ato representada por ${ENTITY.rep}.`,
    "CONTRATANTE: o(a) profissional identificado(a) neste cadastro, com os dados pessoais e de registro por ele(a) informados.",
    "Resolvem celebrar o presente Contrato, que se regerá pelas seguintes cláusulas:",
  ],
  clauses: [
    { t: "CLÁUSULA PRIMEIRA – DO OBJETO", p: [
      "1.1. O objeto deste contrato é a prestação de serviços de apoio administrativo e a cessão de uso de espaço disponível e funcionalidades para trabalho compartilhado (coworking) pela CONTRATADA à CONTRATANTE, de forma pessoal e intransferível, em locais pré-determinados pela CONTRATADA e existentes nas dependências do coworking.",
      "1.2. Os serviços incluem a disponibilização de uma estação de trabalho/consultório, acesso à energia elétrica, internet de alta velocidade (wi-fi), uso de áreas comuns (recepção, sala de espera, copa, banheiros), serviços de limpeza e manutenção das áreas comuns e serviço de recepção, mediante agendamento prévio.",
      "1.3. O espaço funcionará de segunda a sexta-feira, das 09h00 às 19h00, e aos sábados, das 08h00 às 12h00. Os horários poderão sofrer alterações sem que isso configure falha na prestação do serviço.",
      "1.4. A CONTRATADA reserva-se ao direito de promover recesso no final do ano, entre o Natal e o Ano Novo, assim como nos feriados municipais, estaduais e federais.",
      "1.5. Em caso de caso fortuito ou força maior, o horário de funcionamento pode ser alterado sem prévio aviso, não configurando violação do contrato nem gerando ônus ou responsabilidade civil para a CONTRATADA.",
      "1.6. A CONTRATADA não será responsabilizada por perdas resultantes de interrupção por força maior (art. 1.058 do Código Civil), incluindo queda de rede elétrica, greves, falhas mecânicas do prédio ou indisponibilidade de internet, exceto se deliberada ou negligente.",
      "1.7. A CONTRATADA não é responsável por interrupção resultante de ações ou ordens da administração do prédio ou do poder público.",
      "1.8. O acesso fora dos horários de funcionamento deve ser requerido com antecedência e previamente autorizado, quando não haverá equipe de recepção e limpeza.",
      "1.9. Não serão aceitos cancelamentos de agendamentos com menos de 24 horas de antecedência. Em nenhuma hipótese haverá ressarcimento de valores; nos cancelamentos com antecedência mínima de 24 horas, o pagamento é convertido em crédito para uso em até 06 meses da emissão.",
      "1.10. Não serão aceitos cancelamentos de agendamento mensal com menos de 7 dias de antecedência. Nos cancelamentos com antecedência mínima de 7 dias, o pagamento é convertido em crédito para uso em até 06 meses da emissão.",
      "1.11. Horas agendadas, não canceladas conforme os itens 1.9 e 1.10 e não utilizadas, não serão reembolsadas nem darão direito a crédito.",
      "1.12. Não existirá gratuidade no uso compartilhado por pessoa sem vínculo com a CONTRATADA, mesmo com entrada autorizada pela CONTRATANTE, podendo ser cobrado o dobro do valor de uso respectivo.",
    ]},
    { t: "CLÁUSULA SEGUNDA – DA REMUNERAÇÃO E FORMA DE PAGAMENTO", p: [
      "2.1. Pela utilização do espaço e dos serviços, a CONTRATANTE pagará à CONTRATADA o valor e a periodicidade acordados no momento da reserva, que poderá ser por hora, diária, período ou plano mensal.",
      `2.2. O pagamento deverá ser realizado na reserva, de forma antecipada, ou conforme política de faturamento estipulada pela CONTRATADA, mediante PIX (CNPJ ${ENTITY.pixKey}).`,
      "2.3. Em caso de atraso ou inadimplemento será cobrada multa de 10% sobre o valor em atraso, além de juros de 1% ao mês e correção monetária pelo INPC, desde o vencimento até a quitação.",
      "2.4. O cancelamento deve ser feito unicamente através da plataforma onde foi realizada a reserva, indicando nova data para o uso do crédito respectivo.",
    ]},
    { t: "CLÁUSULA TERCEIRA – DAS OBRIGAÇÕES DA CONTRATANTE", p: [
      "3.1. Utilizar o espaço de acordo com as normas e o Regulamento Interno, do qual a CONTRATANTE declara ter recebido cópia e ter pleno conhecimento.",
      "3.2. Reparar ou indenizar integralmente quaisquer danos que causar às instalações, móveis ou equipamentos, assim como prejuízos ou responsabilidades com terceiros.",
      "3.3. Manter o nível de ruído mínimo, sendo vedado o uso de áudio e vídeo sem fones nas áreas compartilhadas.",
      "3.4. Não sublocar, ceder ou transferir o espaço ou os serviços, de natureza pessoal e intransferível.",
      "3.5. Não modificar a finalidade de uso do espaço de coworking.",
      "3.6. Responsabilizar-se integralmente por colaboradores ou assistentes que trouxer, incluindo obrigações trabalhistas e o cumprimento das normas internas.",
      "3.7. Fica proibida a utilização do espaço para fins ilícitos, contrários à lei ou que violem a moral e os bons costumes.",
      "3.8. Fica proibida a utilização do espaço após o horário contratado, sob pena de pagamento de hora adicional excedida acrescida de 50%.",
      "3.9. Filmagens ou fotografias no espaço dependem de prévio e expresso consentimento da CONTRATADA.",
      "3.10. A CONTRATANTE é responsável pelo uso e zelo dos bens e equipamentos, devendo indenizar a CONTRATADA pela má utilização.",
      "3.11. A CONTRATANTE poderá utilizar nome, marca e imagens do espaço para divulgar suas atividades, desde que previamente acordado; usos que extrapolem o ajustado dependem de prévia autorização.",
    ]},
    { t: "CLÁUSULA QUARTA – DA LIMITAÇÃO DE RESPONSABILIDADE E DO ENDEREÇO FISCAL", p: [
      "4.1. A CONTRATADA não possui responsabilidade sobre a atividade profissional da CONTRATANTE; a responsabilidade civil e criminal pelos serviços, inclusive aos seus clientes/pacientes, cabe integralmente à CONTRATANTE.",
      "4.2. Caso a CONTRATADA seja processada por clientes/pacientes da CONTRATANTE, caberá a esta solicitar a imediata exclusão da CONTRATADA do polo passivo e ressarcir os prejuízos.",
      "4.3. É de responsabilidade da CONTRATANTE obter e manter licenças, alvarás, registros em conselhos de classe e autorizações necessárias para sua atividade.",
      "4.4. A CONTRATADA não se responsabiliza pela guarda de bens ou pertences deixados pela CONTRATANTE ou seus pacientes/clientes.",
      "4.5. Não faz parte deste instrumento o aluguel de endereço fiscal, nem serviços contábeis, financeiros, jurídicos ou legais.",
    ]},
    { t: "CLÁUSULA QUINTA – DA INEXISTÊNCIA DE VÍNCULO", p: [
      "5.1. A CONTRATANTE fica ciente da inexistência de responsabilidade solidária ou subsidiária da CONTRATADA.",
      "5.2. O contrato não gera qualquer vínculo diverso do objeto; ficam excluídas responsabilidades decorrentes de relações entre a CONTRATANTE e terceiros.",
      "5.3. Não há vínculo de emprego entre a CONTRATANTE e a CONTRATADA ou seus prepostos, por ausência dos requisitos do art. 3º da CLT, especialmente a subordinação.",
    ]},
    { t: "CLÁUSULA SEXTA – DA RESCISÃO", p: [
      "6.1. O presente contrato tem validade pelo período de uso do espaço de coworking pela CONTRATANTE.",
      "6.2. Será rescindido automaticamente em caso de incêndio, desapropriação, falência de qualquer das partes ou infração contratual.",
    ]},
    { t: "CLÁUSULA SÉTIMA – DA MULTA POR INFRAÇÃO", p: [
      "7.1. Em caso de infração contratual pela CONTRATANTE, esta pagará multa de 30% da soma do valor da prestação de serviços, sem prejuízo das perdas e danos.",
    ]},
    { t: "CLÁUSULA OITAVA – DA NÃO EXCLUSIVIDADE", p: [
      "8.1. O contrato não importa em exclusividade; a CONTRATADA pode prestar os mesmos serviços a terceiros, e a CONTRATANTE pode atuar em outros locais.",
    ]},
    { t: "CLÁUSULA NONA – CONFIDENCIALIDADE E LGPD", p: [
      "9.1. O contrato e as informações aqui tratadas são de natureza confidencial, devendo ser respeitada a Lei Geral de Proteção de Dados, sob pena das sanções aplicáveis.",
    ]},
    { t: "CLÁUSULA DÉCIMA – DO FORO", p: [
      "10.1. As partes elegem o foro da Comarca de Sorocaba/SP para dirimir quaisquer questões oriundas deste contrato.",
    ]},
  ],
};

export const REGULATION = {
  title: "REGULAMENTO INTERNO DE USO – ESPAÇO DE SAÚDE VIDAH PRIME COWORKING",
  sections: [
    { t: "1. OBJETIVO", p: [
      `Este Regulamento estabelece as normas de uso, segurança, higiene e convivência no coworking da ${ENTITY.name}, CNPJ ${ENTITY.cnpj}, na ${ENTITY.address}, CEP ${ENTITY.cep}, sendo parte integrante do Contrato de Prestação de Serviços firmado com o CONTRATANTE.`,
      "Sua observância é obrigatória para o CONTRATANTE, seus colaboradores e pacientes/clientes.",
    ]},
    { t: "2. HORÁRIO DE FUNCIONAMENTO", p: [
      "De segunda a sexta-feira, das 09h00 às 19h00, e aos sábados, das 08h00 às 12h00.",
      "O acesso fora desses horários deve ser previamente autorizado e não contará com equipe de recepção e limpeza.",
      "Não é permitida a entrada de pessoas estranhas ao espaço sem autorização; o CONTRATANTE ou seus dependentes deverão acompanhá-las durante toda a permanência, assumindo total responsabilidade.",
      "Os meios de acesso fornecidos são individuais e intransferíveis, sob custódia e responsabilidade do CONTRATANTE.",
    ]},
    { t: "3. NORMAS DE HIGIENE E BIOSSEGURANÇA (ESPECÍFICO PARA SAÚDE)", p: [
      "Responsabilidade Sanitária: cada CONTRATANTE é responsável técnico pelos seus procedimentos, seguindo as normas da ANVISA, do Conselho Federal de sua profissão e da Vigilância Sanitária local.",
      "Descarte de Resíduos: obrigatório o correto descarte de resíduos de saúde, com recipientes específicos para lixo infectante, comum e perfurocortante.",
      "EPIs: o uso de Equipamentos de Proteção Individual é obrigatório durante os atendimentos, sendo de responsabilidade do CONTRATANTE.",
      "Esterilização: o CONTRATANTE é responsável pela esterilização de seus instrumentais. A CONTRATADA oferece o espaço do CME e técnica para operar a autoclave; o CONTRATANTE deve lavar, secar e embalar seus instrumentais, devidamente identificados com seu nome.",
      "Assepsia: os locais de atendimento devem ser mantidos em rigoroso estado de assepsia e organização entre um paciente e outro.",
    ]},
    { t: "4. USO DAS ÁREAS", p: [
      "Salas de Atendimento: uso exclusivo para fins profissionais e dentro dos horários agendados. É vedada a realização de refeições nas salas e consultórios.",
      "Recepção e Sala de Espera: uso comum. O CONTRATANTE deve orientar seus pacientes a aguardar no local com comportamento discreto.",
      "Copa: destinada a pequenas refeições, mantendo o local limpo e organizado.",
    ]},
    { t: "5. CONDUTA E CONVIVÊNCIA", p: [
      "Ruído: manter o tom de voz baixo; uso discreto de celulares.",
      "Pacientes/clientes: o CONTRATANTE é integralmente responsável pela conduta de seus pacientes e acompanhantes.",
      "Aparência: uso de vestimentas adequadas ao ambiente de saúde.",
      "Colaboradores: os funcionários do espaço devem ser respeitados e não desempenharão trabalhos particulares para contratantes.",
    ]},
    { t: "6. PROIBIÇÕES GERAIS", p: [
      "É proibido: fumar em qualquer ambiente; entrada de animais (exceto cães-guia autorizados); consumo de bebidas alcoólicas; deixar pertences nas áreas comuns após o uso; afixar cartazes não autorizados; usar imagens e direitos autorais do estabelecimento sem autorização; deixar utensílios particulares em áreas comuns (a CONTRATADA pode descartá-los); usar cópias não autorizadas de softwares; acessar em trajes inadequados; e realizar atividade ilícita ou que atente à moral e aos bons costumes.",
    ]},
    { t: "7. REGRAS DE USO DE INTERNET", p: [
      "Não é permitido: instalar aparelhos de rede sem autorização escrita; instalar aparelhos de alto consumo de energia (acima de 0,6 kVA) sem estudo técnico; invadir a privacidade ou o sistema; acessar/copiar arquivos ou senhas de terceiros; disseminar vírus; ou transmitir conteúdos ilícitos.",
    ]},
    { t: "8. SEGURANÇA", p: [
      "A unidade possui câmeras e monitoramento das áreas comuns, cujas imagens são de uso exclusivo da CONTRATADA e não cedidas ao CONTRATANTE.",
      "A CONTRATADA não é responsável pela segurança de dados do CONTRATANTE, que deve tomar as medidas de proteção e backup.",
    ]},
    { t: "9. SERVIÇOS", p: [
      "A internet depende das operadoras, não sendo a CONTRATADA responsável por indisponibilidades, e há limite máximo de banda por CONTRATANTE conforme contrato.",
    ]},
    { t: "10. TRATAMENTO DOS FUNCIONÁRIOS", p: [
      "É vedado, durante a vigência e por até um ano após o término, solicitar ou oferecer emprego aos funcionários da CONTRATADA.",
      "Não é permitido assédio moral, desrespeito verbal ou intimidação aos funcionários, sob pena de responsabilização cível e criminal.",
    ]},
    { t: "11. PENALIDADES", p: [
      "O descumprimento sujeitará a advertência e, em caso de reincidência ou falta grave, à rescisão imediata do contrato, sem prejuízo de multas e indenizações por danos.",
    ]},
  ],
};

// Referência jurídica da assinatura eletrônica.
export const LEGAL_BASIS = "Assinatura eletrônica com validade jurídica (MP 2.200-2/2001 e Lei 14.063/2020).";
