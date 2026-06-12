import sharedStyles from './Manual.module.css'
import styles from './ManualInformacoesGerais.module.css'

const topicIds = {
  'Sobre os dados': 'sobre-os-dados',
  'Atualização das informações': 'atualizacao-das-informacoes',
  'Filtros e resultados': 'filtros-e-resultados',
  'Exportação dos dados': 'exportacao-dos-dados',
  'Glossário básico': 'glossario'
}

export default function ManualInformacoesGerais() {
  return (
    <main className={sharedStyles.detailPage}>
      <section className={sharedStyles.contentCard}>
        <h2>Informações Gerais</h2>
        <p>
          Esta seção reúne informações complementares para auxiliar a leitura das informações exibidas no Portal DSR. As ferramentas do portal utilizam nossas bases de dados
        institucionais e apresentam os resultados conforme os filtros, recortes e parâmetros disponíveis em cada página.          
        </p>

        <div className={styles.topicStack}>
          <section className={styles.manualTopic} id={topicIds['Sobre os dados']}>
            <h3>Sobre os dados exibidos</h3>
            <p>
              As informações apresentadas no portal dependem das bases utilizadas pelo Deprtamento e dos critérios definidos para cada ferramenta. Por isso, os números,
              mapas, gráficos e tabelas devem ser interpretados de acordo com o contexto da página consultada e com os filtros aplicados no momento da análise.
            </p>
            <p>
              Em alguns casos, diferentes páginas podem apresentar recortes distintos de uma mesma base, de acordo com o objetivo da ferramenta. Dessa forma, recomenda-se
              observar sempre o título da seção, os filtros selecionados e a data referência dos dados, quando disponível.
            </p>
          </section>

          <section className={styles.manualTopic} id={topicIds['Atualização das informações']}>
            <h3>Atualização das informações</h3>
            <p>
              A atualização dos dados depende da rotina de tratamento, validação e disponibilização das bases utilizadas. Caso seja necessário utilizar as informações em
              relatórios, apresentações ou análises oficiais, recomenda-se confirmar a data de referência. 
            </p>
          </section>

          <section className={styles.manualTopic} id={topicIds['Filtros e resultados']}>
            <h3>Filtros e ausência de resultados</h3>
            <p>
              Quando uma combinação de filtros não retorna resultados, pode indicar que não há registros disponíveis para o recorte selecionado. Também pode ocorrer de
              determinados filtros dependerem de outros critérios, como UF, município, tipo de instrumento, situação ou período de referência.
            </p>
            <p>
              Nesses casos, recomenda-se revisar os filtros aplicados, remover seleções muito específicas ou ampliar o recorte da consulta.
            </p>
          </section>
          
          <section className={styles.manualTopic} id={topicIds['Exportação dos dados']}>
            <h3>Exportação de dados</h3>
            <p>
              Algumas ferramentas do portal oferecem opções de exportação, permitindo salvar gráficos, tabelas ou dados em arquivos externos. Os arquivos exportados
              consideram os filtros aplicados no momento da exportação e refletem o recorte visualizado pelo usuário.
            </p>
            <p>
              A disponibilidade e o formato da exportação podem variar conforme a funcionalidade de cada página.
            </p>
           </section>

            <section className={`${styles.manualTopic} ${styles.manualTopicGloss}`} id={topicIds['Glossário básico']}>
              <h3>Glossário básico</h3>
              <h4>Camada</h4>
              <p>
                Conjunto de informações que pode ser exibido ou ocultado conforme a necessidade.
              </p>

              <h4>Pop-up</h4>
              <p>
                Pequena janela ou caixa de diálogo exibida na tela após interação, com o intuito de exibir um conteúdo específico.
              </p>

              <h4>Recorte de dados</h4>
              <p>
                Conjunto de informações resultantes dos filtros, seleções e critérios aplicados em uma consulta.
              </p>

              <h4>Filtros aplicados</h4>
              <p>
                Filtro que está efetivamente restringindo os dados exibidos na página.
              </p>

              <h4>Tabela paginada</h4>
              <p>
                Tabela dividida em páginas para facilitar o carregamento e a consulta dos registros.
              </p>
            </section>

        </div>
      </section>
    </main>
  )
}
