ALTER TABLE comandas
    ADD COLUMN garcom_id INT NULL AFTER mesa_id,
    ADD CONSTRAINT fk_comandas_garcom
        FOREIGN KEY (garcom_id) REFERENCES usuarios(id);
