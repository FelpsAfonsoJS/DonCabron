-- Requer MySQL 8.0.16 ou superior para que CHECK seja aplicado.
-- Antes de executar, corrija linhas que violem as regras abaixo.

ALTER TABLE mesas
    ADD CONSTRAINT chk_mesas_numero_positivo CHECK (numero > 0),
    ADD CONSTRAINT chk_mesas_capacidade_positiva CHECK (capacidade > 0);

ALTER TABLE estoque
    MODIFY quantidade INT NOT NULL DEFAULT 0,
    ADD CONSTRAINT uq_estoque_produto UNIQUE (produto_id),
    ADD CONSTRAINT chk_estoque_quantidade_nao_negativa CHECK (quantidade >= 0);

ALTER TABLE itens_comanda
    ADD CONSTRAINT chk_itens_comanda_quantidade_positiva CHECK (quantidade > 0),
    ADD CONSTRAINT chk_itens_comanda_quantidade_paga CHECK (
        quantidade_paga >= 0 AND quantidade_paga <= quantidade
    );

ALTER TABLE itens_pagamento
    ADD CONSTRAINT chk_itens_pagamento_quantidade_nao_negativa CHECK (quantidade >= 0),
    ADD CONSTRAINT chk_itens_pagamento_valor_nao_negativo CHECK (valor_pago >= 0);