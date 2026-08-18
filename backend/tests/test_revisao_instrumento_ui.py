import unittest
from pathlib import Path


ARQUIVO = (
    Path(__file__).resolve().parents[2]
    / "frontend"
    / "src"
    / "pages"
    / "revisao-instrumento"
    / "RevisaoInstrumento.jsx"
)
ARQUIVO_VISUALIZACAO = ARQUIVO.with_name("VisualizarRevisao.jsx")


class RevisaoInstrumentoRenderizacaoTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.codigo = ARQUIVO.read_text(encoding="utf-8")

    def test_localidade_incluida_exibe_status_apenas_na_coluna_de_revisao(self):
        self.assertEqual(self.codigo.count("Incluída nesta revisão"), 1)

    def test_municipio_incluido_exibe_status_apenas_no_cabecalho(self):
        self.assertEqual(self.codigo.count("Incluído nesta revisão"), 1)
        self.assertNotIn("Situação na revisão", self.codigo)

    def test_municipio_da_base_preserva_acoes_manter_e_remover(self):
        self.assertIn("{ value: 'manter', label: 'Manter'", self.codigo)
        self.assertIn("{ value: 'remover', label: 'Remover'", self.codigo)
        self.assertIn("municipio.origem_registro !== 'adicionado_tecnico'", self.codigo)

    def test_salvamento_geral_envia_municipios_no_mesmo_payload(self):
        self.assertIn("municipios:", self.codigo)
        self.assertIn(".filter(municipioTemAlteracoes)", self.codigo)
        self.assertNotIn("salvarPendenciasMunicipais", self.codigo)

    def test_texto_digitado_nao_equivale_a_municipio_selecionado(self):
        self.assertIn("setMunicipioOficialSelecionado(null)", self.codigo)
        self.assertIn(
            "municipioOficialSelecionado?.cod_municipio !== codMunicipio",
            self.codigo,
        )

    def test_erro_de_selecao_fica_localizado_no_formulario(self):
        self.assertIn("setErroMunicipioOficial(", self.codigo)
        self.assertIn('id="erro-municipio-oficial"', self.codigo)
        self.assertIn('aria-describedby={erroMunicipioOficial', self.codigo)

    def test_formulario_aberto_nao_entra_no_payload_antes_de_adicionar(self):
        self.assertIn("const [municipios, setMunicipios] = useState([])", self.codigo)
        self.assertIn("const montarPayloadRevisao", self.codigo)
        self.assertIn("municipios\n      .filter(municipioTemAlteracoes)", self.codigo)

    def test_status_exibe_id_real_e_oferece_visualizacao(self):
        self.assertIn("Revisão nº ${revisaoPendente.id_revisao}", self.codigo)
        self.assertIn("Visualizar revisão nº", self.codigo)
        self.assertIn("revisao_pendente_aplicacao.id_revisao", self.codigo)


class VisualizacaoRevisaoSomenteLeituraTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.codigo = ARQUIVO_VISUALIZACAO.read_text(encoding="utf-8")

    def test_ficha_nao_chama_endpoints_de_persistencia(self):
        self.assertIn("buscarRevisaoEnviada", self.codigo)
        self.assertNotIn("salvarRevisao", self.codigo)
        self.assertNotIn("salvarMunicipio", self.codigo)

    def test_ficha_nao_renderiza_campos_editaveis(self):
        self.assertNotIn("<input", self.codigo)
        self.assertNotIn("<textarea", self.codigo)
        self.assertNotIn("<select", self.codigo)

    def test_ficha_identifica_revisao_especifica(self):
        self.assertIn("Revisão nº {revisao.id_revisao}", self.codigo)
        self.assertIn("idRevisao", self.codigo)


if __name__ == "__main__":
    unittest.main()
