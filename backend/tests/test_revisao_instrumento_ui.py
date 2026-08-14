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


if __name__ == "__main__":
    unittest.main()
