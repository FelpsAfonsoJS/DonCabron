CREATE TABLE IF NOT EXISTS requisicoes_pedido (
    chave_idempotencia CHAR(36) NOT NULL PRIMARY KEY,
    comanda_id INT NOT NULL,
    pedido_id INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_requisicoes_pedido_comanda (comanda_id),
    KEY idx_requisicoes_pedido_pedido (pedido_id),

    CONSTRAINT fk_requisicoes_pedido_comanda
        FOREIGN KEY (comanda_id) REFERENCES comandas(id),
    CONSTRAINT fk_requisicoes_pedido_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;