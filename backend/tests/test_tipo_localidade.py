"""Regressões da classificação opcional, sem dependência de banco ou pytest."""
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from app.api.revisao_instrumento import calcular_completude, _persistir_municipio_revisao
from app.schemas.revisao_instrumento import (
    LocalidadeRevisaoItem, LocalidadeRevisaoAlteracao, MunicipioRevisaoItem,
    RevisaoInstrumentoCreate,
)
from app.services.aplicacao_revisoes import _aplicar_localidade, _reverter_detalhe, _conflitos_estado_atual
from app.services.devolutivas_revisao import _clonar_filhos


def resultado(valor=None, linhas=None):
    obj = MagicMock()
    obj.scalar_one_or_none.return_value = valor
    obj.mappings.return_value.one_or_none.return_value = valor
    obj.mappings.return_value.all.return_value = linhas or []
    return obj


class PendenciasTipoLocalidade(unittest.TestCase):
    def completude(self, acao='manter', tipo=None, origem='base_atual', acao_municipio='manter'):
        return calcular_completude([MunicipioRevisaoItem(
            cod_municipio=1, acao_sugerida=acao_municipio,
            localidades=[LocalidadeRevisaoItem(acao_sugerida=acao, tipo_localidade=tipo, origem_registro=origem)],
        )], [])

    def test_classificacao_nao_desfaz_conferencia(self):
        c = self.completude()
        self.assertEqual(c['localidades_revisadas'], 1)
        self.assertEqual(c['localidades_pendentes'], 1)
        self.assertFalse(c['completa'])

    def test_pendencias_nao_duplicam_localidade(self):
        self.assertEqual(self.completude(acao=None)['localidades_pendentes'], 1)

    def test_classificada_com_acao_completa(self):
        self.assertTrue(self.completude(tipo='Quilombolas')['completa'])

    def test_classificada_sem_acao_continua_pendente(self):
        c = self.completude(acao=None, tipo='Quilombolas')
        self.assertEqual(c['localidades_revisadas'], 0)
        self.assertEqual(c['localidades_pendentes'], 1)

    def test_removida_nao_exige_classificacao(self):
        self.assertEqual(self.completude(acao='remover')['localidades_pendentes'], 0)
        self.assertEqual(self.completude(acao_municipio='remover')['localidades_sem_classificacao'], 0)

    def test_manual_sem_tipo_pendente(self):
        self.assertEqual(self.completude(acao='adicionar', origem='adicionado_tecnico')['localidades_pendentes'], 1)

    def test_envio_aceita_tipo_vazio(self):
        r = RevisaoInstrumentoCreate(status='enviado', instrumento={
            'tipo_instrumento': 'contrato_repasse', 'identificador_busca': '1',
        }, municipios=[{'cod_municipio': 1, 'localidades': [{'acao_sugerida': 'manter', 'tipo_localidade': None}]}])
        self.assertIsNone(r.municipios[0].localidades[0].tipo_localidade)


class PersistenciaTipoLocalidade(unittest.IsolatedAsyncioTestCase):
    async def test_payload_omitido_e_null_explicito(self):
        for campos in ({}, {'tipo_localidade': None}, {'tipo_localidade': 'Ribeirinhos'}):
            with self.subTest(campos=campos):
                tipo_retornado = campos.get('tipo_localidade', 'Quilombolas')
                db = MagicMock(info={})
                db.execute = AsyncMock(side_effect=[
                    resultado({'id_revisao_localidade': 7, 'tipo_localidade': tipo_retornado}),
                    resultado(),
                    resultado(linhas=[{'id_revisao_localidade': 7, 'conferido_em': None, 'valido_ate': None}]),
                ])
                item = LocalidadeRevisaoAlteracao(id_revisao_localidade=7, cod_comunidade_rural=1,
                    acao_sugerida='manter', **campos)
                with patch('app.api.revisao_instrumento._buscar_datas_agregadas', new=AsyncMock(return_value={})):
                    salvo = await _persistir_municipio_revisao(db, 1, 1, None, [item], [])
                parametros = db.execute.call_args_list[0].args[1]
                self.assertEqual(parametros['tipo_localidade_informado'], 'tipo_localidade' in campos)
                self.assertEqual(salvo.localidades[0].tipo_localidade, tipo_retornado)
                self.assertEqual(salvo.localidades[0].acao_sugerida, 'manter')

    async def aplicar(self, acao='manter', **campos):
        db = MagicMock()
        db.execute = AsyncMock(side_effect=[resultado(10), resultado('Quilombolas'), resultado()])
        if acao == 'remover':
            db.execute.side_effect = [resultado(10), resultado(), resultado('Quilombolas')]
        detalhe = await _aplicar_localidade(db, {'tipo_instrumento': 'contrato_repasse', 'nr_proposta': '1'}, {
            'acao_sugerida': acao, 'cod_comunidade_rural': 1, 'cod_municipio': 1, **campos,
        })
        return db, detalhe

    async def test_manter_altera_so_tipo(self):
        db, detalhe = await self.aplicar(tipo_localidade='Ribeirinhos')
        self.assertEqual(detalhe['valores_anteriores']['tipo_localidade'], 'Quilombolas')
        self.assertEqual(detalhe['valores_novos']['tipo_localidade'], 'Ribeirinhos')
        self.assertEqual(detalhe['valores_novos']['qtde_familias_ben'], 10)
        self.assertNotIn('qtde_familias_ben =', str(db.execute.call_args_list[-1].args[0]))

    async def test_aplicacao_limpa_tipo(self):
        _, detalhe = await self.aplicar(tipo_localidade=None)
        self.assertIsNone(detalhe['valores_novos']['tipo_localidade'])

    async def test_aplicacao_campo_omitido_preserva_tipo(self):
        db, detalhe = await self.aplicar()
        self.assertEqual(detalhe['valores_novos']['tipo_localidade'], 'Quilombolas')
        self.assertEqual(db.execute.await_count, 2)

    async def test_remover_preserva_cadastro_territorial(self):
        db, detalhe = await self.aplicar(acao='remover', tipo_localidade=None)
        self.assertEqual(detalhe['valores_novos']['tipo_localidade'], 'Quilombolas')
        self.assertFalse(any('UPDATE territorio' in str(call.args[0]) for call in db.execute.call_args_list))

    async def test_cancelamento_restaura_classificacao(self):
        _, detalhe = await self.aplicar(tipo_localidade=None)
        db = MagicMock(execute=AsyncMock())
        await _reverter_detalhe(db, {'tipo_instrumento': 'contrato_repasse'}, detalhe)
        self.assertEqual(db.execute.call_args_list[-1].args[1]['tipo'], 'Quilombolas')

    async def test_cancelamento_detecta_edicao_posterior(self):
        _, detalhe = await self.aplicar(tipo_localidade=None)
        db = MagicMock(execute=AsyncMock(side_effect=[
            resultado({'qtde_familias_ben': 10}), resultado('Ribeirinhos'),
        ]))
        conflitos = await _conflitos_estado_atual(db, {'tipo_instrumento': 'contrato_repasse'}, [detalhe])
        self.assertEqual(len(conflitos), 1)
        self.assertIn('classificação', conflitos[0])

    async def test_devolucao_clona_classificacao(self):
        db = MagicMock(execute=AsyncMock())
        await _clonar_filhos(db, 1, 2)
        sql = str(db.execute.call_args_list[1].args[0])
        self.assertEqual(sql.count('tipo_localidade'), 2)


if __name__ == '__main__':
    unittest.main()
