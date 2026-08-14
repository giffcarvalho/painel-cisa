BEGIN;

DO $migration$
DECLARE
    conflitos TEXT;
BEGIN
    SELECT STRING_AGG(
        FORMAT(
            '%s/%s (revisões: %s)',
            tipo_instrumento,
            identidade_instrumento,
            ARRAY_TO_STRING(ids_revisao, ', ')
        ),
        '; '
        ORDER BY tipo_instrumento, identidade_instrumento
    )
    INTO conflitos
    FROM (
        SELECT
            tipo_instrumento,
            COALESCE(
                NULLIF(BTRIM(nr_instrumento), ''),
                nr_ted::TEXT
            ) AS identidade_instrumento,
            ARRAY_AGG(id_revisao ORDER BY atualizado_em DESC, id_revisao DESC)
                AS ids_revisao
        FROM painel_dsr.tb_revisao_instrumento
        WHERE status = 'rascunho'
        GROUP BY
            tipo_instrumento,
            COALESCE(
                NULLIF(BTRIM(nr_instrumento), ''),
                nr_ted::TEXT
            )
        HAVING COUNT(*) > 1
    ) AS duplicidades;

    IF conflitos IS NOT NULL THEN
        RAISE EXCEPTION
            'Não foi possível criar a unicidade global de rascunhos. Saneamento manual necessário: %',
            conflitos;
    END IF;
END
$migration$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_revisao_rascunho_instrumento
    ON painel_dsr.tb_revisao_instrumento (
        tipo_instrumento,
        COALESCE(
            NULLIF(BTRIM(nr_instrumento), ''),
            nr_ted::TEXT
        )
    )
    WHERE status = 'rascunho';

DROP INDEX IF EXISTS
    painel_dsr.uq_revisao_rascunho_usuario_instrumento;

COMMIT;
