import styles from './Manual.module.css'

const secoes = [
  {
    id: 'apresentacao',
    titulo: '1. Apresentação do Portal DSR',
    texto:
      'O Portal DSR é uma ferramenta interna para consulta, visualização e acompanhamento de informações relacionadas aos instrumentos de repasse do Departamento de Saneamento Rural e de Pequenos Municípios.',
  },
  {
    id: 'navegacao',
    titulo: '2. Como navegar pelo portal',
    texto:
      'A navegação é feita pelo menu lateral. Nele, o usuário pode acessar o Menu Inicial, a Carteira DSR, o Mapa Interativo e este Manual do Usuário.',
  },
  {
    id: 'carteira',
    titulo: '3. Carteira DSR',
    texto:
      'A Carteira DSR apresenta uma visão consolidada dos instrumentos de repasse, com indicadores, gráficos, filtros, tabela detalhada e opções de exportação.',
  },
  {
    id: 'mapa',
    titulo: '4. Mapa Interativo',
    texto:
      'O Mapa Interativo permite consultar informações territoriais por meio de camadas geográficas, visualização de limites, localidades, endereços e dados municipais.',
  },
  {
    id: 'atualizacao',
    titulo: '5. Atualização dos dados',
    texto:
      'As informações exibidas no portal dependem da atualização das bases utilizadas pelo Departamento. A periodicidade e a data de referência devem ser confirmadas pela área responsável.',
  },
  {
    id: 'duvidas',
    titulo: '6. Dúvidas frequentes',
    texto:
      'Esta seção reunirá orientações sobre filtros, exportação de dados, ausência de resultados, falhas de carregamento e uso das principais ferramentas.',
  },
  {
    id: 'glossario',
    titulo: '7. Glossário básico',
    texto:
      'Esta seção explicará os principais termos utilizados no portal, como instrumento, valor global, repasse, contrapartida, empenhado, desembolsado e carteira ativa.',
  },
]

export default function Manual() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Portal DSR</span>
        <h1>Manual do Usuário</h1>
        <p>
          Guia prático para orientar servidores no uso das ferramentas do Portal DSR.
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.summary}>
          <h2>Conteúdo</h2>

          <nav>
            {secoes.map((secao) => (
              <a key={secao.id} href={`#${secao.id}`}>
                {secao.titulo.replace(/^\d+\.\s*/, '')}
              </a>
            ))}
          </nav>
        </aside>

        <main className={styles.content}>
          {secoes.map((secao) => (
            <section key={secao.id} id={secao.id} className={styles.section}>
              <h2>{secao.titulo}</h2>
              <p>{secao.texto}</p>

              <div className={styles.placeholder}>
                <strong>Conteúdo em elaboração</strong>
                <span>
                  Esta seção será detalhada com orientações passo a passo, imagens da tela e exemplos de uso.
                </span>
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}