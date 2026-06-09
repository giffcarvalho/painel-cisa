import sharedStyles from './Manual.module.css'
import styles from './ManualCarteiraDsr.module.css'
import tutFiltros from '../../assets/tutFiltros.mp4'
import indicadoresCarteiraDsr from '../../assets/indicadoresCarteiraDsr.png'
import visGraficos from '../../assets/visGraficos.png'
import visGraficoBarra from '../../assets/visGraficoBarra.mp4'
import visGraficoMapa from '../../assets/visGraficoMapa.mp4'
import visTabelaDet from '../../assets/visTabelaDet.mp4'
import visExport from '../../assets/visExport.mp4'

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
    <main className={sharedStyles.detailPage}>
      <section className={sharedStyles.contentCard}>
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
            <figure className={styles.imageKpiFrame}>
              <img src={indicadoresCarteiraDsr} alt="KPIs" className={styles.imageKpi}/>
            </figure>
          </section>

          <section id={topicIds.Gráficos} className={styles.manualTopic}>
            <h3>Gráficos</h3>
            <p>
              Os gráficos apresentam representações visuais dos dados da Carteira DSR, facilitando a identificação de padrões, distribuições e comparações
              entre diferentes grupos de informações. Eles permitem visualizar os dados sob diferentes perspectivas, contribuindo para análises mais rápidas e intuitivas.
            </p>

            <figure className={styles.imageGraphFrame}>
              <img src={visGraficos} className={styles.imageGraph} alt="Visualização dos gráficos da Carteira DSR" />
            </figure>
            
            <p>
              Os gráficos são interativos e respondem automaticamente aos filtros aplicados na página. Além disso, é possível utilizar os itens da legenda para ocultar
              ou exibir categorias específicas, ajustando a visualização conforme a necessidade da análise.
            </p>

            <div className={styles.graphVideoGrid}>
              <figure className={`${styles.videoBlock} ${styles.graphVideoBlock}`}>
                <video className={`${styles.tutorialVideo} ${styles.graphVideo}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  aria-label="Demonstração da interação com o gráfico de barras"
                >
                  <source src={visGraficoBarra} type="video/mp4" />
                  Seu navegador não suporta a reprodução de vídeo.
                </video>

                <figcaption className={styles.videoCaption}>
                  Demonstração da interação com o gráfico de barras.
                </figcaption>
              </figure>

              <figure className={`${styles.videoBlock} ${styles.graphVideoBlock}`}>
                <video className={`${styles.tutorialVideo} ${styles.graphVideo}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  aria-label="Demonstração da visualização geográfica no mapa"
                >
                  <source src={visGraficoMapa} type="video/mp4" />
                  Seu navegador não suporta a reprodução de vídeo.
                </video>

                <figcaption className={styles.videoCaption}>
                  Demonstração da visualização geográfica no mapa.
                </figcaption>
              </figure>
            </div>
          </section>

          <section id={topicIds['Tabela detalhada']} className={styles.manualTopic}>
            <h3>Tabela Detalhada</h3>
            <p>
              Para otimizar o carregamento e a navegação, a tabela permanece recolhida por padrão. Quando necessário, basta utilizar a opção "Exibir Tabela" para gerar e
              visualizar os dados. A tabela pode ser contultada tanto com filtros aplicados quanto sem filtros, refletindo o recorte de dados atualmente selecionado.
            </p>
            <p>
              A tabela detalhada apresenta os registros da Carteira DSR em formato tabular, permitindo consultar informações de forma mais específica e
              complementar às visualizações gráficas da página.
            </p>
            <figure className={styles.videoBlock}>
              <video className={`${styles.tutorialVideo} ${styles.tutorialVideoTable}`}
              autoPlay
              muted
              loop
              playsInline
              controls
              aria-label="Demonstração da interação com a tabela detalhada">
                <source src={visTabelaDet} type="video/mp4" />
                Seu navegador não suporta a reprodução de vídeo.
              </video>
              <figcaption className={styles.videoCaption}>
                Demonstrção de interação com a tabela detalhada.
              </figcaption>
            </figure>
          </section>

          <section id={topicIds.Exportação} className={styles.manualTopic}>
            <h3>Exportação</h3>
            <p>
              A funcionalidade de exportação permite salvar os dados e visualizações da Carteira DSR para utilização em relatórios, apresentações ou análises complementares.
            </p>
            <p>
              Os gráficos podem ser exportados como imagem ou em planilha Excel já formatada, preservando as informações correspondentes ao recorte de dados selecionado.
              A tabela detalhada pode ser exportada em formato Excel, permitindo consultar e tratamentos adicionais dos dados fora do portal.
            </p>
            <p>
              Todos os arquivos exportados consideram os filtros aplicados no momento da exportação.
            </p>
            <figure className={styles.videoBlock}>
              <video className={`${styles.tutorialVideo} ${styles.exportVideo}`}
              autoPlay
              muted
              loop
              playsInline
              controls
              aria-label="Demonstração de exportação dos dados.">
                <source src={visExport} type="video/mp4" />
              </video>
              <figcaption className={styles.videoCaption}>
                Demonstração de exportação dos dados.
              </figcaption>
            </figure>
          </section>
        </div>
      </section>
    </main>
  )
}
