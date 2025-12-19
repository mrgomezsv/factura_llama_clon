
const axios = require('axios');

// Case from log 9F6FFBB4
const item = {
    cantidad: 1,
    precioUni: 4.4159,
    ventaGravada: 4.4159,
    ivaItem: 0.57 // sent
};

// Possible MH Logic Variations
function check(scenario, calcFn) {
    const calculated = calcFn();
    console.log(`[${scenario}] Calc: ${calculated}, Sent: ${item.ivaItem}, Diff: ${Math.abs(calculated - item.ivaItem)}`);
}

check("Round(Base * 0.13, 2)", () => parseFloat((item.ventaGravada * 0.13).toFixed(2)));
check("Trunc(Base * 0.13, 2)", () => Math.floor(item.ventaGravada * 0.13 * 100) / 100);
check("Raw(Base * 0.13)", () => item.ventaGravada * 0.13);

// Maybe MH expects IVA to be calculated from the "Net Total" of the document and then prorated? No, this is item level error.

// Maybe the issue is that 4.4159 comes from a Gross Price of 4.99?
// 4.99 / 1.13 = 4.415929...
// If we send 4.4159, and add 0.57 ==> 4.9859.
// If we started with 4.99.
// 4.99 - 4.4159 = 0.5741.
// 0.57 is correct.

// What if MH re-calculates VentaGravada from Cantidad * Precio?
// 1 * 4.4159 = 4.4159.
// 4.4159 * 0.13 = 0.574067.
// 0.57.

// Is it possible MH expects us to send MORE decimals in ivaItem?
// Schema usually says 2 decimals for monetary.

// Let's try sending ivaItem with full precision?
