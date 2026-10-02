const LIMITE_INT_ASSINADO = 2147483647;

function inteiroPositivo(valor) {
  return (
    typeof valor === "number" &&
    Number.isSafeInteger(valor) &&
    valor > 0 &&
    valor <= LIMITE_INT_ASSINADO
  );
}

module.exports = { inteiroPositivo };