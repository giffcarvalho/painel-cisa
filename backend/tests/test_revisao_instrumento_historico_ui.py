import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
COMPONENTE = ROOT / "frontend" / "src" / "components" / "revisao-instrumento" / "HistoricoRevisoes.jsx"
MENU = ROOT / "frontend" / "src" / "components" / "auth" / "AuthMenu.jsx"
ROTAS = ROOT / "frontend" / "src" / "router.jsx"
API = ROOT / "frontend" / "src" / "api" / "revisaoInstrumento.js"


class HistoricoRevisoesUiTest(unittest.TestCase):
    def test_menu_e_rotas_dos_dois_historicos(self):
        menu = MENU.read_text(encoding="utf-8")
        rotas = ROTAS.read_text(encoding="utf-8")
        self.assertIn("Meu Painel", menu)
        self.assertIn("navigate('/meu-painel')", menu)
        self.assertIn("path: 'minhas-revisoes'", rotas)
        self.assertIn("path: 'meu-painel'", rotas)
        self.assertIn("path: 'revisao-instrumento/:numeroInstrumento/revisoes'", rotas)

    def test_listagem_reutiliza_visualizacao_individual_e_nao_edita(self):
        pagina = COMPONENTE.read_text(encoding="utf-8")
        self.assertIn("/revisoes/${item.id_revisao}", pagina)
        self.assertIn("Visualizar revisão", pagina)
        self.assertNotIn("salvarRevisao", pagina)
        self.assertNotIn("salvarMunicipio", pagina)

    def test_frontend_consulta_listagens_filtradas_no_backend(self):
        api = API.read_text(encoding="utf-8")
        self.assertIn("/revisao-instrumento/revisoes/minhas", api)
        self.assertIn("/revisao-instrumento/instrumentos/${encodeURIComponent(identificador)}/revisoes", api)


if __name__ == "__main__":
    unittest.main()
