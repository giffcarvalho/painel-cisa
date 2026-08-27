import unittest

from app.api.revisao_instrumento import calcular_completude
from app.schemas.revisao_instrumento import (
    LocalidadeRevisaoItem,
    MunicipioRevisaoItem,
    ObraSaneamentoRevisaoItem,
)


class CompletudeRevisaoInstrumentoTest(unittest.TestCase):
    def test_manifestacao_parcial_nao_exige_completude(self):
        municipio = MunicipioRevisaoItem(
            cod_municipio=1,
            localidades=[
                LocalidadeRevisaoItem(
                    cod_municipio=1,
                    cod_comunidade_rural=2,
                    acao_sugerida="corrigir",
                ),
                LocalidadeRevisaoItem(
                    cod_municipio=1,
                    cod_comunidade_rural=3,
                ),
            ],
        )

        resultado = calcular_completude([municipio], [])

        self.assertFalse(resultado["completa"])
        self.assertTrue(resultado["possui_manifestacao"])
        self.assertEqual(resultado["localidades_revisadas"], 1)
        self.assertEqual(resultado["localidades_total"], 2)

    def test_localidade_adicionada_e_manifestacao_explicita(self):
        municipio = MunicipioRevisaoItem(
            cod_municipio=1,
            localidades=[
                LocalidadeRevisaoItem(
                    cod_municipio=1,
                    origem_registro="adicionado_tecnico",
                    acao_sugerida="adicionar",
                )
            ],
        )

        resultado = calcular_completude([municipio], [])

        self.assertTrue(resultado["possui_manifestacao"])
        self.assertEqual(resultado["localidades_revisadas"], 1)

    def test_decisoes_de_outra_revisao_nao_completam_a_atual(self):
        municipio = MunicipioRevisaoItem(
            cod_municipio=1,
            acao_sugerida="manter",
            localidades=[
                LocalidadeRevisaoItem(
                    cod_municipio=1,
                    cod_comunidade_rural=2,
                    acao_sugerida="manter",
                )
            ],
            obras_saneamento=[
                ObraSaneamentoRevisaoItem(
                    id_obra="3",
                    cod_municipio=1,
                    relacao_instrumento="sem_conflito_aparente",
                )
            ],
        )

        resultado = calcular_completude([municipio], [])

        self.assertTrue(resultado["completa"])
        self.assertEqual(resultado["total_pendencias"], 0)

    def test_municipio_localidade_obra_e_publico_pendentes_sao_contados(self):
        municipio = MunicipioRevisaoItem(
            cod_municipio=1,
            localidades=[
                LocalidadeRevisaoItem(
                    cod_municipio=1,
                    cod_comunidade_rural=2,
                )
            ],
            obras_saneamento=[
                ObraSaneamentoRevisaoItem(
                    id_obra="3",
                    cod_municipio=1,
                )
            ],
        )

        resultado = calcular_completude([municipio], [])

        self.assertFalse(resultado["completa"])
        self.assertEqual(resultado["municipios_pendentes"], 1)
        self.assertEqual(resultado["localidades_pendentes"], 1)
        self.assertEqual(resultado["obras_pendentes"], 1)
        self.assertEqual(resultado["total_pendencias"], 3)


if __name__ == "__main__":
    unittest.main()
