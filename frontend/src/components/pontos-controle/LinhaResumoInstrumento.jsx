import React from 'react';
import { useDadosAdicionaisPontosControleQuery } from "../../hooks/usePontosControle";
import { formatDate, formatCurrency, emptyValue } from "../../utils/formatters";
import estilos from "./LinhaResumoInstrumento.module.css";

const PreviewField = ({ label, value, wide = false }) => (
  <div className={`${estilos.previewItem} ${wide ? estilos.previewItemWide : ''}`}>
    <dt>{label}</dt>
    <dd>{emptyValue(value)}</dd>
  </div>
);

export function LinhaResumoInstrumento({ nrInstrumento }) {
  
  const { data: dadosAdicionais, isLoading, isError } = useDadosAdicionaisPontosControleQuery(nrInstrumento);

  if (isLoading) {
    return (
      <tr className={estilos.previewRow}>
        <td colSpan={8}>Carregando resumo do instrumento...</td>
      </tr>
    );
  }

  if (isError) {
    return (
      <tr className={estilos.previewRow}>
        <td colSpan={8}>Não foi possível carregar os dados adicionais.</td>
      </tr>
    );
  }

  return (
    <tr className={estilos.previewRow}>
      <td colSpan={8}>
        <dl className={estilos.previewGrid}>
          <PreviewField label="Nº Proposta" value={dadosAdicionais?.nr_proposta} />
          <PreviewField label="Operação" value={dadosAdicionais?.operacao} />
          <PreviewField label="Cod. Saci" value={dadosAdicionais?.cod_tci} />
          <PreviewField label="Nº Seleção PAC" value={dadosAdicionais?.nr_proposta_selecao_pac} />
          <PreviewField label="Tipo" value={dadosAdicionais?.tipo_instrumento} />
          <PreviewField label="Ação orçamentária" value={dadosAdicionais?.acao_orcamentaria} />
          <PreviewField label="Componente" value={dadosAdicionais?.componente} />
          <PreviewField label="Vigência" value={formatDate(dadosAdicionais?.dia_fim_vigenc_conv)} />
          <PreviewField label="Situação do instrumento" value={dadosAdicionais?.situacao_contrato} />
          <PreviewField label="Situação da obra" value={dadosAdicionais?.situacao_obra} />
          <PreviewField label="Valor de Repasse" value={formatCurrency(dadosAdicionais?.valor_repasse)} />
          <PreviewField label="Valor Contrapartida" value={formatCurrency(dadosAdicionais?.valor_contrapartida)} />
          <PreviewField label="Valor empenhado" value={formatCurrency(dadosAdicionais?.valor_empenhado)} />
          <PreviewField label="Valor desembolsado" value={formatCurrency(dadosAdicionais?.valor_desembolsado)} />
          <PreviewField label="Valor desbloqueado" value={formatCurrency(dadosAdicionais?.valor_desbloqueado)} />
          <PreviewField label="Valor pago" value={formatCurrency(dadosAdicionais?.valor_pago)} />
          <PreviewField label="% Físico informado" value={dadosAdicionais?.percentual_fisico_informado} />
          <PreviewField label="% Físico aferido" value={dadosAdicionais?.percentual_fisico_aferido} />
          <PreviewField label="Data últmio BM" value={formatDate(dadosAdicionais?.data_ultimo_bm)} />
        </dl>
      </td>
    </tr>
  );
}