# Tipo de Localidade na revisão do instrumento

## Alterações

- Seletor pesquisável e limpável na nova coluna anterior a Observação, nas duas inclusões manuais e na edição administrativa. Pesquisa sem distinção de acentos ou maiúsculas, nomes com quebra de linha e lista com rolagem.
- As 28 opções e descrições integrais estão centralizadas em `frontend/src/utils/tiposLocalidade.js`. Os nomes foram comparados com as duas constraints do PostgreSQL: correspondência exata.
- `TipoLocalidadeSelect` reutiliza `react-select` e `Popover` do `radix-ui`, já instalados. O tooltip simples existente não atende ao posicionamento fora do contêiner com rolagem e à interação por toque; por isso, o popover fica restrito ao novo seletor. Descrições aparecem por interação no ícone, inclusive por foco de teclado, sem seleção acidental.
- A classificação participa do carregamento da base, payload, rascunho, reabertura, visualização, edição administrativa e clonagem de revisão devolvida. Não muda automaticamente a ação da localidade.
- Payload omitido conserva a classificação salva; na primeira inserção, recupera o valor definitivo. `null` explícito limpa. A aplicação grava `territorio.tb_comunidade_rural.tipo_localidade` para localidades mantidas, corrigidas ou adicionadas; remover o vínculo preserva o cadastro territorial.
- O histórico de aplicação registra o tipo anterior e o novo no JSON já existente. O cancelamento restaura o tipo e verifica conflitos com alterações posteriores. Históricos antigos continuam aceitos sem a nova chave.
- `calcular_completude` incorpora classificação ausente ao grupo existente de localidades. Cada localidade conta uma vez, mesmo faltando ação e tipo. A quantidade de ações revisadas permanece independente; a classificação não transforma uma ação em indefinida. Registros removidos ou de município removido não exigem classificação. A pendência alimenta Meu Painel e o progresso administrativo; não bloqueia salvar, enviar ou aplicar.
- Nenhuma migration, tabela, coluna, constraint, permissão ou dependência adicional foi criada.

## Arquivos desta implementação

Frontend:

- `frontend/src/utils/tiposLocalidade.js` — catálogo único.
- `frontend/src/components/revisao-instrumento/TipoLocalidadeSelect.jsx` — componente reutilizável.
- `frontend/src/components/revisao-instrumento/TipoLocalidadeSelect.module.css` — estilos isolados.
- `frontend/src/pages/revisao-instrumento/RevisaoInstrumento.jsx` — tabela, formulários e payload.
- `frontend/src/pages/revisao-instrumento/RevisaoInstrumento.module.css` — distribuição das colunas e formulário.
- `frontend/src/components/revisao-instrumento/VisualizarRevisao.jsx` — classificação na consulta histórica.
- `frontend/src/components/aplicacao-revisoes/DetalhesRevisao.jsx` — comparação administrativa.
- `frontend/src/components/aplicacao-revisoes/ModalEditarRevisao.jsx` — reedição do tipo.

Backend:

- `backend/app/schemas/revisao_instrumento.py` — campo opcional nos contratos.
- `backend/app/api/revisao_instrumento.py` — consultas, persistência, reabertura e completude.
- `backend/app/schemas/aplicacao_revisoes.py` — contratos administrativos.
- `backend/app/services/aplicacao_revisoes.py` — aplicação, histórico, cancelamento e contagens.
- `backend/app/services/devolutivas_revisao.py` — clonagem do atributo.
- `backend/app/api/meu_painel.py` — contabilização da alteração de tipo no resumo de rascunhos.
- `backend/app/services/admin_usuarios.py` — progresso considera a classificação pendente.
- `backend/tests/test_tipo_localidade.py` — regressões com unittest da biblioteca padrão.

As alterações locais anteriores foram preservadas, inclusive nos arquivos compartilhados com esta implementação.

## Verificações

- `npm run build`: aprovado; aviso de tamanho de bundles do projeto.
- ESLint nos arquivos JavaScript/JSX envolvidos: aprovado.
- `npm run lint`: 23 erros e 18 avisos em outros arquivos; não foram corrigidos fora deste escopo.
- `python -m unittest discover -s tests -v`, no backend: 15 testes aprovados. Cobrem conferência independente, deduplicação, tipo opcional no contrato de envio, removidas, inclusão manual, campo omitido versus `null`, aplicação com Manter, reversão, conflito posterior e clonagem de devolutiva.
- Compilação Python dos módulos do backend: aprovada.
- PostgreSQL: três comandos de persistência validados por `EXPLAIN` sem `ANALYZE`; consultas de base, revisão salva e aplicação executadas.
- Integração transacional real: primeira gravação preserva tipo da base quando omitido; limpeza explícita é recuperada ao reabrir; aplicação com Manter altera só o tipo; cancelamento restaura; inclusão manual com e sem classificação grava e aplica. Rollback ao final, sem manter dados de teste.
- Navegador: busca `indigenas` encontra Povos indígenas; pesquisa sem resultados; nome longo com quebra; seleção e limpeza por teclado; foco no ícone abre descrição; clique no ícone preserva o valor selecionado. Inspeção adicional com os estilos da tabela identificou e corrigiu interferências dos estilos genéricos nos inputs internos.

## Limites da validação

O envio autenticado pela tela completa e sua tramitação por monitor/administrador não foram executados de ponta a ponta; os contratos, serviços de persistência e aplicação foram verificados separadamente. Não foram enviadas notificações nem aplicadas revisões reais permanentemente.

A coluna nullable, por si só, não registra se um `NULL` histórico anterior à funcionalidade foi deliberado. No banco consultado não havia revisão com tipo nulo sobre comunidade definitiva já classificada. A distinção entre omissão e limpeza é garantida nos novos payloads; revisões legadas devem ser reconferidas se a classificação da base for preenchida por outro fluxo antes da aplicação.
