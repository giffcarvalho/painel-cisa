import sharedStyles from './Manual.module.css'
import styles from './ManualCarteiraDsr.module.css'
import tutFiltros from '../../assets/manual/tutFiltros.mp4'
import indicadoresCarteiraDsr from '../../assets/manual/indicadoresCarteiraDsr.png'
import visGraficos from '../../assets/manual/visGraficos.png'
import visGraficoBarra from '../../assets/manual/visGraficoBarra.mp4'
import visGraficoMapa from '../../assets/manual/visGraficoMapa.mp4'
import visTabelaDet from '../../assets/manual/visTabelaDet.mp4'
import visExport from '../../assets/manual/visExport.mp4'

const topicIds = {
  'Objetivo da ferramenta': 'objetivo-da-ferramenta',
  Filtros: 'filtros',
  Indicadores: 'indicadores',
  Gráficos: 'graficos',
  'Tabela detalhada': 'tabela-detalhada',
  Exportação: 'exportacao',
}

export default function ManualCarteiraDsr() {
  return (
    <main className={sharedStyles.detailPage}>
      <section className={sharedStyles.contentCard}>
        <h2>Carteira DSR</h2>

        <div className={styles.topicStack}>
          <section id={topicIds['Objetivo da ferramenta']} className={styles.manualTopic}>
            <h3>Objetivo da Ferramenta</h3>
            <p>
              A Carteira DSR reúne informações consolidadas sobre os instrumentos de repasse vinculados ao Departamento de Saneamento Rural e de Pequenos Municípios.
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
              Os filtros permitem refinar a visualização dos dados de acordo com critérios específicos. A seleção de filtros só é confirmada após o clique em Aplicar Filtros. 
              Essa funcionalidade possibilita análises mais detalhadas e comparações entre diferentes grupos de dados.
            </p>
            <p>
              O número exibido no botão Aplicar Filtros indica a quantidade de grupos de filtros ativos, e não necessariamente a quantidade total de opções selecionadas.
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
              Os indicadores apresentam uma síntese do recorte atualmente aplicado. Eles informam a quantidade de instrumentos, a quantidade de municípios beneficiados e os 
              principais valores financeiros relacionados aos instrumentos: valor global, repasse, contrapartida, empenhado, desembolsado e desbloqueado.
            </p>
            <p>
              As abreviações mi e bi indicam, respectivamente, milhões e bilhões de reais. Os valores apresentados nos indicadores mudam conforme os filtros aplicados.
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
              Os gráficos são interativos e respondem aos filtros aplicados na página. Além disso, é possível utilizar os itens da legenda para ocultar
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
            <p>
              Na visualização geográfica, os pontos indicam as sedes dos municípios beneficiados. Eles não representam, necessariamente, a localização exata das obras
              ou intervenções. Ao passar o cursor do mouse em cima dos pontos no mapa, as coordenadas são exibidas em um pop-up.
            </p>
          </section>

          <section id={topicIds['Tabela detalhada']} className={styles.manualTopic}>
            <h3>Tabela Detalhada</h3>
            <p>
              Para otimizar o carregamento e a navegação, a tabela permanece recolhida por padrão. Quando necessário, basta utilizar a opção "Exibir Tabela" para gerar e
              visualizar os dados. Ela apresenta os registros por páginas, com um limite de 50 itens por página, e possui rolagem para consulta das colunas.
              A tabela pode ser contultada tanto com filtros aplicados quanto sem filtros, refletindo o recorte de dados atualmente selecionado.
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
              A tabela detalhada pode ser exportada em formato Excel, permitindo consultar e tratamentos adicionais dos dados fora do portal. As exportações consideram os 
              filtros aplicados no momento da geração do arquivo.
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
