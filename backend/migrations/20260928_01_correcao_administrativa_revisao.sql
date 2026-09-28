BEGIN;

CREATE TABLE IF NOT EXISTS painel_dsr.tb_auditoria_correcao_revisao (
    id_auditoria BIGSERIAL PRIMARY KEY,
    id_revisao INTEGER NOT NULL
        REFERENCES painel_dsr.tb_revisao_instrumento(id_revisao),
    id_usuario_admin INTEGER NOT NULL
        REFERENCES painel_dsr.tb_usuario(id_usuario),
    alterado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    secao VARCHAR(40) NOT NULL,
    id_registro BIGINT NOT NULL,
    campo VARCHAR(80) NOT NULL,
    valor_anterior JSONB,
    valor_novo JSONB
);

CREATE INDEX IF NOT EXISTS ix_auditoria_correcao_revisao
    ON painel_dsr.tb_auditoria_correcao_revisao (id_revisao, alterado_em DESC);

-- A exceção é local à transação e vinculada a uma única revisão.
-- INSERT e DELETE permanecem bloqueados para revisões enviadas.
CREATE OR REPLACE FUNCTION painel_dsr.fn_bloquear_alteracao_revisao_enviada()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_id_revisao INTEGER;
    v_status VARCHAR(30);
    v_aplicado_em TIMESTAMP;
    v_edicao_admin INTEGER;
BEGIN
    v_id_revisao := CASE
        WHEN TG_OP = 'DELETE' THEN OLD.id_revisao
        ELSE NEW.id_revisao
    END;

    SELECT status, aplicado_em
    INTO v_status, v_aplicado_em
    FROM painel_dsr.tb_revisao_instrumento
    WHERE id_revisao = v_id_revisao;

    v_edicao_admin := NULLIF(
        current_setting('painel_dsr.edicao_admin_revisao', true), ''
    )::INTEGER;

    IF v_status = 'enviado'
       AND NOT (
           TG_OP = 'UPDATE'
           AND OLD.id_revisao = NEW.id_revisao
           AND v_aplicado_em IS NULL
           AND v_edicao_admin = v_id_revisao
       )
    THEN
        RAISE EXCEPTION
            'A revisão % já foi enviada e seus registros não podem ser alterados.',
            v_id_revisao;
    END IF;

    RETURN CASE
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$function$;

CREATE OR REPLACE FUNCTION painel_dsr.fn_proteger_revisao_principal()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    v_edicao_admin INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'enviado' THEN
            RAISE EXCEPTION
                'A revisão % já foi enviada e não pode ser excluída.',
                OLD.id_revisao;
        END IF;
        RETURN OLD;
    END IF;

    IF OLD.status = 'enviado' THEN
        v_edicao_admin := NULLIF(
            current_setting('painel_dsr.edicao_admin_revisao', true), ''
        )::INTEGER;

        IF v_edicao_admin = OLD.id_revisao
           AND OLD.aplicado_em IS NULL
           AND NEW.id_revisao = OLD.id_revisao
           AND NEW.status = OLD.status
           AND NEW.identificador_busca IS NOT DISTINCT FROM OLD.identificador_busca
           AND NEW.tipo_instrumento IS NOT DISTINCT FROM OLD.tipo_instrumento
           AND NEW.nr_instrumento IS NOT DISTINCT FROM OLD.nr_instrumento
           AND NEW.nr_proposta IS NOT DISTINCT FROM OLD.nr_proposta
           AND NEW.nr_ted IS NOT DISTINCT FROM OLD.nr_ted
           AND NEW.id_usuario IS NOT DISTINCT FROM OLD.id_usuario
           AND NEW.criado_em IS NOT DISTINCT FROM OLD.criado_em
           AND NEW.enviado_em IS NOT DISTINCT FROM OLD.enviado_em
           AND NEW.id_revisao_anterior IS NOT DISTINCT FROM OLD.id_revisao_anterior
           AND NEW.base_referencia_em IS NOT DISTINCT FROM OLD.base_referencia_em
           AND NEW.validade_dias IS NOT DISTINCT FROM OLD.validade_dias
           AND NEW.aplicado_em IS NOT DISTINCT FROM OLD.aplicado_em
           AND NEW.id_execucao_atualizacao IS NOT DISTINCT FROM OLD.id_execucao_atualizacao
        THEN
            RETURN NEW;
        END IF;

        IF NEW.status <> 'enviado'
           OR NEW.identificador_busca IS DISTINCT FROM OLD.identificador_busca
           OR NEW.tipo_instrumento IS DISTINCT FROM OLD.tipo_instrumento
           OR NEW.nr_instrumento IS DISTINCT FROM OLD.nr_instrumento
           OR NEW.nr_proposta IS DISTINCT FROM OLD.nr_proposta
           OR NEW.nr_ted IS DISTINCT FROM OLD.nr_ted
           OR NEW.id_usuario IS DISTINCT FROM OLD.id_usuario
           OR NEW.observacao_geral IS DISTINCT FROM OLD.observacao_geral
           OR NEW.criado_em IS DISTINCT FROM OLD.criado_em
           OR NEW.enviado_em IS DISTINCT FROM OLD.enviado_em
           OR NEW.id_revisao_anterior IS DISTINCT FROM OLD.id_revisao_anterior
           OR NEW.base_referencia_em IS DISTINCT FROM OLD.base_referencia_em
           OR NEW.validade_dias IS DISTINCT FROM OLD.validade_dias
           OR NEW.atualizado_em IS DISTINCT FROM OLD.atualizado_em
        THEN
            RAISE EXCEPTION
                'A revisão % já foi enviada e seus dados não podem ser alterados.',
                OLD.id_revisao;
        END IF;

        IF OLD.aplicado_em IS NOT NULL
           AND (
               NEW.aplicado_em IS DISTINCT FROM OLD.aplicado_em
               OR NEW.id_execucao_atualizacao IS DISTINCT FROM OLD.id_execucao_atualizacao
           )
        THEN
            RAISE EXCEPTION
                'A aplicação da revisão % já foi registrada e não pode ser alterada.',
                OLD.id_revisao;
        END IF;

        IF OLD.aplicado_em IS NULL
           AND NEW.aplicado_em IS NULL
           AND NEW.id_execucao_atualizacao IS DISTINCT FROM OLD.id_execucao_atualizacao
        THEN
            RAISE EXCEPTION
                'A execução de atualização só pode ser registrada junto com a aplicação da revisão %.',
                OLD.id_revisao;
        END IF;

        IF OLD.aplicado_em IS NULL
           AND NEW.aplicado_em IS NOT NULL
           AND NEW.aplicado_em < OLD.enviado_em
        THEN
            RAISE EXCEPTION
                'A data de aplicação não pode ser anterior ao envio da revisão %.',
                OLD.id_revisao;
        END IF;

        RETURN NEW;
    END IF;

    IF NEW.status = 'enviado' THEN
        NEW.enviado_em := COALESCE(NEW.enviado_em, NOW());
    ELSE
        NEW.enviado_em := NULL;
    END IF;

    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_bloquear_coordenada_revisao_enviada
    ON painel_dsr.tb_revisao_instrumento_coordenada;
CREATE TRIGGER trg_bloquear_coordenada_revisao_enviada
BEFORE INSERT OR DELETE OR UPDATE
ON painel_dsr.tb_revisao_instrumento_coordenada
FOR EACH ROW
EXECUTE FUNCTION painel_dsr.fn_bloquear_alteracao_revisao_enviada();

COMMIT;
