
const axios = require('axios');

// Simulation of the exact failing case
const item = {
    cantidad: 1,
    precioUni: 4.4159,
    ventaGravada_Rounded: 4.42,
    ventaGravada_Precise: 4.4159,
    ivaItem: 0.57
};

// Check MH Logic
function checkIVA(ventaGravada, providedIVA) {
    const calculatedIVA = ventaGravada * 0.13;
    const roundedIVA = parseFloat(calculatedIVA.toFixed(2));
    console.log(`Base: ${ventaGravada}, Calc: ${calculatedIVA}, Rounded: ${roundedIVA}, Provided: ${providedIVA}`);
    console.log(`Match? ${Math.abs(roundedIVA - providedIVA) < 0.001}`);
}

console.log("Checking with Rounded Body (Current Logic):");
checkIVA(item.ventaGravada_Rounded, item.ivaItem);

console.log("Checking with Precise Body (Proposed Fix):");
checkIVA(item.ventaGravada_Precise, item.ivaItem);
