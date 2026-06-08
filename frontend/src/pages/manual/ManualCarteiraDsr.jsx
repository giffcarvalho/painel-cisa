import styles from './Manual.module.css'
import tutFiltros from '../../assets/tutFiltros.mp4'
import indicadoresCarteiraDsr from '../../assets/indicadoresCarteiraDsr.png'

const topicIds = {
  'Objetivo da ferramenta': 'objetivo-da-ferramenta',
  Indicadores: 'indicadores',
  Filtros: 'filtros',
  Gráficos: 'graficos',
  'Tabela detalhada': 'tabela-detalhada',
  Exportação: 'exportacao',
}

export default function ManualCarteiraDsr() {
  return (
    <main className={styles.detailPage}>
      <section className={styles.contentCard}>
        <h2>Carteira DSR</h2>
        <p>
        
        </p>

        <div className={styles.topicStack}>
          <section id={topicIds['Objetivo da ferramenta']} className={styles.manualTopic}>
            <h3>Objetivo da Ferramenta</h3>
            <p>A Carteira DSR reúne informações consolidadas sobre os instrumentos de repasse vinculados ao Departamento de Saneamento Rural e de Pequenos Municípios.
              A ferramenta foi desenvolvida para apoiar o acompanhamento e a análise dos investimentos, permitindo consultar dados financeiros, quantitativos e territoriais em um
              ambiente único.
            </p>
            <p>
              Por meio dos indicadores, filtros, gráficos e tabelas disponíveis, é possível explorar diferentes recortes dos dados e obter uma visão geral da execução e distribuição dos 
              recursos.
            </p>
          </section>

          <section id={topicIds.Filtros} className={styles.manualTopic}>
            <h3>Filtros</h3>
            <p>
              Os filtros permitem refinar a visualização dos dados de acordo com critérios específicos. Ao selecionar um ou mais filtros, todos os indicadores, gráficos e tabelas da página
              são atualizados automaticamente para refletir apenas as informações correspondentes ao recorte escolhido.  Essa funcionalidade possibilita análises mais detalhadas e comparações
              entre diferentes grupos de dados.
            </p>
            <figure className={styles.videoBlock}>
              <video className={styles.tutorialVideo}
                autoPlay
                muted
                loop
                playsInline
                controls
                aria-label="Demonstração da funcionalidade dos filtros">
                  <source src={tutFiltros} type="video/mp4" />
                  Seu navegador não suporta a reprodução de vídeo.
              </video>
              <figcaption className={styles.videoCaption}>
                Demonstração da aplicação de filtros.
              </figcaption>
            </figure>
          </section>

          <section id={topicIds.Indicadores} className={styles.manualTopic}>
            <h3>Indicadores</h3>
            <p>
              Os indicadores apresentam uma visão resumida dos pricipais dados da Carteira DSR. Essas informações permitem acompanhar rapidamente métricas consolidadas
              relacionadas aos isntrumentos cadastrados, municípios atendidos e valores envolvidos.
            </p>
            <p>
              Os valores exibidos são atualizados automaticamente de acordo com os filtros selecionados, refletindo apenas os dados correspondentes ao recorte definido pelo usuário.
            </p>
            <img src={indicadoresCarteiraDsr} alt="KPIs" className={styles.imageKpi}/>
          </section>

          <section id={topicIds.Gráficos} className={styles.manualTopic}>
            <h3>Gráficos</h3>
            <p>Conteúdo em elaboração.</p>
          </section>

          <section id={topicIds['Tabela detalhada']} className={styles.manualTopic}>
            <h3>Tabela Detalhada</h3>
            <p>Conteúdo em elaboração.</p>
          </section>

          <section id={topicIds.Exportação} className={styles.manualTopic}>
            <h3>Exportação</h3>
            <p>Conteúdo em elaboração.</p>
          </section>
        </div>
      </section>
    </main>
  )
}