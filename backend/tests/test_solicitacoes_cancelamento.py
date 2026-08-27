import inspect
import unittest

from pydantic import ValidationError

from app.api.revisao_instrumento import _label_status_historico
from app.schemas.aplicacao_revisoes import SolicitacaoCancelamentoRequest
from app.services.aplicacao_revisoes import (
    aprovar_solicitacao_cancelamento,
    cancelar_aplicacao,
    listar_solicitacoes_cancelamento,
    rejeitar_solicitacao_cancelamento,
    solicitar_cancelamento,
)


class SolicitacaoCancelamentoContratoTest(unittest.TestCase):
    def setUp(self):
        self.fonte = inspect.getsource(solicitar_cancelamento)

    def test_autor_da_revisao_aplicada_consegue_solicitar(self):
        self.assertIn('revisao["id_usuario"] != usuario.id_usuario', self.fonte)

    def test_outro_tecnico_nao_consegue_solicitar(self):
        self.assertIn("Você só pode solicitar", self.fonte)
        self.assertIn("status_code=403", self.fonte)

    def test_motivo_vazio_e_rejeitado(self):
        with self.assertRaises(ValidationError):
            SolicitacaoCancelamentoRequest(motivo_solicitacao="   ")

    def test_execucao_sucesso_e_validacao_existente_sao_exigidas(self):
        self.assertIn('revisao["status_execucao"] != "sucesso"', self.fonte)
        self.assertIn("await validar_cancelamento(db, id_execucao)", self.fonte)

    def test_cancelado_falha_e_processamento_nao_passam(self):
        self.assertIn("Somente uma aplicação concluída com sucesso", self.fonte)

    def test_solicitacao_pendente_duplicada_e_impedida(self):
        self.assertIn("status = 'pendente'", self.fonte)
        self.assertIn("Já existe uma solicitação de cancelamento pendente", self.fonte)

    def test_rejeitada_anterior_nao_bloqueia_nova(self):
        self.assertNotIn("status = 'rejeitada'", self.fonte)

    def test_listagem_consulta_tabela_e_prioriza_pendentes(self):
        fonte = inspect.getsource(listar_solicitacoes_cancelamento)
        self.assertIn("tb_solicitacao_cancelamento_aplicacao", fonte)
        self.assertIn("ORDER BY (s.status = 'pendente') DESC", fonte)


class RespostaAdministrativaTest(unittest.TestCase):
    def test_aprovacao_chama_service_real_de_cancelamento(self):
        fonte = inspect.getsource(aprovar_solicitacao_cancelamento)
        self.assertIn("await cancelar_aplicacao", fonte)

    def test_cancelamento_e_aprovacao_estao_na_mesma_transacao(self):
        fonte = inspect.getsource(cancelar_aplicacao)
        self.assertIn("async with db.begin()", fonte)
        self.assertIn("SET status = 'aprovada'", fonte)
        self.assertLess(fonte.index("SET status = 'cancelado'"), fonte.index("SET status = 'aprovada'"))

    def test_falha_no_cancelamento_preserva_pendente(self):
        fonte = inspect.getsource(cancelar_aplicacao)
        self.assertIn("except HTTPException", fonte)
        self.assertIn("await db.rollback()", fonte)

    def test_rejeicao_nao_chama_cancelamento(self):
        fonte = inspect.getsource(rejeitar_solicitacao_cancelamento)
        self.assertNotIn("cancelar_aplicacao", fonte)
        self.assertIn("SET status = 'rejeitada'", fonte)

    def test_rejeicao_exige_observacao(self):
        fonte = inspect.getsource(rejeitar_solicitacao_cancelamento)
        self.assertIn("A observação da resposta é obrigatória", fonte)


class HistoricoCancelamentoTest(unittest.TestCase):
    def test_historico_retorna_aplicacao_cancelada(self):
        self.assertEqual(_label_status_historico(None, "cancelado"), "Aplicação cancelada")

    def test_historico_retorna_cancelamento_solicitado(self):
        self.assertEqual(_label_status_historico(None, "sucesso", "pendente"), "Cancelamento solicitado")


class InterfaceCancelamentoTest(unittest.TestCase):
    def _ler(self, caminho):
        from pathlib import Path
        return (Path(__file__).parents[2] / caminho).read_text(encoding="utf-8")

    def test_ficha_tecnica_tem_fluxo_e_estados(self):
        fonte = self._ler("frontend/src/components/revisao-instrumento/VisualizarRevisao.jsx") + self._ler("frontend/src/components/revisao-instrumento/ModalSolicitacaoCancelamento.jsx")
        for texto in ("Solicitar cancelamento da aplicação", "Cancelamento solicitado", "Solicitação de cancelamento rejeitada", "Aplicação cancelada"):
            self.assertIn(texto, fonte)

    def test_admin_tem_aba_aprovacao_e_rejeicao(self):
        pagina = self._ler("frontend/src/pages/admin/aplicacao-revisoes/AplicacaoRevisoes.jsx")
        componente = self._ler("frontend/src/components/aplicacao-revisoes/SolicitacoesCancelamento.jsx")
        self.assertIn("Solicitações de cancelamento", pagina)
        self.assertIn("Aprovar e cancelar aplicação", componente)
        self.assertIn("Rejeitar solicitação", componente)

    def test_reversao_nao_e_renderizada(self):
        fonte = self._ler("frontend/src/components/aplicacao-revisoes/ResultadoAplicacao.jsx")
        self.assertNotIn("Reversão do cancelamento", fonte)
        self.assertIn("desfazer_", fonte)

    def test_botoes_foram_movidos_e_badge_solto_removido(self):
        fonte = self._ler("frontend/src/pages/revisao-instrumento/RevisaoInstrumento.jsx")
        self.assertIn("Histórico de revisões", fonte)
        self.assertIn("Visualizar revisão nº", fonte)
        self.assertNotIn('<span className={styles.statusChip}>Revisão enviada</span>', fonte)

    def test_modal_pos_envio_pdf_e_pendencias(self):
        fonte = self._ler("frontend/src/pages/revisao-instrumento/RevisaoInstrumento.jsx")
        for texto in ("Revisão enviada com sucesso", "baixarFichaPublicoAlvo", "O que ainda falta revisar neste instrumento", "Visualizar revisão detalhada"):
            self.assertIn(texto, fonte)


if __name__ == "__main__":
    unittest.main()
