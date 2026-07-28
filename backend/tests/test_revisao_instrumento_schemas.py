import unittest

from pydantic import ValidationError

from app.schemas.revisao_instrumento import ObraSaneamentoRevisaoAlteracao


class ObraSaneamentoRevisaoAlteracaoTest(unittest.TestCase):
    def criar_obra(self, relacao_instrumento, confirmacao_status):
        return ObraSaneamentoRevisaoAlteracao(
            id_obra="obra-1",
            cod_municipio=5300108,
            relacao_instrumento=relacao_instrumento,
            confirmacao_status=confirmacao_status,
        )

    def test_aceita_todas_as_combinacoes_validas(self):
        combinacoes = [
            ("nao_analisada", "nao_confirmada"),
            ("sem_conflito_aparente", "nao_confirmada"),
            ("sem_conflito_aparente", "sem_conflito"),
            ("possivel_sobreposicao", "nao_confirmada"),
            ("possivel_sobreposicao", "sobreposicao_confirmada"),
        ]

        for relacao, confirmacao in combinacoes:
            with self.subTest(relacao=relacao, confirmacao=confirmacao):
                obra = self.criar_obra(relacao, confirmacao)
                self.assertEqual(obra.relacao_instrumento, relacao)
                self.assertEqual(obra.confirmacao_status, confirmacao)

    def test_rejeita_todas_as_combinacoes_incompativeis(self):
        combinacoes = [
            ("nao_analisada", "sem_conflito"),
            ("nao_analisada", "sobreposicao_confirmada"),
            ("sem_conflito_aparente", "sobreposicao_confirmada"),
            ("possivel_sobreposicao", "sem_conflito"),
        ]

        for relacao, confirmacao in combinacoes:
            with self.subTest(relacao=relacao, confirmacao=confirmacao):
                with self.assertRaisesRegex(
                    ValidationError, "confirmacao_status incompatível"
                ):
                    self.criar_obra(relacao, confirmacao)

    def test_aplica_default_de_confirmacao(self):
        obra = ObraSaneamentoRevisaoAlteracao(
            id_obra="obra-1",
            relacao_instrumento="possivel_sobreposicao",
        )

        self.assertEqual(obra.confirmacao_status, "nao_confirmada")

if __name__ == "__main__":
    unittest.main()
