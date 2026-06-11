import sharedStyles from './Manual.module.css'
import styles from './ManualMapaInterativo.module.css'
import pagInicial from '../../assets/manual/pagInicial.png'
import visInteracao from '../../assets/manual/visInteracao.mp4'
import visReenquadro from '../../assets/manual/visReenquadro.mp4'
import visPopUp from '../../assets/manual/visPopUp.mp4'
import visFiltros from '../../assets/manual/visFiltros.mp4'
import visCamadas from '../../assets/manual/visCamadas.mp4'
import visLegenda from '../../assets/manual/visLegenda.png'

const topicIds = {
  'Objetivo da ferramenta': 'objetivo-da-ferramenta',
  'Navegação no mapa': 'navegacao-no-mapa',
  Filtros: 'filtros',
  Camadas: 'camadas',
  Legenda: 'legenda',
  'Interpretação dos dados': 'interpretacao-dos-dados',
}

export default function ManualMapaInterativo() {
  return (
    <main className={sharedStyles.detailPage}>
      <section className={sharedStyles.contentCard}>
        <h2>Mapa Interativo</h2>
        
        <div className={styles.topicStack}>
          <section id={topicIds['Objetivo da ferramenta']} className={styles.manualTopic}>
            <h3>Objetivo da Ferramenta</h3>
            <p>
              O Mapa Interativo permite visualizar informações territoriais, dados da Carteira DSR e indicadores municipais diretamente sobre o mapa. 
              A ferramenta auxilia na análise espacial dos dados, permitindo observar onde determinadas informações estão localizadas e como se distribuem no território.
            </p>
            <p>
              Por meio do mapa, é possível consultar limites territoriais, cidades, localidades, endereços, setores censitários, pontos relacionados à Carteira DSR e 
              informações municipais. A visualização pode ser ajustada com o uso de filtros, camadas e legenda, facilitando a análise conforme o recorte desejado.
            </p>
            <figure className={styles.imageFrame}>
              <img src={pagInicial} className={styles.image} alt="Apresentação da página inicial do mapa" />
            </figure>
            <p>
              A página é interativa. Isso significa que o usuário pode aproximar ou afastar o mapa, movimentar a área visualizada, selecionar filtros, ativar ou 
              desativar camadas e clicar em determinados pontos ou territórios para consultar informações complementares.
            </p>
          </section>

          <section id={topicIds['Navegação no Mapa']} className={styles.manualTopic}>
            <h3>Navegação no Mapa</h3>
            <p>
              A navegação no mapa funciona de forma semelhante a outros mapas digitais. Para movimentar a visualização, clique sobre o mapa e arraste para a direção 
              desejada. Para aproximar ou afastar, utilize a roda do mouse ou o gesto equivalente no dispositivo utilizado.
            </p>
            <p>
              Ao aproximar o mapa, algumas informações mais detalhadas passam a aparecer, como limites municipais, localidades, setores censitários, endereços ou outros 
              elementos disponíveis. Por isso, caso uma informação esteja ativada, mas não apareça imediatamente, aproxime o mapa para verificar se ela depende de um nível
              maior de zoom.
            </p>
            <figure className={styles.videoBlock}>
              <video className={`${styles.tutorialVideo} ${styles.tutorialVideoMapa}`}
              autoPlay
              loop
              muted
              playsInline
              controls
              aria-label='Demonstração de interação com o mapa'>
                <source src={visInteracao} type="video/mp4" />
                Seu navegador não suporta a reprodução de vídeo.
              </video>
              <figcaption className={styles.videoCaption}>
                Demonstração de interação com o mapa.
              </figcaption>
            </figure>
            <p>
              Também é possível que o mapa seja reposicionado automaticamente após a seleção de alguns filtros, como UF, município, proposta ou instrumento. Nesses casos,
              a ferramenta ajusta a visualização para destacar o território ou o registro selecionado.
            </p>
            <figure className={styles.videoBlock}>
              <video className={`${styles.tutorialVideo} ${styles.tutorialVideoMapa}`}
              autoPlay
              loop
              muted
              playsInline
              controls
              aria-label='O mapa é reenquadrado automaticamente conforme os filtros aplicados.'>
                <source src={visReenquadro} type="video/mp4" />
              </video>
              <figcaption className={styles.videoCaption}>
                O mapa é reenquadrado automaticamente conforme os filtros aplicados.
              </figcaption>
            </figure>
            <p>
              Em determinadas camadas, o clique sobre um ponto ou território abre uma janela com informações adicionais. Essa consulta pode apresentar dados como município, 
              localidade, tipo de registro, proposta, instrumento, objeto ou link relacionado, conforme a camada selecionada.
            </p>
            <p>
              Nem todos os elementos do mapa possuem janela de consulta por clique. Quando não houver informação adicionar configurada para determinada camada, o clique poderá
              não abrir nenhum detalhe.
            </p>
            <figure className={styles.videoBlock}>
              <video className={`${styles.tutorialVideo} ${styles.tutorialVideoMapa}`}
              autoPlay
              muted
              loop
              controls
              playsInline
              aria-label='Pop-up com informações do instrumento de repasse selecionado.'>
                <source src={visPopUp} type="video/mp4" />
              </video>
              <figcaption className={styles.videoCaption}>
                Pop-up com informações do instrumento de repasse selecionado.
              </figcaption>
            </figure>
            <p>
              A escala exibida no mapa auxilia na noção de distância e dimensão territorial da área visualizada.
            </p>
          </section>

          <section id={topicIds['Filtros']} className={styles.manualTopic}>
            <h3>Filtros</h3>
            <p>
              O botão Filtrar abre o painel de filtros do Mapa Interativo. Os filtros permitem restringir as informações exibidas no mapa de acordo com o recorte desejado, 
              como UF, município, localidade, número da proposta ou número do instrumento.
            </p>
            <p>
              Os filtros são opcionais e podem ser utilizados conforme a necessidade da consulta. Não é necessário clicar em um botão de confirmação: ao selecionar uma opção,
              o mapa é atualizado automaticamente.
            </p>
            <p>
              Alguns filtros dependem de seleções anteriores. Por exemplo, a escolha de uma UF pode restringir a lista de municípios disponíveis. Da mesma forma, ao selecionar 
              um município, podem aparecer opções mais específicas, como localidades vinculadas àquele território.
            </p>
            <figure className={`${styles.videoBlock} ${styles.videoBlockRetrato}`}>
              <video className={`${styles.tutorialVideo} ${styles.tutorialVideoRetrato}`}
              autoPlay
              muted
              loop
              controls
              playsInline
              aria-label='Os filtros se ajustam automaticamente conforme as seleções aplicadas.'>
                <source src={visFiltros} type="video/mp4" />
              </video>
              <figcaption className={styles.videoCaption}>
                Os filtros se ajustam automaticamente conforme as seleções aplicadas.
              </figcaption>
            </figure>
            <p>
              Para remover uma seleção, utilize o botão de limpeza disponível no próprio campo. Para retirar todos os filtros aplicados, utilize a opção Limpar Filtros, localizada
              no canto inferior do painel.
            </p>
            <p>
              Antes de interpretar o mapa, verifique sempre quais filtros estão ativos, pois eles definem o recorte das informações exibidas.
            </p>
          </section>

          <section id={topicIds['Camadas']} className={styles.manualTopic}>
            <h3>Camadas</h3>
            <p>
              As camadas são conjuntos de informações que podem ser exibidos sobre o mapa. Funcionam como informações sobrepostas, permitindo escolher quais dados devem aparecer
              na visualização.
            </p>
            <p>
              O botão Camadas abre o painel onde é possível ativar ou desativar diferentes tipos de informação, como limites estaduais, limites municipais, cidades, distritos, 
              setores censitários, endereços, localidades, pontos da Carteira DSR e informações municipais.
            </p>
            <p>
              Para exibir uma camada, mantenha a caixa correspondente marcada. Para ocultá-la, desmarque a opção. A visualização do mapa e a legenda podem mudar conforme as 
              camadas ativas.
            </p>
            <p>
              Algumas camadas só aparecem quando o mapa está suficientemente aproximado. Assim, uma camada pode estar marcada no painel, mas ainda não estar visível na tela. 
              Nesse caso, aproxime o mapa para visualizar as informações detalhadas.
            </p>
            <p>
              A camada Informações Municipais permite colorir os municípios de acordo com uma variável selecionada. Após ativar essa camada, escolha o indicador desejado para 
              visualizar sua distribuição no mapa.
            </p>
            <figure className={styles.videoBlock}>
              <video className={`${styles.tutorialVideo} ${styles.tutorialVideoMapa}`}
              autoPlay
              muted
              loop
              playsInline
              controls
              aria-label='O menu de camadas permite selecionar quais informações devem ficar visíveis no mapa.'>
                <source src={visCamadas} type="video/mp4" />
              </video>
              <figcaption className={styles.videoCaption}>
                O menu de camadas permite selecionar quais informações devem ficar visíveis no mapa.
              </figcaption>
            </figure>
          </section>

          <section id={topicIds['Legenda']} className={styles.manualTopic}>
            <h3>Legenda</h3>
            <p>
              A legenda apresenta o significado das cores, linhas e pontos exibidos no mapa. Ela ajuda o usuário a interpretar corretamente as informações visíveis na tela.
            </p>
            <p>
              A legenda é atualizada conforme as camadas ativadas, o nível de aproximação do mapa e o indicador municipal selecionado. Por isso, seu conteúdo pode mudar 
              durante a navegação.
            </p>
            <p>
              Nos indicadores municipais, as cores representam faixas de valores. Para interpretar corretamente o mapa, observe sempre os intervalos numéricos indicados na 
              legenda, e não apenas a cor apresentada.
            </p>
            <p>
              A legenda é apenas informativa. Seus itens não são clicáveis, mas servem como referência para compreender o que está sendo exibido no mapa naquele momento.
            </p>
            <p>
              Antes de comparar municípios ou interpretar diferenças entre territórios, confira a legenda correspondente à camada ou indicador selecionado.
            </p>
            <figure className={styles.imageFrame}>
              <img src={visLegenda} alt="A legenda apresenta o significado das cores e símbolos utilizados no mapa." className={styles.image} />
              <figcaption className={styles.imageCaption}>
                A legenda apresenta o significado das cores e símbolos utilizados no mapa.
              </figcaption>
            </figure>
          </section>
        </div>
      </section>
    </main>
  )
}

