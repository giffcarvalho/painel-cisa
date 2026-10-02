BEGIN;

CREATE TABLE IF NOT EXISTS painel_dsr.tb_devolutiva_revisao (
    id_devolutiva BIGSERIAL PRIMARY KEY,
    id_revisao_devolvida INTEGER NOT NULL,
    id_usuario_admin INTEGER NOT NULL,
    comentario_admin TEXT NOT NULL,
    devolvido_em TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(30) NOT NULL DEFAULT 'aguardando_correcao',
    id_revisao_reenvio INTEGER,
    id_usuario_monitor_resposta INTEGER,
    comentario_monitor TEXT,
    reenviado_em TIMESTAMP,
    CONSTRAINT fk_devolutiva_revisao_devolvida FOREIGN KEY (id_revisao_devolvida)
        REFERENCES painel_dsr.tb_revisao_instrumento (id_revisao),
    CONSTRAINT fk_devolutiva_usuario_admin FOREIGN KEY (id_usuario_admin)
        REFERENCES painel_dsr.tb_usuario (id_usuario),
    CONSTRAINT fk_devolutiva_revisao_reenvio FOREIGN KEY (id_revisao_reenvio)
        REFERENCES painel_dsr.tb_revisao_instrumento (id_revisao),
    CONSTRAINT fk_devolutiva_usuario_monitor_resposta FOREIGN KEY (id_usuario_monitor_resposta)
        REFERENCES painel_dsr.tb_usuario (id_usuario),
    CONSTRAINT chk_devolutiva_comentario_admin CHECK (NULLIF(BTRIM(comentario_admin), '') IS NOT NULL),
    CONSTRAINT chk_devolutiva_status CHECK (status IN ('aguardando_correcao', 'reenviada')),
    CONSTRAINT chk_devolutiva_reenvio CHECK (
        (status = 'aguardando_correcao' AND id_revisao_reenvio IS NULL
         AND id_usuario_monitor_resposta IS NULL AND comentario_monitor IS NULL AND reenviado_em IS NULL)
        OR
        (status = 'reenviada' AND id_revisao_reenvio IS NOT NULL
         AND id_usuario_monitor_resposta IS NOT NULL
         AND NULLIF(BTRIM(comentario_monitor), '') IS NOT NULL
         AND reenviado_em IS NOT NULL AND reenviado_em >= devolvido_em)
    ),
    CONSTRAINT chk_devolutiva_revisoes_distintas CHECK (
        id_revisao_reenvio IS NULL OR id_revisao_reenvio <> id_revisao_devolvida
    ),
    CONSTRAINT uq_devolutiva_revisao_devolvida UNIQUE (id_revisao_devolvida),
    CONSTRAINT uq_devolutiva_revisao_reenvio UNIQUE (id_revisao_reenvio)
);

CREATE INDEX IF NOT EXISTS ix_devolutiva_revisao_status
    ON painel_dsr.tb_devolutiva_revisao (status, devolvido_em DESC);
CREATE INDEX IF NOT EXISTS ix_devolutiva_usuario_admin
    ON painel_dsr.tb_devolutiva_revisao (id_usuario_admin, devolvido_em DESC);
CREATE INDEX IF NOT EXISTS ix_devolutiva_usuario_monitor
    ON painel_dsr.tb_devolutiva_revisao (id_usuario_monitor_resposta, reenviado_em DESC)
    WHERE id_usuario_monitor_resposta IS NOT NULL;

COMMENT ON TABLE painel_dsr.tb_devolutiva_revisao IS 'Registra cada ciclo auditável de devolução e reenvio de uma revisão.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.id_devolutiva IS 'Identificador único do ciclo de devolução.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.id_revisao_devolvida IS 'Revisão enviada e imutável devolvida pelo administrador.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.id_usuario_admin IS 'Administrador que realizou a devolução.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.comentario_admin IS 'Orientação obrigatória do administrador ao monitor.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.devolvido_em IS 'Data e hora da devolução.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.status IS 'Estado do ciclo: aguardando_correcao ou reenviada.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.id_revisao_reenvio IS 'Nova versão enviada em resposta à devolução.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.id_usuario_monitor_resposta IS 'Monitor que reenviou a versão corrigida.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.comentario_monitor IS 'Descrição obrigatória das correções realizadas.';
COMMENT ON COLUMN painel_dsr.tb_devolutiva_revisao.reenviado_em IS 'Data e hora do reenvio corrigido.';
COMMENT ON CONSTRAINT fk_devolutiva_revisao_devolvida ON painel_dsr.tb_devolutiva_revisao IS 'Vincula o ciclo à versão originalmente devolvida.';
COMMENT ON CONSTRAINT fk_devolutiva_usuario_admin ON painel_dsr.tb_devolutiva_revisao IS 'Vincula a devolução ao administrador responsável.';
COMMENT ON CONSTRAINT fk_devolutiva_revisao_reenvio ON painel_dsr.tb_devolutiva_revisao IS 'Vincula o ciclo à versão corrigida reenviada.';
COMMENT ON CONSTRAINT fk_devolutiva_usuario_monitor_resposta ON painel_dsr.tb_devolutiva_revisao IS 'Vincula o reenvio ao monitor responsável.';
COMMENT ON CONSTRAINT chk_devolutiva_comentario_admin ON painel_dsr.tb_devolutiva_revisao IS 'Impede devolução sem comentário administrativo.';
COMMENT ON CONSTRAINT chk_devolutiva_status ON painel_dsr.tb_devolutiva_revisao IS 'Restringe os estados válidos do ciclo.';
COMMENT ON CONSTRAINT chk_devolutiva_reenvio ON painel_dsr.tb_devolutiva_revisao IS 'Mantém consistentes os dados obrigatórios de cada estado.';
COMMENT ON CONSTRAINT chk_devolutiva_revisoes_distintas ON painel_dsr.tb_devolutiva_revisao IS 'Impede usar a revisão devolvida como seu próprio reenvio.';
COMMENT ON CONSTRAINT uq_devolutiva_revisao_devolvida ON painel_dsr.tb_devolutiva_revisao IS 'Permite somente uma devolução por versão enviada.';
COMMENT ON CONSTRAINT uq_devolutiva_revisao_reenvio ON painel_dsr.tb_devolutiva_revisao IS 'Permite vincular cada reenvio a um único ciclo.';
COMMENT ON INDEX painel_dsr.ix_devolutiva_revisao_status IS 'Acelera consultas de devolutivas por estado e data.';
COMMENT ON INDEX painel_dsr.ix_devolutiva_usuario_admin IS 'Acelera o histórico de devoluções por administrador.';
COMMENT ON INDEX painel_dsr.ix_devolutiva_usuario_monitor IS 'Acelera consultas de respostas por monitor.';

COMMIT;
